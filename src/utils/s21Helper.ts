// src/utils/s21Helper.ts
import { Publisher, MonthlyServiceReport, S21MonthRecord, S21ServiceYearCard } from '../types';

export const MONTH_NAMES_ES: Record<number, { full: string; short: string }> = {
  1: { full: 'Enero', short: 'Ene' },
  2: { full: 'Febrero', short: 'Feb' },
  3: { full: 'Marzo', short: 'Mar' },
  4: { full: 'Abril', short: 'Abr' },
  5: { full: 'Mayo', short: 'May' },
  6: { full: 'Junio', short: 'Jun' },
  7: { full: 'Julio', short: 'Jul' },
  8: { full: 'Agosto', short: 'Ago' },
  9: { full: 'Septiembre', short: 'Sep' },
  10: { full: 'Octubre', short: 'Oct' },
  11: { full: 'Noviembre', short: 'Nov' },
  12: { full: 'Diciembre', short: 'Dic' },
};

/**
 * Returns the current theocratic service year (e.g. '2025-2026' or '2026-2027').
 * In theocratic calendar, service year starts September 1 and ends August 31.
 */
export function getCurrentServiceYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  if (month >= 9) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Returns an array of available service years for selection (e.g. ['2026-2027', '2025-2026', '2024-2025']).
 */
export function getAvailableServiceYears(): string[] {
  const current = getCurrentServiceYear();
  const [startYear] = current.split('-').map(Number);
  return [
    `${startYear + 1}-${startYear + 2}`,
    `${startYear}-${startYear + 1}`,
    `${startYear - 1}-${startYear}`,
    `${startYear - 2}-${startYear - 1}`,
  ];
}

/**
 * Returns the 12 month keys ('YYYY-MM') that comprise a given theocratic service year,
 * ordered from September of startYear to August of endYear.
 */
export function getServiceYearMonths(serviceYear: string): Array<{
  monthKey: string;
  monthName: string;
  monthShort: string;
  year: number;
  monthNumber: number;
}> {
  const [startStr, endStr] = serviceYear.split('-');
  const startYear = parseInt(startStr, 10);
  const endYear = parseInt(endStr, 10);

  const months = [
    // Year 1: Sep to Dec
    { monthNumber: 9, year: startYear },
    { monthNumber: 10, year: startYear },
    { monthNumber: 11, year: startYear },
    { monthNumber: 12, year: startYear },
    // Year 2: Jan to Aug
    { monthNumber: 1, year: endYear },
    { monthNumber: 2, year: endYear },
    { monthNumber: 3, year: endYear },
    { monthNumber: 4, year: endYear },
    { monthNumber: 5, year: endYear },
    { monthNumber: 6, year: endYear },
    { monthNumber: 7, year: endYear },
    { monthNumber: 8, year: endYear },
  ];

  return months.map((m) => {
    const monthKey = `${m.year}-${String(m.monthNumber).padStart(2, '0')}`;
    const nameData = MONTH_NAMES_ES[m.monthNumber];
    return {
      monthKey,
      monthName: nameData.full,
      monthShort: nameData.short,
      year: m.year,
      monthNumber: m.monthNumber,
    };
  });
}

/**
 * Builds the official 12-month S-21 card for a specific publisher and service year.
 */
export function buildS21CardForPublisher(
  publisher: Publisher,
  serviceYear: string,
  allReports: MonthlyServiceReport[]
): S21ServiceYearCard {
  const serviceMonths = getServiceYearMonths(serviceYear);

  // Map reports for this publisher
  const reportsMap = new Map<string, MonthlyServiceReport>();
  allReports
    .filter((r) => r.publisherId === publisher.id)
    .forEach((r) => reportsMap.set(r.month, r));

  let totalMonthsActive = 0;
  let totalHours = 0;
  let totalBibleStudies = 0;
  let auxiliaryPioneerMonthsCount = 0;

  const monthRecords: S21MonthRecord[] = serviceMonths.map((sm) => {
    const report = reportsMap.get(sm.monthKey);

    if (report && report.participated) {
      totalMonthsActive++;
      if (report.hours) totalHours += report.hours;
      if (report.bibleStudies) totalBibleStudies += report.bibleStudies;
      if (report.isAuxiliaryPioneer) auxiliaryPioneerMonthsCount++;

      return {
        monthKey: sm.monthKey,
        monthName: sm.monthName,
        monthShort: sm.monthShort,
        participated: true,
        hours: report.hours,
        bibleStudies: report.bibleStudies || 0,
        isAuxiliaryPioneer: !!report.isAuxiliaryPioneer,
        notes: report.notes || '',
        hasReport: true,
      };
    }

    if (report && !report.participated) {
      return {
        monthKey: sm.monthKey,
        monthName: sm.monthName,
        monthShort: sm.monthShort,
        participated: false,
        hours: 0,
        bibleStudies: 0,
        isAuxiliaryPioneer: false,
        notes: report.notes || 'No participó',
        hasReport: true,
      };
    }

    // No report submitted yet for this month
    return {
      monthKey: sm.monthKey,
      monthName: sm.monthName,
      monthShort: sm.monthShort,
      participated: false,
      hours: undefined,
      bibleStudies: 0,
      isAuxiliaryPioneer: false,
      notes: '',
      hasReport: false,
    };
  });

  const avgHoursPerMonth = totalMonthsActive > 0 ? Math.round((totalHours / totalMonthsActive) * 10) / 10 : 0;
  const avgStudiesPerMonth = totalMonthsActive > 0 ? Math.round((totalBibleStudies / totalMonthsActive) * 10) / 10 : 0;

  return {
    serviceYear,
    months: monthRecords,
    totalMonthsActive,
    totalHours,
    totalBibleStudies,
    avgHoursPerMonth,
    avgStudiesPerMonth,
    auxiliaryPioneerMonthsCount,
  };
}

