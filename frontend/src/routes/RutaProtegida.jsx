import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth';

export default function RutaProtegida({ children }) {
    const { usuario } = useAuth();
    return usuario ? children : <Navigate to="/login" replace />;
}