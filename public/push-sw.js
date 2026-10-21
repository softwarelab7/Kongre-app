// public/push-sw.js
// Service Worker de Notificaciones Web Push y Recordatorios en Segundo Plano - Kongre

const SW_VERSION = '2.9.2';
const DB_NAME = 'kongre_push_sw_db_v1';
const DB_VERSION = 1;
const STORE_REMINDERS = 'scheduled_reminders';
const STORE_CONFIG = 'sw_config';

// ---------------------------------------------------------------------------
// 1. UTILIDADES INDEXEDDB EN EL SERVICE WORKER
// ---------------------------------------------------------------------------
function openPushDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_REMINDERS)) {
        const store = db.createObjectStore(STORE_REMINDERS, { keyPath: 'id' });
        store.createIndex('triggerTimestamp', 'triggerTimestamp', { unique: false });
        store.createIndex('publisherId', 'publisherId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_CONFIG)) {
        db.createObjectStore(STORE_CONFIG, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveRemindersToDb(reminders, config) {
  const db = await openPushDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_REMINDERS, STORE_CONFIG], 'readwrite');
    const remStore = tx.objectStore(STORE_REMINDERS);
    const cfgStore = tx.objectStore(STORE_CONFIG);

    // Obtener estado previo de 'notified' y 'confirmed' para no perder confirmaciones
    const getAllReq = remStore.getAll();
    getAllReq.onsuccess = () => {
      const existingList = getAllReq.result || [];
      const existingMap = new Map();
      for (const item of existingList) {
        existingMap.set(item.id, item);
      }

      remStore.clear();
      for (const rem of reminders) {
        const prev = existingMap.get(rem.id);
        remStore.put({
          ...rem,
          notified: prev?.notified || rem.notified || false,
          notifiedAt: prev?.notifiedAt || rem.notifiedAt || null,
          confirmed: prev?.confirmed || rem.confirmed || false,
        });
      }

      if (config) {
        cfgStore.put({
          key: 'push_settings',
          ...config,
          updatedAt: Date.now(),
        });
      }
    };

    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function getAllRemindersFromDb() {
  const db = await openPushDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_REMINDERS, 'readonly');
    const store = tx.objectStore(STORE_REMINDERS);
    const req = store.getAll();
    req.onsuccess = () => {
      db.close();
      resolve(req.result || []);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

async function getConfigFromDb() {
  const db = await openPushDb();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_CONFIG, 'readonly');
    const store = tx.objectStore(STORE_CONFIG);
    const req = store.get('push_settings');
    req.onsuccess = () => {
      db.close();
      resolve(req.result || null);
    };
    req.onerror = () => {
      db.close();
      resolve(null);
    };
  });
}

async function markReminderState(reminderId, updates) {
  const db = await openPushDb();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_REMINDERS, 'readwrite');
    const store = tx.objectStore(STORE_REMINDERS);
    const getReq = store.get(reminderId);
    getReq.onsuccess = () => {
      if (getReq.result) {
        store.put({
          ...getReq.result,
          ...updates,
        });
      }
    };
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      db.close();
      resolve(false);
    };
  });
}

async function clearAllRemindersInDb() {
  const db = await openPushDb();
  return new Promise((resolve) => {
    const tx = db.transaction([STORE_REMINDERS, STORE_CONFIG], 'readwrite');
    tx.objectStore(STORE_REMINDERS).clear();
    tx.objectStore(STORE_CONFIG).clear();
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      db.close();
      resolve(false);
    };
  });
}

// ---------------------------------------------------------------------------
// 2. PROGRAMACIÓN DE TRIGGERS DEL SISTEMA OPERATIVO Y CHEQUEO EN SEGUNDO PLANO
// ---------------------------------------------------------------------------
let activeSwTimers = new Map();

async function scheduleOsAndMemoryTriggers() {
  try {
    // Limpiar timers previos en memoria del SW
    for (const timerId of activeSwTimers.values()) {
      clearTimeout(timerId);
    }
    activeSwTimers.clear();

    const config = await getConfigFromDb();
    if (config && config.enabled === false) return;

    const reminders = await getAllRemindersFromDb();
    const now = Date.now();
    const supportsTimestampTrigger =
      typeof self.TimestampTrigger === 'function' &&
      'showTrigger' in Notification.prototype;

    for (const rem of reminders) {
      if (rem.notified) continue;
      // Ignorar asignaciones cuya reunión ya pasó hace más de 12 horas
      if (rem.meetingTimestamp && rem.meetingTimestamp + 12 * 3600 * 1000 < now) {
        continue;
      }

      const delayMs = rem.triggerTimestamp - now;

      // 1. Si el navegador soporta Notification Triggers API (Chromium OS-level trigger con app cerrada)
      if (supportsTimestampTrigger && delayMs > 0 && delayMs <= 14 * 24 * 3600 * 1000) {
        try {
          await self.registration.showNotification(rem.title, {
            body: rem.body,
            icon: '/icon-192.png',
            badge: '/favicon-32.png',
            tag: rem.id,
            showTrigger: new self.TimestampTrigger(rem.triggerTimestamp),
            vibrate: config?.soundEnabled !== false ? [200, 100, 200] : undefined,
            silent: config?.soundEnabled === false,
            data: {
              reminderId: rem.id,
              url: '/#mi_vista',
              weekId: rem.weekId,
              publisherId: rem.publisherId,
            },
            actions: [
              { action: 'view_assignments', title: '📅 Ver en mi portal' },
              { action: 'confirm_ack', title: '✅ Enterado' },
            ],
          });
        } catch (e) {
          // Fallback a timer/sync si TimestampTrigger falla
        }
      }

      // 2. Si ya está en ventana de disparo (o vence en las próximas 6 horas mientras el SW vive)
      if (delayMs <= 0) {
        await fireReminderNotification(rem, config);
      } else if (delayMs <= 6 * 3600 * 1000) {
        const timerId = setTimeout(() => {
          fireReminderNotification(rem, config);
        }, delayMs);
        activeSwTimers.set(rem.id, timerId);
      }
    }
  } catch (err) {
    console.warn('[Kongre Push SW] Error programando triggers:', err);
  }
}

