import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function enviar(e) {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            await login(username, password);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.mensaje ?? 'no se pudo conectar con el servidor');
        } finally {
            setCargando(false);
        }
    }

    return (
        <main className="login-fondo">
            <form className="login-tarjeta" onSubmit={enviar}>
                <h1>siga</h1>
                <p className="subtitulo">sistema de gestión de almacén · iestp cañete</p>
                <label>
                    Usuario
                    <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
                </label>
                <label>
                    Contraseña
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </label>
                {error && <p className="error">{error}</p>}
                <button disabled={cargando}>{cargando ? 'Ingresando...' : 'Ingresar'}</button>
            </form>
        </main>
    );
}