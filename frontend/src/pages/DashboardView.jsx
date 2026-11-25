import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  PackageX,
  CalendarClock,
  FileSignature,
  Plus,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useAuth } from '../context/auth';
import { reporteService } from '../services/reporteService';

export default function DashboardView() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    reporteService
        .obtenerDashboard()
        .then((data) => setResumen(data))
        .catch((err) => setError(err.response?.data?.message || 'No se pudo cargar el panel principal.'))
        .finally(() => setCargando(false));
  }, []);

  const rol = (resumen?.rol || usuario?.rol || 'SOLICITANTE').toUpperCase();
  const esSolicitante = rol === 'SOLICITANTE';
  const gestionaAlmacen = rol === 'ADMIN' || rol === 'ALMACENERO';

  if (cargando) {
    return (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center text-lg text-slate-600">
          Cargando indicadores en tiempo real...
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-base">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
        )}

        {/* Encabezado institucional */}
        <div className="bg-[#064c32] text-white rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-sm">
          <div>
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-100 text-xs font-semibold tracking-wide mb-2">
            IESTP CAÑETE · VALUACIÓN PEPS (PRIMERAS ENTRADAS, PRIMERAS SALIDAS)
          </span>
            <h2 className="text-3xl font-bold">
              {esSolicitante
                  ? `Panel de Área — ${resumen?.nombreArea || usuario?.nombreArea}`
                  : 'Panel de Control — Almacén Central'}
            </h2>
            <p className="text-emerald-100 text-base mt-1">
              {esSolicitante
                  ? 'Emite nuevas solicitudes PECOSA y haz seguimiento al estado de firmas y despacho de tu área.'
                  : 'Control patrimonial, ingresos NEA, salidas PECOSA con 4 firmas y Kardex físico valorizado.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {gestionaAlmacen && (
                <button
                    type="button"
                    onClick={() => navigate('/movimientos')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-[#064c32] text-base font-bold cursor-pointer"
                >
                  <Plus className="w-5 h-5" /> Nueva Entrada (NEA)
                </button>
            )}
            <button
                type="button"
                onClick={() => navigate('/solicitudes')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-base font-semibold cursor-pointer"
            >
              <FileSignature className="w-5 h-5" />
              {esSolicitante
                  ? `Mis PECOSAs (${resumen?.pecosasEnProcesoTotal ?? 0})`
                  : `Por Firmar / Despachar (${resumen?.pecosasPendientesAccion ?? 0})`}
            </button>
          </div>
        </div>

        {/* Vista simplificada para Áreas Solicitantes */}
        {esSolicitante ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                  type="button"
                  onClick={() => navigate('/solicitudes')}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left hover:border-[#064c32] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase text-slate-500">PECOSAs de tu Área en Proceso</span>
                  <FileSignature className="w-7 h-7 text-[#064c32]" />
                </div>
                <p className="text-4xl font-bold text-slate-900 mt-3">{resumen?.pecosasEnProcesoTotal ?? 0}</p>
                <p className="text-base text-emerald-700 font-medium mt-2">
                  Ir a bandeja de PECOSAs y estado de las 4 firmas →
                </p>
              </button>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase text-slate-500">Bienes Activos en Almacén</span>
                  <Package className="w-7 h-7 text-[#064c32]" />
                </div>
                <p className="text-4xl font-bold text-slate-900 mt-3">{resumen?.totalProductosActivos ?? 0}</p>
                <p className="text-base text-slate-600 mt-2">
                  Disponibles para solicitar en tu próximo pedido PECOSA.
                </p>
              </div>
            </div>
        ) : (
            <>
              {/* KPIs principales para ADMIN / ALMACENERO / ABASTECIMIENTO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Total Bienes Activos</span>
                    <Package className="w-6 h-6 text-[#064c32]" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{resumen?.totalProductosActivos ?? 0} ítems</p>
                  <p className="text-sm text-slate-500 mt-1">Catálogo institucional</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Valorización Total (PEPS)</span>
                    <DollarSign className="w-6 h-6 text-[#064c32]" />
                  </div>
                  <p className="text-3xl font-bold text-[#064c32] mt-2">
                    S/ {Number(resumen?.valorizacionTotalPeps ?? 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Saldo vigente por lotes</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Ingresos del Mes</span>
                    <ArrowDownCircle className="w-6 h-6 text-emerald-700" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    S/ {Number(resumen?.ingresosMes ?? 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Notas de Entrada (NEA)</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Salidas del Mes</span>
                    <ArrowUpCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    S/ {Number(resumen?.salidasMes ?? 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Despachos PECOSA</p>
                </div>
              </div>

              {/* Alertas operativas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                    type="button"
                    onClick={() => navigate('/solicitudes')}
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-amber-100/70 cursor-pointer"
                >
                  <FileSignature className="w-7 h-7 text-amber-700 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Pendientes de tu Acción</p>
                    <p className="text-2xl font-bold text-amber-800">{resumen?.pecosasPendientesAccion ?? 0} PECOSA(s)</p>
                  </div>
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/reportes')}
                    className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-red-100/70 cursor-pointer"
                >
                  <AlertTriangle className="w-7 h-7 text-red-700 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Stock Crítico / Mínimo</p>
                    <p className="text-2xl font-bold text-red-700">{resumen?.stockCriticoCount ?? 0} bien(es)</p>
                  </div>
                </button>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                  <PackageX className="w-7 h-7 text-slate-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Sin Existencias</p>
                    <p className="text-2xl font-bold text-slate-900">{resumen?.sinExistenciasCount ?? 0} bien(es)</p>
                  </div>
                </div>

                <button
                    type="button"
                    onClick={() => navigate(gestionaAlmacen ? '/movimientos' : '/reportes')}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 text-left hover:border-amber-400 cursor-pointer"
                >
                  <CalendarClock className="w-7 h-7 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Lotes por Vencer (≤30d)</p>
                    <p className="text-2xl font-bold text-slate-900">{resumen?.lotesPorVencerCount ?? 0} lote(s)</p>
                  </div>
                </button>
              </div>

              {/* Gráficos y distribución contable reales */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900">Evolución de Movimientos Valorizados (S/)</h3>
                  <p className="text-sm text-slate-500 mb-4">Ingresos NEA vs. Salidas PECOSA en los últimos 6 meses</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={resumen?.evolucionMensual || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip formatter={(val) => `S/ ${Number(val).toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="ingresos" name="Ingresos (S/)" fill="#064c32" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="salidas" name="Salidas (S/)" fill="#dc2626" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900">Valor por Cuenta Contable</h3>
                  <p className="text-sm text-slate-500 mb-4">Existencias valorizadas PEPS</p>
                  {(!resumen?.distribucionCuentas || resumen.distribucionCuentas.length === 0) ? (
                      <p className="text-base text-slate-500 py-10 text-center">
                        Aún no hay existencias valorizadas registradas.
                      </p>
                  ) : (
                      <div className="space-y-3">
                        {resumen.distribucionCuentas.map((c) => {
                          const pct =
                              Number(resumen.valorizacionTotalPeps) > 0
                                  ? (Number(c.valorTotalPeps) / Number(resumen.valorizacionTotalPeps)) * 100
                                  : 0;
                          return (
                              <div key={c.codigoCuenta} className="space-y-1">
                                <div className="flex justify-between text-sm">
                          <span className="font-semibold text-slate-800 truncate pr-2">
                            {c.codigoCuenta} · {c.nombreCuenta}
                          </span>
                                  <span className="font-bold text-[#064c32] whitespace-nowrap">
                            S/ {Number(c.valorTotalPeps).toFixed(2)}
                          </span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#064c32] rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                                </div>
                              </div>
                          );
                        })}
                      </div>
                  )}
                </div>
              </div>
            </>
        )}
      </div>
  );
}