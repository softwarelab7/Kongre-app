// src/services/notificationService.ts
import { WeekSchedule, CartShift, CartLocation, CongregationSettings } from '../types';

export interface NotificationPreferences {
  enabled: boolean;
  notifyDaysBefore: number; // 1 (24h), 2 (48h), 3 (72h), 7 (1 semana)
  notifySameDay: boolean; // Recordatorio adicional el mismo día de la reunión (3h antes)
  preferredHour: string; // Hora preferida para el aviso anticipado, ej: '09:00', '18:00'
  notifyDuties: boolean; // Micrófonos, audio, acomodador, aseo
  notifyCarts: boolean; // Turnos de predicación pública (carritos)
  soundEnabled: boolean;
}

export interface PushSubscriptionRecord {
  id: string;
  publisherId: string;
  publisherName: string;
  congregationName?: string;
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
  mode: 'web-push' | 'sw-background';
  deviceLabel: string;
  subscribedAt: string;
  lastSyncedAt: string;
  scheduledCount: number;
  active: boolean;
}

export interface ScheduledPushReminder {
  id: string;
  publisherId: string;
  publisherName: string;
  weekId: string;
  category: 'midweek' | 'weekend' | 'duty' | 'cart';
  meetingName: string;
  assignmentTitle: string;
  assistantName?: string;
  room?: string;
  meetingDate: string; // YYYY-MM-DD
  meetingTime: string; // HH:mm
  meetingTimestamp: number;
  triggerTimestamp: number;
  isSameDayReminder?: boolean;
  title: string;
  body: string;
  notified?: boolean;
  notifiedAt?: number | null;
  confirmed?: boolean;
  confirmedAt?: number | null;
}

const STORAGE_PREFS_KEY = 'kongre_notification_prefs_v1';
const STORAGE_NOTIFIED_KEY = 'kongre_notified_assignments_v1';
const STORAGE_PUSH_SUB_KEY = 'kongre_push_subscription_v1';

// Clave pública VAPID estándar P-256 (formato Base64URL sin relleno) para suscripción PushManager
const DEFAULT_VAPID_PUBLIC_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY) ||
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  notifyDaysBefore: 1,
  notifySameDay: true,
  preferredHour: '09:00',
  notifyDuties: true,
  notifyCarts: true,
  soundEnabled: true,
};

/**
 * Convierte una clave pública VAPID en Base64URL a Uint8Array para PushManager.subscribe
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Detecta una etiqueta amigable para el navegador/dispositivo actual
 */
export function getCurrentDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Navegador Web';
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  let browser = 'Navegador';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua)) browser = 'Apple Safari';

  let os = 'Escritorio';
  if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS / iPadOS';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return `${browser} en ${os}${isMobile ? ' (Móvil)' : ''}`;
}

/**
 * Verifica si el navegador actual soporta la API de Notificaciones y Service Worker
 */
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const isPushManagerSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'Notification' in window
  );
};

/**
 * Obtener estado del permiso del navegador
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

/**
 * Solicitar permiso para enviar notificaciones al usuario
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) return 'denied';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (e) {
    console.warn('Error solicitando permisos de notificación:', e);
    return 'denied';
  }
};

/**
 * Obtener preferencias guardadas de notificaciones
 */
export const getNotificationPreferences = (): NotificationPreferences => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PREFERENCES;
};

/**
 * Guardar preferencias de notificaciones
 */
export const saveNotificationPreferences = (
  prefs: Partial<NotificationPreferences>
): NotificationPreferences => {
  const current = getNotificationPreferences();
  const updated = { ...current, ...prefs };
  try {
    localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
};

/**
 * Obtener el registro de suscripción Push activo en este dispositivo
 */
export const getPushSubscriptionRecord = (): PushSubscriptionRecord | null => {
  try {
    const raw = localStorage.getItem(STORAGE_PUSH_SUB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PushSubscriptionRecord;
      if (parsed && parsed.active) return parsed;
    }
  } catch {}
  return null;
};

export const savePushSubscriptionRecord = (
  record: PushSubscriptionRecord | null
): void => {
  try {
    if (!record) {
      localStorage.removeItem(STORAGE_PUSH_SUB_KEY);
    } else {
      localStorage.setItem(STORAGE_PUSH_SUB_KEY, JSON.stringify(record));
    }
  } catch {}
};

/**
 * Asegura que el Service Worker (/push-sw.js) esté registrado y activo
 * para poder entregar notificaciones cuando la aplicación está cerrada.
 */
export const ensurePushServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    let reg = await navigator.serviceWorker.getRegistration('/');
    if (!reg) {
      reg = await navigator.serviceWorker.register('/push-sw.js', {
        scope: '/',
      });
    } else {
      // Si el SW existente no es push-sw.js (por ejemplo, en dev mode), registrar push-sw.js
      const scriptURL =
        reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
      if (!scriptURL.includes('push-sw.js') && !scriptURL.includes('sw.js')) {
        reg = await navigator.serviceWorker.register('/push-sw.js', {
          scope: '/',
        });
      }
    }

    // Esperar brevemente a que esté listo (con timeout seguro para no bloquear UI)
    const readyReg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<ServiceWorkerRegistration | null>((resolve) =>
        setTimeout(() => resolve(reg || null), 2500)
      ),
    ]);

    const finalReg = readyReg || reg;

    // Registrar Periodic Background Sync y Background Sync si el navegador lo soporta
    if (finalReg) {
      try {
        if ('periodicSync' in finalReg && (finalReg as any).periodicSync) {
          await (finalReg as any).periodicSync.register('kongre-assignment-reminders', {
            minInterval: 4 * 60 * 60 * 1000, // Cada 4 horas en segundo plano
          });
        }
      } catch {
        // Periodic sync es opcional según permisos del navegador
      }

      try {
        if ('sync' in finalReg && (finalReg as any).sync) {
          await (finalReg as any).sync.register('kongre-check-assignments');
        }
      } catch {
        // Background sync opcional
      }
    }

    return finalReg || null;
  } catch (err) {
    console.warn('No se pudo registrar el Service Worker de notificaciones push:', err);
    return null;
  }
};

