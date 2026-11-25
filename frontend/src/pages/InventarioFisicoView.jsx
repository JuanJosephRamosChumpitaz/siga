import { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Save,
  Lock,
  ScanBarcode,
  AlertCircle,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { reporteService } from '../services/reporteService';
import { usePaginacion } from '../hooks/usepaginacion';
import Paginacion from '../components/ui/paginacion';

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

export default function InventarioFisicoView() {
  const [sesiones, setSesiones] = useState([]);
  const [sesionActiva, setSesionActiva] = useState(null);
  const [conteos, setConteos] = useState({});
  const [obsNuevaSesion, setObsNuevaSesion] = useState('');
  const [aplicarAjustes, setAplicarAjustes] = useState(true);
  const [codigoEscaner, setCodigoEscaner] = useState('');

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const pagSesiones = usePaginacion(sesiones, 8);
  const pagDetalles = usePaginacion(sesionActiva?.detalles || [], 15);

  const seleccionarSesion = (sesion) => {
    setSesionActiva(sesion);
    pagDetalles.reiniciarPagina();
    if (!sesion) return;
    const mapa = {};
    sesion.detalles.forEach((d) => {
      mapa[d.idProducto] = {
        stockFisico: String(Number(d.stockFisico).toFixed(2)),
        observacion: d.observacion || '',
      };
    });
    setConteos(mapa);
  };

  const cargarSesiones = async (idSeleccionar = null) => {
    setCargando(true);
    setError('');
    try {
      const data = await reporteService.listarInventarios();
      setSesiones(data);
      if (idSeleccionar) {
        const encontrada = data.find((s) => s.idInventarioFisico === idSeleccionar);
        seleccionarSesion(encontrada || data[0] || null);
      } else if (!sesionActiva && data.length > 0) {
        seleccionarSesion(data[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar las sesiones de inventario.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSesiones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notificar = (texto) => {
    setMensaje(texto);
    setError('');
    setTimeout(() => setMensaje(''), 4500);
  };

  const iniciarNuevaSesion = async (e) => {
    e.preventDefault();
    setProcesando(true);
    setError('');
    try {
      const creada = await reporteService.iniciarInventario({ observaciones: obsNuevaSesion.trim() || null });
      setObsNuevaSesion('');
      notificar(`Sesión ${creada.codigo} iniciada con ${creada.totalProductos} productos.`);
      await cargarSesiones(creada.idInventarioFisico);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar la sesión de inventario.');
    } finally {
      setProcesando(false);
    }
  };

  const sumarConEscaner = (e) => {
    e.preventDefault();
    if (!sesionActiva || sesionActiva.estado !== 'EN_PROCESO' || !codigoEscaner.trim()) return;
    const codigo = codigoEscaner.trim().toLowerCase();
    const match = sesionActiva.detalles.find(
        (d) =>
            (d.codigoBarra || '').toLowerCase() === codigo ||
            (d.codigoInterno || '').toLowerCase() === codigo
    );
    if (!match) {
      setError(`Código "${codigoEscaner}" no encontrado en esta sesión de conteo.`);
      return;
    }
    setError('');
    setConteos((prev) => {
      const actual = prev[match.idProducto] || { stockFisico: '0.00', observacion: '' };
      const nuevoValor = (Number(actual.stockFisico || 0) + 1).toFixed(2);
      return { ...prev, [match.idProducto]: { ...actual, stockFisico: nuevoValor } };
    });
    notificar(`+1 contado en ${match.nombreProducto}`);
    setCodigoEscaner('');
  };

  const guardarAvance = async () => {
    if (!sesionActiva) return;
    setProcesando(true);
    setError('');
    try {
      const items = sesionActiva.detalles.map((d) => ({
        idProducto: d.idProducto,
        stockFisico: Number(conteos[d.idProducto]?.stockFisico ?? d.stockFisico),
        observacion: conteos[d.idProducto]?.observacion || null,
      }));
      const actualizada = await reporteService.guardarConteo(sesionActiva.idInventarioFisico, { items });
      notificar('Conteo físico guardado correctamente.');
      await cargarSesiones(actualizada.idInventarioFisico);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el conteo.');
    } finally {
      setProcesando(false);
    }
  };

  const cerrarYConciliar = async () => {
    if (!sesionActiva) return;
    setProcesando(true);
    setError('');
    try {
      // Primero guarda cualquier cambio pendiente en pantalla (todos los productos, no solo la página visible)
      const items = sesionActiva.detalles.map((d) => ({
        idProducto: d.idProducto,
        stockFisico: Number(conteos[d.idProducto]?.stockFisico ?? d.stockFisico),
        observacion: conteos[d.idProducto]?.observacion || null,
      }));
      await reporteService.guardarConteo(sesionActiva.idInventarioFisico, { items });

      const cerrada = await reporteService.cerrarInventario(sesionActiva.idInventarioFisico, {
        aplicarAjustes,
        observaciones: sesionActiva.observaciones,
      });
      notificar(
          aplicarAjustes
              ? `Inventario ${cerrada.codigo} cerrado y ajustes aplicados en Lotes y Kardex.`
              : `Inventario ${cerrada.codigo} cerrado solo como reporte (sin modificar stock).`
      );
      await cargarSesiones(cerrada.idInventarioFisico);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cerrar el inventario físico.');
    } finally {
      setProcesando(false);
    }
  };

  return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-[#064c32]">Inventario Físico y Conciliación</h2>
          <p className="text-base text-slate-600 mt-1">
            Compara el stock del sistema contra el conteo físico en almacén, detecta sobrantes o faltantes y ajusta el Kardex.
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

        {/* Iniciar nueva sesión */}
        <form
            onSubmit={iniciarNuevaSesion}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-end"
        >
          <div className="flex-1 w-full">
            <label className="block text-base font-medium text-slate-700 mb-1">
              Iniciar Nueva Toma de Inventario Físico
            </label>
            <input
                type="text"
                placeholder="Observación inicial (ej. Conteo trimestral - Almacén Central)"
                value={obsNuevaSesion}
                onChange={(e) => setObsNuevaSesion(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
            />
          </div>
          <button
              type="submit"
              disabled={procesando}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#064c32] hover:bg-[#053b27] text-white text-base font-semibold cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> Nueva Sesión de Conteo
          </button>
        </form>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          {/* Lista de sesiones */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 bg-[#064c32] text-white font-semibold text-base flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" /> Sesiones ({sesiones.length})
            </div>
            <div className="divide-y divide-slate-200">
              {cargando ? (
                  <div className="p-6 text-center text-slate-500">Cargando...</div>
              ) : pagSesiones.itemsPaginados.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">Aún no hay inventarios registrados.</div>
              ) : (
                  pagSesiones.itemsPaginados.map((s) => (
                      <button
                          key={s.idInventarioFisico}
                          type="button"
                          onClick={() => seleccionarSesion(s)}
                          className={`w-full text-left p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                              sesionActiva?.idInventarioFisico === s.idInventarioFisico ? 'bg-emerald-50 border-l-4 border-[#064c32]' : ''
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#064c32]">{s.codigo}</span>
                          <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  s.estado === 'EN_PROCESO'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                              }`}
                          >
                      {s.estado}
                    </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{formatearFechaHora(s.fechaInicio)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {s.totalProductos} bienes · {s.totalConDiferencia} con diferencia
                        </p>
                      </button>
                  ))
              )}
            </div>

            {pagSesiones.totalPaginas > 1 && (
                <Paginacion
                    paginaActual={pagSesiones.paginaActual}
                    totalPaginas={pagSesiones.totalPaginas}
                    totalRegistros={pagSesiones.totalRegistros}
                    porPagina={pagSesiones.porPagina}
                    desde={pagSesiones.desde}
                    hasta={pagSesiones.hasta}
                    onCambiarPagina={pagSesiones.irAPagina}
                />
            )}
          </div>

          {/* Detalle de la sesión seleccionada */}
          <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {!sesionActiva ? (
                <div className="p-10 text-center text-lg text-slate-500 flex flex-col items-center gap-2">
                  <Eye className="w-8 h-8 text-slate-400" />
                  Selecciona o inicia una sesión de inventario físico para registrar el conteo.
                </div>
            ) : (
                <div className="p-6 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-[#064c32]">Sesión {sesionActiva.codigo}</h3>
                      <p className="text-sm text-slate-600">
                        Responsable: <strong>{sesionActiva.responsableNombre}</strong> · Inicio:{' '}
                        {formatearFechaHora(sesionActiva.fechaInicio)}
                        {sesionActiva.fechaCierre ? ` · Cierre: ${formatearFechaHora(sesionActiva.fechaCierre)}` : ''}
                      </p>
                    </div>

                    {sesionActiva.estado === 'EN_PROCESO' && (
                        <form onSubmit={sumarConEscaner} className="flex gap-2">
                          <div className="relative">
                            <ScanBarcode className="w-5 h-5 text-[#064c32] absolute left-3 top-3" />
                            <input
                                type="text"
                                placeholder="Escanear bien (+1)..."
                                value={codigoEscaner}
                                onChange={(e) => setCodigoEscaner(e.target.value)}
                                className="pl-10 pr-3 py-2.5 w-60 rounded-xl border-2 border-emerald-700/40 text-base"
                            />
                          </div>
                          <button
                              type="submit"
                              className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-semibold cursor-pointer"
                          >
                            +1
                          </button>
                        </form>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-base">
                        <thead>
                        <tr className="bg-[#064c32] text-white text-sm uppercase">
                          <th className="py-3 px-4">Bien / Cuenta</th>
                          <th className="py-3 px-4 text-right">Stock Sistema</th>
                          <th className="py-3 px-4 text-right w-36">Stock Físico</th>
                          <th className="py-3 px-4 text-right">Diferencia</th>
                          <th className="py-3 px-4">Observación</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                        {pagDetalles.itemsPaginados.map((d) => {
                          const edit = conteos[d.idProducto] || {
                            stockFisico: String(d.stockFisico),
                            observacion: d.observacion || '',
                          };
                          const fisicoNum = Number(edit.stockFisico || 0);
                          const diffNum = fisicoNum - Number(d.stockSistema || 0);

                          return (
                              <tr key={d.idInventarioDetalle} className="hover:bg-slate-50">
                                <td className="py-3 px-4">
                                  <div className="font-semibold">{d.nombreProducto}</div>
                                  <div className="text-xs text-slate-500">
                                    {d.codigoInterno} · Cta. {d.codigoCuenta || '—'} · {d.unidadMedida}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right font-medium">{Number(d.stockSistema).toFixed(2)}</td>
                                <td className="py-3 px-4 text-right">
                                  {sesionActiva.estado === 'EN_PROCESO' ? (
                                      <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={edit.stockFisico}
                                          onChange={(e) =>
                                              setConteos((prev) => ({
                                                ...prev,
                                                [d.idProducto]: { ...edit, stockFisico: e.target.value },
                                              }))
                                          }
                                          className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-300 text-right font-semibold"
                                      />
                                  ) : (
                                      <span className="font-semibold">{Number(d.stockFisico).toFixed(2)}</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right font-bold">
                              <span
                                  className={
                                    diffNum > 0
                                        ? 'text-emerald-700'
                                        : diffNum < 0
                                            ? 'text-red-700'
                                            : 'text-slate-500'
                                  }
                              >
                                {diffNum > 0 ? `+${diffNum.toFixed(2)}` : diffNum.toFixed(2)}
                              </span>
                                </td>
                                <td className="py-3 px-4">
                                  {sesionActiva.estado === 'EN_PROCESO' ? (
                                      <input
                                          type="text"
                                          placeholder="Motivo si hay diferencia..."
                                          value={edit.observacion}
                                          onChange={(e) =>
                                              setConteos((prev) => ({
                                                ...prev,
                                                [d.idProducto]: { ...edit, observacion: e.target.value },
                                              }))
                                          }
                                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                                      />
                                  ) : (
                                      <span className="text-sm text-slate-600">{d.observacion || '—'}</span>
                                  )}
                                </td>
                              </tr>
                          );
                        })}
                        </tbody>
                      </table>
                    </div>

                    <Paginacion
                        paginaActual={pagDetalles.paginaActual}
                        totalPaginas={pagDetalles.totalPaginas}
                        totalRegistros={pagDetalles.totalRegistros}
                        porPagina={pagDetalles.porPagina}
                        desde={pagDetalles.desde}
                        hasta={pagDetalles.hasta}
                        onCambiarPagina={pagDetalles.irAPagina}
                        onCambiarPorPagina={pagDetalles.cambiarPorPagina}
                    />
                  </div>

                  {sesionActiva.estado === 'EN_PROCESO' && (
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="flex items-center gap-2.5 text-base font-medium text-slate-800 cursor-pointer">
                          <input
                              type="checkbox"
                              checked={aplicarAjustes}
                              onChange={(e) => setAplicarAjustes(e.target.checked)}
                              className="w-5 h-5 accent-[#064c32]"
                          />
                          Aplicar ajustes automáticos (sobrantes/faltantes) en Lotes y Kardex al cerrar
                        </label>

                        <div className="flex gap-3">
                          <button
                              type="button"
                              disabled={procesando}
                              onClick={guardarAvance}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#064c32] text-[#064c32] hover:bg-emerald-50 text-base font-semibold cursor-pointer"
                          >
                            <Save className="w-5 h-5" /> Guardar Avance
                          </button>
                          <button
                              type="button"
                              disabled={procesando}
                              onClick={cerrarYConciliar}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#064c32] hover:bg-[#053b27] text-white text-base font-semibold cursor-pointer"
                          >
                            <Lock className="w-5 h-5" /> Cerrar Inventario
                          </button>
                        </div>
                      </div>
                  )}
                </div>
            )}
          </div>
        </div>
      </div>
  );
}