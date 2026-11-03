import { useEffect, useState } from 'react';
import { useAuth } from '../context/auth';
import api from '../services/api';

const soles = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export default function Dashboard() {
    const { usuario, logout } = useAuth();
    const [resumen, setResumen] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/dashboard/resumen')
            .then((r) => setResumen(r.data))
            .catch(() => setError('no se pudo cargar el resumen'));
    }, []);

    const tarjetas = resumen && [
        { titulo: 'Productos registrados', valor: resumen.totalProductos },
        { titulo: 'Lotes con stock', valor: resumen.lotesConStock },
        { titulo: 'Valor del inventario', valor: soles.format(resumen.valorInventario) },
        { titulo: 'PECOSAS del mes', valor: resumen.pecosasDelMes },
        { titulo: 'Productos con stock bajo', valor: resumen.productosStockBajo },
    ];

    return (
        <div className="layout">
            <header className="barra">
                <strong>siga</strong>
                <span>{usuario.nombreCompleto} · {usuario.rol}</span>
                <button onClick={logout}>Salir</button>
            </header>
            <main className="contenido">
                <h2>Resumen del almacén</h2>
                {error && <p className="error">{error}</p>}
                <section className="tarjetas">
                    {tarjetas?.map((t) => (
                        <article key={t.titulo} className="tarjeta">
                            <span>{t.titulo}</span>
                            <strong>{t.valor}</strong>
                        </article>
                    ))}
                </section>
            </main>
        </div>
    );
}