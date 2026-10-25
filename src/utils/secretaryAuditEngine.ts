// src/utils/secretaryAuditEngine.ts
import {
  Publisher,
  MonthlyServiceReport,
  WeekSchedule,
  Territory,
  PreachingGroup,
  CircuitOverseerVisit,
  CongregationSettings,
  AuxPioneerRequest,
} from '../types';
import {
  buildS21CardForPublisher,
  determinePublisherStatus,
  getServiceYearMonths,
} from './s21Helper';

export type PioneerPaceStatus = 'en_meta' | 'atencion' | 'rezagado';

export interface RegularPioneerAuditRow {
  publisher: Publisher;
  pioneerCategory: 'regular' | 'especial';
  monthsReported: number;
  totalHours: number;
  totalCreditHours: number;
  effectiveHours: number;
  avgMonthlyHours: number;
  annualGoalHours: number;
  monthlyGoalHours: number;
  proRataTargetHours: number;
  hoursDelta: number;
  remainingToAnnualGoal: number;
  avgBibleStudies: number;
  paceStatus: PioneerPaceStatus;
  monthlyBreakdown: Array<{
    monthKey: string;
    monthShort: string;
    hours: number;
    creditHours: number;
    bibleStudies: number;
    hasReport: boolean;
  }>;
}

export interface AuxPioneerAuditSummaryRow {
  publisher: Publisher;
  isContinuous: boolean;
  monthsServed: number;
  totalHours: number;
  avgHours: number;
  totalStudies: number;
  monthsLabels: string[];
}

export interface PioneerServiceYearAudit {
  serviceYear: string;
  regularPioneers: RegularPioneerAuditRow[];
  auxPioneers: AuxPioneerAuditSummaryRow[];
  summary: {
    totalRegularPioneers: number;
    onTrackCount: number;
    warningCount: number;
    behindCount: number;
    combinedPioneerHours: number;
    avgRegularPioneerMonthlyHours: number;
    totalAuxPioneerInstances: number;
  };
}

export interface GroupExecutiveSummary {
  groupNumber: number;
  groupName: string;
  overseerName: string;
  assistantName: string;
  totalMembers: number;
  activeMembers: number;
  irregularMembers: number;
  inactiveMembers: number;
  regularPioneers: number;
  totalHoursYear: number;
  avgBibleStudies: number;
}

export interface CircuitVisitExecutiveReport {
  serviceYear: string;
  generatedAt: string;
  roster: {
    totalPublishers: number;
    activeCount: number;
    irregularCount: number;
    inactiveCount: number;
    eldersCount: number;
    ministerialServantsCount: number;
    regularPioneersCount: number;
    specialPioneersCount: number;
    continuousAuxPioneersCount: number;
    baptizedPublishersCount: number;
    unbaptizedPublishersCount: number;
    anointedCount: number;
  };
  attendanceS88: {
    weeksRecorded: number;
    avgMidweekInPerson: number;
    avgMidweekZoom: number;
    avgMidweekTotal: number;
    avgWeekendInPerson: number;
    avgWeekendZoom: number;
    avgWeekendTotal: number;
    midweekToPublisherRatioPercent: number;
    weekendToPublisherRatioPercent: number;
    recentWeeks: Array<{
      weekId: string;
      weekStartDate: string;
      midweekTotal: number;
      weekendTotal: number;
    }>;
  };
  ministryS1: {
    totalServiceYearHours: number;
    totalBibleStudiesPerMonthAvg: number;
    totalAuxPioneerMonths: number;
    pioneerAudit: PioneerServiceYearAudit;
    groupsSummary: GroupExecutiveSummary[];
    irregularList: Array<{ name: string; groupNumber?: number; missingMonths: number; phone: string }>;
    inactiveList: Array<{ name: string; groupNumber?: number; missingMonths: number; phone: string }>;
  };
  territoriesS13: {
    totalTerritories: number;
    availableCount: number;
    assignedCount: number;
    overdueCount: number;
    completedLast12MonthsCount: number;
    coveragePercent: number;
    totalNoVisitAddresses: number;
  };
}

function isRegularPioneer(pub: Publisher): boolean {
  return (
    pub.privilege === 'precursor_regular' ||
    pub.pioneerStatus === 'regular' ||
    pub.pioneer_type === 'regular' ||
    pub.serviceRole === 'regular_pioneer' ||
    pub.serviceRole === 'precursor_regular'
  );
}

