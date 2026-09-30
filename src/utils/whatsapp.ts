// src/utils/whatsapp.ts
import { Publisher, WeekSchedule, AssignmentStatus } from '../types';

export interface WeeklyAssignmentEntry {
  id: string;
  weekId: string;
  meetingType: 'midweek' | 'weekend';
  meetingDate: string;
  assignmentPath: string;
  roleTitle: string;
  section: string;
  publisher: Publisher;
  assistant?: Publisher;
  room?: 'principal' | 'auxiliar';
  timeMinutes?: number;
  lessonNumber?: number;
  status: AssignmentStatus;
}

export function generateConfirmationUrl(
  weekId: string,
  meetingType: 'midweek' | 'weekend',
  assignmentPath: string,
  publisherId: string
): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?confirmar=1&semana=${encodeURIComponent(weekId)}&tipo=${encodeURIComponent(meetingType)}&path=${encodeURIComponent(assignmentPath)}&pub=${encodeURIComponent(publisherId)}`;
}

export function createAssignmentWhatsAppMessage(
  publisher: Publisher,
  week: WeekSchedule,
  roleName: string,
  meetingType: 'midweek' | 'weekend',
  meetingDate: string,
  options?: {
    isReminder?: boolean;
    assistantName?: string;
    room?: 'principal' | 'auxiliar';
    timeMinutes?: number;
    lessonNumber?: number;
    lessonTitle?: string;
    congregationName?: string;
    assignmentPath?: string;
    confirmationUrl?: string;
  }
): string {
  const honorific = publisher.gender === 'hermana' ? 'hermana' : 'hermano';
  const meetingName = meetingType === 'midweek' ? 'Reunión Vida y Ministerio Cristianos' : 'Reunión del Fin de Semana';
  const cong = options?.congregationName || 'la congregación';

  let dateFormatted = meetingDate;
  try {
    const parts = meetingDate.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      dateFormatted = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
  } catch {
    // fallback
  }

  const directUrl =
    options?.confirmationUrl ||
    (options?.assignmentPath
      ? generateConfirmationUrl(week.id, meetingType, options.assignmentPath, publisher.id)
      : '');

  if (options?.isReminder) {
    let msg = `👋 *Recordatorio de Asignación*\n\n`;
    msg += `Estimado(a) ${honorific} *${publisher.name}*,\n\n`;
    msg += `Te recordamos con cariño tu participación para la próxima *${meetingName}* de ${cong}:\n\n`;
    msg += `📅 *Fecha:* ${dateFormatted}\n`;
    msg += `📌 *Asignación:* ${roleName}\n`;
    if (options.room) {
      msg += `🏛 *Sala:* ${options.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}\n`;
    }
    if (options.assistantName) {
      msg += `👥 *Ayudante:* ${options.assistantName}\n`;
    }
    if (options.lessonNumber) {
      msg += `📖 *Lección:* #${options.lessonNumber}${options.lessonTitle ? ` - ${options.lessonTitle}` : ''}\n`;
    }
    if (options.timeMinutes) {
      msg += `⏱ *Tiempo:* ${options.timeMinutes} minutos\n`;
    }

    if (directUrl) {
      msg += `\n📲 *Confirmar o pedir reemplazo en 1 clic:*\n${directUrl}\n`;
    }

    msg += `\nSi tienes algún inconveniente, por favor avísanos con tiempo. ¡Que Jehová bendiga tu preparación! 🙏`;
    return msg;
  }

  let msg = `✨ *Asignación de Reunión*\n\n`;
  msg += `Apreciado(a) ${honorific} *${publisher.name}*,\n\n`;
  msg += `Te compartimos con gusto tu asignación para la *${meetingName}* de ${cong}:\n\n`;
  msg += `📅 *Fecha:* ${dateFormatted}\n`;
  msg += `📌 *Asignación:* ${roleName}\n`;
  if (options?.room) {
    msg += `🏛 *Sala:* ${options.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}\n`;
  }
  if (options?.assistantName) {
    msg += `👥 *Ayudante:* ${options.assistantName}\n`;
  }
  if (options?.lessonNumber) {
    msg += `📖 *Lección:* #${options.lessonNumber}${options.lessonTitle ? ` - ${options.lessonTitle}` : ''}\n`;
  }
  if (options?.timeMinutes) {
    msg += `⏱ *Tiempo:* ${options.timeMinutes} minutos\n`;
  }

  if (directUrl) {
    msg += `\n📲 *Por favor confirma tu asignación aquí:*\n${directUrl}\n`;
  } else {
    msg += `\nPor favor, responde a este mensaje para confirmar tu participación. ✨\n`;
  }

  msg += `\nMuchas gracias por tu valiosa colaboración.`;
  return msg;
}