/**
 * Suscribe el navegador actual a Notificaciones Web Push en segundo plano
 * y sincroniza la cola de recordatorios del publicador con el Service Worker.
 */
export const subscribeToPushNotifications = async (params: {
  publisherId: string;
  publisherName: string;
  congregationName?: string;
  weeks: WeekSchedule[];
  cartShifts?: CartShift[];
  cartLocations?: CartLocation[];
  settings?: CongregationSettings;
  publishersMap?: Map<string, any>;
}): Promise<{
  success: boolean;
  permission: NotificationPermission;
  subscription: PushSubscriptionRecord | null;
  error?: string;
}> => {
  if (!isNotificationSupported()) {
    return {
      success: false,
      permission: 'denied',
      subscription: null,
      error: 'Tu navegador no soporta la API de Notificaciones Web.',
    };
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return {
      success: false,
      permission,
      subscription: null,
      error:
        permission === 'denied'
          ? 'El permiso de notificaciones está bloqueado en la barra de direcciones del navegador.'
          : 'No se concedió el permiso de notificaciones.',
    };
  }

  // Habilitar preferencias locales
  const prefs = saveNotificationPreferences({ enabled: true });

  // Asegurar Service Worker activo
  const reg = await ensurePushServiceWorker();

  let endpoint = `local-sw://kongre-push/${params.publisherId}`;
  let keys: { p256dh?: string; auth?: string } | undefined = undefined;
  let mode: 'web-push' | 'sw-background' = 'sw-background';

  if (reg && 'pushManager' in reg && reg.pushManager) {
    try {
      let pushSub = await reg.pushManager.getSubscription();
      if (!pushSub) {
        const appServerKey = urlBase64ToUint8Array(DEFAULT_VAPID_PUBLIC_KEY);
        pushSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey as unknown as BufferSource,
        });
      }
      if (pushSub) {
        const subJson = pushSub.toJSON();
        endpoint = subJson.endpoint || endpoint;
        keys = {
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        };
        mode = 'web-push';
      }
    } catch (pushErr) {
      // Si el entorno de navegador/iframe restringe servidores VAPID externos,
      // operamos mediante el Service Worker en segundo plano + IndexedDB + Triggers OS
      console.info(
        'Usando motor de notificaciones en segundo plano del Service Worker (Push Local/OS):',
        pushErr
      );
    }
  }

  // Sincronizar todas las asignaciones próximas con el Service Worker e IndexedDB
  const reminders = await syncAssignmentsWithServiceWorker({
    publisherId: params.publisherId,
    publisherName: params.publisherName,
    congregationName: params.congregationName,
    weeks: params.weeks,
    cartShifts: params.cartShifts,
    cartLocations: params.cartLocations,
    settings: params.settings,
    publishersMap: params.publishersMap,
    preferences: prefs,
  });

  const nowIso = new Date().toISOString();
  const record: PushSubscriptionRecord = {
    id: `push_sub_${params.publisherId}_${Date.now()}`,
    publisherId: params.publisherId,
    publisherName: params.publisherName,
    congregationName: params.congregationName || params.settings?.congregationName || 'Congregación',
    endpoint,
    keys,
    mode,
    deviceLabel: getCurrentDeviceLabel(),
    subscribedAt: nowIso,
    lastSyncedAt: nowIso,
    scheduledCount: reminders.length,
    active: true,
  };

  savePushSubscriptionRecord(record);

  return {
    success: true,
    permission,
    subscription: record,
  };
};

