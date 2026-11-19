import { useEffect, useState } from 'react';
import {
    Building2,
    Users,
    KeyRound,
    Plus,
    Pencil,
    Power,
    AlertCircle,
    CheckCircle2,
    Eye,
    EyeOff,
} from 'lucide-react';
import { administracionService } from '../services/administracionService';

export default function UsuariosPersonalView() {
    const [tab, setTab] = useState('areas');
    const [areas, setAreas] = useState([]);
    const [personas, setPersonas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);

    // Formularios
    const [areaEditId, setAreaEditId] = useState(null);
    const [areaForm, setAreaForm] = useState({ nombre: '', descripcion: '' });

    const [personaEditId, setPersonaEditId] = useState(null);
    const [personaForm, setPersonaForm] = useState({
        dni: '',
        nombres: '',
        apellidos: '',
        cargo: '',
        idArea: '',
    });

    const [usuarioEditId, setUsuarioEditId] = useState(null);
    const [usuarioForm, setUsuarioForm] = useState({
        idPersona: '',
        username: '',
        password: '',
        idRol: '',
    });

    const cargarTodo = async () => {
        setCargando(true);
        setError('');
        try {
            const [areasData, personasData, usuariosData, rolesData] = await Promise.all([
                administracionService.listarAreas(),
                administracionService.listarPersonas(),
                administracionService.listarUsuarios(),
                administracionService.listarRoles(),
            ]);
            setAreas(areasData);
            setPersonas(personasData);
            setUsuarios(usuariosData);
            setRoles(rolesData);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar la información del servidor.');
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

    // --- ÁREAS ---
    const guardarArea = async (e) => {
        e.preventDefault();
        try {
            if (areaEditId) {
                await administracionService.actualizarArea(areaEditId, areaForm);
                notificar('Área actualizada correctamente.');
            } else {
                await administracionService.crearArea(areaForm);
                notificar('Área registrada correctamente.');
            }
            setAreaEditId(null);
            setAreaForm({ nombre: '', descripcion: '' });
            await cargarTodo();
        } catch (err) {
            mostrarError(err, 'No se pudo guardar el área.');
        }
    };

    const toggleArea = async (area) => {
        try {
            await administracionService.cambiarEstadoArea(area.idArea, !area.activo);
            notificar(`Área ${area.activo ? 'desactivada' : 'activada'}.`);
            await cargarTodo();
        } catch (err) {
            mostrarError(err, 'No se pudo cambiar el estado del área.');
        }
    };

    // --- PERSONAS ---
    const guardarPersona = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...personaForm, idArea: Number(personaForm.idArea) };
            if (personaEditId) {
                await administracionService.actualizarPersona(personaEditId, payload);
                notificar('Datos del personal actualizados.');
            } else {
                await administracionService.crearPersona(payload);
                notificar('Personal registrado correctamente.');
            }
            setPersonaEditId(null);
            setPersonaForm({ dni: '', nombres: '', apellidos: '', cargo: '', idArea: '' });
            await cargarTodo();
        } catch (err) {
            mostrarError(err, 'No se pudo guardar los datos de la persona.');
        }
    };

    const togglePersona = async (persona) => {
        try {
            await administracionService.cambiarEstadoPersona(persona.idPersona, !persona.activo);
            notificar(`Registro ${persona.activo ? 'desactivado' : 'activado'}.`);
            await cargarTodo();
        } catch (err) {
            mostrarError(err, 'No se pudo actualizar el estado.');
        }
    };

    // --- USUARIOS ---
    const guardarUsuario = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                idPersona: Number(usuarioForm.idPersona),
                username: usuarioForm.username.trim(),
                password: usuarioForm.password || null,
                idRol: Number(usuarioForm.idRol),
            };
            if (usuarioEditId) {
                await administracionService.actualizarUsuario(usuarioEditId, payload);
                notificar('Usuario actualizado correctamente.');
            } else {
                await administracionService.crearUsuario(payload);
                notificar('Usuario creado correctamente.');
            }
            setUsuarioEditId(null);
            setUsuarioForm({ idPersona: '', username: '', password: '', idRol: '' });
            setMostrarPassword(false);
            await cargarTodo();
        } catch (err) {
            mostrarError(err, 'No se pudo guardar el usuario.');
        }
    };

    const toggleUsuario = async (usr) => {
        try {
            await administracionService.cambiarEstadoUsuario(usr.idUsuario, !usr.activo);
            notificar(`Usuario ${usr.activo ? 'desactivado' : 'activado'}.`);
            await cargarTodo();
        } catch (err) {
            mostrarError(err, 'No se pudo cambiar el estado del usuario.');
        }
    };

    const areasActivas = areas.filter((a) => a.activo);
    const personasDisponibles = personas.filter(
        (p) => p.activo && (!p.tieneUsuario || Number(usuarioForm.idPersona) === p.idPersona)
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-[#064c32]">Usuarios, Personal y Áreas</h2>
                <p className="text-base text-slate-600 mt-1">
                    Administra las áreas del IESTP Cañete, el personal responsable y sus credenciales de acceso por rol.
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

            {/* Pestañas */}
            <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-3">
                <button
                    type="button"
                    onClick={() => setTab('areas')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-base font-semibold cursor-pointer ${
                        tab === 'areas'
                            ? 'bg-[#064c32] text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    <Building2 className="w-5 h-5" />
                    1. Áreas ({areas.length})
                </button>

                <button
                    type="button"
                    onClick={() => setTab('personas')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-base font-semibold cursor-pointer ${
                        tab === 'personas'
                            ? 'bg-[#064c32] text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    <Users className="w-5 h-5" />
                    2. Personal ({personas.length})
                </button>

                <button
                    type="button"
                    onClick={() => setTab('usuarios')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-base font-semibold cursor-pointer ${
                        tab === 'usuarios'
                            ? 'bg-[#064c32] text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    <KeyRound className="w-5 h-5" />
                    3. Usuarios y Roles ({usuarios.length})
                </button>
            </div>

            {cargando ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-lg text-slate-600">
                    Cargando registros...
                </div>
            ) : (
                <>
                    {/* TAB 1: ÁREAS */}
                    {tab === 'areas' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <form
                                onSubmit={guardarArea}
                                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 h-fit"
                            >
                                <h3 className="text-xl font-bold text-slate-900">
                                    {areaEditId ? 'Editar Área' : 'Nueva Área'}
                                </h3>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">
                                        Nombre del Área *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. Tópico, Administración, Contabilidad"
                                        value={areaForm.nombre}
                                        onChange={(e) => setAreaForm({ ...areaForm, nombre: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">
                                        Descripción
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Opcional"
                                        value={areaForm.descripcion}
                                        onChange={(e) => setAreaForm({ ...areaForm, descripcion: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#064c32] hover:bg-[#053b27] text-white text-base font-semibold cursor-pointer"
                                    >
                                        <Plus className="w-5 h-5" />
                                        {areaEditId ? 'Actualizar' : 'Guardar Área'}
                                    </button>
                                    {areaEditId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAreaEditId(null);
                                                setAreaForm({ nombre: '', descripcion: '' });
                                            }}
                                            className="px-4 py-3 rounded-xl border border-slate-300 text-base font-medium cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>

                            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                    <tr className="bg-[#064c32] text-white text-sm uppercase">
                                        <th className="py-3.5 px-4">Área</th>
                                        <th className="py-3.5 px-4">Descripción</th>
                                        <th className="py-3.5 px-4">Estado</th>
                                        <th className="py-3.5 px-4 text-right">Acciones</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-base">
                                    {areas.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-slate-500">
                                                No hay áreas registradas todavía. Registra la primera a la izquierda.
                                            </td>
                                        </tr>
                                    ) : (
                                        areas.map((a) => (
                                            <tr key={a.idArea} className="hover:bg-slate-50">
                                                <td className="py-3.5 px-4 font-semibold">{a.nombre}</td>
                                                <td className="py-3.5 px-4 text-slate-600">{a.descripcion || '—'}</td>
                                                <td className="py-3.5 px-4">
                            <span
                                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    a.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                              {a.activo ? 'Activa' : 'Inactiva'}
                            </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAreaEditId(a.idArea);
                                                            setAreaForm({ nombre: a.nombre, descripcion: a.descripcion || '' });
                                                        }}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100 cursor-pointer"
                                                    >
                                                        <Pencil className="w-4 h-4" /> Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleArea(a)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100 cursor-pointer"
                                                    >
                                                        <Power className="w-4 h-4" /> {a.activo ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: PERSONAL */}
                    {tab === 'personas' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <form
                                onSubmit={guardarPersona}
                                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 h-fit"
                            >
                                <h3 className="text-xl font-bold text-slate-900">
                                    {personaEditId ? 'Editar Personal' : 'Registrar Personal'}
                                </h3>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">DNI (8 dígitos) *</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={8}
                                        pattern="\d{8}"
                                        value={personaForm.dni}
                                        onChange={(e) => setPersonaForm({ ...personaForm, dni: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">Nombres *</label>
                                    <input
                                        type="text"
                                        required
                                        value={personaForm.nombres}
                                        onChange={(e) => setPersonaForm({ ...personaForm, nombres: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">Apellidos *</label>
                                    <input
                                        type="text"
                                        required
                                        value={personaForm.apellidos}
                                        onChange={(e) => setPersonaForm({ ...personaForm, apellidos: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">Cargo</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Jefe de Área, Docente, Almacenero"
                                        value={personaForm.cargo}
                                        onChange={(e) => setPersonaForm({ ...personaForm, cargo: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">Área *</label>
                                    <select
                                        required
                                        value={personaForm.idArea}
                                        onChange={(e) => setPersonaForm({ ...personaForm, idArea: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                    >
                                        <option value="">Selecciona un área...</option>
                                        {areasActivas.map((a) => (
                                            <option key={a.idArea} value={a.idArea}>
                                                {a.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#064c32] hover:bg-[#053b27] text-white text-base font-semibold cursor-pointer"
                                    >
                                        <Plus className="w-5 h-5" />
                                        {personaEditId ? 'Actualizar' : 'Guardar Personal'}
                                    </button>
                                    {personaEditId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPersonaEditId(null);
                                                setPersonaForm({ dni: '', nombres: '', apellidos: '', cargo: '', idArea: '' });
                                            }}
                                            className="px-4 py-3 rounded-xl border border-slate-300 text-base font-medium cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>

                            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                    <tr className="bg-[#064c32] text-white text-sm uppercase">
                                        <th className="py-3.5 px-4">DNI</th>
                                        <th className="py-3.5 px-4">Nombre Completo</th>
                                        <th className="py-3.5 px-4">Área / Cargo</th>
                                        <th className="py-3.5 px-4">Estado</th>
                                        <th className="py-3.5 px-4 text-right">Acciones</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-base">
                                    {personas.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-slate-500">
                                                No hay personal registrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        personas.map((p) => (
                                            <tr key={p.idPersona} className="hover:bg-slate-50">
                                                <td className="py-3.5 px-4 font-mono">{p.dni}</td>
                                                <td className="py-3.5 px-4 font-semibold">{p.nombreCompleto}</td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-medium">{p.nombreArea}</div>
                                                    <div className="text-sm text-slate-500">{p.cargo || 'Sin cargo'}</div>
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
                                                            setPersonaEditId(p.idPersona);
                                                            setPersonaForm({
                                                                dni: p.dni,
                                                                nombres: p.nombres,
                                                                apellidos: p.apellidos,
                                                                cargo: p.cargo || '',
                                                                idArea: p.idArea ? String(p.idArea) : '',
                                                            });
                                                        }}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100 cursor-pointer"
                                                    >
                                                        <Pencil className="w-4 h-4" /> Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePersona(p)}
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
                        </div>
                    )}

                    {/* TAB 3: USUARIOS */}
                    {tab === 'usuarios' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <form
                                onSubmit={guardarUsuario}
                                autoComplete="off"
                                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 h-fit"
                            >
                                <h3 className="text-xl font-bold text-slate-900">
                                    {usuarioEditId ? 'Editar Usuario' : 'Crear Acceso al Sistema'}
                                </h3>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">Persona *</label>
                                    <select
                                        required
                                        disabled={Boolean(usuarioEditId)}
                                        value={usuarioForm.idPersona}
                                        onChange={(e) => setUsuarioForm({ ...usuarioForm, idPersona: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base bg-white disabled:bg-slate-100"
                                    >
                                        <option value="">Selecciona personal...</option>
                                        {personasDisponibles.map((p) => (
                                            <option key={p.idPersona} value={p.idPersona}>
                                                {p.nombreCompleto} ({p.nombreArea})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">Nombre de Usuario *</label>
                                    <input
                                        type="text"
                                        required
                                        minLength={3}
                                        autoComplete="off"
                                        placeholder="Ej. jquispe"
                                        value={usuarioForm.username}
                                        onChange={(e) => setUsuarioForm({ ...usuarioForm, username: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">
                                        Contraseña {usuarioEditId ? '(dejar vacío para no cambiar)' : '*'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={mostrarPassword ? 'text' : 'password'}
                                            required={!usuarioEditId}
                                            minLength={6}
                                            autoComplete="new-password"
                                            placeholder="Mínimo 6 caracteres"
                                            value={usuarioForm.password}
                                            onChange={(e) => setUsuarioForm({ ...usuarioForm, password: e.target.value })}
                                            className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setMostrarPassword((prev) => !prev)}
                                            aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                            title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                            className="absolute inset-y-0 right-0 px-3.5 flex items-center text-slate-500 hover:text-[#064c32] cursor-pointer"
                                        >
                                            {mostrarPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-slate-700 mb-1">Rol del Sistema *</label>
                                    <select
                                        required
                                        value={usuarioForm.idRol}
                                        onChange={(e) => setUsuarioForm({ ...usuarioForm, idRol: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base bg-white"
                                    >
                                        <option value="">Selecciona un rol...</option>
                                        {roles.map((r) => (
                                            <option key={r.idRol} value={r.idRol}>
                                                {r.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#064c32] hover:bg-[#053b27] text-white text-base font-semibold cursor-pointer"
                                    >
                                        <Plus className="w-5 h-5" />
                                        {usuarioEditId ? 'Actualizar' : 'Crear Usuario'}
                                    </button>
                                    {usuarioEditId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUsuarioEditId(null);
                                                setUsuarioForm({ idPersona: '', username: '', password: '', idRol: '' });
                                                setMostrarPassword(false);
                                            }}
                                            className="px-4 py-3 rounded-xl border border-slate-300 text-base font-medium cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>

                            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                    <tr className="bg-[#064c32] text-white text-sm uppercase">
                                        <th className="py-3.5 px-4">Usuario</th>
                                        <th className="py-3.5 px-4">Personal / Área</th>
                                        <th className="py-3.5 px-4">Rol</th>
                                        <th className="py-3.5 px-4">Estado</th>
                                        <th className="py-3.5 px-4 text-right">Acciones</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-base">
                                    {usuarios.map((u) => (
                                        <tr key={u.idUsuario} className="hover:bg-slate-50">
                                            <td className="py-3.5 px-4 font-semibold">{u.username}</td>
                                            <td className="py-3.5 px-4">
                                                <div>{u.nombreCompleto}</div>
                                                <div className="text-sm text-slate-500">{u.nombreArea}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                          <span className="px-3 py-1 rounded-lg bg-emerald-50 text-[#064c32] text-sm font-bold">
                            {u.rol}
                          </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                          <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}
                          >
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setUsuarioEditId(u.idUsuario);
                                                        setUsuarioForm({
                                                            idPersona: u.idPersona ? String(u.idPersona) : '',
                                                            username: u.username,
                                                            password: '',
                                                            idRol: u.idRol ? String(u.idRol) : '',
                                                        });
                                                        setMostrarPassword(false);
                                                    }}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100 cursor-pointer"
                                                >
                                                    <Pencil className="w-4 h-4" /> Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleUsuario(u)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100 cursor-pointer"
                                                >
                                                    <Power className="w-4 h-4" /> {u.activo ? 'Desactivar' : 'Activar'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}