import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth';

export default function RutaProtegida({ children, rolesPermitidos }) {
    const { isAuthenticated, usuario } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (rolesPermitidos && rolesPermitidos.length > 0) {
        const rolActual = usuario?.rol?.toUpperCase();
        if (!rolesPermitidos.includes(rolActual)) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
}