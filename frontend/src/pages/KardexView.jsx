
import React, { useState, useMemo } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Boxes,
  CalendarDays,
  Download,
  Package,
  Plus,
  Printer,
  X,
} from 'lucide-react';

import { InventoryService } from '../services/inventoryService';

export function KardexView({
                             state,
                             selectedProductId,
                             onOpenNewMovement,
                             onPrintKardex,
                           }) {
  const {
    products = [],
    warehouses = [],
    accounts = [],
    movements = [],
  } = state;

  const [productId, setProductId] = useState(
      selectedProductId || products[0]?.id || ''
  );

  const [warehouseId, setWarehouseId] = useState(
      warehouses[0]?.id || 'alm-1'
  );

  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-10-31');
  const [typeFilter, setTypeFilter] = useState('all');
  const [notification, setNotification] = useState(null);

  // Producto seleccionado
  const product = useMemo(() => {
    return products.find((p) => p.id === productId) || products[0];
  }, [products, productId]);

  // Nombre del almacén
  const warehouse = useMemo(() => {
    return (
        warehouses.find((w) => w.id === warehouseId) || warehouses[0]
    );
  }, [warehouses, warehouseId]);

  // Ruta contable del producto
  const accountPath = useMemo(() => {
    if (!product) return '';

    return InventoryService.getAccountPath(
        product.accountId,
        accounts
    );
  }, [product, accounts]);

  // Calcular Kardex con promedio ponderado móvil
  const kardexData = useMemo(() => {
    if (!product) return null;

    return InventoryService.calculateKardex(
        product.id,
        warehouseId,
        movements,
        startDate,
        endDate
    );
  }, [product, warehouseId, movements, startDate, endDate]);

  // Filtrar movimientos
  const filteredRows = useMemo(() => {
    if (!kardexData) return [];

    if (typeFilter === 'all') {
      return kardexData.rows;
    }

    return kardexData.rows.filter((row) => row.type === typeFilter);
  }, [kardexData, typeFilter]);

  // Exportar Kardex a CSV
  const handleExportCSV = () => {
    if (!kardexData || !product) return;

    const headers = [
      'Fecha',
      'Hora',
      'Correlativo',
      'Documento',
      'Tipo_Operacion',
      'Motivo',
      'Origen_Destino',
      'Entradas_Cant',
      'Entradas_CostoUnit',
      'Entradas_Total',
      'Salidas_Cant',
      'Salidas_CostoUnit',
      'Salidas_Total',
      'Saldo_Cant',
      'Saldo_CostoProm',
      'Saldo_Total',
      'Usuario',
    ];

    const escapeCSV = (value) => {
      const text = String(value ?? '');
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = filteredRows.map((r) => [
      escapeCSV(r.date),
      escapeCSV(r.time),
      escapeCSV(r.correlative),
      escapeCSV(`${r.docType} ${r.docNumber}`),
      escapeCSV(r.type),
      escapeCSV(r.reason),
      escapeCSV(r.originOrDestination),
      r.entryQty || '',
      r.entryCost ? r.entryCost.toFixed(2) : '',
      r.entryTotal ? r.entryTotal.toFixed(2) : '',
      r.exitQty || '',
      r.exitCost ? r.exitCost.toFixed(2) : '',
      r.exitTotal ? r.exitTotal.toFixed(2) : '',
      r.balanceQty,
      r.balanceCost.toFixed(2),
      r.balanceTotal.toFixed(2),
      escapeCSV(r.user),
    ]);

    const csvContent =
        '\uFEFF' +
        [
          '"KARDEX FISICO VALORIZADO - METODO PROMEDIO PONDERADO MOVIL"',
          escapeCSV(`Producto: ${product.code} - ${product.name}`),
          escapeCSV(`Almacen: ${warehouse?.name || ''}`),
          escapeCSV(`Periodo: ${startDate} al ${endDate}`),
          headers.join(','),
          ...rows.map((row) => row.join(',')),
        ].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute(
        'download',
        `kardex_${product.code}_${warehouse?.code || 'almacen'}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification('Ficha Kardex exportada en CSV.');
    setTimeout(() => setNotification(null), 3000);
  };

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
              Kardex de producto
            </h1>

            <p className="mt-1 text-base text-[#687871] md:text-lg">
              Consulta de entradas, salidas y existencias con método
              promedio ponderado móvil.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
                onClick={onOpenNewMovement}
                className="flex items-center gap-2 rounded-xl bg-[#075c3b] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#064c32]"
            >
              <Plus className="size-5" />
              Nuevo movimiento
            </button>

            <button
                onClick={() =>
                    product &&
                    onPrintKardex(
                        product,
                        warehouse?.name || '',
                        kardexData
                    )
                }
                disabled={!product || !kardexData}
                className="flex items-center gap-2 rounded-xl border border-[#075c3b] bg-white px-5 py-3.5 text-sm font-bold text-[#075c3b] hover:bg-[#edf3f0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer className="size-5" />
              Imprimir Ficha
            </button>

            <button
                onClick={handleExportCSV}
                disabled={!product || !kardexData}
                className="hidden items-center gap-2 rounded-xl border border-[#075c3b] bg-white px-5 py-3.5 text-sm font-bold text-[#075c3b] hover:bg-[#edf3f0] disabled:cursor-not-allowed disabled:opacity-50 md:flex"
            >
              <Download className="size-5" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Filtros de Producto, Almacén y Fechas */}
        <div className="mb-5 grid gap-4 rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)] md:grid-cols-2 xl:grid-cols-[1.45fr_1.1fr_1fr_1fr]">
          {/* Selector de Producto */}
          <label className="flex flex-col gap-2 text-sm font-bold text-[#52635c]">
            Producto

            <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="h-12 rounded-xl border border-[#d8e1dd] bg-white px-4 text-sm font-normal text-[#20372e] outline-none focus:border-[#0b7549]"
            >
              {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
              ))}
            </select>
          </label>

          {/* Almacén */}
          <label className="flex flex-col gap-2 text-sm font-bold text-[#52635c]">
            Almacén

            <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="h-12 rounded-xl border border-[#d8e1dd] bg-white px-4 text-sm font-normal text-[#20372e] outline-none focus:border-[#0b7549]"
            >
              {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
              ))}
            </select>
          </label>

          {/* Fecha Desde */}
          <label className="flex flex-col gap-2 text-sm font-bold text-[#52635c]">
            Fecha desde

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#64756d]" />

              <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-12 w-full rounded-xl border border-[#d8e1dd] bg-white pl-11 pr-3 text-sm text-[#20372e] outline-none focus:border-[#0b7549]"
              />
            </div>
          </label>

          {/* Fecha Hasta */}
          <label className="flex flex-col gap-2 text-sm font-bold text-[#52635c]">
            Fecha hasta

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#64756d]" />

              <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-12 w-full rounded-xl border border-[#d8e1dd] bg-white pl-11 pr-3 text-sm text-[#20372e] outline-none focus:border-[#0b7549]"
              />
            </div>
          </label>
        </div>

        {/* Ficha Resumen del Producto */}
        {product && (
            <div className="mb-5 flex flex-col gap-5 rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)] md:flex-row md:items-center md:p-6">
              <div className="flex size-[86px] shrink-0 items-center justify-center rounded-2xl bg-[#edf3f0]">
                <Boxes
                    className="size-12 text-[#163d2e]"
                    strokeWidth={1.4}
                />
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#075c3b]">
                  {product.name}
                </h2>

                <div className="mt-2 flex flex-wrap gap-x-9 gap-y-2 text-[15px] text-[#627069]">
              <span>
                Código:{' '}
                <strong className="font-medium text-[#20372e]">
                  {product.code}
                </strong>
              </span>

                  <span className="hidden h-6 w-px bg-[#d8e1dd] sm:block" />

                  <span>
                Unidad:{' '}
                    <strong className="font-medium text-[#20372e]">
                  {product.unit}
                </strong>
              </span>

                  <span className="hidden h-6 w-px bg-[#d8e1dd] sm:block" />

                  <span>
                Categoría:{' '}
                    <strong className="font-medium text-[#20372e]">
                  {accountPath}
                </strong>
              </span>

                  <span className="hidden h-6 w-px bg-[#d8e1dd] sm:block" />

                  <span>
                Stock Mínimo:{' '}
                    <strong className="font-medium text-[#20372e]">
                  {product.minStock}
                </strong>
              </span>
                </div>
              </div>
            </div>
        )}

        {/* Tarjetas de Saldos */}
        {kardexData && (
            <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {/* Saldo Inicial */}
              <div className="flex items-center gap-4 rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)]">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#f0f1f0] text-[#69736f]">
                  <Boxes className="size-7" />
                </div>

                <div>
                  <p className="text-sm text-[#65736c]">Saldo inicial</p>

                  <p className="mt-1 text-3xl font-bold text-[#18221e]">
                    {kardexData.initialBalance.qty.toLocaleString('es-PE')}
                  </p>

                  <p className="text-xs text-[#65736c]">
                    S/ {kardexData.initialBalance.total.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Entradas */}
              <div className="flex items-center gap-4 rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)]">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#dff1e4] text-[#08783f]">
                  <ArrowUp className="size-7" />
                </div>

                <div>
                  <p className="text-sm text-[#65736c]">Entradas</p>

                  <p className="mt-1 text-3xl font-bold text-[#08783f]">
                    +{kardexData.periodEntries.qty.toLocaleString('es-PE')}
                  </p>

                  <p className="text-xs text-[#08783f]">
                    S/ {kardexData.periodEntries.total.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Salidas */}
              <div className="flex items-center gap-4 rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)]">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#ffe4e5] text-[#dc252d]">
                  <ArrowDown className="size-7" />
                </div>

                <div>
                  <p className="text-sm text-[#65736c]">Salidas</p>

                  <p className="mt-1 text-3xl font-bold text-[#dc252d]">
                    -{kardexData.periodExits.qty.toLocaleString('es-PE')}
                  </p>

                  <p className="text-xs text-[#dc252d]">
                    S/ {kardexData.periodExits.total.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Saldo Actual */}
              <div className="flex items-center gap-4 rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)]">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#fff0a8] text-[#17251d]">
                  <Package className="size-7" />
                </div>

                <div>
                  <p className="text-sm text-[#65736c]">Saldo actual</p>

                  <p className="mt-1 text-3xl font-bold text-[#17251d]">
                    {kardexData.finalBalance.qty.toLocaleString('es-PE')}
                  </p>

                  <p className="text-xs text-[#17251d]">
                    S/ {kardexData.finalBalance.total.toFixed(2)} (Valuación)
                  </p>
                </div>
              </div>
            </div>
        )}

        {/* Tabla Oficial de Kardex */}
        <div className="overflow-hidden rounded-2xl border border-[#e0e8e4] bg-white shadow-[0_2px_10px_rgba(21,55,42,0.03)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#e5ebe8] p-4 md:p-5">
            <div>
              <h2 className="font-bold text-[#20372e]">
                Detalle de movimientos de Kardex
              </h2>

              <p className="text-sm text-[#78847f]">
                Registros valorizados por método promedio ponderado móvil
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[980px]">
              {/* Cabecera Agrupada */}
              <thead className="bg-[#064c32] text-white font-bold text-center border-b border-white/10">
              <tr>
                <th
                    colSpan={4}
                    className="py-2.5 px-3 border-r border-white/10 bg-[#064c32]"
                >
                  DOCUMENTO Y OPERACIÓN
                </th>

                <th
                    colSpan={3}
                    className="py-2.5 px-3 border-r border-white/10 bg-[#075c3b]"
                >
                  ENTRADAS
                </th>

                <th
                    colSpan={3}
                    className="py-2.5 px-3 border-r border-white/10 bg-[#05432c]"
                >
                  SALIDAS
                </th>

                <th
                    colSpan={3}
                    className="py-2.5 px-3 bg-[#032e1e]"
                >
                  SALDO (EXISTENCIAS)
                </th>
              </tr>

              <tr className="bg-[#075c3b] text-white/90 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 pl-4 text-left">Fecha</th>
                <th className="py-2.5">Correlativo</th>
                <th className="py-2.5">Tipo / Motivo</th>
                <th className="py-2.5 pr-3 border-r border-white/10">
                  Destino / Origen
                </th>

                <th className="py-2.5 text-right">Cant.</th>
                <th className="py-2.5 text-right">Costo Unit.</th>
                <th className="py-2.5 text-right pr-3 border-r border-white/10">
                  Total (S/)
                </th>

                <th className="py-2.5 text-right">Cant.</th>
                <th className="py-2.5 text-right">Costo Unit.</th>
                <th className="py-2.5 text-right pr-3 border-r border-white/10">
                  Total (S/)
                </th>

                <th className="py-2.5 text-right">Cant.</th>
                <th className="py-2.5 text-right">Costo Prom.</th>
                <th className="py-2.5 text-right pr-4">Total Val. (S/)</th>
              </tr>
              </thead>

              <tbody className="divide-y divide-[#e8eeeb]">
              {/* Fila de Saldo Inicial */}
              {kardexData && (
                  <tr className="bg-[#edf3f0] font-semibold text-[#075c3b]">
                    <td className="py-3 pl-4" colSpan={4}>
                      SALDO INICIAL AL {startDate}
                    </td>

                    <td
                        colSpan={3}
                        className="border-r border-[#dce5e1] text-center text-[#78847f]"
                    >
                      —
                    </td>

                    <td
                        colSpan={3}
                        className="border-r border-[#dce5e1] text-center text-[#78847f]"
                    >
                      —
                    </td>

                    <td className="py-3 text-right font-bold text-[#18221e]">
                      {kardexData.initialBalance.qty.toLocaleString('es-PE')}
                    </td>

                    <td className="py-3 text-right text-[#586860]">
                      S/ {kardexData.initialBalance.cost.toFixed(2)}
                    </td>

                    <td className="py-3 text-right pr-4 font-black text-[#075c3b]">
                      S/ {kardexData.initialBalance.total.toFixed(2)}
                    </td>
                  </tr>
              )}

              {/* Filas de Movimientos */}
              {!kardexData || filteredRows.length === 0 ? (
                  <tr>
                    <td
                        colSpan={13}
                        className="py-10 text-center text-[#78847f]"
                    >
                      {!kardexData
                          ? 'Selecciona un producto para consultar su Kardex.'
                          : 'No se registran transacciones para este producto y almacén en el rango de fechas.'}
                    </td>
                  </tr>
              ) : (
                  filteredRows.map((r) => (
                      <tr
                          key={r.id}
                          className="border-b border-[#e8eeeb] last:border-0 hover:bg-[#f7faf8]"
                      >
                        <td className="py-3 pl-4 whitespace-nowrap text-[#586860]">
                          {r.date}
                        </td>

                        <td className="py-3 font-mono font-bold text-[#075c3b]">
                          {r.correlative}
                        </td>

                        <td className="py-3">
                      <span className="font-semibold text-[#20372e]">
                        {r.type.toUpperCase()}
                      </span>

                          <span className="block text-[10px] text-[#78847f]">
                        {r.reason}
                      </span>
                        </td>

                        <td className="py-3 pr-3 border-r border-[#dce5e1] text-[#586860] max-w-[140px] truncate">
                          {r.originOrDestination}
                        </td>

                        {/* ENTRADAS */}
                        <td className="py-3 text-right font-bold text-[#08783f]">
                          {r.entryQty
                              ? `+${r.entryQty.toLocaleString('es-PE')}`
                              : '—'}
                        </td>

                        <td className="py-3 text-right text-[#586860]">
                          {r.entryCost
                              ? `S/ ${r.entryCost.toFixed(2)}`
                              : '—'}
                        </td>

                        <td className="py-3 text-right pr-3 border-r border-[#dce5e1] font-bold text-[#08783f]">
                          {r.entryTotal
                              ? `S/ ${r.entryTotal.toFixed(2)}`
                              : '—'}
                        </td>

                        {/* SALIDAS */}
                        <td className="py-3 text-right font-bold text-[#dc252d]">
                          {r.exitQty
                              ? `-${r.exitQty.toLocaleString('es-PE')}`
                              : '—'}
                        </td>

                        <td className="py-3 text-right text-[#586860]">
                          {r.exitCost
                              ? `S/ ${r.exitCost.toFixed(2)}`
                              : '—'}
                        </td>

                        <td className="py-3 text-right pr-3 border-r border-[#dce5e1] font-bold text-[#dc252d]">
                          {r.exitTotal
                              ? `S/ ${r.exitTotal.toFixed(2)}`
                              : '—'}
                        </td>

                        {/* SALDO */}
                        <td className="py-3 text-right font-bold text-[#18221e]">
                          {r.balanceQty.toLocaleString('es-PE')}
                        </td>

                        <td className="py-3 text-right font-medium text-[#586860]">
                          S/ {r.balanceCost.toFixed(2)}
                        </td>

                        <td className="py-3 text-right pr-4 font-black text-[#075c3b]">
                          S/ {r.balanceTotal.toFixed(2)}
                        </td>
                      </tr>
                  ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}

export default KardexView;