function isSpecialPioneer(pub: Publisher): boolean {
  return (
    pub.privilege === 'precursor_especial' ||
    pub.pioneerStatus === 'especial' ||
    pub.pioneer_type === 'special' ||
    pub.serviceRole === 'special_pioneer'
  );
}

/**
 * Calcula la auditoría anual de Precursores Regulares (meta de 600h anuales / 50h mensuales)
 * y Precursores Auxiliares (metas de 15h / 30h) durante el año de servicio.
 */
export function computePioneerServiceYearAudit(
  publishers: Publisher[],
  monthlyReports: MonthlyServiceReport[],
  auxPioneerRequests: AuxPioneerRequest[],
  serviceYear: string
): PioneerServiceYearAudit {
  const serviceMonths = getServiceYearMonths(serviceYear);
  const monthKeysSet = new Set(serviceMonths.map((m) => m.monthKey));

  const regularPioneers: RegularPioneerAuditRow[] = [];
  const auxPioneersMap = new Map<
    string,
    {
      publisher: Publisher;
      isContinuous: boolean;
      monthsServed: number;
      totalHours: number;
      totalStudies: number;
      monthsLabels: string[];
    }
  >();

  // Index reports by publisherId + monthKey
  const reportByPubMonth = new Map<string, MonthlyServiceReport>();
  for (const r of monthlyReports) {
    if (monthKeysSet.has(r.month)) {
      reportByPubMonth.set(`${r.publisherId}__${r.month}`, r);
    }
  }

  for (const pub of publishers) {
    if (!pub.active && !isRegularPioneer(pub) && !isSpecialPioneer(pub)) continue;

    if (isRegularPioneer(pub) || isSpecialPioneer(pub)) {
      const category: 'regular' | 'especial' = isSpecialPioneer(pub) ? 'especial' : 'regular';
      const monthlyGoalHours = category === 'especial' ? 100 : 50;
      const annualGoalHours = category === 'especial' ? 1200 : 600;

      let monthsReported = 0;
      let totalHours = 0;
      let totalCreditHours = 0;
      let totalStudies = 0;

      const monthlyBreakdown = serviceMonths.map((sm) => {
        const rep = reportByPubMonth.get(`${pub.id}__${sm.monthKey}`);
        if (rep && rep.participated) {
          monthsReported++;
          const hrs = Number(rep.hours || 0);
          const cred = Number(rep.creditHours || 0);
          const stu = Number(rep.bibleStudies || 0);
          totalHours += hrs;
          totalCreditHours += cred;
          totalStudies += stu;
          return {
            monthKey: sm.monthKey,
            monthShort: sm.monthShort,
            hours: hrs,
            creditHours: cred,
            bibleStudies: stu,
            hasReport: true,
          };
        }
        return {
          monthKey: sm.monthKey,
          monthShort: sm.monthShort,
          hours: 0,
          creditHours: 0,
          bibleStudies: 0,
          hasReport: false,
        };
      });

      const effectiveHours = totalHours + totalCreditHours;
      const avgMonthlyHours =
        monthsReported > 0 ? Math.round((effectiveHours / monthsReported) * 10) / 10 : 0;
      const proRataTargetHours = monthsReported * monthlyGoalHours;
      const hoursDelta = Math.round((effectiveHours - proRataTargetHours) * 10) / 10;
      const remainingToAnnualGoal = Math.max(0, annualGoalHours - effectiveHours);
      const avgBibleStudies =
        monthsReported > 0 ? Math.round((totalStudies / monthsReported) * 10) / 10 : 0;

      let paceStatus: PioneerPaceStatus = 'en_meta';
      if (monthsReported > 0) {
        if (avgMonthlyHours >= monthlyGoalHours - 1 || hoursDelta >= -5) {
          paceStatus = 'en_meta';
        } else if (avgMonthlyHours >= monthlyGoalHours - 6 || hoursDelta >= -25) {
          paceStatus = 'atencion';
        } else {
          paceStatus = 'rezagado';
        }
      }

      regularPioneers.push({
        publisher: pub,
        pioneerCategory: category,
        monthsReported,
        totalHours,
        totalCreditHours,
        effectiveHours,
        avgMonthlyHours,
        annualGoalHours,
        monthlyGoalHours,
        proRataTargetHours,
        hoursDelta,
        remainingToAnnualGoal,
        avgBibleStudies,
        paceStatus,
        monthlyBreakdown,
      });
    } else {
      // Check if served as Auxiliary Pioneer in any month of the service year
      const isContinuous =
        pub.pioneerStatus === 'auxiliar_continuo' ||
        pub.pioneer_type === 'auxiliary_continuous' ||
        pub.privilege === 'precursor_auxiliar';

      let monthsServed = 0;
      let totalHours = 0;
      let totalStudies = 0;
      const monthsLabels: string[] = [];

      for (const sm of serviceMonths) {
        const rep = reportByPubMonth.get(`${pub.id}__${sm.monthKey}`);
        const hasApprovedReq = auxPioneerRequests.some(
          (req) =>
            req.publisherId === pub.id &&
            req.status === 'aprobada' &&
            req.year === sm.year &&
            req.month + 1 === sm.monthNumber
        );

        if ((rep && rep.isAuxiliaryPioneer) || hasApprovedReq || (isContinuous && rep?.participated)) {
          monthsServed++;
          totalHours += Number(rep?.hours || 0);
          totalStudies += Number(rep?.bibleStudies || 0);
          monthsLabels.push(sm.monthShort);
        }
      }

      if (monthsServed > 0 || isContinuous) {
        auxPioneersMap.set(pub.id, {
          publisher: pub,
          isContinuous,
          monthsServed,
          totalHours,
          totalStudies,
          monthsLabels,
        });
      }
    }
  }

  regularPioneers.sort((a, b) => a.hoursDelta - b.hoursDelta); // Show those needing attention first or sort by name

  const auxPioneers: AuxPioneerAuditSummaryRow[] = Array.from(auxPioneersMap.values()).map(
    (entry) => ({
      ...entry,
      avgHours:
        entry.monthsServed > 0 ? Math.round((entry.totalHours / entry.monthsServed) * 10) / 10 : 0,
    })
  );

  const onTrackCount = regularPioneers.filter((p) => p.paceStatus === 'en_meta').length;
  const warningCount = regularPioneers.filter((p) => p.paceStatus === 'atencion').length;
  const behindCount = regularPioneers.filter((p) => p.paceStatus === 'rezagado').length;
  const combinedPioneerHours = regularPioneers.reduce((acc, p) => acc + p.effectiveHours, 0);
  const avgRegularPioneerMonthlyHours =
    regularPioneers.length > 0
      ? Math.round(
          (regularPioneers.reduce((acc, p) => acc + p.avgMonthlyHours, 0) /
            regularPioneers.length) *
            10
        ) / 10
      : 0;
  const totalAuxPioneerInstances = auxPioneers.reduce((acc, a) => acc + a.monthsServed, 0);

  return {
    serviceYear,
    regularPioneers,
    auxPioneers,
    summary: {
      totalRegularPioneers: regularPioneers.length,
      onTrackCount,
      warningCount,
      behindCount,
      combinedPioneerHours,
      avgRegularPioneerMonthlyHours,
      totalAuxPioneerInstances,
    },
  };
}

