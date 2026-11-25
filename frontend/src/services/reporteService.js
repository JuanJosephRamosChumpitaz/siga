import api from './api';

export const reporteService = {
    // Dashboard
    obtenerDashboard: async () => {
        const { data } = await api.get('/dashboard/resumen');
        return data;
    },

    // Kardex y Control Visible
    consultarKardex: async (idProducto, desde, hasta) => {
        const params = {};
        if (desde) params.desde = desde;
        if (hasta) params.hasta = hasta;
        const { data } = await api.get(`/kardex/producto/${idProducto}`, { params });
        return data;
    },

    // Inventario Físico
    listarInventarios: async () => {
        const { data } = await api.get('/inventarios-fisicos');
        return data;
    },
    iniciarInventario: async (payload) => {
        const { data } = await api.post('/inventarios-fisicos', payload);
        return data;
    },
    guardarConteo: async (id, payload) => {
        const { data } = await api.put(`/inventarios-fisicos/${id}/conteo`, payload);
        return data;
    },
    cerrarInventario: async (id, payload) => {
        const { data } = await api.post(`/inventarios-fisicos/${id}/cerrar`, payload);
        return data;
    },

    // Reportes Oficiales
    inventarioValorizado: async () => {
        const { data } = await api.get('/reportes/inventario-valorizado');
        return data;
    },
    resumenCuentas: async () => {
        const { data } = await api.get('/reportes/resumen-cuentas');
        return data;
    },
    consumoAreas: async (desde, hasta) => {
        const params = {};
        if (desde) params.desde = desde;
        if (hasta) params.hasta = hasta;
        const { data } = await api.get('/reportes/consumo-areas', { params });
        return data;
    },

    // Auditoría
    listarAuditoria: async () => {
        const { data } = await api.get('/auditoria');
        return data;
    },
};