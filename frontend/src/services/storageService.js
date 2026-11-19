import {
  defaultAccounts,
  defaultAreas,
  defaultAuditLogs,
  defaultLocations,
  defaultMovements,
  defaultPhysicalInventorySessions,
  defaultProducts,
  defaultProviders,
  defaultRequisitions,
  defaultSettings,
  defaultUsers,
  defaultWarehouses,
} from './seedData'

const STORAGE_KEY = 'SIGAL_DATABASE_V1'

export class StorageService {
  static isBrowser() {
    return typeof window !== 'undefined'
  }

  static loadState() {
    if (!this.isBrowser()) {
      return this.getDefaultState()
    }

    try {
      const serialized = localStorage.getItem(STORAGE_KEY)

      if (serialized) {
        const parsed = JSON.parse(serialized)

        // Validación básica de la estructura
        if (
            parsed.products &&
            parsed.accounts &&
            parsed.movements &&
            parsed.warehouses &&
            parsed.requisitions
        ) {
          return parsed
        }
      }
    } catch (err) {
      console.warn(
          'Error loading SIGAL state from localStorage, initializing default seed.',
          err
      )
    }

    // Datos iniciales por defecto
    const defaultState = this.getDefaultState()
    this.saveState(defaultState)

    return defaultState
  }

  static saveState(state) {
    if (!this.isBrowser()) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      // También guardar en IndexedDB de forma asíncrona
      this.writeToIndexedDB(state)
    } catch (err) {
      console.error('Error saving state to localStorage', err)
    }
  }

  static getDefaultState() {
    return {
      settings: { ...defaultSettings },
      users: [...defaultUsers],
      currentUser: defaultUsers[0] || null,
      warehouses: [...defaultWarehouses],
      locations: [...defaultLocations],
      areas: [...defaultAreas],
      providers: [...defaultProviders],
      accounts: [...defaultAccounts],
      products: [...defaultProducts],
      movements: [...defaultMovements],
      requisitions: [...defaultRequisitions],
      inventorySessions: [...defaultPhysicalInventorySessions],
      auditLogs: [...defaultAuditLogs],
    }
  }

  static resetToDefault() {
    const fresh = this.getDefaultState()
    this.saveState(fresh)

    return fresh
  }

  static exportJSON(state) {
    return JSON.stringify(
        {
          version: '1.0',
          system: 'SIGAL - Sistema de Gestión de Almacén',
          exportedAt: new Date().toISOString(),
          data: state,
        },
        null,
        2
    )
  }

  static importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString)
      const data = parsed.data || parsed

      if (
          !data.products ||
          !data.accounts ||
          !data.movements ||
          !data.warehouses
      ) {
        return {
          success: false,
          error: 'El archivo JSON no contiene la estructura requerida de SIGAL.',
        }
      }

      this.saveState(data)

      return {
        success: true,
        data,
      }
    } catch (err) {
      return {
        success: false,
        error: 'Archivo JSON inválido o corrupto: ' + String(err),
      }
    }
  }

  static writeToIndexedDB(state) {
    if (!('indexedDB' in window)) return

    try {
      const request = indexedDB.open('SIGAL_IDB', 1)

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        if (!db.objectStoreNames.contains('store')) {
          db.createObjectStore('store', { keyPath: 'id' })
        }
      }

      request.onsuccess = (event) => {
        const db = event.target.result
        const tx = db.transaction('store', 'readwrite')

        tx.objectStore('store').put({
          id: 'current_state',
          ...state,
          updatedAt: new Date().toISOString(),
        })
      }

      request.onerror = (event) => {
        console.warn('Error writing to IndexedDB:', event.target.error)
      }
    } catch {
      // Se mantiene localStorage como almacenamiento principal
    }
  }
}

export default StorageService
