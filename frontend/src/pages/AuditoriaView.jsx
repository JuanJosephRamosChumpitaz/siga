import { useEffect, useState } from 'react';
import { ShieldCheck, Search, AlertCircle } from 'lucide-react';
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
    second: '2-digit',
  });
}

export default function AuditoriaView() {
  const [registros, setRegistros] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [modulo, setModulo] = useState('TODOS');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    reporteService
        .listarAuditoria()
        .then((data) => setRegistros(data))
        .catch((err) => setError(err.response?.data?.message || 'No se pudo cargar la bitácora de auditoría.'))
        .finally(() => setCargando(false));
  }, []);

  const modulosDisponibles = ['TODOS', ...new Set(registros.map((r) => r.modulo))];

  const filtrados = registros.filter((r) => {
    if (modulo !== 'TODOS' && r.modulo !== modulo) return false;
    if (!filtro.trim()) return true;
    const q = filtro.toLowerCase();
    return (
        (r.usuario || '').toLowerCase().includes(q) ||
        (r.accion || '').toLowerCase().includes(q) ||
        (r.detalle || '').toLowerCase().includes(q)
    );
  });

  const pag = usePaginacion(filtrados, 15);

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-[#064c32]" />
          <div>
            <h2 className="text-3xl font-bold text-[#064c32]">Trazabilidad y Auditoría</h2>
            <p className="text-base text-slate-600">
              Registro cronológico inmutable de ingresos NEA, firmas PECOSA, despachos PEPS e inventarios físicos.
            </p>
          </div>
        </div>

        {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-base">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
        )}

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
                type="text"
                placeholder="Buscar por usuario, acción o detalle..."
                value={filtro}
                onChange={(e) => {
                  setFiltro(e.target.value);
                  pag.reiniciarPagina();
                }}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-base"
            />
          </div>
          <select
              value={modulo}
              onChange={(e) => {
                setModulo(e.target.value);
                pag.reiniciarPagina();
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base"
          >
            {modulosDisponibles.map((m) => (
                <option key={m} value={m}>
                  {m === 'TODOS' ? 'Todos los módulos' : m}
                </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            {cargando ? (
                <div className="p-8 text-center text-lg text-slate-500">Cargando bitácora...</div>
            ) : (
                <table className="w-full text-left border-collapse text-base">
                  <thead>
                  <tr className="bg-[#064c32] text-white text-sm uppercase">
                    <th className="py-3.5 px-4">Fecha y Hora</th>
                    <th className="py-3.5 px-4">Usuario</th>
                    <th className="py-3.5 px-4">Módulo</th>
                    <th className="py-3.5 px-4">Acción</th>
                    <th className="py-3.5 px-4">Detalle</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                  {pag.itemsPaginados.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No existen registros de auditoría para este filtro.
                        </td>
                      </tr>
                  ) : (
                      pag.itemsPaginados.map((r) => (
                          <tr key={r.idAuditoria} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 font-mono text-sm whitespace-nowrap">
                              {formatearFechaHora(r.fecha)}
                            </td>
                            <td className="py-3.5 px-4 font-semibold">{r.usuario}</td>
                            <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#064c32] text-xs font-bold">
                          {r.modulo}
                        </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-sm">{r.accion}</td>
                            <td className="py-3.5 px-4 text-slate-700">{r.detalle}</td>
                          </tr>
                      ))
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
  );
}