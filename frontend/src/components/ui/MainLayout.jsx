import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    ArrowLeftRight,
    Package,
    ClipboardCheck,
    BookOpen,
    Warehouse,
    ShieldCheck,
    Settings,
    LogOut,
    Menu,
    X,
    User,
} from 'lucide-react'
import { useAuth } from '../../context/auth'

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { usuario, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navItems = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/catalogos', label: 'Almacenes y Catálogos', icon: Warehouse },
        { to: '/productos', label: 'Productos', icon: Package },
        { to: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
        { to: '/kardex', label: 'Kardex', icon: ClipboardCheck },
    ]

    return (
        <div className="flex h-screen overflow-hidden bg-[#f3f7f5] text-[#132b24]">
            {/* Fondo oscuro en móvil */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-[#092d20]/60 backdrop-blur-xs lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Barra Lateral (Sidebar) */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#064c32] text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Logo Institucional */}
                <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-[#b7d925] font-black text-[#064c32] text-sm">
                            SG
                        </div>
                        <div>
              <span className="block text-base font-black tracking-tight leading-none">
                SIGAL
              </span>
                            <span className="text-[10px] text-white/70">IESTP Cañete</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-lg p-1 text-white/70 hover:bg-white/10 lg:hidden"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Navegación */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                                    isActive
                                        ? 'bg-[#b7d925] text-[#064c32] font-bold shadow-xs'
                                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                                }`
                            }
                        >
                            <Icon className="size-4 shrink-0" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Botón Salir */}
                <div className="border-t border-white/10 p-3">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-rose-500/20 hover:text-rose-200 cursor-pointer"
                    >
                        <LogOut className="size-4 shrink-0" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Contenedor Derecho (Navbar + Outlet) */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Barra Superior (Navbar) */}
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#e0e8e4] bg-white px-4 lg:px-8">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="rounded-lg p-2 text-[#586860] hover:bg-[#edf3f0] lg:hidden"
                    >
                        <Menu className="size-5" />
                    </button>

                    <div className="hidden sm:block">
            <span className="text-xs font-bold uppercase tracking-wider text-[#075c3b] bg-[#edf3f0] px-2.5 py-1 rounded-md">
              Sistema Integrado de Gestión de Almacén
            </span>
                    </div>

                    {/* Info de Usuario Activo */}
                    <div className="flex items-center gap-3 ml-auto">
                        <div className="text-right">
                            <p className="text-xs font-bold text-[#20372e]">
                                {usuario?.nombreCompleto || 'Usuario Almacén'}
                            </p>
                            <p className="text-[11px] font-semibold text-[#075c3b]">
                                {usuario?.rol || 'Administrador'}
                            </p>
                        </div>
                        <div className="flex size-9 items-center justify-center rounded-full bg-[#edf3f0] text-[#075c3b]">
                            <User className="size-4" />
                        </div>
                    </div>
                </header>

                {/* Área Central Dinámica */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
