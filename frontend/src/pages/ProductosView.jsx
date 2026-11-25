import { useEffect, useRef, useState } from 'react';
import {
  Package,
  Plus,
  Pencil,
  Power,
  QrCode,
  Printer,
  ScanBarcode,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { catalogoService } from '../services/catalogoService';
import { usePaginacion } from '../hooks/usepaginacion';
import Paginacion from '../components/ui/paginacion';

const FORM_INICIAL = {
  nombre: '',
  codigoInterno: '',
  codigoBarra: '',
  marcaSerie: '',
  tipoBien: 'CONSUMO',
  precioUnidad: '0.00',
  stockMinimo: '0.00',
  consumoMensualAprox: '0.00',
  perecible: false,
  idCategoria: '',
  idUnidad: '',
};

export default function ProductosView() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [filtro, setFiltro] = useState('');
  const [codigoEscaneado, setCodigoEscaneado] = useState('');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);

  // Modal QR
  const [productoQr, setProductoQr] = useState(null);
  const qrContainerRef = useRef(null);

  const cargarTodo = async () => {
    setCargando(true);
    setError('');
    try {
      const [prodData, catData, uniData] = await Promise.all([
        catalogoService.listarProductos(),
        catalogoService.listarCategorias(true),
        catalogoService.listarUnidades(true),
      ]);
      setProductos(prodData);
      setCategorias(catData);
      setUnidades(uniData);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el catálogo de bienes.');
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
    setTimeout(() => setMensaje(''), 4000);
  };

  const productosFiltrados = productos.filter((p) => {
    if (!filtro.trim()) return true;
    const q = filtro.toLowerCase();
    return (
        p.nombre.toLowerCase().includes(q) ||
        (p.codigoInterno || '').toLowerCase().includes(q) ||
        (p.codigoBarra || '').toLowerCase().includes(q) ||
        (p.codigoCuenta || '').toLowerCase().includes(q)
    );
  });

  const pag = usePaginacion(productosFiltrados, 10);

  const buscarPorEscaner = async (e) => {
    e.preventDefault();
    if (!codigoEscaneado.trim()) return;
    setError('');
    try {
      const encontrado = await catalogoService.buscarProductoPorCodigo(codigoEscaneado.trim());
      setFiltro(encontrado.codigoInterno || encontrado.nombre);
      pag.reiniciarPagina();
      setProductoQr(encontrado);
      setCodigoEscaneado('');
    } catch (err) {
      setError(err.response?.data?.message || 'Código no encontrado en el catálogo.');
    }
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        nombre: form.nombre.trim(),
        codigoInterno: form.codigoInterno.trim() || null,
        codigoBarra: form.codigoBarra.trim() || null,
        marcaSerie: form.marcaSerie.trim() || null,
        tipoBien: form.tipoBien.trim() || null,
        precioUnidad: Number(form.precioUnidad || 0),
        stockMinimo: Number(form.stockMinimo || 0),
        consumoMensualAprox: Number(form.consumoMensualAprox || 0),
        perecible: Boolean(form.perecible),
        idCategoria: Number(form.idCategoria),
        idUnidad: Number(form.idUnidad),
      };

      if (editId) {
        await catalogoService.actualizarProducto(editId, payload);
        notificar('Bien actualizado correctamente.');
      } else {
        await catalogoService.crearProducto(payload);
        notificar('Bien registrado en el catálogo.');
      }

      setEditId(null);
      setForm(FORM_INICIAL);
      await cargarTodo();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el bien.');
    }
  };

  const toggleEstado = async (p) => {
    try {
      await catalogoService.cambiarEstadoProducto(p.idProducto, !p.activo);
      notificar(`Bien ${p.activo ? 'desactivado' : 'activado'}.`);
      await cargarTodo();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar el estado.');
    }
  };

  const imprimirEtiquetaQr = () => {
    if (!productoQr || !qrContainerRef.current) return;
    const svgHtml = qrContainerRef.current.innerHTML;
    const codigoTexto = productoQr.codigoBarra || productoQr.codigoInterno || `SIGA-${productoQr.idProducto}`;

    const ventana = window.open('', '_blank', 'width=420,height=420');
    if (!ventana) return;

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta QR - ${codigoTexto}</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 90vh; margin: 0; }
            .etiqueta { border: 2px solid #064c32; border-radius: 12px; padding: 18px; width: 280px; text-align: center; }
            .inst { font-size: 11px; font-weight: bold; color: #064c32; letter-spacing: 0.5px; }
            .nombre { font-size: 15px; font-weight: bold; margin: 8px 0 4px; color: #111; }
            .meta { font-size: 12px; color: #444; margin-bottom: 12px; }
            .codigo { font-family: monospace; font-size: 15px; font-weight: bold; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="etiqueta">
            <div class="inst">IESTP CAÑETE · ALMACÉN SIGA</div>
            <div class="nombre">${productoQr.nombre}</div>
            <div class="meta">Cta: ${productoQr.codigoCuenta || '—'} · ${productoQr.nombreUnidad}</div>
            <div>${svgHtml}</div>
            <div class="codigo">${codigoTexto}</div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#064c32]">Catálogo de Bienes</h2>
            <p className="text-base text-slate-600 mt-1">
              Administra los productos del almacén, escanea códigos con lector USB y genera etiquetas QR.
            </p>
          </div>

          {/* Lectura rápida con escáner USB */}
          <form onSubmit={buscarPorEscaner} className="flex items-center gap-2">
            <div className="relative">
              <ScanBarcode className="w-5 h-5 text-[#064c32] absolute left-3.5 top-3.5" />
              <input
                  type="text"
                  placeholder="Escanear código de barras / QR..."
                  value={codigoEscaneado}
                  onChange={(e) => setCodigoEscaneado(e.target.value)}
                  className="pl-11 pr-4 py-3 w-72 rounded-xl border-2 border-emerald-700/40 bg-white text-base focus:outline-none focus:border-[#064c32]"
              />
            </div>
            <button
                type="submit"
                className="px-4 py-3 rounded-xl bg-[#064c32] text-white text-base font-semibold hover:bg-[#053b27] cursor-pointer"
            >
              Buscar
            </button>
          </form>
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Formulario */}
          <form
              onSubmit={guardarProducto}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 xl:sticky xl:top-0"
          >
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#064c32]" />
              <h3 className="text-xl font-bold text-slate-900">
                {editId ? 'Editar Bien' : 'Registrar Nuevo Bien'}
              </h3>
            </div>

            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">Nombre / Descripción *</label>
              <input
                  type="text"
                  required
                  placeholder="Ej. Papel Bond A4 75g, Agua Mineral x 20L"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-base font-medium text-slate-700 mb-1">Código Interno</label>
                <input
                    type="text"
                    placeholder="Auto (SIGA-0001)"
                    value={form.codigoInterno}
                    onChange={(e) => setForm({ ...form, codigoInterno: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base font-mono focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-slate-700 mb-1">Código Barras / QR</label>
                <input
                    type="text"
                    placeholder="Disparar escáner..."
                    value={form.codigoBarra}
                    onChange={(e) => setForm({ ...form, codigoBarra: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base font-mono focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">Cuenta Contable *</label>
              <select
                  required
                  value={form.idCategoria}
                  onChange={(e) => setForm({ ...form, idCategoria: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#064c32]"
              >
                <option value="">Selecciona cuenta...</option>
                {categorias.map((c) => (
                    <option key={c.idCategoria} value={c.idCategoria}>
                      {c.codigo} — {c.nombre}
                    </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-base font-medium text-slate-700 mb-1">Unidad de Medida *</label>
                <select
                    required
                    value={form.idUnidad}
                    onChange={(e) => setForm({ ...form, idUnidad: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                >
                  <option value="">Selecciona...</option>
                  {unidades.map((u) => (
                      <option key={u.idUnidad} value={u.idUnidad}>
                        {u.nombre} {u.abreviatura ? `(${u.abreviatura})` : ''}
                      </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-base font-medium text-slate-700 mb-1">Tipo de Bien</label>
                <select
                    value={form.tipoBien}
                    onChange={(e) => setForm({ ...form, tipoBien: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                >
                  <option value="CONSUMO">Consumo</option>
                  <option value="SUMINISTRO">Suministro</option>
                  <option value="EQUIPO">Equipo / Patrimonio</option>
                  <option value="ALIMENTO">Alimento / Insumo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">Marca y Serie</label>
              <input
                  type="text"
                  placeholder="Ej. Bidón con caño / Modelo EV300"
                  value={form.marcaSerie}
                  onChange={(e) => setForm({ ...form, marcaSerie: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock Mín.</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.stockMinimo}
                    onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cons. Mensual</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.consumoMensualAprox}
                    onChange={(e) => setForm({ ...form, consumoMensualAprox: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio Ref. (S/)</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.precioUnidad}
                    onChange={(e) => setForm({ ...form, precioUnidad: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                  type="checkbox"
                  checked={form.perecible}
                  onChange={(e) => setForm({ ...form, perecible: e.target.checked })}
                  className="w-5 h-5 accent-[#064c32]"
              />
              <span className="text-base font-medium text-slate-800">
              Producto perecible (exige fecha de vencimiento en cada lote)
            </span>
            </label>

            <div className="flex gap-2">
              <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#064c32] hover:bg-[#053b27] text-white text-base font-semibold cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                {editId ? 'Actualizar Bien' : 'Guardar Bien'}
              </button>
              {editId && (
                  <button
                      type="button"
                      onClick={() => {
                        setEditId(null);
                        setForm(FORM_INICIAL);
                      }}
                      className="px-4 py-3 rounded-xl border border-slate-300 text-base font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
              )}
            </div>
          </form>

          {/* Tabla de Bienes */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                  type="text"
                  placeholder="Filtrar por nombre, código interno, código de barras o cuenta..."
                  value={filtro}
                  onChange={(e) => {
                    setFiltro(e.target.value);
                    pag.reiniciarPagina();
                  }}
                  className="w-full text-base focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              {cargando ? (
                  <div className="p-8 text-center text-lg text-slate-600">Cargando catálogo...</div>
              ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-[#064c32] text-white text-sm uppercase">
                      <th className="py-3.5 px-4">Código</th>
                      <th className="py-3.5 px-4">Bien / Cuenta</th>
                      <th className="py-3.5 px-4">Stock / Mín.</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-base">
                    {pag.itemsPaginados.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">
                            No se encontraron bienes registrados.
                          </td>
                        </tr>
                    ) : (
                        pag.itemsPaginados.map((p) => {
                          const stockBajo = Number(p.stockGeneral) <= Number(p.stockMinimo);
                          return (
                              <tr key={p.idProducto} className="hover:bg-slate-50">
                                <td className="py-3.5 px-4 font-mono text-sm whitespace-nowrap">
                                  <div className="font-bold text-[#064c32]">{p.codigoInterno || '—'}</div>
                                  {p.codigoBarra && <div className="text-slate-500">{p.codigoBarra}</div>}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-slate-900">{p.nombre}</div>
                                  <div className="text-sm text-slate-500">
                                    Cta. {p.codigoCuenta || '—'} · {p.nombreUnidad}
                                    {p.perecible && (
                                        <span className="ml-2 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-semibold">
                                  Perecible
                                </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <div className={`font-bold ${stockBajo ? 'text-red-700' : 'text-slate-900'}`}>
                                    {Number(p.stockGeneral).toFixed(2)} {p.abreviaturaUnidad || ''}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    Mín: {Number(p.stockMinimo).toFixed(2)}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                            <span
                                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    p.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                              {p.activo ? 'Activo' : 'Inactivo'}
                            </span>
                                </td>
                                <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                                  <button
                                      type="button"
                                      onClick={() => setProductoQr(p)}
                                      title="Ver / Imprimir QR"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-700/40 text-[#064c32] text-sm font-semibold hover:bg-emerald-50 cursor-pointer"
                                  >
                                    <QrCode className="w-4 h-4" /> QR
                                  </button>
                                  <button
                                      type="button"
                                      onClick={() => {
                                        setEditId(p.idProducto);
                                        setForm({
                                          nombre: p.nombre,
                                          codigoInterno: p.codigoInterno || '',
                                          codigoBarra: p.codigoBarra || '',
                                          marcaSerie: p.marcaSerie || '',
                                          tipoBien: p.tipoBien || 'CONSUMO',
                                          precioUnidad: String(p.precioUnidad ?? '0.00'),
                                          stockMinimo: String(p.stockMinimo ?? '0.00'),
                                          consumoMensualAprox: String(p.consumoMensualAprox ?? '0.00'),
                                          perecible: Boolean(p.perecible),
                                          idCategoria: p.idCategoria ? String(p.idCategoria) : '',
                                          idUnidad: p.idUnidad ? String(p.idUnidad) : '',
                                        });
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100 cursor-pointer"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                      type="button"
                                      onClick={() => toggleEstado(p)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100 cursor-pointer"
                                  >
                                    <Power className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                          );
                        })
                    )}
                    </tbody>
                  </table>
              )}
            </div>

            <Paginacion
                paginaActual={pag.paginaActual}
                totalPaginas={pag.totalPaginas}
                totalRegistros={pag.totalRegistros}
                porPagina={pag.porPagina}
                desde={pag.desde}
                hasta={pag.hasta}
                onCambiarPagina={pag.irAPagina}
                onCambiarPorPagina={pag.cambiarPorPagina}
            />
          </div>
        </div>

        {/* Modal Etiqueta QR */}
        {productoQr && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-xl font-bold text-[#064c32]">Etiqueta QR del Bien</h3>
                  <button
                      type="button"
                      onClick={() => setProductoQr(null)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="border-2 border-[#064c32] rounded-xl p-6 text-center space-y-3">
                  <p className="text-xs font-bold tracking-wider text-[#064c32]">
                    IESTP CAÑETE · ALMACÉN SIGA
                  </p>
                  <p className="text-lg font-bold text-slate-900">{productoQr.nombre}</p>
                  <p className="text-sm text-slate-600">
                    Cuenta: {productoQr.codigoCuenta || '—'} · {productoQr.nombreUnidad}
                  </p>
                  <div ref={qrContainerRef} className="flex justify-center py-2">
                    <QRCodeSVG
                        value={productoQr.codigoBarra || productoQr.codigoInterno || `SIGA-${productoQr.idProducto}`}
                        size={170}
                        level="M"
                    />
                  </div>
                  <p className="font-mono text-base font-bold text-slate-800">
                    {productoQr.codigoBarra || productoQr.codigoInterno || `SIGA-${productoQr.idProducto}`}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                      type="button"
                      onClick={imprimirEtiquetaQr}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#064c32] hover:bg-[#053b27] text-white text-base font-semibold cursor-pointer"
                  >
                    <Printer className="w-5 h-5" />
                    Imprimir Etiqueta
                  </button>
                  <button
                      type="button"
                      onClick={() => setProductoQr(null)}
                      className="px-5 py-3 rounded-xl border border-slate-300 text-base font-medium cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}