/**
 * Cancela la suscripción a notificaciones push del navegador y limpia la cola en segundo plano
 */
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration('/');
      if (reg && 'pushManager' in reg && reg.pushManager) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
        }
      }
      if (reg?.active) {
        reg.active.postMessage({ type: 'CLEAR_SW_REMINDERS' });
      }
    }
  } catch (e) {
    console.warn('Error al desuscribir PushManager:', e);
  }

  savePushSubscriptionRecord(null);
  saveNotificationPreferences({ enabled: false });
  return true;
};

/**
 * Extrae todas las asignaciones próximas de un publicador (Entre semana, Fin de semana, Deberes y Carritos)
 * y calcula los recordatorios programados para el Service Worker.
 */
export const extractPublisherUpcomingReminders = (params: {
  publisherId?: string;
  publisherName: string;
  congregationName?: string;
  weeks: WeekSchedule[];
  cartShifts?: CartShift[];
  cartLocations?: CartLocation[];
  settings?: CongregationSettings;
  publishersMap?: Map<string, any>;
  preferences?: NotificationPreferences;
}): ScheduledPushReminder[] => {
  const prefs = params.preferences || getNotificationPreferences();
  const targetId = (params.publisherId || '').trim();
  const targetName = (params.publisherName || '').trim().toLowerCase();
  if (!targetId && !targetName) return [];

  const midweekTime = params.settings?.midweekMeetingTime || '19:00';
  const weekendTime = params.settings?.weekendMeetingTime || '10:00';
  const [prefHourStr, prefMinStr] = (prefs.preferredHour || '09:00').split(':');
  const prefHour = parseInt(prefHourStr || '9', 10);
  const prefMin = parseInt(prefMinStr || '0', 10);

  const now = Date.now();
  // Considerar semanas desde ayer hasta 60 días en el futuro
  const minTime = now - 24 * 3600 * 1000;
  const reminders: ScheduledPushReminder[] = [];

  const matchesPublisher = (id?: string | null, name?: string | null): boolean => {
    if (id && targetId && id.trim() === targetId) return true;
    if (name && targetName && name.trim().toLowerCase() === targetName) return true;
    if (id && params.publishersMap && targetName) {
      const pub = params.publishersMap.get(id);
      if (pub?.name && pub.name.trim().toLowerCase() === targetName) return true;
    }
    return false;
  };

  const getPubName = (id?: string | null, fallbackName?: string | null): string => {
    if (fallbackName && fallbackName.trim()) return fallbackName.trim();
    if (id && params.publishersMap) {
      const pub = params.publishersMap.get(id);
      if (pub?.name) return pub.name;
    }
    return '';
  };

  const addAssignmentReminders = (item: {
    baseId: string;
    weekId: string;
    category: 'midweek' | 'weekend' | 'duty' | 'cart';
    meetingName: string;
    assignmentTitle: string;
    assistantName?: string;
    room?: string;
    meetingDate: string;
    meetingTime: string;
  }) => {
    const [y, m, d] = item.meetingDate.split('-').map((n) => parseInt(n, 10));
    if (isNaN(y) || isNaN(m) || isNaN(d)) return;

    const [mh, mm] = item.meetingTime.split(':').map((n) => parseInt(n, 10));
    const meetingDateObj = new Date(y, m - 1, d, isNaN(mh) ? 19 : mh, isNaN(mm) ? 0 : mm, 0);
    const meetingTimestamp = meetingDateObj.getTime();

    if (meetingTimestamp < minTime) return;

    // 1. Recordatorio anticipado (N días antes a la hora preferida)
    const daysBefore = prefs.notifyDaysBefore || 1;
    const triggerDateObj = new Date(y, m - 1, d - daysBefore, prefHour, prefMin, 0);
    const triggerTimestamp = triggerDateObj.getTime();

    const roomSuffix = item.room ? ` (${item.room})` : '';
    const assistantSuffix = item.assistantName ? ` • ${item.assistantName}` : '';
    const daysLabel =
      daysBefore === 1 ? 'mañana' : `en ${daysBefore} días (${item.meetingDate})`;

    reminders.push({
      id: `${item.baseId}_d${daysBefore}`,
      publisherId: targetId || targetName,
      publisherName: params.publisherName,
      weekId: item.weekId,
      category: item.category,
      meetingName: item.meetingName,
      assignmentTitle: item.assignmentTitle,
      assistantName: item.assistantName,
      room: item.room,
      meetingDate: item.meetingDate,
      meetingTime: item.meetingTime,
      meetingTimestamp,
      triggerTimestamp,
      isSameDayReminder: false,
      title: `📅 Recordatorio: ${item.assignmentTitle}`,
      body: `Hola ${params.publisherName}, tienes "${item.assignmentTitle}"${roomSuffix}${assistantSuffix} ${daysLabel} a las ${item.meetingTime} (${item.meetingName}).`,
    });

    // 2. Recordatorio el mismo día de la reunión (3 horas antes) si está activado
    if (prefs.notifySameDay) {
      const sameDayTrigger = meetingTimestamp - 3 * 3600 * 1000;
      if (sameDayTrigger > triggerTimestamp + 2 * 3600 * 1000) {
        reminders.push({
          id: `${item.baseId}_sameday`,
          publisherId: targetId || targetName,
          publisherName: params.publisherName,
          weekId: item.weekId,
          category: item.category,
          meetingName: item.meetingName,
          assignmentTitle: item.assignmentTitle,
          assistantName: item.assistantName,
          room: item.room,
          meetingDate: item.meetingDate,
          meetingTime: item.meetingTime,
          meetingTimestamp,
          triggerTimestamp: sameDayTrigger,
          isSameDayReminder: true,
          title: `⏰ Hoy a las ${item.meetingTime}: ${item.assignmentTitle}`,
          body: `Hola ${params.publisherName}, recuerda tu asignación de hoy: "${item.assignmentTitle}"${roomSuffix}${assistantSuffix} en la ${item.meetingName}.`,
        });
      }
    }
  };

  for (const week of params.weeks || []) {
    if (!week.weekStartDate) continue;
    const midweekDate = week.midweek?.date || week.weekStartDate;
    const weekendDate = week.weekend?.date || week.weekStartDate;

    // --- A. REUNIÓN DE ENTRE SEMANA ---
    if (week.midweek) {
      const mw = week.midweek as any;

      if (matchesPublisher(mw.presidenteId || mw.chairman)) {
        addAssignmentReminders({
          baseId: `${week.id}_mw_chairman_${targetId || targetName}`,
          weekId: week.id,
          category: 'midweek',
          meetingName: 'Reunión Vida y Ministerio',
          assignmentTitle: 'Presidente de la Reunión',
          meetingDate: midweekDate,
          meetingTime: midweekTime,
        });
      }

      if (matchesPublisher(mw.consejeroAuxiliarId)) {
        addAssignmentReminders({
          baseId: `${week.id}_mw_aux_counselor_${targetId || targetName}`,
          weekId: week.id,
          category: 'midweek',
          meetingName: 'Reunión Vida y Ministerio',
          assignmentTitle: 'Consejero de la Sala Auxiliar',
          room: 'Sala Auxiliar',
          meetingDate: midweekDate,
          meetingTime: midweekTime,
        });
      }

      if (matchesPublisher(mw.oracionInicialId || mw.openingPrayer)) {
        addAssignmentReminders({
          baseId: `${week.id}_mw_open_prayer_${targetId || targetName}`,
          weekId: week.id,
          category: 'midweek',
          meetingName: 'Reunión Vida y Ministerio',
          assignmentTitle: 'Oración Inicial',
          meetingDate: midweekDate,
          meetingTime: midweekTime,
        });
      }

      if (matchesPublisher(mw.oracionFinalId || mw.closingPrayer)) {
        addAssignmentReminders({
          baseId: `${week.id}_mw_close_prayer_${targetId || targetName}`,
          weekId: week.id,
          category: 'midweek',
          meetingName: 'Reunión Vida y Ministerio',
          assignmentTitle: 'Oración Final',
          meetingDate: midweekDate,
          meetingTime: midweekTime,
        });
      }

      // Tesoros de la Biblia
      const tesoros = mw.tesoros;
      if (tesoros) {
        if (matchesPublisher(tesoros.discurso?.publisherId, tesoros.discurso?.publisherName)) {
          addAssignmentReminders({
            baseId: `${week.id}_tesoros_discurso_${targetId || targetName}`,
            weekId: week.id,
            category: 'midweek',
            meetingName: 'Tesoros de la Biblia',
            assignmentTitle: tesoros.discurso?.title || 'Discurso de Tesoros de la Biblia',
            meetingDate: midweekDate,
            meetingTime: midweekTime,
          });
        }
        if (matchesPublisher(tesoros.perlas?.publisherId, tesoros.perlas?.publisherName)) {
          addAssignmentReminders({
            baseId: `${week.id}_tesoros_perlas_${targetId || targetName}`,
            weekId: week.id,
            category: 'midweek',
            meetingName: 'Tesoros de la Biblia',
            assignmentTitle: 'Busquemos Perlas Escondidas',
            meetingDate: midweekDate,
            meetingTime: midweekTime,
          });
        }
        if (
          matchesPublisher(tesoros.lecturaBiblia?.publisherId, tesoros.lecturaBiblia?.publisherName)
        ) {
          addAssignmentReminders({
            baseId: `${week.id}_lectura_biblia_${targetId || targetName}`,
            weekId: week.id,
            category: 'midweek',
            meetingName: 'Tesoros de la Biblia',
            assignmentTitle: 'Lectura de la Biblia',
            room: 'Sala Principal',
            meetingDate: midweekDate,
            meetingTime: midweekTime,
          });
        }
        if (
          matchesPublisher(
            tesoros.lecturaBibliaAuxiliar?.publisherId,
            tesoros.lecturaBibliaAuxiliar?.publisherName
          )
        ) {
          addAssignmentReminders({
            baseId: `${week.id}_lectura_biblia_aux_${targetId || targetName}`,
            weekId: week.id,
            category: 'midweek',
            meetingName: 'Tesoros de la Biblia',
            assignmentTitle: 'Lectura de la Biblia',
            room: 'Sala Auxiliar',
            meetingDate: midweekDate,
            meetingTime: midweekTime,
          });
        }
      }

      // Seamos Mejores Maestros
      if (Array.isArray(mw.maestros?.items)) {
        mw.maestros.items.forEach((mItem: any, idx: number) => {
          if (matchesPublisher(mItem.publisherId, mItem.publisherName)) {
            const assistant = getPubName(mItem.assistantId, mItem.assistantName);
            addAssignmentReminders({
              baseId: `${week.id}_maestro_main_${idx}_${targetId || targetName}`,
              weekId: week.id,
              category: 'midweek',
              meetingName: 'Seamos Mejores Maestros',
              assignmentTitle: mItem.title || 'Asignación Estudiantil',
              assistantName: assistant ? `Ayudante: ${assistant}` : undefined,
              room: 'Sala Principal',
              meetingDate: midweekDate,
              meetingTime: midweekTime,
            });
          }
          if (matchesPublisher(mItem.assistantId, mItem.assistantName)) {
            const student = getPubName(mItem.publisherId, mItem.publisherName);
            addAssignmentReminders({
              baseId: `${week.id}_maestro_assist_${idx}_${targetId || targetName}`,
              weekId: week.id,
              category: 'midweek',
              meetingName: 'Seamos Mejores Maestros',
              assignmentTitle: `Ayudante en: ${mItem.title || 'Asignación Estudiantil'}`,
              assistantName: student ? `Titular: ${student}` : undefined,
              room: 'Sala Principal',
              meetingDate: midweekDate,
              meetingTime: midweekTime,
            });
          }
          if (matchesPublisher(mItem.auxPublisherId, mItem.auxPublisherName)) {
            const auxAssistant = getPubName(mItem.auxAssistantId, mItem.auxAssistantName);
            addAssignmentReminders({
              baseId: `${week.id}_maestro_aux_${idx}_${targetId || targetName}`,
              weekId: week.id,
              category: 'midweek',
              meetingName: 'Seamos Mejores Maestros',
              assignmentTitle: mItem.title || 'Asignación Estudiantil',
              assistantName: auxAssistant ? `Ayudante: ${auxAssistant}` : undefined,
              room: 'Sala Auxiliar',
              meetingDate: midweekDate,
              meetingTime: midweekTime,
            });
          }
          if (matchesPublisher(mItem.auxAssistantId, mItem.auxAssistantName)) {
            const auxStudent = getPubName(mItem.auxPublisherId, mItem.auxPublisherName);
            addAssignmentReminders({
              baseId: `${week.id}_maestro_aux_assist_${idx}_${targetId || targetName}`,
              weekId: week.id,
              category: 'midweek',
              meetingName: 'Seamos Mejores Maestros',
              assignmentTitle: `Ayudante en: ${mItem.title || 'Asignación Estudiantil'}`,
              assistantName: auxStudent ? `Titular: ${auxStudent}` : undefined,
              room: 'Sala Auxiliar',
              meetingDate: midweekDate,
              meetingTime: midweekTime,
            });
          }
        });
      }

      // Nuestra Vida Cristiana
      if (Array.isArray(mw.vidaCristiana?.items)) {
        mw.vidaCristiana.items.forEach((vItem: any, idx: number) => {
          if (matchesPublisher(vItem.publisherId, vItem.publisherName)) {
            addAssignmentReminders({
              baseId: `${week.id}_vida_${idx}_${targetId || targetName}`,
              weekId: week.id,
              category: 'midweek',
              meetingName: 'Nuestra Vida Cristiana',
              assignmentTitle: vItem.title || 'Parte de Nuestra Vida Cristiana',
              meetingDate: midweekDate,
              meetingTime: midweekTime,
            });
          }
        });
      }

      const ebc = mw.vidaCristiana?.estudioBiblico;
      if (ebc) {
        if (matchesPublisher(ebc.conductorId || ebc.publisherId, ebc.conductorName)) {
          addAssignmentReminders({
            baseId: `${week.id}_ebc_conductor_${targetId || targetName}`,
            weekId: week.id,
            category: 'midweek',
            meetingName: 'Nuestra Vida Cristiana',
            assignmentTitle: 'Conductor del Estudio Bíblico de la Congregación',
            meetingDate: midweekDate,
            meetingTime: midweekTime,
          });
        }
        if (matchesPublisher(ebc.readerId || ebc.assistantId, ebc.readerName)) {
          addAssignmentReminders({
            baseId: `${week.id}_ebc_reader_${targetId || targetName}`,
            weekId: week.id,
            category: 'midweek',
            meetingName: 'Nuestra Vida Cristiana',
            assignmentTitle: 'Lector del Estudio Bíblico de la Congregación',
            meetingDate: midweekDate,
            meetingTime: midweekTime,
          });
        }
      }

      // Deberes de Entre Semana
      if (prefs.notifyDuties && mw.duties) {
        for (const [dutyKey, assignedList] of Object.entries(mw.duties)) {
          if (!Array.isArray(assignedList)) continue;
          const isAssigned = assignedList.some((assignee) =>
            typeof assignee === 'string' ? matchesPublisher(assignee, assignee) : false
          );
          if (isAssigned) {
            const dutyLabel = dutyKey
              .replace(/^deber_/, '')
              .replace(/_/g, ' ')
              .toUpperCase();
            addAssignmentReminders({
              baseId: `${week.id}_mw_duty_${dutyKey}_${targetId || targetName}`,
              weekId: week.id,
              category: 'duty',
              meetingName: 'Servicio y Deberes (Entre Semana)',
              assignmentTitle: `Turno de ${dutyLabel}`,
              meetingDate: midweekDate,
              meetingTime: midweekTime,
            });
          }
        }
      }
    }

    // --- B. REUNIÓN DE FIN DE SEMANA ---
    if (week.weekend) {
      const wk = week.weekend as any;

      if (matchesPublisher(wk.presidenteId || wk.chairman)) {
        addAssignmentReminders({
          baseId: `${week.id}_wk_chairman_${targetId || targetName}`,
          weekId: week.id,
          category: 'weekend',
          meetingName: 'Reunión de Fin de Semana',
          assignmentTitle: 'Presidente de la Reunión',
          meetingDate: weekendDate,
          meetingTime: weekendTime,
        });
      }

      if (matchesPublisher(wk.oracionInicialId)) {
        addAssignmentReminders({
          baseId: `${week.id}_wk_open_prayer_${targetId || targetName}`,
          weekId: week.id,
          category: 'weekend',
          meetingName: 'Reunión de Fin de Semana',
          assignmentTitle: 'Oración Inicial',
          meetingDate: weekendDate,
          meetingTime: weekendTime,
        });
      }

      if (
        matchesPublisher(
          wk.discursoPublico?.speakerId || wk.discursoPublico?.publisherId,
          wk.discursoPublico?.speakerName
        )
      ) {
        addAssignmentReminders({
          baseId: `${week.id}_wk_public_talk_${targetId || targetName}`,
          weekId: week.id,
          category: 'weekend',
          meetingName: 'Reunión de Fin de Semana',
          assignmentTitle: `Discurso Público: ${wk.discursoPublico?.theme || 'Orador'}`,
          meetingDate: weekendDate,
          meetingTime: weekendTime,
        });
      }

      if (matchesPublisher(wk.atalaya?.conductorId, wk.atalaya?.conductorName)) {
        addAssignmentReminders({
          baseId: `${week.id}_wk_wt_conductor_${targetId || targetName}`,
          weekId: week.id,
          category: 'weekend',
          meetingName: 'Estudio de La Atalaya',
          assignmentTitle: 'Conductor de La Atalaya',
          meetingDate: weekendDate,
          meetingTime: weekendTime,
        });
      }

      if (matchesPublisher(wk.atalaya?.readerId, wk.atalaya?.readerName)) {
        addAssignmentReminders({
          baseId: `${week.id}_wk_wt_reader_${targetId || targetName}`,
          weekId: week.id,
          category: 'weekend',
          meetingName: 'Estudio de La Atalaya',
          assignmentTitle: 'Lector de La Atalaya',
          meetingDate: weekendDate,
          meetingTime: weekendTime,
        });
      }

      if (matchesPublisher(wk.oracionFinalId)) {
        addAssignmentReminders({
          baseId: `${week.id}_wk_close_prayer_${targetId || targetName}`,
          weekId: week.id,
          category: 'weekend',
          meetingName: 'Reunión de Fin de Semana',
          assignmentTitle: 'Oración Final',
          meetingDate: weekendDate,
          meetingTime: weekendTime,
        });
      }

      // Deberes de Fin de Semana
      if (prefs.notifyDuties && wk.duties) {
        for (const [dutyKey, assignedList] of Object.entries(wk.duties)) {
          if (!Array.isArray(assignedList)) continue;
          const isAssigned = assignedList.some((assignee) =>
            typeof assignee === 'string' ? matchesPublisher(assignee, assignee) : false
          );
          if (isAssigned) {
            const dutyLabel = dutyKey
              .replace(/^deber_/, '')
              .replace(/_/g, ' ')
              .toUpperCase();
            addAssignmentReminders({
              baseId: `${week.id}_wk_duty_${dutyKey}_${targetId || targetName}`,
              weekId: week.id,
              category: 'duty',
              meetingName: 'Servicio y Deberes (Fin de Semana)',
              assignmentTitle: `Turno de ${dutyLabel}`,
              meetingDate: weekendDate,
              meetingTime: weekendTime,
            });
          }
        }
      }
    }
  }

  // --- C. TURNOS DE PREDICACIÓN PÚBLICA (CARRITOS) ---
  if (prefs.notifyCarts && Array.isArray(params.cartShifts)) {
    for (const shift of params.cartShifts) {
      if (!shift.date || !Array.isArray(shift.assignedPublisherIds)) continue;
      const isAssigned = shift.assignedPublisherIds.some((id) => matchesPublisher(id));
      if (isAssigned) {
        const loc = params.cartLocations?.find((l) => l.id === shift.locationId);
        const locName = loc?.name || 'Punto de Carrito';
        const shiftStartTime = (shift.timeSlot || '09:00').split('-')[0].trim() || '09:00';
        addAssignmentReminders({
          baseId: `cart_shift_${shift.id}_${targetId || targetName}`,
          weekId: shift.id,
          category: 'cart',
          meetingName: `Predicación con Carritos (${locName})`,
          assignmentTitle: `Turno de Carrito (${shift.timeSlot || 'Horario asignado'})`,
          meetingDate: shift.date,
          meetingTime: shiftStartTime,
        });
      }
    }
  }

  return reminders.sort((a, b) => a.triggerTimestamp - b.triggerTimestamp);
};

