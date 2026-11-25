import { useMemo, useState } from 'react';

export function usePaginacion(items = [], inicialPorPagina = 10) {
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(inicialPorPagina);

    const totalRegistros = items.length;
    const totalPaginas = Math.max(1, Math.ceil(totalRegistros / porPagina));
    const paginaActual = Math.min(Math.max(1, pagina), totalPaginas);

    const itemsPaginados = useMemo(() => {
        const inicio = (paginaActual - 1) * porPagina;
        return items.slice(inicio, inicio + porPagina);
    }, [items, paginaActual, porPagina]);

    const desde = totalRegistros === 0 ? 0 : (paginaActual - 1) * porPagina + 1;
    const hasta = Math.min(paginaActual * porPagina, totalRegistros);

    const irAPagina = (nuevaPagina) => {
        const valida = Math.min(Math.max(1, nuevaPagina), totalPaginas);
        setPagina(valida);
    };

    const cambiarPorPagina = (nuevaCantidad) => {
        setPorPagina(Number(nuevaCantidad));
        setPagina(1);
    };

    const reiniciarPagina = () => setPagina(1);

    return {
        itemsPaginados,
        paginaActual,
        totalPaginas,
        totalRegistros,
        porPagina,
        desde,
        hasta,
        irAPagina,
        cambiarPorPagina,
        reiniciarPagina,
    };
}