async function fireReminderNotification(rem, config) {
  if (!rem || rem.notified) return;
  try {
    await markReminderState(rem.id, {
      notified: true,
      notifiedAt: Date.now(),
    });

    await self.registration.showNotification(rem.title, {
      body: rem.body,
      icon: '/icon-192.png',
      badge: '/favicon-32.png',
      tag: rem.id,
      renotify: true,
      requireInteraction: true,
      vibrate: config?.soundEnabled !== false ? [200, 100, 200, 100, 300] : undefined,
      silent: config?.soundEnabled === false,
      data: {
        reminderId: rem.id,
        url: '/#mi_vista',
        weekId: rem.weekId,
        publisherId: rem.publisherId,
      },
      actions: [
        { action: 'view_assignments', title: '📅 Ver mis asignaciones' },
        { action: 'confirm_ack', title: '✅ Enterado' },
      ],
    });
  } catch (err) {
    console.warn('[Kongre Push SW] Error mostrando notificación:', err);
  }
}

async function checkAndFireDueReminders() {
  try {
    const config = await getConfigFromDb();
    if (config && config.enabled === false) return 0;

    const reminders = await getAllRemindersFromDb();
    const now = Date.now();
    let firedCount = 0;

    for (const rem of reminders) {
      if (rem.notified) continue;
      const meetingEnd = (rem.meetingTimestamp || rem.triggerTimestamp) + 12 * 3600 * 1000;
      if (now >= rem.triggerTimestamp && now <= meetingEnd) {
        await fireReminderNotification(rem, config);
        firedCount++;
      }
    }
    return firedCount;
  } catch (err) {
    console.warn('[Kongre Push SW] Error en checkAndFireDueReminders:', err);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// 3. CICLO DE VIDA DEL SERVICE WORKER
// ---------------------------------------------------------------------------
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      await scheduleOsAndMemoryTriggers();
      await checkAndFireDueReminders();
    })()
  );
});

// ---------------------------------------------------------------------------
// 4. RECEPCIÓN DE EVENTOS WEB PUSH (CON LA APLICACIÓN CERRADA)
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      const config = await getConfigFromDb();
      if (config && config.enabled === false) return;

      let payload = null;
      if (event.data) {
        try {
          payload = event.data.json();
        } catch {
          payload = {
            title: '🏛️ Recordatorio de Asignación - Kongre',
            body: event.data.text(),
          };
        }
      }

      if (payload && payload.title) {
        const tag = payload.tag || `kongre-push-${Date.now()}`;
        if (payload.reminderId) {
          await markReminderState(payload.reminderId, {
            notified: true,
            notifiedAt: Date.now(),
          });
        }
        await self.registration.showNotification(payload.title, {
          body: payload.body || 'Tienes una asignación teocrática próximamente.',
          icon: payload.icon || '/icon-192.png',
          badge: payload.badge || '/favicon-32.png',
          tag,
          renotify: true,
          requireInteraction: true,
          vibrate: config?.soundEnabled !== false ? [200, 100, 200, 100, 300] : undefined,
          silent: config?.soundEnabled === false,
          data: {
            url: payload.url || '/#mi_vista',
            reminderId: payload.reminderId || null,
            ...(payload.data || {}),
          },
          actions: payload.actions || [
            { action: 'view_assignments', title: '📅 Ver mis asignaciones' },
            { action: 'confirm_ack', title: '✅ Enterado' },
          ],
        });
      } else {
        // Si es un push de despertar sin cuerpo, revisar recordatorios pendientes en IndexedDB
        await checkAndFireDueReminders();
      }
    })()
  );
});

