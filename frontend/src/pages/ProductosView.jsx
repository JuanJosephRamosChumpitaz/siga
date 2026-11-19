
import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Download,
  Edit3,
  Eye,
  FileText,
  Plus,
  Power,
  Search,
  X,
} from 'lucide-react'
import { InventoryService } from '../services/inventoryService'

export function ProductosView({
                                state,
                                initialAccountIdFilter,
                                initialStockFilter,
                                onSaveProduct,
                                onToggleProductStatus,
                                onOpenKardex,
                              }) {
  const { products, accounts, warehouses } = state

  const [search, setSearch] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState(
      initialAccountIdFilter || 'all'
  )
  const [stockStatusFilter, setStockStatusFilter] = useState(
      initialStockFilter || 'all'
  )
  const [warehouseFilter, setWarehouseFilter] = useState('all')

  const [modalMode, setModalMode] = useState(null)
  const [activeProduct, setActiveProduct] = useState(null)
  const [formError, setFormError] = useState(null)
  const [notification, setNotification] = useState(null)

  // Form state
  const [fCode, setFCode] = useState('')
  const [fName, setFName] = useState('')
  const [fDescription, setFDescription] = useState('')
  const [fUnit, setFUnit] = useState('Unidad')
  const [fAccountId, setFAccountId] = useState('')
  const [fBrand, setFBrand] = useState('')
  const [fModel, setFModel] = useState('')
  const [fBarcode, setFBarcode] = useState('')
  const [fMinStock, setFMinStock] = useState('10')
  const [fMaxStock, setFMaxStock] = useState('200')
  const [fHasBatches, setFHasBatches] = useState(false)
  const [fHasExpiry, setFHasExpiry] = useState(false)
  const [fNotes, setFNotes] = useState('')

  // Cuentas habilitadas para productos
  const assignableAccounts = useMemo(() => {
    return accounts.filter(
        (a) => a.allowsProducts && a.status === 'activo'
    )
  }, [accounts])

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Búsqueda
      const q = search.toLowerCase()

      const matchSearch =
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))

      // Filtro de cuenta (incluyendo descendientes)
      let matchAccount = true

      if (selectedAccountId !== 'all') {
        const allowedIds = InventoryService.getDescendantAccountIds(
            selectedAccountId,
            accounts
        )

        matchAccount = allowedIds.includes(p.accountId)
      }

      // Stock
      const { stock } = InventoryService.getProductTotalStock(p)

      let matchStock = true

      if (stockStatusFilter === 'low') {
        matchStock = stock <= p.minStock && stock > 0
      } else if (stockStatusFilter === 'out') {
        matchStock = stock <= 0
      } else if (stockStatusFilter === 'normal') {
        matchStock = stock > p.minStock
      }

      return matchSearch && matchAccount && matchStock
    })
  }, [products, search, selectedAccountId, stockStatusFilter, accounts])

  const handleOpenCreate = () => {
    setFormError(null)
    setActiveProduct(null)

    setFCode(`PRD-${String(products.length + 1).padStart(3, '0')}`)
    setFName('')
    setFDescription('')
    setFUnit('Unidad')
    setFAccountId(assignableAccounts[0]?.id || '')
    setFBrand('')
    setFModel('')
    setFBarcode('')
    setFMinStock('15')
    setFMaxStock('200')
    setFHasBatches(false)
    setFHasExpiry(false)
    setFNotes('')

    setModalMode('create')
  }

  const handleOpenEdit = (prod) => {
    setFormError(null)
    setActiveProduct(prod)

    setFCode(prod.code)
    setFName(prod.name)
    setFDescription(prod.description)
    setFUnit(prod.unit)
    setFAccountId(prod.accountId)
    setFBrand(prod.brand || '')
    setFModel(prod.model || '')
    setFBarcode(prod.barcode || '')
    setFMinStock(String(prod.minStock))
    setFMaxStock(String(prod.maxStock))
    setFHasBatches(prod.hasBatches)
    setFHasExpiry(prod.hasExpiry)
    setFNotes(prod.notes || '')

    setModalMode('edit')
  }

  const handleOpenDetail = (prod) => {
    setActiveProduct(prod)
    setModalMode('detail')
  }

  const handleSaveForm = (e) => {
    e.preventDefault()
    setFormError(null)

    const cleanCode = fCode.trim().toUpperCase()
    const cleanName = fName.trim()

    if (!cleanCode || !cleanName) {
      setFormError('El código y el nombre del producto son requeridos.')
      return
    }

    // Validar código duplicado
    const duplicate = products.find(
        (p) =>
            p.code.toUpperCase() === cleanCode &&
            (modalMode === 'create' || p.id !== activeProduct?.id)
    )

    if (duplicate) {
      setFormError(
          `El código patrimonial "${cleanCode}" ya pertenece a otro producto.`
      )
      return
    }

    if (!fAccountId) {
      setFormError('Debe asociar el producto a una cuenta contable válida.')
      return
    }

    if (modalMode === 'create') {
      const initialStocks = {}
      const initialCosts = {}

      warehouses.forEach((w) => {
        initialStocks[w.id] = 0
        initialCosts[w.id] = 0
      })

      const newProd = {
        id: `prod-${Date.now()}`,
        code: cleanCode,
        name: cleanName,
        description: fDescription.trim(),
        unit: fUnit,
        accountId: fAccountId,
        brand: fBrand.trim() || undefined,
        model: fModel.trim() || undefined,
        barcode: fBarcode.trim() || undefined,
        minStock: Number(fMinStock) || 10,
        maxStock: Number(fMaxStock) || 200,
        hasBatches: fHasBatches,
        hasExpiry: fHasExpiry,
        status: 'activo',
        notes: fNotes.trim() || undefined,
        stocks: initialStocks,
        averageCosts: initialCosts,
      }

      onSaveProduct(newProd, true)
      setModalMode(null)

      setNotification(`Producto "${cleanName}" creado correctamente.`)
      setTimeout(() => setNotification(null), 4000)
    } else if (modalMode === 'edit' && activeProduct) {
      const updatedProd = {
        ...activeProduct,
        code: cleanCode,
        name: cleanName,
        description: fDescription.trim(),
        unit: fUnit,
        accountId: fAccountId,
        brand: fBrand.trim() || undefined,
        model: fModel.trim() || undefined,
        barcode: fBarcode.trim() || undefined,
        minStock: Number(fMinStock) || 10,
        maxStock: Number(fMaxStock) || 200,
        hasBatches: fHasBatches,
        hasExpiry: fHasExpiry,
        notes: fNotes.trim() || undefined,
      }

      onSaveProduct(updatedProd, false)
      setModalMode(null)

      setNotification(`Producto "${cleanCode}" actualizado con éxito.`)
      setTimeout(() => setNotification(null), 4000)
    }
  }

  const handleExportCatalog = () => {
    const headers = [
      'Codigo',
      'Nombre',
      'Unidad',
      'Cuenta_Contable',
      'Marca',
      'Stock_Minimo',
      'Stock_Total',
      'Valor_Total',
      'Estado',
    ]

    const escapeCSV = (value) => {
      const text = String(value ?? '')
      return `"${text.replace(/"/g, '""')}"`
    }

    const rows = products.map((p) => {
      const { stock, totalValue } =
          InventoryService.getProductTotalStock(p)

      const acc = accounts.find((a) => a.id === p.accountId)

      return [
        escapeCSV(p.code),
        escapeCSV(p.name),
        escapeCSV(p.unit),
        escapeCSV(acc ? `${acc.code} - ${acc.name}` : ''),
        escapeCSV(p.brand || ''),
        p.minStock,
        stock,
        totalValue.toFixed(2),
        escapeCSV(p.status),
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
        `catalogo_productos_sigal_${new Date().toISOString().slice(0, 10)}.csv`
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
              Catálogo Maestro de Productos
            </h1>

            <p className="mt-1 text-base text-[#687871] md:text-lg">
              Control de existencias multialmacén, clasificación contable y
              valorización automática.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 rounded-xl bg-[#075c3b] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#064c32]"
            >
              <Plus className="size-5" />
              Nuevo Producto
            </button>

            <button
                onClick={handleExportCatalog}
                className="flex items-center gap-2 rounded-xl border border-[#075c3b] bg-white px-5 py-3.5 text-sm font-bold text-[#075c3b] hover:bg-[#edf3f0]"
            >
              <Download className="size-5" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="mb-5 grid gap-4 rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)] md:grid-cols-4">
          {/* Buscador */}
          <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#52635c]">
            Buscar
          </span>

            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#84918b]" />

              <input
                  type="text"
                  placeholder="Código, nombre o marca..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#d8e1dd] pl-9 pr-3 text-sm text-[#20372e] outline-none focus:border-[#0b7549]"
              />
            </div>
          </div>

          {/* Filtro Cuenta Contable */}
          <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#52635c]">
            Cuenta Contable
          </span>

            <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#d8e1dd] bg-white px-3 text-sm text-[#20372e] outline-none focus:border-[#0b7549]"
            >
              <option value="all">Todas las cuentas contables</option>

              {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {'— '.repeat(a.level - 1)} {a.code} - {a.name}
                  </option>
              ))}
            </select>
          </div>

          {/* Filtro Nivel de Stock */}
          <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#52635c]">
            Nivel de Existencias
          </span>

            <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#d8e1dd] bg-white px-3 text-sm text-[#20372e] outline-none focus:border-[#0b7549]"
            >
              <option value="all">Todos los estados</option>
              <option value="normal">Stock Normal (&gt; Mínimo)</option>
              <option value="low">Bajo Stock Mínimo (Alerta)</option>
              <option value="out">Sin Existencias (0)</option>
            </select>
          </div>

          {/* Resumen Contador */}
          <div className="flex flex-col justify-end text-xs text-[#586860] pb-1">
            <p>
              Mostrando <strong>{filteredProducts.length}</strong> de{' '}
              {products.length} productos
            </p>

            <p className="text-[11px] text-[#075c3b] font-medium">
              * El stock y costo se calculan desde los movimientos
            </p>
          </div>
        </div>

        {/* Tabla de Productos */}
        <div className="overflow-hidden rounded-2xl border border-[#e0e8e4] bg-white shadow-[0_2px_10px_rgba(21,55,42,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#075c3b] text-white font-bold">
              <tr>
                <th className="py-4 pl-5 pr-3">Código</th>
                <th className="py-4 px-3">Descripción del Bien</th>
                <th className="py-4 px-3">Cuenta Contable</th>
                <th className="py-4 px-3">U.M.</th>
                <th className="py-4 px-3 text-center">Stock Institucional</th>
                <th className="py-4 px-3 text-right">Valor Total (S/)</th>
                <th className="py-4 px-3 text-center">Estado</th>
                <th className="py-4 pr-5 pl-3 text-center">Acciones</th>
              </tr>
              </thead>

              <tbody className="divide-y divide-[#e8eeeb]">
              {filteredProducts.length === 0 ? (
                  <tr>
                    <td
                        colSpan={8}
                        className="py-12 text-center text-[#78847f]"
                    >
                      No se encontraron productos con los criterios seleccionados.
                    </td>
                  </tr>
              ) : (
                  filteredProducts.map((p) => {
                    const { stock, totalValue } =
                        InventoryService.getProductTotalStock(p)

                    const isLow = stock <= p.minStock && stock > 0
                    const isOut = stock <= 0

                    const account = accounts.find(
                        (a) => a.id === p.accountId
                    )

                    return (
                        <tr
                            key={p.id}
                            className={`hover:bg-[#f7faf8] transition border-b border-[#e8eeeb] last:border-0 ${
                                p.status === 'inactivo'
                                    ? 'opacity-50 bg-[#f0f1f0]/50'
                                    : ''
                            }`}
                        >
                          <td className="py-3.5 pl-5 pr-3 font-mono font-bold text-[#075c3b]">
                            {p.code}
                          </td>

                          <td className="py-3.5 px-3 max-w-[260px]">
                            <p className="font-bold text-[#20372e] truncate">
                              {p.name}
                            </p>

                            <div className="flex items-center gap-2 text-[11px] text-[#586860]">
                              {p.brand && <span>Marca: {p.brand}</span>}

                              {p.hasBatches && (
                                  <span className="rounded bg-[#edf3f0] px-1 font-bold text-[#075c3b]">
                              Lote
                            </span>
                              )}

                              {p.hasExpiry && (
                                  <span className="rounded bg-[#fff0a8] px-1 font-bold text-[#17251d]">
                              Vence
                            </span>
                              )}
                            </div>
                          </td>

                          <td
                              className="py-3.5 px-3 text-[#586860] max-w-[200px] truncate"
                              title={account?.name}
                          >
                        <span className="font-mono text-[11px] font-bold text-[#075c3b] bg-[#edf3f0] px-1.5 py-0.5 rounded mr-1">
                          {account?.code}
                        </span>
                            {account?.name}
                          </td>

                          <td className="py-3.5 px-3 font-medium text-[#20372e]">
                            {p.unit}
                          </td>

                          <td className="py-3.5 px-3 text-center">
                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold ${
                                isOut
                                    ? 'bg-[#ffe4e5] text-[#dc252d]'
                                    : isLow
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                            }`}
                        >
                          {stock.toLocaleString('es-PE')}

                          {isLow && (
                              <span className="text-[10px]">(Bajo mín.)</span>
                          )}

                          {isOut && (
                              <span className="text-[10px]">(Agotado)</span>
                          )}
                        </span>
                          </td>

                          <td className="py-3.5 px-3 text-right font-bold text-[#20372e]">
                            S/{' '}
                            {totalValue.toLocaleString('es-PE', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>

                          <td className="py-3.5 px-3 text-center">
                        <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                p.status === 'activo'
                                    ? 'bg-[#dff1e4] text-[#08783f]'
                                    : 'bg-[#f0f1f0] text-[#78847f]'
                            }`}
                        >
                          {p.status === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                          </td>

                          <td className="py-3.5 pr-5 pl-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                  type="button"
                                  onClick={() => handleOpenDetail(p)}
                                  className="rounded-lg border border-[#d8e1dd] bg-white p-1.5 text-[#586860] hover:bg-[#edf3f0] hover:text-[#075c3b]"
                                  title="Ver ficha técnica y existencias por almacén"
                              >
                                <Eye className="size-3.5" />
                              </button>

                              <button
                                  type="button"
                                  onClick={() => onOpenKardex(p.id)}
                                  className="rounded-lg border border-[#075c3b]/30 bg-[#edf3f0] p-1.5 text-[#075c3b] hover:bg-[#dff1e4]"
                                  title="Ver Kardex físico valorizado"
                              >
                                <FileText className="size-3.5" />
                              </button>

                              <button
                                  type="button"
                                  onClick={() => handleOpenEdit(p)}
                                  className="rounded-lg border border-[#d8e1dd] bg-white p-1.5 text-[#586860] hover:bg-[#edf3f0]"
                                  title="Editar datos del producto"
                              >
                                <Edit3 className="size-3.5" />
                              </button>

                              <button
                                  type="button"
                                  onClick={() => onToggleProductStatus(p.id)}
                                  className={`rounded-lg border p-1.5 ${
                                      p.status === 'activo'
                                          ? 'border-[#fecdd3] text-[#dc252d] hover:bg-[#ffe4e5]'
                                          : 'border-[#bbf7d0] text-[#08783f] hover:bg-[#dff1e4]'
                                  }`}
                                  title={
                                    p.status === 'activo'
                                        ? 'Desactivar producto'
                                        : 'Activar producto'
                                  }
                              >
                                <Power className="size-3.5" />
                              </button>
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

        {/* Modal Ficha Detallada del Producto */}
        {modalMode === 'detail' && activeProduct && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-[#092d20]/60 p-4 backdrop-blur-xs"
                onClick={() => setModalMode(null)}
            >
              <div
                  className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between border-b border-[#e8eeeb] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#075c3b] bg-[#edf3f0] px-2.5 py-0.5 rounded-md">
                    {activeProduct.code}
                  </span>

                      <h3 className="text-lg font-bold text-[#20372e]">
                        {activeProduct.name}
                      </h3>
                    </div>

                    <p className="text-xs text-[#586860] mt-0.5">
                      {activeProduct.description}
                    </p>
                  </div>

                  <button
                      onClick={() => setModalMode(null)}
                      className="rounded-lg p-1 text-[#78847f] hover:bg-[#f0f1f0]"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Clasificación Contable */}
                <div className="mb-4 rounded-xl border border-[#e0e8e4] bg-[#edf3f0] p-3 text-xs">
              <span className="font-bold text-[#20372e]">
                Ruta Contable:{' '}
              </span>

                  <span className="text-[#075c3b] font-semibold">
                {InventoryService.getAccountPath(
                    activeProduct.accountId,
                    accounts
                )}
              </span>
                </div>

                {/* Existencias por Almacén */}
                <h4 className="font-bold text-xs uppercase text-[#52635c] mb-2">
                  Existencias Físicas y Costos por Almacén
                </h4>

                <div className="grid gap-3 sm:grid-cols-3 mb-5">
                  {warehouses.map((w) => {
                    const stock = activeProduct.stocks[w.id] || 0
                    const cost = activeProduct.averageCosts[w.id] || 0
                    const total = Math.round(stock * cost * 100) / 100

                    return (
                        <div
                            key={w.id}
                            className="rounded-xl border border-[#e0e8e4] p-3.5 bg-white"
                        >
                          <p className="text-xs font-bold text-[#20372e]">
                            {w.name}
                          </p>

                          <p className="mt-1 text-lg font-black text-[#075c3b]">
                            {stock.toLocaleString('es-PE')}{' '}
                            <span className="text-xs font-normal text-[#586860]">
                        {activeProduct.unit}
                      </span>
                          </p>

                          <div className="mt-2 text-[11px] text-[#586860] border-t border-[#e8eeeb] pt-1.5 flex justify-between">
                            <span>Costo Prom:</span>
                            <strong className="text-[#20372e]">
                              S/ {cost.toFixed(2)}
                            </strong>
                          </div>

                          <div className="text-[11px] text-[#586860] flex justify-between">
                            <span>Valorización:</span>
                            <strong className="text-[#075c3b]">
                              S/ {total.toFixed(2)}
                            </strong>
                          </div>
                        </div>
                    )
                  })}
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e8eeeb]">
                  <button
                      type="button"
                      onClick={() => setModalMode(null)}
                      className="rounded-xl border border-[#d8e1dd] px-4 py-2.5 text-xs font-bold text-[#52635c] hover:bg-[#f0f1f0]"
                  >
                    Cerrar
                  </button>

                  <button
                      type="button"
                      onClick={() => {
                        setModalMode(null)
                        onOpenKardex(activeProduct.id)
                      }}
                      className="rounded-xl bg-[#075c3b] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#064c32]"
                  >
                    Abrir Kardex Físico Valorizado →
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Modal Nuevo / Editar Producto */}
        {(modalMode === 'create' || modalMode === 'edit') && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-[#092d20]/60 p-4 backdrop-blur-xs"
                onClick={() => setModalMode(null)}
            >
              <div
                  className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between border-b border-[#e8eeeb] pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#20372e]">
                      {modalMode === 'create'
                          ? 'Registrar Nuevo Bien en Almacén'
                          : `Editar Bien [${activeProduct?.code}]`}
                    </h3>

                    <p className="text-xs text-[#586860]">
                      Los saldos y costos unitarios se calcularán automáticamente
                      desde los movimientos.
                    </p>
                  </div>

                  <button
                      onClick={() => setModalMode(null)}
                      className="rounded-lg p-1 text-[#78847f] hover:bg-[#f0f1f0]"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {formError && (
                    <div className="mb-4 rounded-xl border border-[#fecdd3] bg-[#fff1f2] p-3 text-xs font-medium text-[#dc252d] flex items-center gap-2">
                      <AlertTriangle className="size-4 shrink-0" />
                      {formError}
                    </div>
                )}

                <form onSubmit={handleSaveForm} className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <label className="text-xs font-bold text-[#52635c]">
                      Código Interno Único *
                      <input
                          required
                          value={fCode}
                          onChange={(e) => setFCode(e.target.value)}
                          placeholder="PB-001"
                          className="mt-1 h-10 w-full rounded-xl border border-[#d8e1dd] px-3 font-mono text-sm font-bold text-[#075c3b] outline-none focus:border-[#0b7549]"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#52635c]">
                      Unidad de Medida *
                      <select
                          value={fUnit}
                          onChange={(e) => setFUnit(e.target.value)}
                          className="mt-1 h-10 w-full rounded-xl border border-[#d8e1dd] px-3 text-xs text-[#20372e] outline-none focus:border-[#0b7549]"
                      >
                        <option>Unidad</option>
                        <option>Millar</option>
                        <option>Caja x 50</option>
                        <option>Caja x 12</option>
                        <option>Caja x 10</option>
                        <option>Paquete x 200</option>
                        <option>Paquete x 10</option>
                        <option>Frasco</option>
                        <option>Galón</option>
                        <option>Bolsa</option>
                        <option>Kit</option>
                        <option>Bobina</option>
                        <option>Rollo</option>
                      </select>
                    </label>

                    <label className="text-xs font-bold text-[#52635c]">
                      Código de Barras (Opcional)
                      <input
                          value={fBarcode}
                          onChange={(e) => setFBarcode(e.target.value)}
                          placeholder="775123456789"
                          className="mt-1 h-10 w-full rounded-xl border border-[#d8e1dd] px-3 text-xs text-[#20372e] outline-none focus:border-[#0b7549]"
                      />
                    </label>
                  </div>

                  <label className="block text-xs font-bold text-[#52635c]">
                    Nombre Completo del Bien *
                    <input
                        required
                        value={fName}
                        onChange={(e) => setFName(e.target.value)}
                        placeholder="Ej. Papel bond A4 75g (Millar)"
                        className="mt-1 h-10 w-full rounded-xl border border-[#d8e1dd] px-3 text-sm text-[#20372e] outline-none focus:border-[#0b7549]"
                    />
                  </label>

                  <label className="block text-xs font-bold text-[#52635c]">
                    Descripción y Características Técnicas
                    <textarea
                        rows={2}
                        value={fDescription}
                        onChange={(e) => setFDescription(e.target.value)}
                        placeholder="Especificaciones de gramaje, color, dimensiones, etc."
                        className="mt-1 w-full rounded-xl border border-[#d8e1dd] p-2.5 text-xs text-[#20372e] outline-none focus:border-[#0b7549]"
                    />
                  </label>

                  {/* Cuenta Contable Jerárquica */}
                  <label className="block text-xs font-bold text-[#52635c]">
                    Cuenta Contable Gubernamental *
                    <select
                        required
                        value={fAccountId}
                        onChange={(e) => setFAccountId(e.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-[#d8e1dd] px-3 text-xs text-[#20372e] outline-none focus:border-[#0b7549]"
                    >
                      <option value="">
                        -- Seleccione la cuenta contable --
                      </option>

                      {assignableAccounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} — {a.name}
                          </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-bold text-[#52635c]">
                      Marca
                      <input
                          value={fBrand}
                          onChange={(e) => setFBrand(e.target.value)}
                          placeholder="Ej. Chamex, Faber-Castell, HP"
                          className="mt-1 h-10 w-full rounded-xl border border-[#d8e1dd] px-3 text-xs text-[#20372e] outline-none focus:border-[#0b7549]"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#52635c]">
                      Modelo / Referencia
                      <input
                          value={fModel}
                          onChange={(e) => setFModel(e.target.value)}
                          placeholder="Ej. CE285A, DIN 2x25A"
                          className="mt-1 h-10 w-full rounded-xl border border-[#d8e1dd] px-3 text-xs text-[#20372e] outline-none focus:border-[#0b7549]"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-bold text-[#52635c]">
                      Stock Mínimo (Alerta de reposición)
                      <input
                          type="number"
                          min="1"
                          value={fMinStock}
                          onChange={(e) => setFMinStock(e.target.value)}
                          className="mt-1 h-10 w-full rounded-xl border border-[#d8e1dd] px-3 text-xs text-[#20372e] outline-none focus:border-[#0b7549]"
                      />
                    </label>

                    <label className="text-xs font-bold text-[#52635c]">
                      Stock Máximo Recomendado
                      <input
                          type="number"
                          min="1"
                          value={fMaxStock}
                          onChange={(e) => setFMaxStock(e.target.value)}
                          className="mt-1 h-10 w-full rounded-xl border border-[#d8e1dd] px-3 text-xs text-[#20372e] outline-none focus:border-[#0b7549]"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#e0e8e4] bg-[#edf3f0]/50 p-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                          type="checkbox"
                          checked={fHasBatches}
                          onChange={(e) => setFHasBatches(e.target.checked)}
                          className="size-4 accent-[#075c3b] rounded"
                      />

                      <span className="text-xs font-semibold text-[#20372e]">
                    Control por Lote de Fabricación
                  </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                          type="checkbox"
                          checked={fHasExpiry}
                          onChange={(e) => setFHasExpiry(e.target.checked)}
                          className="size-4 accent-[#075c3b] rounded"
                      />

                      <span className="text-xs font-semibold text-[#20372e]">
                    Control de Fecha de Vencimiento
                  </span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e8eeeb]">
                    <button
                        type="button"
                        onClick={() => setModalMode(null)}
                        className="rounded-xl border border-[#d8e1dd] px-4 py-2.5 text-xs font-bold text-[#52635c] hover:bg-[#f0f1f0]"
                    >
                      Cancelar
                    </button>

                    <button
                        type="submit"
                        className="rounded-xl bg-[#075c3b] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#064c32]"
                    >
                      Guardar Producto
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  )
}

export default ProductosView
