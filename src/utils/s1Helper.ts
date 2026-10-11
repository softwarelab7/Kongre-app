// src/utils/s1Helper.ts
import {
  Publisher,
  MonthlyServiceReport,
  WeekSchedule,
  AuxPioneerRequest,
  CongregationSettings,
  BranchReportS1,
} from '../types';
import { MONTH_NAMES_ES, getCurrentServiceYear } from './s21Helper';

export interface S1MeetingSession {
  weekId: string;
  startDate: string;
  midweekDate?: string;
  midweekInPerson: number;
  midweekZoom: number;
  midweekTotal: number;
  weekendDate?: string;
  weekendInPerson: number;
  weekendZoom: number;
  weekendTotal: number;
}

export interface S1PublisherBreakdown {
  id: string;
  name: string;
  groupNumber?: number;
  privilege?: string;
  participated: boolean;
  hours?: number;
  bibleStudies: number;
  isAuxiliaryPioneer?: boolean;
  phone?: string;
}

export interface S1CalculatedMetrics {
  monthKey: string; // 'YYYY-MM'
  monthNumber: number; // 1-12
  year: number;
  monthNameFull: string;
  serviceYear: string;

  // Header / Congregation details
  congregationName: string;
  congregationNumber: string;
  circuitNumber: string;
  coordinatorName: string;

  // S-88 Meeting Attendance
  midweekMeetingsCount: number;
  midweekTotalAttendance: number;
  midweekAverage: number;
  midweekInPersonAvg: number;
  midweekZoomAvg: number;

  weekendMeetingsCount: number;
  weekendTotalAttendance: number;
  weekendAverage: number;
  weekendInPersonAvg: number;
  weekendZoomAvg: number;

  totalMeetingsHeld: number;
  totalAttendanceCumulative: number;
  combinedAverage: number;
  highestAttendance: number;
  meetingSessions: S1MeetingSession[];

  // Field Service Activity (S-4 / S-1)
  totalActivePublishers: number;
  totalPublishersReporting: number;
  completionPercentage: number;

  regularPublishersCount: number;
  regularPublishersReporting: number;
  regularPublishersHours: number;
  regularPublishersStudies: number;

  auxPioneersCount: number;
  auxPioneersReporting: number;
  auxPioneerHours: number;
  auxPioneerAvgHours: number;
  auxPioneerTarget30: number;
  auxPioneerTarget15: number;
  auxPioneerStudies: number;
  auxPioneerList: S1PublisherBreakdown[];

  pioneersCount: number;
  pioneersReporting: number;
  pioneerHours: number;
  pioneerAvgHours: number;
  pioneerStudies: number;
  pioneerList: S1PublisherBreakdown[];

  specialPioneersCount: number;
  specialPioneersReporting: number;
  specialPioneerHours: number;
  specialPioneerStudies: number;

  totalCongregationHours: number;
  totalBibleStudies: number;

  missingPublishers: Publisher[];
  submissionStatus: 'pendiente' | 'enviado';
  submissionDetails?: {
    submittedAt?: string;
    submittedBy?: string;
    confirmationNumber?: string;
    notes?: string;
  };
}

/**
 * Computes all figures and averages for the official Branch Monthly Report S-1.
 */
