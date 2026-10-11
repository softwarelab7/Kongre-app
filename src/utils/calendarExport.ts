// src/utils/calendarExport.ts
import { WeekSchedule, Publisher, CongregationSettings } from '../types';

function formatToIcsDateTime(dateStr: string, timeStr: string): string {
  // dateStr: YYYY-MM-DD, timeStr: HH:MM
  const cleanDate = dateStr.replace(/-/g, '');
  const cleanTime = timeStr.replace(/:/g, '') + '00';
  return `${cleanDate}T${cleanTime}`;
}

function addMinutesToDateTime(dateStr: string, timeStr: string, minutes: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh, mm);
  dt.setMinutes(dt.getMinutes() + minutes);

  const pad = (n: number) => String(n).padStart(2, '0');
  const resDate = `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}`;
  const resTime = `${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
  return `${resDate}T${resTime}`;
}

export function generateGoogleCalendarUrl(
  title: string,
  description: string,
  location: string,
  dateStr: string,
  timeStr: string,
  durationMinutes: number = 105 // Default meeting duration 1h 45m
): string {
  const start = formatToIcsDateTime(dateStr, timeStr);
  const end = addMinutesToDateTime(dateStr, timeStr, durationMinutes);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: description,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadSingleIcsEvent(
  title: string,
  description: string,
  location: string,
  dateStr: string,
  timeStr: string,
  durationMinutes: number = 105
) {
  const start = formatToIcsDateTime(dateStr, timeStr);
  const end = addMinutesToDateTime(dateStr, timeStr, durationMinutes);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gestor Teocratico//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:asig-${Date.now()}@gestorteocratico.org`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title.replace(/[\r\n]+/g, ' ')}`,
    `DESCRIPTION:${description.replace(/[\r\n]+/g, '\\n')}`,
    `LOCATION:${location.replace(/[\r\n]+/g, ' ')}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de Asignación Teocrática (Mañana)',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Asignacion_${dateStr}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadMonthIcsSchedule(
  weeks: WeekSchedule[],
  publishersMap: Map<string, Publisher>,
  settings: CongregationSettings
) {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const events: string[] = [];

  weeks.forEach(w => {
    // 1. Midweek Meeting
    if (!w.specialEvent?.noMeetingMidweek) {
      const start = formatToIcsDateTime(w.midweek.date, settings.midweekMeetingTime || '19:30');
      const end = addMinutesToDateTime(w.midweek.date, settings.midweekMeetingTime || '19:30', 105);

      const pres = publishersMap.get(w.midweek.presidentId || '')?.name || '---';
      const disc = publishersMap.get(w.midweek.tesoros.discurso.publisherId || '')?.name || '---';
      const audioVideo = Array.from(new Set([...(w.midweek.duties.deber_audio || []), ...(w.midweek.duties.deber_video || [])])).map(id => publishersMap.get(id)?.name).filter(Boolean).join(', ') || '---';

      const desc = `Reunión Vida y Ministerio Cristianos\\nPresidente: ${pres}\\nDiscurso: ${w.midweek.tesoros.discurso.title} (${disc})\\nAudio y Video: ${audioVideo}`;

      events.push([
        'BEGIN:VEVENT',
        `UID:mid-${w.id}@gestorteocratico.org`,
        `DTSTAMP:${now}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:Reunión Vida y Ministerio - ${settings.congregationName}`,
        `DESCRIPTION:${desc}`,
        `LOCATION:${settings.hallAddress || 'Salón del Reino'}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      ].join('\r\n'));
    }

    // 2. Weekend Meeting
    if (!w.specialEvent?.noMeetingWeekend) {
      const start = formatToIcsDateTime(w.weekend.date, settings.weekendMeetingTime || '10:00');
      const end = addMinutesToDateTime(w.weekend.date, settings.weekendMeetingTime || '10:00', 105);

      const pres = publishersMap.get(w.weekend.presidentId || '')?.name || '---';
      const atalaya = publishersMap.get(w.weekend.atalayaConductorId || '')?.name || '---';
      const desc = `Reunión Fin de Semana\\nPresidente: ${pres}\\nDiscurso Público: ${w.weekend.publicTalkSpeaker || '---'} - ${w.weekend.publicTalkTheme || ''}\\nEstudio Atalaya: ${atalaya}`;

      events.push([
        'BEGIN:VEVENT',
        `UID:fds-${w.id}@gestorteocratico.org`,
        `DTSTAMP:${now}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:Reunión Fin de Semana - ${settings.congregationName}`,
        `DESCRIPTION:${desc}`,
        `LOCATION:${settings.hallAddress || 'Salón del Reino'}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      ].join('\r\n'));
    }
  });

  const icsFull = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gestor Teocratico//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Programa ${settings.congregationName}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsFull], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Calendario_Congregacion_${settings.congregationName.replace(/\s+/g, '_')}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}