/**
 * Consolida el Informe Ejecutivo de la Congregación para la Visita del Superintendente de Circuito
 * abarcando S-1, S-4, S-21, S-88 (Asistencia) y S-13 (Territorios).
 */
export function computeCircuitVisitExecutiveReport(params: {
  publishers: Publisher[];
  weeks: WeekSchedule[];
  monthlyReports: MonthlyServiceReport[];
  territories: Territory[];
  preachingGroups: PreachingGroup[];
  auxPioneerRequests: AuxPioneerRequest[];
  circuitVisit?: CircuitOverseerVisit | null;
  settings: CongregationSettings;
  serviceYear: string;
}): CircuitVisitExecutiveReport {
  const {
    publishers,
    weeks,
    monthlyReports,
    territories,
    preachingGroups,
    auxPioneerRequests,
    serviceYear,
  } = params;

  const publishersMap = new Map(publishers.map((p) => [p.id, p]));

  let activeCount = 0;
  let irregularCount = 0;
  let inactiveCount = 0;
  let eldersCount = 0;
  let ministerialServantsCount = 0;
  let regularPioneersCount = 0;
  let specialPioneersCount = 0;
  let continuousAuxPioneersCount = 0;
  let baptizedPublishersCount = 0;
  let unbaptizedPublishersCount = 0;
  let anointedCount = 0;

  let totalServiceYearHours = 0;
  let totalBibleStudiesSum = 0;
  let totalMonthsReportedAcrossCongregation = 0;

  const irregularList: Array<{ name: string; groupNumber?: number; missingMonths: number; phone: string }> = [];
  const inactiveList: Array<{ name: string; groupNumber?: number; missingMonths: number; phone: string }> = [];

  for (const pub of publishers) {
    const statusInfo = determinePublisherStatus(pub, monthlyReports);
    if (statusInfo.status === 'activo') activeCount++;
    else if (statusInfo.status === 'irregular') {
      irregularCount++;
      irregularList.push({
        name: pub.name,
        groupNumber: pub.groupNumber,
        missingMonths: statusInfo.consecutiveMissingMonths,
        phone: pub.phone,
      });
    } else {
      inactiveCount++;
      inactiveList.push({
        name: pub.name,
        groupNumber: pub.groupNumber,
        missingMonths: statusInfo.consecutiveMissingMonths,
        phone: pub.phone,
      });
    }

    if (pub.privilege === 'anciano' || pub.spiritualStatus === 'elder' || pub.spiritualStatus === 'anciano') {
      eldersCount++;
    } else if (
      pub.privilege === 'siervo_ministerial' ||
      pub.spiritualStatus === 'ministerial_servant' ||
      pub.spiritualStatus === 'siervo_ministerial'
    ) {
      ministerialServantsCount++;
    }

    if (isSpecialPioneer(pub)) {
      specialPioneersCount++;
    } else if (isRegularPioneer(pub)) {
      regularPioneersCount++;
    } else if (
      pub.pioneerStatus === 'auxiliar_continuo' ||
      pub.pioneer_type === 'auxiliary_continuous' ||
      pub.privilege === 'precursor_auxiliar'
    ) {
      continuousAuxPioneersCount++;
    }

    if (pub.privilege === 'publicador_no_bautizado' || pub.role === 'unbaptized') {
      unbaptizedPublishersCount++;
    } else {
      baptizedPublishersCount++;
    }

    if (pub.hope === 'ungido' || pub.is_anointed) {
      anointedCount++;
    }

    const s21 = buildS21CardForPublisher(pub, serviceYear, monthlyReports);
    totalServiceYearHours += s21.totalHours;
    totalBibleStudiesSum += s21.avgStudiesPerMonth;
    if (s21.totalMonthsActive > 0) totalMonthsReportedAcrossCongregation++;
  }

  // S-88 Attendance calculation
  const weeksWithAttendance = weeks.filter(
    (w) =>
      w.attendance &&
      (w.attendance.midweek.total > 0 || w.attendance.weekend.total > 0)
  );

  let sumMidweekInPerson = 0;
  let sumMidweekZoom = 0;
  let sumMidweekTotal = 0;
  let midweekCount = 0;

  let sumWeekendInPerson = 0;
  let sumWeekendZoom = 0;
  let sumWeekendTotal = 0;
  let weekendCount = 0;

  for (const w of weeksWithAttendance) {
    if (w.attendance && w.attendance.midweek.total > 0) {
      sumMidweekInPerson += w.attendance.midweek.inPerson || 0;
      sumMidweekZoom += w.attendance.midweek.zoom || 0;
      sumMidweekTotal += w.attendance.midweek.total || 0;
      midweekCount++;
    }
    if (w.attendance && w.attendance.weekend.total > 0) {
      sumWeekendInPerson += w.attendance.weekend.inPerson || 0;
      sumWeekendZoom += w.attendance.weekend.zoom || 0;
      sumWeekendTotal += w.attendance.weekend.total || 0;
      weekendCount++;
    }
  }

  const avgMidweekInPerson = midweekCount > 0 ? Math.round(sumMidweekInPerson / midweekCount) : 0;
  const avgMidweekZoom = midweekCount > 0 ? Math.round(sumMidweekZoom / midweekCount) : 0;
  const avgMidweekTotal = midweekCount > 0 ? Math.round(sumMidweekTotal / midweekCount) : 0;

  const avgWeekendInPerson = weekendCount > 0 ? Math.round(sumWeekendInPerson / weekendCount) : 0;
  const avgWeekendZoom = weekendCount > 0 ? Math.round(sumWeekendZoom / weekendCount) : 0;
  const avgWeekendTotal = weekendCount > 0 ? Math.round(sumWeekendTotal / weekendCount) : 0;

  const basePubs = Math.max(1, activeCount || publishers.length);
  const midweekToPublisherRatioPercent = Math.round((avgMidweekTotal / basePubs) * 100);
  const weekendToPublisherRatioPercent = Math.round((avgWeekendTotal / basePubs) * 100);

  const recentWeeks = [...weeksWithAttendance]
    .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate))
    .slice(0, 6)
    .map((w) => ({
      weekId: w.id,
      weekStartDate: w.weekStartDate,
      midweekTotal: w.attendance?.midweek.total || 0,
      weekendTotal: w.attendance?.weekend.total || 0,
    }));

  // Pioneer Audit
  const pioneerAudit = computePioneerServiceYearAudit(
    publishers,
    monthlyReports,
    auxPioneerRequests,
    serviceYear
  );

  // Groups Executive Summary
  const groupsSummary: GroupExecutiveSummary[] = preachingGroups.map((g) => {
    const groupPubs = publishers.filter(
      (p) => p.groupNumber === g.number || g.memberIds.includes(p.id)
    );
    let gActive = 0;
    let gIrregular = 0;
    let gInactive = 0;
    let gPioneers = 0;
    let gHours = 0;
    let gStudies = 0;

    for (const gp of groupPubs) {
      const st = determinePublisherStatus(gp, monthlyReports);
      if (st.status === 'activo') gActive++;
      else if (st.status === 'irregular') gIrregular++;
      else gInactive++;

      if (isRegularPioneer(gp) || isSpecialPioneer(gp)) gPioneers++;

      const card = buildS21CardForPublisher(gp, serviceYear, monthlyReports);
      gHours += card.totalHours;
      gStudies += card.avgStudiesPerMonth;
    }

    const overseerName = g.overseerId ? publishersMap.get(g.overseerId)?.name || 'Por asignar' : 'Por asignar';
    const assistantName = g.assistantId ? publishersMap.get(g.assistantId)?.name || 'Por asignar' : 'Por asignar';

    return {
      groupNumber: g.number,
      groupName: g.name,
      overseerName,
      assistantName,
      totalMembers: groupPubs.length,
      activeMembers: gActive,
      irregularMembers: gIrregular,
      inactiveMembers: gInactive,
      regularPioneers: gPioneers,
      totalHoursYear: gHours,
      avgBibleStudies: Math.round(gStudies * 10) / 10,
    };
  });

  // S-13 Territories Summary
  const totalTerritories = territories.length;
  const availableCount = territories.filter((t) => t.status === 'disponible').length;
  const assignedCount = territories.filter((t) => t.status === 'asignado').length;
  const overdueCount = territories.filter((t) => t.status === 'vencido').length;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearAgoISO = oneYearAgo.toISOString().slice(0, 10);

  const completedLast12MonthsCount = territories.filter(
    (t) =>
      (t.lastCompletedDate && t.lastCompletedDate >= oneYearAgoISO) ||
      t.history.some((h) => h.returnedDate && h.returnedDate >= oneYearAgoISO)
  ).length;

  const coveragePercent =
    totalTerritories > 0 ? Math.round((completedLast12MonthsCount / totalTerritories) * 100) : 0;

  const totalNoVisitAddresses = territories.reduce(
    (acc, t) => acc + (t.noVisits ? t.noVisits.length : 0),
    0
  );

  return {
    serviceYear,
    generatedAt: new Date().toISOString().slice(0, 10),
    roster: {
      totalPublishers: publishers.length,
      activeCount,
      irregularCount,
      inactiveCount,
      eldersCount,
      ministerialServantsCount,
      regularPioneersCount,
      specialPioneersCount,
      continuousAuxPioneersCount,
      baptizedPublishersCount,
      unbaptizedPublishersCount,
      anointedCount,
    },
    attendanceS88: {
      weeksRecorded: weeksWithAttendance.length,
      avgMidweekInPerson,
      avgMidweekZoom,
      avgMidweekTotal,
      avgWeekendInPerson,
      avgWeekendZoom,
      avgWeekendTotal,
      midweekToPublisherRatioPercent,
      weekendToPublisherRatioPercent,
      recentWeeks,
    },
    ministryS1: {
      totalServiceYearHours,
      totalBibleStudiesPerMonthAvg: Math.round(totalBibleStudiesSum),
      totalAuxPioneerMonths: pioneerAudit.summary.totalAuxPioneerInstances,
      pioneerAudit,
      groupsSummary,
      irregularList,
      inactiveList,
    },
    territoriesS13: {
      totalTerritories,
      availableCount,
      assignedCount,
      overdueCount,
      completedLast12MonthsCount,
      coveragePercent,
      totalNoVisitAddresses,
    },
  };
}

