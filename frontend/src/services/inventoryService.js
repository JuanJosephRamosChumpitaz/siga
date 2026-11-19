
import { StorageService } from './storageService'

export class InventoryService {
  /**
   * Obtiene la ruta jerárquica (breadcrumbs) de una cuenta contable
   */
  static getAccountPath(accountId, accounts) {
    const path = []
    let current = accounts.find((a) => a.id === accountId)

    while (current) {
      path.unshift(`${current.code} - ${current.name}`)
      current = current.parentId
          ? accounts.find((a) => a.id === current.parentId)
          : undefined
    }

    return path.join(' > ')
  }

  /**
   * Obtiene todos los IDs descendientes de una cuenta (hijos, nietos, etc.)
   */
  static getDescendantAccountIds(accountId, accounts) {
    const results = [accountId]
    const queue = [accountId]

    while (queue.length > 0) {
      const parentId = queue.shift()
      const children = accounts.filter((a) => a.parentId === parentId)

      for (const child of children) {
        results.push(child.id)
        queue.push(child.id)
      }
    }

    return results
  }

  /**
   * Valida que no existan ciclos jerárquicos
   */
  static validateNoCycle(accountId, newParentId, accounts) {
    if (!newParentId) return { valid: true }

    if (accountId === newParentId) {
      return {
        valid: false,
        error: 'Una cuenta no puede ser padre de sí misma.',
      }
    }

    const descendants = this.getDescendantAccountIds(accountId, accounts)

    if (descendants.includes(newParentId)) {
      return {
        valid: false,
        error: 'No se puede asignar una cuenta hija o descendiente como padre (crearía un ciclo).',
      }
    }

    return { valid: true }
  }

  /**
   * Calcula el stock y costo promedio de un producto en un almacén
   */
  static getProductStockInWarehouse(product, warehouseId) {
    const stock = product.stocks[warehouseId] || 0
    const cost = product.averageCosts[warehouseId] || 0

    return {
      stock,
      cost,
      totalValue: Math.round(stock * cost * 100) / 100,
    }
  }

  /**
   * Obtiene el stock total institucional de un producto en todos los almacenes
   */
  static getProductTotalStock(product) {
    let totalStock = 0
    let totalValue = 0

    for (const [whId, qty] of Object.entries(product.stocks)) {
      const cost = product.averageCosts[whId] || 0
      totalStock += qty
      totalValue += qty * cost
    }

    return {
      stock: totalStock,
      totalValue: Math.round(totalValue * 100) / 100,
    }
  }

