import { useState } from 'react';
import api from '../services/api';
import { AuthContext } from './auth';

function leerUsuarioGuardado() {
    try {
        const raw = localStorage.getItem('usuario');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [usuario, setUsuario] = useState(() => leerUsuarioGuardado());

    const login = async (username, password) => {
        const { data } = await api.post('/auth/login', { username, password });

        const perfil = {
            idUsuario: data.idUsuario,
            username: data.username,
            rol: data.rol,
            idPersona: data.idPersona,
            nombreCompleto: data.nombreCompleto,
            idArea: data.idArea,
            nombreArea: data.nombreArea,
        };

        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(perfil));
        setToken(data.token);
        setUsuario(perfil);

        return perfil;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setToken(null);
        setUsuario(null);
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                usuario,
                user: usuario,
                isAuthenticated: Boolean(token && usuario),
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}