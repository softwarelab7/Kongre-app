// src/utils/theocraticReminders.ts
import {
  WeekSchedule,
  Publisher,
  CartShift,
  CartLocation,
  MonthlyServiceReport,
  AccountTransaction,
  CongregationSettings,
  AssignmentStatus,
} from '../types';
import { extractWeekAssignments, createAssignmentWhatsAppMessage } from './whatsapp';
import { decryptSensitiveFieldAtRest } from './theocraticSecurity';

export interface UnconfirmedAssignmentReminder {
  id: string;
  weekId: string;
  meetingType: 'midweek' | 'weekend';
  meetingDate: string;
  formattedDate: string;
  assignmentPath: string;
  roleTitle: string;
  section: string;
  publisherId: string;
  publisherName: string;
  publisherPhone: string;
  assistantName?: string;
  room?: 'principal' | 'auxiliar';
  lessonNumber?: number;
  timeMinutes?: number;
  status: AssignmentStatus;
  isUrgent: boolean; // Menos de 48h para la reunión
  whatsappMessage: string;
}

export interface UncoveredCartShiftReminder {
  id: string;
  shiftId: string;
  locationId: string;
  locationName: string;
  dayOfWeek: string;
  timeSlot: string;
  date?: string;
  currentPublishers: Array<{ id: string; name: string }>;
  vacanciesCount: number; // 1 o 2
  isCritical: boolean; // 0 publicadores asignados
}

export interface PendingReportReminder {
  publisherId: string;
  publisherName: string;
  publisherPhone: string;
  reportMonth: string; // YYYY-MM
  reportMonthName: string;
  whatsappMessage: string;
}

export interface TheocraticRemindersSummary {
  unconfirmedAssignments: UnconfirmedAssignmentReminder[];
  uncoveredCartShifts: UncoveredCartShiftReminder[];
  pendingReports: PendingReportReminder[];
  pendingAccountsCount: number;
  totalAttentionCount: number;
  hasUrgentItems: boolean;
}

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function getCleanPublisherPhone(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  const decrypted = decryptSensitiveFieldAtRest(rawPhone);
  if (
    typeof decrypted === 'string' &&
    (decrypted.startsWith('kgr_sec') || decrypted.startsWith('kgr_v'))
  ) {
    return '';
  }
  return String(decrypted || '').replace(/[^0-9]/g, '');
}

export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return new Intl.DateTimeFormat('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(d);
    }
  } catch {}
  return dateStr;
}

export function createReportReminderWhatsAppMessage(
  publisher: Publisher,
  monthName: string,
  congregationName?: string
): string {
  const honorific = publisher.gender === 'hermana' ? 'hermana' : 'hermano';
  const cong = congregationName || 'la congregación';
  return (
    `👋 *Recordatorio del Informe Mensual de Servicio*\n\n` +
    `Estimado(a) ${honorific} *${publisher.name}*,\n\n` +
    `Te saludamos con mucho cariño. Te recordamos amablemente compartirnos tu informe de actividad en el ministerio correspondiente a *${monthName}* para ${cong}.\n\n` +
    `Puedes responder a este mensaje indicando si pudiste participar en el ministerio (y tus horas/cursos bíblicos si eres precursor o tienes meta).\n\n` +
    `¡Muchas gracias por tu amor y empeño en servir a Jehová! 🙏✨`
  );
}

export function createCartShiftInviteWhatsAppMessage(
  publisher: Publisher,
  shiftInfo: { locationName: string; dayOfWeek: string; timeSlot: string; date?: string },
  congregationName?: string
): string {
  const honorific = publisher.gender === 'hermana' ? 'hermana' : 'hermano';
  return (
    `🛒 *Apoyo en Exhibidores Móviles (Carritos)*\n\n` +
    `Estimado(a) ${honorific} *${publisher.name}*,\n\n` +
    `Tenemos un turno disponible en la predicación pública con exhibidores:\n\n` +
    `📍 *Punto:* ${shiftInfo.locationName}\n` +
    `📅 *Día:* ${shiftInfo.dayOfWeek}${shiftInfo.date ? ` (${shiftInfo.date})` : ''}\n` +
    `⏰ *Horario:* ${shiftInfo.timeSlot}\n\n` +
    `¿Tendrías disponibilidad para acompañarnos en este turno? Agradecemos mucho tu respuesta. ¡Que Jehová te bendiga! ✨`
  );
}