  /**
   * Genera el Kardex completo físico y valorizado por Promedio Ponderado Móvil
   */
  static calculateKardex(productId, warehouseId, movements, startDate, endDate) {
    // 1. Filtrar movimientos confirmados que afecten este producto y este almacén
    const relevantMovements = []

    for (const mov of movements) {
      if (mov.status !== 'confirmado') continue

      for (const it of mov.items) {
        if (it.productId !== productId) continue

        // Ingreso normal o Devolución a este almacén
        if (
            (mov.type === 'ingreso' ||
                mov.type === 'devolucion' ||
                mov.type === 'ajuste') &&
            mov.warehouseId === warehouseId
        ) {
          relevantMovements.push({
            mov,
            item: it,
            isExitFromWh: mov.reason.includes('faltante'),
          })
        } else if (mov.type === 'salida' && mov.warehouseId === warehouseId) {
          relevantMovements.push({
            mov,
            item: it,
            isExitFromWh: true,
          })
        } else if (mov.type === 'transferencia') {
          if (mov.warehouseId === warehouseId) {
            // Origen de transferencia = Salida
            relevantMovements.push({
              mov,
              item: it,
              isExitFromWh: true,
            })
          } else if (mov.targetWarehouseId === warehouseId) {
            // Destino de transferencia = Entrada
            relevantMovements.push({
              mov,
              item: it,
              isExitFromWh: false,
            })
          }
        }
      }
    }

    // Ordenar cronológicamente
    relevantMovements.sort((a, b) => {
      const dateA =
          a.mov.date.split('/').reverse().join('-') +
          ' ' +
          (a.mov.time || '00:00')

      const dateB =
          b.mov.date.split('/').reverse().join('-') +
          ' ' +
          (b.mov.time || '00:00')

      return dateA.localeCompare(dateB)
    })

    // 2. Procesar saldo corriendo
    let runningQty = 0
    let runningCost = 0
    let runningTotal = 0

    let initQty = 0
    let initCost = 0
    let initTotal = 0

    const periodRows = []

    let periodEntriesQty = 0
    let periodEntriesTotal = 0
    let periodExitsQty = 0
    let periodExitsTotal = 0

    const parseDateToIso = (dStr) =>
        dStr.split('/').reverse().join('-')

    for (const { mov, item, isExitFromWh } of relevantMovements) {
      const movIso = parseDateToIso(mov.date)

      const isBeforeStart = startDate ? movIso < startDate : false
      const isAfterEnd = endDate ? movIso > endDate : false

      let entryQty = 0
      let entryCost = 0
      let entryTotal = 0

      let exitQty = 0
      let exitCost = 0
      let exitTotal = 0

      if (!isExitFromWh) {
        // ENTRADA
        entryQty = item.quantity
        entryCost = item.unitCost
        entryTotal = item.quantity * item.unitCost

        const newQty = runningQty + entryQty
        const newTotal = runningTotal + entryTotal

        runningCost = newQty > 0 ? newTotal / newQty : entryCost
        runningQty = newQty
        runningTotal = newTotal
      } else {
        // SALIDA
        exitQty = item.quantity
        exitCost = runningCost > 0 ? runningCost : item.unitCost
        exitTotal = exitQty * exitCost

        runningQty = Math.max(0, runningQty - exitQty)
        runningTotal = runningQty * runningCost
      }

      if (isBeforeStart) {
        initQty = runningQty
        initCost = runningCost
        initTotal = runningTotal
      } else if (!isAfterEnd) {
        // Dentro del rango solicitado
        if (!isExitFromWh) {
          periodEntriesQty += entryQty
          periodEntriesTotal += entryTotal
        } else {
          periodExitsQty += exitQty
          periodExitsTotal += exitTotal
        }

        periodRows.push({
          id: `${mov.id}-${item.id}`,
          date: mov.date,
          time: mov.time,
          correlative: mov.correlative,
          docType: mov.docType,
          docNumber: mov.docNumber,
          type: mov.type,
          reason: mov.reason,
          originOrDestination:
              mov.type === 'transferencia'
                  ? isExitFromWh
                      ? `Hacia: ${mov.targetWarehouseId}`
                      : `Desde: ${mov.warehouseId}`
                  : mov.recipient || mov.responsible,
          entryQty,
          entryCost,
          entryTotal,
          exitQty,
          exitCost,
          exitTotal,
          balanceQty: runningQty,
          balanceCost: runningCost,
          balanceTotal: runningTotal,
          user: mov.registeredBy,
        })
      }
    }

    return {
      rows: periodRows,
      initialBalance: {
        qty: initQty,
        cost: initCost,
        total: initTotal,
      },
      finalBalance: {
        qty: runningQty,
        cost: runningCost,
        total: runningTotal,
      },
      periodEntries: {
        qty: periodEntriesQty,
        total: periodEntriesTotal,
      },
      periodExits: {
        qty: periodExitsQty,
        total: periodExitsTotal,
      },
    }
  }