/**
 * Genera el mensaje ejecutivo para enviar por WhatsApp al Cuerpo de Ancianos o Superintendente de Circuito.
 */
export function buildCircuitVisitExecutiveWhatsAppSummary(
  report: CircuitVisitExecutiveReport,
  settings: CongregationSettings,
  circuitVisit?: CircuitOverseerVisit | null
): string {
  const visitHeader = circuitVisit
    ? `Semana del ${circuitVisit.startDate} al ${circuitVisit.endDate} • SC: Hno. ${circuitVisit.overseerName}`
    : `Año de Servicio ${report.serviceYear}`;

  return `📁 *CARPETA EJECUTIVA DE SECRETARÍA Y SERVICIO*
🏛 *${settings.congregationName}* (${settings.circuitNumber || 'Circuito'})
📅 *${visitHeader}*

👥 *1. COMPOSICIÓN DE LA CONGREGACIÓN (S-21):*
• Publicadores Totales: *${report.roster.totalPublishers}* (Activos: ${report.roster.activeCount} | Irregulares: ${report.roster.irregularCount} | Inactivos: ${report.roster.inactiveCount})
• Ancianos: *${report.roster.eldersCount}* | Siervos Ministeriales: *${report.roster.ministerialServantsCount}*
• Precursores Regulares: *${report.roster.regularPioneersCount}* | Especiales: *${report.roster.specialPioneersCount}* | Aux. Continuos: *${report.roster.continuousAuxPioneersCount}*

📊 *2. ASISTENCIA A LAS REUNIONES (S-88):*
• Reunión Entre Semana: Promedio *${report.attendanceS88.avgMidweekTotal}* (${report.attendanceS88.avgMidweekInPerson} presencial / ${report.attendanceS88.avgMidweekZoom} Zoom) — *${report.attendanceS88.midweekToPublisherRatioPercent}%*
• Reunión Fin de Semana: Promedio *${report.attendanceS88.avgWeekendTotal}* (${report.attendanceS88.avgWeekendInPerson} presencial / ${report.attendanceS88.avgWeekendZoom} Zoom) — *${report.attendanceS88.weekendToPublisherRatioPercent}%*

👜 *3. MINISTERIO DEL CAMPO Y PRECURSORES (S-1 / S-4):*
• Horas acumuladas en el año de servicio: *${report.ministryS1.totalServiceYearHours} h*
• Promedio mensual de Cursos Bíblicos: *${report.ministryS1.totalBibleStudiesPerMonthAvg}*
• Auditoría Precursores Regulares (Meta 600h): *${report.ministryS1.pioneerAudit.summary.onTrackCount}* en meta | *${report.ministryS1.pioneerAudit.summary.warningCount}* en observación | *${report.ministryS1.pioneerAudit.summary.behindCount}* con déficit

🗺 *4. COBERTURA DE TERRITORIOS (S-13):*
• Total Territorios: *${report.territoriesS13.totalTerritories}* (${report.territoriesS13.availableCount} disponibles, ${report.territoriesS13.assignedCount} en curso, ${report.territoriesS13.overdueCount} vencidos)
• Cobertura últimos 12 meses: *${report.territoriesS13.coveragePercent}%* (${report.territoriesS13.completedLast12MonthsCount}/${report.territoriesS13.totalTerritories})
• Direcciones "No Visitar" registradas: *${report.territoriesS13.totalNoVisitAddresses}*`;
}

