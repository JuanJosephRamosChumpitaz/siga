import { useEffect, useState } from 'react';
import {
  FileInput,
  Layers,
  Plus,
  Trash2,
  Printer,
  ScanBarcode,
  AlertCircle,
  CheckCircle2,
  Eye,
  X,
  CalendarClock,
} from 'lucide-react';
import { entradaService } from '../services/entradaService';
import { catalogoService } from '../services/catalogoService';
import { usePaginacion } from '../hooks/usepaginacion';
import Paginacion from '../components/ui/paginacion';

const CABECERA_INICIAL = {
  numeroNea: '',
  fechaEmision: new Date().toISOString().slice(0, 10),
  idProveedor: '',
  procedencia: '',
  destino: 'IESTP "CAÑETE"',
  referencia: '',
  modalidad: '',
  observaciones: '',
};

function formatearFecha(iso) {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function obtenerEstadoVencimiento(lote) {
  if (!lote.perecible || !lote.fechaVencimiento) {
    return { texto: 'No perecible', clase: 'bg-slate-100 text-slate-600' };
  }
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(`${lote.fechaVencimiento}T00:00:00`);
  const diffDias = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24));

  if (diffDias < 0) {
    return { texto: `Vencido (${Math.abs(diffDias)}d)`, clase: 'bg-red-100 text-red-800' };
  }
  if (diffDias <= 30) {
    return { texto: `Vence en ${diffDias}d`, clase: 'bg-amber-100 text-amber-800' };
  }
  return { texto: 'Vigente', clase: 'bg-emerald-100 text-emerald-800' };
}