/**
 * Sincroniza la lista de recordatorios calculados directamente con el Service Worker
 * y su base de datos IndexedDB para que se disparen incluso con la app cerrada.
 */
export const syncAssignmentsWithServiceWorker = async (params: {
  publisherId?: string;
  publisherName: string;
  congregationName?: string;
  weeks: WeekSchedule[];
  cartShifts?: CartShift[];
  cartLocations?: CartLocation[];
  settings?: CongregationSettings;
  publishersMap?: Map<string, any>;
  preferences?: NotificationPreferences;
}): Promise<ScheduledPushReminder[]> => {
  const prefs = params.preferences || getNotificationPreferences();
  const reminders = extractPublisherUpcomingReminders({
    ...params,
    preferences: prefs,
  });

  if (typeof window === 'undefined') return reminders;

  try {
    const reg = await ensurePushServiceWorker();
    const activeWorker = reg?.active || reg?.waiting || reg?.installing || navigator.serviceWorker?.controller;

    if (activeWorker) {
      activeWorker.postMessage({
        type: 'SYNC_ASSIGNMENTS_SCHEDULE',
        reminders,
        config: {
          ...prefs,
          publisherId: params.publisherId || '',
          publisherName: params.publisherName,
          congregationName: params.congregationName || params.settings?.congregationName || '',
        },
      });
    }
  } catch (err) {
    console.warn('Error sincronizando recordatorios con Service Worker:', err);
  }

  // Actualizar contador en el registro de suscripción local si existe
  const subRecord = getPushSubscriptionRecord();
  if (subRecord && (!params.publisherId || subRecord.publisherId === params.publisherId)) {
    savePushSubscriptionRecord({
      ...subRecord,
      lastSyncedAt: new Date().toISOString(),
      scheduledCount: reminders.length,
    });
  }

  return reminders;
};

