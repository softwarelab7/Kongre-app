// src/components/ResumenInicioTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from './Navbar';
import { ResponsiveServiceChart } from './charts/ResponsiveServiceChart';
import { ResponsiveAttendanceChart } from './charts/ResponsiveAttendanceChart';
import { PublisherPinsModal } from './PublisherPinsModal';
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
  Shield,
  ChevronRight,
  Mic,
  Brush,
  BookOpen,
  LayoutGrid,
  Clock,
  TrendingUp,
  UserCheck,
  Heart,
  Zap,
  MapPin,
  Check,
  KeyRound,
} from 'lucide-react';

interface ResumenInicioTabProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenTimerModal?: () => void;
  onOpenKioskModal?: () => void;
  onOpenConflictsModal?: () => void;
  onOpenPinsModal?: () => void;
}

export const ResumenInicioTab: React.FC<ResumenInicioTabProps> = ({
  setActiveTab,
  onOpenTimerModal,
  onOpenKioskModal,
  onOpenConflictsModal,
  onOpenPinsModal,
}) => {
  const [internalPinsModalOpen, setInternalPinsModalOpen] = useState(false);
  const handleOpenPins = () => {
    if (onOpenPinsModal) {
      onOpenPinsModal();
    } else {
      setInternalPinsModalOpen(true);
    }
  };

  const {
    weeks,
    currentWeek,
    publishers,
    publishersMap,
    territories,
    conflicts,
    settings,
    monthlyReports,
  } = useCongregation();

  const { publisherPinsList } = useAuth();
  const publisherPinsCount = useMemo(() => {
    return publishers.filter(
      (p) =>
        Boolean(p.personalPin) ||
        publisherPinsList.some(
          (rec) =>
            (rec.publisherId === p.id || rec.name.toLowerCase().trim() === p.name.toLowerCase().trim()) &&
            Boolean(rec.pin)
        )
    ).length;
  }, [publishers, publisherPinsList]);

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

    const total = publishers.length > 0 ? publishers.length : 1;
    const active = activePublishers > 0 ? activePublishers : 1;
    const activityPct = total > 0 ? Math.round((active / total) * 100) : 100;

    return {
      total,
      active,
      activityPct,
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

    if (activeWeek?.attendance) {
      recentMidweek = activeWeek.attendance.midweek?.total || 0;
      recentWeekend = activeWeek.attendance.weekend?.total || 0;
    }

    return {
      midweek: recentMidweek,
      weekend: recentWeekend,
    };
  }, [activeWeek]);

  // Territories status
  const territoriesStats = useMemo(() => {
    const total = territories.length;
    const assigned = territories.filter((t) => t.status === 'asignado').length;
    const overdue = territories.filter(
      (t) =>
        t.status === 'vencido' ||
        (t.status === 'asignado' && t.dueDate && new Date(t.dueDate) < new Date())
    ).length;
    return { total, assigned, overdue };
  }, [territories]);

  // Time range filter for activity chart
  const [chartRange, setChartRange] = useState<'6 meses' | '12 meses'>('6 meses');

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* =========================================================================
          1. HEADER TITLE (EXACT REFERENCE: Panorama General)
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs">
            <LayoutGrid className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 leading-tight">
              <span>Panorama</span>
              <span className="text-indigo-600 dark:text-indigo-400">General</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Sincronización activa • Datos en tiempo real
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenPins}
          className="self-start sm:self-auto flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs font-bold shadow-2xs transition-all cursor-pointer group"
          title="Ver directorio de PINs de los publicadores y la congregación"
        >
          <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
            <KeyRound className="w-3.5 h-3.5" />
          </div>
          <span>Ver PINs</span>
          <span className="bg-amber-200/80 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
            {publisherPinsCount} activos
          </span>
        </button>
      </div>

      {/* =========================================================================
          2. TOP 5 KPI SUMMARY CARDS (EXACT REFERENCE DESIGN)
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: TOTAL */}
        <div
          onClick={() => setActiveTab('publicadores')}
          className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              TOTAL
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 group-hover:scale-110 transition-transform flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5">
            {publisherStats.total}
          </div>
          <div className="text-xs font-semibold text-emerald-500 mt-2 flex items-center gap-1">
            <span>{publisherStats.activityPct}% Actividad</span>
          </div>
        </div>

        {/* Card 2: ANCIANOS */}
        <div
          onClick={() => setActiveTab('publicadores')}
          className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              ANCIANOS
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 group-hover:scale-110 transition-transform flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5">
            {publisherStats.elders}
          </div>
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
            Cuerpo
          </div>
        </div>

        {/* Card 3: PRECURSORES */}
        <div
          onClick={() => setActiveTab('publicadores')}
          className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              PRECURSORES
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 group-hover:scale-110 transition-transform flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5">
            {publisherStats.regularPioneers}
          </div>
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
            Regulares
          </div>
        </div>

        {/* Card 4: ASISTENCIA */}
        <div
          onClick={() => setActiveTab('asistencia')}
          className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              ASISTENCIA
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 group-hover:scale-110 transition-transform flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5">
            {attendanceStats.midweek}
          </div>
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
            Media
          </div>
        </div>

        {/* Card 5: INFORMES */}
        <div
          onClick={() => setActiveTab('informes_servicio')}
          className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              INFORMES
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 group-hover:scale-110 transition-transform flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5">
            0
          </div>
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
            S-4 del Mes
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MIDDLE CHARTS SECTION (Responsive, Beautiful, Non-stretched)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left Chart: Actividad de Servicio del Campo (Horas y Estudios) */}
        <div className="lg:col-span-8">
          <ResponsiveServiceChart
            publishers={publishers}
            monthlyReports={monthlyReports}
          />
        </div>

        {/* Right Chart: Asistencia a Reuniones */}
        <div className="lg:col-span-4">
          <ResponsiveAttendanceChart
            weeks={weeks}
          />
        </div>
      </div>

      {/* =========================================================================
          4. BOTTOM ROW (Resumen de Publicadores & Acciones Rápidas)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Card 1: Resumen de Publicadores */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Resumen de Publicadores
                </h3>
                <p className="text-[11px] text-slate-400">
                  Distribución teocrática de responsabilidades
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('publicadores')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Directorio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Ancianos
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">
                {publisherStats.elders}
              </span>
              <span className="text-[10px] text-slate-500">Cuerpo activo</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Siervos
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">
                {publisherStats.servants}
              </span>
              <span className="text-[10px] text-slate-500">Ministeriales</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Precursores
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">
                {publisherStats.regularPioneers}
              </span>
              <span className="text-[10px] text-slate-500">Regulares</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">
                {publisherStats.total}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                100% actividad
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Acciones Rápidas */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Acciones Rápidas
              </h3>
              <p className="text-[11px] text-slate-400">Accesos directos teocráticos</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('programacion')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">Programa</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('asistencia')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">Asistencia</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('s89')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">Hojas S-89</span>
            </button>

            {onOpenTimerModal && (
              <button
                type="button"
                onClick={onOpenTimerModal}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
              >
                <Timer className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="truncate">Modo Atril</span>
              </button>
            )}

            {onOpenKioskModal && (
              <button
                type="button"
                onClick={onOpenKioskModal}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
              >
                <Tv className="w-4 h-4 text-sky-500 shrink-0" />
                <span className="truncate">Pantalla Salón</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('territorios')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="truncate">Territorios</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPins}
              className="col-span-2 sm:col-span-1 flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 hover:text-amber-700 dark:hover:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 text-xs font-bold text-amber-800 dark:text-amber-200 transition-all cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">Ver PINs</span>
              <span className="ml-auto text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded-full font-mono">
                {publisherPinsCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Publisher PINs Modal */}
      <PublisherPinsModal
        isOpen={internalPinsModalOpen}
        onClose={() => setInternalPinsModalOpen(false)}
      />
    </div>
  );
};
