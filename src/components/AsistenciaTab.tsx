// src/components/AsistenciaTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { MeetingAttendance, WeekSchedule } from '../types';
import {
  Users,
  Video,
  BarChart3,
  TrendingUp,
  Calendar,
  Save,
  Copy,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Sparkles,
  Plus,
  Minus,
  RotateCcw,
  Volume2,
  X,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
  Upload,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { AttendanceTrendsDashboard } from './charts/AttendanceTrendsDashboard';
import { LocalOfficialFormsModal } from './LocalOfficialFormsCenter';

export const AsistenciaTab: React.FC = () => {
  const { weeks, updateMeetingAttendance, settings, currentWeek } = useCongregation();
  const [mainView, setMainView] = useState<'dashboard' | 'registro'>('dashboard');
  const [isS88ModalOpen, setIsS88ModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    // Current year-month (e.g. 2026-10)
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'cards' | 'table'>('cards');
  
  // Quick Live Counter Modal State
  const [isCounterOpen, setIsCounterOpen] = useState(false);
  const [counterTarget, setCounterTarget] = useState<{
    weekId: string;
    meetingType: 'midweek' | 'weekend';
    channel: 'inPerson' | 'zoom';
  }>({
    weekId: currentWeek?.id || '',
    meetingType: 'midweek',
    channel: 'inPerson',
  });

  // Group weeks by month
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    weeks.forEach((w) => {
      const monthPrefix = w.weekStartDate.substring(0, 7);
      set.add(monthPrefix);
    });
    return Array.from(set).sort();
  }, [weeks]);

  // Weeks belonging to selected month
  const monthWeeks = useMemo(() => {
    return weeks.filter((w) => w.weekStartDate.startsWith(selectedMonth));
  }, [weeks, selectedMonth]);

  // Last 4 weeks comparative data for the Recharts LineChart
  const lastFourWeeksTrend = useMemo(() => {
    const sorted = [...weeks].sort((a, b) =>
      (a.weekStartDate || a.id).localeCompare(b.weekStartDate || b.id)
    );
    const recorded = sorted.filter(
      (w) =>
        (w.attendance?.midweek?.total || 0) > 0 ||
        (w.attendance?.weekend?.total || 0) > 0
    );

    let targetWeeks: WeekSchedule[] = [];
    const isSamplePreview = recorded.length === 0;

    if (recorded.length >= 4) {
      targetWeeks = recorded.slice(-4);
    } else if (monthWeeks.length >= 4) {
      targetWeeks = monthWeeks.slice(-4);
    } else {
      targetWeeks = sorted.slice(-4);
    }

    const fallback = [
      { mwP: 54, mwZ: 16, weP: 66, weZ: 16 },
      { mwP: 57, mwZ: 15, weP: 69, weZ: 17 },
      { mwP: 55, mwZ: 17, weP: 68, weZ: 16 },
      { mwP: 61, mwZ: 15, weP: 74, weZ: 17 },
    ];

    const data = targetWeeks.map((w, idx) => {
      const fb = fallback[idx % fallback.length];
      const mwInPerson = isSamplePreview ? fb.mwP : w.attendance?.midweek?.inPerson || 0;
      const mwZoom = isSamplePreview ? fb.mwZ : w.attendance?.midweek?.zoom || 0;
      const midweek = isSamplePreview
        ? fb.mwP + fb.mwZ
        : w.attendance?.midweek?.total || mwInPerson + mwZoom;

      const weInPerson = isSamplePreview ? fb.weP : w.attendance?.weekend?.inPerson || 0;
      const weZoom = isSamplePreview ? fb.weZ : w.attendance?.weekend?.zoom || 0;
      const weekend = isSamplePreview
        ? fb.weP + fb.weZ
        : w.attendance?.weekend?.total || weInPerson + weZoom;

      const activeCount = (midweek > 0 ? 1 : 0) + (weekend > 0 ? 1 : 0);
      const promedio = activeCount > 0 ? Math.round((midweek + weekend) / activeCount) : 0;

      const dateParts = (w.weekStartDate || '').split('-');
      const shortDate =
        dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : `S${idx + 1}`;

      return {
        weekId: w.id,
        name: `Sem ${idx + 1} (${shortDate})`,
        shortLabel: `Semana ${idx + 1}`,
        date: w.weekStartDate,
        midweek,
        weekend,
        promedio,
        presencial: mwInPerson + weInPerson,
        zoom: mwZoom + weZoom,
      };
    });

    const avgMidweek =
      data.length > 0
        ? Math.round(data.reduce((acc, d) => acc + d.midweek, 0) / data.length)
        : 0;
    const avgWeekend =
      data.length > 0
        ? Math.round(data.reduce((acc, d) => acc + d.weekend, 0) / data.length)
        : 0;
    const avgGeneral =
      data.length > 0
        ? Math.round(data.reduce((acc, d) => acc + d.promedio, 0) / data.length)
        : 0;
    const delta =
      data.length >= 2 ? data[data.length - 1].promedio - data[0].promedio : 0;

    return {
      data,
      isSamplePreview,
      avgMidweek,
      avgWeekend,
      avgGeneral,
      delta,
    };
  }, [weeks, monthWeeks]);

  // Monthly metrics computation
  const metrics = useMemo(() => {
    let midweekTotal = 0;
    let midweekInPerson = 0;
    let midweekZoom = 0;
    let midweekCount = 0;

    let weekendTotal = 0;
    let weekendInPerson = 0;
    let weekendZoom = 0;
    let weekendCount = 0;

    let maxAttendance = 0;

    monthWeeks.forEach((w) => {
      const att = w.attendance;
      if (att) {
        if (att.midweek.total > 0) {
          midweekTotal += att.midweek.total;
          midweekInPerson += att.midweek.inPerson;
          midweekZoom += att.midweek.zoom;
          midweekCount++;
          if (att.midweek.total > maxAttendance) maxAttendance = att.midweek.total;
        }

        if (att.weekend.total > 0) {
          weekendTotal += att.weekend.total;
          weekendInPerson += att.weekend.inPerson;
          weekendZoom += att.weekend.zoom;
          weekendCount++;
          if (att.weekend.total > maxAttendance) maxAttendance = att.weekend.total;
        }
      }
    });

    const avgMidweek = midweekCount > 0 ? Math.round(midweekTotal / midweekCount) : 0;
    const avgWeekend = weekendCount > 0 ? Math.round(weekendTotal / weekendCount) : 0;
    const avgOverall =
      midweekCount + weekendCount > 0
        ? Math.round((midweekTotal + weekendTotal) / (midweekCount + weekendCount))
        : 0;

    const totalAttendance = midweekTotal + weekendTotal;
    const totalInPerson = midweekInPerson + weekendInPerson;
    const totalZoom = midweekZoom + weekendZoom;

    const inPersonPct = totalAttendance > 0 ? Math.round((totalInPerson / totalAttendance) * 100) : 0;
    const zoomPct = totalAttendance > 0 ? Math.round((totalZoom / totalAttendance) * 100) : 0;

    return {
      midweekCount,
      weekendCount,
      avgMidweek,
      avgWeekend,
      avgOverall,
      maxAttendance,
      inPersonPct,
      zoomPct,
      totalAttendance,
    };
  }, [monthWeeks]);

  // Handle single week attendance update
  const handleAttendanceChange = (
    weekId: string,
    meetingType: 'midweek' | 'weekend',
    field: 'inPerson' | 'zoom',
    value: number
  ) => {
    const week = weeks.find((w) => w.id === weekId);
    if (!week) return;

    const currentAtt: MeetingAttendance = week.attendance || {
      weekId,
      midweek: { inPerson: 0, zoom: 0, total: 0 },
      weekend: { inPerson: 0, zoom: 0, total: 0 },
    };

    const updatedAtt: MeetingAttendance = JSON.parse(JSON.stringify(currentAtt));
    updatedAtt[meetingType][field] = Math.max(0, value);
    updatedAtt[meetingType].total =
      updatedAtt[meetingType].inPerson + updatedAtt[meetingType].zoom;

    updateMeetingAttendance(weekId, updatedAtt);
  };

  // Copy secretary report text
  const handleCopySecretaryReport = () => {
    let report = `📊 INFORME MENSUAL DE ASISTENCIA A LAS REUNIONES\n`;
    report += `Congregación: ${settings.congregationName}\n`;
    report += `Mes: ${selectedMonth}\n`;
    report += `----------------------------------------\n\n`;

    monthWeeks.forEach((w, idx) => {
      const att = w.attendance;
      const mwTotal = att ? att.midweek.total : 0;
      const mwP = att ? att.midweek.inPerson : 0;
      const mwZ = att ? att.midweek.zoom : 0;

      const weTotal = att ? att.weekend.total : 0;
      const weP = att ? att.weekend.inPerson : 0;
      const weZ = att ? att.weekend.zoom : 0;

      report += `Semana ${idx + 1} (${w.weekStartDate}):\n`;
      report += `  • Entre Semana (${settings.midweekMeetingDay}): Total ${mwTotal} (Presencial: ${mwP} | Zoom: ${mwZ})\n`;
      report += `  • Fin de Semana (${settings.weekendMeetingDay}): Total ${weTotal} (Presencial: ${weP} | Zoom: ${weZ})\n\n`;
    });

    report += `----------------------------------------\n`;
    report += `PROMEDIOS MENSUALES:\n`;
    report += `  • Promedio Entre Semana: ${metrics.avgMidweek}\n`;
    report += `  • Promedio Fin de Semana: ${metrics.avgWeekend}\n`;
    report += `  • Promedio General de Congregación: ${metrics.avgOverall}\n`;
    report += `  • Asistencia Máxima: ${metrics.maxAttendance}\n`;
    report += `  • Proporción: ${metrics.inPersonPct}% Presencial / ${metrics.zoomPct}% Zoom\n`;

    navigator.clipboard.writeText(report);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Barra Unificada de Vistas y Acciones de Asistencia */}
      <div className="kg-glass-surface kg-sheen-top p-3.5 sm:p-4 rounded-3xl border border-zinc-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl transition-all">
        {/* View Switcher Pills */}
        <div className="grid grid-cols-2 sm:flex items-center p-1.5 bg-zinc-200/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 rounded-2xl text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setMainView('dashboard')}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              mainView === 'dashboard'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Dashboard Visual</span>
          </button>
          <button
            type="button"
            onClick={() => setMainView('registro')}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              mainView === 'registro'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Registro Semanal</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsS88ModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200/80 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/10 font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">Cargar S-88 PDF</span>
          </button>

          <button
            onClick={() => {
              if (!counterTarget.weekId && monthWeeks.length > 0) {
                setCounterTarget((prev) => ({ ...prev, weekId: monthWeeks[0].id }));
              }
              setIsCounterOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-md shadow-indigo-500/25 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Contador en Vivo</span>
          </button>
        </div>
      </div>

      {/* 1. VISUAL DASHBOARD VIEW: RECHARTS HISTORICAL SERVICE YEAR TRENDS */}
      {mainView === 'dashboard' && (
        <AttendanceTrendsDashboard
          weeks={weeks}
          settings={settings}
          onUpdateAttendance={updateMeetingAttendance}
          onSelectMonth={(monthKey) => {
            setSelectedMonth(monthKey);
            setMainView('registro');
          }}
        />
      )}

      {/* 2. REGISTRO VIEW: MONTHLY S-88 CARDS AND TABLE */}
      {mainView === 'registro' && (
        <div className="space-y-6 animate-fade-in">
          {/* Month selector & Secretary action bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 shadow-xl transition-all">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Mes seleccionado:</span>
              <div className="flex items-center gap-2 bg-zinc-100/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 px-3.5 py-2 rounded-2xl shadow-inner">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-zinc-900 dark:text-white font-bold text-xs sm:text-sm outline-hidden cursor-pointer font-mono tabular-nums"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m} className="text-zinc-900 bg-white dark:bg-[#18181F] dark:text-white">
                      Mes: {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMainView('dashboard')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Ver gráficos anuales</span>
                <span>↗</span>
              </button>

              <button
                onClick={handleCopySecretaryReport}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {copiedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>¡Informe Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Informe Mes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* KPI Cards Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="kg-card-bento kg-sheen-top rounded-3xl p-5 border border-zinc-200/80 dark:border-white/10 transition-all hover:border-indigo-500/40 hover:shadow-xl shadow-md">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Promedio Entre Semana</span>
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white font-mono tabular-nums tracking-tight">{metrics.avgMidweek}</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span>{settings.midweekMeetingDay} • <span className="font-mono tabular-nums font-semibold">{metrics.midweekCount}</span> reuniones</span>
              </p>
            </div>

            <div className="kg-card-bento kg-sheen-top rounded-3xl p-5 border border-zinc-200/80 dark:border-white/10 transition-all hover:border-blue-500/40 hover:shadow-xl shadow-md">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Promedio Fin de Semana</span>
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white font-mono tabular-nums tracking-tight">{metrics.avgWeekend}</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>{settings.weekendMeetingDay} • <span className="font-mono tabular-nums font-semibold">{metrics.weekendCount}</span> reuniones</span>
              </p>
            </div>

            <div className="kg-card-bento kg-sheen-top rounded-3xl p-5 border border-zinc-200/80 dark:border-white/10 transition-all hover:border-emerald-500/40 hover:shadow-xl shadow-md">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Promedio General</span>
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white font-mono tabular-nums tracking-tight">{metrics.avgOverall}</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Máxima del mes: <strong className="text-zinc-900 dark:text-white font-mono tabular-nums">{metrics.maxAttendance}</strong>
              </p>
            </div>

            <div className="kg-card-bento kg-sheen-top rounded-3xl p-5 border border-zinc-200/80 dark:border-white/10 transition-all hover:border-purple-500/40 hover:shadow-xl shadow-md">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Presencial vs Zoom</span>
                <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white font-mono tabular-nums tracking-tight">
                {metrics.inPersonPct}% / {metrics.zoomPct}%
              </div>
              {/* Progress bar */}
              <div className="w-full bg-zinc-200/70 dark:bg-white/10 h-2.5 rounded-full mt-2.5 overflow-hidden flex border border-zinc-300/40 dark:border-white/10">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 h-full transition-all"
                  style={{ width: `${metrics.inPersonPct}%` }}
                  title={`Presencial: ${metrics.inPersonPct}%`}
                />
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all"
                  style={{ width: `${metrics.zoomPct}%` }}
                  title={`Zoom: ${metrics.zoomPct}%`}
                />
              </div>
            </div>
          </div>

      {/* Gráfico de Líneas Comparativo de las Últimas 4 Semanas (Recharts) */}
      <div className="kg-card-bento kg-sheen-top rounded-3xl border border-zinc-200/80 dark:border-white/10 p-5 sm:p-6 shadow-xl transition-all space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/60 dark:border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-zinc-900 dark:text-white text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tendencia Histórica: Comparativa de las Últimas 4 Semanas</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 font-mono tabular-nums">
                Promedio General: {lastFourWeeksTrend.avgGeneral}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Comparación directa de asistencia en las últimas 4 semanas entre Entre Semana ({settings.midweekMeetingDay}), Fin de Semana ({settings.weekendMeetingDay}) y Promedio Semanal.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 font-mono tabular-nums">
              {lastFourWeeksTrend.delta >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              )}
              <span>
                {lastFourWeeksTrend.delta >= 0
                  ? `+${lastFourWeeksTrend.delta}`
                  : lastFourWeeksTrend.delta}{' '}
                en 4 sem.
              </span>
            </span>
          </div>
        </div>

        <div className="h-[260px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={lastFourWeeksTrend.data}
              margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
              <XAxis
                dataKey="name"
                fontSize={12}
                tickLine={false}
                stroke="#A1A1AA"
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                stroke="#A1A1AA"
                domain={[0, (dataMax: number) => Math.max(90, Math.ceil(dataMax * 1.15))]}
              />
              <Tooltip contentStyle={{ backgroundColor: '#18181F', borderColor: '#27272A', color: '#F4F4F5', borderRadius: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {lastFourWeeksTrend.avgGeneral > 0 && (
                <ReferenceLine
                  y={lastFourWeeksTrend.avgGeneral}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                />
              )}
              <Line
                type="monotone"
                dataKey="midweek"
                name={`Entre Semana (${settings.midweekMeetingDay})`}
                stroke="#6366F1"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="weekend"
                name={`Fin de Semana (${settings.weekendMeetingDay})`}
                stroke="#0284c7"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="promedio"
                name="Promedio Semanal"
                stroke="#059669"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Week by Week Inputs Section: Cards View (Default on mobile) or Table View */}
      <div className="kg-glass-surface kg-sheen-top rounded-3xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-xl transition-all">
        <div className="p-4 sm:p-5 border-b border-zinc-200/70 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-100/50 dark:bg-white/[0.02]">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white text-base">
              Registro Semanal de Asistencia • <span className="font-mono tabular-nums">{selectedMonth}</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Ingrese los números de cada reunión; el total se calcula automáticamente.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View layout toggle */}
            <div className="flex items-center p-1 bg-zinc-200/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 rounded-2xl text-xs font-bold gap-1">
              <button
                onClick={() => setLayoutMode('cards')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  layoutMode === 'cards'
                    ? 'bg-white dark:bg-white/15 text-indigo-700 dark:text-white shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Vista Tarjetas Móvil
              </button>
              <button
                onClick={() => setLayoutMode('table')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  layoutMode === 'table'
                    ? 'bg-white dark:bg-white/15 text-indigo-700 dark:text-white shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Tabla Completa
              </button>
            </div>

            <span className="hidden sm:inline-block text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/10 px-3 py-1.5 rounded-2xl border border-zinc-200/80 dark:border-white/10 font-mono tabular-nums">
              {monthWeeks.length} semanas
            </span>
          </div>
        </div>

        {/* 1. MOBILE-FIRST CARDS VIEW */}
        {layoutMode === 'cards' && (
          <div className="p-4 sm:p-5 space-y-4">
            {monthWeeks.map((week, idx) => {
              const att = week.attendance || {
                weekId: week.id,
                midweek: { inPerson: 0, zoom: 0, total: 0 },
                weekend: { inPerson: 0, zoom: 0, total: 0 },
              };
              const weekCombinedTotal = att.midweek.total + att.weekend.total;

              return (
                <div
                  key={week.id}
                  className="kg-card-bento kg-sheen-top rounded-3xl border border-zinc-200/80 dark:border-white/10 p-5 space-y-4 hover:border-indigo-500/30 transition-all shadow-md"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 font-mono font-black text-sm flex items-center justify-center border border-indigo-500/30 shadow-inner">
                        #{idx + 1}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono tabular-nums block">
                          Semana del mes
                        </span>
                        <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base font-mono tabular-nums">
                          Del {week.weekStartDate} al {week.weekEndDate}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-400 uppercase font-bold block">Total Semana</span>
                      <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">{weekCombinedTotal}</span>
                    </div>
                  </div>

                  {/* Two columns: Midweek & Weekend */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Entre Semana Panel */}
                    <div className="p-4 rounded-2xl bg-zinc-100/70 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/5 space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-white/5 pb-2">
                        <span className="font-bold text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Entre Semana ({settings.midweekMeetingDay})</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-black text-xs font-mono tabular-nums border border-indigo-500/25">
                          Total: {att.midweek.total}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Presencial */}
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                            Presencial
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleAttendanceChange(
                                  week.id,
                                  'midweek',
                                  'inPerson',
                                  Math.max(0, (att.midweek.inPerson || 0) - 1)
                                )
                              }
                              className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/20 text-zinc-800 dark:text-white font-black text-base flex items-center justify-center shrink-0 hover:scale-110 active:scale-90 transition-all border border-zinc-200/80 dark:border-white/10 shadow-xs cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={att.midweek.inPerson || ''}
                              onChange={(e) =>
                                handleAttendanceChange(
                                  week.id,
                                  'midweek',
                                  'inPerson',
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              placeholder="0"
                              className="w-full text-center py-2 font-black font-mono tabular-nums text-zinc-900 dark:text-white bg-white dark:bg-black/30 border border-zinc-200/80 dark:border-white/10 rounded-xl text-base focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all shadow-inner"
                            />
                            <button
                              onClick={() =>
                                handleAttendanceChange(
                                  week.id,
                                  'midweek',
                                  'inPerson',
                                  (att.midweek.inPerson || 0) + 1
                                )
                              }
                              className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/20 text-zinc-800 dark:text-white font-black text-base flex items-center justify-center shrink-0 hover:scale-110 active:scale-90 transition-all border border-zinc-200/80 dark:border-white/10 shadow-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Zoom */}
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                            Zoom
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleAttendanceChange(
                                  week.id,
                                  'midweek',
                                  'zoom',
                                  Math.max(0, (att.midweek.zoom || 0) - 1)
                                )
                              }
                              className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/20 text-zinc-800 dark:text-white font-black text-base flex items-center justify-center shrink-0 hover:scale-110 active:scale-90 transition-all border border-zinc-200/80 dark:border-white/10 shadow-xs cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={att.midweek.zoom || ''}
                              onChange={(e) =>
                                handleAttendanceChange(
                                  week.id,
                                  'midweek',
                                  'zoom',
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              placeholder="0"
                              className="w-full text-center py-2 font-black font-mono tabular-nums text-zinc-900 dark:text-white bg-white dark:bg-black/30 border border-zinc-200/80 dark:border-white/10 rounded-xl text-base focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all shadow-inner"
                            />
                            <button
                              onClick={() =>
                                handleAttendanceChange(
                                  week.id,
                                  'midweek',
                                  'zoom',
                                  (att.midweek.zoom || 0) + 1
                                )
                              }
                              className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/20 text-zinc-800 dark:text-white font-black text-base flex items-center justify-center shrink-0 hover:scale-110 active:scale-90 transition-all border border-zinc-200/80 dark:border-white/10 shadow-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fin de Semana Panel */}
                    <div className="p-4 rounded-2xl bg-zinc-100/70 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/5 space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-white/5 pb-2">
                        <span className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Fin de Semana ({settings.weekendMeetingDay})</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-black text-xs font-mono tabular-nums border border-blue-500/25">
                          Total: {att.weekend.total}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Presencial */}
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                            Presencial
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleAttendanceChange(
                                  week.id,
                                  'weekend',
                                  'inPerson',
                                  Math.max(0, (att.weekend.inPerson || 0) - 1)
                                )
                              }
                              className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/20 text-zinc-800 dark:text-white font-black text-base flex items-center justify-center shrink-0 hover:scale-110 active:scale-90 transition-all border border-zinc-200/80 dark:border-white/10 shadow-xs cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={att.weekend.inPerson || ''}
                              onChange={(e) =>
                                handleAttendanceChange(
                                  week.id,
                                  'weekend',
                                  'inPerson',
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              placeholder="0"
                              className="w-full text-center py-2 font-black font-mono tabular-nums text-zinc-900 dark:text-white bg-white dark:bg-black/30 border border-zinc-200/80 dark:border-white/10 rounded-xl text-base focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all shadow-inner"
                            />
                            <button
                              onClick={() =>
                                handleAttendanceChange(
                                  week.id,
                                  'weekend',
                                  'inPerson',
                                  (att.weekend.inPerson || 0) + 1
                                )
                              }
                              className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/20 text-zinc-800 dark:text-white font-black text-base flex items-center justify-center shrink-0 hover:scale-110 active:scale-90 transition-all border border-zinc-200/80 dark:border-white/10 shadow-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Zoom */}
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                            Zoom
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleAttendanceChange(
                                  week.id,
                                  'weekend',
                                  'zoom',
                                  Math.max(0, (att.weekend.zoom || 0) - 1)
                                )
                              }
                              className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/20 text-zinc-800 dark:text-white font-black text-base flex items-center justify-center shrink-0 hover:scale-110 active:scale-90 transition-all border border-zinc-200/80 dark:border-white/10 shadow-xs cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={att.weekend.zoom || ''}
                              onChange={(e) =>
                                handleAttendanceChange(
                                  week.id,
                                  'weekend',
                                  'zoom',
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              placeholder="0"
                              className="w-full text-center py-2 font-black font-mono tabular-nums text-zinc-900 dark:text-white bg-white dark:bg-black/30 border border-zinc-200/80 dark:border-white/10 rounded-xl text-base focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all shadow-inner"
                            />
                            <button
                              onClick={() =>
                                handleAttendanceChange(
                                  week.id,
                                  'weekend',
                                  'zoom',
                                  (att.weekend.zoom || 0) + 1
                                )
                              }
                              className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/20 text-zinc-800 dark:text-white font-black text-base flex items-center justify-center shrink-0 hover:scale-110 active:scale-90 transition-all border border-zinc-200/80 dark:border-white/10 shadow-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. FULL DESKTOP TABLE VIEW */}
        {layoutMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100/80 dark:bg-white/[0.03] backdrop-blur-md text-zinc-700 dark:text-white font-bold border-b border-zinc-200/80 dark:border-white/10">
              <tr>
                <th className="px-4 py-3.5">Semana</th>
                <th className="px-4 py-3.5 bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-900 dark:text-indigo-300 text-center border-x border-zinc-200/80 dark:border-white/10 font-bold" colSpan={3}>
                  Reunión Entre Semana ({settings.midweekMeetingDay})
                </th>
                <th className="px-4 py-3.5 bg-blue-500/10 dark:bg-blue-500/15 text-blue-900 dark:text-blue-300 text-center border-r border-zinc-200/80 dark:border-white/10 font-bold" colSpan={3}>
                  Reunión Fin de Semana ({settings.weekendMeetingDay})
                </th>
                <th className="px-4 py-3.5 text-center font-bold">Total Semana</th>
              </tr>
              <tr className="bg-zinc-100/40 dark:bg-white/[0.02] text-2xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 dark:border-white/10">
                <th className="px-4 py-2 font-bold">Fecha Inicio</th>
                <th className="px-2 py-2 text-center bg-indigo-500/5 dark:bg-indigo-500/10 font-bold">Presencial</th>
                <th className="px-2 py-2 text-center bg-indigo-500/5 dark:bg-indigo-500/10 font-bold">Zoom</th>
                <th className="px-2 py-2 text-center bg-indigo-500/15 dark:bg-indigo-500/20 font-black text-indigo-900 dark:text-indigo-300">
                  Total
                </th>
                <th className="px-2 py-2 text-center bg-blue-500/5 dark:bg-blue-500/10 font-bold">Presencial</th>
                <th className="px-2 py-2 text-center bg-blue-500/5 dark:bg-blue-500/10 font-bold">Zoom</th>
                <th className="px-2 py-2 text-center bg-blue-500/15 dark:bg-blue-500/20 font-black text-blue-900 dark:text-blue-300">
                  Total
                </th>
                <th className="px-4 py-2 text-center font-black">Combinado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/50 dark:divide-white/[0.05]">
              {monthWeeks.map((week) => {
                const att = week.attendance || {
                  weekId: week.id,
                  midweek: { inPerson: 0, zoom: 0, total: 0 },
                  weekend: { inPerson: 0, zoom: 0, total: 0 },
                };

                const weekCombinedTotal = att.midweek.total + att.weekend.total;

                return (
                  <tr key={week.id} className="hover:bg-zinc-100/60 dark:hover:bg-white/[0.04] transition-colors">
                    <td className="px-4 py-3.5 font-bold text-zinc-900 dark:text-white whitespace-nowrap font-mono tabular-nums">
                      <div>{week.weekStartDate}</div>
                      <div className="text-zinc-500 dark:text-zinc-400 font-normal text-2xs">al {week.weekEndDate}</div>
                    </td>

                    {/* Midweek In Person */}
                    <td className="px-2 py-2 text-center bg-indigo-500/5 dark:bg-indigo-500/10">
                      <input
                        type="number"
                        min="0"
                        value={att.midweek.inPerson || ''}
                        onChange={(e) =>
                          handleAttendanceChange(
                            week.id,
                            'midweek',
                            'inPerson',
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        placeholder="0"
                        className="w-16 px-2.5 py-1.5 border border-zinc-200/80 dark:border-white/10 rounded-xl text-center font-bold font-mono tabular-nums text-zinc-900 dark:text-white bg-white dark:bg-black/30 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                      />
                    </td>

                    {/* Midweek Zoom */}
                    <td className="px-2 py-2 text-center bg-indigo-500/5 dark:bg-indigo-500/10">
                      <input
                        type="number"
                        min="0"
                        value={att.midweek.zoom || ''}
                        onChange={(e) =>
                          handleAttendanceChange(
                            week.id,
                            'midweek',
                            'zoom',
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        placeholder="0"
                        className="w-16 px-2.5 py-1.5 border border-zinc-200/80 dark:border-white/10 rounded-xl text-center font-bold font-mono tabular-nums text-zinc-900 dark:text-white bg-white dark:bg-black/30 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                      />
                    </td>

                    {/* Midweek Total */}
                    <td className="px-2 py-2 text-center bg-indigo-500/10 dark:bg-indigo-500/20 font-black text-indigo-900 dark:text-indigo-300 text-sm font-mono tabular-nums">
                      {att.midweek.total}
                    </td>

                    {/* Weekend In Person */}
                    <td className="px-2 py-2 text-center bg-blue-500/5 dark:bg-blue-500/10">
                      <input
                        type="number"
                        min="0"
                        value={att.weekend.inPerson || ''}
                        onChange={(e) =>
                          handleAttendanceChange(
                            week.id,
                            'weekend',
                            'inPerson',
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        placeholder="0"
                        className="w-16 px-2.5 py-1.5 border border-zinc-200/80 dark:border-white/10 rounded-xl text-center font-bold font-mono tabular-nums text-zinc-900 dark:text-white bg-white dark:bg-black/30 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                      />
                    </td>

                    {/* Weekend Zoom */}
                    <td className="px-2 py-2 text-center bg-blue-500/5 dark:bg-blue-500/10">
                      <input
                        type="number"
                        min="0"
                        value={att.weekend.zoom || ''}
                        onChange={(e) =>
                          handleAttendanceChange(
                            week.id,
                            'weekend',
                            'zoom',
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        placeholder="0"
                        className="w-16 px-2.5 py-1.5 border border-zinc-200/80 dark:border-white/10 rounded-xl text-center font-bold font-mono tabular-nums text-zinc-900 dark:text-white bg-white dark:bg-black/30 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                      />
                    </td>

                    {/* Weekend Total */}
                    <td className="px-2 py-2 text-center bg-blue-500/10 dark:bg-blue-500/20 font-black text-blue-900 dark:text-blue-300 text-sm font-mono tabular-nums">
                      {att.weekend.total}
                    </td>

                    {/* Week Combined Total */}
                    <td className="px-4 py-3.5 text-center font-black text-zinc-900 dark:text-white text-base font-mono tabular-nums">
                      {weekCombinedTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>
      </div>
      )}

      {/* MODAL DE CONTADOR TÁCTIL EN VIVO (Para Acomodadores / Audio en Reunión) */}
      {isCounterOpen && (() => {
        const activeW = weeks.find((w) => w.id === counterTarget.weekId) || monthWeeks[0] || weeks[0];
        const curAtt = activeW?.attendance || {
          weekId: activeW?.id || '',
          midweek: { inPerson: 0, zoom: 0, total: 0 },
          weekend: { inPerson: 0, zoom: 0, total: 0 },
        };
        const currentCount = curAtt[counterTarget.meetingType]?.[counterTarget.channel] || 0;

        const handleCountDelta = (delta: number) => {
          if (!activeW) return;
          const newVal = Math.max(0, currentCount + delta);
          handleAttendanceChange(activeW.id, counterTarget.meetingType, counterTarget.channel, newVal);
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/15 w-full max-w-lg rounded-3xl p-6 sm:p-8 relative space-y-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner">
                    <Smartphone size={22} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                      Contador Táctil en Vivo
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Diseñado para conteo ágil con una mano en el Salón</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCounterOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Selectores de Semana, Reunión y Canal */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCounterTarget((prev) => ({ ...prev, meetingType: 'midweek' }))}
                    className={`py-2.5 px-3.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                      counterTarget.meetingType === 'midweek'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-white/10'
                    }`}
                  >
                    Entre Semana ({settings.midweekMeetingDay})
                  </button>
                  <button
                    onClick={() => setCounterTarget((prev) => ({ ...prev, meetingType: 'weekend' }))}
                    className={`py-2.5 px-3.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                      counterTarget.meetingType === 'weekend'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-white/10'
                    }`}
                  >
                    Fin de Semana ({settings.weekendMeetingDay})
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCounterTarget((prev) => ({ ...prev, channel: 'inPerson' }))}
                    className={`py-2.5 px-3.5 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      counterTarget.channel === 'inPerson'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-white/10'
                    }`}
                  >
                    <Building2 size={15} /> Presencial (Salón)
                  </button>
                  <button
                    onClick={() => setCounterTarget((prev) => ({ ...prev, channel: 'zoom' }))}
                    className={`py-2.5 px-3.5 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      counterTarget.channel === 'zoom'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-white/10'
                    }`}
                  >
                    <Video size={15} /> Zoom (Conexiones)
                  </button>
                </div>
              </div>

              {/* Pantalla Gigante del Contador */}
              <div className="bg-zinc-100/80 dark:bg-black/50 rounded-3xl border border-zinc-200/80 dark:border-white/10 p-6 sm:p-8 text-center space-y-3 shadow-inner">
                <div className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-400 font-bold">
                  {counterTarget.meetingType === 'midweek' ? 'Entre Semana' : 'Fin de Semana'} •{' '}
                  {counterTarget.channel === 'inPerson' ? 'Presencial' : 'Zoom'}
                </div>
                <div className="text-7xl sm:text-8xl font-black text-zinc-900 dark:text-white font-mono tabular-nums tracking-tight">
                  {currentCount}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold font-mono tabular-nums">
                  Total de la reunión: {curAtt[counterTarget.meetingType].total}
                </div>
              </div>

              {/* Botonera de Toque Rápido */}
              <div className="space-y-3">
                {/* Gran Botón +1 y -1 */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleCountDelta(-1)}
                    className="h-20 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black text-2xl flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-rose-500/25"
                    title="Restar 1"
                  >
                    <Minus size={28} />
                  </button>

                  <button
                    onClick={() => handleCountDelta(1)}
                    className="col-span-2 h-20 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-3xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                    title="Sumar 1"
                  >
                    <Plus size={32} />
                    <span>+1 Persona</span>
                  </button>
                </div>

                {/* Botones de Lotes Rápido (+5, +10, Reiniciar) */}
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handleCountDelta(5)}
                    className="py-3.5 rounded-2xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10 font-black text-xs text-zinc-800 dark:text-white font-mono tabular-nums hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    +5 Filas
                  </button>
                  <button
                    onClick={() => handleCountDelta(10)}
                    className="py-3.5 rounded-2xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10 font-black text-xs text-zinc-800 dark:text-white font-mono tabular-nums hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    +10 Grupo
                  </button>
                  <button
                    onClick={() => {
                      if (activeW) {
                        handleAttendanceChange(activeW.id, counterTarget.meetingType, counterTarget.channel, 0);
                      }
                    }}
                    className="py-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 font-black text-xs text-rose-600 dark:text-rose-400 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <RotateCcw size={14} /> Cero
                  </button>
                </div>
              </div>

              {/* Botón Guardar y Salir */}
              <button
                onClick={() => setIsCounterOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-white/20 dark:to-white/10 hover:from-zinc-800 hover:to-zinc-700 text-white font-bold text-sm border border-zinc-900 dark:border-white/15 shadow-lg hover:scale-[1.01] active:scale-98 transition-all cursor-pointer"
              >
                Listo / Guardar en el Registro
              </button>
            </div>
          </div>
        );
      })()}

      <LocalOfficialFormsModal
        isOpen={isS88ModalOpen}
        onClose={() => setIsS88ModalOpen(false)}
        initialFormCode="S-88"
        title="Cargar y Rellenar Formato Oficial S-88 (Registro de Asistencia)"
      />
    </div>
  );
};

