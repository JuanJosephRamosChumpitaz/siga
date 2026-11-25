import { useEffect, useRef, useState } from 'react';
import {
  FileSignature,
  Plus,
  History,
  Trash2,
  ScanBarcode,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  PackageCheck,
  AlertCircle,
  Eye,
  X,
  QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/auth';
import { pecosaService } from '../services/pecosaService';
import { catalogoService } from '../services/catalogoService';
import { administracionService } from '../services/administracionService';
import { usePaginacion } from '../hooks/usepaginacion';
import Paginacion from '../components/ui/paginacion';

const BADGE_ESTADO = {
  PENDIENTE_FIRMAS: { texto: 'Pendiente de Firmas', clase: 'bg-amber-100 text-amber-800' },
  APROBADA: { texto: 'Aprobada (Lista para Despacho)', clase: 'bg-blue-100 text-blue-800' },
  DESPACHADA: { texto: 'Despachada (PEPS)', clase: 'bg-emerald-100 text-emerald-800' },
  RECHAZADA: { texto: 'Rechazada', clase: 'bg-red-100 text-red-800' },
};

function formatearFechaHora(iso) {
  if (!iso) return '—';
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return iso;
  return f.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatearFecha(iso) {
  if (!iso) return '—';
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return iso;
  return f.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function SolicitudesView() {
  const { usuario } = useAuth();
  const rolActual = usuario?.rol?.toUpperCase() || 'SOLICITANTE';
  const puedeElegirTercero = rolActual === 'ADMIN' || rolActual === 'ALMACENERO';

  const [tab, setTab] = useState('bandeja');
  const [pecosas, setPecosas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [personas, setPersonas] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Escáner QR de PECOSA
  const [qrBusqueda, setQrBusqueda] = useState('');

  // Formulario Nueva PECOSA
  const [idAreaDestino, setIdAreaDestino] = useState('');
  const [idPersonaSolicitante, setIdPersonaSolicitante] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [itemsSolicitud, setItemsSolicitud] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [codigoProductoEscaner, setCodigoProductoEscaner] = useState('');

  // Modal de Detalle / Firma / Despacho
  const [pecosaActiva, setPecosaActiva] = useState(null);
  const [obsAccion, setObsAccion] = useState('');
  const [cantidadesDespacho, setCantidadesDespacho] = useState({});
  const qrPrintRef = useRef(null);

  const cargarTodo = async () => {
    setCargando(true);
    setError('');
    try {
      const promesas = [pecosaService.listar(), catalogoService.listarProductos(true)];
      if (puedeElegirTercero) {
        promesas.push(administracionService.listarAreas(true));
        promesas.push(administracionService.listarPersonas());
      }
      const resultados = await Promise.all(promesas);
      setPecosas(resultados[0]);
      setProductos(resultados[1]);
      if (puedeElegirTercero) {
        setAreas(resultados[2] || []);
        setPersonas((resultados[3] || []).filter((p) => p.activo));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar las PECOSAs.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notificar = (texto) => {
    setMensaje(texto);
    setError('');
    setTimeout(() => setMensaje(''), 4500);
  };

  const abrirModalPecosa = (pecosa) => {
    setPecosaActiva(pecosa);
    setObsAccion('');
    const inicialDespacho = {};
    pecosa.detalles.forEach((d) => {
      const maxDisponible = Math.min(Number(d.cantidadSolicitada), Number(d.stockActualProducto || 0));
      inicialDespacho[d.idProducto] = String(Math.max(0, maxDisponible).toFixed(2));
    });
    setCantidadesDespacho(inicialDespacho);
  };

  // --- ESCÁNER QR PARA ABRIR UNA PECOSA ---
  const buscarPecosaPorQr = async (e) => {
    e.preventDefault();
    if (!qrBusqueda.trim()) return;
    setError('');
    try {
      const encontrada = await pecosaService.buscarPorQr(qrBusqueda.trim());
      abrirModalPecosa(encontrada);
      setQrBusqueda('');
    } catch (err) {
      setError(err.response?.data?.message || 'No se encontró ninguna PECOSA con ese código.');
    }
  };

  // --- FORMULARIO NUEVA PECOSA ---
  const agregarProductoASolicitud = (prod) => {
    if (!prod) return;
    setItemsSolicitud((prev) => {
      const existe = prev.find((i) => i.idProducto === prod.idProducto);
      if (existe) {
        return prev.map((i) =>
            i.idProducto === prod.idProducto
                ? { ...i, cantidadSolicitada: String((Number(i.cantidadSolicitada || 0) + 1).toFixed(2)) }
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
          stockGeneral: prod.stockGeneral,
          cantidadSolicitada: '1.00',
        },
      ];
    });
  };

  const handleAgregarManual = () => {
    if (!productoSeleccionado) return;
    const prod = productos.find((p) => p.idProducto === Number(productoSeleccionado));
    agregarProductoASolicitud(prod);
    setProductoSeleccionado('');
  };

  const handleEscanerProducto = async (e) => {
    e.preventDefault();
    if (!codigoProductoEscaner.trim()) return;
    setError('');
    try {
      const prod = await catalogoService.buscarProductoPorCodigo(codigoProductoEscaner.trim());
      agregarProductoASolicitud(prod);
      setCodigoProductoEscaner('');
    } catch (err) {
      setError(err.response?.data?.message || 'Producto no encontrado.');
    }
  };

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    setError('');
    if (itemsSolicitud.length === 0) {
      setError('Debes agregar al menos un bien a la solicitud PECOSA.');
      return;
    }

    setProcesando(true);
    try {
      const payload = {
        idAreaDestino: puedeElegirTercero && idAreaDestino ? Number(idAreaDestino) : null,
        idPersonaSolicitante: puedeElegirTercero && idPersonaSolicitante ? Number(idPersonaSolicitante) : null,
        observaciones: observaciones.trim() || null,
        items: itemsSolicitud.map((i) => ({
          idProducto: i.idProducto,
          cantidadSolicitada: Number(i.cantidadSolicitada),
        })),
      };

      const creada = await pecosaService.crear(payload);
      notificar(`PECOSA ${creada.numeroPecosa} generada y enviada al circuito de firmas.`);
      setItemsSolicitud([]);
      setObservaciones('');
      setIdAreaDestino('');
      setIdPersonaSolicitante('');
      setTab('bandeja');
      await cargarTodo();
      abrirModalPecosa(creada);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo emitir la PECOSA.');
    } finally {
      setProcesando(false);
    }
  };

  // --- FIRMAR / RECHAZAR ---
  const ejecutarFirma = async (aprobar) => {
    if (!pecosaActiva) return;
    if (!aprobar && !obsAccion.trim()) {
      setError('Escribe el motivo en el campo de observación antes de rechazar.');
      return;
    }

    setProcesando(true);
    setError('');
    try {
      const actualizada = await pecosaService.firmar(pecosaActiva.idPecosa, {
        aprobar,
        observacion: obsAccion.trim() || null,
      });
      notificar(
          aprobar
              ? `Firma registrada correctamente en ${actualizada.numeroPecosa}.`
              : `PECOSA ${actualizada.numeroPecosa} rechazada.`
      );
      await cargarTodo();
      abrirModalPecosa(actualizada);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo procesar la firma.');
    } finally {
      setProcesando(false);
    }
  };

  // --- DESPACHAR CON PEPS ---
  const ejecutarDespachoPeps = async () => {
    if (!pecosaActiva) return;
    setProcesando(true);
    setError('');
    try {
      const itemsDespacho = pecosaActiva.detalles.map((d) => ({
        idProducto: d.idProducto,
        cantidadAtendida: Number(cantidadesDespacho[d.idProducto] ?? 0),
      }));

      const despachada = await pecosaService.despachar(pecosaActiva.idPecosa, {
        observaciones: obsAccion.trim() || null,
        items: itemsDespacho,
      });

      notificar(`Despacho PEPS completado (${despachada.numeroSalida}). Stock y Kardex actualizados.`);
      await cargarTodo();
      abrirModalPecosa(despachada);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo ejecutar el despacho PEPS.');
    } finally {
      setProcesando(false);
    }
  };

  // --- IMPRESIÓN OFICIAL DE PECOSA (Formato IESTP Cañete + QR + 4 Firmas) ---
  const imprimirPecosaOficial = (pecosa) => {
    if (!pecosa) return;
    const qrHtml = qrPrintRef.current ? qrPrintRef.current.innerHTML : '';

    const buscarFirma = (rol) => pecosa.firmas.find((f) => f.rolFirma === rol);
    const fSol = buscarFirma('SOLICITANTE');
    const fAbast = buscarFirma('ABASTECIMIENTO');
    const fAlm = buscarFirma('ALMACEN');
    const fAdmin = buscarFirma('ADMINISTRADOR');

    const renderFirma = (titulo, firma) => `
      <div class="firma-box">
        <div class="firma-estado">
          ${
        firma?.estado === 'FIRMADO'
            ? `<strong>FIRMADO DIGITALMENTE</strong><br/>${firma.firmanteNombre || ''}<br/><span>${formatearFechaHora(firma.fechaFirma)}</span>`
            : firma?.estado === 'RECHAZADO'
                ? `<strong style="color:#b91c1c;">RECHAZADO</strong><br/>${firma.firmanteNombre || ''}`
                : '<span style="color:#777;">Pendiente</span>'
    }
        </div>
        <div class="firma-linea">${titulo}</div>
      </div>
    `;

    const filas = pecosa.detalles
        .map(
            (d, idx) => `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="text-align:center; font-family:monospace;">${d.codigoInterno || d.idProducto}</td>
          <td>
            <strong>${d.nombreProducto}</strong>
            ${d.idLote ? `<div style="font-size:10px; color:#444;">Lote #${d.idLote} · Cta. ${d.codigoCuenta || '—'}</div>` : ''}
          </td>
          <td style="text-align:right;">${Number(d.cantidadSolicitada) > 0 ? Number(d.cantidadSolicitada).toFixed(2) : '—'}</td>
          <td style="text-align:right;">${Number(d.cantidadAtendida).toFixed(2)}</td>
          <td style="text-align:center;">${d.unidadMedida || 'UND'}</td>
          <td style="text-align:center;">${d.tipoBien || 'CONSUMO'}</td>
          <td style="text-align:right;">${Number(d.precioUnitarioHistorico).toFixed(2)}</td>
          <td style="text-align:right;">${Number(d.subtotal).toFixed(2)}</td>
        </tr>
      `
        )
        .join('');

    const ventana = window.open('', '_blank', 'width=980,height=740');
    if (!ventana) return;

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PECOSA ${pecosa.numeroPecosa}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            .top { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #064c32; padding-bottom: 12px; margin-bottom: 14px; }
            .inst h2 { margin: 0; font-size: 14px; color: #064c32; }
            .inst p { margin: 2px 0; font-size: 11px; color: #444; }
            .titulo { text-align: center; }
            .titulo h1 { margin: 0; font-size: 17px; letter-spacing: 0.5px; }
            .titulo .num { font-size: 16px; font-weight: bold; color: #b91c1c; margin-top: 4px; }
            .meta { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 14px; }
            .meta td { border: 1px solid #333; padding: 6px 8px; }
            .meta .lbl { font-weight: bold; background: #f3f4f6; }
            .tabla { width: 100%; border-collapse: collapse; font-size: 12px; }
            .tabla th, .tabla td { border: 1px solid #333; padding: 6px; }
            .tabla th { background: #e8f5ee; text-align: center; font-size: 11px; }
            .total-row td { font-weight: bold; background: #f9fafb; font-size: 13px; }
            .firmas { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 48px; text-align: center; }
            .firma-estado { min-height: 44px; font-size: 10px; display: flex; flex-direction: column; justify-content: flex-end; padding-bottom: 6px; }
            .firma-linea { border-top: 1px solid #111; padding-top: 5px; font-size: 11px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="top">
            <div class="inst">
              <h2>IESTP "CAÑETE"</h2>
              <p>Gobierno Regional de Lima</p>
              <p>Dirección Regional de Educación</p>
            </div>
            <div class="titulo">
              <h1>PEDIDO - COMPROBANTE DE SALIDA (PECOSA)</h1>
              <div class="num">Nº ${pecosa.numeroPecosa}</div>
            </div>
            <div style="text-align:center;">
              ${qrHtml}
              <div style="font-size:9px; font-family:monospace;">${pecosa.codigoQr || ''}</div>
            </div>
          </div>

          <table class="meta">
            <tr>
              <td class="lbl" style="width:140px;">ÁREA SOLICITANTE</td>
              <td>${pecosa.areaDestino}</td>
              <td class="lbl" style="width:90px;">FECHA</td>
              <td style="width:120px;">${formatearFecha(pecosa.fechaEmision)}</td>
            </tr>
            <tr>
              <td class="lbl">SOLICITANTE</td>
              <td>${pecosa.solicitanteNombre}</td>
              <td class="lbl">PEDIDO Nº</td>
              <td>${pecosa.numeroPedido || '—'}</td>
            </tr>
            <tr>
              <td class="lbl">OBSERVACIONES</td>
              <td>${pecosa.observaciones || '—'}</td>
              <td class="lbl">SALIDA Nº</td>
              <td>${pecosa.numeroSalida || 'Pendiente'}</td>
            </tr>
          </table>

          <table class="tabla">
            <thead>
              <tr>
                <th rowspan="2" style="width:28px;">Nº</th>
                <th colspan="3">SOLICITADO</th>
                <th colspan="3">DESPACHADO</th>
                <th colspan="2">VALOR (S/)</th>
              </tr>
              <tr>
                <th style="width:75px;">CÓD.</th>
                <th>DESCRIPCIÓN</th>
                <th style="width:65px;">CANT.</th>
                <th style="width:70px;">CANT. ENTREG.</th>
                <th style="width:75px;">UND. MEDIDA</th>
                <th style="width:75px;">TIPO BIEN</th>
                <th style="width:70px;">UNIT.</th>
                <th style="width:80px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
              <tr class="total-row">
                <td colspan="8" style="text-align:right;">TOTAL VALORIZADO (PEPS) S/</td>
                <td style="text-align:right;">${Number(pecosa.totalValorizado).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="firmas">
            ${renderFirma('SOLICITANTE', fSol)}
            ${renderFirma('ABASTECIMIENTO', fAbast)}
            ${renderFirma('ALMACÉN', fAlm)}
            ${renderFirma('ADMINISTRADOR', fAdmin)}
          </div>

          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  // Filtrado para la bandeja de acciones pendientes del usuario
  const pendientesAccion = pecosas.filter((p) => {
    if (rolActual === 'SOLICITANTE') {
      return p.estado === 'PENDIENTE_FIRMAS' || p.estado === 'APROBADA';
    }
    return p.requiereMiFirma || p.puedeDespachar;
  });

  const listaVisible = tab === 'bandeja' ? pendientesAccion : pecosas;
  const pagPecosas = usePaginacion(listaVisible, 10);

  return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#064c32]">PECOSA y Documentos por Firmar</h2>
            <p className="text-base text-slate-600 mt-1">
              Emisión de pedidos por área, circuito de 4 firmas digitales y despacho valorizado con método PEPS.
            </p>
          </div>

          {/* Escáner QR de PECOSA */}
          <form onSubmit={buscarPecosaPorQr} className="flex items-center gap-2">
            <div className="relative">
              <QrCode className="w-5 h-5 text-[#064c32] absolute left-3.5 top-3.5" />
              <input
                  type="text"
                  placeholder="Escanear QR o Nº PECOSA..."
                  value={qrBusqueda}
                  onChange={(e) => setQrBusqueda(e.target.value)}
                  className="pl-11 pr-4 py-3 w-72 rounded-xl border-2 border-emerald-700/40 bg-white text-base"
              />
            </div>
            <button
                type="submit"
                className="px-4 py-3 rounded-xl bg-[#064c32] text-white text-base font-semibold hover:bg-[#053b27] cursor-pointer"
            >
              Abrir
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

        {/* Pestañas */}
        <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-3">
          <button
              type="button"
              onClick={() => {
                setTab('bandeja');
                pagPecosas.reiniciarPagina();
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-base font-semibold cursor-pointer ${
                  tab === 'bandeja'
                      ? 'bg-[#064c32] text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
          >
            <FileSignature className="w-5 h-5" />
            {rolActual === 'SOLICITANTE' ? 'Mis PECOSAs en Proceso' : 'Documentos por Firmar / Despachar'}
            <span
                className={`px-2.5 py-0.5 rounded-full text-sm font-bold ${
                    tab === 'bandeja' ? 'bg-lime-400 text-[#064c32]' : 'bg-amber-100 text-amber-800'
                }`}
            >
            {pendientesAccion.length}
          </span>
          </button>

          <button
              type="button"
              onClick={() => setTab('nueva')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-base font-semibold cursor-pointer ${
                  tab === 'nueva'
                      ? 'bg-[#064c32] text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
          >
            <Plus className="w-5 h-5" />
            Nueva Solicitud PECOSA
          </button>

          <button
              type="button"
              onClick={() => {
                setTab('historial');
                pagPecosas.reiniciarPagina();
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-base font-semibold cursor-pointer ${
                  tab === 'historial'
                      ? 'bg-[#064c32] text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
          >
            <History className="w-5 h-5" />
            Historial Completo ({pecosas.length})
          </button>
        </div>

        {/* TAB: NUEVA SOLICITUD PECOSA */}
        {tab === 'nueva' ? (
            <form
                onSubmit={enviarSolicitud}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6"
            >
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-xl font-bold text-slate-900">Rellenar Pedido - Comprobante de Salida (PECOSA)</h3>
                <p className="text-base text-slate-600">
                  Área solicitante actual: <strong className="text-[#064c32]">{usuario?.nombreArea}</strong> ({usuario?.nombreCompleto})
                </p>
              </div>

              {puedeElegirTercero && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-base font-medium text-slate-700 mb-1">
                        Área Destino (opcional, por defecto tu área)
                      </label>
                      <select
                          value={idAreaDestino}
                          onChange={(e) => setIdAreaDestino(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-base"
                      >
                        <option value="">Usar mi área ({usuario?.nombreArea})</option>
                        {areas.map((a) => (
                            <option key={a.idArea} value={a.idArea}>
                              {a.nombre}
                            </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-base font-medium text-slate-700 mb-1">
                        Personal Solicitante (opcional)
                      </label>
                      <select
                          value={idPersonaSolicitante}
                          onChange={(e) => setIdPersonaSolicitante(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-base"
                      >
                        <option value="">Usar mi usuario ({usuario?.nombreCompleto})</option>
                        {personas.map((p) => (
                            <option key={p.idPersona} value={p.idPersona}>
                              {p.nombreCompleto} — {p.nombreArea}
                            </option>
                        ))}
                      </select>
                    </div>
                  </div>
              )}

              {/* Agregar productos */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <p className="text-base font-semibold text-slate-800">Seleccionar Bienes Solicitados</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <ScanBarcode className="w-5 h-5 text-[#064c32] absolute left-3.5 top-3.5" />
                      <input
                          type="text"
                          placeholder="Escanear código QR / barras del bien..."
                          value={codigoProductoEscaner}
                          onChange={(e) => setCodigoProductoEscaner(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEscanerProducto(e);
                          }}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-emerald-700/40 bg-white text-base"
                      />
                    </div>
                    <button
                        type="button"
                        onClick={handleEscanerProducto}
                        className="px-4 py-3 rounded-xl bg-emerald-700 text-white text-base font-semibold cursor-pointer"
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
                      <option value="">Selecciona un bien del catálogo...</option>
                      {productos.map((p) => (
                          <option key={p.idProducto} value={p.idProducto}>
                            {p.codigoInterno} — {p.nombre} (Stock: {Number(p.stockGeneral).toFixed(2)} {p.abreviaturaUnidad || ''})
                          </option>
                      ))}
                    </select>
                    <button
                        type="button"
                        onClick={handleAgregarManual}
                        className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-[#064c32] text-white text-base font-semibold cursor-pointer"
                    >
                      <Plus className="w-5 h-5" /> Agregar
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                  <tr className="bg-slate-100 text-slate-700 text-sm uppercase">
                    <th className="py-3 px-4">Bien Solicitado</th>
                    <th className="py-3 px-4 text-right">Stock Actual</th>
                    <th className="py-3 px-4 w-44">Cantidad Solicitada *</th>
                    <th className="py-3 px-4 w-16"></th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-base">
                  {itemsSolicitud.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500">
                          Aún no has agregado bienes a tu pedido.
                        </td>
                      </tr>
                  ) : (
                      itemsSolicitud.map((it) => (
                          <tr key={it.idProducto}>
                            <td className="py-3 px-4">
                              <div className="font-semibold">{it.nombre}</div>
                              <div className="text-sm text-slate-500">
                                {it.codigoInterno} · {it.unidad}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-slate-700">
                              {Number(it.stockGeneral).toFixed(2)} {it.unidad}
                            </td>
                            <td className="py-3 px-4">
                              <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  required
                                  value={it.cantidadSolicitada}
                                  onChange={(e) =>
                                      setItemsSolicitud((prev) =>
                                          prev.map((row) =>
                                              row.idProducto === it.idProducto
                                                  ? { ...row, cantidadSolicitada: e.target.value }
                                                  : row
                                          )
                                      )
                                  }
                                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-base"
                              />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                  type="button"
                                  onClick={() =>
                                      setItemsSolicitud((prev) => prev.filter((row) => row.idProducto !== it.idProducto))
                                  }
                                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                      ))
                  )}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-base font-medium text-slate-700 mb-1">
                  Justificación / Observaciones del Pedido
                </label>
                <textarea
                    rows={2}
                    placeholder="Ej. Material necesario para prácticas de laboratorio de la semana"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
                />
              </div>

              <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={procesando}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#064c32] hover:bg-[#053b27] disabled:opacity-60 text-white text-lg font-semibold cursor-pointer"
                >
                  <FileSignature className="w-5 h-5" />
                  {procesando ? 'Emitiendo PECOSA...' : 'Firmar como Solicitante y Enviar PECOSA'}
                </button>
              </div>
            </form>
        ) : (
            /* TAB BANDEJA O HISTORIAL */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                {cargando ? (
                    <div className="p-8 text-center text-lg text-slate-600">Cargando documentos PECOSA...</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                      <tr className="bg-[#064c32] text-white text-sm uppercase">
                        <th className="py-3.5 px-4">PECOSA / Fecha</th>
                        <th className="py-3.5 px-4">Área y Solicitante</th>
                        <th className="py-3.5 px-4">Firmas (4)</th>
                        <th className="py-3.5 px-4">Estado</th>
                        <th className="py-3.5 px-4 text-right">Valorizado</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-base">
                      {pagPecosas.itemsPaginados.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-500">
                              {tab === 'bandeja'
                                  ? 'No tienes documentos pendientes por firmar o despachar en este momento.'
                                  : 'Aún no se han emitido PECOSAs.'}
                            </td>
                          </tr>
                      ) : (
                          pagPecosas.itemsPaginados.map((p) => {
                            const badge = BADGE_ESTADO[p.estado] || { texto: p.estado, clase: 'bg-slate-100 text-slate-700' };
                            const firmadasCount = p.firmas.filter((f) => f.estado === 'FIRMADO').length;

                            return (
                                <tr key={p.idPecosa} className="hover:bg-slate-50">
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <div className="font-mono font-bold text-[#064c32]">{p.numeroPecosa}</div>
                                    <div className="text-sm text-slate-500">{formatearFecha(p.fechaEmision)}</div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="font-semibold">{p.areaDestino}</div>
                                    <div className="text-sm text-slate-500">{p.solicitanteNombre}</div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="flex flex-wrap gap-1.5">
                                      {p.firmas.map((f) => (
                                          <span
                                              key={f.idPecosaFirma}
                                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                                  f.estado === 'FIRMADO'
                                                      ? 'bg-emerald-100 text-emerald-800'
                                                      : f.estado === 'RECHAZADO'
                                                          ? 'bg-red-100 text-red-800'
                                                          : 'bg-slate-100 text-slate-500'
                                              }`}
                                          >
                                  {f.rolFirma.slice(0, 5)}.
                                </span>
                                      ))}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">{firmadasCount} de 4 firmadas</div>
                                  </td>
                                  <td className="py-3.5 px-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.clase}`}>
                              {badge.texto}
                            </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                                    {p.estado === 'DESPACHADA' ? `S/ ${Number(p.totalValorizado).toFixed(2)}` : 'Por valorar'}
                                  </td>
                                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                    <button
                                        type="button"
                                        onClick={() => abrirModalPecosa(p)}
                                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
                                            p.requiereMiFirma || p.puedeDespachar
                                                ? 'bg-[#064c32] text-white hover:bg-[#053b27]'
                                                : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                      {p.puedeDespachar ? (
                                          <>
                                            <PackageCheck className="w-4 h-4" /> Despachar PEPS
                                          </>
                                      ) : p.requiereMiFirma ? (
                                          <>
                                            <FileSignature className="w-4 h-4" /> Revisar y Firmar
                                          </>
                                      ) : (
                                          <>
                                            <Eye className="w-4 h-4" /> Ver / Imprimir
                                          </>
                                      )}
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
                  paginaActual={pagPecosas.paginaActual}
                  totalPaginas={pagPecosas.totalPaginas}
                  totalRegistros={pagPecosas.totalRegistros}
                  porPagina={pagPecosas.porPagina}
                  desde={pagPecosas.desde}
                  hasta={pagPecosas.hasta}
                  onCambiarPagina={pagPecosas.irAPagina}
                  onCambiarPorPagina={pagPecosas.cambiarPorPagina}
              />
            </div>
        )}

        {/* MODAL DE DETALLE, FIRMAS, DESPACHO PEPS E IMPRESIÓN */}
        {pecosaActiva && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl space-y-6 max-h-[92vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-2xl font-bold text-[#064c32]">PECOSA Nº {pecosaActiva.numeroPecosa}</h3>
                      <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              (BADGE_ESTADO[pecosaActiva.estado] || {}).clase
                          }`}
                      >
                    {(BADGE_ESTADO[pecosaActiva.estado] || {}).texto || pecosaActiva.estado}
                  </span>
                    </div>
                    <p className="text-base text-slate-600 mt-1">
                      Área: <strong>{pecosaActiva.areaDestino}</strong> · Solicitante:{' '}
                      <strong>{pecosaActiva.solicitanteNombre}</strong>
                    </p>
                    <p className="text-sm text-slate-500">
                      Pedido: {pecosaActiva.numeroPedido} · Salida: {pecosaActiva.numeroSalida || 'Pendiente'} · Emisión:{' '}
                      {formatearFechaHora(pecosaActiva.fechaEmision)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div ref={qrPrintRef} className="p-1.5 border border-slate-200 rounded-lg bg-white">
                      <QRCodeSVG value={pecosaActiva.codigoQr || pecosaActiva.numeroPecosa} size={68} level="M" />
                    </div>
                    <button
                        type="button"
                        onClick={() => setPecosaActiva(null)}
                        className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Circuito de las 4 Firmas */}
                <div>
                  <h4 className="text-base font-bold text-slate-800 mb-3">Circuito de Firmas Oficiales</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {pecosaActiva.firmas.map((f) => (
                        <div
                            key={f.idPecosaFirma}
                            className={`p-3.5 rounded-xl border ${
                                f.estado === 'FIRMADO'
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : f.estado === 'RECHAZADO'
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-slate-50 border-slate-200'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold tracking-wide text-slate-700">{f.rolFirma}</span>
                            {f.estado === 'FIRMADO' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            ) : f.estado === 'RECHAZADO' ? (
                                <XCircle className="w-4 h-4 text-red-700" />
                            ) : (
                                <Clock className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-900">
                            {f.firmanteNombre || 'Pendiente de firma'}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {f.fechaFirma ? formatearFechaHora(f.fechaFirma) : 'En espera'}
                          </p>
                          {f.observacion && <p className="text-xs text-slate-700 mt-1 italic">"{f.observacion}"</p>}
                        </div>
                    ))}
                  </div>
                </div>

                {/* Tabla de ítems (o editor de cantidades si toca Despachar PEPS) */}
                <div>
                  <h4 className="text-base font-bold text-slate-800 mb-2">Detalle de Bienes</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-base">
                      <thead>
                      <tr className="bg-[#064c32] text-white text-sm">
                        <th className="py-2.5 px-3">Bien</th>
                        <th className="py-2.5 px-3 text-right">Solicitado</th>
                        {pecosaActiva.puedeDespachar && <th className="py-2.5 px-3 text-right">Stock Actual</th>}
                        <th className="py-2.5 px-3 text-right">Atendido</th>
                        {pecosaActiva.estado === 'DESPACHADA' && (
                            <>
                              <th className="py-2.5 px-3 text-right">P. Unit. Lote</th>
                              <th className="py-2.5 px-3 text-right">Subtotal</th>
                            </>
                        )}
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                      {pecosaActiva.detalles.map((d) => (
                          <tr key={d.idPecosaDetalle}>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold">{d.nombreProducto}</div>
                              <div className="text-xs text-slate-500">
                                {d.codigoInterno} · {d.unidadMedida}
                                {d.idLote ? ` · Lote #${d.idLote}` : ''}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {Number(d.cantidadSolicitada) > 0 ? Number(d.cantidadSolicitada).toFixed(2) : '—'}
                            </td>
                            {pecosaActiva.puedeDespachar && (
                                <td className="py-2.5 px-3 text-right font-medium text-emerald-800">
                                  {Number(d.stockActualProducto).toFixed(2)}
                                </td>
                            )}
                            <td className="py-2.5 px-3 text-right">
                              {pecosaActiva.puedeDespachar ? (
                                  <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max={Math.min(Number(d.cantidadSolicitada), Number(d.stockActualProducto))}
                                      value={cantidadesDespacho[d.idProducto] ?? '0.00'}
                                      onChange={(e) =>
                                          setCantidadesDespacho((prev) => ({
                                            ...prev,
                                            [d.idProducto]: e.target.value,
                                          }))
                                      }
                                      className="w-28 px-2.5 py-1.5 rounded-lg border-2 border-[#064c32] text-right font-semibold"
                                  />
                              ) : (
                                  <span className="font-semibold">{Number(d.cantidadAtendida).toFixed(2)}</span>
                              )}
                            </td>
                            {pecosaActiva.estado === 'DESPACHADA' && (
                                <>
                                  <td className="py-2.5 px-3 text-right">S/ {Number(d.precioUnitarioHistorico).toFixed(2)}</td>
                                  <td className="py-2.5 px-3 text-right font-bold">S/ {Number(d.subtotal).toFixed(2)}</td>
                                </>
                            )}
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                  {pecosaActiva.estado === 'DESPACHADA' && (
                      <div className="text-right mt-3 text-xl font-bold text-[#064c32]">
                        Total Salida Valorizada (PEPS): S/ {Number(pecosaActiva.totalValorizado).toFixed(2)}
                      </div>
                  )}
                </div>

                {/* Zona de acción: Firmar, Rechazar o Despachar PEPS */}
                {(pecosaActiva.requiereMiFirma || pecosaActiva.puedeDespachar) && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <label className="block text-base font-semibold text-slate-800">
                        Observación / Nota de firma o despacho (obligatoria solo si rechazas)
                      </label>
                      <input
                          type="text"
                          placeholder="Ej. Conforme para despacho / Stock parcial entregado..."
                          value={obsAccion}
                          onChange={(e) => setObsAccion(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-base"
                      />
                      <div className="flex flex-wrap gap-3 pt-1">
                        {pecosaActiva.requiereMiFirma && (
                            <>
                              <button
                                  type="button"
                                  disabled={procesando}
                                  onClick={() => ejecutarFirma(true)}
                                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#064c32] hover:bg-[#053b27] text-white text-base font-semibold cursor-pointer"
                              >
                                <CheckCircle2 className="w-5 h-5" /> Firmar y Aprobar ({rolActual})
                              </button>
                              <button
                                  type="button"
                                  disabled={procesando}
                                  onClick={() => ejecutarFirma(false)}
                                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-base font-semibold cursor-pointer"
                              >
                                <XCircle className="w-5 h-5" /> Rechazar PECOSA
                              </button>
                            </>
                        )}

                        {pecosaActiva.puedeDespachar && (
                            <>
                              <button
                                  type="button"
                                  disabled={procesando}
                                  onClick={ejecutarDespachoPeps}
                                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#064c32] hover:bg-[#053b27] text-white text-base font-semibold cursor-pointer"
                              >
                                <PackageCheck className="w-5 h-5" />
                                {procesando ? 'Ejecutando PEPS...' : 'Firmar Almacén y Despachar (PEPS)'}
                              </button>
                              <button
                                  type="button"
                                  disabled={procesando}
                                  onClick={() => ejecutarFirma(false)}
                                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-base font-semibold cursor-pointer"
                              >
                                <XCircle className="w-5 h-5" /> Rechazar
                              </button>
                            </>
                        )}
                      </div>
                    </div>
                )}

                {/* Pie del modal */}
                <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                  <button
                      type="button"
                      onClick={() => imprimirPecosaOficial(pecosaActiva)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#064c32] text-[#064c32] hover:bg-emerald-50 text-base font-semibold cursor-pointer"
                  >
                    <Printer className="w-5 h-5" /> Imprimir Formato PECOSA
                  </button>
                  <button
                      type="button"
                      onClick={() => setPecosaActiva(null)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-base font-medium cursor-pointer"
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