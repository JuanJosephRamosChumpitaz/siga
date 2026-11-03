import { useState } from 'react';
import api from '../services/api';
import { AuthContext } from './auth';

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(() => {
        const guardado = localStorage.getItem('usuario');
        return guardado ? JSON.parse(guardado) : null;
    });

    async function login(username, password) {
        const { data } = await api.post('/auth/login', { username, password });
        const datosUsuario = {
            username: data.username,
            rol: data.rol,
            nombreCompleto: data.nombreCompleto,
        };
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(datosUsuario));
        setUsuario(datosUsuario);
    }

    function logout() {
        localStorage.clear();
        setUsuario(null);
    }

    return (
        <AuthContext.Provider value={{ usuario, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}