export default function MovimientosView() {
  const [tab, setTab] = useState('entradas');
  const [notas, setNotas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Formulario NEA
  const [cabecera, setCabecera] = useState(CABECERA_INICIAL);
  const [items, setItems] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [codigoEscaner, setCodigoEscaner] = useState('');

  // Filtros de Lotes
  const [soloConStock, setSoloConStock] = useState(true);
  const [soloPorVencer, setSoloPorVencer] = useState(false);

  // Modal de visualización / impresión de NEA
  const [neaActiva, setNeaActiva] = useState(null);

  const cargarTodo = async () => {
    setCargando(true);
    setError('');
    try {
      const [notasData, lotesData, prodData, provData] = await Promise.all([
        entradaService.listarNotasEntrada(),
        entradaService.listarLotes(false),
        catalogoService.listarProductos(true),
        catalogoService.listarProveedores(true),
      ]);
      setNotas(notasData);
      setLotes(lotesData);
      setProductos(prodData);
      setProveedores(provData);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el módulo de entradas y lotes.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const notificar = (texto) => {
    setMensaje(texto);
    setError('');
    setTimeout(() => setMensaje(''), 4500);
  };

  const agregarProductoALista = (prod) => {
    if (!prod) return;
    setItems((prev) => {
      const existe = prev.find((i) => i.idProducto === prod.idProducto);
      if (existe) {
        return prev.map((i) =>
            i.idProducto === prod.idProducto
                ? { ...i, cantidad: String((Number(i.cantidad || 0) + 1).toFixed(2)) }
                : i
        );
      }
      return [
        ...prev,
        {
          idProducto: prod.idProducto,
          codigoInterno: prod.codigoInterno,
          nombre: prod.nombre,
          unidad: prod.abreviaturaUnidad || prod.nombreUnidad,
          perecible: Boolean(prod.perecible),
          cantidad: '1.00',
          costoUnitario: String(prod.precioUnidad ?? '0.00'),
          fechaVencimiento: '',
        },
      ];
    });
  };

  const handleAgregarManual = () => {
    if (!productoSeleccionado) return;
    const prod = productos.find((p) => p.idProducto === Number(productoSeleccionado));
    agregarProductoALista(prod);
    setProductoSeleccionado('');
  };

  const handleEscaner = async (e) => {
    e.preventDefault();
    if (!codigoEscaner.trim()) return;
    setError('');
    try {
      const prod = await catalogoService.buscarProductoPorCodigo(codigoEscaner.trim());
      agregarProductoALista(prod);
      setCodigoEscaner('');
    } catch (err) {
      setError(err.response?.data?.message || 'Código no encontrado en el catálogo.');
    }
  };

  const actualizarItem = (idProducto, campo, valor) => {
    setItems((prev) =>
        prev.map((i) => (i.idProducto === idProducto ? { ...i, [campo]: valor } : i))
    );
  };

  const quitarItem = (idProducto) => {
    setItems((prev) => prev.filter((i) => i.idProducto !== idProducto));
  };

  const handleCambioProveedor = (idProv) => {
    const prov = proveedores.find((p) => p.idProveedor === Number(idProv));
    setCabecera((prev) => ({
      ...prev,
      idProveedor: idProv,
      procedencia: prov ? prov.razonSocial : prev.procedencia,
    }));
  };

  const registrarNea = async (e) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Agrega al menos un bien antes de registrar la Nota de Entrada.');
      return;
    }

    for (const item of items) {
      if (Number(item.cantidad) <= 0) {
        setError(`La cantidad de "${item.nombre}" debe ser mayor a cero.`);
        return;
      }
      if (item.perecible && !item.fechaVencimiento) {
        setError(`El bien "${item.nombre}" es perecible y requiere fecha de vencimiento.`);
        return;
      }
    }

    setGuardando(true);
    try {
      const payload = {
        numeroNea: cabecera.numeroNea.trim() || null,
        fechaEmision: cabecera.fechaEmision ? `${cabecera.fechaEmision}T09:00:00` : null,
        idProveedor: cabecera.idProveedor ? Number(cabecera.idProveedor) : null,
        procedencia: cabecera.procedencia.trim(),
        destino: cabecera.destino.trim() || 'IESTP "CAÑETE"',
        referencia: cabecera.referencia.trim() || null,
        modalidad: cabecera.modalidad.trim() || null,
        observaciones: cabecera.observaciones.trim() || null,
        items: items.map((i) => ({
          idProducto: i.idProducto,
          cantidad: Number(i.cantidad),
          costoUnitario: Number(i.costoUnitario || 0),
          fechaVencimiento: i.fechaVencimiento || null,
        })),
      };

      const creada = await entradaService.registrarNotaEntrada(payload);
      notificar(`Nota de Entrada ${creada.numeroNea} registrada. Stock y Kardex actualizados.`);
      setCabecera(CABECERA_INICIAL);
      setItems([]);
      setNeaActiva(creada);
      await cargarTodo();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo registrar la Nota de Entrada.');
    } finally {
      setGuardando(false);
    }
  };

  const imprimirNeaOficial = (nota) => {
    if (!nota) return;
    const fecha = new Date(nota.fechaEmision);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();

    const filas = nota.items
        .map(
            (it) => `
        <tr>
          <td style="text-align:center;">${it.codigoInterno || it.idProducto}</td>
          <td style="text-align:right;">${Number(it.cantidadInicial).toFixed(2)}</td>
          <td>
            <strong>${it.nombreProducto}</strong><br/>
            <span style="font-size:11px; color:#444;">Cuenta: ${it.codigoCuenta || '—'}${
                it.fechaVencimiento ? ` · Vence: ${it.fechaVencimiento}` : ''
            }</span>
          </td>
          <td style="text-align:center;">${it.unidadMedida || 'UND'}</td>
          <td style="text-align:right;">S/ ${Number(it.costoUnitario).toFixed(2)}</td>
          <td style="text-align:right;">S/ ${Number(it.subtotal).toFixed(2)}</td>
        </tr>
      `
        )
        .join('');

    const ventana = window.open('', '_blank', 'width=900,height=700');
    if (!ventana) return;

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nota de Entrada - ${nota.numeroNea}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 28px; color: #111; }
            .header { text-align: center; margin-bottom: 18px; }
            .header h2 { margin: 0; font-size: 16px; }
            .header h3 { margin: 6px 0 2px; font-size: 15px; text-decoration: underline; }
            .meta { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
            .meta td { border: 1px solid #333; padding: 6px 8px; }
            .meta .lbl { font-weight: bold; background: #f2f2f2; width: 160px; }
            .tabla { width: 100%; border-collapse: collapse; font-size: 13px; }
            .tabla th, .tabla td { border: 1px solid #333; padding: 7px 8px; }
            .tabla th { background: #e8f5ee; }
            .total { text-align: right; font-weight: bold; font-size: 14px; margin-top: 12px; }
            .firmas { display: flex; justify-content: space-around; margin-top: 64px; text-align: center; font-size: 12px; }
            .firma-linea { border-top: 1px solid #111; width: 220px; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>INSTITUTO DE EDUCACIÓN SUPERIOR TECNOLÓGICO PÚBLICO "CAÑETE"</h2>
            <h3>NOTA DE ENTRADA A ALMACÉN</h3>
            <div style="font-size:15px; font-weight:bold; margin-top:4px;">Nº ${nota.numeroNea}</div>
          </div>

          <table class="meta">
            <tr>
              <td class="lbl">PROCEDENCIA</td>
              <td>${nota.procedencia}</td>
              <td class="lbl" style="width:90px;">FECHA</td>
              <td style="width:120px; text-align:center;">${dia} / ${mes} / ${anio}</td>
            </tr>
            <tr>
              <td class="lbl">DESTINO</td>
              <td colspan="3">${nota.destino}</td>
            </tr>
            <tr>
              <td class="lbl">REFERENCIA</td>
              <td>${nota.referencia || '—'}</td>
              <td class="lbl">PROVEEDOR</td>
              <td>${nota.proveedorRuc ? `${nota.proveedorRuc} - ${nota.proveedorRazonSocial}` : '—'}</td>
            </tr>
            <tr>
              <td class="lbl">MODALIDAD</td>
              <td colspan="3">${nota.modalidad || '—'}</td>
            </tr>
          </table>

          <table class="tabla">
            <thead>
              <tr>
                <th style="width:90px;">CÓDIGO</th>
                <th style="width:80px;">CANT.</th>
                <th>DESCRIPCIÓN</th>
                <th style="width:100px;">UND. MEDIDA</th>
                <th style="width:100px;">P. UNIT</th>
                <th style="width:110px;">P. TOTAL</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>

          <div class="total">TOTAL VALORIZADO: S/ ${Number(nota.totalValorizado).toFixed(2)}</div>

          <div class="firmas">
            <div class="firma-linea">
              <strong>RESPONSABLE DE ALMACÉN</strong><br/>
              ${nota.responsableNombre || ''}
            </div>
            <div class="firma-linea">
              <strong>V° B° ADMINISTRACIÓN</strong>
            </div>
          </div>

          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  const totalFormulario = items.reduce(
      (acc, it) => acc + Number(it.cantidad || 0) * Number(it.costoUnitario || 0),
      0
  );

  const lotesFiltrados = lotes.filter((l) => {
    if (soloConStock && Number(l.cantidadRestante) <= 0) return false;
    if (soloPorVencer) {
      if (!l.perecible || !l.fechaVencimiento) return false;
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const vence = new Date(`${l.fechaVencimiento}T00:00:00`);
      const diffDias = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24));
      if (diffDias > 30) return false;
    }
    return true;
  });

  const pagNotas = usePaginacion(notas, 10);
  const pagLotes = usePaginacion(lotesFiltrados, 10);

  return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-[#064c32]">Entradas a Almacén (NEA) y Lotes</h2>
          <p className="text-base text-slate-600 mt-1">
            Registra ingresos de bienes mediante Nota de Entrada a Almacén; el sistema crea lotes PEPS, suma stock y actualiza el Kardex.
          </p>
        </div>

        {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-base">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
        )}

        {mensaje && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-base">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{mensaje}</span>
            </div>
        )}

        {/* Pestañas */}
        <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-3">
          <button
              type="button"
              onClick={() => setTab('entradas')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-base font-semibold cursor-pointer ${
                  tab === 'entradas'
                      ? 'bg-[#064c32] text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
          >
            <FileInput className="w-5 h-5" />
            Notas de Entrada ({notas.length})
          </button>

          <button
              type="button"
              onClick={() => setTab('lotes')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-base font-semibold cursor-pointer ${
                  tab === 'lotes'
                      ? 'bg-[#064c32] text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
          >
            <Layers className="w-5 h-5" />
            Lotes y Vencimientos ({lotes.length})
          </button>
        </div>

        {cargando ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-lg text-slate-600">
              Cargando información de almacén...
            </div>
        ) : (
            <>
              {/* TAB 1: NOTAS DE ENTRADA */}
              {tab === 'entradas' && (
                  <div className="space-y-8">
                    <form
                        onSubmit={registrarNea}
                        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Nueva Nota de Entrada a Almacén (NEA)</h3>
                          <p className="text-sm text-slate-500">
                            Deja el Nº NEA vacío si deseas que el sistema genere el correlativo automático (ej. NEA-001-2026).
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-slate-500 block">Total del Ingreso</span>
                          <span className="text-2xl font-bold text-[#064c32]">S/ {totalFormulario.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Datos de cabecera */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-base font-medium text-slate-700 mb-1">Nº NEA (Opcional)</label>
                          <input
                              type="text"
                              placeholder="Auto (NEA-001-2026)"
                              value={cabecera.numeroNea}
                              onChange={(e) => setCabecera({ ...cabecera, numeroNea: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-slate-700 mb-1">Fecha de Emisión *</label>
                          <input
                              type="date"
                              required
                              value={cabecera.fechaEmision}
                              onChange={(e) => setCabecera({ ...cabecera, fechaEmision: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-slate-700 mb-1">Proveedor (Catálogo)</label>
                          <select
                              value={cabecera.idProveedor}
                              onChange={(e) => handleCambioProveedor(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base bg-white"
                          >
                            <option value="">Ninguno / Donación / Entidad externa</option>
                            {proveedores.map((p) => (
                                <option key={p.idProveedor} value={p.idProveedor}>
                                  {p.ruc} — {p.razonSocial}
                                </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-base font-medium text-slate-700 mb-1">Procedencia *</label>
                          <input
                              type="text"
                              required
                              placeholder="Ej. Proveedor o Municipalidad de Cañete"
                              value={cabecera.procedencia}
                              onChange={(e) => setCabecera({ ...cabecera, procedencia: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-slate-700 mb-1">Destino *</label>
                          <input
                              type="text"
                              required
                              value={cabecera.destino}
                              onChange={(e) => setCabecera({ ...cabecera, destino: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-slate-700 mb-1">Referencia / Doc. Sustento</label>
                          <input
                              type="text"
                              placeholder="Ej. Factura F001-230, O/C 045, Premio"
                              value={cabecera.referencia}
                              onChange={(e) => setCabecera({ ...cabecera, referencia: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-slate-700 mb-1">Modalidad</label>
                          <input
                              type="text"
                              placeholder="Ej. Compra Directa, Donación, Adjudicación"
                              value={cabecera.modalidad}
                              onChange={(e) => setCabecera({ ...cabecera, modalidad: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-slate-700 mb-1">Observaciones</label>
                          <input
                              type="text"
                              placeholder="Opcional"
                              value={cabecera.observaciones}
                              onChange={(e) => setCabecera({ ...cabecera, observaciones: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
                          />
                        </div>
                      </div>

                      {/* Selector de productos + Escáner USB */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <p className="text-base font-semibold text-slate-800">Agregar Bienes al Ingreso</p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <ScanBarcode className="w-5 h-5 text-[#064c32] absolute left-3.5 top-3.5" />
                              <input
                                  type="text"
                                  placeholder="Escanear código QR / barras y presionar Enter..."
                                  value={codigoEscaner}
                                  onChange={(e) => setCodigoEscaner(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleEscaner(e);
                                  }}
                                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-emerald-700/40 bg-white text-base"
                              />
                            </div>
                            <button
                                type="button"
                                onClick={handleEscaner}
                                className="px-4 py-3 rounded-xl bg-emerald-700 text-white text-base font-semibold hover:bg-emerald-800 cursor-pointer"
                            >
                              Añadir
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <select
                                value={productoSeleccionado}
                                onChange={(e) => setProductoSeleccionado(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 bg-white text-base"
                            >
                              <option value="">O selecciona un bien manualmente...</option>
                              {productos.map((p) => (
                                  <option key={p.idProducto} value={p.idProducto}>
                                    {p.codigoInterno} — {p.nombre} ({p.nombreUnidad})
                                  </option>
                              ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleAgregarManual}
                                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-[#064c32] text-white text-base font-semibold hover:bg-[#053b27] cursor-pointer"
                            >
                              <Plus className="w-5 h-5" /> Agregar
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tabla de detalle de la NEA */}
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left border-collapse">
                          <thead>
                          <tr className="bg-slate-100 text-slate-700 text-sm uppercase">
                            <th className="py-3 px-4">Bien</th>
                            <th className="py-3 px-4 w-36">Cantidad *</th>
                            <th className="py-3 px-4 w-40">Costo Unit. (S/) *</th>
                            <th className="py-3 px-4 w-48">Fecha Vencimiento</th>
                            <th className="py-3 px-4 w-36 text-right">Subtotal</th>
                            <th className="py-3 px-4 w-16"></th>
                          </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-base">
                          {items.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-6 text-center text-slate-500">
                                  Aún no has agregado bienes a esta Nota de Entrada.
                                </td>
                              </tr>
                          ) : (
                              items.map((it) => {
                                const sub = Number(it.cantidad || 0) * Number(it.costoUnitario || 0);
                                return (
                                    <tr key={it.idProducto}>
                                      <td className="py-3 px-4">
                                        <div className="font-semibold text-slate-900">{it.nombre}</div>
                                        <div className="text-sm text-slate-500">
                                          {it.codigoInterno} · {it.unidad}
                                          {it.perecible && (
                                              <span className="ml-2 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-semibold">
                                      Perecible (exige fecha)
                                    </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-3 px-4">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            required
                                            value={it.cantidad}
                                            onChange={(e) => actualizarItem(it.idProducto, 'cantidad', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-base"
                                        />
                                      </td>
                                      <td className="py-3 px-4">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={it.costoUnitario}
                                            onChange={(e) => actualizarItem(it.idProducto, 'costoUnitario', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-base"
                                        />
                                      </td>
                                      <td className="py-3 px-4">
                                        <input
                                            type="date"
                                            required={it.perecible}
                                            value={it.fechaVencimiento}
                                            onChange={(e) => actualizarItem(it.idProducto, 'fechaVencimiento', e.target.value)}
                                            className={`w-full px-3 py-2 rounded-lg border text-base ${
                                                it.perecible && !it.fechaVencimiento
                                                    ? 'border-amber-500 bg-amber-50'
                                                    : 'border-slate-300'
                                            }`}
                                        />
                                      </td>
                                      <td className="py-3 px-4 text-right font-semibold whitespace-nowrap">
                                        S/ {sub.toFixed(2)}
                                      </td>
                                      <td className="py-3 px-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => quitarItem(it.idProducto)}
                                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                                            title="Quitar"
                                        >
                                          <Trash2 className="w-5 h-5" />
                                        </button>
                                      </td>
                                    </tr>
                                );
                              })
                          )}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={guardando}
                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#064c32] hover:bg-[#053b27] disabled:opacity-60 text-white text-lg font-semibold cursor-pointer"
                        >
                          <Plus className="w-5 h-5" />
                          {guardando ? 'Registrando Ingreso...' : 'Registrar Nota de Entrada'}
                        </button>
                      </div>
                    </form>

                    {/* Historial de NEAs */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="px-6 py-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900">Historial de Notas de Entrada</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                          <tr className="bg-[#064c32] text-white text-sm uppercase">
                            <th className="py-3.5 px-4">Nº NEA</th>
                            <th className="py-3.5 px-4">Fecha</th>
                            <th className="py-3.5 px-4">Procedencia / Referencia</th>
                            <th className="py-3.5 px-4">Ítems</th>
                            <th className="py-3.5 px-4 text-right">Total (S/)</th>
                            <th className="py-3.5 px-4 text-right">Acciones</th>
                          </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-base">
                          {pagNotas.itemsPaginados.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-500">
                                  Aún no existen Notas de Entrada registradas.
                                </td>
                              </tr>
                          ) : (
                              pagNotas.itemsPaginados.map((n) => (
                                  <tr key={n.idNotaEntrada} className="hover:bg-slate-50">
                                    <td className="py-3.5 px-4 font-mono font-bold text-[#064c32] whitespace-nowrap">
                                      {n.numeroNea}
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">{formatearFecha(n.fechaEmision)}</td>
                                    <td className="py-3.5 px-4">
                                      <div className="font-semibold">{n.procedencia}</div>
                                      <div className="text-sm text-slate-500">{n.referencia || n.modalidad || '—'}</div>
                                    </td>
                                    <td className="py-3.5 px-4">{n.cantidadItems} lote(s)</td>
                                    <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                                      S/ {Number(n.totalValorizado).toFixed(2)}
                                    </td>
                                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                                      <button
                                          type="button"
                                          onClick={() => setNeaActiva(n)}
                                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100 cursor-pointer"
                                      >
                                        <Eye className="w-4 h-4" /> Ver
                                      </button>
                                      <button
                                          type="button"
                                          onClick={() => imprimirNeaOficial(n)}
                                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-700/40 text-[#064c32] text-sm font-semibold hover:bg-emerald-50 cursor-pointer"
                                      >
                                        <Printer className="w-4 h-4" /> Imprimir
                                      </button>
                                    </td>
                                  </tr>
                              ))
                          )}
                          </tbody>
                        </table>
                      </div>

                      <Paginacion
                          paginaActual={pagNotas.paginaActual}
                          totalPaginas={pagNotas.totalPaginas}
                          totalRegistros={pagNotas.totalRegistros}
                          porPagina={pagNotas.porPagina}
                          desde={pagNotas.desde}
                          hasta={pagNotas.hasta}
                          onCambiarPagina={pagNotas.irAPagina}
                          onCambiarPorPagina={pagNotas.cambiarPorPagina}
                      />
                    </div>
                  </div>
              )}

              {/* TAB 2: CONTROL DE LOTES Y VENCIMIENTOS */}
              {tab === 'lotes' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                      <label className="flex items-center gap-2 text-base font-medium cursor-pointer">
                        <input
                            type="checkbox"
                            checked={soloConStock}
                            onChange={(e) => {
                              setSoloConStock(e.target.checked);
                              pagLotes.reiniciarPagina();
                            }}
                            className="w-5 h-5 accent-[#064c32]"
                        />
                        Solo lotes con stock disponible
                      </label>

                      <label className="flex items-center gap-2 text-base font-medium cursor-pointer text-amber-800">
                        <input
                            type="checkbox"
                            checked={soloPorVencer}
                            onChange={(e) => {
                              setSoloPorVencer(e.target.checked);
                              pagLotes.reiniciarPagina();
                            }}
                            className="w-5 h-5 accent-amber-600"
                        />
                        <CalendarClock className="w-5 h-5" />
                        Solo vencidos o por vencer (≤ 30 días)
                      </label>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                          <tr className="bg-[#064c32] text-white text-sm uppercase">
                            <th className="py-3.5 px-4">Bien / Lote</th>
                            <th className="py-3.5 px-4">NEA / Proveedor</th>
                            <th className="py-3.5 px-4">Ingreso</th>
                            <th className="py-3.5 px-4">Vencimiento</th>
                            <th className="py-3.5 px-4 text-right">Restante / Inicial</th>
                            <th className="py-3.5 px-4 text-right">Costo Unit.</th>
                            <th className="py-3.5 px-4 text-right">Saldo (S/)</th>
                          </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-base">
                          {pagLotes.itemsPaginados.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-500">
                                  No hay lotes que coincidan con el filtro actual.
                                </td>
                              </tr>
                          ) : (
                              pagLotes.itemsPaginados.map((l) => {
                                const badge = obtenerEstadoVencimiento(l);
                                return (
                                    <tr key={l.idLote} className="hover:bg-slate-50">
                                      <td className="py-3.5 px-4">
                                        <div className="font-semibold text-slate-900">{l.nombreProducto}</div>
                                        <div className="text-sm text-slate-500 font-mono">
                                          Lote #{l.idLote} · {l.codigoInterno}
                                        </div>
                                      </td>
                                      <td className="py-3.5 px-4">
                                        <div className="font-mono text-sm font-bold text-[#064c32]">
                                          {l.numeroNea || l.documentoSustento || '—'}
                                        </div>
                                        <div className="text-sm text-slate-500">{l.proveedor || '—'}</div>
                                      </td>
                                      <td className="py-3.5 px-4 whitespace-nowrap">{formatearFecha(l.fechaIngreso)}</td>
                                      <td className="py-3.5 px-4 whitespace-nowrap">
                                        <div className="text-sm font-medium">{l.fechaVencimiento || '—'}</div>
                                        <span
                                            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.clase}`}
                                        >
                                  {badge.texto}
                                </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                        <span className="font-bold text-slate-900">{Number(l.cantidadRestante).toFixed(2)}</span>
                                        <span className="text-slate-400"> / {Number(l.cantidadInicial).toFixed(2)}</span>
                                      </td>
                                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                        S/ {Number(l.costoUnitario).toFixed(2)}
                                      </td>
                                      <td className="py-3.5 px-4 text-right font-bold text-[#064c32] whitespace-nowrap">
                                        S/ {Number(l.valorizadoRestante).toFixed(2)}
                                      </td>
                                    </tr>
                                );
                              })
                          )}
                          </tbody>
                        </table>
                      </div>

                      <Paginacion
                          paginaActual={pagLotes.paginaActual}
                          totalPaginas={pagLotes.totalPaginas}
                          totalRegistros={pagLotes.totalRegistros}
                          porPagina={pagLotes.porPagina}
                          desde={pagLotes.desde}
                          hasta={pagLotes.hasta}
                          onCambiarPagina={pagLotes.irAPagina}
                          onCambiarPorPagina={pagLotes.cambiarPorPagina}
                      />
                    </div>
                  </div>
              )}
            </>
        )}

        {/* Modal Detalle de NEA */}
        {neaActiva && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-2xl font-bold text-[#064c32]">Nota de Entrada Nº {neaActiva.numeroNea}</h3>
                    <p className="text-sm text-slate-500">
                      Fecha: {formatearFecha(neaActiva.fechaEmision)} · Responsable: {neaActiva.responsableNombre}
                    </p>
                  </div>
                  <button
                      type="button"
                      onClick={() => setNeaActiva(null)}
                      className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div><strong>Procedencia:</strong> {neaActiva.procedencia}</div>
                  <div><strong>Destino:</strong> {neaActiva.destino}</div>
                  <div><strong>Referencia:</strong> {neaActiva.referencia || '—'}</div>
                  <div><strong>Modalidad:</strong> {neaActiva.modalidad || '—'}</div>
                </div>

                <table className="w-full text-left border-collapse text-base">
                  <thead>
                  <tr className="bg-[#064c32] text-white text-sm">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Bien / Cuenta</th>
                    <th className="py-2.5 px-3 text-right">Cant.</th>
                    <th className="py-2.5 px-3 text-right">P. Unit.</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                  {neaActiva.items.map((it) => (
                      <tr key={it.idLote}>
                        <td className="py-2.5 px-3 font-mono text-sm">{it.codigoInterno}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold">{it.nombreProducto}</div>
                          <div className="text-xs text-slate-500">
                            Cta. {it.codigoCuenta || '—'} · {it.unidadMedida}
                            {it.fechaVencimiento ? ` · Vence: ${it.fechaVencimiento}` : ''}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">{Number(it.cantidadInicial).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right">S/ {Number(it.costoUnitario).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">S/ {Number(it.subtotal).toFixed(2)}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>

                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <div className="text-xl font-bold text-[#064c32]">
                    Total Valorizado: S/ {Number(neaActiva.totalValorizado).toFixed(2)}
                  </div>
                  <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => imprimirNeaOficial(neaActiva)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#064c32] text-white text-base font-semibold hover:bg-[#053b27] cursor-pointer"
                    >
                      <Printer className="w-5 h-5" /> Imprimir NEA
                    </button>
                    <button
                        type="button"
                        onClick={() => setNeaActiva(null)}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 text-base font-medium cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}