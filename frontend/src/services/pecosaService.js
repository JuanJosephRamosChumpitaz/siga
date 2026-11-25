import api from './api';

export const pecosaService = {
    listar: async () => {
        const { data } = await api.get('/pecosas');
        return data;
    },
    obtenerPorId: async (id) => {
        const { data } = await api.get(`/pecosas/${id}`);
        return data;
    },
    buscarPorQr: async (codigo) => {
        const { data } = await api.get(`/pecosas/buscar-qr/${encodeURIComponent(codigo)}`);
        return data;
    },
    crear: async (payload) => {
        const { data } = await api.post('/pecosas', payload);
        return data;
    },
    firmar: async (id, payload) => {
        const { data } = await api.post(`/pecosas/${id}/firmar`, payload);
        return data;
    },
    despachar: async (id, payload) => {
        const { data } = await api.post(`/pecosas/${id}/despachar`, payload);
        return data;
    },
};