export function openWhatsAppLink(phone: string, text: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
  window.open(url, '_blank');
}

export function extractWeekAssignments(
  week: WeekSchedule,
  publishersMap: Map<string, Publisher>
): WeeklyAssignmentEntry[] {
  const list: WeeklyAssignmentEntry[] = [];
  const midweekDate = week.midweek.date || week.weekStartDate;
  const weekendDate = week.weekend.date || week.weekEndDate;

  // 1. MIDWEEK
  // Presidente
  if (week.midweek.presidentId && publishersMap.has(week.midweek.presidentId)) {
    list.push({
      id: `${week.id}-midweek-president`,
      weekId: week.id,
      meetingType: 'midweek',
      meetingDate: midweekDate,
      assignmentPath: 'presidentId',
      roleTitle: 'Presidente de la Reunión',
      section: 'Presidencia',
      publisher: publishersMap.get(week.midweek.presidentId)!,
      status: 'confirmada',
    });
  }

  // Oración inicial
  if (week.midweek.initialPrayerId && publishersMap.has(week.midweek.initialPrayerId)) {
    list.push({
      id: `${week.id}-midweek-init-prayer`,
      weekId: week.id,
      meetingType: 'midweek',
      meetingDate: midweekDate,
      assignmentPath: 'initialPrayerId',
      roleTitle: 'Oración Inicial',
      section: 'Presidencia',
      publisher: publishersMap.get(week.midweek.initialPrayerId)!,
      status: 'confirmada',
    });
  }

  // Oración final
  if (week.midweek.finalPrayerId && publishersMap.has(week.midweek.finalPrayerId)) {
    list.push({
      id: `${week.id}-midweek-final-prayer`,
      weekId: week.id,
      meetingType: 'midweek',
      meetingDate: midweekDate,
      assignmentPath: 'finalPrayerId',
      roleTitle: 'Oración Final',
      section: 'Presidencia',
      publisher: publishersMap.get(week.midweek.finalPrayerId)!,
      status: 'confirmada',
    });
  }

  // Tesoros: Discurso
  const tesDiscurso = week.midweek.tesoros.discurso;
  if (tesDiscurso?.publisherId && publishersMap.has(tesDiscurso.publisherId)) {
    list.push({
      id: `${week.id}-tes-discurso`,
      weekId: week.id,
      meetingType: 'midweek',
      meetingDate: midweekDate,
      assignmentPath: 'tesoros.discurso',
      roleTitle: tesDiscurso.title || 'Discurso de Tesoros (10 min)',
      section: 'Tesoros de la Biblia',
      publisher: publishersMap.get(tesDiscurso.publisherId)!,
      timeMinutes: 10,
      status: tesDiscurso.status || 'pendiente',
    });
  }

  // Tesoros: Perlas
  const tesPerlas = week.midweek.tesoros.perlas;
  if (tesPerlas?.publisherId && publishersMap.has(tesPerlas.publisherId)) {
    list.push({
      id: `${week.id}-tes-perlas`,
      weekId: week.id,
      meetingType: 'midweek',
      meetingDate: midweekDate,
      assignmentPath: 'tesoros.perlas',
      roleTitle: tesPerlas.title || 'Busquemos Perlas Escondidas (10 min)',
      section: 'Tesoros de la Biblia',
      publisher: publishersMap.get(tesPerlas.publisherId)!,
      timeMinutes: 10,
      status: tesPerlas.status || 'pendiente',
    });
  }

  // Tesoros: Lectura de la Biblia
  const tesLectura = week.midweek.tesoros.lecturaBiblia;
  if (tesLectura?.publisherId && publishersMap.has(tesLectura.publisherId)) {
    list.push({
      id: `${week.id}-tes-lectura`,
      weekId: week.id,
      meetingType: 'midweek',
      meetingDate: midweekDate,
      assignmentPath: 'tesoros.lecturaBiblia',
      roleTitle: tesLectura.title || 'Lectura de la Biblia',
      section: 'Tesoros de la Biblia',
      publisher: publishersMap.get(tesLectura.publisherId)!,
      timeMinutes: 4,
      room: tesLectura.room || 'principal',
      lessonNumber: tesLectura.lessonNumber,
      status: tesLectura.status || 'pendiente',
    });
  }

  // Maestros: Demostraciones
  week.midweek.maestros.items.forEach((item, idx) => {
    if (item.publisherId && publishersMap.has(item.publisherId)) {
      list.push({
        id: `${week.id}-maestros-${idx}`,
        weekId: week.id,
        meetingType: 'midweek',
        meetingDate: midweekDate,
        assignmentPath: `maestros.${idx}`,
        roleTitle: item.title || `Seamos Mejores Maestros #${idx + 1}`,
        section: 'Seamos Mejores Maestros',
        publisher: publishersMap.get(item.publisherId)!,
        assistant: item.assistantId ? publishersMap.get(item.assistantId) : undefined,
        timeMinutes: item.timeMinutes || 4,
        room: item.room || 'principal',
        lessonNumber: item.lessonNumber,
        status: item.status || 'pendiente',
      });
    }
  });

  // Vida Cristiana
  week.midweek.vidaCristiana.items.forEach((item, idx) => {
    if (item.publisherId && publishersMap.has(item.publisherId)) {
      list.push({
        id: `${week.id}-vida-${idx}`,
        weekId: week.id,
        meetingType: 'midweek',
        meetingDate: midweekDate,
        assignmentPath: `vida.${idx}`,
        roleTitle: item.title || `Nuestra Vida Cristiana #${idx + 1}`,
        section: 'Nuestra Vida Cristiana',
        publisher: publishersMap.get(item.publisherId)!,
        timeMinutes: item.timeMinutes || 15,
        status: item.status || 'pendiente',
      });
    }
  });

  // Estudio Bíblico de la Congregación
  const ebc = week.midweek.vidaCristiana.estudioBiblico;
  if (ebc.conductorId && publishersMap.has(ebc.conductorId)) {
    list.push({
      id: `${week.id}-ebc-conductor`,
      weekId: week.id,
      meetingType: 'midweek',
      meetingDate: midweekDate,
      assignmentPath: 'vidaCristiana.estudioBiblico.conductorId',
      roleTitle: 'Conductor del Estudio Bíblico de la Congregación',
      section: 'Nuestra Vida Cristiana',
      publisher: publishersMap.get(ebc.conductorId)!,
      timeMinutes: 30,
      status: 'confirmada',
    });
  }
  if (ebc.lectorId && publishersMap.has(ebc.lectorId)) {
    list.push({
      id: `${week.id}-ebc-lector`,
      weekId: week.id,
      meetingType: 'midweek',
      meetingDate: midweekDate,
      assignmentPath: 'vidaCristiana.estudioBiblico.lectorId',
      roleTitle: 'Lector del Estudio Bíblico de la Congregación',
      section: 'Nuestra Vida Cristiana',
      publisher: publishersMap.get(ebc.lectorId)!,
      timeMinutes: 30,
      status: 'confirmada',
    });
  }

  // Deberes entre semana
  Object.entries(week.midweek.duties).forEach(([dutyKey, ids]) => {
    ids.forEach((pubId, dIdx) => {
      if (publishersMap.has(pubId)) {
        list.push({
          id: `${week.id}-midweek-duty-${dutyKey}-${dIdx}`,
          weekId: week.id,
          meetingType: 'midweek',
          meetingDate: midweekDate,
          assignmentPath: `duties.${dutyKey}.${dIdx}`,
          roleTitle: `Deber: ${dutyKey.toUpperCase().replace('_', ' ')}`,
          section: 'Deberes del Salón',
          publisher: publishersMap.get(pubId)!,
          status: 'confirmada',
        });
      }
    });
  });

  // 2. WEEKEND
  // Presidente fin de semana
  if (week.weekend.presidentId && publishersMap.has(week.weekend.presidentId)) {
    list.push({
      id: `${week.id}-weekend-president`,
      weekId: week.id,
      meetingType: 'weekend',
      meetingDate: weekendDate,
      assignmentPath: 'presidentId',
      roleTitle: 'Presidente del Fin de Semana',
      section: 'Fin de Semana',
      publisher: publishersMap.get(week.weekend.presidentId)!,
      status: 'confirmada',
    });
  }

  // Orador local (si no es visitante)
  if (!week.weekend.isVisitingSpeaker && week.weekend.publicTalkSpeaker && publishersMap.has(week.weekend.publicTalkSpeaker)) {
    list.push({
      id: `${week.id}-weekend-speaker`,
      weekId: week.id,
      meetingType: 'weekend',
      meetingDate: weekendDate,
      assignmentPath: 'publicTalkSpeaker',
      roleTitle: `Discurso Público: #${week.weekend.publicTalkOutlineNumber || ''} ${week.weekend.publicTalkTheme || ''}`,
      section: 'Fin de Semana',
      publisher: publishersMap.get(week.weekend.publicTalkSpeaker)!,
      timeMinutes: 30,
      status: 'confirmada',
    });
  }

  // Conductor La Atalaya
  if (week.weekend.atalayaConductorId && publishersMap.has(week.weekend.atalayaConductorId)) {
    list.push({
      id: `${week.id}-weekend-atalaya-cond`,
      weekId: week.id,
      meetingType: 'weekend',
      meetingDate: weekendDate,
      assignmentPath: 'atalayaConductorId',
      roleTitle: 'Conductor del Estudio de La Atalaya',
      section: 'Fin de Semana',
      publisher: publishersMap.get(week.weekend.atalayaConductorId)!,
      timeMinutes: 60,
      status: 'confirmada',
    });
  }

  // Lector La Atalaya
  if (week.weekend.atalayaLectorId && publishersMap.has(week.weekend.atalayaLectorId)) {
    list.push({
      id: `${week.id}-weekend-atalaya-lec`,
      weekId: week.id,
      meetingType: 'weekend',
      meetingDate: weekendDate,
      assignmentPath: 'atalayaLectorId',
      roleTitle: 'Lector del Estudio de La Atalaya',
      section: 'Fin de Semana',
      publisher: publishersMap.get(week.weekend.atalayaLectorId)!,
      timeMinutes: 60,
      status: 'confirmada',
    });
  }

  // Oraciones fin de semana
  if (week.weekend.initialPrayerId && publishersMap.has(week.weekend.initialPrayerId)) {
    list.push({
      id: `${week.id}-weekend-init-prayer`,
      weekId: week.id,
      meetingType: 'weekend',
      meetingDate: weekendDate,
      assignmentPath: 'initialPrayerId',
      roleTitle: 'Oración de Inicio (Fin de Semana)',
      section: 'Fin de Semana',
      publisher: publishersMap.get(week.weekend.initialPrayerId)!,
      status: 'confirmada',
    });
  }

  if (week.weekend.finalPrayerId && publishersMap.has(week.weekend.finalPrayerId)) {
    list.push({
      id: `${week.id}-weekend-final-prayer`,
      weekId: week.id,
      meetingType: 'weekend',
      meetingDate: weekendDate,
      assignmentPath: 'finalPrayerId',
      roleTitle: 'Oración Final (Fin de Semana)',
      section: 'Fin de Semana',
      publisher: publishersMap.get(week.weekend.finalPrayerId)!,
      status: 'confirmada',
    });
  }

  // Deberes fin de semana
  Object.entries(week.weekend.duties).forEach(([dutyKey, ids]) => {
    ids.forEach((pubId, dIdx) => {
      if (publishersMap.has(pubId)) {
        list.push({
          id: `${week.id}-weekend-duty-${dutyKey}-${dIdx}`,
          weekId: week.id,
          meetingType: 'weekend',
          meetingDate: weekendDate,
          assignmentPath: `duties.${dutyKey}.${dIdx}`,
          roleTitle: `Deber (FDS): ${dutyKey.toUpperCase().replace('_', ' ')}`,
          section: 'Deberes del Salón',
          publisher: publishersMap.get(pubId)!,
          status: 'confirmada',
        });
      }
    });
  });

  return list;
}
