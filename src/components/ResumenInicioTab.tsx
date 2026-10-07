// src/components/ResumenInicioTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from './Navbar';
import { getFriendlyCongregationName } from '../utils/theocraticSecurity';
import {
  Calendar,
  Users,
  Award,
  Map,
  Landmark,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Printer,
  Tv,
  Timer,
  FileText,
  ShieldCheck,
  ChevronRight,
  Mic,
  Brush,
  BookOpen,
  LayoutGrid,
  SlidersHorizontal,
  Clock,
  Check,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Percent,
} from 'lucide-react';

interface ResumenInicioTabProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenTimerModal?: () => void;
  onOpenKioskModal?: () => void;
  onOpenConflictsModal?: () => void;
}

function formatWeekRange(startDate?: string, endDate?: string): string {
  if (!startDate) return 'Semana Actual';
  const partsStart = startDate.split('-').map(Number);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  if (!endDate) return `${partsStart[2]} de ${months[partsStart[1] - 1]} de ${partsStart[0]}`;
  const partsEnd = endDate.split('-').map(Number);
  if (partsStart[1] === partsEnd[1]) {
    return `${partsStart[2]} - ${partsEnd[2]} de ${months[partsStart[1] - 1]} de ${partsStart[0]}`;
  }
  return `${partsStart[2]} de ${months[partsStart[1] - 1]} - ${partsEnd[2]} de ${months[partsEnd[1] - 1]} de ${partsStart[0]}`;
}

