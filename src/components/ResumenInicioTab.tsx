// src/components/ResumenInicioTab.tsx
import React, { useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from './Navbar';
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

  // Active week
  const activeWeek = currentWeek || weeks[0];

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
    let recentWeekend = 0;
    let recentZoom = 0;
    let recentInPerson = 0;

    if (activeWeek?.attendance) {
      recentMidweek = activeWeek.attendance.midweek.total;
      recentWeekend = activeWeek.attendance.weekend.total;
      recentZoom = activeWeek.attendance.midweek.zoom + activeWeek.attendance.weekend.zoom;
      recentInPerson =
        activeWeek.attendance.midweek.inPerson + activeWeek.attendance.weekend.inPerson;
    }

    const totalRecent = recentInPerson + recentZoom;
    const inPersonPct = totalRecent > 0 ? Math.round((recentInPerson / totalRecent) * 100) : 0;

    return {
      midweek: recentMidweek,
      weekend: recentWeekend,
      inPersonPct,
    };
  }, [activeWeek]);

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
    if (!activeWeek) return { complete: false, totalCount: 0, pendingCount: 0, percent: 100 };
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

  // Helper to format assigned publisher names
  const getPubName = (id?: string) => {
    if (!id) return null;
    return publishersMap.get(id)?.name || null;
  };

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
              {settings.congregationName || 'Congregación Central'}
            </h1>

            <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl leading-relaxed italic">
              «Confía en Jehová y haz el bien [...] deléitate en él, y él te concederá las peticiones de tu corazón». — Salmo 37:3, 4
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('programacion')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs sm:text-sm hover:bg-indigo-50 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Ver Programa Semanal</span>
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

      {/* 2. STATS OVERVIEW CARDS (HEALTH OF CONGREGATION) */}
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

        {/* Card 4: Asistencia / Finanzas */}
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

      {/* 3. MAIN SECTION: THIS WEEK'S MEETINGS AT A GLANCE + ACTION ALERTS */}
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
  );
};
