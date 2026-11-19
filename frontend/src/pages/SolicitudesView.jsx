
import React, { useState } from 'react'
import {
  AlertTriangle,
  PackageCheck,
  Plus,
  Search,
  X,
} from 'lucide-react'

export function SolicitudesView({
                                  state,
                                  onSaveRequisition,
                                  onUpdateStatus,
                                  onFulfillRequisition,
                                }) {
  const {
    requisitions,
    areas,
    products,
    warehouses,
    currentUser,
  } = state

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [newModalOpen, setNewModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  const [selectedReq, setSelectedReq] = useState(null)

  // Formulario nueva solicitud
  const [reqAreaId, setReqAreaId] = useState(areas[0]?.id || '')
  const [reqApplicant, setReqApplicant] = useState(currentUser.name)
  const [reqReason, setReqReason] = useState('')
  const [reqItems, setReqItems] = useState([])

  // Selector de productos
  const [selectedProdId, setSelectedProdId] = useState(
      products[0]?.id || ''
  )
  const [itemQty, setItemQty] = useState('5')

  // Estado de revisión
  const [reviewAction, setReviewAction] = useState('aprobada')
  const [reviewObs, setReviewObs] = useState('')

  // Estado de despacho
  const [dispatchWarehouseId, setDispatchWarehouseId] = useState(
      warehouses[0]?.id || 'alm-1'
  )
  const [dispatchQuantities, setDispatchQuantities] = useState({})
  const [dispatchError, setDispatchError] = useState(null)
  const [notification, setNotification] = useState(null)

  // Filtrar solicitudes
  const filteredRequisitions = requisitions.filter((r) => {
    const q = search.toLowerCase()
    const area = areas.find((a) => a.id === r.areaId)

    const matchSearch =
        r.correlative.toLowerCase().includes(q) ||
        r.applicantName.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        (area && area.name.toLowerCase().includes(q))

    const matchStatus =
        statusFilter === 'all' || r.status === statusFilter

    return matchSearch && matchStatus
  })

  // Handlers: Nueva solicitud
  const handleOpenNew = () => {
    setReqAreaId(areas[0]?.id || '')
    setReqApplicant(currentUser.name)
    setReqReason('')
    setReqItems([])
    setNewModalOpen(true)
  }

  const handleAddItemToReq = () => {
    const qty = Number(itemQty)

    if (!qty || qty <= 0) return

    const prod = products.find(
        (p) => p.id === selectedProdId
    )

    if (!prod) return

    setReqItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        requestedQty: qty,
      },
    ])

    setItemQty('5')
  }

  const handleSaveNewRequisition = (e) => {
    e.preventDefault()

    if (reqItems.length === 0) return

    const correlative = `SOL-2026-${String(
        requisitions.length + 1
    ).padStart(3, '0')}`

    const itemsFormatted = reqItems.map((it) => {
      const p = products.find(
          (prod) => prod.id === it.productId
      )

      if (!p) return null

      return {
        productId: p.id,
        productCode: p.code,
        productName: p.name,
        unit: p.unit,
        requestedQty: it.requestedQty,
        approvedQty: it.requestedQty,
        deliveredQty: 0,
      }
    }).filter(Boolean)

    const newReq = {
      id: `req-${Date.now()}`,
      correlative,
      date: new Date().toLocaleDateString('es-PE'),
      time: new Date().toLocaleTimeString('es-PE').slice(0, 5),
      areaId: reqAreaId,
      applicantName: reqApplicant,
      reason:
          reqReason.trim() ||
          'Requerimiento de bienes de consumo para actividades académicas.',
      status: 'pendiente',
      items: itemsFormatted,
      linkedMovementIds: [],
    }

    onSaveRequisition(newReq)
    setNewModalOpen(false)

    setNotification(
        `Solicitud "${correlative}" enviada a revisión con éxito.`
    )

    setTimeout(() => setNotification(null), 4000)
  }

  // Handlers: Revisión y aprobación
  const handleOpenReview = (r) => {
    setSelectedReq(r)
    setReviewAction('aprobada')
    setReviewObs('')
    setReviewModalOpen(true)
  }

  const handleConfirmReview = (e) => {
    e.preventDefault()

    if (!selectedReq) return

    onUpdateStatus(
        selectedReq.id,
        reviewAction,
        reviewObs.trim() || undefined
    )

    setReviewModalOpen(false)

    setNotification(
        `Solicitud ${selectedReq.correlative} ${
            reviewAction === 'aprobada'
                ? 'Aprobada'
                : 'Rechazada'
        }.`
    )

    setTimeout(() => setNotification(null), 4000)
  }

  // Handlers: Despacho PECOSA
  const handleOpenDispatch = (r) => {
    setSelectedReq(r)

    setDispatchWarehouseId(
        warehouses[0]?.id || 'alm-1'
    )

    setDispatchError(null)

    const initialDeliveries = {}

    r.items.forEach((it) => {
      const pending = Math.max(
          0,
          it.approvedQty - it.deliveredQty
      )

      initialDeliveries[it.productId] = pending
    })

    setDispatchQuantities(initialDeliveries)
    setDispatchModalOpen(true)
  }

  const handleConfirmDispatch = (e) => {
    e.preventDefault()

    if (!selectedReq) return

    setDispatchError(null)

    const deliveriesList = Object.entries(
        dispatchQuantities
    ).map(([productId, quantity]) => ({
      productId,
      quantity: Number(quantity) || 0,
    }))

    // Validar existencias disponibles
    for (const d of deliveriesList) {
      if (d.quantity <= 0) continue

      const prod = products.find(
          (p) => p.id === d.productId
      )

      const whStock = prod
          ? prod.stocks[dispatchWarehouseId] || 0
          : 0

      if (d.quantity > whStock) {
        setDispatchError(
            `Stock insuficiente en el almacén seleccionado para "${prod?.name}". Disponible: ${whStock}, A entregar: ${d.quantity}.`
        )

        return
      }
    }

    onFulfillRequisition(
        selectedReq.id,
        dispatchWarehouseId,
        deliveriesList
    )

    setDispatchModalOpen(false)

    setNotification(
        `Despacho PECOSA procesado con éxito para ${selectedReq.correlative}. Existencias actualizadas.`
    )

    setTimeout(() => setNotification(null), 4000)
  }

  return (
      <div className="space-y-6">

        {/* Toast Notification */}
        {notification && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-[#064c32] px-5 py-3.5 text-white shadow-xl transition-all">
              <div className="size-2 rounded-full bg-[#f5db38] animate-ping" />

              <p className="text-sm font-medium">
                {notification}
              </p>

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
              Solicitudes de Materiales (PECOSA)
            </h1>

            <p className="mt-1 text-base text-[#687871] md:text-lg">
              Flujo de requerimiento: Solicitud de área → Aprobación administrativa → Despacho PECOSA.
            </p>
          </div>

          <button
              onClick={handleOpenNew}
              className="flex items-center gap-2 rounded-xl bg-[#075c3b] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#064c32]"
          >
            <Plus className="size-5" />
            Nueva Solicitud
          </button>
        </div>

        {/* Filtros */}
        <div className="mb-5 grid gap-4 rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)] sm:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#84918b]" />

            <input
                type="text"
                placeholder="Buscar por correlativo, área solicitante o motivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#d8e1dd] pl-9 pr-3 text-sm text-[#20372e] outline-none focus:border-[#0b7549]"
            />
          </div>

          <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#52635c] whitespace-nowrap">
            Estado:
          </span>

            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#d8e1dd] bg-white px-3 text-sm text-[#20372e] outline-none focus:border-[#0b7549]"
            >
              <option value="all">Todas las solicitudes</option>
              <option value="pendiente">Pendientes de Revisión</option>
              <option value="aprobada">Aprobadas (Listas para despacho)</option>
              <option value="atendida_parcial">Atendidas Parcialmente</option>
              <option value="atendida">Atendidas Completamente</option>
              <option value="rechazada">Rechazadas</option>
            </select>
          </div>
        </div>

        {/* Lista de Solicitudes */}
        <div className="space-y-4">
          {filteredRequisitions.length === 0 ? (
              <div className="rounded-2xl border border-[#e0e8e4] bg-white p-12 text-center text-[#78847f]">
                No se encontraron solicitudes con los filtros aplicados.
              </div>
          ) : (
              filteredRequisitions.map((r) => {
                const area = areas.find(
                    (a) => a.id === r.areaId
                )

                const isPending = r.status === 'pendiente'

                const isApproved =
                    r.status === 'aprobada' ||
                    r.status === 'atendida_parcial'

                return (
                    <div
                        key={r.id}
                        className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)] transition hover:border-[#075c3b]/40"
                    >
                      <div className="flex flex-col justify-between gap-3 border-b border-[#e8eeeb] pb-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-[#075c3b] bg-[#edf3f0] px-2.5 py-1 rounded-lg">
                      {r.correlative}
                    </span>

                          <div>
                            <h3 className="font-bold text-sm text-[#20372e]">
                              {area?.name}
                            </h3>

                            <p className="text-xs text-[#586860]">
                              Solicitado por:{' '}
                              <strong className="text-[#20372e]">
                                {r.applicantName}
                              </strong>{' '}
                              • {r.date} {r.time}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                            r.status === 'pendiente'
                                ? 'bg-[#fff0a8] text-[#17251d]'
                                : r.status === 'aprobada'
                                    ? 'bg-[#e0f2fe] text-[#0369a1]'
                                    : r.status === 'atendida_parcial'
                                        ? 'bg-[#ede9fe] text-[#6d28d9]'
                                        : r.status === 'atendida'
                                            ? 'bg-[#dff1e4] text-[#08783f]'
                                            : 'bg-[#ffe4e5] text-[#dc252d]'
                        }`}
                    >
                      {r.status === 'atendida_parcial'
                          ? 'Atención Parcial'
                          : r.status.toUpperCase()}
                    </span>

                          {/* Acciones según estado */}
                          {isPending && (
                              <button
                                  onClick={() => handleOpenReview(r)}
                                  className="rounded-xl bg-[#075c3b] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#064c32]"
                              >
                                Revisar / Aprobar
                              </button>
                          )}

                          {isApproved && (
                              <button
                                  onClick={() => handleOpenDispatch(r)}
                                  className="flex items-center gap-1.5 rounded-xl bg-[#f5db38] px-3.5 py-1.5 text-xs font-bold text-[#123b2b] shadow-xs hover:bg-[#e6cc29]"
                              >
                                <PackageCheck className="size-3.5" />
                                Despachar PECOSA
                              </button>
                          )}
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-[#586860] italic">
                        &ldquo;{r.reason}&rdquo;
                      </p>

                      {/* Tabla de productos */}
                      <div className="mt-4 overflow-x-auto rounded-xl border border-[#e0e8e4]">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#075c3b] font-bold text-white">
                          <tr>
                            <th className="p-2.5 pl-3">Producto</th>
                            <th className="p-2.5 text-center">U.M.</th>
                            <th className="p-2.5 text-center">Solicitado</th>
                            <th className="p-2.5 text-center">Aprobado</th>
                            <th className="p-2.5 text-center">Entregado</th>
                            <th className="p-2.5 text-center">Pendiente</th>
                          </tr>
                          </thead>

                          <tbody className="divide-y divide-[#e8eeeb]">
                          {r.items.map((it) => {
                            const pending = Math.max(
                                0,
                                it.approvedQty - it.deliveredQty
                            )

                            return (
                                <tr
                                    key={it.productId}
                                    className="hover:bg-[#f7faf8]"
                                >
                                  <td className="p-2.5 pl-3 font-medium text-[#20372e]">
                                    {it.productName}

                                    <span className="font-mono text-[10px] text-[#075c3b] ml-1.5">
                                {it.productCode}
                              </span>
                                  </td>

                                  <td className="p-2.5 text-center text-[#586860]">
                                    {it.unit}
                                  </td>

                                  <td className="p-2.5 text-center font-bold text-[#20372e]">
                                    {it.requestedQty}
                                  </td>

                                  <td className="p-2.5 text-center font-bold text-[#0369a1]">
                                    {it.approvedQty}
                                  </td>

                                  <td className="p-2.5 text-center font-bold text-[#08783f]">
                                    {it.deliveredQty}
                                  </td>

                                  <td className="p-2.5 text-center font-bold text-[#dc252d]">
                                    {pending}
                                  </td>
                                </tr>
                            )
                          })}
                          </tbody>
                        </table>
                      </div>

                      {r.linkedMovementIds.length > 0 && (
                          <div className="mt-2.5 text-[11px] text-[#586860]">
                            Comprobantes PECOSA emitidos:{' '}
                            <strong className="text-[#075c3b]">
                              {r.linkedMovementIds.join(', ')}
                            </strong>
                          </div>
                      )}
                    </div>
                )
              })
          )}
        </div>

        {/* Modal Nueva Solicitud */}
        {newModalOpen && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-[#092d20]/60 p-4 backdrop-blur-xs"
                onClick={() => setNewModalOpen(false)}
            >
              <div
                  className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between border-b border-[#e8eeeb] pb-3">
                  <h3 className="text-lg font-bold text-[#20372e]">
                    Generar Solicitud de Materiales
                  </h3>

                  <button
                      onClick={() => setNewModalOpen(false)}
                      className="rounded-lg p-1 text-[#78847f] hover:bg-[#f0f1f0]"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <form
                    onSubmit={handleSaveNewRequisition}
                    className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-bold text-[#52635c]">
                      Área Solicitante *

                      <select
                          value={reqAreaId}
                          onChange={(e) => setReqAreaId(e.target.value)}
                          className="mt-1 h-10 w-full rounded-xl border border-[#d8e1dd] bg-white px-3 text-xs text-[#20372e] outline-none focus:border-[#0b7549]"
                      >
                        {areas.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-xs font-bold text-[#52635c]">
                      Solicitante Responsable *

                      <input
                          required
                          value={reqApplicant}
                          onChange={(e) => setReqApplicant(e.target.value)}
                          className="mt-1 h-10 w-full rounded-xl border border-[#d8e1dd] px-3 text-xs text-[#20372e] outline-none focus:border-[#0b7549]"
                      />
                    </label>
                  </div>

                  <label className="block text-xs font-bold text-[#52635c]">
                    Motivo / Justificación Académica o Administrativa

                    <textarea
                        rows={2}
                        value={reqReason}
                        onChange={(e) => setReqReason(e.target.value)}
                        placeholder="Ej. Requerimiento para prácticas en taller y exámenes finales..."
                        className="mt-1 w-full rounded-xl border border-[#d8e1dd] p-2.5 text-xs text-[#20372e] outline-none focus:border-[#0b7549]"
                    />
                  </label>

                  {/* Agregar producto */}
                  <div className="rounded-xl border border-[#e0e8e4] bg-[#edf3f0]/50 p-3 space-y-2">
                    <p className="text-xs font-bold text-[#075c3b]">
                      Agregar Producto Requerido
                    </p>

                    <div className="flex gap-2">
                      <select
                          value={selectedProdId}
                          onChange={(e) => setSelectedProdId(e.target.value)}
                          className="h-9 flex-1 rounded-lg border border-[#d8e1dd] bg-white px-2.5 text-xs text-[#20372e]"
                      >
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.unit})
                            </option>
                        ))}
                      </select>

                      <input
                          type="number"
                          min="1"
                          value={itemQty}
                          onChange={(e) => setItemQty(e.target.value)}
                          className="h-9 w-20 rounded-lg border border-[#d8e1dd] px-2 text-xs text-center"
                          placeholder="Cant."
                      />

                      <button
                          type="button"
                          onClick={handleAddItemToReq}
                          className="rounded-lg bg-[#075c3b] px-3 text-xs font-bold text-white hover:bg-[#064c32]"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>

                  {/* Lista de productos agregados */}
                  {reqItems.length > 0 && (
                      <div className="rounded-xl border border-[#e0e8e4] overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-[#075c3b] font-bold text-white">
                          <tr>
                            <th className="p-2 pl-3">Producto</th>
                            <th className="p-2 text-center">Cantidad</th>
                            <th className="p-2 text-center">Quitar</th>
                          </tr>
                          </thead>

                          <tbody className="divide-y divide-[#e8eeeb]">
                          {reqItems.map((it, idx) => {
                            const p = products.find(
                                (prod) => prod.id === it.productId
                            )

                            if (!p) return null

                            return (
                                <tr key={`${it.productId}-${idx}`}>
                                  <td className="p-2 pl-3 font-medium text-[#20372e]">
                                    {p.name}
                                  </td>

                                  <td className="p-2 text-center font-bold text-[#075c3b]">
                                    {it.requestedQty} {p.unit}
                                  </td>

                                  <td className="p-2 text-center">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setReqItems((prev) =>
                                                prev.filter((_, i) => i !== idx)
                                            )
                                        }
                                        className="text-[#dc252d] font-bold hover:text-[#991b1b]"
                                    >
                                      ×
                                    </button>
                                  </td>
                                </tr>
                            )
                          })}
                          </tbody>
                        </table>
                      </div>
                  )}

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e8eeeb]">
                    <button
                        type="button"
                        onClick={() => setNewModalOpen(false)}
                        className="rounded-xl border border-[#d8e1dd] px-4 py-2.5 text-xs font-bold text-[#52635c] hover:bg-[#f0f1f0]"
                    >
                      Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={reqItems.length === 0}
                        className="rounded-xl bg-[#075c3b] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#064c32] disabled:opacity-50"
                    >
                      Enviar Solicitud
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* Modal Revisar / Aprobar Solicitud */}
        {reviewModalOpen && selectedReq && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-[#092d20]/60 p-4 backdrop-blur-xs"
                onClick={() => setReviewModalOpen(false)}
            >
              <div
                  className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between border-b border-[#e8eeeb] pb-3">
                  <h3 className="text-lg font-bold text-[#20372e]">
                    Revisar Solicitud [{selectedReq.correlative}]
                  </h3>

                  <button
                      onClick={() => setReviewModalOpen(false)}
                      className="rounded-lg p-1 text-[#78847f] hover:bg-[#f0f1f0]"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <form
                    onSubmit={handleConfirmReview}
                    className="space-y-4"
                >
                  <div className="rounded-xl bg-[#edf3f0] p-3 text-xs text-[#20372e]">
                    <p>
                      <strong>Área:</strong>{' '}
                      {areas.find(
                          (a) => a.id === selectedReq.areaId
                      )?.name}
                    </p>

                    <p>
                      <strong>Solicitante:</strong>{' '}
                      {selectedReq.applicantName}
                    </p>

                    <p className="mt-1">
                      <strong>Justificación:</strong>{' '}
                      {selectedReq.reason}
                    </p>
                  </div>

                  <div>
                <span className="text-xs font-bold text-[#52635c]">
                  Resolución de la Solicitud *
                </span>

                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <label
                          className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer ${
                              reviewAction === 'aprobada'
                                  ? 'border-[#075c3b] bg-[#dff1e4] text-[#075c3b]'
                                  : 'border-[#d8e1dd]'
                          }`}
                      >
                        <input
                            type="radio"
                            name="action"
                            checked={reviewAction === 'aprobada'}
                            onChange={() => setReviewAction('aprobada')}
                        />

                        <span className="text-xs font-bold">
                      Aprobar Solicitud
                    </span>
                      </label>

                      <label
                          className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer ${
                              reviewAction === 'rechazada'
                                  ? 'border-[#dc252d] bg-[#ffe4e5] text-[#dc252d]'
                                  : 'border-[#d8e1dd]'
                          }`}
                      >
                        <input
                            type="radio"
                            name="action"
                            checked={reviewAction === 'rechazada'}
                            onChange={() => setReviewAction('rechazada')}
                        />

                        <span className="text-xs font-bold">
                      Rechazar Solicitud
                    </span>
                      </label>
                    </div>
                  </div>

                  <label className="block text-xs font-bold text-[#52635c]">
                    Observación o Dictamen

                    <textarea
                        rows={2}
                        value={reviewObs}
                        onChange={(e) => setReviewObs(e.target.value)}
                        placeholder="Dictamen administrativo..."
                        className="mt-1 w-full rounded-xl border border-[#d8e1dd] p-2.5 text-xs text-[#20372e] outline-none focus:border-[#0b7549]"
                    />
                  </label>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e8eeeb]">
                    <button
                        type="button"
                        onClick={() => setReviewModalOpen(false)}
                        className="rounded-xl border border-[#d8e1dd] px-4 py-2.5 text-xs font-bold text-[#52635c] hover:bg-[#f0f1f0]"
                    >
                      Cancelar
                    </button>

                    <button
                        type="submit"
                        className="rounded-xl bg-[#075c3b] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#064c32]"
                    >
                      Confirmar Dictamen
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* Modal Despachar PECOSA */}
        {dispatchModalOpen && selectedReq && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-[#092d20]/60 p-4 backdrop-blur-xs"
                onClick={() => setDispatchModalOpen(false)}
            >
              <div
                  className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between border-b border-[#e8eeeb] pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#20372e]">
                      Despachar Comprobante PECOSA [{selectedReq.correlative}]
                    </h3>

                    <p className="text-xs text-[#586860]">
                      Esta operación descuenta las existencias físicas del almacén en tiempo real.
                    </p>
                  </div>

                  <button
                      onClick={() => setDispatchModalOpen(false)}
                      className="rounded-lg p-1 text-[#78847f] hover:bg-[#f0f1f0]"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {dispatchError && (
                    <div className="mb-3 rounded-xl border border-[#fecdd3] bg-[#fff1f2] p-3 text-xs font-semibold text-[#dc252d] flex items-center gap-2">
                      <AlertTriangle className="size-4 shrink-0" />
                      {dispatchError}
                    </div>
                )}

                <form
                    onSubmit={handleConfirmDispatch}
                    className="space-y-4"
                >
                  <label className="block text-xs font-bold text-[#52635c]">
                    Almacén desde el cual se realiza el Despacho *

                    <select
                        value={dispatchWarehouseId}
                        onChange={(e) =>
                            setDispatchWarehouseId(e.target.value)
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-[#d8e1dd] bg-white px-3 text-xs font-bold text-[#20372e] outline-none focus:border-[#0b7549]"
                    >
                      {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                      ))}
                    </select>
                  </label>

                  <div className="rounded-xl border border-[#e0e8e4] overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#075c3b] font-bold text-white border-b border-[#064c32]">
                      <tr>
                        <th className="p-2.5 pl-3">Producto</th>
                        <th className="p-2.5 text-center">Pendiente</th>
                        <th className="p-2.5 text-center">Disponible</th>
                        <th className="p-2.5 text-center w-24">A Entregar</th>
                      </tr>
                      </thead>

                      <tbody className="divide-y divide-[#e8eeeb]">
                      {selectedReq.items.map((it) => {
                        const prod = products.find(
                            (p) => p.id === it.productId
                        )

                        const pending = Math.max(
                            0,
                            it.approvedQty - it.deliveredQty
                        )

                        const whStock = prod
                            ? prod.stocks[dispatchWarehouseId] || 0
                            : 0

                        const isLow = whStock < pending

                        return (
                            <tr
                                key={it.productId}
                                className="hover:bg-[#f7faf8]"
                            >
                              <td className="p-2.5 pl-3">
                                <p className="font-bold text-[#20372e]">
                                  {it.productName}
                                </p>

                                <span className="text-[10px] text-[#075c3b] font-mono">
                              {it.productCode}
                            </span>
                              </td>

                              <td className="p-2.5 text-center font-bold text-[#20372e]">
                                {pending} {it.unit}
                              </td>

                              <td
                                  className={`p-2.5 text-center font-bold ${
                                      isLow
                                          ? 'text-[#dc252d]'
                                          : 'text-[#08783f]'
                                  }`}
                              >
                                {whStock}
                              </td>

                              <td className="p-2.5 text-center">
                                <input
                                    type="number"
                                    min="0"
                                    max={whStock}
                                    value={
                                        dispatchQuantities[it.productId] ?? 0
                                    }
                                    onChange={(e) =>
                                        setDispatchQuantities((prev) => ({
                                          ...prev,
                                          [it.productId]:
                                              Number(e.target.value) || 0,
                                        }))
                                    }
                                    className="h-8 w-20 rounded-lg border border-[#d8e1dd] text-center font-bold text-[#075c3b] outline-none focus:border-[#0b7549]"
                                />
                              </td>
                            </tr>
                        )
                      })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e8eeeb]">
                    <button
                        type="button"
                        onClick={() => setDispatchModalOpen(false)}
                        className="rounded-xl border border-[#d8e1dd] px-4 py-2.5 text-xs font-bold text-[#52635c] hover:bg-[#f0f1f0]"
                    >
                      Cancelar
                    </button>

                    <button
                        type="submit"
                        className="rounded-xl bg-[#075c3b] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#064c32]"
                    >
                      Confirmar Entrega y Generar PECOSA
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  )
}

export default SolicitudesView
