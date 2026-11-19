
import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

export function NuevoMovimientoModal({
                                       state,
                                       isOpen,
                                       onClose,
                                       onSaveMovement,
                                     }) {
  // Datos del sistema
  const {
    warehouses = [],
    areas = [],
    providers = [],
    products = [],
    currentUser = {},
    settings = {},
    movements = [],
  } = state || {};

  // Tipo de movimiento
  const [type, setType] = useState('ingreso');
  const [reason, setReason] = useState('Compra');

  // Almacenes
  const [warehouseId, setWarehouseId] = useState(
      warehouses[0]?.id || 'alm-1'
  );

  const [targetWarehouseId, setTargetWarehouseId] = useState(
      warehouses[1]?.id || 'alm-2'
  );

  // Documento
  const [docType, setDocType] = useState('Orden de Compra');
  const [docNumber, setDocNumber] = useState('');
  const [docDate, setDocDate] = useState(
      new Date().toISOString().slice(0, 10)
  );

  // Intervinientes
  const [providerId, setProviderId] = useState(
      providers[0]?.id || ''
  );

  const [areaId, setAreaId] = useState(
      areas[0]?.id || ''
  );

  const [responsible, setResponsible] = useState(
      currentUser.name || ''
  );

  const [recipient, setRecipient] = useState('');
  const [observations, setObservations] = useState('');

  // Lista de productos del movimiento
  const [items, setItems] = useState([]);

  // Selector de productos
  const [selectedProductId, setSelectedProductId] = useState(
      products[0]?.id || ''
  );

  const [inputQty, setInputQty] = useState('1');
  const [inputCost, setInputCost] = useState('');
  const [inputBatch, setInputBatch] = useState('');
  const [inputExpiry, setInputExpiry] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  // Producto seleccionado
  const currentSelectedProd = useMemo(() => {
    return (
        products.find((p) => p.id === selectedProductId) ||
        products[0] ||
        null
    );
  }, [products, selectedProductId]);

  // Existencias actuales
  const availableStockInWh = useMemo(() => {
    if (!currentSelectedProd) return 0;

    return currentSelectedProd.stocks?.[warehouseId] || 0;
  }, [currentSelectedProd, warehouseId]);

  // Costo sugerido
  const suggestedCost = useMemo(() => {
    if (!currentSelectedProd) return 0;

    const avg = currentSelectedProd.averageCosts?.[warehouseId];

    return avg && avg > 0 ? avg : 25.0;
  }, [currentSelectedProd, warehouseId]);

  // No mostrar modal si está cerrado
  if (!isOpen) return null;

  // Cambiar tipo de movimiento
  const handleTypeChange = (newType) => {
    setType(newType);

    if (newType === 'ingreso') {
      setReason('Compra');
      setDocType('Orden de Compra');
    } else if (newType === 'salida') {
      setReason('Entrega a área');
      setDocType('Pedido Comprobante de Salida (PECOSA)');
    } else if (newType === 'transferencia') {
      setReason('Transferencia interna');
      setDocType('Guía de Transferencia Interna');
    } else if (newType === 'devolucion') {
      setReason('Devolución de área');
      setDocType('Acta de Devolución');
    } else if (newType === 'ajuste') {
      setReason('Ajuste sobrante');
      setDocType('Acta de Ajuste de Inventario');
    }
  };

  // Agregar producto
  const handleAddItem = () => {
    setErrorMessage(null);

    if (!currentSelectedProd) {
      setErrorMessage('Seleccione un producto válido.');
      return;
    }

    const qty = Number(inputQty);

    if (!qty || qty <= 0) {
      setErrorMessage('La cantidad debe ser mayor a 0.');
      return;
    }

    // Validar existencias para salidas y transferencias
    if (type === 'salida' || type === 'transferencia') {
      const alreadyInList = items
          .filter((it) => it.productId === selectedProductId)
          .reduce((sum, it) => sum + it.quantity, 0);

      if (alreadyInList + qty > availableStockInWh) {
        setErrorMessage(
            `Stock insuficiente para "${currentSelectedProd.name}". Disponible: ${availableStockInWh} ${currentSelectedProd.unit}.`
        );
        return;
      }
    }

    // Costo del producto
    const cost =
        type === 'salida' || type === 'transferencia'
            ? suggestedCost
            : Number(inputCost) || suggestedCost;

    setItems((prev) => [
      ...prev,
      {
        productId: currentSelectedProd.id,
        quantity: qty,
        unitCost: Math.round(cost * 100) / 100,
        batchNumber: inputBatch.trim() || undefined,
        expiryDate: inputExpiry || undefined,
      },
    ]);

    // Limpiar campos
    setInputQty('1');
    setInputCost('');
    setInputBatch('');
    setInputExpiry('');
  };

  // Eliminar producto de la lista
  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calcular importe total
  const totalCalculated = items.reduce(
      (acc, it) => acc + it.quantity * it.unitCost,
      0
  );

  // Registrar movimiento
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage(
          'Debe agregar al menos un producto a la lista de movimiento.'
      );
      return;
    }

    if (type === 'transferencia' && warehouseId === targetWarehouseId) {
      setErrorMessage(
          'El almacén de origen y destino deben ser diferentes.'
      );
      return;
    }

    // Generar prefijo correlativo
    const correlativePrefix =
        type === 'ingreso'
            ? settings.ingresoPrefix || 'ING-2026-'
            : type === 'salida'
                ? settings.pecosaPrefix || 'PEC-2026-'
                : type === 'transferencia'
                    ? 'TRA-2026-'
                    : type === 'devolucion'
                        ? 'DEV-2026-'
                        : 'AJU-2026-';

    const correlative = `${correlativePrefix}${String(
        movements.length + 1
    ).padStart(3, '0')}`;

    // Construir detalle de productos
    const movementItems = items.map((it, idx) => {
      const p = products.find(
          (prod) => prod.id === it.productId
      );

      if (!p) return null;

      return {
        id: `it-${Date.now()}-${idx}`,
        productId: p.id,
        productCode: p.code,
        productName: p.name,
        unit: p.unit,
        quantity: it.quantity,
        unitCost: it.unitCost,
        totalCost: Math.round(
            it.quantity * it.unitCost * 100
        ) / 100,
        batchNumber: it.batchNumber,
        expiryDate: it.expiryDate,
        accountCodeAtTime: 'DEMO-01.01.01',
        accountNameAtTime: 'Registro en almacén',
      };
    }).filter(Boolean);

    if (movementItems.length !== items.length) {
      setErrorMessage(
          'Uno o más productos ya no existen. Revise la lista.'
      );
      return;
    }

    // Crear movimiento
    const newMov = {
      id: `mov-${Date.now()}`,
      correlative,
      date: new Date().toLocaleDateString('es-PE'),
      time: new Date().toLocaleTimeString('es-PE').slice(0, 5),

      type,
      reason,

      warehouseId,

      targetWarehouseId:
          type === 'transferencia'
              ? targetWarehouseId
              : undefined,

      docType,

      docNumber:
          docNumber.trim() ||
          `${type.toUpperCase()}-${Math.floor(
              100 + Math.random() * 900
          )}`,

      docDate,

      providerId:
          type === 'ingreso'
              ? providerId
              : undefined,

      areaId:
          type === 'salida' || type === 'devolucion'
              ? areaId
              : undefined,

      responsible,

      recipient:
          recipient.trim() ||
          (type === 'salida'
              ? 'Área Solicitante'
              : 'Almacén Central'),

      observations:
          observations.trim() ||
          'Operación registrada en sistema SIGAL.',

      registeredBy: currentUser.name || 'Usuario',

      status: 'borrador',

      items: movementItems,

      totalAmount:
          Math.round(totalCalculated * 100) / 100,
    };

    // Enviar movimiento al componente padre
    if (onSaveMovement) {
      onSaveMovement(newMov);
    }
  };

  return (
      <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={onClose}
      >
        <div
            className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
        >
          {/* Encabezado */}
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Registrar Movimiento de Almacén
              </h3>

              <p className="text-xs text-slate-500">
                Afectación directa de existencias y recálculo de promedio ponderado
              </p>
            </div>

            <button
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Mensaje de error */}
          {errorMessage && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                {errorMessage}
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Fila 1: Tipo, Motivo y Almacén */}
            <div className="grid gap-3 sm:grid-cols-3">

              <label className="text-xs font-bold text-slate-600">
                Tipo de Operación *

                <select
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-teal-600"
                >
                  <option value="ingreso">
                    ▲ Ingreso (Compra, Donación)
                  </option>

                  <option value="salida">
                    ▼ Salida (PECOSA Despacho)
                  </option>

                  <option value="transferencia">
                    ⇄ Transferencia Interna
                  </option>

                  <option value="devolucion">
                    ↺ Devolución
                  </option>

                  <option value="ajuste">
                    ⚙ Ajuste de Inventario
                  </option>
                </select>
              </label>

              <label className="text-xs font-bold text-slate-600">
                Motivo de Movimiento *

                <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-teal-600"
                >
                  {type === 'ingreso' && (
                      <>
                        <option value="Compra">
                          Compra con Orden de Compra
                        </option>
                        <option value="Donación">
                          Donación Institucional
                        </option>
                        <option value="Saldo inicial">
                          Saldo Inicial
                        </option>
                        <option value="Otros ingresos">
                          Otros Ingresos
                        </option>
                      </>
                  )}

                  {type === 'salida' && (
                      <>
                        <option value="Entrega a área">
                          Entrega a Área (PECOSA)
                        </option>
                        <option value="Consumo interno">
                          Consumo de Taller
                        </option>
                        <option value="Baja por deterioro">
                          Baja Justificada
                        </option>
                      </>
                  )}

                  {type === 'transferencia' && (
                      <option value="Transferencia interna">
                        Transferencia entre Almacenes
                      </option>
                  )}

                  {type === 'devolucion' && (
                      <>
                        <option value="Devolución de área">
                          Devolución de Área a Almacén
                        </option>
                        <option value="Devolución a proveedor">
                          Devolución a Proveedor
                        </option>
                      </>
                  )}

                  {type === 'ajuste' && (
                      <>
                        <option value="Ajuste sobrante">
                          Ajuste Sobrante (Ingreso)
                        </option>
                        <option value="Ajuste faltante">
                          Ajuste Faltante (Salida)
                        </option>
                      </>
                  )}
                </select>
              </label>

              <label className="text-xs font-bold text-slate-600">
                Almacén {type === 'transferencia' ? 'Origen' : ''} *

                <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-teal-600"
                >
                  {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Almacén de destino */}
            {type === 'transferencia' && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">

                  <label className="text-xs font-bold text-blue-900">
                    Almacén de Destino *

                    <select
                        value={targetWarehouseId}
                        onChange={(e) => setTargetWarehouseId(e.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-blue-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-600"
                    >
                      {warehouses
                          .filter((w) => w.id !== warehouseId)
                          .map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name}
                              </option>
                          ))}
                    </select>
                  </label>

                  <p className="mt-1 text-[11px] text-blue-700">
                    La transferencia es inmediata y vinculada: descuenta en origen y recepciona en destino
                    al mismo costo unitario, manteniendo el valor institucional total intacto.
                  </p>
                </div>
            )}

            {/* Fila 2: Documento de sustento */}
            <div className="grid gap-3 sm:grid-cols-3">

              <label className="text-xs font-bold text-slate-600">
                Tipo de Documento *

                <input
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    placeholder="Ej. Orden de Compra"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-teal-600"
                />
              </label>

              <label className="text-xs font-bold text-slate-600">
                Número de Documento *

                <input
                    required
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder={
                      type === 'ingreso'
                          ? 'O/C-2026-089'
                          : 'PECOSA-125'
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-mono font-bold text-slate-900 outline-none focus:border-teal-600"
                />
              </label>

              <label className="text-xs font-bold text-slate-600">
                Fecha del Documento

                <input
                    type="date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-teal-600"
                />
              </label>
            </div>

            {/* Fila 3: Intervinientes */}
            <div className="grid gap-3 sm:grid-cols-2">

              {type === 'ingreso' ? (
                  <label className="text-xs font-bold text-slate-600">
                    Proveedor *

                    <select
                        value={providerId}
                        onChange={(e) => setProviderId(e.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-teal-600"
                    >
                      {providers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (RUC: {p.ruc})
                          </option>
                      ))}
                    </select>
                  </label>
              ) : (
                  <label className="text-xs font-bold text-slate-600">
                    Área Solicitante / Destino *

                    <select
                        value={areaId}
                        onChange={(e) => setAreaId(e.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-teal-600"
                    >
                      {areas.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.manager})
                          </option>
                      ))}
                    </select>
                  </label>
              )}

              <label className="text-xs font-bold text-slate-600">
                Persona Destinataria / Responsable

                <input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Ej. Mg. Sofía Valdivia Romero"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-teal-600"
                />
              </label>
            </div>

            {/* Selector de productos */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">

              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Agregar Bienes al Movimiento
                </h4>

                <span className="text-[11px] text-teal-800 font-semibold">
                Stock actual en almacén:{' '}
                  <strong>
                  {availableStockInWh} {currentSelectedProd?.unit}
                </strong>
              </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-12">

                <div className="sm:col-span-5">
                  <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-teal-600"
                  >
                    {products
                        .filter((p) => p.status === 'activo')
                        .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} - {p.name}
                            </option>
                        ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <input
                      type="number"
                      min="1"
                      placeholder="Cantidad"
                      value={inputQty}
                      onChange={(e) => setInputQty(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-teal-600"
                  />
                </div>

                <div className="sm:col-span-3">
                  <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={
                          type === 'salida' ||
                          type === 'transferencia'
                      }
                      placeholder={`Costo S/ (${suggestedCost.toFixed(2)})`}
                      value={inputCost}
                      onChange={(e) => setInputCost(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-teal-600 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex h-10 w-full items-center justify-center gap-1 rounded-xl bg-teal-700 text-xs font-bold text-white shadow-xs hover:bg-teal-800"
                  >
                    <Plus className="size-4" />
                    Agregar
                  </button>
                </div>
              </div>

              {/* Lote y vencimiento */}
              {(currentSelectedProd?.hasBatches ||
                  currentSelectedProd?.hasExpiry) && (
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">

                    {currentSelectedProd.hasBatches && (
                        <input
                            placeholder="N° de Lote de fabricación (ej. LOTE-2026-X)"
                            value={inputBatch}
                            onChange={(e) => setInputBatch(e.target.value)}
                            className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-800 bg-white"
                        />
                    )}

                    {currentSelectedProd.hasExpiry && (
                        <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">
                      Vencimiento:
                    </span>

                          <input
                              type="date"
                              value={inputExpiry}
                              onChange={(e) => setInputExpiry(e.target.value)}
                              className="h-8 flex-1 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-800 bg-white"
                          />
                        </div>
                    )}
                  </div>
              )}
            </div>

            {/* Tabla de productos agregados */}
            {items.length > 0 && (
                <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">

                  <table className="w-full text-left">

                    <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 pl-3">Producto</th>
                      <th className="p-2.5 text-center">Cantidad</th>
                      <th className="p-2.5 text-right">Costo Unit.</th>
                      <th className="p-2.5 text-right">Total (S/)</th>
                      <th className="p-2.5 text-center">Quitar</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => {
                      const prod = products.find(
                          (p) => p.id === it.productId
                      );

                      if (!prod) return null;

                      return (
                          <tr key={idx} className="hover:bg-slate-50">

                            <td className="p-2.5 pl-3">
                              <p className="font-bold text-slate-900">
                                {prod.name}
                              </p>

                              <span className="font-mono text-[10px] text-teal-800">
                            {prod.code}
                          </span>

                              {it.batchNumber && (
                                  <span className="ml-2 rounded bg-indigo-50 px-1 text-[10px] text-indigo-700">
                              Lote: {it.batchNumber}
                            </span>
                              )}
                            </td>

                            <td className="p-2.5 text-center font-bold">
                              {it.quantity} {prod.unit}
                            </td>

                            <td className="p-2.5 text-right font-medium">
                              S/ {it.unitCost.toFixed(2)}
                            </td>

                            <td className="p-2.5 text-right font-bold text-teal-800">
                              S/ {(it.quantity * it.unitCost).toFixed(2)}
                            </td>

                            <td className="p-2.5 text-center">
                              <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="rounded p-1 text-rose-500 hover:bg-rose-50"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>

                          </tr>
                      );
                    })}
                    </tbody>

                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td
                          colSpan={3}
                          className="p-2.5 pl-3 text-right uppercase text-slate-700"
                      >
                        Total Comprobante:
                      </td>

                      <td className="p-2.5 text-right text-sm text-teal-800">
                        S/ {totalCalculated.toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                      })}
                      </td>

                      <td />
                    </tr>
                    </tfoot>

                  </table>
                </div>
            )}

            {/* Observaciones */}
            <label className="block text-xs font-bold text-slate-600">
              Observaciones o Justificación de la Operación

              <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Detalle complementario de entrega o recepción de bienes..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 outline-none focus:border-teal-600"
              />
            </label>

            {/* Botones */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">

              <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                  type="submit"
                  disabled={items.length === 0}
                  className="rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50"
              >
                Confirmar Operación
              </button>

            </div>
          </form>
        </div>
      </div>
  );
}

export default NuevoMovimientoModal;
