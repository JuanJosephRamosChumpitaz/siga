import api from './api';

export const catalogoService = {
    // Unidades
    listarUnidades: async (soloActivas = false) => {
        const { data } = await api.get('/unidades', { params: { soloActivas } });
        return data;
    },
    crearUnidad: async (payload) => {
        const { data } = await api.post('/unidades', payload);
        return data;
    },
    actualizarUnidad: async (id, payload) => {
        const { data } = await api.put(`/unidades/${id}`, payload);
        return data;
    },
    cambiarEstadoUnidad: async (id, activo) => {
        const { data } = await api.patch(`/unidades/${id}/estado`, null, { params: { activo } });
        return data;
    },

    // Proveedores
    listarProveedores: async (soloActivos = false) => {
        const { data } = await api.get('/proveedores', { params: { soloActivos } });
        return data;
    },
    crearProveedor: async (payload) => {
        const { data } = await api.post('/proveedores', payload);
        return data;
    },
    actualizarProveedor: async (id, payload) => {
        const { data } = await api.put(`/proveedores/${id}`, payload);
        return data;
    },
    cambiarEstadoProveedor: async (id, activo) => {
        const { data } = await api.patch(`/proveedores/${id}/estado`, null, { params: { activo } });
        return data;
    },

    // Categorías (Cuentas contables)
    listarCategorias: async (soloActivas = false) => {
        const { data } = await api.get('/categorias', { params: { soloActivas } });
        return data;
    },
    crearCategoria: async (payload) => {
        const { data } = await api.post('/categorias', payload);
        return data;
    },
    actualizarCategoria: async (id, payload) => {
        const { data } = await api.put(`/categorias/${id}`, payload);
        return data;
    },
    cambiarEstadoCategoria: async (id, activo) => {
        const { data } = await api.patch(`/categorias/${id}/estado`, null, { params: { activo } });
        return data;
    },

    // Productos (Catálogo de Bienes)
    listarProductos: async (soloActivos = false) => {
        const { data } = await api.get('/productos', { params: { soloActivos } });
        return data;
    },
    buscarProductoPorCodigo: async (codigo) => {
        const { data } = await api.get(`/productos/buscar-codigo/${encodeURIComponent(codigo)}`);
        return data;
    },
    crearProducto: async (payload) => {
        const { data } = await api.post('/productos', payload);
        return data;
    },
    actualizarProducto: async (id, payload) => {
        const { data } = await api.put(`/productos/${id}`, payload);
        return data;
    },
    cambiarEstadoProducto: async (id, activo) => {
        const { data } = await api.patch(`/productos/${id}/estado`, null, { params: { activo } });
        return data;
    },
};