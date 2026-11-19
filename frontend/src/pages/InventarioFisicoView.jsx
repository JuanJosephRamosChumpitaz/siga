
import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Lock,
  Plus,
  Printer,
  Search,
  Unlock,
  Warehouse,
  X,
} from 'lucide-react';

export function InventarioFisicoView({
                                       state,
                                       onCreateSession,
                                       onUpdateCountedItems,
                                       onConciliateSession,
                                       onPrintActa,
                                     }) {
  const {
    inventorySessions = [],
    warehouses = [],
    products = [],
    currentUser,
  } = state;

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(
      warehouses[0]?.id || 'alm-1'
  );
  const [sessionNotes, setSessionNotes] = useState('');

  const [activeSession, setActiveSession] = useState(null);
  const [countsModalOpen, setCountsModalOpen] = useState(false);
  const [editableItems, setEditableItems] = useState([]);
  const [notification, setNotification] = useState(null);

  // Iniciar toma de inventario
  const handleOpenNewSession = () => {
    const availableWarehouses = warehouses.filter(
        (warehouse) => !warehouse.isLockedForInventory
    );

    if (availableWarehouses.length === 0) {
      setNotification('No hay almacenes disponibles para iniciar una toma de inventario.');
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setSelectedWarehouseId(availableWarehouses[0].id);
    setSessionNotes(
        'Toma física de existencias y comprobación de saldos en almacén.'
    );
    setNewModalOpen(true);
  };

  const handleCreateSession = (e) => {
    e.preventDefault();

    if (!selectedWarehouseId) return;

    onCreateSession(selectedWarehouseId, sessionNotes.trim());
    setNewModalOpen(false);
    setNotification(
        'Sesión de inventario físico iniciada. El almacén ha sido bloqueado para operaciones.'
    );
    setTimeout(() => setNotification(null), 4000);
  };

  // Abrir modal de conteo físico
  const handleOpenCounts = (session) => {
    setActiveSession(session);
    setEditableItems(session.items.map((item) => ({ ...item })));
    setCountsModalOpen(true);
  };

  const handleItemCountChange = (productId, val) => {
    const counted = Math.max(0, Number(val) || 0);

    setEditableItems((prev) =>
        prev.map((item) => {
          if (item.productId === productId) {
            const diff = counted - item.theoreticalStock;
            const diffVal =
                Math.round(diff * item.unitCost * 100) / 100;

            return {
              ...item,
              countedStock: counted,
              difference: diff,
              totalDifferenceValue: diffVal,
            };
          }

          return item;
        })
    );
  };

  const handleSaveCounts = (e) => {
    e.preventDefault();

    if (!activeSession) return;

    onUpdateCountedItems(activeSession.id, editableItems);
    setCountsModalOpen(false);
    setNotification(
        'Cantidades de conteo físico guardadas en la sesión.'
    );
    setTimeout(() => setNotification(null), 3000);
  };

  const handleConciliate = (sessionId) => {
    onConciliateSession(sessionId);
    setCountsModalOpen(false);
    setNotification(
        'Inventario conciliado con éxito. Se han generado los ajustes correspondientes y desbloqueado el almacén.'
    );
    setTimeout(() => setNotification(null), 4000);
  };

  return (
      <div className="space-y-6">
        {/* Toast Notification */}
        {notification && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-5 py-3.5 text-white shadow-xl transition-all">
              <div className="size-2 rounded-full bg-teal-400 animate-ping" />
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
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-[34px]">
              Inventario Físico (Toma de Inventario)
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Fotografía de stock teórico, conteo físico in-situ, cálculo de
              diferencias y conciliación.
            </p>
          </div>

          <button
              onClick={handleOpenNewSession}
              className="flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
          >
            <Plus className="size-5" />
            Iniciar Toma de Inventario
          </button>
        </div>

        {/* Explicación de la regla de bloqueo */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-950">
          <Lock className="size-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong>Regla de consistencia:</strong> Mientras una sesión de
            inventario esté en estado <em>Abierta</em>, el almacén
            correspondiente queda bloqueado para cualquier movimiento de
            entrada o salida. Al confirmar la conciliación, el sistema
            generará automáticamente los asientos de ajuste (sobrantes o
            faltantes) y desbloqueará el almacén.
          </div>
        </div>

        {/* Lista de Sesiones de Inventario */}
        <div className="space-y-4">
          {inventorySessions.map((session) => {
            const isOpen = session.status === 'abierta';
            const diffItems = session.items.filter(
                (item) => item.difference !== 0
            );
            const totalVarianceVal = session.items.reduce(
                (acc, item) => acc + item.totalDifferenceValue,
                0
            );

            return (
                <div
                    key={session.id}
                    className={`rounded-2xl border bg-white p-5 shadow-xs transition ${
                        isOpen
                            ? 'border-amber-300 ring-2 ring-amber-100'
                            : 'border-slate-200'
                    }`}
                >
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
                    {session.code}
                  </span>

                      <div>
                        <h3 className="font-bold text-sm text-slate-900">
                          {session.warehouseName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Fecha: {session.date} • Fotografía de existencias:{' '}
                          {session.snapshotDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                  <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                          isOpen
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                      }`}
                  >
                    {isOpen ? (
                        <Lock className="size-3" />
                    ) : (
                        <CheckCircle2 className="size-3" />
                    )}
                    {isOpen
                        ? 'SESIÓN ABIERTA (Almacén Bloqueado)'
                        : 'CONCILIADA'}
                  </span>

                      <button
                          onClick={() => handleOpenCounts(session)}
                          className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        {isOpen
                            ? 'Registrar Conteo Físico'
                            : 'Ver Detalle Conteo'}
                      </button>

                      <button
                          onClick={() => onPrintActa(session)}
                          className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                          title="Imprimir Acta de Inventario Físico"
                      >
                        <Printer className="size-3.5" />
                        Acta Oficial
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-4 text-xs">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Bienes Inventariados</p>
                      <p className="mt-0.5 text-base font-black text-slate-800">
                        {session.items.length} ítems
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Ítems con Diferencia</p>
                      <p className="mt-0.5 text-base font-black text-amber-700">
                        {diffItems.length} ítems
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">
                        Diferencia Neta Valorizada
                      </p>
                      <p
                          className={`mt-0.5 text-base font-black ${
                              totalVarianceVal >= 0
                                  ? 'text-emerald-700'
                                  : 'text-rose-700'
                          }`}
                      >
                        S/{' '}
                        {totalVarianceVal.toLocaleString('es-PE', {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Ajuste Generado</p>
                      <p className="mt-0.5 text-xs font-mono font-bold text-teal-800">
                        {session.adjustmentMovementId ||
                            'Pendiente de conciliación'}
                      </p>
                    </div>
                  </div>
                </div>
            );
          })}

          {inventorySessions.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <ClipboardList className="mx-auto mb-3 size-10 text-slate-300" />
                <p className="font-bold text-slate-700">
                  No hay sesiones de inventario físico
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Inicia una toma de inventario para registrar las existencias
                  físicas del almacén.
                </p>
              </div>
          )}
        </div>

        {/* Modal Iniciar Sesión de Inventario */}
        {newModalOpen && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
                onClick={() => setNewModalOpen(false)}
            >
              <div
                  className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    Iniciar Toma de Inventario
                  </h3>
                  <button
                      onClick={() => setNewModalOpen(false)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSession} className="space-y-4">
                  <label className="block text-xs font-bold text-slate-600">
                    Almacén a Inventariar *
                    <select
                        value={selectedWarehouseId}
                        onChange={(e) => setSelectedWarehouseId(e.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-teal-600"
                        required
                    >
                      {warehouses
                          .filter((warehouse) => !warehouse.isLockedForInventory)
                          .map((warehouse) => (
                              <option key={warehouse.id} value={warehouse.id}>
                                {warehouse.name}
                              </option>
                          ))}
                    </select>
                  </label>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed">
                    Al iniciar, el sistema tomará una instantánea de las
                    existencias teóricas del almacén seleccionado y bloqueará
                    el registro de movimientos hasta la conciliación final.
                  </div>

                  <label className="block text-xs font-bold text-slate-600">
                    Finalidad / Notas de la Comisión de Inventario
                    <textarea
                        rows={3}
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 outline-none focus:border-teal-600"
                    />
                  </label>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => setNewModalOpen(false)}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>

                    <button
                        type="submit"
                        className="rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800"
                    >
                      Iniciar y Bloquear Almacén
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* Modal Conteo Físico y Conciliación */}
        {countsModalOpen && activeSession && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
                onClick={() => setCountsModalOpen(false)}
            >
              <div
                  className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Conteo Físico • {activeSession.code} [
                      {activeSession.warehouseName}]
                    </h3>
                    <p className="text-xs text-slate-500">
                      Registre el stock contado. Las diferencias calcularán
                      automáticamente el ajuste de conciliación.
                    </p>
                  </div>

                  <button
                      onClick={() => setCountsModalOpen(false)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveCounts} className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-slate-200 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 pl-3">Producto</th>
                        <th className="p-2.5 text-center">U.M.</th>
                        <th className="p-2.5 text-center">Stock Teórico</th>
                        <th className="p-2.5 text-center w-28">
                          Conteo Físico
                        </th>
                        <th className="p-2.5 text-center">Diferencia</th>
                        <th className="p-2.5 text-right pr-3">
                          Impacto Valor (S/)
                        </th>
                      </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                      {editableItems.map((item) => {
                        const isZero = item.difference === 0;
                        const isSobrante = item.difference > 0;

                        return (
                            <tr
                                key={item.productId}
                                className="hover:bg-slate-50/50"
                            >
                              <td className="p-2.5 pl-3">
                                <p className="font-bold text-slate-900">
                                  {item.productName}
                                </p>
                                <span className="font-mono text-[10px] text-teal-800">
                              {item.productCode}
                            </span>
                              </td>

                              <td className="p-2.5 text-center text-slate-500">
                                {item.unit}
                              </td>

                              <td className="p-2.5 text-center font-bold text-slate-700">
                                {item.theoreticalStock}
                              </td>

                              <td className="p-2.5 text-center">
                                {activeSession.status === 'abierta' ? (
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={item.countedStock}
                                        onChange={(e) =>
                                            handleItemCountChange(
                                                item.productId,
                                                e.target.value
                                            )
                                        }
                                        className="h-8 w-20 rounded-lg border border-slate-200 text-center font-bold text-teal-900 outline-none focus:border-teal-600"
                                    />
                                ) : (
                                    <span className="font-bold text-slate-900">
                                {item.countedStock}
                              </span>
                                )}
                              </td>

                              <td className="p-2.5 text-center font-bold">
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                    isZero
                                        ? 'bg-slate-100 text-slate-600'
                                        : isSobrante
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-rose-100 text-rose-800'
                                }`}
                            >
                              {isSobrante
                                  ? `+${item.difference}`
                                  : item.difference}
                            </span>
                              </td>

                              <td
                                  className={`p-2.5 text-right pr-3 font-bold ${
                                      isZero
                                          ? 'text-slate-400'
                                          : isSobrante
                                              ? 'text-emerald-700'
                                              : 'text-rose-700'
                                  }`}
                              >
                                {isSobrante ? '+' : ''}
                                S/ {item.totalDifferenceValue.toFixed(2)}
                              </td>
                            </tr>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => setCountsModalOpen(false)}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cerrar
                    </button>

                    {activeSession.status === 'abierta' && (
                        <div className="flex gap-2">
                          <button
                              type="submit"
                              className="rounded-xl border border-teal-700 bg-white px-4 py-2.5 text-xs font-bold text-teal-700 hover:bg-teal-50"
                          >
                            Guardar Conteo Temporal
                          </button>

                          <button
                              type="button"
                              onClick={() => handleConciliate(activeSession.id)}
                              className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800"
                          >
                            Confirmar y Conciliar Inventario
                          </button>
                        </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  );
}

export default InventarioFisicoView;