export const ResumenInicioTab: React.FC<ResumenInicioTabProps> = ({
  setActiveTab,
  onOpenTimerModal,
  onOpenKioskModal,
  onOpenConflictsModal,
}) => {
  const {
    weeks,
    currentWeek,
    publishers,
    publishersMap,
    territories,
    preachingGroups,
    transactions,
    conflicts,
    settings,
    getS89SlipsForWeek,
  } = useCongregation();

  // View mode: 'tablero' (Executive Board) vs 'completa' (Detailed View)
  const [viewMode, setViewMode] = useState<'tablero' | 'completa'>(() => {
    try {
      return (localStorage.getItem('kongre_resumen_view') as any) || 'tablero';
    } catch {
      return 'tablero';
    }
  });

  const handleViewModeChange = (mode: 'tablero' | 'completa') => {
    setViewMode(mode);
    try {
      localStorage.setItem('kongre_resumen_view', mode);
    } catch {
      // ignore
    }
  };

  // Filters for Board View columns
  const [assignmentFilter, setAssignmentFilter] = useState<'todas' | 'entre_semana' | 'fin_semana' | 'deberes' | 'pendientes'>('todas');
  const [territoryFilter, setTerritoryFilter] = useState<'todos' | 'vencidos' | 'asignados' | 'disponibles'>('todos');

  // Active week
  const activeWeek = currentWeek || weeks[0];

  // Helper to format assigned publisher names
  const getPubName = (id?: string) => {
    if (!id) return null;
    return publishersMap.get(id)?.name || null;
  };

  // Publisher Statistics
  const publisherStats = useMemo(() => {
    let elders = 0;
    let servants = 0;
    let regularPioneers = 0;
    let auxPioneers = 0;
    let activePublishers = 0;

    publishers.forEach((p) => {
      if (p.privilege === 'anciano') elders++;
      if (p.privilege === 'siervo_ministerial') servants++;
      if (p.privilege === 'precursor_regular') regularPioneers++;
      if (p.privilege === 'precursor_auxiliar') auxPioneers++;
      if (p.active) activePublishers++;
    });

    return {
      total: publishers.length,
      active: activePublishers,
      elders,
      servants,
      regularPioneers,
      auxPioneers,
    };
  }, [publishers]);

  // Attendance metrics from active or most recent week
  const attendanceStats = useMemo(() => {
    let recentMidweek = 0;
    let recentMidweekInPerson = 0;
    let recentMidweekZoom = 0;
    let recentWeekend = 0;
    let recentWeekendInPerson = 0;
    let recentWeekendZoom = 0;

    if (activeWeek?.attendance) {
      recentMidweek = activeWeek.attendance.midweek.total;
      recentMidweekInPerson = activeWeek.attendance.midweek.inPerson;
      recentMidweekZoom = activeWeek.attendance.midweek.zoom;

      recentWeekend = activeWeek.attendance.weekend.total;
      recentWeekendInPerson = activeWeek.attendance.weekend.inPerson;
      recentWeekendZoom = activeWeek.attendance.weekend.zoom;
    }

    const totalRecent = recentMidweekInPerson + recentWeekendInPerson + recentMidweekZoom + recentWeekendZoom;
    const inPersonTotal = recentMidweekInPerson + recentWeekendInPerson;
    const inPersonPct = totalRecent > 0 ? Math.round((inPersonTotal / totalRecent) * 100) : 0;

    return {
      midweek: recentMidweek,
      midweekInPerson: recentMidweekInPerson,
      midweekZoom: recentMidweekZoom,
      weekend: recentWeekend,
      weekendInPerson: recentWeekendInPerson,
      weekendZoom: recentWeekendZoom,
      inPersonPct,
    };
  }, [activeWeek]);

  // Historical attendance of the last 4 recorded weeks
  const recentWeeksAttendance = useMemo(() => {
    if (!weeks || weeks.length === 0) return [];
    const sorted = [...weeks].sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));
    return sorted.slice(0, 4).map((w) => {
      const att = w.attendance;
      const mwTotal = att?.midweek?.total || 0;
      const mwInPerson = att?.midweek?.inPerson || 0;
      const mwZoom = att?.midweek?.zoom || 0;
      const weTotal = att?.weekend?.total || 0;
      const weInPerson = att?.weekend?.inPerson || 0;
      const weZoom = att?.weekend?.zoom || 0;
      const totalAll = mwTotal + weTotal;
      const inPersonAll = mwInPerson + weInPerson;
      const pctInPerson = totalAll > 0 ? Math.round((inPersonAll / totalAll) * 100) : 0;

      return {
        id: w.id,
        weekStartDate: w.weekStartDate,
        weekEndDate: w.weekEndDate,
        midweek: { inPerson: mwInPerson, zoom: mwZoom, total: mwTotal },
        weekend: { inPerson: weInPerson, zoom: weZoom, total: weTotal },
        totalAll,
        pctInPerson,
        hasRecord: (mwTotal > 0 || weTotal > 0),
      };
    });
  }, [weeks]);

  // Territories overview
  const territoryStats = useMemo(() => {
    const total = territories.length;
    const assigned = territories.filter((t) => t.status === 'asignado').length;
    const available = territories.filter((t) => t.status === 'disponible').length;
    const overdue = territories.filter(
      (t) =>
        t.status === 'vencido' ||
        (t.status === 'asignado' && t.dueDate && new Date(t.dueDate) < new Date())
    ).length;

    const assignedPct = total > 0 ? Math.round((assigned / total) * 100) : 0;

    return { total, assigned, available, overdue, assignedPct };
  }, [territories]);

  // Pending territories list with days overdue and assignee name
  const pendingTerritoriesList = useMemo(() => {
    const now = new Date();
    return territories.map((t) => {
      let isOverdue = t.status === 'vencido';
      let daysAssigned = 0;
      if (t.assignedDate) {
        const assignedTime = new Date(t.assignedDate).getTime();
        daysAssigned = Math.max(0, Math.floor((now.getTime() - assignedTime) / (1000 * 60 * 60 * 24)));
        if (daysAssigned > 120 && t.status === 'asignado') {
          isOverdue = true;
        }
      }
      if (t.dueDate && new Date(t.dueDate) < now && t.status === 'asignado') {
        isOverdue = true;
      }

      const assigneeName = t.currentAssigneeId ? publishersMap.get(t.currentAssigneeId)?.name : null;

      return {
        ...t,
        isOverdue,
        daysAssigned,
        assigneeName,
      };
    }).sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.status === 'asignado' && b.status !== 'asignado') return -1;
      if (a.status !== 'asignado' && b.status === 'asignado') return 1;
      return a.number.localeCompare(b.number, undefined, { numeric: true });
    });
  }, [territories, publishersMap]);

  // Filtered territories for Board View
  const filteredTerritories = useMemo(() => {
    if (territoryFilter === 'vencidos') return pendingTerritoriesList.filter((t) => t.isOverdue);
    if (territoryFilter === 'asignados') return pendingTerritoriesList.filter((t) => t.status === 'asignado');
    if (territoryFilter === 'disponibles') return pendingTerritoriesList.filter((t) => t.status === 'disponible');
    return pendingTerritoriesList;
  }, [pendingTerritoriesList, territoryFilter]);

  // S-89 slips for this week
  const s89Slips = useMemo(() => {
    if (!activeWeek) return [];
    return getS89SlipsForWeek(activeWeek);
  }, [activeWeek, getS89SlipsForWeek]);

  // Accounts summary
  const accountBalance = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.type === 'ingreso') return acc + tx.amount;
      return acc - tx.amount;
    }, 0);
  }, [transactions]);

  // Cleaning group for this week
  const currentCleaningGroup = useMemo(() => {
    if (!preachingGroups || preachingGroups.length === 0) return null;
    return preachingGroups[0];
  }, [preachingGroups]);

  const cleaningOverseerName = useMemo(() => {
    if (!currentCleaningGroup?.overseerId) return null;
    return publishersMap.get(currentCleaningGroup.overseerId)?.name || null;
  }, [currentCleaningGroup, publishersMap]);

  // Meeting Assignments Check
  const meetingAssignmentsStatus = useMemo(() => {
    if (!activeWeek) return { complete: false, totalCount: 0, assignedCount: 0, pendingCount: 0, percent: 100 };
    let total = 0;
    let assigned = 0;

    const check = (val?: string) => {
      total++;
      if (val && val.trim() !== '') assigned++;
    };

    check(activeWeek.midweek?.presidentId);
    check(activeWeek.midweek?.tesoros?.discurso?.publisherId);
    check(activeWeek.midweek?.tesoros?.perlas?.publisherId);
    check(activeWeek.midweek?.tesoros?.lecturaBiblia?.publisherId);
    check(activeWeek.midweek?.vidaCristiana?.estudioBiblico?.conductorId);
    check(activeWeek.midweek?.vidaCristiana?.estudioBiblico?.lectorId);

    check(activeWeek.weekend?.presidentId);
    check(activeWeek.weekend?.publicTalkSpeaker);
    check(activeWeek.weekend?.atalayaConductorId);
    check(activeWeek.weekend?.atalayaLectorId);

    return {
      totalCount: total,
      assignedCount: assigned,
      pendingCount: total - assigned,
      percent: total > 0 ? Math.round((assigned / total) * 100) : 100,
    };
  }, [activeWeek]);

  // All upcoming assignments list for Board View
  const upcomingAssignmentsList = useMemo(() => {
    if (!activeWeek) return [];
    const list: Array<{
      id: string;
      meetingType: 'entre_semana' | 'fin_semana' | 'deberes';
      roleTitle: string;
      brotherName: string | null;
      isAssigned: boolean;
      partTheme?: string;
      tag?: string;
    }> = [];

    // Midweek
    const mw = activeWeek.midweek;
    if (mw) {
      list.push({
        id: 'mw-pres',
        meetingType: 'entre_semana',
        roleTitle: 'Presidente',
        brotherName: getPubName(mw.presidentId),
        isAssigned: !!mw.presidentId,
        tag: 'Presidencia',
      });
      if (mw.initialPrayerId) {
        list.push({
          id: 'mw-oracion-ini',
          meetingType: 'entre_semana',
          roleTitle: 'Oración Inicial',
          brotherName: getPubName(mw.initialPrayerId),
          isAssigned: true,
          tag: 'Oración',
        });
      }
      list.push({
        id: 'mw-tesoros-disc',
        meetingType: 'entre_semana',
        roleTitle: 'Discurso de Tesoros',
        brotherName: getPubName(mw.tesoros?.discurso?.publisherId),
        isAssigned: !!mw.tesoros?.discurso?.publisherId,
        partTheme: mw.tesoros?.discurso?.title || 'Tesoros de la Biblia (10 min)',
        tag: 'Tesoros',
      });
      list.push({
        id: 'mw-tesoros-perlas',
        meetingType: 'entre_semana',
        roleTitle: 'Perlas Escondidas',
        brotherName: getPubName(mw.tesoros?.perlas?.publisherId),
        isAssigned: !!mw.tesoros?.perlas?.publisherId,
        partTheme: mw.tesoros?.perlas?.title || 'Busquemos perlas escondidas (10 min)',
        tag: 'Tesoros',
      });
      list.push({
        id: 'mw-tesoros-lectura',
        meetingType: 'entre_semana',
        roleTitle: 'Lectura de la Biblia',
        brotherName: getPubName(mw.tesoros?.lecturaBiblia?.publisherId),
        isAssigned: !!mw.tesoros?.lecturaBiblia?.publisherId,
        partTheme: mw.bibleReading || 'Lectura semanal',
        tag: 'Tesoros',
      });

      // Seamos mejores maestros (estudiantes)
      if (mw.maestros?.items && mw.maestros.items.length > 0) {
        mw.maestros.items.forEach((item, idx) => {
          const studentName = getPubName(item.publisherId);
          const assistantName = getPubName(item.assistantId);
          list.push({
            id: `mw-maestros-${idx}`,
            meetingType: 'entre_semana',
            roleTitle: item.title || `Intervención Estudiante #${idx + 1}`,
            brotherName: studentName ? (assistantName ? `${studentName} (Ayte: ${assistantName})` : studentName) : null,
            isAssigned: !!studentName,
            partTheme: item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal',
            tag: 'S-89',
          });
        });
      }

      // Vida Cristiana
      if (mw.vidaCristiana?.estudioBiblico) {
        list.push({
          id: 'mw-ebc-cond',
          meetingType: 'entre_semana',
          roleTitle: 'Conductor Estudio Bíblico',
          brotherName: getPubName(mw.vidaCristiana.estudioBiblico.conductorId),
          isAssigned: !!mw.vidaCristiana.estudioBiblico.conductorId,
          partTheme: 'Estudio Bíblico de la Congregación',
          tag: 'Vida Cristiana',
        });
        list.push({
          id: 'mw-ebc-lec',
          meetingType: 'entre_semana',
          roleTitle: 'Lector Estudio Bíblico',
          brotherName: getPubName(mw.vidaCristiana.estudioBiblico.lectorId),
          isAssigned: !!mw.vidaCristiana.estudioBiblico.lectorId,
          tag: 'Vida Cristiana',
        });
      }

      if (mw.finalPrayerId) {
        list.push({
          id: 'mw-oracion-fin',
          meetingType: 'entre_semana',
          roleTitle: 'Oración Final',
          brotherName: getPubName(mw.finalPrayerId),
          isAssigned: true,
          tag: 'Oración',
        });
      }
    }

    // Weekend
    const we = activeWeek.weekend;
    if (we) {
      list.push({
        id: 'we-pres',
        meetingType: 'fin_semana',
        roleTitle: 'Presidente',
        brotherName: getPubName(we.presidentId),
        isAssigned: !!we.presidentId,
        tag: 'Presidencia',
      });
      list.push({
        id: 'we-disc-pub',
        meetingType: 'fin_semana',
        roleTitle: 'Discurso Público',
        brotherName: we.publicTalkSpeaker || null,
        isAssigned: !!we.publicTalkSpeaker,
        partTheme: we.publicTalkTheme ? `#${we.publicTalkOutlineNumber || ''} ${we.publicTalkTheme}` : 'Discurso Público',
        tag: we.isVisitingSpeaker ? 'Orador Visitante' : 'Discurso',
      });
      list.push({
        id: 'we-at-cond',
        meetingType: 'fin_semana',
        roleTitle: 'Conductor de La Atalaya',
        brotherName: getPubName(we.atalayaConductorId),
        isAssigned: !!we.atalayaConductorId,
        partTheme: we.watchtowerTheme || 'Estudio de La Atalaya',
        tag: 'La Atalaya',
      });
      list.push({
        id: 'we-at-lec',
        meetingType: 'fin_semana',
        roleTitle: 'Lector de La Atalaya',
        brotherName: getPubName(we.atalayaLectorId),
        isAssigned: !!we.atalayaLectorId,
        tag: 'La Atalaya',
      });
    }

    // Duties
    const dutiesMidweek = mw?.duties || {};
    if (dutiesMidweek['deber_audio']?.[0]) {
      list.push({
        id: 'duty-audio',
        meetingType: 'deberes',
        roleTitle: 'Operador de Audio',
        brotherName: getPubName(dutiesMidweek['deber_audio'][0]),
        isAssigned: true,
        tag: 'Cabina',
      });
    }
    if (dutiesMidweek['deber_video']?.[0]) {
      list.push({
        id: 'duty-video',
        meetingType: 'deberes',
        roleTitle: 'Operador de Video',
        brotherName: getPubName(dutiesMidweek['deber_video'][0]),
        isAssigned: true,
        tag: 'Cabina',
      });
    }
    if (dutiesMidweek['deber_microfonos'] && dutiesMidweek['deber_microfonos'].length > 0) {
      list.push({
        id: 'duty-mics',
        meetingType: 'deberes',
        roleTitle: 'Micrófonos',
        brotherName: dutiesMidweek['deber_microfonos'].map((id) => getPubName(id)).filter(Boolean).join(', '),
        isAssigned: true,
        tag: 'Auditorio',
      });
    }
    if (dutiesMidweek['deber_acomodador'] && dutiesMidweek['deber_acomodador'].length > 0) {
      list.push({
        id: 'duty-acom',
        meetingType: 'deberes',
        roleTitle: 'Acomodadores',
        brotherName: dutiesMidweek['deber_acomodador'].map((id) => getPubName(id)).filter(Boolean).join(', '),
        isAssigned: true,
        tag: 'Acomodación',
      });
    }

    return list;
  }, [activeWeek, publishersMap]);

  // Filtered assignments for Board View
  const filteredAssignments = useMemo(() => {
    if (assignmentFilter === 'entre_semana') return upcomingAssignmentsList.filter((a) => a.meetingType === 'entre_semana');
    if (assignmentFilter === 'fin_semana') return upcomingAssignmentsList.filter((a) => a.meetingType === 'fin_semana');
    if (assignmentFilter === 'deberes') return upcomingAssignmentsList.filter((a) => a.meetingType === 'deberes');
    if (assignmentFilter === 'pendientes') return upcomingAssignmentsList.filter((a) => !a.isAssigned);
    return upcomingAssignmentsList;
  }, [upcomingAssignmentsList, assignmentFilter]);

  // Sound booth helpers
  const duties = activeWeek?.midweek?.duties || {};
  const audioBrother = duties['deber_audio']?.[0] ? getPubName(duties['deber_audio'][0]) : null;
  const videoBrother = duties['deber_video']?.[0] ? getPubName(duties['deber_video'][0]) : null;
  const micBrothers = duties['deber_microfonos']
    ? duties['deber_microfonos'].map((id) => getPubName(id)).filter(Boolean).join(', ')
    : null;
  const attendantBrothers = duties['deber_acomodador']
    ? duties['deber_acomodador'].map((id) => getPubName(id)).filter(Boolean).join(', ')
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* 1. HERO BANNER: THEOCRATIC HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-xs border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Panel General de la Congregación</span>
              <span className="text-indigo-400">•</span>
              <span className="font-bold">
                {activeWeek ? formatWeekRange(activeWeek.weekStartDate, activeWeek.weekEndDate) : 'Semana Actual'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {getFriendlyCongregationName(settings.congregationName, 'Congregación Central')}
            </h1>

            <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl leading-relaxed italic">
              «Confía en Jehová y haz el bien [...] deléitate en él, y él te concederá las peticiones de tu corazón». — Salmo 37:3, 4
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('programacion')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs sm:text-sm hover:bg-indigo-50 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Programa Semanal</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            {onOpenTimerModal && (
              <button
                onClick={onOpenTimerModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 text-white font-semibold text-xs sm:text-sm backdrop-blur-xs border border-indigo-400/30 transition-all active:scale-95 cursor-pointer"
                title="Abrir Cronómetro / Modo Atril con campana"
              >
                <Timer className="w-4 h-4 text-amber-400" />
                <span>Modo Atril</span>
              </button>
            )}

            {onOpenKioskModal && (
              <button
                onClick={onOpenKioskModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 font-semibold text-xs sm:text-sm backdrop-blur-xs border border-slate-700 transition-all active:scale-95 cursor-pointer"
                title="Abrir Pantalla del Salón / Modo Quiosco"
              >
                <Tv className="w-4 h-4 text-sky-400" />
                <span>Pantalla Salón</span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient background glow decoration */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. VIEW SWITCHER TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/90 p-3 sm:px-4 sm:py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {viewMode === 'tablero' ? 'Vista de Tablero Teocrático' : 'Vista General Detallada'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {viewMode === 'tablero'
                ? 'Tarjetas visuales y compactas: asignaciones, asistencia S-88 y territorios S-13'
                : 'Métricas completas de la congregación y desgloses ampliados'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => handleViewModeChange('tablero')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'tablero'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tablero</span>
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange('completa')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'completa'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Detallada</span>
          </button>
        </div>
      </div>

      {/* 3. VISTA DE TABLERO (DASHBOARD BOARD VIEW) */}
      {viewMode === 'tablero' && (
        <div className="space-y-6 animate-fade-in">
          {/* Executive Ribbon Bar (4 Quick KPI metrics) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setActiveTab('publicadores')}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all shadow-2xs"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Publicadores</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{publisherStats.total}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">{publisherStats.active} activos</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div
              onClick={() => setActiveTab('programacion')}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-all shadow-2xs"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Cobertura Programa</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{meetingAssignmentsStatus.percent}%</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block">
                  {meetingAssignmentsStatus.pendingCount === 0 ? 'Completo' : `${meetingAssignmentsStatus.pendingCount} pendientes`}
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            <div
              onClick={() => setActiveTab('asistencia')}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-amber-300 transition-all shadow-2xs"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Asistencia Semanal</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {attendanceStats.weekend > 0 ? attendanceStats.weekend : attendanceStats.midweek || '—'}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">
                  {attendanceStats.inPersonPct > 0 ? `${attendanceStats.inPersonPct}% presencial` : 'Por registrar'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>

            <div
              onClick={() => setActiveTab('territorios')}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-all shadow-2xs"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Territorios S-13</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{territoryStats.assigned}</span>
                <span className="text-[10px] text-slate-500 font-semibold block">
                  {territoryStats.overdue > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400 font-bold">{territoryStats.overdue} atrasados</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">{territoryStats.available} disponibles</span>
                  )}
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Map className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* MAIN BOARD (3 COLUMNS: Próximas Asignaciones, Asistencia Reciente, Territorios Pendientes) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
            {/* ======================================================== */}
            {/* COLUMNA 1: PRÓXIMAS ASIGNACIONES */}
            {/* ======================================================== */}
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs flex flex-col space-y-3.5">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Próximas Asignaciones
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Semana en curso • {activeWeek ? formatWeekRange(activeWeek.weekStartDate, activeWeek.weekEndDate) : 'Semana'}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {filteredAssignments.length} partes
                </span>
              </div>

              {/* Sub-filter chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                {(
                  [
                    { id: 'todas', label: 'Todas' },
                    { id: 'entre_semana', label: 'Entre Semana' },
                    { id: 'fin_semana', label: 'Fin de Semana' },
                    { id: 'deberes', label: 'Deberes' },
                    { id: 'pendientes', label: '⚠️ Vacantes' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setAssignmentFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 cursor-pointer transition-colors ${
                      assignmentFilter === f.id
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Cards List */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredAssignments.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 text-emerald-500" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {assignmentFilter === 'pendientes'
                        ? '¡Todas las partes están asignadas para esta semana!'
                        : 'No hay asignaciones para este filtro.'}
                    </p>
                  </div>
                ) : (
                  filteredAssignments.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveTab('programacion')}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        item.isAssigned
                          ? 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-700/70 hover:border-indigo-300 dark:hover:border-indigo-600'
                          : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {item.roleTitle}
                        </span>
                        {item.tag && (
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 ${
                              item.meetingType === 'entre_semana'
                                ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                                : item.meetingType === 'fin_semana'
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {item.tag}
                          </span>
                        )}
                      </div>

                      {item.partTheme && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-1.5">
                          {item.partTheme}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                        {item.isAssigned ? (
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold truncate">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] shrink-0">
                              {item.brotherName?.charAt(0) || 'H'}
                            </div>
                            <span className="truncate">{item.brotherName}</span>
                          </div>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Pendiente por asignar</span>
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 shrink-0 font-semibold">
                          {item.meetingType === 'entre_semana' ? `${settings.midweekMeetingDay || 'Mié'} ${settings.midweekMeetingTime || '19:00'}` : `${settings.weekendMeetingDay || 'Dom'} ${settings.weekendMeetingTime || '10:00'}`}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Column Footer */}
              <button
                type="button"
                onClick={() => setActiveTab('programacion')}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Ver programa completo en Programación</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ======================================================== */}
            {/* COLUMNA 2: ASISTENCIA RECIENTE (S-88) */}
            {/* ======================================================== */}
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs flex flex-col space-y-3.5">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Asistencia Reciente S-88
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Registro y tendencia presencial vs Zoom
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('asistencia')}
                  className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>S-88</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Attendance Quick Breakdown Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Entre Semana ({settings.midweekMeetingDay || 'Mié'})
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {attendanceStats.midweek > 0 ? attendanceStats.midweek : '—'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">asistentes</span>
                  </div>
                  {attendanceStats.midweek > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${Math.round((attendanceStats.midweekInPerson / attendanceStats.midweek) * 100)}%` }}
                          className="bg-emerald-500 h-full"
                          title="Presencial"
                        />
                        <div
                          style={{ width: `${Math.round((attendanceStats.midweekZoom / attendanceStats.midweek) * 100)}%` }}
                          className="bg-sky-400 h-full"
                          title="Zoom"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{attendanceStats.midweekInPerson} Pres.</span>
                        <span className="text-sky-600 dark:text-sky-400 font-semibold">{attendanceStats.midweekZoom} Zoom</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Fin de Semana ({settings.weekendMeetingDay || 'Dom'})
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {attendanceStats.weekend > 0 ? attendanceStats.weekend : '—'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">asistentes</span>
                  </div>
                  {attendanceStats.weekend > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${Math.round((attendanceStats.weekendInPerson / attendanceStats.weekend) * 100)}%` }}
                          className="bg-emerald-500 h-full"
                          title="Presencial"
                        />
                        <div
                          style={{ width: `${Math.round((attendanceStats.weekendZoom / attendanceStats.weekend) * 100)}%` }}
                          className="bg-sky-400 h-full"
                          title="Zoom"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{attendanceStats.weekendInPerson} Pres.</span>
                        <span className="text-sky-600 dark:text-sky-400 font-semibold">{attendanceStats.weekendZoom} Zoom</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ratio Presencial Health Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Ratio Presencial en el Salón</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">{attendanceStats.inPersonPct}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${attendanceStats.inPersonPct}%` }}
                    className="bg-emerald-500 h-full transition-all duration-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {attendanceStats.inPersonPct >= 75
                    ? 'Excelente compromiso presencial de la congregación.'
                    : 'Fomentando la asistencia presencial en el Salón del Reino.'}
                </p>
              </div>

              {/* Historical Recent Weeks Attendance List */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                  Historial de Últimas Semanas
                </span>

                <div className="space-y-1.5">
                  {recentWeeksAttendance.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-2 text-center">No hay registros de asistencia aún.</p>
                  ) : (
                    recentWeeksAttendance.map((rec) => (
                      <div
                        key={rec.id}
                        onClick={() => setActiveTab('asistencia')}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                            {formatWeekRange(rec.weekStartDate, rec.weekEndDate)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Entre: {rec.midweek.total} • Fin: {rec.weekend.total}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-white block">
                            {rec.totalAll} asis.
                          </span>
                          <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                            {rec.pctInPerson}% en el salón
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column Footer */}
              <button
                type="button"
                onClick={() => setActiveTab('asistencia')}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Registrar asistencia semanal S-88</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ======================================================== */}
            {/* COLUMNA 3: TERRITORIOS PENDIENTES (S-13) */}
            {/* ======================================================== */}
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs flex flex-col space-y-3.5">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Map className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Territorios Pendientes S-13
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Vencidos, en curso y disponibles
                    </p>
                  </div>
                </div>

                {territoryStats.overdue > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    {territoryStats.overdue} atrasados
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Al día
                  </span>
                )}
              </div>

              {/* Sub-filter chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                {(
                  [
                    { id: 'todos', label: 'Todos' },
                    { id: 'vencidos', label: '⚠️ Vencidos (>4m)' },
                    { id: 'asignados', label: 'Asignados' },
                    { id: 'disponibles', label: 'Disponibles' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTerritoryFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 cursor-pointer transition-colors ${
                      territoryFilter === f.id
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Territories Progress Bar */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  <span>Cobertura General</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{territoryStats.assignedPct}% en predicación</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden flex">
                  <div style={{ width: `${territoryStats.assignedPct}%` }} className="bg-emerald-500 h-full" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{territoryStats.assigned} asignados</span>
                  <span>{territoryStats.available} disponibles</span>
                  <span>{territoryStats.overdue} vencidos</span>
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {filteredTerritories.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 text-emerald-500" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {territoryFilter === 'vencidos'
                        ? '¡Excelente! No hay territorios con más de 4 meses sin devolver.'
                        : 'No hay territorios para este filtro.'}
                    </p>
                  </div>
                ) : (
                  filteredTerritories.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setActiveTab('territorios')}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        t.isOverdue
                          ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
                          : t.status === 'asignado'
                          ? 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-700/70 hover:border-emerald-300 dark:hover:border-emerald-600'
                          : 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/40 hover:border-emerald-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono font-black text-xs px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0 text-slate-900 dark:text-white">
                            #{t.number}
                          </span>
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {t.name}
                          </span>
                        </div>

                        {t.isOverdue ? (
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-rose-600 text-white shrink-0">
                            Atrasado
                          </span>
                        ) : t.status === 'asignado' ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shrink-0">
                            En curso
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                            Disponible
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                        <span className="truncate">{t.zone || 'Sin zona'} • {t.type}</span>
                        {t.estimatedHomes > 0 && <span>~{t.estimatedHomes} viv.</span>}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                        {t.status === 'asignado' && t.assigneeName ? (
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold truncate">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="truncate">{t.assigneeName}</span>
                          </div>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            Listo para entregar
                          </span>
                        )}

                        <span className={`text-[10px] font-mono ${t.isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400'}`}>
                          {t.daysAssigned > 0 ? `${t.daysAssigned} días` : (t.lastCompletedDate ? `Cubierto: ${t.lastCompletedDate.slice(5)}` : 'Nuevo')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Column Footer */}
              <button
                type="button"
                onClick={() => setActiveTab('territorios')}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Gestionar mapa y asignaciones S-13</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom Alerts & Shortcuts Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Conflict or S-89 reminder */}
            <div
              onClick={() => conflicts.length > 0 ? (onOpenConflictsModal ? onOpenConflictsModal() : setActiveTab('conflictos')) : setActiveTab('s89')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  conflicts.length > 0
                    ? 'bg-rose-50 dark:bg-rose-950 text-rose-600'
                    : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600'
                }`}>
                  {conflicts.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    {conflicts.length > 0 ? `${conflicts.length} Conflictos Detectados` : `${s89Slips.length} Hojas S-89 Listas`}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {conflicts.length > 0 ? 'Cruces de asignación que requieren revisión' : 'Formato 4-en-1 o envío por WhatsApp'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Cleaning Group info */}
            <div
              onClick={() => setActiveTab('limpieza_deberes')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold">
                  <Brush className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    {currentCleaningGroup ? `Limpieza: ${currentCleaningGroup.name}` : 'Limpieza del Salón'}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {cleaningOverseerName ? `Supervisión: ${cleaningOverseerName}` : 'Turno de aseo semanal'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Finances quick link */}
            <div
              onClick={() => setActiveTab('cuentas')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-all shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    Cuentas S-26: ${accountBalance.toFixed(2)}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Balance disponible de la congregación
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      )}

      {/* 4. VISTA DETALLADA (FULL TRADITIONAL DETAILED VIEW) */}
      {viewMode === 'completa' && (
        <div className="space-y-6 animate-fade-in">
          {/* 4 STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Publicadores */}
            <div
              onClick={() => setActiveTab('publicadores')}
              className="group bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Publicadores</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{publisherStats.total}</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{publisherStats.active} activos</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                {publisherStats.elders} ancianos • {publisherStats.servants} siervos • {publisherStats.regularPioneers} prec. reg.
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                <span>Ver directorio</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Programa Semanal */}
            <div
              onClick={() => setActiveTab('programacion')}
              className="group bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Programa Semanal</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{meetingAssignmentsStatus.percent}%</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">asignado</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                {meetingAssignmentsStatus.pendingCount === 0
                  ? 'Todas las partes cubiertas'
                  : `${meetingAssignmentsStatus.pendingCount} partes vacantes por asignar`}
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-bold">
                <span>Abrir reunión</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Territorios */}
            <div
              onClick={() => setActiveTab('territorios')}
              className="group bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Territorios S-13</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <Map className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{territoryStats.assigned}</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">de {territoryStats.total} asignados</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                {territoryStats.overdue > 0 ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">{territoryStats.overdue} atrasados ({'>'}4 meses)</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{territoryStats.available} disponibles para asignar</span>
                )}
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <span>Gestionar mapa</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 4: Asistencia */}
            <div
              onClick={() => setActiveTab('asistencia')}
              className="group bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-500 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Asistencia S-88</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {attendanceStats.weekend > 0 ? attendanceStats.weekend : attendanceStats.midweek || '—'}
                </span>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">asistentes</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                {attendanceStats.inPersonPct > 0 ? `${attendanceStats.inPersonPct}% presencial en el Salón` : 'Registro listo para cargar'}
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-bold">
                <span>Ver promedios</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* MAIN SECTION: THIS WEEK'S MEETINGS AT A GLANCE + ACTION ALERTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 Cols): Live Week Schedule Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card: Reunión Entre Semana */}
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Reunión de Entre Semana</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Vida y Ministerio Cristianos • {activeWeek?.midweek?.bibleReading || 'Lectura de la Biblia'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('programacion')}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Editar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Presidente</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {getPubName(activeWeek?.midweek?.presidentId) || 'Pendiente por asignar'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 flex items-start gap-2.5">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Discurso de Tesoros (10 min)</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {getPubName(activeWeek?.midweek?.tesoros?.discurso?.publisherId) || 'Pendiente por asignar'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Perlas Escondidas (10 min)</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {getPubName(activeWeek?.midweek?.tesoros?.perlas?.publisherId) || 'Pendiente por asignar'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 flex items-start gap-2.5">
                    <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Lectura de la Biblia (4 min)</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {getPubName(activeWeek?.midweek?.tesoros?.lecturaBiblia?.publisherId) || 'Pendiente por asignar'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 flex items-start gap-2.5 sm:col-span-2">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Estudio Bíblico de la Congregación</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        Conductor: {getPubName(activeWeek?.midweek?.vidaCristiana?.estudioBiblico?.conductorId) || 'Pendiente'} • Lector: {getPubName(activeWeek?.midweek?.vidaCristiana?.estudioBiblico?.lectorId) || 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sound booth and platform crew */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-400 uppercase text-[9px]">Cabina y Sonido:</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 font-medium">
                    Audio: {audioBrother || '—'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 font-medium">
                    Video: {videoBrother || '—'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 font-medium">
                    Micrófonos: {micBrothers || '—'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 font-medium">
                    Acomodador: {attendantBrothers || '—'}
                  </span>
                </div>
              </div>

              {/* Card: Reunión de Fin de Semana */}
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Reunión de Fin de Semana</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Discurso Público y Estudio de La Atalaya</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('programacion')}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Editar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Public Talk */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/60 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-extrabold text-[10px] uppercase">
                          Discurso #{activeWeek?.weekend?.publicTalkOutlineNumber || 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {activeWeek?.weekend?.publicTalkTheme || 'Título del discurso público'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">
                        Orador: <strong className="text-slate-900 dark:text-white">{activeWeek?.weekend?.publicTalkSpeaker || 'Pendiente'}</strong>
                        {activeWeek?.weekend?.visitingSpeakerCongregation && (
                          <span className="text-slate-500"> ({activeWeek.weekend.visitingSpeakerCongregation})</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('discursos')}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] hover:bg-emerald-50 dark:hover:bg-slate-700 shrink-0 cursor-pointer"
                    >
                      Ver Catálogo
                    </button>
                  </div>

                  {/* Watchtower */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/60 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-extrabold text-[10px] uppercase">
                          La Atalaya
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {activeWeek?.weekend?.watchtowerTheme || 'Tema de La Atalaya semanal'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">
                        Conductor: <strong className="text-slate-900 dark:text-white">{getPubName(activeWeek?.weekend?.atalayaConductorId) || 'Pendiente'}</strong> • Lector: <strong className="text-slate-900 dark:text-white">{getPubName(activeWeek?.weekend?.atalayaLectorId) || 'Pendiente'}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (1 Col): Priorities, Alerts & Fast Actions */}
            <div className="space-y-6">
              {/* Action Center / Pending Tasks */}
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-xs">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Asuntos Pendientes</span>
                  {conflicts.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black text-xs">
                      {conflicts.length} alertas
                    </span>
                  )}
                </h3>

                <div className="space-y-2.5 text-xs">
                  {/* Conflict Alert */}
                  {conflicts.length > 0 ? (
                    <div
                      onClick={() => onOpenConflictsModal ? onOpenConflictsModal() : setActiveTab('conflictos')}
                      className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-3 cursor-pointer hover:bg-rose-100/70 transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold block">Se detectaron {conflicts.length} conflictos</span>
                        <p className="text-[11px] text-rose-700 dark:text-rose-300">Cruces de asignaciones en la reunión.</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-rose-500 shrink-0" />
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-xs">Sin conflictos detectados en esta semana</span>
                    </div>
                  )}

                  {/* S-89 Slips Ready */}
                  <div
                    onClick={() => setActiveTab('s89')}
                    className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 flex items-start gap-3 cursor-pointer hover:bg-indigo-100/70 transition-colors"
                  >
                    <Award className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold block">{s89Slips.length} Hojas S-89 preparadas</span>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-300">Listas para imprimir en 4-en-1 o enviar por WhatsApp.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0" />
                  </div>

                  {/* Overdue Territories Alert */}
                  {territoryStats.overdue > 0 && (
                    <div
                      onClick={() => setActiveTab('territorios')}
                      className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3 cursor-pointer hover:bg-amber-100/70 transition-colors"
                    >
                      <Map className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold block">{territoryStats.overdue} Territorios atrasados</span>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300">Llevan más de 4 meses asignados.</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
                    </div>
                  )}

                  {/* Cleaning Group */}
                  {currentCleaningGroup && (
                    <div
                      onClick={() => setActiveTab('limpieza_deberes')}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-start gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Brush className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold block">Limpieza del Salón: {currentCleaningGroup.name}</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {cleaningOverseerName ? `Superintendente: ${cleaningOverseerName}` : 'Turno semanal de limpieza'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  )}

                  {/* Finances */}
                  <div
                    onClick={() => setActiveTab('cuentas')}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-start gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Landmark className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold block">Cuentas: ${accountBalance.toFixed(2)}</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Balance operativo disponible</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Quick Theocratic Shortcuts */}
              <div className="bg-linear-to-b from-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800">
                <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-300 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Accesos Rápidos Populares</span>
                </h3>

                <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('s89')}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer"
                  >
                    <Printer className="w-5 h-5 text-indigo-300" />
                    <span>Imprimir S-89</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('asistencia')}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer"
                  >
                    <BarChart3 className="w-5 h-5 text-emerald-300" />
                    <span>Asistencia S-88</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('territorios')}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer"
                  >
                    <Map className="w-5 h-5 text-sky-300" />
                    <span>Territorios Móvil</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('cuentas')}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer"
                  >
                    <Landmark className="w-5 h-5 text-amber-300" />
                    <span>Cuentas S-26</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
