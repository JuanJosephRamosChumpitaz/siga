
import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Ban,
  Download,
  Plus,
  Printer,
  RotateCcw,
  Search,
  X,
} from 'lucide-react'

export function MovimientosView({
                                  state,
                                  initialTypeFilter,
                                  onOpenNewMovement,
                                  onConfirmMovement,
                                  onReverseMovement,
                                  onPrintMovement,
                                  onOpenKardex,
                                }) {
  const { movements, warehouses } = state

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState(initialTypeFilter || 'all')
  const [warehouseFilter, setWarehouseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [activeMovement, setActiveMovement] = useState(null)
  const [reversalModalOpen, setReversalModalOpen] = useState(false)
  const [reversalReason, setReversalReason] = useState('')
  const [notification, setNotification] = useState(null)

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const q = search.toLowerCase()

      const matchSearch =
          (m.correlative || '').toLowerCase().includes(q) ||
          (m.docNumber || '').toLowerCase().includes(q) ||
          (m.docType || '').toLowerCase().includes(q) ||
          (m.observations || '').toLowerCase().includes(q) ||
          (m.recipient || '').toLowerCase().includes(q) ||
          (m.responsible || '').toLowerCase().includes(q) ||
          m.items.some(
              (it) =>
                  (it.productName || '').toLowerCase().includes(q) ||
                  (it.productCode || '').toLowerCase().includes(q)
          )

      const matchType = typeFilter === 'all' || m.type === typeFilter
      const matchWarehouse =
          warehouseFilter === 'all' || m.warehouseId === warehouseFilter
      const matchStatus = statusFilter === 'all' || m.status === statusFilter

      return matchSearch && matchType && matchWarehouse && matchStatus
    })
  }, [movements, search, typeFilter, warehouseFilter, statusFilter])

  const handleOpenReversal = (m) => {
    setActiveMovement(m)
    setReversalReason('')
    setReversalModalOpen(true)
  }

  const handleConfirmReversal = (e) => {
    e.preventDefault()

    if (!activeMovement || !reversalReason.trim()) return

    onReverseMovement(activeMovement.id, reversalReason.trim())
    setReversalModalOpen(false)

    setNotification(
        `Operación de anulación y contra-asiento ejecutada para ${activeMovement.correlative}.`
    )

    setTimeout(() => setNotification(null), 4000)
  }

  const handleExportCSV = () => {
    const headers = [
      'Correlativo',
      'Fecha',
      'Hora',
      'Tipo',
      'Motivo',
      'Almacen',
      'Documento',
      'Responsable',
      'Destinatario',
      'Items_Count',
      'Importe_Total',
      'Estado',
    ]

    const escapeCSV = (value) => {
      const text = String(value ?? '')
      return `"${text.replace(/"/g, '""')}"`
    }

    const rows = filteredMovements.map((m) => {
      const wh = warehouses.find((w) => w.id === m.warehouseId)

      return [
        escapeCSV(m.correlative),
        escapeCSV(m.date),
        escapeCSV(m.time),
        escapeCSV(m.type),
        escapeCSV(m.reason),
        escapeCSV(wh ? wh.name : m.warehouseId),
        escapeCSV(`${m.docType} ${m.docNumber}`),
        escapeCSV(m.responsible),
        escapeCSV(m.recipient),
        m.items.length,
        Number(m.totalAmount || 0).toFixed(2),
        escapeCSV(m.status),
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.setAttribute(
        'download',
        `movimientos_almacen_sigal_${new Date().toISOString().slice(0, 10)}.csv`
    )

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  return (
      <div className="space-y-6">
        {/* Toast Notification */}
        {notification && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-[#064c32] px-5 py-3.5 text-white shadow-xl transition-all">
              <div className="size-2 rounded-full bg-[#f5db38] animate-ping" />
              <p className="text-sm font-medium">{notification}</p>
              <button
                  onClick={() => setNotification(null)}
                  className="ml-2 text-white/70 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
        )}

        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#064c32] md:text-[39px]">
              Movimientos de Almacén
            </h1>
            <p className="mt-1 text-base text-[#687871] md:text-lg">
              Registro de ingresos (O/C), salidas (PECOSA), transferencias,
              devoluciones y ajustes.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
                onClick={onOpenNewMovement}
                className="flex items-center gap-2 rounded-xl bg-[#075c3b] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#064c32]"
            >
              <Plus className="size-5" />
              Registrar Movimiento
            </button>

            <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 rounded-xl border border-[#075c3b] bg-white px-5 py-3.5 text-sm font-bold text-[#075c3b] hover:bg-[#edf3f0]"
            >
              <Download className="size-5" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-5 grid gap-4 rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)] sm:grid-cols-2 lg:grid-cols-4">
          <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#52635c]">
            Buscar
          </span>

            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#84918b]" />

              <input
                  type="text"
                  placeholder="Correlativo, N° documento..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#d8e1dd] pl-9 pr-3 text-sm text-[#20372e] outline-none focus:border-[#0b7549]"
              />
            </div>
          </div>

          <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#52635c]">
            Tipo de Operación
          </span>

            <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#d8e1dd] bg-white px-3 text-sm text-[#20372e] outline-none focus:border-[#0b7549]"
            >
              <option value="all">Todas las operaciones</option>
              <option value="ingreso">Ingresos (Compras, Donaciones)</option>
              <option value="salida">Salidas (PECOSA despachos)</option>
              <option value="transferencia">Transferencias Internas</option>
              <option value="devolucion">Devoluciones</option>
              <option value="ajuste">Ajustes de Inventario</option>
            </select>
          </div>

          <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#52635c]">
            Almacén
          </span>

            <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#d8e1dd] bg-white px-3 text-sm text-[#20372e] outline-none focus:border-[#0b7549]"
            >
              <option value="all">Todos los almacenes</option>

              {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
              ))}
            </select>
          </div>

          <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#52635c]">
            Estado
          </span>

            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#d8e1dd] bg-white px-3 text-sm text-[#20372e] outline-none focus:border-[#0b7549]"
            >
              <option value="all">Todos los estados</option>
              <option value="confirmado">Confirmados (Afectan stock)</option>
              <option value="anulado">Anulados / Revertidos</option>
              <option value="borrador">Borradores</option>
            </select>
          </div>
        </div>

        {/* Tabla de Movimientos */}
        <div className="overflow-hidden rounded-2xl border border-[#e0e8e4] bg-white shadow-[0_2px_10px_rgba(21,55,42,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#075c3b] font-bold text-white">
              <tr>
                <th className="py-3.5 pl-5 pr-3">Fecha y Hora</th>
                <th className="py-3.5 px-3">Correlativo</th>
                <th className="py-3.5 px-3">Tipo / Motivo</th>
                <th className="py-3.5 px-3">Documento Sustento</th>
                <th className="py-3.5 px-3">Almacén</th>
                <th className="py-3.5 px-3">Destino / Proveedor</th>
                <th className="py-3.5 px-3 text-center">Bienes</th>
                <th className="py-3.5 px-3 text-right">Importe Total</th>
                <th className="py-3.5 px-3 text-center">Estado</th>
                <th className="py-3.5 pr-5 pl-3 text-center">Acciones</th>
              </tr>
              </thead>

              <tbody className="divide-y divide-[#e8eeeb]">
              {filteredMovements.length === 0 ? (
                  <tr>
                    <td
                        colSpan={10}
                        className="py-12 text-center text-[#78847f]"
                    >
                      No se registran movimientos con los filtros aplicados.
                    </td>
                  </tr>
              ) : (
                  filteredMovements.map((m) => {
                    const wh = warehouses.find((w) => w.id === m.warehouseId)

                    const targetWh = m.targetWarehouseId
                        ? warehouses.find((w) => w.id === m.targetWarehouseId)
                        : null

                    return (
                        <tr
                            key={m.id}
                            className={`hover:bg-[#f7faf8] transition border-b border-[#e8eeeb] last:border-0 ${
                                m.status === 'anulado'
                                    ? 'bg-[#f0f1f0]/60 opacity-60 line-through'
                                    : ''
                            }`}
                        >
                          <td className="py-3.5 pl-5 pr-3 text-[#586860] whitespace-nowrap">
                        <span className="font-semibold text-[#20372e]">
                          {m.date}
                        </span>
                            <span className="text-[10px] text-[#78847f] block">
                          {m.time}
                        </span>
                          </td>

                          <td className="py-3.5 px-3 font-mono font-bold text-[#075c3b]">
                            {m.correlative}
                          </td>

                          <td className="py-3.5 px-3">
                        <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold ${
                                m.type === 'ingreso'
                                    ? 'bg-[#dff1e4] text-[#08783f]'
                                    : m.type === 'salida'
                                        ? 'bg-[#ffe4e5] text-[#dc252d]'
                                        : m.type === 'transferencia'
                                            ? 'bg-[#e0f2fe] text-[#0369a1]'
                                            : m.type === 'devolucion'
                                                ? 'bg-[#fef3c7] text-[#92400e]'
                                                : 'bg-[#ede9fe] text-[#6d28d9]'
                            }`}
                        >
                          {m.type === 'ingreso' && (
                              <ArrowUp className="size-3" />
                          )}
                          {m.type === 'salida' && (
                              <ArrowDown className="size-3" />
                          )}
                          {m.type === 'transferencia' && (
                              <ArrowLeftRight className="size-3" />
                          )}
                          {m.type === 'devolucion' && (
                              <RotateCcw className="size-3" />
                          )}

                          {m.type.toUpperCase()}
                        </span>

                            <p className="text-[11px] text-[#687871] mt-0.5 max-w-[150px] truncate">
                              {m.reason}
                            </p>
                          </td>

                          <td className="py-3.5 px-3">
                            <p className="font-semibold text-[#20372e]">
                              {m.docType}
                            </p>
                            <p className="font-mono text-[11px] text-[#78847f]">
                              {m.docNumber}
                            </p>
                          </td>

                          <td className="py-3.5 px-3 text-[#20372e]">
                            <p className="font-medium">{wh?.name}</p>

                            {targetWh && (
                                <span className="text-[10px] text-[#075c3b] block font-semibold">
                            → {targetWh.name}
                          </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 max-w-[180px] truncate text-[#20372e]">
                            <p className="font-medium">
                              {m.recipient || m.responsible}
                            </p>
                            <p className="text-[10px] text-[#78847f]">
                              Reg: {m.registeredBy}
                            </p>
                          </td>

                          <td className="py-3.5 px-3 text-center">
                        <span className="rounded-full bg-[#edf3f0] px-2.5 py-0.5 font-bold text-[#075c3b]">
                          {m.items.length} ítems
                        </span>
                          </td>

                          <td className="py-3.5 px-3 text-right font-bold text-[#20372e] whitespace-nowrap">
                            S/{' '}
                            {m.totalAmount.toLocaleString('es-PE', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>

                          <td className="py-3.5 px-3 text-center">
                        <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                m.status === 'confirmado'
                                    ? 'bg-[#dff1e4] text-[#08783f]'
                                    : m.status === 'anulado'
                                        ? 'bg-[#ffe4e5] text-[#dc252d]'
                                        : 'bg-[#fff0a8] text-[#17251d]'
                            }`}
                        >
                          {m.status === 'confirmado'
                              ? 'Confirmado'
                              : m.status === 'anulado'
                                  ? 'Anulado'
                                  : 'Borrador'}
                        </span>
                          </td>

                          <td className="py-3.5 pr-5 pl-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                  type="button"
                                  onClick={() => onPrintMovement(m)}
                                  className="rounded-lg border border-[#d8e1dd] bg-white p-1.5 text-[#586860] hover:bg-[#edf3f0] hover:text-[#075c3b]"
                                  title="Ver constancia / comprobante imprimible"
                              >
                                <Printer className="size-3.5" />
                              </button>

                              {m.status === 'confirmado' && (
                                  <button
                                      type="button"
                                      onClick={() => handleOpenReversal(m)}
                                      className="rounded-lg border border-[#fecdd3] bg-white p-1.5 text-[#dc252d] hover:bg-[#ffe4e5]"
                                      title="Anular / Revertir movimiento"
                                  >
                                    <Ban className="size-3.5" />
                                  </button>
                              )}
                            </div>
                          </td>
                        </tr>
                    )
                  })
              )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Confirmar Anulación / Reversión */}
        {reversalModalOpen && activeMovement && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-[#092d20]/60 p-4 backdrop-blur-xs"
                onClick={() => setReversalModalOpen(false)}
            >
              <div
                  className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between border-b border-[#e5ebe8] pb-3">
                  <div className="flex items-center gap-2 text-[#dc252d]">
                    <AlertTriangle className="size-5" />
                    <h3 className="text-lg font-bold text-[#20372e]">
                      Anular Movimiento
                    </h3>
                  </div>

                  <button
                      onClick={() => setReversalModalOpen(false)}
                      className="rounded-lg p-1 text-[#78847f] hover:bg-[#f0f1f0]"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <form onSubmit={handleConfirmReversal} className="space-y-4">
                  <div className="rounded-xl border border-[#fecdd3] bg-[#fff1f2] p-3.5 text-xs text-[#9f1239] leading-relaxed">
                    <p className="font-bold">
                      Principio de Inmutabilidad de Almacén:
                    </p>
                    Los movimientos confirmados no se eliminan físicamente. La
                    anulación generará un movimiento de contra-asiento vinculado a{' '}
                    <strong>{activeMovement.correlative}</strong>, restituyendo las
                    existencias y registrando la operación en la bitácora de
                    auditoría.
                  </div>

                  <label className="block text-xs font-bold text-[#52635c]">
                    Motivo Obligatorio de Anulación *
                    <textarea
                        required
                        rows={3}
                        value={reversalReason}
                        onChange={(e) => setReversalReason(e.target.value)}
                        placeholder="Ej. Error en la cantidad despachada según informe del responsable..."
                        className="mt-1.5 w-full rounded-xl border border-[#d8e1dd] p-2.5 text-xs text-[#20372e] outline-none focus:border-[#dc252d]"
                    />
                  </label>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e5ebe8]">
                    <button
                        type="button"
                        onClick={() => setReversalModalOpen(false)}
                        className="rounded-xl border border-[#d8e1dd] px-4 py-2.5 text-xs font-bold text-[#52635c] hover:bg-[#f0f1f0]"
                    >
                      Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={!reversalReason.trim()}
                        className="rounded-xl bg-[#dc252d] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#b91c1c] disabled:opacity-50"
                    >
                      Confirmar Reversión
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  )
}

export default MovimientosView
