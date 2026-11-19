
import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Download,
  Printer,
  X,
} from 'lucide-react'

import { InventoryService } from '../services/inventoryService'
import { DocumentoImprimibleModal } from '../components/modals'

export function ReportesView({ state }) {
  const {
    products,
    warehouses,
    accounts,
    movements,
    areas,
    settings,
  } = state

  const [activeReport, setActiveReport] = useState('inventario_valorizado')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('all')
  const [dateFrom, setDateFrom] = useState('2026-08-01')
  const [dateTo, setDateTo] = useState('2026-10-31')
  const [search, setSearch] = useState('')
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [notification, setNotification] = useState(null)

  const reportsMenu = [
    {
      id: 'inventario_valorizado',
      label: 'Inventario Físico Valorizado',
      tag: 'Patrimonial',
    },
    {
      id: 'existencias_almacen',
      label: 'Existencias por Almacén',
      tag: 'Custodia',
    },
    {
      id: 'jerarquia_contable',
      label: 'Resumen por Cuenta Contable',
      tag: 'Contabilidad',
    },
    {
      id: 'ingresos_salidas',
      label: 'Ingresos y Salidas del Periodo',
      tag: 'Movimientos',
    },
    {
      id: 'consumo_areas',
      label: 'Consumo por Área Solicitante',
      tag: 'PECOSA',
    },
    {
      id: 'mayor_movimiento',
      label: 'Bienes con Mayor Rotación',
      tag: 'Rotación',
    },
    {
      id: 'bajo_minimo',
      label: 'Alertas de Stock Crítico',
      tag: 'Abastecimiento',
    },
    {
      id: 'vencimientos',
      label: 'Control de Lotes y Vencimientos',
      tag: 'Bioseguridad',
    },
  ]

  // Exportar reporte a CSV según el reporte activo
  const handleExportCSV = () => {
    let headers = []
    let rows = []

    const filename = `reporte_${activeReport}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`

    if (activeReport === 'inventario_valorizado') {
      headers = [
        'Codigo',
        'Producto',
        'Cuenta_Contable',
        'Unidad',
        'Stock_Total',
        'Costo_Promedio',
        'Valor_Total',
      ]

      rows = products.map((p) => {
        const { stock, totalValue } =
            InventoryService.getProductTotalStock(p)

        const acc = accounts.find((a) => a.id === p.accountId)
        const avgCost = stock > 0 ? totalValue / stock : 0

        return [
          `"${p.code}"`,
          `"${p.name.replace(/"/g, '""')}"`,
          `"${acc ? acc.code + ' ' + acc.name : ''}"`,
          p.unit,
          stock,
          avgCost.toFixed(2),
          totalValue.toFixed(2),
        ]
      })
    } else if (activeReport === 'existencias_almacen') {
      headers = [
        'Codigo',
        'Producto',
        'Almacen',
        'Stock',
        'Costo_Promedio',
        'Valor_Almacen',
      ]

      products.forEach((p) => {
        warehouses.forEach((w) => {
          if (
              selectedWarehouseId === 'all' ||
              w.id === selectedWarehouseId
          ) {
            const stock = p.stocks[w.id] || 0
            const cost = p.averageCosts[w.id] || 0

            if (stock > 0 || selectedWarehouseId !== 'all') {
              rows.push([
                `"${p.code}"`,
                `"${p.name.replace(/"/g, '""')}"`,
                `"${w.name}"`,
                stock,
                cost.toFixed(2),
                (stock * cost).toFixed(2),
              ])
            }
          }
        })
      })
    } else if (activeReport === 'consumo_areas') {
      headers = [
        'Area',
        'Documento_PECOSA',
        'Fecha',
        'Producto',
        'Cantidad',
        'Importe_Total',
      ]

      movements
          .filter(
              (m) =>
                  m.type === 'salida' &&
                  m.status === 'confirmado'
          )
          .forEach((m) => {
            const area = areas.find((a) => a.id === m.areaId)

            m.items.forEach((it) => {
              rows.push([
                `"${area ? area.name : 'Administración'}"`,
                `"${m.correlative}"`,
                m.date,
                `"${it.productName}"`,
                it.quantity,
                it.totalCost.toFixed(2),
              ])
            })
          })
    } else {
      headers = ['Item', 'Valor']
      rows = [
        ['Datos del reporte', 'Generado correctamente'],
      ]
    }

    const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')

    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setNotification('Reporte descargado en formato CSV.')

    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  // Cálculos generales
  const valorTotalGeneral = useMemo(() => {
    return products.reduce(
        (acc, p) =>
            acc +
            InventoryService.getProductTotalStock(p).totalValue,
        0
    )
  }, [products])

  const lowStockList = useMemo(() => {
    return products.filter((p) => {
      const { stock } =
          InventoryService.getProductTotalStock(p)

      return stock <= p.minStock
    })
  }, [products])

  return (
      <div className="space-y-6">
        {/* Toast Notification */}
        {notification && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-5 py-3.5 text-white shadow-xl transition-all">
              <div className="size-2 rounded-full bg-teal-400 animate-ping" />

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
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-[34px]">
              Centro de Reportes y Balances
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Balances físico-valorizados, conciliación patrimonial y reportes de consumo oficial.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
                onClick={() => setPrintModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
            >
              <Printer className="size-4" />
              Vista Imprimible Oficial
            </button>

            <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Download className="size-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Selector de Informes */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {reportsMenu.map((rep) => {
            const isSelected = activeReport === rep.id

            return (
                <button
                    key={rep.id}
                    onClick={() => setActiveReport(rep.id)}
                    className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                        isSelected
                            ? 'border-teal-700 bg-teal-50/70 shadow-xs ring-2 ring-teal-700/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                >
                  <div>
                <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isSelected
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  {rep.tag}
                </span>

                    <h3 className="mt-2 text-xs font-bold text-slate-900 leading-tight">
                      {rep.label}
                    </h3>
                  </div>

                  <span
                      className={`mt-3 text-[11px] font-semibold ${
                          isSelected
                              ? 'text-teal-800'
                              : 'text-slate-400'
                      }`}
                  >
                {isSelected ? '● Reporte activo' : 'Consultar'}
              </span>
                </button>
            )
          })}
        </div>

        {/* Filtros Contextuales */}
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:grid-cols-3">
          <div>
          <span className="text-xs font-bold uppercase text-slate-500">
            Almacén
          </span>

            <select
                value={selectedWarehouseId}
                onChange={(e) =>
                    setSelectedWarehouseId(e.target.value)
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-teal-600"
            >
              <option value="all">
                Consolidado Institucional (Todos)
              </option>

              {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
              ))}
            </select>
          </div>

          <div>
          <span className="text-xs font-bold uppercase text-slate-500">
            Rango Desde
          </span>

            <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none focus:border-teal-600"
            />
          </div>

          <div>
          <span className="text-xs font-bold uppercase text-slate-500">
            Rango Hasta
          </span>

            <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {/* Contenedor del Reporte Activo */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-6">

          {/* REPORTE 1: Inventario Valorizado */}
          {activeReport === 'inventario_valorizado' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Inventario Físico Valorizado de Existencias
                    </h3>

                    <p className="text-xs text-slate-500">
                      Valuación por costo promedio ponderado móvil al 31/10/2026
                    </p>
                  </div>

                  <div className="text-right">
                <span className="text-xs text-slate-500">
                  Valorización Total Institucional:
                </span>

                    <p className="text-xl font-black text-teal-800">
                      S/{' '}
                      {valorTotalGeneral.toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 pl-3">Código</th>
                      <th className="py-2.5">Descripción del Bien</th>
                      <th className="py-2.5">Cuenta Contable</th>
                      <th className="py-2.5 text-center">U.M.</th>
                      <th className="py-2.5 text-center">Stock Físico</th>
                      <th className="py-2.5 text-right">Costo Prom.</th>
                      <th className="py-2.5 pr-3 text-right">Total Valorizado</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {products.map((p) => {
                      const { stock, totalValue } =
                          InventoryService.getProductTotalStock(p)

                      const acc = accounts.find(
                          (a) => a.id === p.accountId
                      )

                      const cost =
                          stock > 0 ? totalValue / stock : 0

                      return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-2.5 pl-3 font-mono font-bold text-teal-800">
                              {p.code}
                            </td>

                            <td className="py-2.5 font-medium text-slate-900">
                              {p.name}
                            </td>

                            <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                              {acc?.code}
                            </td>

                            <td className="py-2.5 text-center text-slate-600">
                              {p.unit}
                            </td>

                            <td className="py-2.5 text-center font-bold text-slate-800">
                              {stock.toLocaleString('es-PE')}
                            </td>

                            <td className="py-2.5 text-right font-medium">
                              S/ {cost.toFixed(2)}
                            </td>

                            <td className="py-2.5 pr-3 text-right font-bold text-teal-800">
                              S/{' '}
                              {totalValue.toLocaleString('es-PE', {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                      )
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
          )}

          {/* REPORTE 2: Existencias por Almacén */}
          {activeReport === 'existencias_almacen' && (
              <div className="space-y-4">
                <h3 className="font-bold text-base text-slate-900">
                  Desglose de Existencias por Centro de Almacén
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 pl-3">Código</th>
                      <th className="py-2.5">Producto</th>
                      <th className="py-2.5">U.M.</th>
                      <th className="py-2.5 text-center">Almacén Central</th>
                      <th className="py-2.5 text-center">Taller Agropecuaria</th>
                      <th className="py-2.5 text-center">Depósito Biblioteca</th>
                      <th className="py-2.5 pr-3 text-center">Total Stock</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {products.map((p) => {
                      const cStock = p.stocks['alm-1'] || 0
                      const aStock = p.stocks['alm-2'] || 0
                      const bStock = p.stocks['alm-3'] || 0
                      const total = cStock + aStock + bStock

                      return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-2.5 pl-3 font-mono font-bold text-teal-800">
                              {p.code}
                            </td>

                            <td className="py-2.5 font-medium text-slate-900">
                              {p.name}
                            </td>

                            <td className="py-2.5 text-slate-500">
                              {p.unit}
                            </td>

                            <td className="py-2.5 text-center font-semibold text-slate-700">
                              {cStock}
                            </td>

                            <td className="py-2.5 text-center font-semibold text-slate-700">
                              {aStock}
                            </td>

                            <td className="py-2.5 text-center font-semibold text-slate-700">
                              {bStock}
                            </td>

                            <td className="py-2.5 pr-3 text-center font-bold text-teal-800">
                              {total}
                            </td>
                          </tr>
                      )
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
          )}

          {/* REPORTE 3: Jerarquía Contable */}
          {activeReport === 'jerarquia_contable' && (
              <div className="space-y-4">
                <h3 className="font-bold text-base text-slate-900">
                  Valorización Acumulada por Cuentas Contables
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 pl-3">Código</th>
                      <th className="py-2.5">Cuenta Contable</th>
                      <th className="py-2.5 text-center">Nivel</th>
                      <th className="py-2.5 text-center">Bienes Vinculados</th>
                      <th className="py-2.5 pr-3 text-right">Saldo Acumulado</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {accounts.map((acc) => {
                      const descendantIds =
                          InventoryService.getDescendantAccountIds(
                              acc.id,
                              accounts
                          )

                      const matching = products.filter((p) =>
                          descendantIds.includes(p.accountId)
                      )

                      const val = matching.reduce((sum, p) => {
                        return (
                            sum +
                            InventoryService.getProductTotalStock(p)
                                .totalValue
                        )
                      }, 0)

                      return (
                          <tr key={acc.id} className="hover:bg-slate-50">
                            <td className="py-2.5 pl-3 font-mono font-bold text-teal-800">
                              {acc.code}
                            </td>

                            <td className="py-2.5 font-semibold text-slate-800">
                              {'— '.repeat(acc.level - 1)} {acc.name}
                            </td>

                            <td className="py-2.5 text-center text-slate-500">
                              Nivel {acc.level}
                            </td>

                            <td className="py-2.5 text-center font-bold text-slate-700">
                              {matching.length} productos
                            </td>

                            <td className="py-2.5 pr-3 text-right font-black text-slate-900">
                              S/{' '}
                              {val.toLocaleString('es-PE', {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                      )
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
          )}

          {/* REPORTE 5: Consumo por Área Solicitante */}
          {activeReport === 'consumo_areas' && (
              <div className="space-y-4">
                <h3 className="font-bold text-base text-slate-900">
                  Despachos PECOSA por Dependencia Académica y Administrativa
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 pl-3">Área Solicitante</th>
                      <th className="py-2.5">Jefatura</th>
                      <th className="py-2.5 text-center">N° Despachos</th>
                      <th className="py-2.5 pr-3 text-right">Valor Asignado (S/)</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {areas.map((area) => {
                      const areaMovements = movements.filter(
                          (m) =>
                              m.type === 'salida' &&
                              m.areaId === area.id &&
                              m.status === 'confirmado'
                      )

                      const totalAreaVal = areaMovements.reduce(
                          (sum, m) => sum + m.totalAmount,
                          0
                      )

                      return (
                          <tr key={area.id} className="hover:bg-slate-50">
                            <td className="py-2.5 pl-3 font-bold text-slate-900">
                              {area.name}
                            </td>

                            <td className="py-2.5 text-slate-600">
                              {area.manager}
                            </td>

                            <td className="py-2.5 text-center font-semibold text-teal-800">
                              {areaMovements.length} PECOSAS
                            </td>

                            <td className="py-2.5 pr-3 text-right font-black text-slate-900">
                              S/{' '}
                              {totalAreaVal.toLocaleString('es-PE', {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                      )
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
          )}

          {/* REPORTE 7: Bajo Mínimo */}
          {activeReport === 'bajo_minimo' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="size-5" />

                  <h3 className="font-bold text-base text-slate-900">
                    Productos con Existencias Inferiores al Stock de Seguridad
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-rose-50 font-bold uppercase tracking-wider text-rose-900 border-b border-rose-200">
                    <tr>
                      <th className="py-2.5 pl-3">Código</th>
                      <th className="py-2.5">Producto</th>
                      <th className="py-2.5">U.M.</th>
                      <th className="py-2.5 text-center text-rose-800">Stock Actual</th>
                      <th className="py-2.5 text-center">Stock Mínimo</th>
                      <th className="py-2.5 pr-3 text-right font-bold text-emerald-800">
                        Requerimiento Sugerido
                      </th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {lowStockList.map((p) => {
                      const { stock } =
                          InventoryService.getProductTotalStock(p)

                      const reqQty = Math.max(
                          0,
                          p.minStock * 2 - stock
                      )

                      return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-2.5 pl-3 font-mono font-bold text-teal-800">
                              {p.code}
                            </td>

                            <td className="py-2.5 font-bold text-slate-900">
                              {p.name}
                            </td>

                            <td className="py-2.5 text-slate-500">
                              {p.unit}
                            </td>

                            <td className="py-2.5 text-center font-black text-rose-700">
                              {stock}
                            </td>

                            <td className="py-2.5 text-center font-bold text-slate-700">
                              {p.minStock}
                            </td>

                            <td className="py-2.5 pr-3 text-right font-black text-emerald-700">
                              +{reqQty} {p.unit}
                            </td>
                          </tr>
                      )
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
          )}

          {/* REPORTE 8: Lotes y Vencimientos */}
          {activeReport === 'vencimientos' && (
              <div className="space-y-4">
                <h3 className="font-bold text-base text-slate-900">
                  Control Sanitario de Lotes y Fechas de Vencimiento
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 pl-3">Código</th>
                      <th className="py-2.5">Producto de Bioseguridad</th>
                      <th className="py-2.5">U.M.</th>
                      <th className="py-2.5 text-center">Control Lote</th>
                      <th className="py-2.5 text-center">Control Vencimiento</th>
                      <th className="py-2.5 pr-3 text-center">Stock Actual</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {products
                        .filter((p) => p.hasExpiry || p.hasBatches)
                        .map((p) => {
                          const { stock } =
                              InventoryService.getProductTotalStock(p)

                          return (
                              <tr key={p.id} className="hover:bg-slate-50">
                                <td className="py-2.5 pl-3 font-mono font-bold text-teal-800">
                                  {p.code}
                                </td>

                                <td className="py-2.5 font-medium text-slate-900">
                                  {p.name}
                                </td>

                                <td className="py-2.5 text-slate-500">
                                  {p.unit}
                                </td>

                                <td className="py-2.5 text-center">
                            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                              Activo
                            </span>
                                </td>

                                <td className="py-2.5 text-center">
                            <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              Controlado
                            </span>
                                </td>

                                <td className="py-2.5 pr-3 text-center font-bold text-slate-900">
                                  {stock}
                                </td>
                              </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
          )}
        </div>

        {/* Modal Imprimible */}
        <DocumentoImprimibleModal
            isOpen={printModalOpen}
            onClose={() => setPrintModalOpen(false)}
            settings={settings}
            title="INFORME OFICIAL DE INVENTARIO VALORIZADO"
            correlative={`INF-VAL-2026-${activeReport
                .toUpperCase()
                .slice(0, 4)}`}
            date={new Date().toLocaleDateString('es-PE')}
            responsible={state.currentUser.name}
            recipient="Dirección General y Auditoría"
            content={
              <div className="space-y-4">
                <p className="text-slate-700 leading-relaxed">
                  El suscrito responsable de la Unidad de Abastecimiento y
                  Almacén hace constar que al cierre del ejercicio fiscal en
                  curso, el inventario valorizado asciende a un total de{' '}
                  <strong>
                    S/ {valorTotalGeneral.toLocaleString('es-PE', {
                    minimumFractionDigits: 2,
                  })}
                  </strong>{' '}
                  distribuidos en {products.length} bienes catalogados,
                  bajo la aplicación estricta del método de valuación
                  Promedio Ponderado Móvil.
                </p>

                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 pl-3">Código</th>
                    <th className="p-2">Bien Patrimonial</th>
                    <th className="p-2 text-center">U.M.</th>
                    <th className="p-2 text-center">Stock</th>
                    <th className="p-2 text-right pr-3">Total Val. (S/)</th>
                  </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                  {products.slice(0, 15).map((p) => {
                    const { stock, totalValue } =
                        InventoryService.getProductTotalStock(p)

                    return (
                        <tr key={p.id}>
                          <td className="p-2 pl-3 font-mono">
                            {p.code}
                          </td>

                          <td className="p-2 font-medium">
                            {p.name}
                          </td>

                          <td className="p-2 text-center">
                            {p.unit}
                          </td>

                          <td className="p-2 text-center font-bold">
                            {stock}
                          </td>

                          <td className="p-2 text-right pr-3 font-bold">
                            S/ {totalValue.toFixed(2)}
                          </td>
                        </tr>
                    )
                  })}
                  </tbody>
                </table>

                <p className="text-[11px] text-slate-500 italic">
                  * Mostrando extracto de los principales 15 bienes representativos.
                </p>
              </div>
            }
        />
      </div>
  )
}

export default ReportesView