export type PublisherTheocraticStatus = 'activo' | 'irregular' | 'inactivo';

/**
 * Determines whether a publisher is Active, Irregular (1-5 months without report),
 * or Inactive (6+ consecutive months without preaching).
 */
export function determinePublisherStatus(
  publisher: Publisher,
  allReports: MonthlyServiceReport[]
): {
  status: PublisherTheocraticStatus;
  consecutiveMissingMonths: number;
  lastReportMonth?: string;
  description: string;
} {
  if (!publisher.active) {
    return {
      status: 'inactivo',
      consecutiveMissingMonths: 6,
      description: 'Marcado como inactivo en la congregación',
    };
  }

  // Generate sequence of past 12 months up to current month
  const now = new Date();
  const pastMonths: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    pastMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const pubReports = new Set(
    allReports
      .filter((r) => r.publisherId === publisher.id && r.participated)
      .map((r) => r.month)
  );

  let consecutiveMissing = 0;
  let foundReport = false;
  let lastReportMonth: string | undefined = undefined;

  for (const m of pastMonths) {
    if (pubReports.has(m)) {
      if (!lastReportMonth) lastReportMonth = m;
      foundReport = true;
      break;
    } else {
      consecutiveMissing++;
    }
  }

  if (!foundReport || consecutiveMissing >= 6) {
    return {
      status: 'inactivo',
      consecutiveMissingMonths: consecutiveMissing,
      lastReportMonth,
      description: `Inactivo (${consecutiveMissing >= 6 ? `${consecutiveMissing} meses sin informe` : 'Sin informe reciente'})`,
    };
  }

  if (consecutiveMissing > 0 && consecutiveMissing < 6) {
    return {
      status: 'irregular',
      consecutiveMissingMonths: consecutiveMissing,
      lastReportMonth,
      description: `Irregular (${consecutiveMissing} ${consecutiveMissing === 1 ? 'mes pendiente' : 'meses pendientes'})`,
    };
  }

  return {
    status: 'activo',
    consecutiveMissingMonths: 0,
    lastReportMonth,
    description: 'Activo (Al día)',
  };
}

/**
 * Computes Secretary Analysis Metrics across all publishers.
 */
export function computeSecretaryMetrics(
  publishers: Publisher[],
  allReports: MonthlyServiceReport[],
  serviceYear: string
) {
  let activeCount = 0;
  let irregularCount = 0;
  let inactiveCount = 0;
  let regularPioneersCount = 0;
  let totalServiceYearHours = 0;
  let totalServiceYearStudies = 0;

  const irregularPublishers: Array<{ publisher: Publisher; missingMonths: number; lastMonth?: string }> = [];
  const inactivePublishers: Array<{ publisher: Publisher; missingMonths: number }> = [];

  publishers.forEach((pub) => {
    const statusInfo = determinePublisherStatus(pub, allReports);
    if (statusInfo.status === 'activo') activeCount++;
    else if (statusInfo.status === 'irregular') {
      irregularCount++;
      irregularPublishers.push({
        publisher: pub,
        missingMonths: statusInfo.consecutiveMissingMonths,
        lastMonth: statusInfo.lastReportMonth,
      });
    } else if (statusInfo.status === 'inactivo') {
      inactiveCount++;
      inactivePublishers.push({
        publisher: pub,
        missingMonths: statusInfo.consecutiveMissingMonths,
      });
    }

    if (pub.privilege === 'precursor_regular' || pub.pioneerStatus === 'regular') {
      regularPioneersCount++;
    }

    const card = buildS21CardForPublisher(pub, serviceYear, allReports);
    totalServiceYearHours += card.totalHours;
    totalServiceYearStudies += card.totalBibleStudies;
  });

  return {
    totalPublishers: publishers.length,
    activeCount,
    irregularCount,
    inactiveCount,
    regularPioneersCount,
    totalServiceYearHours,
    totalServiceYearStudies,
    irregularPublishers,
    inactivePublishers,
  };
}
