import api from './api';

export const administracionService = {
    // Áreas
    listarAreas: async (soloActivas = false) => {
        const { data } = await api.get('/areas', { params: { soloActivas } });
        return data;
    },
    crearArea: async (payload) => {
        const { data } = await api.post('/areas', payload);
        return data;
    },
    actualizarArea: async (id, payload) => {
        const { data } = await api.put(`/areas/${id}`, payload);
        return data;
    },
    cambiarEstadoArea: async (id, activo) => {
        const { data } = await api.patch(`/areas/${id}/estado`, null, { params: { activo } });
        return data;
    },

    // Personas
    listarPersonas: async () => {
        const { data } = await api.get('/personas');
        return data;
    },
    crearPersona: async (payload) => {
        const { data } = await api.post('/personas', payload);
        return data;
    },
    actualizarPersona: async (id, payload) => {
        const { data } = await api.put(`/personas/${id}`, payload);
        return data;
    },
    cambiarEstadoPersona: async (id, activo) => {
        const { data } = await api.patch(`/personas/${id}/estado`, null, { params: { activo } });
        return data;
    },

    // Usuarios y Roles
    listarUsuarios: async () => {
        const { data } = await api.get('/usuarios');
        return data;
    },
    listarRoles: async () => {
        const { data } = await api.get('/usuarios/roles');
        return data;
    },
    crearUsuario: async (payload) => {
        const { data } = await api.post('/usuarios', payload);
        return data;
    },
    actualizarUsuario: async (id, payload) => {
        const { data } = await api.put(`/usuarios/${id}`, payload);
        return data;
    },
    cambiarEstadoUsuario: async (id, activo) => {
        const { data } = await api.patch(`/usuarios/${id}/estado`, null, { params: { activo } });
        return data;
    },
};