/**
 * Obtiene desde el Service Worker la cola viva de recordatorios programados en IndexedDB
 */
export const getServiceWorkerScheduledReminders = async (): Promise<ScheduledPushReminder[]> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return [];
  try {
    const reg = await ensurePushServiceWorker();
    const worker = reg?.active || navigator.serviceWorker.controller;
    if (!worker) return [];

    return await new Promise<ScheduledPushReminder[]>((resolve) => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => resolve([]), 1800);
      channel.port1.onmessage = (event) => {
        clearTimeout(timeout);
        if (event.data && Array.isArray(event.data.reminders)) {
          resolve(event.data.reminders);
        } else {
          resolve([]);
        }
      };
      worker.postMessage({ type: 'GET_SW_STATUS' }, [channel.port2]);
    });
  } catch {
    return [];
  }
};

/**
 * Simula un evento Web Push real desde el Service Worker (con retardo opcional, ej. 5 segundos,
 * para que el hermano pueda minimizar o cerrar la ventana y comprobar que llega en segundo plano).
 */
export const simulateBackgroundPushReminder = async (params: {
  delayMs?: number;
  publisherName?: string;
  nextReminder?: ScheduledPushReminder | null;
}): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') {
    const perm = await requestNotificationPermission();
    if (perm !== 'granted') return false;
  }

  const delayMs = params.delayMs || 0;
  const rem = params.nextReminder;
  const payload = rem
    ? {
        title: rem.title,
        body: rem.body,
        tag: `kongre-push-preview-${Date.now()}`,
        url: '/#mi_vista',
        reminderId: rem.id,
      }
    : {
        title: '🏛️ Recordatorio Push de Asignación - Kongre',
        body: `Hola ${
          params.publisherName || 'hermano'
        }, tu suscripción Web Push en segundo plano funciona correctamente incluso con la aplicación cerrada.`,
        tag: `kongre-push-test-${Date.now()}`,
        url: '/#mi_vista',
      };

  const reg = await ensurePushServiceWorker();
  const worker = reg?.active || navigator.serviceWorker?.controller;
  if (worker) {
    worker.postMessage({
      type: 'SIMULATE_BACKGROUND_PUSH',
      delayMs,
      payload,
    });
    return true;
  }

  // Fallback si el SW aún se está activando
  if (delayMs > 0) {
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return await sendLocalNotification(payload.title, {
    body: payload.body,
    tag: payload.tag,
  });
};

