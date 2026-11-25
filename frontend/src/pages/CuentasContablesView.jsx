import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  Pencil,
  Power,
  AlertCircle,
  CheckCircle2,
  CornerDownRight,
  Search,
} from 'lucide-react';
import { catalogoService } from '../services/catalogoService';
import { usePaginacion } from '../hooks/usepaginacion';
import Paginacion from '../components/ui/paginacion';

export default function CuentasContablesView() {
  const [cuentas, setCuentas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ codigo: '', nombre: '', idPadre: '' });

  const cargarCuentas = async () => {
    setCargando(true);
    setError('');
    try {
      const data = await catalogoService.listarCategorias();
      setCuentas(data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el clasificador contable.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCuentas();
  }, []);

  const notificar = (texto) => {
    setMensaje(texto);
    setError('');
    setTimeout(() => setMensaje(''), 4000);
  };

  const guardarCuenta = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        idPadre: form.idPadre ? Number(form.idPadre) : null,
      };
      if (editId) {
        await catalogoService.actualizarCategoria(editId, payload);
        notificar('Cuenta contable actualizada correctamente.');
      } else {
        await catalogoService.crearCategoria(payload);
        notificar('Cuenta contable registrada correctamente.');
      }
      setEditId(null);
      setForm({ codigo: '', nombre: '', idPadre: '' });
      await cargarCuentas();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar la cuenta contable.');
    }
  };

  const toggleEstado = async (c) => {
    try {
      await catalogoService.cambiarEstadoCategoria(c.idCategoria, !c.activo);
      notificar(`Cuenta ${c.activo ? 'desactivada' : 'activada'}.`);
      await cargarCuentas();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cambiar el estado.');
    }
  };

  const posiblesPadres = cuentas.filter((c) => c.activo && c.idCategoria !== editId);

  const cuentasFiltradas = useMemo(() => {
    if (!filtro.trim()) return cuentas;
    const q = filtro.toLowerCase();
    return cuentas.filter(
        (c) =>
            (c.codigo || '').toLowerCase().includes(q) ||
            (c.nombre || '').toLowerCase().includes(q) ||
            (c.codigoPadre || '').toLowerCase().includes(q) ||
            (c.nombrePadre || '').toLowerCase().includes(q)
    );
  }, [cuentas, filtro]);

  const pag = usePaginacion(cuentasFiltradas, 10);

  return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-[#064c32]">Clasificador de Cuentas Contables</h2>
          <p className="text-base text-slate-600 mt-1">
            Estructura jerárquica de cuentas, subcuentas y sub-subcuentas (ej. 1301 → 1301.01 → 1301.0102).
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <form
              onSubmit={guardarCuenta}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 lg:sticky lg:top-0"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#064c32]" />
              <h3 className="text-xl font-bold text-slate-900">
                {editId ? 'Editar Cuenta' : 'Nueva Cuenta Contable'}
              </h3>
            </div>

            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">Código Contable *</label>
              <input
                  type="text"
                  required
                  placeholder="Ej. 1301.0102"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base font-mono focus:outline-none focus:ring-2 focus:ring-[#064c32]"
              />
            </div>

            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">Denominación *</label>
              <input
                  type="text"
                  required
                  placeholder="Ej. Alimentos y bebidas para consumo animal"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#064c32]"
              />
            </div>

            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">
                Cuenta Padre (opcional)
              </label>
              <select
                  value={form.idPadre}
                  onChange={(e) => setForm({ ...form, idPadre: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#064c32]"
              >
                <option value="">Cuenta principal (sin padre)</option>
                {posiblesPadres.map((p) => (
                    <option key={p.idCategoria} value={p.idCategoria}>
                      {p.codigo} — {p.nombre}
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
                {editId ? 'Actualizar' : 'Guardar Cuenta'}
              </button>
              {editId && (
                  <button
                      type="button"
                      onClick={() => {
                        setEditId(null);
                        setForm({ codigo: '', nombre: '', idPadre: '' });
                      }}
                      className="px-4 py-3 rounded-xl border border-slate-300 text-base font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                  type="text"
                  placeholder="Buscar por código contable o denominación (ej. 1301.05, oficina, combustibles)..."
                  value={filtro}
                  onChange={(e) => {
                    setFiltro(e.target.value);
                    pag.reiniciarPagina();
                  }}
                  className="w-full text-base focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              {cargando ? (
                  <div className="p-8 text-center text-lg text-slate-600">Cargando cuentas...</div>
              ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-[#064c32] text-white text-sm uppercase">
                      <th className="py-3.5 px-4">Código</th>
                      <th className="py-3.5 px-4">Denominación</th>
                      <th className="py-3.5 px-4">Depende de</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-base">
                    {pag.itemsPaginados.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">
                            {filtro.trim()
                                ? 'No hay cuentas contables que coincidan con tu búsqueda.'
                                : 'Aún no has registrado cuentas contables.'}
                          </td>
                        </tr>
                    ) : (
                        pag.itemsPaginados.map((c) => (
                            <tr key={c.idCategoria} className="hover:bg-slate-50">
                              <td className="py-3.5 px-4 font-mono font-bold text-[#064c32] whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  {c.idPadre && <CornerDownRight className="w-4 h-4 text-slate-400" />}
                                  <span>{c.codigo || '—'}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-medium">{c.nombre}</td>
                              <td className="py-3.5 px-4 text-sm text-slate-600">
                                {c.codigoPadre ? `${c.codigoPadre} (${c.nombrePadre})` : 'Cuenta Raíz'}
                              </td>
                              <td className="py-3.5 px-4">
                          <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  c.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}
                          >
                            {c.activo ? 'Activa' : 'Inactiva'}
                          </span>
                              </td>
                              <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                                <button
                                    type="button"
                                    onClick={() => {
                                      setEditId(c.idCategoria);
                                      setForm({
                                        codigo: c.codigo || '',
                                        nombre: c.nombre,
                                        idPadre: c.idPadre ? String(c.idPadre) : '',
                                      });
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100 cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4" /> Editar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggleEstado(c)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100 cursor-pointer"
                                >
                                  <Power className="w-4 h-4" /> {c.activo ? 'Desactivar' : 'Activar'}
                                </button>
                              </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                  </table>
              )}
            </div>

            <Paginacion
                paginaActual={pag.paginaActual}
                totalPaginas={pag.totalPaginas}
                totalRegistros={pag.totalRegistros}
                porPagina={pag.porPagina}
                desde={pag.desde}
                hasta={pag.hasta}
                onCambiarPagina={pag.irAPagina}
                onCambiarPorPagina={pag.cambiarPorPagina}
            />
          </div>
        </div>
      </div>
  );
}