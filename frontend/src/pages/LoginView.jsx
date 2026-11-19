import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/auth';

export default function LoginView() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.mensaje ?? 'no se pudo conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  return (
      <div className="min-h-screen bg-[#f3f7f5] flex flex-col justify-between text-[#132b24]">
        {/* contenedor principal centrado */}
        <main className="flex-1 flex items-center justify-center px-4 py-10 md:py-14">
          <div className="w-full max-w-[460px]">
            <div className="rounded-3xl border border-[#e0e8e4] bg-white p-7 sm:p-9 shadow-[0_10px_35px_rgba(6,76,50,0.06)] relative overflow-hidden">
              {/* franja verde institucional superior */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#064c32] via-[#075c3b] to-[#b7d925]" />

              <div className="mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#075c3b] bg-[#edf3f0] px-2.5 py-1 rounded-md">
                autenticación institucional
              </span>
                <h2 className="text-2xl font-bold tracking-tight text-[#064c32] mt-2">
                  iniciar sesión
                </h2>
              </div>

              {/* mensaje de error */}
              {error && (
                  <div className="mb-5 rounded-xl border border-[#fecdd3] bg-[#fff1f2] p-3.5 text-xs text-[#dc252d] flex items-center gap-2.5">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* campo usuario */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#52635c] mb-1.5">
                    usuario
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#84918b]" />
                    <input
                        type="text"
                        name="username"
                        autoComplete="on"
                        autoFocus
                        required
                        placeholder="ej. admin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-12 w-full rounded-xl border border-[#d8e1dd] bg-white pl-10 pr-3.5 text-sm text-[#20372e] outline-none transition focus:border-[#075c3b] focus:ring-2 focus:ring-[#075c3b]/10 placeholder:text-[#9aa7a1]"
                    />
                  </div>
                </div>

                {/* campo contraseña */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#52635c]">
                      contraseña
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#84918b]" />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        autoComplete="on"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 w-full rounded-xl border border-[#d8e1dd] bg-white pl-10 pr-11 text-sm text-[#20372e] outline-none transition focus:border-[#075c3b] focus:ring-2 focus:ring-[#075c3b]/10 placeholder:text-[#9aa7a1]"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#84918b] hover:text-[#075c3b] p-1"
                        title={showPassword ? 'ocultar contraseña' : 'ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* recordar sesión */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-[#586860]">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="size-4 rounded border-[#d8e1dd] accent-[#075c3b]"
                    />
                    <span>recordar sesión</span>
                  </label>
                </div>

                {/* botón de ingreso */}
                <button
                    type="submit"
                    disabled={cargando}
                    className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#075c3b] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#064c32] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {cargando ? (
                      <>
                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>validando credenciales...</span>
                      </>
                  ) : (
                      <>
                        <span>ingresar al sistema</span>
                        <ArrowRight className="size-4" />
                      </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>

        {/* pie de página institucional */}
        <footer className="border-t border-[#dce5e1] bg-white py-4 px-6 text-center text-xs text-[#78847f]">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© 2026 iestp cañete • todos los derechos reservados</p>
            <p className="flex items-center gap-2">
              <span>pecosa v1.0</span>
              <span>•</span>
              <span>método: promedio ponderado móvil</span>
              <span>•</span>
              <span className="text-[#075c3b] font-semibold">almacén central</span>
            </p>
          </div>
        </footer>
      </div>
  );
}