export function calculateS1Metrics(
  monthKey: string,
  weeks: WeekSchedule[],
  publishers: Publisher[],
  monthlyReports: MonthlyServiceReport[],
  auxPioneerRequests: AuxPioneerRequest[],
  settings: CongregationSettings,
  s1Record?: BranchReportS1
): S1CalculatedMetrics {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const monthNumber = parseInt(monthStr, 10); // 1-12
  const monthNameFull = MONTH_NAMES_ES[monthNumber]?.full || `Mes ${monthNumber}`;

  // 1. Asistencia a Reuniones (S-88)
  const monthWeeks = weeks.filter((w) => w.weekStartDate.startsWith(monthKey));

  let midweekMeetingsCount = 0;
  let midweekTotalAttendance = 0;
  let midweekInPersonTotal = 0;
  let midweekZoomTotal = 0;

  let weekendMeetingsCount = 0;
  let weekendTotalAttendance = 0;
  let weekendInPersonTotal = 0;
  let weekendZoomTotal = 0;

  let highestAttendance = 0;
  const meetingSessions: S1MeetingSession[] = [];

  monthWeeks.forEach((w) => {
    const att = w.attendance;
    const session: S1MeetingSession = {
      weekId: w.id,
      startDate: w.weekStartDate,
      midweekInPerson: att?.midweek?.inPerson || 0,
      midweekZoom: att?.midweek?.zoom || 0,
      midweekTotal: att?.midweek?.total || 0,
      weekendInPerson: att?.weekend?.inPerson || 0,
      weekendZoom: att?.weekend?.zoom || 0,
      weekendTotal: att?.weekend?.total || 0,
    };
    meetingSessions.push(session);

    if (att) {
      if (att.midweek && att.midweek.total > 0) {
        midweekMeetingsCount++;
        midweekTotalAttendance += att.midweek.total;
        midweekInPersonTotal += att.midweek.inPerson || 0;
        midweekZoomTotal += att.midweek.zoom || 0;
        if (att.midweek.total > highestAttendance) highestAttendance = att.midweek.total;
      }

      if (att.weekend && att.weekend.total > 0) {
        weekendMeetingsCount++;
        weekendTotalAttendance += att.weekend.total;
        weekendInPersonTotal += att.weekend.inPerson || 0;
        weekendZoomTotal += att.weekend.zoom || 0;
        if (att.weekend.total > highestAttendance) highestAttendance = att.weekend.total;
      }
    }
  });

  // Apply manual overrides if any
  const overrides = s1Record?.manualOverrides;
  if (overrides?.midweekMeetingsCount !== undefined) {
    midweekMeetingsCount = overrides.midweekMeetingsCount;
  }
  if (overrides?.midweekTotalAttendance !== undefined) {
    midweekTotalAttendance = overrides.midweekTotalAttendance;
  }
  if (overrides?.weekendMeetingsCount !== undefined) {
    weekendMeetingsCount = overrides.weekendMeetingsCount;
  }
  if (overrides?.weekendTotalAttendance !== undefined) {
    weekendTotalAttendance = overrides.weekendTotalAttendance;
  }

  const midweekAverage = midweekMeetingsCount > 0 ? Math.round(midweekTotalAttendance / midweekMeetingsCount) : 0;
  const midweekInPersonAvg = midweekMeetingsCount > 0 ? Math.round(midweekInPersonTotal / midweekMeetingsCount) : 0;
  const midweekZoomAvg = midweekMeetingsCount > 0 ? Math.round(midweekZoomTotal / midweekMeetingsCount) : 0;

  const weekendAverage = weekendMeetingsCount > 0 ? Math.round(weekendTotalAttendance / weekendMeetingsCount) : 0;
  const weekendInPersonAvg = weekendMeetingsCount > 0 ? Math.round(weekendInPersonTotal / weekendMeetingsCount) : 0;
  const weekendZoomAvg = weekendMeetingsCount > 0 ? Math.round(weekendZoomTotal / weekendMeetingsCount) : 0;

  const totalMeetingsHeld = midweekMeetingsCount + weekendMeetingsCount;
  const totalAttendanceCumulative = midweekTotalAttendance + weekendTotalAttendance;
  const combinedAverage = totalMeetingsHeld > 0 ? Math.round(totalAttendanceCumulative / totalMeetingsHeld) : 0;

  // 2. Actividad de Predicación (S-4 / S-1)
  const activePublishers = publishers.filter((p) => p.active);
  const reportsForMonth = monthlyReports.filter((r) => r.month === monthKey);
  const reportsMap = new Map<string, MonthlyServiceReport>();
  reportsForMonth.forEach((r) => reportsMap.set(r.publisherId, r));

  // Approved Aux Pioneer IDs for this month (month index 0-11, monthNumber 1-12)
  const approvedAuxRequests = auxPioneerRequests.filter(
    (req) =>
      (req.status === 'aprobada' || req.estado === 'aprobada') &&
      (req.year === year || req.anio === year) &&
      (req.month === monthNumber - 1 || req.mes === monthNumber - 1 || req.month === monthNumber || req.mes === monthNumber)
  );
  const approvedAuxPubIdSet = new Set<string>(approvedAuxRequests.map((r) => r.publisherId));

  let regularPublishersCount = 0;
  let regularPublishersReporting = 0;
  let regularPublishersHours = 0;
  let regularPublishersStudies = 0;

  let pioneersCount = 0;
  let pioneersReporting = 0;
  let pioneerHours = 0;
  let pioneerStudies = 0;
  const pioneerList: S1PublisherBreakdown[] = [];

  let specialPioneersCount = 0;
  let specialPioneersReporting = 0;
  let specialPioneerHours = 0;
  let specialPioneerStudies = 0;

  let auxPioneersReporting = 0;
  let auxPioneerHours = 0;
  let auxPioneerStudies = 0;
  let auxPioneerTarget30 = 0;
  let auxPioneerTarget15 = 0;
  const auxPioneerList: S1PublisherBreakdown[] = [];

  const missingPublishers: Publisher[] = [];

  activePublishers.forEach((pub) => {
    const rep = reportsMap.get(pub.id);
    const hasReport = !!rep && rep.participated;

    const isRegularPioneer = pub.privilege === 'precursor_regular';
    const isSpecialPioneer = pub.privilege === 'precursor_especial';
    const isAuxPioneer = approvedAuxPubIdSet.has(pub.id) || rep?.isAuxiliaryPioneer === true;

    if (isRegularPioneer) {
      pioneersCount++;
      if (hasReport) {
        pioneersReporting++;
        const hrs = rep?.hours || 0;
        pioneerHours += hrs;
        pioneerStudies += rep?.bibleStudies || 0;
        pioneerList.push({
          id: pub.id,
          name: pub.name,
          groupNumber: pub.groupNumber,
          privilege: 'Precursor Regular',
          participated: true,
          hours: hrs,
          bibleStudies: rep?.bibleStudies || 0,
          phone: pub.phone,
        });
      } else {
        missingPublishers.push(pub);
      }
    } else if (isSpecialPioneer) {
      specialPioneersCount++;
      if (hasReport) {
        specialPioneersReporting++;
        const hrs = rep?.hours || 0;
        specialPioneerHours += hrs;
        specialPioneerStudies += rep?.bibleStudies || 0;
      } else {
        missingPublishers.push(pub);
      }
    } else if (isAuxPioneer) {
      if (hasReport) {
        auxPioneersReporting++;
        const hrs = rep?.hours || 0;
        auxPioneerHours += hrs;
        auxPioneerStudies += rep?.bibleStudies || 0;

        const req = approvedAuxRequests.find((r) => r.publisherId === pub.id);
        const target = req?.targetHours || req?.meta_horas || (hrs >= 30 ? 30 : 15);
        if (target === 30) auxPioneerTarget30++;
        else auxPioneerTarget15++;

        auxPioneerList.push({
          id: pub.id,
          name: pub.name,
          groupNumber: pub.groupNumber,
          privilege: 'Precursor Auxiliar',
          participated: true,
          hours: hrs,
          bibleStudies: rep?.bibleStudies || 0,
          isAuxiliaryPioneer: true,
          phone: pub.phone,
        });
      } else {
        missingPublishers.push(pub);
      }
    } else {
      regularPublishersCount++;
      if (hasReport) {
        regularPublishersReporting++;
        regularPublishersHours += rep?.hours || 0;
        regularPublishersStudies += rep?.bibleStudies || 0;
      } else {
        missingPublishers.push(pub);
      }
    }
  });

  // Calculate auxiliary pioneers count (including all who were approved for this month)
  const auxPioneersCount = Math.max(approvedAuxRequests.length, auxPioneersReporting);

  // Apply manual overrides for preaching if any
  if (overrides?.regularPublishersReporting !== undefined) {
    regularPublishersReporting = overrides.regularPublishersReporting;
  }
  if (overrides?.auxPioneersReporting !== undefined) {
    auxPioneersReporting = overrides.auxPioneersReporting;
  }
  if (overrides?.auxPioneerHours !== undefined) {
    auxPioneerHours = overrides.auxPioneerHours;
  }
  if (overrides?.pioneersReporting !== undefined) {
    pioneersReporting = overrides.pioneersReporting;
  }
  if (overrides?.pioneerHours !== undefined) {
    pioneerHours = overrides.pioneerHours;
  }
  if (overrides?.specialPioneersReporting !== undefined) {
    specialPioneersReporting = overrides.specialPioneersReporting;
  }
  if (overrides?.specialPioneerHours !== undefined) {
    specialPioneerHours = overrides.specialPioneerHours;
  }
  if (overrides?.totalBibleStudies !== undefined) {
    regularPublishersStudies = overrides.totalBibleStudies - (auxPioneerStudies + pioneerStudies + specialPioneerStudies);
  }

  const totalPublishersReporting =
    regularPublishersReporting + auxPioneersReporting + pioneersReporting + specialPioneersReporting;
  const totalCongregationHours =
    regularPublishersHours + auxPioneerHours + pioneerHours + specialPioneerHours;
  const totalBibleStudies =
    regularPublishersStudies + auxPioneerStudies + pioneerStudies + specialPioneerStudies;

  const pioneerAvgHours = pioneersReporting > 0 ? Math.round(pioneerHours / pioneersReporting) : 0;
  const auxPioneerAvgHours = auxPioneersReporting > 0 ? Math.round(auxPioneerHours / auxPioneersReporting) : 0;
  const completionPercentage =
    activePublishers.length > 0 ? Math.round((totalPublishersReporting / activePublishers.length) * 100) : 0;

  return {
    monthKey,
    monthNumber,
    year,
    monthNameFull,
    serviceYear: getCurrentServiceYear(),

    congregationName: settings.congregationName || '',
    congregationNumber: settings.congregationNumber || '',
    circuitNumber: settings.circuitNumber || '',
    coordinatorName: settings.coordinatorName || '',

    midweekMeetingsCount,
    midweekTotalAttendance,
    midweekAverage,
    midweekInPersonAvg,
    midweekZoomAvg,

    weekendMeetingsCount,
    weekendTotalAttendance,
    weekendAverage,
    weekendInPersonAvg,
    weekendZoomAvg,

    totalMeetingsHeld,
    totalAttendanceCumulative,
    combinedAverage,
    highestAttendance,
    meetingSessions,

    totalActivePublishers: activePublishers.length,
    totalPublishersReporting,
    completionPercentage,

    regularPublishersCount,
    regularPublishersReporting,
    regularPublishersHours,
    regularPublishersStudies,

    auxPioneersCount,
    auxPioneersReporting,
    auxPioneerHours,
    auxPioneerAvgHours,
    auxPioneerTarget30,
    auxPioneerTarget15,
    auxPioneerStudies,
    auxPioneerList,

    pioneersCount,
    pioneersReporting,
    pioneerHours,
    pioneerAvgHours,
    pioneerStudies,
    pioneerList,

    specialPioneersCount,
    specialPioneersReporting,
    specialPioneerHours,
    specialPioneerStudies,

    totalCongregationHours,
    totalBibleStudies,

    missingPublishers,
    submissionStatus: s1Record?.status || 'pendiente',
    submissionDetails: {
      submittedAt: s1Record?.submittedAt,
      submittedBy: s1Record?.submittedBy,
      confirmationNumber: s1Record?.confirmationNumber,
      notes: s1Record?.notes,
    },
  };
}

