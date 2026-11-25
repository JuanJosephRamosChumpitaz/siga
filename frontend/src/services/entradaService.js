import api from './api';

export const entradaService = {
    listarNotasEntrada: async () => {
        const { data } = await api.get('/notas-entrada');
        return data;
    },
    obtenerNotaEntrada: async (id) => {
        const { data } = await api.get(`/notas-entrada/${id}`);
        return data;
    },
    registrarNotaEntrada: async (payload) => {
        const { data } = await api.post('/notas-entrada', payload);
        return data;
    },
    listarLotes: async (soloConStock = false) => {
        const { data } = await api.get('/lotes', { params: { soloConStock } });
        return data;
    },
};