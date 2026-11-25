import { useEffect, useState } from 'react';
import { Truck, Ruler, Plus, Pencil, Power, AlertCircle, CheckCircle2 } from 'lucide-react';
import { catalogoService } from '../services/catalogoService';
import { usePaginacion } from '../hooks/usepaginacion';
import Paginacion from '../components/ui/paginacion';

export default function AlmacenesCatalogosView() {
    const [tab, setTab] = useState('proveedores');
    const [proveedores, setProveedores] = useState([]);
    const [unidades, setUnidades] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const [provEditId, setProvEditId] = useState(null);
    const [provForm, setProvForm] = useState({
        ruc: '',
        razonSocial: '',
        direccion: '',
        telefono: '',
        email: '',
    });

    const [unidadEditId, setUnidadEditId] = useState(null);
    const [unidadForm, setUnidadForm] = useState({ nombre: '', abreviatura: '' });

    const cargarTodo = async () => {
        try {
            const [provData, uniData] = await Promise.all([
                catalogoService.listarProveedores(),
                catalogoService.listarUnidades(),
            ]);
            setProveedores(provData);
            setUnidades(uniData);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudieron cargar los catálogos.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarTodo();
    }, []);

    const notificar = (texto) => {
        setMensaje(texto);
        setError('');
        setTimeout(() => setMensaje(''), 4000);
    };

    const mostrarError = (err, fallback) => {
        setMensaje('');
        setError(err.response?.data?.message || err.response?.data?.error || fallback);
    };

    // --- PROVEEDORES ---
    const guardarProveedor = async (e) => {
        e.preventDefault();
        try {
            if (provEditId) {
                await catalogoService.actualizarProveedor(provEditId, provForm);
                notificar('Proveedor actualizado correctamente.');
            } else {
                await catalogoService.crearProveedor(provForm);
                notificar('Proveedor registrado correctamente.');
            }
            setProvEditId(null);
            setProvForm({ ruc: '', razonSocial: '', direccion: '', telefono: '', email: '' });
            await cargarTodo();
        } catch (err) {
            mostrarError(err, 'No se pudo guardar el proveedor.');
        }
    };

    const toggleProveedor = async (p) => {
        try {
            await catalogoService.cambiarEstadoProveedor(p.idProveedor, !p.activo);
            notificar(`Proveedor ${p.activo ? 'desactivado' : 'activado'}.`);
            await cargarTodo();
        } catch (err) {
            mostrarError(err, 'No se pudo cambiar el estado del proveedor.');
        }
    };

    // --- UNIDADES ---
    const guardarUnidad = async (e) => {
        e.preventDefault();
        try {
            if (unidadEditId) {
                await catalogoService.actualizarUnidad(unidadEditId, unidadForm);
                notificar('Unidad de medida actualizada.');
            } else {
                await catalogoService.crearUnidad(unidadForm);
                notificar('Unidad de medida registrada.');
            }
            setUnidadEditId(null);
            setUnidadForm({ nombre: '', abreviatura: '' });
            await cargarTodo();
        } catch (err) {
            mostrarError(err, 'No se pudo guardar la unidad de medida.');
        }
    };

    const toggleUnidad = async (u) => {
        try {
            await catalogoService.cambiarEstadoUnidad(u.idUnidad, !u.activo);
            notificar(`Unidad ${u.activo ? 'desactivada' : 'activada'}.`);
            await cargarTodo();
        } catch (err) {
            mostrarError(err, 'No se pudo cambiar el estado de la unidad.');
        }
    };

    const pagProveedores = usePaginacion(proveedores, 10);
    const pagUnidades = usePaginacion(unidades, 10);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-[#064c32]">Proveedores y Unidades de Medida</h2>
                <p className="text-base text-slate-600 mt-1">
                    Registra proveedores para las Notas de Entrada (NEA) y unidades de medida para el catálogo de bienes.
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-base">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {mensaje && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-base">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>{mensaje}</span>
                </div>
            )}

            <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-3">
                <button
                    type="button"
                    onClick={() => setTab('proveedores')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-base font-semibold cursor-pointer ${
                        tab === 'proveedores'
                            ? 'bg-[#064c32] text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    <Truck className="w-5 h-5" />
                    Proveedores ({proveedores.length})
                </button>

                <button
                    type="button"
                    onClick={() => setTab('unidades')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-base font-semibold cursor-pointer ${
                        tab === 'unidades'
                            ? 'bg-[#064c32] text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    <Ruler className="w-5 h-5" />
                    Unidades de Medida ({unidades.length})
                </button>
            </div>

            {cargando ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-lg text-slate-600">
                    Cargando catálogos...
                </div>
            ) : (
                <>
                    {tab === 'proveedores' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                            <form
                                onSubmit={guardarProveedor}
                                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 lg:sticky lg:top-0"
                            >
                                <h3 className="text-xl font-bold text-slate-900">
                                    {provEditId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                                </h3>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">RUC (11 dígitos) *</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={11}
                                        pattern="\d{11}"
                                        placeholder="20123456789"
                                        value={provForm.ruc}
                                        onChange={(e) => setProvForm({ ...provForm, ruc: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">Razón Social *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. Distribuidora Cañete S.A.C."
                                        value={provForm.razonSocial}
                                        onChange={(e) => setProvForm({ ...provForm, razonSocial: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">Dirección</label>
                                    <input
                                        type="text"
                                        value={provForm.direccion}
                                        onChange={(e) => setProvForm({ ...provForm, direccion: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-base font-medium text-slate-700 mb-1">Teléfono</label>
                                        <input
                                            type="text"
                                            value={provForm.telefono}
                                            onChange={(e) => setProvForm({ ...provForm, telefono: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-base font-medium text-slate-700 mb-1">Correo</label>
                                        <input
                                            type="email"
                                            value={provForm.email}
                                            onChange={(e) => setProvForm({ ...provForm, email: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#064c32] hover:bg-[#053b27] text-white text-base font-semibold cursor-pointer"
                                    >
                                        <Plus className="w-5 h-5" />
                                        {provEditId ? 'Actualizar' : 'Guardar Proveedor'}
                                    </button>
                                    {provEditId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProvEditId(null);
                                                setProvForm({ ruc: '', razonSocial: '', direccion: '', telefono: '', email: '' });
                                            }}
                                            className="px-4 py-3 rounded-xl border border-slate-300 text-base font-medium cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>

                            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                        <tr className="bg-[#064c32] text-white text-sm uppercase">
                                            <th className="py-3.5 px-4">RUC</th>
                                            <th className="py-3.5 px-4">Razón Social / Dirección</th>
                                            <th className="py-3.5 px-4">Contacto</th>
                                            <th className="py-3.5 px-4">Estado</th>
                                            <th className="py-3.5 px-4 text-right">Acciones</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 text-base">
                                        {pagProveedores.itemsPaginados.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-slate-500">
                                                    No hay proveedores registrados.
                                                </td>
                                            </tr>
                                        ) : (
                                            pagProveedores.itemsPaginados.map((p) => (
                                                <tr key={p.idProveedor} className="hover:bg-slate-50">
                                                    <td className="py-3.5 px-4 font-mono">{p.ruc}</td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-semibold">{p.razonSocial}</div>
                                                        <div className="text-sm text-slate-500">{p.direccion || 'Sin dirección'}</div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-sm text-slate-700">
                                                        <div>{p.telefono || '—'}</div>
                                                        <div className="text-slate-500">{p.email || ''}</div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                              <span
                                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                      p.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                  }`}
                              >
                                {p.activo ? 'Activo' : 'Inactivo'}
                              </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setProvEditId(p.idProveedor);
                                                                setProvForm({
                                                                    ruc: p.ruc,
                                                                    razonSocial: p.razonSocial,
                                                                    direccion: p.direccion || '',
                                                                    telefono: p.telefono || '',
                                                                    email: p.email || '',
                                                                });
                                                            }}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100 cursor-pointer"
                                                        >
                                                            <Pencil className="w-4 h-4" /> Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleProveedor(p)}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100 cursor-pointer"
                                                        >
                                                            <Power className="w-4 h-4" /> {p.activo ? 'Desactivar' : 'Activar'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                </div>

                                <Paginacion
                                    paginaActual={pagProveedores.paginaActual}
                                    totalPaginas={pagProveedores.totalPaginas}
                                    totalRegistros={pagProveedores.totalRegistros}
                                    porPagina={pagProveedores.porPagina}
                                    desde={pagProveedores.desde}
                                    hasta={pagProveedores.hasta}
                                    onCambiarPagina={pagProveedores.irAPagina}
                                    onCambiarPorPagina={pagProveedores.cambiarPorPagina}
                                />
                            </div>
                        </div>
                    )}

                    {tab === 'unidades' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                            <form
                                onSubmit={guardarUnidad}
                                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 lg:sticky lg:top-0"
                            >
                                <h3 className="text-xl font-bold text-slate-900">
                                    {unidadEditId ? 'Editar Unidad' : 'Nueva Unidad de Medida'}
                                </h3>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. Unidad, Kilogramo, Litro, Caja, Millar"
                                        value={unidadForm.nombre}
                                        onChange={(e) => setUnidadForm({ ...unidadForm, nombre: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">Abreviatura</label>
                                    <input
                                        type="text"
                                        maxLength={15}
                                        placeholder="Ej. UND, KG, LT, CJA"
                                        value={unidadForm.abreviatura}
                                        onChange={(e) => setUnidadForm({ ...unidadForm, abreviatura: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#064c32] hover:bg-[#053b27] text-white text-base font-semibold cursor-pointer"
                                    >
                                        <Plus className="w-5 h-5" />
                                        {unidadEditId ? 'Actualizar' : 'Guardar Unidad'}
                                    </button>
                                    {unidadEditId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUnidadEditId(null);
                                                setUnidadForm({ nombre: '', abreviatura: '' });
                                            }}
                                            className="px-4 py-3 rounded-xl border border-slate-300 text-base font-medium cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>

                            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                        <tr className="bg-[#064c32] text-white text-sm uppercase">
                                            <th className="py-3.5 px-4">Unidad</th>
                                            <th className="py-3.5 px-4">Abreviatura</th>
                                            <th className="py-3.5 px-4">Estado</th>
                                            <th className="py-3.5 px-4 text-right">Acciones</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 text-base">
                                        {pagUnidades.itemsPaginados.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-slate-500">
                                                    No hay unidades de medida registradas.
                                                </td>
                                            </tr>
                                        ) : (
                                            pagUnidades.itemsPaginados.map((u) => (
                                                <tr key={u.idUnidad} className="hover:bg-slate-50">
                                                    <td className="py-3.5 px-4 font-semibold">{u.nombre}</td>
                                                    <td className="py-3.5 px-4 font-mono text-slate-600">{u.abreviatura || '—'}</td>
                                                    <td className="py-3.5 px-4">
                              <span
                                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                      u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                  }`}
                              >
                                {u.activo ? 'Activa' : 'Inactiva'}
                              </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setUnidadEditId(u.idUnidad);
                                                                setUnidadForm({ nombre: u.nombre, abreviatura: u.abreviatura || '' });
                                                            }}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100 cursor-pointer"
                                                        >
                                                            <Pencil className="w-4 h-4" /> Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleUnidad(u)}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100 cursor-pointer"
                                                        >
                                                            <Power className="w-4 h-4" /> {u.activo ? 'Desactivar' : 'Activar'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                </div>

                                <Paginacion
                                    paginaActual={pagUnidades.paginaActual}
                                    totalPaginas={pagUnidades.totalPaginas}
                                    totalRegistros={pagUnidades.totalRegistros}
                                    porPagina={pagUnidades.porPagina}
                                    desde={pagUnidades.desde}
                                    hasta={pagUnidades.hasta}
                                    onCambiarPagina={pagUnidades.irAPagina}
                                    onCambiarPorPagina={pagUnidades.cambiarPorPagina}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}