/**
 * Builds a clear, formatted WhatsApp or email text message summarizing Form S-1.
 */
export function generateS1TextSummary(m: S1CalculatedMetrics): string {
  let text = `🏛️ *INFORME MENSUAL DE LA CONGREGACIÓN (FORMULARIO S-1)*\n`;
  text += `📍 *${m.congregationName}* (#${m.congregationNumber}) • Circuito: ${m.circuitNumber}\n`;
  text += `🗓️ *Mes de servicio:* ${m.monthNameFull} ${m.year} (Año teocrático ${m.serviceYear})\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  text += `📊 *1. ASISTENCIA A LAS REUNIONES (S-88)*\n`;
  text += `• Reunión Entre Semana (Vida y Ministerio):\n`;
  text += `  - Reuniones celebradas: ${m.midweekMeetingsCount}\n`;
  text += `  - Asistencia total: ${m.midweekTotalAttendance}\n`;
  text += `  - *PROMEDIO ENTRE SEMANA:* ${m.midweekAverage} (Presencial: ${m.midweekInPersonAvg} | Zoom: ${m.midweekZoomAvg})\n\n`;

  text += `• Reunión Fin de Semana (Discurso y Atalaya):\n`;
  text += `  - Reuniones celebradas: ${m.weekendMeetingsCount}\n`;
  text += `  - Asistencia total: ${m.weekendTotalAttendance}\n`;
  text += `  - *PROMEDIO FIN DE SEMANA:* ${m.weekendAverage} (Presencial: ${m.weekendInPersonAvg} | Zoom: ${m.weekendZoomAvg})\n\n`;

  text += `• *Promedio General Combinado:* ${m.combinedAverage}\n`;
  text += `• *Asistencia Máxima del Mes:* ${m.highestAttendance}\n\n`;

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🌾 *2. ACTIVIDAD EN EL MINISTERIO DEL CAMPO*\n`;
  text += `• *Publicadores Activos:* ${m.totalActivePublishers}\n`;
  text += `• *Publicadores que Informaron:* ${m.totalPublishersReporting} (${m.completionPercentage}% del total)\n\n`;

  text += `• *Publicadores Regulares:* ${m.regularPublishersReporting} informaron`;
  if (m.regularPublishersHours > 0) text += ` (${m.regularPublishersHours} hrs)`;
  text += ` • ${m.regularPublishersStudies} cursos bíblicos\n`;

  text += `• *Precursores Auxiliares:* ${m.auxPioneersReporting} informaron • ${m.auxPioneerHours} hrs (promedio: ${m.auxPioneerAvgHours} hrs/prec)`;
  if (m.auxPioneerTarget30 > 0 || m.auxPioneerTarget15 > 0) {
    text += ` [${m.auxPioneerTarget30} de 30 hrs, ${m.auxPioneerTarget15} de 15 hrs]`;
  }
  text += ` • ${m.auxPioneerStudies} cursos bíblicos\n`;

  text += `• *Precursores Regulares:* ${m.pioneersReporting} informaron • ${m.pioneerHours} hrs (promedio: ${m.pioneerAvgHours} hrs/prec) • ${m.pioneerStudies} cursos bíblicos\n`;

  if (m.specialPioneersReporting > 0) {
    text += `• *Precursores Especiales:* ${m.specialPioneersReporting} informaron • ${m.specialPioneerHours} hrs • ${m.specialPioneerStudies} cursos bíblicos\n`;
  }

  text += `\n⭐ *TOTALES CONSOLIDADOS:* \n`;
  text += `  - Horas totales de congregación: ${m.totalCongregationHours} hrs\n`;
  text += `  - Cursos bíblicos totales: ${m.totalBibleStudies}\n\n`;

  if (m.missingPublishers.length > 0) {
    text += `⚠️ *Pendientes de informe:* ${m.missingPublishers.length} publicadores\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🌐 *Estado en JW HUB:* ${m.submissionStatus === 'enviado' ? '✅ ENVIADO A LA SUCURSAL' : '⏳ PENDIENTE DE ENVÍO'}\n`;
  if (m.submissionDetails?.confirmationNumber) {
    text += `📋 *Recibo / Confirmación JW Hub:* ${m.submissionDetails.confirmationNumber}\n`;
  }
  if (m.submissionDetails?.submittedAt) {
    text += `📅 *Fecha:* ${new Date(m.submissionDetails.submittedAt).toLocaleDateString()}\n`;
  }

  return text;
}

/**
 * Safely opens JW Hub official portal for the Secretary to input the S-1 report.
 */
export function openJwHubPortal(): void {
  window.open('https://hub.jw.org', '_blank', 'noopener,noreferrer');
}
