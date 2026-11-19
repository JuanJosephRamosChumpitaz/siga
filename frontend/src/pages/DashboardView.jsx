
import React, { useMemo } from 'react';

import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Boxes,
  Clock,
  DollarSign,
  FileCheck,
  Package,
  Plus,
} from 'lucide-react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Ajusta estas rutas si tus servicios tienen otra ubicación.
import { InventoryService } from '../services/inventoryService';

const COLORS = [
  '#075c3b',
  '#0b7549',
  '#f5db38',
  '#166534',
  '#dc252d',
  '#0891b2',
];

export function DashboardView({
                                state,
                                onNavigate,
                                onOpenNewMovement,
                              }) {
  const {
    products,
    movements,
    warehouses,
    requisitions,
    accounts,
  } = state;

  // Total de productos activos
  const activeProducts = products.filter(
      (p) => p.status === 'activo'
  );

  // Valor total del inventario
  const totalValuation = useMemo(() => {
    return products.reduce((sum, p) => {
      const { totalValue } =
          InventoryService.getProductTotalStock(p);

      return sum + totalValue;
    }, 0);
  }, [products]);

  // Productos bajo stock mínimo
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => {
      const { stock } =
          InventoryService.getProductTotalStock(p);

      return stock <= p.minStock && stock > 0;
    });
  }, [products]);

  // Productos sin stock
  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => {
      const { stock } =
          InventoryService.getProductTotalStock(p);

      return stock <= 0;
    });
  }, [products]);

  // Ingresos del mes
  const currentMonthEntries = useMemo(() => {
    return movements
        .filter(
            (m) =>
                m.type === 'ingreso' &&
                m.status === 'confirmado'
        )
        .reduce((sum, m) => sum + m.totalAmount, 0);
  }, [movements]);

  // Salidas del mes
  const currentMonthExits = useMemo(() => {
    return movements
        .filter(
            (m) =>
                m.type === 'salida' &&
                m.status === 'confirmado'
        )
        .reduce((sum, m) => sum + m.totalAmount, 0);
  }, [movements]);

  // Solicitudes pendientes
  const pendingRequisitions = requisitions.filter(
      (r) =>
          r.status === 'pendiente' ||
          r.status === 'aprobada' ||
          r.status === 'atendida_parcial'
  );

  // Datos para gráfico de evolución mensual
  const monthlyChartData = [
    { mes: 'Ago 2026', ingresos: 31900, salidas: 6120 },
    { mes: 'Set 2026', ingresos: 14200, salidas: 11800 },
    {
      mes: 'Oct 2026',
      ingresos: currentMonthEntries,
      salidas: currentMonthExits,
    },
  ];

  // Distribución por cuenta contable
  const accountDistributionData = useMemo(() => {
    const rootAccounts = accounts.filter(
        (a) => a.parentId === null
    );

    return rootAccounts.map((root) => {
      const descendantIds =
          InventoryService.getDescendantAccountIds(
              root.id,
              accounts
          );

      const matchingProds = products.filter((p) =>
          descendantIds.includes(p.accountId)
      );

      const val = matchingProds.reduce((sum, p) => {
        return (
            sum +
            InventoryService.getProductTotalStock(p).totalValue
        );
      }, 0);

      return {
        name: root.name,
        code: root.code,
        value: Math.round(val),
      };
    });
  }, [accounts, products]);

  // Almacenes bloqueados por inventario
  const lockedWarehouses = warehouses.filter(
      (w) => w.isLockedForInventory
  );

  return (
      <div className="space-y-6">

        {/* Banner Verde Institucional */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#064c32] via-[#075c3b] to-[#0a734a] p-6 text-white shadow-md md:p-8">

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">

            <div className="max-w-2xl">

              <div className="flex flex-wrap items-center gap-2">

              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <span className="size-2 rounded-full bg-[#d6ed39] animate-pulse" />
                Periodo Académico y Fiscal 2026
              </span>

                <span className="text-xs text-white/80">
                • Valuación: Promedio Ponderado Móvil
              </span>

              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                Panel de Control - Almacén Central
              </h1>

              <p className="mt-1 text-sm text-white/80 leading-relaxed md:text-base">
                {state.settings.institutionName} • Control patrimonial,
                entradas, salidas y kardex físico valorizado.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                  onClick={onOpenNewMovement}
                  className="flex items-center gap-2 rounded-xl bg-[#f5db38] px-5 py-3.5 text-sm font-bold text-[#123b2b] shadow-sm transition hover:bg-[#e6cc29]"
              >
                <Plus className="size-5" />
                Nuevo Movimiento
              </button>

              <button
                  onClick={() => onNavigate('solicitudes')}
                  className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <FileCheck className="size-4" />
                Solicitudes PECOSA ({pendingRequisitions.length})
              </button>

            </div>
          </div>
        </div>

        {/* Alerta de Almacén Bloqueado */}
        {lockedWarehouses.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border-l-4 border-[#dc252d] bg-[#ffe4e5] p-4 text-[#dc252d] shadow-sm">

              <div className="flex items-center gap-3">

                <AlertTriangle className="size-5 shrink-0" />

                <p className="text-sm font-medium">
                  <strong>Atención:</strong> El almacén{' '}
                  <strong>
                    {lockedWarehouses.map((w) => w.name).join(', ')}
                  </strong>{' '}
                  tiene una sesión de toma de inventario en curso.
                  Las operaciones están bloqueadas hasta su conciliación.
                </p>

              </div>

              <button
                  onClick={() => onNavigate('inventario')}
                  className="text-xs font-bold underline hover:text-[#991b1b]"
              >
                Ir a Inventario Físico →
              </button>

            </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Total Productos */}
          <div
              onClick={() => onNavigate('productos')}
              className="cursor-pointer flex items-center gap-4 rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)] transition hover:border-[#075c3b]/40 hover:shadow-md"
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#edf3f0] text-[#075c3b]">
              <Boxes className="size-7" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#65736c]">
                Total Productos
              </p>

              <p className="mt-0.5 text-2xl font-bold text-[#20372e]">
                {activeProducts.length} ítems
              </p>

              <span className="text-xs text-[#08783f] font-medium">
              En catálogo activo →
            </span>
            </div>
          </div>

          {/* Valor Total Inventario */}
          <div
              onClick={() => onNavigate('reportes')}
              className="cursor-pointer flex items-center gap-4 rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)] transition hover:border-[#075c3b]/40 hover:shadow-md"
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#dff1e4] text-[#08783f]">
              <DollarSign className="size-7" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#65736c]">
                Valorización Total
              </p>

              <p className="mt-0.5 text-2xl font-bold text-[#08783f]">
                S/ {totalValuation.toLocaleString('es-PE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              </p>

              <span className="text-xs text-[#65736c]">
              Costo promedio →
            </span>
            </div>
          </div>

          {/* Ingresos del Mes */}
          <div
              onClick={() =>
                  onNavigate('movimientos', { type: 'ingreso' })
              }
              className="cursor-pointer flex items-center gap-4 rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)] transition hover:border-[#075c3b]/40 hover:shadow-md"
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#e6f4ea] text-[#0b7549]">
              <ArrowUp className="size-7" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#65736c]">
                Ingresos del Mes
              </p>

              <p className="mt-0.5 text-2xl font-bold text-[#0b7549]">
                S/ {currentMonthEntries.toLocaleString('es-PE', {
                minimumFractionDigits: 2,
              })}
              </p>

              <span className="text-xs text-[#65736c]">
              Compras y donaciones →
            </span>
            </div>
          </div>

          {/* Salidas PECOSA */}
          <div
              onClick={() =>
                  onNavigate('movimientos', { type: 'salida' })
              }
              className="cursor-pointer flex items-center gap-4 rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)] transition hover:border-[#075c3b]/40 hover:shadow-md"
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#ffe4e5] text-[#dc252d]">
              <ArrowDown className="size-7" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#65736c]">
                Salidas PECOSA
              </p>

              <p className="mt-0.5 text-2xl font-bold text-[#dc252d]">
                S/ {currentMonthExits.toLocaleString('es-PE', {
                minimumFractionDigits: 2,
              })}
              </p>

              <span className="text-xs text-[#65736c]">
              Despachos a dependencias →
            </span>
            </div>
          </div>

        </div>

        {/* Alertas Rápidas */}
        <div className="grid gap-4 sm:grid-cols-3">

          <div
              onClick={() =>
                  onNavigate('productos', { filter: 'low' })
              }
              className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-[0_2px_10px_rgba(21,55,42,0.03)] transition hover:border-[#dc252d]/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#ffe4e5] text-[#dc252d]">
                <AlertTriangle className="size-5" />
              </div>

              <div>
                <p className="text-xs font-bold text-[#65736c]">
                  Stock Crítico / Mínimo
                </p>

                <p className="text-lg font-bold text-[#dc252d]">
                  {lowStockProducts.length} productos
                </p>
              </div>
            </div>

            <ArrowRight className="size-4 text-[#dc252d]" />
          </div>

          <div
              onClick={() =>
                  onNavigate('productos', { filter: 'out' })
              }
              className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-[0_2px_10px_rgba(21,55,42,0.03)] transition hover:border-[#dc252d]/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#f0f1f0] text-[#69736f]">
                <Package className="size-5" />
              </div>

              <div>
                <p className="text-xs font-bold text-[#65736c]">
                  Sin Existencias (Agotados)
                </p>

                <p className="text-lg font-bold text-[#20372e]">
                  {outOfStockProducts.length} productos
                </p>
              </div>
            </div>

            <ArrowRight className="size-4 text-[#69736f]" />
          </div>

          <div
              onClick={() => onNavigate('solicitudes')}
              className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-[0_2px_10px_rgba(21,55,42,0.03)] transition hover:border-[#075c3b]/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#dff1e4] text-[#08783f]">
                <Clock className="size-5" />
              </div>

              <div>
                <p className="text-xs font-bold text-[#65736c]">
                  Solicitudes PECOSA
                </p>

                <p className="text-lg font-bold text-[#08783f]">
                  {pendingRequisitions.length} en proceso
                </p>
              </div>
            </div>

            <ArrowRight className="size-4 text-[#08783f]" />
          </div>

        </div>

        {/* Gráficos */}
        <div className="grid gap-6 lg:grid-cols-12">

          {/* Gráfico de Barras */}
          <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)] lg:col-span-7">

            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#20372e] text-base">
                  Evolución de Movimientos Valorizados
                </h2>

                <p className="text-xs text-[#78847f]">
                  Comparativa de compras vs despachos
                </p>
              </div>

              <span className="rounded-md bg-[#edf3f0] px-2 py-1 text-xs font-semibold text-[#075c3b]">
              En Soles (S/.)
            </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={monthlyChartData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 0,
                    }}
                >
                  <XAxis
                      dataKey="mes"
                      tick={{ fontSize: 12, fill: '#586860' }}
                  />

                  <YAxis
                      tick={{ fontSize: 12, fill: '#586860' }}
                  />

                  <Tooltip
                      formatter={(value) => [
                        `S/ ${Number(value).toLocaleString('es-PE', {
                          minimumFractionDigits: 2,
                        })}`,
                        '',
                      ]}
                  />

                  <Legend
                      wrapperStyle={{ fontSize: '12px' }}
                  />

                  <Bar
                      dataKey="ingresos"
                      name="Ingresos (S/)"
                      fill="#075c3b"
                      radius={[4, 4, 0, 0]}
                  />

                  <Bar
                      dataKey="salidas"
                      name="Salidas PECOSA (S/)"
                      fill="#dc252d"
                      radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Gráfico Circular */}
          <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)] lg:col-span-5">

            <div className="mb-2">
              <h2 className="font-bold text-[#20372e] text-base">
                Valor por Agrupación Contable
              </h2>

              <p className="text-xs text-[#78847f]">
                Distribución porcentual del inventario
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                      data={accountDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      dataKey="value"
                      label={({ code, percent }) =>
                          `${code}: ${(percent * 100).toFixed(0)}%`
                      }
                  >
                    {accountDistributionData.map((_, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                  </Pie>

                  <Tooltip
                      formatter={(val) => [
                        `S/ ${Number(val).toLocaleString('es-PE', {
                          minimumFractionDigits: 2,
                        })}`,
                        'Valor',
                      ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>

        {/* Últimos Movimientos y Alertas de Stock */}
        <div className="grid gap-6 lg:grid-cols-12">

          {/* Últimos Movimientos */}
          <div className="rounded-2xl border border-[#e0e8e4] bg-white shadow-[0_2px_10px_rgba(21,55,42,0.03)] lg:col-span-8">

            <div className="flex items-center justify-between border-b border-[#e5ebe8] p-4 md:p-5">

              <div>
                <h3 className="font-bold text-[#20372e] text-base">
                  Últimos Movimientos Confirmados
                </h3>

                <p className="text-xs text-[#78847f]">
                  Registro de ingresos y despachos recientes
                </p>
              </div>

              <button
                  onClick={() => onNavigate('movimientos')}
                  className="text-xs font-bold text-[#075c3b] hover:underline"
              >
                Ver todos →
              </button>

            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">

                <thead className="bg-[#f8faf9] text-[#586860] uppercase tracking-wider font-semibold border-b border-[#edf2ef]">
                <tr>
                  <th className="px-4 py-3 pl-5">Fecha</th>
                  <th className="px-4 py-3">Correlativo</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Destino / Proveedor</th>
                  <th className="px-4 py-3 text-right pr-5">
                    Importe
                  </th>
                </tr>
                </thead>

                <tbody className="divide-y divide-[#edf2ef]">
                {movements.slice(0, 5).map((m) => (
                    <tr
                        key={m.id}
                        className="hover:bg-[#f7faf8] transition"
                    >
                      <td className="px-4 py-3 pl-5 text-[#586860]">
                        {m.date}
                      </td>

                      <td className="px-4 py-3 font-semibold text-[#20372e]">
                        {m.correlative}
                      </td>

                      <td className="px-4 py-3">
                      <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold ${
                              m.type === 'ingreso'
                                  ? 'bg-[#dff1e4] text-[#08783f]'
                                  : m.type === 'salida'
                                      ? 'bg-[#ffe4e5] text-[#dc252d]'
                                      : 'bg-[#edf3f0] text-[#075c3b]'
                          }`}
                      >
                        {m.type === 'ingreso'
                            ? '▲ Entrada'
                            : '▼ Salida'}
                      </span>
                      </td>

                      <td className="px-4 py-3 text-[#586860] max-w-[160px] truncate">
                        {m.recipient || m.responsible}
                      </td>

                      <td className="px-4 py-3 text-right pr-5 font-bold text-[#20372e]">
                        S/ {m.totalAmount.toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                      })}
                      </td>
                    </tr>
                ))}
                </tbody>

              </table>
            </div>

          </div>

          {/* Productos con Stock Bajo */}
          <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)] lg:col-span-4">

            <div className="mb-4 flex items-center justify-between border-b border-[#e5ebe8] pb-3">

              <h3 className="font-bold text-[#20372e] text-sm">
                Productos en Stock Bajo
              </h3>

              <span className="rounded-full bg-[#ffe4e5] px-2.5 py-0.5 text-xs font-bold text-[#dc252d]">
              {lowStockProducts.length}
            </span>

            </div>

            <div className="space-y-3">

              {lowStockProducts.slice(0, 4).map((p) => {
                const { stock } =
                    InventoryService.getProductTotalStock(p);

                return (
                    <div
                        key={p.id}
                        onClick={() =>
                            onNavigate('kardex', { productId: p.id })
                        }
                        className="cursor-pointer rounded-xl border border-[#f1f4f2] bg-[#fbfdfc] p-3 transition hover:border-[#075c3b]/30"
                    >

                      <div className="flex items-center justify-between">

                        <p className="font-semibold text-xs text-[#20372e] line-clamp-1">
                          {p.name}
                        </p>

                        <span className="text-xs font-bold text-[#dc252d]">
                      {stock} / {p.minStock} {p.unit}
                    </span>

                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-[#65736c]">

                        <span>Cód: {p.code}</span>

                        <span className="font-bold text-[#075c3b] hover:underline">
                      Ver en Kardex →
                    </span>

                      </div>

                    </div>
                );
              })}

            </div>

          </div>

        </div>
      </div>
  );
}

export default DashboardView;
   