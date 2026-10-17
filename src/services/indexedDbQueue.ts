/**
 * src/services/indexedDbQueue.ts
 * Gestor de cola de sincronización persistente en IndexedDB para Kongre.
 * 
 * Permite almacenar modificaciones locales (como marcación de asistencia,
 * edición de informes S-21 / S-4, asignaciones y territorios) cuando el
 * dispositivo no tiene conexión a internet, y sincronizarlas automáticamente
 * con Supabase mediante cifrado AES-256-GCM una vez recuperada la conexión.
 */

import { CongregationFullData } from './supabaseSyncService';

export type QueueActionType =
  | 'UPDATE_ATTENDANCE'
  | 'UPDATE_SERVICE_REPORT'
  | 'UPDATE_PUBLISHER'
  | 'UPDATE_SCHEDULE'
  | 'UPDATE_TERRITORY'
  | 'FULL_SYNC';

export interface OfflineQueueItem {
  id: string;
  congregationId: string;
  actionType: QueueActionType;
  description: string;
  timestamp: string;
  createdAt: number;
  payload?: any;
  snapshotData?: CongregationFullData;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  attempts: number;
  lastError?: string;
}

export interface QueueStats {
  pendingCount: number;
  syncingCount: number;
  errorCount: number;
  totalCount: number;
  lastQueuedAt: string | null;
}

const DB_NAME = 'kongre_offline_sync_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_queue';

let dbInstance: IDBDatabase | null = null;
let dbOpenPromise: Promise<IDBDatabase> | null = null;

/**
 * Abre y prepara la base de datos IndexedDB
 */
export function openIndexedDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB no está disponible en este entorno.'));
  }

  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbOpenPromise) return dbOpenPromise;

  dbOpenPromise = new Promise((resolve, reject) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('congregationId', 'congregationId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('actionType', 'actionType', { unique: false });
        }
      };

      request.onsuccess = (event: Event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        dbInstance.onversionchange = () => {
          dbInstance?.close();
          dbInstance = null;
          dbOpenPromise = null;
        };
        resolve(dbInstance);
      };

      request.onerror = (event: Event) => {
        dbOpenPromise = null;
        reject((event.target as IDBOpenDBRequest).error);
      };
    } catch (err) {
      dbOpenPromise = null;
      reject(err);
    }
  });

  return dbOpenPromise;
}

/**
 * Encola una modificación en IndexedDB
 */
export async function enqueueOfflineOperation(params: {
  congregationId: string;
  actionType: QueueActionType;
  description: string;
  payload?: any;
  snapshotData?: CongregationFullData;
}): Promise<OfflineQueueItem> {
  const item: OfflineQueueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    congregationId: String(params.congregationId || '').trim().toUpperCase(),
    actionType: params.actionType,
    description: params.description,
    timestamp: new Date().toISOString(),
    createdAt: Date.now(),
    payload: params.payload,
    snapshotData: params.snapshotData,
    status: 'pending',
    attempts: 0,
  };

  try {
    const db = await openIndexedDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    notifyQueueChanged();
    return item;
  } catch (err) {
    console.warn('Fallback a almacenamiento secundario por error en IndexedDB:', err);
    // Respaldo de seguridad en localStorage si IndexedDB estuviera bloqueado por políticas del navegador
    try {
      const fallbackKey = `kongre_idb_fallback_${item.id}`;
      localStorage.setItem(fallbackKey, JSON.stringify(item));
      notifyQueueChanged();
    } catch {}
    return item;
  }
}

/**
 * Obtiene todas las operaciones pendientes de sincronización
 */
export async function getPendingOfflineOperations(congregationId?: string): Promise<OfflineQueueItem[]> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      const req = index.getAll();

      req.onsuccess = () => {
        let items: OfflineQueueItem[] = (req.result || []).filter(
          (i) => i.status === 'pending' || i.status === 'error' || i.status === 'syncing'
        );
        if (congregationId) {
          const cleanId = String(congregationId).trim().toUpperCase();
          items = items.filter((i) => !i.congregationId || i.congregationId === cleanId);
        }
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Leer de localStorage fallback si no se pudo acceder a IndexedDB
    try {
      const items: OfflineQueueItem[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('kongre_idb_fallback_')) {
          const parsed = JSON.parse(localStorage.getItem(k) || '{}');
          if (parsed && parsed.id) items.push(parsed);
        }
      }
      return items.sort((a, b) => a.createdAt - b.createdAt);
    } catch {
      return [];
    }
  }
}

/**
 * Obtiene todas las operaciones registradas (pendientes y procesadas)
 */
export async function getAllOfflineOperations(): Promise<OfflineQueueItem[]> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      const req = index.getAll();

      req.onsuccess = () => {
        const items: OfflineQueueItem[] = req.result || [];
        resolve(items.reverse()); // Más recientes primero
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Actualiza el estado o reintentos de un elemento en la cola
 */
export async function updateOfflineOperation(
  id: string,
  updates: Partial<OfflineQueueItem>
): Promise<void> {
  try {
    const db = await openIndexedDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        if (!getReq.result) {
          resolve();
          return;
        }
        const updated = { ...getReq.result, ...updates };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
    notifyQueueChanged();
  } catch {}
}

/**
 * Elimina una operación de la cola tras sincronizarse con éxito
 */
export async function removeOfflineOperation(id: string): Promise<void> {
  try {
    const db = await openIndexedDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}

  try {
    localStorage.removeItem(`kongre_idb_fallback_${id}`);
  } catch {}

  notifyQueueChanged();
}

/**
 * Limpia todas las operaciones completadas o toda la cola
 */
export async function clearCompletedOfflineOperations(): Promise<void> {
  try {
    const db = await openIndexedDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const all: OfflineQueueItem[] = req.result || [];
        all.forEach((item) => {
          if (item.status === 'synced') {
            store.delete(item.id);
          }
        });
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
    notifyQueueChanged();
  } catch {}
}

/**
 * Calcula estadísticas rápidas de la cola para los componentes de interfaz
 */
export async function getOfflineQueueStats(): Promise<QueueStats> {
  const pending = await getPendingOfflineOperations();
  const pendingCount = pending.filter((i) => i.status === 'pending' || i.status === 'error').length;
  const syncingCount = pending.filter((i) => i.status === 'syncing').length;
  const errorCount = pending.filter((i) => i.status === 'error').length;
  const lastQueuedAt = pending.length > 0 ? pending[pending.length - 1].timestamp : null;

  return {
    pendingCount,
    syncingCount,
    errorCount,
    totalCount: pending.length,
    lastQueuedAt,
  };
}

/**
 * Emite evento personalizado en window para mantener reactiva la UI
 */
function notifyQueueChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kongre_indexeddb_queue_changed'));
  }
}
