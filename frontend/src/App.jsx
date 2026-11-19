import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import RutaProtegida from './routes/RutaProtegida';
import MainLayout from './components/ui/MainLayout';
import StorageService from './services/storageService';

// vistas
import LoginView from './pages/LoginView';
import { DashboardView } from './pages/DashboardView';
import { AlmacenesCatalogosView } from './pages/AlmacenesCatalogosView';
import { ProductosView } from './pages/ProductosView';
import { KardexView } from './pages/KardexView';
import { MovimientosView } from './pages/MovimientosView';

function App() {
    const [state, setState] = useState(() => StorageService.loadState());

    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* ruta pública */}
                    <Route path="/login" element={<LoginView />} />

                    {/* rutas protegidas envueltas en un layout cómodo */}
                    <Route path="/" element={<RutaProtegida><MainLayout /></RutaProtegida>}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardView state={state} />} />
                        <Route path="catalogos" element={<AlmacenesCatalogosView state={state} />} />
                        <Route path="productos" element={<ProductosView state={state} />} />
                        <Route path="movimientos" element={<MovimientosView state={state} />} />
                        <Route path="kardex" element={<KardexView state={state} />} />
                    </Route>

                    {/* ruta 404 fallback */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