/**
 * Enviar una notificación local / Web Push a través del Service Worker o API nativa
 */
export const sendLocalNotification = async (
  title: string,
  options: {
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  }
): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') {
    const perm = await requestNotificationPermission();
    if (perm !== 'granted') return false;
  }

  const iconUrl = options.icon || '/icon-192.png';
  const badgeUrl = options.badge || '/favicon-32.png';

  // 1. Intentar mostrar a través del Service Worker de la PWA si está disponible
  if ('serviceWorker' in navigator) {
    try {
      const reg = (await ensurePushServiceWorker()) || (await navigator.serviceWorker.getRegistration());
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body: options.body,
          icon: iconUrl,
          badge: badgeUrl,
          tag: options.tag || `kongre-notif-${Date.now()}`,
          vibrate: [200, 100, 200],
          data: options.data || { url: '/#mi_vista' },
          actions: [
            { action: 'view_assignments', title: '📅 Ver mis asignaciones' },
            { action: 'confirm_ack', title: '✅ Enterado' },
          ],
        } as any);
        return true;
      }
    } catch (swErr) {
      console.warn('Service Worker notificación no disponible, usando fallback nativo:', swErr);
    }
  }

  // 2. Fallback a objeto Notification estándar de navegador
  try {
    new Notification(title, {
      body: options.body,
      icon: iconUrl,
      badge: badgeUrl,
      tag: options.tag || `kongre-notif-${Date.now()}`,
    });
    return true;
  } catch (err) {
    console.error('Error al mostrar notificación nativa:', err);
    return false;
  }
};

