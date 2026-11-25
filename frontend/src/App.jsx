import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import RutaProtegida from './routes/RutaProtegida';
import MainLayout from './components/ui/MainLayout';

import LoginView from './pages/LoginView';
import DashboardView from './pages/DashboardView';
import UsuariosPersonalView from './pages/UsuariosPersonalView';
import AlmacenesCatalogosView from './pages/AlmacenesCatalogosView';
import CuentasContablesView from './pages/CuentasContablesView';
import ProductosView from './pages/ProductosView';
import MovimientosView from './pages/MovimientosView';
import SolicitudesView from './pages/SolicitudesView';
import KardexView from './pages/KardexView';
import InventarioFisicoView from './pages/InventarioFisicoView';
import ReportesView from './pages/ReportesView';
import AuditoriaView from './pages/AuditoriaView';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginView />} />

                    <Route
                        path="/"
                        element={
                            <RutaProtegida>
                                <MainLayout />
                            </RutaProtegida>
                        }
                    >
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardView />} />

                        <Route
                            path="solicitudes"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO', 'ABASTECIMIENTO', 'SOLICITANTE']}>
                                    <SolicitudesView />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="movimientos"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO']}>
                                    <MovimientosView />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="kardex"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO']}>
                                    <KardexView />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="inventario-fisico"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO']}>
                                    <InventarioFisicoView />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="productos"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO']}>
                                    <ProductosView />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="cuentas"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO']}>
                                    <CuentasContablesView />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="catalogos"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO']}>
                                    <AlmacenesCatalogosView />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="reportes"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO', 'ABASTECIMIENTO']}>
                                    <ReportesView />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="usuarios"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN']}>
                                    <UsuariosPersonalView />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="auditoria"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN']}>
                                    <AuditoriaView />
                                </RutaProtegida>
                            }
                        />
                    </Route>

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}