  /**
   * Valida y confirma un movimiento en una transacción lógica consistente
   */
  static confirmMovement(movement, state) {
    const warehouse = state.warehouses.find(
        (w) => w.id === movement.warehouseId
    )

    if (!warehouse) {
      return {
        success: false,
        error: 'El almacén especificado no existe.',
      }
    }

    if (warehouse.isLockedForInventory) {
      return {
        success: false,
        error: `El almacén "${warehouse.name}" está bloqueado por una sesión de inventario físico en curso.`,
      }
    }

    if (movement.type === 'transferencia') {
      if (
          !movement.targetWarehouseId ||
          movement.targetWarehouseId === movement.warehouseId
      ) {
        return {
          success: false,
          error: 'Debe seleccionar un almacén de destino diferente al almacén de origen.',
        }
      }

      const targetWh = state.warehouses.find(
          (w) => w.id === movement.targetWarehouseId
      )

      if (targetWh?.isLockedForInventory) {
        return {
          success: false,
          error: `El almacén de destino "${targetWh.name}" está bloqueado por inventario físico.`,
        }
      }
    }

    // Clonar productos para actualizar existencias y costos promedio
    const updatedProducts = [...state.products]

    // Validar existencias antes de confirmar salidas o transferencias
    for (const item of movement.items) {
      const prodIndex = updatedProducts.findIndex(
          (p) => p.id === item.productId
      )

      if (prodIndex === -1) {
        return {
          success: false,
          error: `El producto con ID ${item.productId} no existe.`,
        }
      }

      const prod = {
        ...updatedProducts[prodIndex],
        stocks: { ...updatedProducts[prodIndex].stocks },
        averageCosts: { ...updatedProducts[prodIndex].averageCosts },
      }

      const currentStock = prod.stocks[movement.warehouseId] || 0
      const currentCost = prod.averageCosts[movement.warehouseId] || item.unitCost

      if (
          movement.type === 'salida' ||
          (movement.type === 'transferencia' && movement.warehouseId)
      ) {
        if (item.quantity > currentStock) {
          return {
            success: false,
            error: `Stock insuficiente para "${prod.name}" en ${warehouse.name}. Disponible: ${currentStock} ${prod.unit}, Solicitado: ${item.quantity} ${prod.unit}.`,
          }
        }

        // Restar existencias en origen
        prod.stocks[movement.warehouseId] = currentStock - item.quantity

        // Fijar costo unitario de salida con el promedio vigente
        item.unitCost = currentCost
        item.totalCost =
            Math.round(item.quantity * currentCost * 100) / 100

        // Si es transferencia, incrementar en destino manteniendo exactamente el mismo costo
        if (
            movement.type === 'transferencia' &&
            movement.targetWarehouseId
        ) {
          const targetStock =
              prod.stocks[movement.targetWarehouseId] || 0

          const targetCost =
              prod.averageCosts[movement.targetWarehouseId] || currentCost

          const targetTotal =
              targetStock * targetCost + item.quantity * currentCost

          const newTargetStock = targetStock + item.quantity

          prod.stocks[movement.targetWarehouseId] = newTargetStock

          prod.averageCosts[movement.targetWarehouseId] =
              newTargetStock > 0
                  ? targetTotal / newTargetStock
                  : currentCost
        }
      } else if (
          movement.type === 'ingreso' ||
          movement.type === 'devolucion'
      ) {
        // ENTRADA: recalcular promedio ponderado
        const prevTotalVal = currentStock * currentCost
        const incomingVal = item.quantity * item.unitCost
        const newStock = currentStock + item.quantity

        const newAvgCost =
            newStock > 0
                ? (prevTotalVal + incomingVal) / newStock
                : item.unitCost

        prod.stocks[movement.warehouseId] = newStock

        prod.averageCosts[movement.warehouseId] =
            Math.round(newAvgCost * 10000) / 10000
      } else if (movement.type === 'ajuste') {
        const isSobrante =
            movement.reason.toLowerCase().includes('sobrante') ||
            item.quantity > 0

        if (!isSobrante && Math.abs(item.quantity) > currentStock) {
          return {
            success: false,
            error: `El ajuste faltante no puede generar stock negativo para "${prod.name}". Disponible: ${currentStock}.`,
          }
        }

        const delta = isSobrante
            ? Math.abs(item.quantity)
            : -Math.abs(item.quantity)

        prod.stocks[movement.warehouseId] = Math.max(
            0,
            currentStock + delta
        )
      }

      updatedProducts[prodIndex] = prod
    }

    const confirmedMov = {
      ...movement,
      status: 'confirmado',
    }

    // Registrar bitácora de auditoría
    const audit = {
      id: `log-${Date.now()}`,
      timestamp:
          new Date().toLocaleDateString('es-PE') +
          ' ' +
          new Date().toLocaleTimeString('es-PE'),
      userName: state.currentUser.name,
      userRole: state.currentUser.roleLabel,
      action: `CONFIRMAR_${movement.type.toUpperCase()}`,
      entity: 'Movimiento',
      recordId: movement.correlative,
      summary: `${movement.type.toUpperCase()}: ${movement.reason} en ${warehouse.name} por S/ ${movement.totalAmount.toFixed(2)}.`,
    }

    const newState = {
      ...state,
      products: updatedProducts,
      movements: [
        confirmedMov,
        ...state.movements.filter((m) => m.id !== movement.id),
      ],
      auditLogs: [audit, ...state.auditLogs],
    }

    StorageService.saveState(newState)

    return {
      success: true,
      newState,
    }
  }