/**
 * Enviar notificación de prueba para verificar funcionamiento
 */
export const sendTestNotification = async (): Promise<boolean> => {
  return await sendLocalNotification('🏛️ Notificaciones Push de Kongre Activas', {
    body: '¡Todo listo! Recibirás recordatorios automáticos de tus asignaciones incluso si la aplicación no está abierta.',
    tag: 'test-notification',
  });
};

/**
 * Analiza las semanas próximas, sincroniza la cola en segundo plano con el Service Worker
 * y notifica automáticamente al publicador si tiene asignaciones próximas.
 */
export const checkUpcomingAssignmentsAndNotify = async (params: {
  publisherName: string;
  publisherId?: string;
  weeks: WeekSchedule[];
  cartShifts?: CartShift[];
  cartLocations?: CartLocation[];
  settings?: CongregationSettings;
  publishersMap?: Map<string, any>;
}): Promise<number> => {
  const prefs = getNotificationPreferences();
  if (!prefs.enabled) return 0;
  if (getNotificationPermission() !== 'granted') return 0;

  const { publisherName, publisherId, weeks } = params;
  if (!publisherName || !weeks || weeks.length === 0) return 0;

  // Sincronizar siempre con el Service Worker en segundo plano para cuando se cierre la app
  const reminders = await syncAssignmentsWithServiceWorker({
    publisherId,
    publisherName,
    weeks,
    cartShifts: params.cartShifts,
    cartLocations: params.cartLocations,
    settings: params.settings,
    publishersMap: params.publishersMap,
    preferences: prefs,
  });

  // Historial de IDs de notificación ya enviadas para no duplicar avisos
  let notifiedSet = new Set<string>();
  try {
    const raw = localStorage.getItem(STORAGE_NOTIFIED_KEY);
    if (raw) {
      notifiedSet = new Set(JSON.parse(raw));
    }
  } catch {}

  const now = Date.now();
  let notificationsSent = 0;

  for (const rem of reminders) {
    // Disparar si ya entramos en la ventana de recordatorio y la reunión aún no pasó hace más de 12h
    if (now >= rem.triggerTimestamp && now <= rem.meetingTimestamp + 12 * 3600 * 1000) {
      if (!notifiedSet.has(rem.id)) {
        const success = await sendLocalNotification(rem.title, {
          body: rem.body,
          tag: rem.id,
          data: {
            url: '/#mi_vista',
            reminderId: rem.id,
            weekId: rem.weekId,
            publisherId: rem.publisherId,
          },
        });
        if (success) {
          notifiedSet.add(rem.id);
          notificationsSent++;
        }
      }
    }
  }

  // Guardar historial actualizado
  if (notificationsSent > 0) {
    try {
      localStorage.setItem(STORAGE_NOTIFIED_KEY, JSON.stringify(Array.from(notifiedSet)));
    } catch {}
  }

  return notificationsSent;
};
