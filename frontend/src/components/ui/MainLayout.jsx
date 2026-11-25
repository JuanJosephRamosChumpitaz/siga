import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FolderTree,
    BookOpen,
    Package,
    ArrowLeftRight,
    FileSignature,
    ClipboardList,
    ClipboardCheck,
    BarChart3,
    ShieldCheck,
    LogOut,
    UserCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/auth';

const MENU_SECCIONES = [
    {
        titulo: 'GENERAL',
        items: [
            {
                to: '/dashboard',
                label: 'Panel Principal',
                icon: LayoutDashboard,
                roles: ['ADMIN', 'ALMACENERO', 'ABASTECIMIENTO', 'SOLICITANTE'],
            },
        ],
    },
    {
        titulo: 'OPERACIONES DE ALMACÉN',
        items: [
            {
                to: '/solicitudes',
                label: 'PECOSA y Firmas',
                icon: FileSignature,
                roles: ['ADMIN', 'ALMACENERO', 'ABASTECIMIENTO', 'SOLICITANTE'],
            },
            {
                to: '/movimientos',
                label: 'Entradas y Salidas',
                icon: ArrowLeftRight,
                roles: ['ADMIN', 'ALMACENERO'],
            },
            {
                to: '/kardex',
                label: 'Kardex y Control Visible',
                icon: ClipboardList,
                roles: ['ADMIN', 'ALMACENERO'],
            },
            {
                to: '/inventario-fisico',
                label: 'Inventario Físico',
                icon: ClipboardCheck,
                roles: ['ADMIN', 'ALMACENERO'],
            },
        ],
    },
    {
        titulo: 'CATÁLOGOS Y CUENTAS',
        items: [
            {
                to: '/productos',
                label: 'Catálogo de Bienes',
                icon: Package,
                roles: ['ADMIN', 'ALMACENERO'],
            },
            {
                to: '/cuentas',
                label: 'Cuentas Contables',
                icon: BookOpen,
                roles: ['ADMIN', 'ALMACENERO'],
            },
            {
                to: '/catalogos',
                label: 'Proveedores y Unidades',
                icon: FolderTree,
                roles: ['ADMIN', 'ALMACENERO'],
            },
        ],
    },
    {
        titulo: 'CONTROL Y ADMINISTRACIÓN',
        items: [
            {
                to: '/reportes',
                label: 'Reportes Oficiales',
                icon: BarChart3,
                roles: ['ADMIN', 'ALMACENERO', 'ABASTECIMIENTO'],
            },
            {
                to: '/usuarios',
                label: 'Usuarios y Áreas',
                icon: Users,
                roles: ['ADMIN'],
            },
            {
                to: '/auditoria',
                label: 'Auditoría',
                icon: ShieldCheck,
                roles: ['ADMIN'],
            },
        ],
    },
];

export default function MainLayout() {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();
    const rolActual = usuario?.rol?.toUpperCase() || 'SOLICITANTE';

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="h-screen overflow-hidden flex bg-slate-50 text-slate-900">
            {/* Barra lateral institucional */}
            <aside className="w-72 shrink-0 bg-[#064c32] text-white flex flex-col justify-between shadow-lg overflow-y-auto">
                <div>
                    <div className="px-6 py-5 border-b border-emerald-800/70 flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-lime-400 text-[#064c32] font-bold text-lg flex items-center justify-center shrink-0">
                            SG
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-wide leading-tight">SIGA</h1>
                            <p className="text-sm text-emerald-200">IESTP Cañete</p>
                        </div>
                    </div>

                    <nav className="px-3 py-4 space-y-5 overflow-y-auto">
                        {MENU_SECCIONES.map((seccion) => {
                            const visibles = seccion.items.filter((item) => item.roles.includes(rolActual));
                            if (visibles.length === 0) return null;

                            return (
                                <div key={seccion.titulo}>
                                    <p className="px-3 mb-2 text-xs font-semibold tracking-wider text-emerald-300/90">
                                        {seccion.titulo}
                                    </p>
                                    <div className="space-y-1">
                                        {visibles.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <NavLink
                                                    key={item.to}
                                                    to={item.to}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-medium transition-colors ${
                                                            isActive
                                                                ? 'bg-lime-400 text-[#064c32] font-semibold shadow-sm'
                                                                : 'text-emerald-50 hover:bg-emerald-800/70'
                                                        }`
                                                    }
                                                >
                                                    <Icon className="w-5 h-5 shrink-0" />
                                                    <span>{item.label}</span>
                                                </NavLink>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t border-emerald-800/70">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-emerald-100 hover:bg-emerald-800/80 transition-colors cursor-pointer"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Contenedor derecho */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between gap-4">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-emerald-50 text-[#064c32] font-semibold text-sm tracking-wide">
            SISTEMA INTEGRADO DE GESTIÓN DE ALMACÉN
          </span>

                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-base font-semibold text-slate-900 leading-tight">
                                {usuario?.nombreCompleto || usuario?.username}
                            </p>
                            <p className="text-sm text-emerald-700 font-medium">
                                {rolActual} · {usuario?.nombreArea || 'IESTP Cañete'}
                            </p>
                        </div>
                        <UserCircle2 className="w-10 h-10 text-slate-400 shrink-0" />
                    </div>
                </header>

                <main className="flex-1 p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}