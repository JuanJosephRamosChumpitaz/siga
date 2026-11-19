import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import RutaProtegida from './routes/RutaProtegida';
import MainLayout from './components/ui/MainLayout';
import { StorageService } from './services/storageService';

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
    // Estado vacío temporal para vistas que se conectarán en los Bloques 2 a 5
    const [state] = useState(() => StorageService.loadState());

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
                        <Route path="dashboard" element={<DashboardView state={state} />} />

                        <Route
                            path="solicitudes"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO', 'ABASTECIMIENTO', 'SOLICITANTE']}>
                                    <SolicitudesView state={state} />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="movimientos"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO']}>
                                    <MovimientosView state={state} />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="kardex"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO']}>
                                    <KardexView state={state} />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="inventario-fisico"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO']}>
                                    <InventarioFisicoView state={state} />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="productos"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO']}>
                                    <ProductosView state={state} />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="cuentas"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO']}>
                                    <CuentasContablesView state={state} />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="catalogos"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO']}>
                                    <AlmacenesCatalogosView state={state} />
                                </RutaProtegida>
                            }
                        />

                        <Route
                            path="reportes"
                            element={
                                <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACENERO', 'ABASTECIMIENTO']}>
                                    <ReportesView state={state} />
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
                                    <AuditoriaView state={state} />
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