export function computeTheocraticReminders(params: {
  weeks: WeekSchedule[];
  currentWeekId?: string;
  publishers: Publisher[];
  cartShifts?: CartShift[];
  cartLocations?: CartLocation[];
  monthlyReports?: MonthlyServiceReport[];
  transactions?: AccountTransaction[];
  settings?: CongregationSettings;
  referenceDate?: Date;
}): TheocraticRemindersSummary {
  const {
    weeks = [],
    currentWeekId,
    publishers = [],
    cartShifts = [],
    cartLocations = [],
    monthlyReports = [],
    transactions = [],
    settings,
    referenceDate = new Date(),
  } = params;

  const nowMs = referenceDate.getTime();
  const congName = settings?.congregationName || 'la congregación';

  const publishersMap = new Map<string, Publisher>();
  publishers.forEach((p) => {
    publishersMap.set(p.id, p);
  });

  // 1. Asignaciones pendientes de confirmación (Semana actual y próximas semanas)
  const unconfirmedAssignments: UnconfirmedAssignmentReminder[] = [];
  const sortedWeeks = [...weeks].sort((a, b) =>
    (a.weekStartDate || '').localeCompare(b.weekStartDate || '')
  );

  // Filtrar semanas relevantes: desde la semana actual o fechas recientes (máx 2 semanas adelante)
  const targetWeeks = sortedWeeks.filter((w) => {
    if (!w.weekStartDate) return false;
    if (currentWeekId && w.id === currentWeekId) return true;
    try {
      const wDate = new Date(w.weekStartDate + 'T00:00:00').getTime();
      // Incluir semanas desde hace 3 días hasta 16 días en el futuro
      return wDate >= nowMs - 3 * 86400000 && wDate <= nowMs + 16 * 86400000;
    } catch {
      return false;
    }
  });

  targetWeeks.forEach((week) => {
    const assignments = extractWeekAssignments(week, publishersMap);
    assignments.forEach((entry) => {
      // Solo nos interesan aquellas asignadas a un publicador que NO estén marcadas como confirmadas
      if (entry.status !== 'confirmada') {
        let isUrgent = false;
        try {
          const meetingMs = new Date(entry.meetingDate + 'T19:00:00').getTime();
          // Es urgente si la reunión es en menos de 48 horas o si ya es hoy
          if (meetingMs - nowMs <= 48 * 3600000 && meetingMs >= nowMs - 12 * 3600000) {
            isUrgent = true;
          }
        } catch {}

        const cleanPhone = getCleanPublisherPhone(entry.publisher.phone);
        const msg = createAssignmentWhatsAppMessage(
          entry.publisher,
          week,
          entry.roleTitle,
          entry.meetingType,
          entry.meetingDate,
          {
            isReminder: true,
            room: entry.room,
            assistantName: entry.assistant?.name,
            lessonNumber: entry.lessonNumber,
            timeMinutes: entry.timeMinutes,
            congregationName: congName,
            assignmentPath: entry.assignmentPath,
          }
        );

        unconfirmedAssignments.push({
          id: entry.id,
          weekId: entry.weekId,
          meetingType: entry.meetingType,
          meetingDate: entry.meetingDate,
          formattedDate: formatFriendlyDate(entry.meetingDate),
          assignmentPath: entry.assignmentPath,
          roleTitle: entry.roleTitle,
          section: entry.section,
          publisherId: entry.publisher.id,
          publisherName: entry.publisher.name,
          publisherPhone: cleanPhone,
          assistantName: entry.assistant?.name,
          room: entry.room,
          lessonNumber: entry.lessonNumber,
          timeMinutes: entry.timeMinutes,
          status: entry.status,
          isUrgent,
          whatsappMessage: msg,
        });
      }
    });
  });

  // 2. Turnos de carritos sin cubrir (próximos 7 días)
  const uncoveredCartShifts: UncoveredCartShiftReminder[] = [];
  const locationsMap = new Map<string, string>();
  cartLocations.forEach((loc) => {
    locationsMap.set(loc.id, loc.name);
  });

  cartShifts.forEach((shift) => {
    const p1 = shift.publisher1Id ? publishersMap.get(shift.publisher1Id) : null;
    const p2 = shift.publisher2Id ? publishersMap.get(shift.publisher2Id) : null;

    let vacancies = 0;
    if (!p1 && !p2) vacancies = 2;
    else if (!p1 || !p2) vacancies = 1;

    if (vacancies > 0) {
      const currentPubs: Array<{ id: string; name: string }> = [];
      if (p1) currentPubs.push({ id: p1.id, name: p1.name });
      if (p2) currentPubs.push({ id: p2.id, name: p2.name });

      const locName = locationsMap.get(shift.locationId) || 'Punto de Carritos';
      const isCritical = vacancies === 2;

      uncoveredCartShifts.push({
        id: `cart-vacant-${shift.id}`,
        shiftId: shift.id,
        locationId: shift.locationId,
        locationName: locName,
        dayOfWeek: shift.dayOfWeek || 'Día fijado',
        timeSlot: `${shift.startTime || '09:00'} - ${shift.endTime || '11:00'}`,
        date: shift.date,
        currentPublishers: currentPubs,
        vacanciesCount: vacancies,
        isCritical,
      });
    }
  });

  // 3. Informes de servicio del campo pendientes (cierre de mes)
  const pendingReports: PendingReportReminder[] = [];
  const currentDay = referenceDate.getDate();
  const currentMonthIdx = referenceDate.getMonth();
  const currentYear = referenceDate.getFullYear();

  // Calcular el mes objeto de reporte:
  // Si estamos del día 1 al 12 del mes, se reporta el mes anterior (ej. 4 de Noviembre -> se reporta Octubre)
  // Si estamos del día 24 en adelante, se reporta el mes en curso
  let targetYear = currentYear;
  let targetMonthIdx = currentMonthIdx;

  if (currentDay <= 12) {
    targetMonthIdx = currentMonthIdx - 1;
    if (targetMonthIdx < 0) {
      targetMonthIdx = 11;
      targetYear -= 1;
    }
  }

  const targetMonthStr = `${targetYear}-${String(targetMonthIdx + 1).padStart(2, '0')}`;
  const targetMonthName = `${MONTH_NAMES_ES[targetMonthIdx]} ${targetYear}`;

  // Solo alertar si estamos en el período activo de recolección (día 25 a fin de mes, o día 1 al 12)
  const isReportCollectionWindow = currentDay >= 24 || currentDay <= 12;

  if (isReportCollectionWindow) {
    const reportedPubIds = new Set<string>();
    monthlyReports.forEach((rep) => {
      if (rep.month === targetMonthStr) {
        reportedPubIds.add(rep.publisherId);
      }
    });

    publishers.forEach((pub) => {
      const isDeleted = pub.status === 'deleted';
      const isActive = pub.status === 'active' || (pub.active && !isDeleted);
      if (isActive && !isDeleted) {
        if (!reportedPubIds.has(pub.id)) {
          const cleanPhone = getCleanPublisherPhone(pub.phone);
          const msg = createReportReminderWhatsAppMessage(pub, targetMonthName, congName);
          pendingReports.push({
            publisherId: pub.id,
            publisherName: pub.name,
            publisherPhone: cleanPhone,
            reportMonth: targetMonthStr,
            reportMonthName: targetMonthName,
            whatsappMessage: msg,
          });
        }
      }
    });
  }

  // 4. Comprobantes de cuentas por verificar (S-26)
  const targetAccountingMonthStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;
  const pendingAccountsCount = transactions.filter(
    (t) =>
      t.date &&
      t.date.startsWith(targetAccountingMonthStr) &&
      t.type === 'gasto' &&
      !t.verified
  ).length;

  const totalAttentionCount =
    unconfirmedAssignments.length +
    uncoveredCartShifts.length +
    pendingReports.length +
    (pendingAccountsCount > 0 ? 1 : 0);

  const hasUrgentItems =
    unconfirmedAssignments.some((a) => a.isUrgent) ||
    uncoveredCartShifts.some((c) => c.isCritical);

  return {
    unconfirmedAssignments,
    uncoveredCartShifts,
    pendingReports,
    pendingAccountsCount,
    totalAttentionCount,
    hasUrgentItems,
  };
}
