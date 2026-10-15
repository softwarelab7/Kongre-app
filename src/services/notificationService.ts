// src/services/notificationService.ts
import { WeekSchedule } from '../types';

export interface NotificationPreferences {
  enabled: boolean;
  notifyDaysBefore: number; // 1 (24h) o 2 (48h)
  notifyDuties: boolean; // Micrófonos, audio, acomodador, aseo
  soundEnabled: boolean;
}

const STORAGE_PREFS_KEY = 'kongre_notification_prefs_v1';
const STORAGE_NOTIFIED_KEY = 'kongre_notified_assignments_v1';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  notifyDaysBefore: 1,
  notifyDuties: true,
  soundEnabled: true,
};

/**
 * Verifica si el navegador actual soporta la API de Notificaciones
 */
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
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
export const saveNotificationPreferences = (prefs: Partial<NotificationPreferences>): NotificationPreferences => {
  const current = getNotificationPreferences();
  const updated = { ...current, ...prefs };
  try {
    localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
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

  const iconUrl = options.icon || '/pwa-192x192.png';
  const badgeUrl = options.badge || '/favicon-32x32.png';

  // 1. Intentar mostrar a través del Service Worker de la PWA si está disponible
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body: options.body,
          icon: iconUrl,
          badge: badgeUrl,
          tag: options.tag || `kongre-notif-${Date.now()}`,
          vibrate: [200, 100, 200],
          data: options.data,
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
  return await sendLocalNotification('🏛️ Notificaciones de Kongre Activas', {
    body: '¡Todo listo! Recibirás avisos oportunos antes de tus asignaciones y partes en las reuniones.',
    tag: 'test-notification',
  });
};

/**
 * Analiza las semanas próximas y notifica automáticamente al publicador si tiene asignaciones dentro de las próximas 24h a 48h
 */
export const checkUpcomingAssignmentsAndNotify = async (params: {
  publisherName: string;
  publisherId?: string;
  weeks: WeekSchedule[];
}): Promise<number> => {
  const prefs = getNotificationPreferences();
  if (!prefs.enabled) return 0;
  if (getNotificationPermission() !== 'granted') return 0;

  const { publisherName, publisherId, weeks } = params;
  if (!publisherName || !weeks || weeks.length === 0) return 0;

  const targetName = publisherName.trim().toLowerCase();
  const targetId = publisherId?.trim() || '';

  // Historial de IDs de notificación ya enviadas para no duplicar avisos
  let notifiedSet = new Set<string>();
  try {
    const raw = localStorage.getItem(STORAGE_NOTIFIED_KEY);
    if (raw) {
      notifiedSet = new Set(JSON.parse(raw));
    }
  } catch {}

  const now = new Date();
  const maxDaysAhead = prefs.notifyDaysBefore || 1;
  let notificationsSent = 0;

  for (const week of weeks) {
    if (!week.weekStartDate) continue;

    // Calcular días restantes para la semana
    const [y, m, d] = week.weekStartDate.split('-').map((n) => parseInt(n, 10));
    if (isNaN(y) || isNaN(m) || isNaN(d)) continue;
    const meetingDate = new Date(y, m - 1, d);

    const diffHours = (meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    // Notificar si está en la ventana de aviso (entre -12h y +maxDaysAhead*24h)
    const inTimeWindow = diffHours >= -12 && diffHours <= (maxDaysAhead * 24 + 12);
    if (!inTimeWindow) continue;

    // 1. Revisar partes de Entre Semana (Tesoros, Maestros, Vida Cristiana)
    const checkAssignmentItem = async (partName: string, item: any, notifId: string) => {
      if (!item) return;
      const isAssigned =
        (item.publisherId && targetId && item.publisherId === targetId) ||
        (item.publisherName && item.publisherName.trim().toLowerCase() === targetName);

      if (isAssigned && !notifiedSet.has(notifId)) {
        const success = await sendLocalNotification(`Recordatorio: ${partName}`, {
          body: `Hola ${publisherName}, tienes asignada la parte "${item.title || partName}" para la reunión del ${week.weekStartDate}. ¡Que Jehová bendiga tu preparación!`,
          tag: notifId,
        });

        if (success) {
          notifiedSet.add(notifId);
          notificationsSent++;
        }
      }
    };

    // Tesoros
    await checkAssignmentItem('Discurso de Tesoros', week.midweek?.tesoros?.discurso, `${week.id}_tesoros_discurso_${targetId || targetName}`);
    await checkAssignmentItem('Perlas Escondidas', week.midweek?.tesoros?.perlas, `${week.id}_tesoros_perlas_${targetId || targetName}`);
    await checkAssignmentItem('Lectura de la Biblia', week.midweek?.tesoros?.lecturaBiblia, `${week.id}_lectura_biblia_${targetId || targetName}`);

    // Maestros
    if (Array.isArray(week.midweek?.maestros?.items)) {
      for (const [idx, mItem] of week.midweek.maestros.items.entries()) {
        await checkAssignmentItem(`Demostración: ${mItem.title || 'Seamos Mejores Maestros'}`, mItem, `${week.id}_maestro_${idx}_${targetId || targetName}`);
      }
    }

    // Vida Cristiana
    if (Array.isArray(week.midweek?.vidaCristiana?.items)) {
      for (const [idx, vItem] of week.midweek.vidaCristiana.items.entries()) {
        await checkAssignmentItem(`Vida Cristiana: ${vItem.title || 'Parte'}`, vItem, `${week.id}_vida_${idx}_${targetId || targetName}`);
      }
    }

    // 2. Deberes del Salón (si están habilitados en preferencias)
    if (prefs.notifyDuties && week.midweek?.duties) {
      for (const [dutyKey, assignedList] of Object.entries(week.midweek.duties)) {
        if (!Array.isArray(assignedList)) continue;
        const isDutyAssigned = assignedList.some(
          (assignee) =>
            (typeof assignee === 'string' && targetId && assignee === targetId) ||
            (typeof assignee === 'string' && assignee.trim().toLowerCase() === targetName)
        );

        const dutyNotifId = `${week.id}_duty_${dutyKey}_${targetId || targetName}`;
        if (isDutyAssigned && !notifiedSet.has(dutyNotifId)) {
          const dutyLabel = dutyKey.replace('deber_', '').replace('_', ' ').toUpperCase();
          const success = await sendLocalNotification(`Recordatorio de Deber: ${dutyLabel}`, {
            body: `Hola ${publisherName}, estás asignado en el turno de ${dutyLabel} para la reunión de la semana del ${week.weekStartDate}.`,
            tag: dutyNotifId,
          });

          if (success) {
            notifiedSet.add(dutyNotifId);
            notificationsSent++;
          }
        }
      }
    }
  }

  // Guardar historial actualizado
  try {
    localStorage.setItem(STORAGE_NOTIFIED_KEY, JSON.stringify(Array.from(notifiedSet).slice(-200)));
  } catch {}

  return notificationsSent;
};
