// src/utils/dateUtils.ts
// Utilidades teocráticas para el manejo preciso de fechas y semanas de reuniones

export const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export const MONTHS_SHORT_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

export const DAYS_OF_WEEK_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const DAY_NAME_TO_OFFSET: Record<string, number> = {
  lunes: 0,
  martes: 1,
  miércoles: 2,
  miercoles: 2,
  jueves: 3,
  viernes: 4,
  sábado: 5,
  sabado: 5,
  domingo: 6,
};

/**
 * Parsea una fecha en formato ISO (YYYY-MM-DD) de forma segura sin sesgo de zona horaria (UTC shifts).
 */
export function parseISODateParts(isoDate: string): { year: number; month: number; day: number } {
  if (!isoDate) {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
  }

  const parts = isoDate.split('-');
  const year = parseInt(parts[0], 10) || new Date().getFullYear();
  const month = parseInt(parts[1], 10) || 1; // 1-12
  const day = parseInt(parts[2], 10) || 1;

  return { year, month, day };
}

/**
 * Convierte un objeto Date en formato string YYYY-MM-DD local.
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Obtiene el lunes (YYYY-MM-DD) correspondiente a una fecha dada.
 */
export function getMondayFromDate(dateInput: Date | string): string {
  let d: Date;
  if (typeof dateInput === 'string') {
    const parts = parseISODateParts(dateInput);
    d = new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0);
  } else {
    d = new Date(dateInput);
  }

  const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diff, 12, 0, 0);
  return formatDateISO(monday);
}

/**
 * Calcula el domingo correspondiente al lunes dado (Lunes + 6 días).
 */
export function getSundayFromMonday(mondayISO: string): string {
  const parts = parseISODateParts(mondayISO);
  const monday = new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return formatDateISO(sunday);
}

/**
 * Formatea un rango semanal teocrático en español natural.
 * Ejemplos:
 * - "5 al 11 de octubre de 2026"
 * - "28 de septiembre al 4 de octubre de 2026"
 * - "28 de diciembre de 2026 al 3 de enero de 2027"
 */
export function formatTheocraticWeekRange(startISO: string, endISO?: string): string {
  if (!startISO) return 'Semana de Reunión';
  const effectiveEnd = endISO || getSundayFromMonday(startISO);

  const p1 = parseISODateParts(startISO);
  const p2 = parseISODateParts(effectiveEnd);

  const month1 = MONTHS_ES[p1.month - 1] || '';
  const month2 = MONTHS_ES[p2.month - 1] || '';

  // Mismo mes y mismo año
  if (p1.year === p2.year && p1.month === p2.month) {
    return `${p1.day} al ${p2.day} de ${month1} de ${p1.year}`;
  }

  // Distinto mes, mismo año
  if (p1.year === p2.year) {
    return `${p1.day} de ${month1} al ${p2.day} de ${month2} de ${p1.year}`;
  }

  // Distinto año
  return `${p1.day} de ${month1} de ${p1.year} al ${p2.day} de ${month2} de ${p2.year}`;
}

/**
 * Versión compacta para cápsulas y botones de navegación.
 * Ejemplos:
 * - "5 – 11 oct 2026"
 * - "28 sep – 4 oct 2026"
 * - "28 dic 2026 – 3 ene 2027"
 */
export function formatTheocraticWeekRangeShort(startISO: string, endISO?: string): string {
  if (!startISO) return 'Semana';
  const effectiveEnd = endISO || getSundayFromMonday(startISO);

  const p1 = parseISODateParts(startISO);
  const p2 = parseISODateParts(effectiveEnd);

  const m1 = MONTHS_SHORT_ES[p1.month - 1] || '';
  const m2 = MONTHS_SHORT_ES[p2.month - 1] || '';

  if (p1.year === p2.year && p1.month === p2.month) {
    return `${p1.day} – ${p2.day} ${m1} ${p1.year}`;
  }

  if (p1.year === p2.year) {
    return `${p1.day} ${m1} – ${p2.day} ${m2} ${p1.year}`;
  }

  return `${p1.day} ${m1} ${p1.year} – ${p2.day} ${m2} ${p2.year}`;
}

/**
 * Formatea la fecha de una reunión en formato humano con día de la semana.
 * Ejemplos:
 * - "Domingo, 11 de octubre de 2026"
 * - "Miércoles, 7 de octubre de 2026"
 */
export function formatTheocraticMeetingDate(
  dateISO: string,
  preferredDayName?: string
): string {
  if (!dateISO) return preferredDayName || 'Reunión';
  const parts = parseISODateParts(dateISO);
  const d = new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0);

  const dayOfWeekName =
    preferredDayName && preferredDayName.trim()
      ? preferredDayName.trim()
      : DAYS_OF_WEEK_ES[d.getDay()] || '';

  const monthName = MONTHS_ES[parts.month - 1] || '';

  // Capitalizar el nombre del día
  const capitalizedDay =
    dayOfWeekName.charAt(0).toUpperCase() + dayOfWeekName.slice(1).toLowerCase();

  return `${capitalizedDay}, ${parts.day} de ${monthName} de ${parts.year}`;
}

/**
 * Calcula la fecha ISO (YYYY-MM-DD) para una reunión dentro de una semana según el día configurado.
 * Por ejemplo, si el lunes es 2026-10-05 y el día es 'Miércoles', devuelve 2026-10-07.
 */
export function getMeetingDateForWeek(
  mondayISO: string,
  dayName?: string,
  fallbackOffset: number = 2
): string {
  const parts = parseISODateParts(mondayISO);
  const monday = new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0);

  let offset = fallbackOffset;
  if (dayName) {
    const key = dayName.trim().toLowerCase();
    if (key in DAY_NAME_TO_OFFSET) {
      offset = DAY_NAME_TO_OFFSET[key];
    }
  }

  const meetingDate = new Date(monday);
  meetingDate.setDate(meetingDate.getDate() + offset);
  return formatDateISO(meetingDate);
}

/**
 * Determina si un lunes ISO corresponde a la semana en curso (hoy).
 */
export function isCurrentCalendarWeek(mondayISO: string): boolean {
  if (!mondayISO) return false;
  const currentMonday = getMondayFromDate(new Date());
  return mondayISO === currentMonday;
}

/**
 * Formatea una clave de año-mes (YYYY-MM) a texto legible.
 * Ejemplo: "2026-10" -> "Octubre de 2026"
 */
export function formatMonthYearKey(monthKey: string): string {
  if (!monthKey) return '';
  const parts = monthKey.split('-');
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const monthName = MONTHS_ES[monthNum - 1] || '';
  const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capMonth} de ${year}`;
}