// ---------------------------------------------------------------------------
// 5. RENOVACIÓN AUTOMÁTICA DE SUSCRIPCIÓN PUSH
// ---------------------------------------------------------------------------
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const newSub = await self.registration.pushManager.subscribe(
          event.oldSubscription ? event.oldSubscription.options : { userVisibleOnly: true }
        );
        const allClients = await self.clients.matchAll({ includeUncontrolled: true });
        for (const client of allClients) {
          client.postMessage({
            type: 'PUSH_SUBSCRIPTION_RENEWED',
            subscription: JSON.parse(JSON.stringify(newSub)),
          });
        }
      } catch (e) {
        console.warn('[Kongre Push SW] No se pudo renovar automáticamente la suscripción:', e);
      }
    })()
  );
});

// ---------------------------------------------------------------------------
// 6. SINCRONIZACIÓN PERIÓDICA Y EN SEGUNDO PLANO (PERIODIC SYNC & SYNC)
// ---------------------------------------------------------------------------
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'kongre-assignment-reminders') {
    event.waitUntil(
      (async () => {
        await scheduleOsAndMemoryTriggers();
        await checkAndFireDueReminders();
      })()
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'kongre-check-assignments') {
    event.waitUntil(
      (async () => {
        await scheduleOsAndMemoryTriggers();
        await checkAndFireDueReminders();
      })()
    );
  }
});

// ---------------------------------------------------------------------------
// 7. CLIC EN LA NOTIFICACIÓN (ABRE LA APP SI ESTÁ CERRADA O LA ENFOCA)
// ---------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  notification.close();

  event.waitUntil(
    (async () => {
      if (data.reminderId) {
        await markReminderState(data.reminderId, {
          confirmed: true,
          confirmedAt: Date.now(),
        });
      }

      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Notificar a los clientes abiertos sobre la confirmación
      for (const client of windowClients) {
        client.postMessage({
          type: 'REMINDER_INTERACTION',
          action: action || 'click',
          reminderId: data.reminderId || null,
        });
      }

      // Si el usuario pulsó únicamente "Enterado", no forzamos abrir ventana si estaba cerrada
      if (action === 'confirm_ack') {
        return;
      }

      const targetUrl = data.url || '/#mi_vista';

      // Si ya hay una pestaña de Kongre abierta, enfocarla y navegar al Portal del Publicador
      for (const client of windowClients) {
        if ('focus' in client) {
          await client.focus();
          client.postMessage({
            type: 'NAVIGATE_TO_PORTAL',
            url: targetUrl,
            reminderId: data.reminderId || null,
          });
          return;
        }
      }

      // Si la aplicación estaba completamente cerrada, abrir una nueva ventana en el Portal del Publicador
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});

// ---------------------------------------------------------------------------
// 8. PUENTE DE MENSAJES CON LA APLICACIÓN CLIENTE
// ---------------------------------------------------------------------------
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === 'SYNC_ASSIGNMENTS_SCHEDULE') {
    event.waitUntil(
      (async () => {
        const reminders = Array.isArray(data.reminders) ? data.reminders : [];
        const config = data.config || {};
        await saveRemindersToDb(reminders, config);
        await scheduleOsAndMemoryTriggers();
        await checkAndFireDueReminders();

        if (event.ports && event.ports[0]) {
          const updated = await getAllRemindersFromDb();
          event.ports[0].postMessage({
            ok: true,
            scheduledCount: updated.length,
            swVersion: SW_VERSION,
          });
        }
      })()
    );
  } else if (data.type === 'SIMULATE_BACKGROUND_PUSH') {
    const delayMs = Number(data.delayMs) || 0;
    const payload = data.payload || {
      title: '🏛️ Recordatorio Automático Kongre',
      body: 'Prueba de notificación push en segundo plano exitosa.',
      tag: `kongre-sim-push-${Date.now()}`,
    };

    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(async () => {
          try {
            await self.registration.showNotification(payload.title, {
              body: payload.body,
              icon: '/icon-192.png',
              badge: '/favicon-32.png',
              tag: payload.tag || `kongre-sim-push-${Date.now()}`,
              renotify: true,
              requireInteraction: true,
              vibrate: [200, 100, 200, 100, 300],
              data: {
                url: payload.url || '/#mi_vista',
                reminderId: payload.reminderId || null,
              },
              actions: [
                { action: 'view_assignments', title: '📅 Ver mis asignaciones' },
                { action: 'confirm_ack', title: '✅ Enterado' },
              ],
            });
          } catch (e) {
            console.warn('[Kongre Push SW] Error simulando push:', e);
          }
          resolve();
        }, delayMs);
      })
    );
  } else if (data.type === 'GET_SW_STATUS') {
    event.waitUntil(
      (async () => {
        const reminders = await getAllRemindersFromDb();
        const config = await getConfigFromDb();
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({
            ok: true,
            swVersion: SW_VERSION,
            reminders,
            config,
          });
        }
      })()
    );
  } else if (data.type === 'CLEAR_SW_REMINDERS') {
    event.waitUntil(
      (async () => {
        for (const timerId of activeSwTimers.values()) {
          clearTimeout(timerId);
        }
        activeSwTimers.clear();
        await clearAllRemindersInDb();
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ ok: true });
        }
      })()
    );
  }
});