/**
 * Imprime el Dossier Ejecutivo A4 para la Visita del Superintendente de Circuito mediante iframe oculto.
 */
export function printCircuitOverseerExecutiveDossierA4(
  report: CircuitVisitExecutiveReport,
  settings: CongregationSettings,
  circuitVisit?: CircuitOverseerVisit | null
): void {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Carpeta Ejecutiva - ${settings.congregationName}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { margin: 0; padding: 0; color: #0f172a; font-size: 11px; line-height: 1.4; }
    .header { border-bottom: 3px solid #1e293b; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { margin: 0; font-size: 17px; text-transform: uppercase; letter-spacing: 0.4px; color: #0f172a; }
    .header p { margin: 2px 0 0; font-size: 11px; color: #475569; font-weight: 600; }
    .badge { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; text-align: right; }
    .section { margin-bottom: 14px; page-break-inside: avoid; }
    .section-title { background: #1e293b; color: #ffffff; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 5px 8px; border-radius: 4px; margin-bottom: 8px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 8px; }
    .kpi-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 8px; background: #f8fafc; }
    .kpi-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .kpi-val { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .kpi-sub { font-size: 9px; color: #475569; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
    th { background: #f1f5f9; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 9px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .status-ok { color: #047857; font-weight: 700; }
    .status-warn { color: #b45309; font-weight: 700; }
    .status-bad { color: #be123c; font-weight: 700; }
    .footer { margin-top: 16px; border-top: 1px solid #cbd5e1; padding-top: 6px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Carpeta Ejecutiva de Secretaría y Servicio</h1>
      <p>${settings.congregationName} ${settings.congregationNumber ? `(#${settings.congregationNumber})` : ''} • ${circuitVisit?.circuitNumber || settings.circuitNumber || 'Circuito'}</p>
    </div>
    <div class="badge">
      Año de Servicio ${report.serviceYear}<br/>
      ${circuitVisit ? `Visita SC: Hno. ${circuitVisit.overseerName} (${circuitVisit.startDate})` : `Generado: ${report.generatedAt}`}
    </div>
  </div>

  <div class="section">
    <div class="section-title">1. Estado General de la Congregación y Nombramientos (S-21)</div>
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-label">Total Publicadores</div>
        <div class="kpi-val">${report.roster.totalPublishers}</div>
        <div class="kpi-sub">${report.roster.baptizedPublishersCount} bautizados • ${report.roster.unbaptizedPublishersCount} no baut.</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Publicadores Activos</div>
        <div class="kpi-val status-ok">${report.roster.activeCount}</div>
        <div class="kpi-sub">Irregulares: ${report.roster.irregularCount} • Inactivos: ${report.roster.inactiveCount}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Ancianos y Siervos M.</div>
        <div class="kpi-val">${report.roster.eldersCount} / ${report.roster.ministerialServantsCount}</div>
        <div class="kpi-sub">${report.roster.eldersCount} Ancianos • ${report.roster.ministerialServantsCount} Siervos Min.</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Precursores</div>
        <div class="kpi-val">${report.roster.regularPioneersCount} Reg.</div>
        <div class="kpi-sub">${report.roster.specialPioneersCount} Esp. • ${report.roster.continuousAuxPioneersCount} Aux. Cont.</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. Registro de Asistencia a las Reuniones de Congregación (S-88)</div>
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-label">Promedio Entre Semana</div>
        <div class="kpi-val">${report.attendanceS88.avgMidweekTotal}</div>
        <div class="kpi-sub">${report.attendanceS88.avgMidweekInPerson} Salón + ${report.attendanceS88.avgMidweekZoom} Zoom</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Promedio Fin de Semana</div>
        <div class="kpi-val">${report.attendanceS88.avgWeekendTotal}</div>
        <div class="kpi-sub">${report.attendanceS88.avgWeekendInPerson} Salón + ${report.attendanceS88.avgWeekendZoom} Zoom</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">% vs Publicadores Activos</div>
        <div class="kpi-val">${report.attendanceS88.weekendToPublisherRatioPercent}%</div>
        <div class="kpi-sub">Entre semana: ${report.attendanceS88.midweekToPublisherRatioPercent}%</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Cobertura Territorios (S-13)</div>
        <div class="kpi-val">${report.territoriesS13.coveragePercent}%</div>
        <div class="kpi-sub">${report.territoriesS13.availableCount} disp • ${report.territoriesS13.assignedCount} asig • ${report.territoriesS13.overdueCount} venc</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. Resumen por Grupos de Servicio del Campo</div>
    <table>
      <thead>
        <tr>
          <th>Grupo</th>
          <th>Superintendente / Auxiliar</th>
          <th class="text-center">Publicadores</th>
          <th class="text-center">Activos</th>
          <th class="text-center">Irregulares</th>
          <th class="text-center">Inactivos</th>
          <th class="text-center">Prec. Reg.</th>
          <th class="text-right">Horas Año</th>
          <th class="text-right">Cursos Bíblicos</th>
        </tr>
      </thead>
      <tbody>
        ${report.ministryS1.groupsSummary
          .map(
            (g) => `
          <tr>
            <td><strong>Grupo ${g.groupNumber}</strong> - ${g.groupName}</td>
            <td>${g.overseerName} / ${g.assistantName}</td>
            <td class="text-center">${g.totalMembers}</td>
            <td class="text-center status-ok">${g.activeMembers}</td>
            <td class="text-center ${g.irregularMembers > 0 ? 'status-warn' : ''}">${g.irregularMembers}</td>
            <td class="text-center ${g.inactiveMembers > 0 ? 'status-bad' : ''}">${g.inactiveMembers}</td>
            <td class="text-center">${g.regularPioneers}</td>
            <td class="text-right">${g.totalHoursYear} h</td>
            <td class="text-right">${g.avgBibleStudies}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">4. Auditoría de Precursores Regulares y Especiales (Meta Anual: 600 h / 50 h mes)</div>
    <table>
      <thead>
        <tr>
          <th>Precursor</th>
          <th class="text-center">Meses Inf.</th>
          <th class="text-right">Horas Pred.</th>
          <th class="text-right">Crédito</th>
          <th class="text-right">Total Efectivo</th>
          <th class="text-right">Prom. Mensual</th>
          <th class="text-right">Meta Pro-Rata</th>
          <th class="text-right">Balance</th>
          <th class="text-center">Cursos</th>
          <th class="text-center">Estado</th>
        </tr>
      </thead>
      <tbody>
        ${
          report.ministryS1.pioneerAudit.regularPioneers.length === 0
            ? `<tr><td colspan="10" class="text-center">No hay precursores regulares registrados.</td></tr>`
            : report.ministryS1.pioneerAudit.regularPioneers
                .map((p) => {
                  const stLabel =
                    p.paceStatus === 'en_meta'
                      ? 'EN META'
                      : p.paceStatus === 'atencion'
                      ? 'OBSERVACIÓN'
                      : 'DÉFICIT';
                  const stClass =
                    p.paceStatus === 'en_meta'
                      ? 'status-ok'
                      : p.paceStatus === 'atencion'
                      ? 'status-warn'
                      : 'status-bad';
                  return `
              <tr>
                <td><strong>${p.publisher.name}</strong> (G-${p.publisher.groupNumber || '-'})</td>
                <td class="text-center">${p.monthsReported}/12</td>
                <td class="text-right">${p.totalHours} h</td>
                <td class="text-right">${p.totalCreditHours > 0 ? `+${p.totalCreditHours} h` : '-'}</td>
                <td class="text-right"><strong>${p.effectiveHours} h</strong></td>
                <td class="text-right">${p.avgMonthlyHours} h/mes</td>
                <td class="text-right">${p.proRataTargetHours} h</td>
                <td class="text-right ${stClass}">${p.hoursDelta >= 0 ? `+${p.hoursDelta}` : p.hoursDelta} h</td>
                <td class="text-center">${p.avgBibleStudies}</td>
                <td class="text-center ${stClass}">${stLabel}</td>
              </tr>`;
                })
                .join('')
        }
      </tbody>
    </table>
  </div>

  ${
    report.ministryS1.irregularList.length > 0 || report.ministryS1.inactiveList.length > 0
      ? `<div class="section">
          <div class="section-title">5. Seguimiento Pastoral: Publicadores Irregulares e Inactivos</div>
          <table>
            <thead>
              <tr>
                <th>Nombre del Publicador</th>
                <th class="text-center">Grupo</th>
                <th class="text-center">Clasificación</th>
                <th class="text-center">Meses sin Informar</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              ${report.ministryS1.irregularList
                .map(
                  (item) => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td class="text-center">Grupo ${item.groupNumber || '-'}</td>
                  <td class="text-center status-warn">Irregular</td>
                  <td class="text-center">${item.missingMonths} mes(es)</td>
                  <td>${item.phone || '-'}</td>
                </tr>`
                )
                .join('')}
              ${report.ministryS1.inactiveList
                .map(
                  (item) => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td class="text-center">Grupo ${item.groupNumber || '-'}</td>
                  <td class="text-center status-bad">Inactivo</td>
                  <td class="text-center">${item.missingMonths} mes(es)</td>
                  <td>${item.phone || '-'}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>`
      : ''
  }

  <div class="footer">
    <span>Secretaría y Comité de Servicio de la Congregación • ${settings.congregationName}</span>
    <span>Formularios S-1 / S-4 / S-21 / S-88 / S-13 • Año de Servicio ${report.serviceYear}</span>
  </div>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 350);
  }
}