  /**
   * Anulación / Reversión controlada de un movimiento confirmado
   */
  static reverseMovement(movementId, reversalReason, state) {
    const original = state.movements.find(
        (m) => m.id === movementId
    )

    if (!original) {
      return {
        success: false,
        error: 'Movimiento no encontrado.',
      }
    }

    if (original.status === 'anulado') {
      return {
        success: false,
        error: 'El movimiento ya se encuentra anulado.',
      }
    }

    // Generar movimiento reverso
    const reverseType =
        original.type === 'ingreso' ? 'salida' : 'ingreso'

    const correlative = `REV-${original.correlative}`

    const reversalMov = {
      id: `rev-${Date.now()}`,
      correlative,
      date: new Date().toLocaleDateString('es-PE'),
      time: new Date().toLocaleTimeString('es-PE'),
      type: reverseType,
      reason: `Reversión de ${original.correlative}: ${reversalReason}`,
      warehouseId: original.warehouseId,
      docType: 'Acta de Anulación y Reversión',
      docNumber: `REV-${original.docNumber}`,
      docDate: new Date().toLocaleDateString('es-PE'),
      responsible: state.currentUser.name,
      recipient: original.recipient,
      observations: `Operación de contra-asiento por anulación del comprobante ${original.correlative}. Motivo: ${reversalReason}`,
      registeredBy: state.currentUser.name,
      status: 'borrador',
      linkedMovementId: original.id,
      reversalReason,
      items: original.items.map((it) => ({
        ...it,
        id: `it-${Date.now()}-${Math.random()}`,
      })),
      totalAmount: original.totalAmount,
    }

    // Confirmar reversión
    const result = this.confirmMovement(reversalMov, state)

    if (!result.success || !result.newState) {
      return result
    }

    // Marcar el original como anulado
    const finalState = {
      ...result.newState,
      movements: result.newState.movements.map((m) =>
          m.id === original.id
              ? { ...m, status: 'anulado', reversalReason }
              : m
      ),
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp:
              new Date().toLocaleDateString('es-PE') +
              ' ' +
              new Date().toLocaleTimeString('es-PE'),
          userName: state.currentUser.name,
          userRole: state.currentUser.roleLabel,
          action: 'ANULAR_MOVIMIENTO',
          entity: 'Movimiento',
          recordId: original.correlative,
          summary: `Anulación de comprobante ${original.correlative}. Motivo: ${reversalReason}.`,
          reason: reversalReason,
        },
        ...result.newState.auditLogs,
      ],
    }

    StorageService.saveState(finalState)

    return {
      success: true,
      newState: finalState,
    }
  }

  /**
   * Atender solicitud de materiales (PECOSA):
   * crea salida confirmada y descuenta existencias
   */
  static fulfillRequisition(requisitionId, warehouseId, deliveries, state) {
    const req = state.requisitions.find(
        (r) => r.id === requisitionId
    )

    if (!req) {
      return {
        success: false,
        error: 'Solicitud no encontrada.',
      }
    }

    const area = state.areas.find((a) => a.id === req.areaId)

    const warehouse = state.warehouses.find(
        (w) => w.id === warehouseId
    )

    if (!warehouse) {
      return {
        success: false,
        error: 'Almacén no válido.',
      }
    }

    const itemsToDeliver = []
    let totalAmt = 0

    for (const d of deliveries) {
      if (d.quantity <= 0) continue

      const prod = state.products.find(
          (p) => p.id === d.productId
      )

      if (!prod) continue

      const cost = prod.averageCosts[warehouseId] || 0
      const total = Math.round(d.quantity * cost * 100) / 100

      totalAmt += total

      itemsToDeliver.push({
        id: `it-${Date.now()}-${d.productId}`,
        productId: prod.id,
        productCode: prod.code,
        productName: prod.name,
        unit: prod.unit,
        quantity: d.quantity,
        unitCost: cost,
        totalCost: total,
        accountCodeAtTime: 'DEMO-01.01.01',
        accountNameAtTime: 'Despacho PECOSA',
      })
    }

    if (itemsToDeliver.length === 0) {
      return {
        success: false,
        error: 'Debe ingresar al menos una cantidad a despachar mayor a 0.',
      }
    }

    const pecosaMovement = {
      id: `mov-${Date.now()}`,
      correlative: `${state.settings.pecosaPrefix}${String(
          state.movements.length + 1
      ).padStart(3, '0')}`,
      date: new Date().toLocaleDateString('es-PE'),
      time: new Date().toLocaleTimeString('es-PE').slice(0, 5),
      type: 'salida',
      reason: 'Entrega a área',
      warehouseId,
      docType: 'Pedido Comprobante de Salida (PECOSA)',
      docNumber: `PECOSA-${req.correlative}`,
      docDate: new Date().toLocaleDateString('es-PE'),
      areaId: req.areaId,
      responsible: state.currentUser.name,
      recipient: req.applicantName,
      observations: `Atención de solicitud ${req.correlative} para ${area?.name || 'Área'}.`,
      registeredBy: state.currentUser.name,
      status: 'borrador',
      items: itemsToDeliver,
      totalAmount: totalAmt,
    }

    // Intentar confirmar salida de existencias
    const confirmResult = this.confirmMovement(
        pecosaMovement,
        state
    )

    if (!confirmResult.success || !confirmResult.newState) {
      return confirmResult
    }

    // Actualizar cantidades entregadas en la solicitud
    const updatedReqItems = req.items.map((it) => {
      const delivered = deliveries.find(
          (d) => d.productId === it.productId
      )

      const newDeliveredQty =
          it.deliveredQty + (delivered ? delivered.quantity : 0)

      return {
        ...it,
        deliveredQty: newDeliveredQty,
      }
    })

    const allFulfilled = updatedReqItems.every(
        (it) => it.deliveredQty >= it.approvedQty && it.approvedQty > 0
    )

    const newStatus = allFulfilled
        ? 'atendida'
        : 'atendida_parcial'

    const finalState = {
      ...confirmResult.newState,
      requisitions: confirmResult.newState.requisitions.map((r) =>
          r.id === req.id
              ? {
                ...r,
                status: newStatus,
                items: updatedReqItems,
                linkedMovementIds: [
                  ...r.linkedMovementIds,
                  pecosaMovement.correlative,
                ],
              }
              : r
      ),
    }

    StorageService.saveState(finalState)

    return {
      success: true,
      newState: finalState,
    }
  }

  /**
   * Conciliación de toma de inventario físico y generación de ajustes
   */
  static conciliateInventorySession(sessionId, state) {
    const session = state.inventorySessions.find(
        (s) => s.id === sessionId
    )

    if (!session) {
      return {
        success: false,
        error: 'Sesión de inventario no encontrada.',
      }
    }

    if (session.status === 'conciliada') {
      return {
        success: false,
        error: 'Esta sesión ya fue conciliada previamente.',
      }
    }

    // Verificar si existen diferencias
    const itemsWithDiff = session.items.filter(
        (it) => it.difference !== 0
    )

    let adjustmentMovementId

    let currentState = { ...state }

    if (itemsWithDiff.length > 0) {
      const adjustmentItems = itemsWithDiff.map((it) => ({
        id: `adj-${Date.now()}-${it.productId}`,
        productId: it.productId,
        productCode: it.productCode,
        productName: it.productName,
        unit: it.unit,
        quantity: Math.abs(it.difference),
        unitCost: it.unitCost,
        totalCost: Math.abs(it.totalDifferenceValue),
        accountCodeAtTime: 'DEMO-01.01',
        accountNameAtTime: 'Conciliación de Inventario Físico',
      }))

      const hasSobrante = itemsWithDiff.some(
          (it) => it.difference > 0
      )

      const adjMovement = {
        id: `mov-${Date.now()}`,
        correlative: `AJU-${session.code}`,
        date: new Date().toLocaleDateString('es-PE'),
        time: new Date().toLocaleTimeString('es-PE').slice(0, 5),
        type: 'ajuste',
        reason: hasSobrante
            ? 'Ajuste sobrante de inventario'
            : 'Ajuste faltante de inventario',
        warehouseId: session.warehouseId,
        docType: 'Acta de Conciliación de Inventario',
        docNumber: `ACTA-${session.code}`,
        docDate: new Date().toLocaleDateString('es-PE'),
        responsible: state.currentUser.name,
        recipient: session.warehouseName,
        observations: `Ajuste automático generado por conciliación de toma de inventario ${session.code}.`,
        registeredBy: state.currentUser.name,
        status: 'borrador',
        items: adjustmentItems,
        totalAmount: adjustmentItems.reduce(
            (acc, it) => acc + it.totalCost,
            0
        ),
      }

      const res = this.confirmMovement(adjMovement, currentState)

      if (!res.success || !res.newState) {
        return res
      }

      currentState = res.newState
      adjustmentMovementId = adjMovement.id
    }

    // Desbloquear almacén y cerrar sesión
    const updatedWarehouses = currentState.warehouses.map((w) =>
        w.id === session.warehouseId
            ? { ...w, isLockedForInventory: false }
            : w
    )

    const updatedSessions = currentState.inventorySessions.map((s) =>
        s.id === session.id
            ? {
              ...s,
              status: 'conciliada',
              adjustmentMovementId,
            }
            : s
    )

    const finalState = {
      ...currentState,
      warehouses: updatedWarehouses,
      inventorySessions: updatedSessions,
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp:
              new Date().toLocaleDateString('es-PE') +
              ' ' +
              new Date().toLocaleTimeString('es-PE'),
          userName: state.currentUser.name,
          userRole: state.currentUser.roleLabel,
          action: 'CONCILIAR_INVENTARIO',
          entity: 'InventarioFisico',
          recordId: session.code,
          summary: `Conciliación de sesión de inventario ${session.code} en ${session.warehouseName}.`,
        },
        ...currentState.auditLogs,
      ],
    }

    StorageService.saveState(finalState)

    return {
      success: true,
      newState: finalState,
    }
  }
}

export default InventoryService
