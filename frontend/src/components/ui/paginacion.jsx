import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

function calcularPaginasVisibles(paginaActual, totalPaginas) {
    if (totalPaginas <= 7) {
        return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }

    const paginas = [1];
    const inicio = Math.max(2, paginaActual - 1);
    const fin = Math.min(totalPaginas - 1, paginaActual + 1);

    if (inicio > 2) paginas.push('...');
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    if (fin < totalPaginas - 1) paginas.push('...');

    paginas.push(totalPaginas);
    return paginas;
}

export default function Paginacion({
                                       paginaActual,
                                       totalPaginas,
                                       totalRegistros,
                                       porPagina,
                                       desde,
                                       hasta,
                                       onCambiarPagina,
                                       onCambiarPorPagina,
                                       opcionesPorPagina = [10, 15, 25, 50],
                                   }) {
    if (totalRegistros === 0) return null;

    const paginas = calcularPaginasVisibles(paginaActual, totalPaginas);

    return (
        <div className="px-4 py-3.5 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span>
          Mostrando <strong className="text-slate-900">{desde}</strong>–
          <strong className="text-slate-900">{hasta}</strong> de{' '}
            <strong className="text-slate-900">{totalRegistros}</strong> registros
        </span>

                {onCambiarPorPagina && (
                    <label className="flex items-center gap-1.5">
                        <span>Ver:</span>
                        <select
                            value={porPagina}
                            onChange={(e) => onCambiarPorPagina(Number(e.target.value))}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                        >
                            {opcionesPorPagina.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    disabled={paginaActual <= 1}
                    onClick={() => onCambiarPagina(1)}
                    title="Primera página"
                    className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>

                <button
                    type="button"
                    disabled={paginaActual <= 1}
                    onClick={() => onCambiarPagina(paginaActual - 1)}
                    title="Página anterior"
                    className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {paginas.map((item, idx) =>
                        item === '...' ? (
                            <span key={`dots-${idx}`} className="px-2 text-slate-400 select-none">
              ...
            </span>
                        ) : (
                            <button
                                key={item}
                                type="button"
                                onClick={() => onCambiarPagina(item)}
                                className={`min-w-9 h-9 px-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                                    item === paginaActual
                                        ? 'bg-[#064c32] text-white shadow-sm'
                                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                {item}
                            </button>
                        )
                )}

                <button
                    type="button"
                    disabled={paginaActual >= totalPaginas}
                    onClick={() => onCambiarPagina(paginaActual + 1)}
                    title="Página siguiente"
                    className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                <button
                    type="button"
                    disabled={paginaActual >= totalPaginas}
                    onClick={() => onCambiarPagina(totalPaginas)}
                    title="Última página"
                    className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}