import React, { useState } from 'react'
import {
  Clock,
  FileText,
  Filter,
  Info,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'

export function AuditoriaView({ state, onSwitchUser }) {
  const { auditLogs, users, currentUser } = state
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  const filteredLogs = auditLogs.filter((log) => {
    const q = search.toLowerCase()
    const matchSearch =
        log.userName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.summary.toLowerCase().includes(q) ||
        log.recordId.toLowerCase().includes(q)
    const matchAction = actionFilter === 'all' || log.action.includes(actionFilter)
    return matchSearch && matchAction
  })

  return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-[34px]">
            Trazabilidad y Bitácora de Auditoría
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Registro inmutable de operaciones del sistema • Control de accesos y roles demostrativos.
          </p>
        </div>

        {/* Nota de perfiles demostrativos */}
        <div className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-teal-950">
          <Info className="size-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong>Perfiles demostrativos:</strong> Para efectos de esta presentación académica, los
            perfiles y roles son simulados en el cliente para demostrar los flujos de autorización y
            despacho. En una implementación productiva, la autenticación y permisos se gestionan a
            través de tokens JWT y backend en SQL Server.
          </div>
        </div>

        {/* Selector Rápido de Usuario de Demostración */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Perfiles de Demostración Disponibles</h3>
              <p className="text-xs text-slate-500">Haga clic para alternar el rol activo y probar los permisos</p>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md">
            Usuario Activo: {currentUser.name} ({currentUser.roleLabel})
          </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {users.map((u) => {
              const isActive = u.id === currentUser.id
              return (
                  <div
                      key={u.id}
                      onClick={() => onSwitchUser(u)}
                      className={`cursor-pointer rounded-xl border p-3.5 transition ${
                          isActive
                              ? 'border-teal-700 bg-teal-50/60 shadow-xs ring-2 ring-teal-700/20'
                              : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{u.name}</span>
                      {isActive && <UserCheck className="size-4 text-teal-700" />}
                    </div>
                    <p className="mt-1 font-semibold text-xs text-teal-800">{u.roleLabel}</p>
                    <p className="text-[11px] text-slate-500">{u.area}</p>
                  </div>
              )
            })}
          </div>
        </div>

        {/* Filtros de la Bitácora */}
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
                type="text"
                placeholder="Buscar por usuario, comprobante o detalle de acción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-teal-600"
            >
              <option value="all">Todas las acciones de auditoría</option>
              <option value="MOVIMIENTO">Movimientos (Ingresos, Salidas, etc.)</option>
              <option value="INVENTARIO">Inventario Físico</option>
              <option value="ANULAR">Anulaciones y Reversiones</option>
            </select>
          </div>
        </div>

        {/* Tabla Inmutable de Bitácora */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 pl-4">Fecha y Hora</th>
                <th className="py-3">Usuario y Rol</th>
                <th className="py-3">Acción Registrada</th>
                <th className="py-3">Entidad / Registro</th>
                <th className="py-3 pr-4">Resumen de la Transacción</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-3 pl-4 whitespace-nowrap text-slate-500 font-mono">
                      {log.timestamp}
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{log.userName}</p>
                      <p className="text-[10px] text-teal-800 font-semibold">{log.userRole}</p>
                    </td>
                    <td className="py-3 whitespace-nowrap">
                    <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-teal-900 whitespace-nowrap">
                      {log.recordId}
                    </td>
                    <td className="py-3 pr-4 text-slate-700 leading-relaxed max-w-md">
                      {log.summary}
                      {log.reason && (
                          <span className="block text-[11px] text-rose-700 mt-0.5">
                        Motivo: {log.reason}
                      </span>
                      )}
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  )
}
