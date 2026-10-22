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

export const AsistenciaTab: React.FC = () => {
  const { weeks, updateMeetingAttendance, settings, currentWeek } = useCongregation();
  const [mainView, setMainView] = useState<'dashboard' | 'registro'>('dashboard');
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
    <div className="space-y-6">
      {/* Barra de Vistas y Acciones de Asistencia (Opción 1: arranque directo sin banner redundante) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* View Switcher Pills */}
        <div className="flex items-center p-1 bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs font-bold shadow-2xs">
          <button
            type="button"
            onClick={() => setMainView('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              mainView === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dashboard Visual</span>
          </button>
          <button
            type="button"
            onClick={() => setMainView('registro')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              mainView === 'registro'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Registro Semanal</span>
          </button>
        </div>

        <button
          onClick={() => {
            if (!counterTarget.weekId && monthWeeks.length > 0) {
              setCounterTarget((prev) => ({ ...prev, weekId: monthWeeks[0].id }));
            }
            setIsCounterOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Smartphone className="w-4 h-4" />
          <span>Contador en Vivo</span>
        </button>
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
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#131d2e] border border-slate-200/90 dark:border-white/[0.06] shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Mes seleccionado:</span>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-white font-semibold text-xs sm:text-sm outline-hidden cursor-pointer"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m} className="text-slate-900 bg-white dark:bg-slate-900">
                      Mes: {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMainView('dashboard')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver gráficos anuales</span>
                <span>↗</span>
              </button>

              <button
                onClick={handleCopySecretaryReport}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md dark:shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Promedio Entre Semana</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{metrics.avgMidweek}</div>
          <p className="text-2xs text-slate-400 dark:text-slate-500 mt-1">
            {settings.midweekMeetingDay} • {metrics.midweekCount} reuniones
          </p>
        </div>

        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Promedio Fin de Semana</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{metrics.avgWeekend}</div>
          <p className="text-2xs text-slate-400 dark:text-slate-500 mt-1">
            {settings.weekendMeetingDay} • {metrics.weekendCount} reuniones
          </p>
        </div>

        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Promedio General</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{metrics.avgOverall}</div>
          <p className="text-2xs text-slate-400 dark:text-slate-500 mt-1">
            Máxima del mes: <strong className="text-slate-700 dark:text-slate-300">{metrics.maxAttendance}</strong>
          </p>
        </div>

        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Presencial vs Zoom</span>
            <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics.inPersonPct}% / {metrics.zoomPct}%
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden flex">
            <div
              className="bg-indigo-600 h-full transition-all"
              style={{ width: `${metrics.inPersonPct}%` }}
              title={`Presencial: ${metrics.inPersonPct}%`}
            />
            <div
              className="bg-purple-500 h-full transition-all"
              style={{ width: `${metrics.zoomPct}%` }}
              title={`Zoom: ${metrics.zoomPct}%`}
            />
          </div>
        </div>
      </div>

      {/* Gráfico de Líneas Comparativo de las Últimas 4 Semanas (Recharts) */}
      <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tendencia Histórica: Comparativa de las Últimas 4 Semanas</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                Recharts LineChart
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparación directa de asistencia en las últimas 4 semanas entre Entre Semana ({settings.midweekMeetingDay}), Fin de Semana ({settings.weekendMeetingDay}) y Promedio Semanal.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/60 dark:border-emerald-800/50">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                fontSize={12}
                tickLine={false}
                stroke="#64748b"
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                stroke="#64748b"
                domain={[0, (dataMax: number) => Math.max(90, Math.ceil(dataMax * 1.15))]}
              />
              <Tooltip />
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
                stroke="#4f46e5"
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
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Registro Semanal de Asistencia • {selectedMonth}
            </h3>
            <p className="text-xs text-slate-500">
              Ingrese los números de cada reunión; el total se calcula automáticamente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View layout toggle */}
            <div className="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setLayoutMode('cards')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  layoutMode === 'cards'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vista Tarjetas Móvil
              </button>
              <button
                onClick={() => setLayoutMode('table')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  layoutMode === 'table'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tabla Completa
              </button>
            </div>

            <span className="hidden sm:inline-block text-xs font-semibold text-slate-600 bg-white px-3 py-1 rounded-xl border border-slate-200">
              {monthWeeks.length} semanas
            </span>
          </div>
        </div>

        {/* 1. MOBILE-FIRST CARDS VIEW */}
        {layoutMode === 'cards' && (
          <div className="p-4 space-y-4">
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
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-xs space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Semana #{idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        Del {week.weekStartDate} al {week.weekEndDate}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Semana</span>
                      <span className="text-lg font-black text-indigo-700">{weekCombinedTotal}</span>
                    </div>
                  </div>

                  {/* Two columns: Midweek & Weekend */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Entre Semana Panel */}
                    <div className="p-3.5 rounded-xl bg-white border border-indigo-100 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-indigo-50 pb-2">
                        <span className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Entre Semana ({settings.midweekMeetingDay})</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs">
                          Total: {att.midweek.total}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Presencial */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
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
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all"
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
                              className="w-full text-center py-1.5 font-bold text-slate-900 bg-indigo-50/30 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Zoom */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
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
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all"
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
                              className="w-full text-center py-1.5 font-bold text-slate-900 bg-indigo-50/30 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fin de Semana Panel */}
                    <div className="p-3.5 rounded-xl bg-white border border-blue-100 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-blue-50 pb-2">
                        <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>Fin de Semana ({settings.weekendMeetingDay})</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-xs">
                          Total: {att.weekend.total}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Presencial */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
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
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all"
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
                              className="w-full text-center py-1.5 font-bold text-slate-900 bg-blue-50/30 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Zoom */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
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
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all"
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
                              className="w-full text-center py-1.5 font-bold text-slate-900 bg-blue-50/30 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all"
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
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Semana</th>
                <th className="px-4 py-3 bg-indigo-50/70 text-indigo-900 text-center" colSpan={3}>
                  Reunión Entre Semana ({settings.midweekMeetingDay})
                </th>
                <th className="px-4 py-3 bg-blue-50/70 text-blue-900 text-center" colSpan={3}>
                  Reunión Fin de Semana ({settings.weekendMeetingDay})
                </th>
                <th className="px-4 py-3 text-center">Total Semana</th>
              </tr>
              <tr className="bg-slate-50 text-2xs text-slate-500 uppercase">
                <th className="px-4 py-2">Fecha Inicio</th>
                <th className="px-2 py-2 text-center bg-indigo-50/30">Presencial</th>
                <th className="px-2 py-2 text-center bg-indigo-50/30">Zoom</th>
                <th className="px-2 py-2 text-center bg-indigo-100/50 font-bold text-indigo-900">
                  Total
                </th>
                <th className="px-2 py-2 text-center bg-blue-50/30">Presencial</th>
                <th className="px-2 py-2 text-center bg-blue-50/30">Zoom</th>
                <th className="px-2 py-2 text-center bg-blue-100/50 font-bold text-blue-900">
                  Total
                </th>
                <th className="px-4 py-2 text-center font-bold">Combinado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthWeeks.map((week) => {
                const att = week.attendance || {
                  weekId: week.id,
                  midweek: { inPerson: 0, zoom: 0, total: 0 },
                  weekend: { inPerson: 0, zoom: 0, total: 0 },
                };

                const weekCombinedTotal = att.midweek.total + att.weekend.total;

                return (
                  <tr key={week.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      <div>{week.weekStartDate}</div>
                      <div className="text-slate-400 font-normal text-2xs">al {week.weekEndDate}</div>
                    </td>

                    {/* Midweek In Person */}
                    <td className="px-2 py-2 text-center bg-indigo-50/20">
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
                        className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                    </td>

                    {/* Midweek Zoom */}
                    <td className="px-2 py-2 text-center bg-indigo-50/20">
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
                        className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                    </td>

                    {/* Midweek Total */}
                    <td className="px-2 py-2 text-center bg-indigo-100/40 font-bold text-indigo-900 text-sm">
                      {att.midweek.total}
                    </td>

                    {/* Weekend In Person */}
                    <td className="px-2 py-2 text-center bg-blue-50/20">
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
                        className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                    </td>

                    {/* Weekend Zoom */}
                    <td className="px-2 py-2 text-center bg-blue-50/20">
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
                        className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                    </td>

                    {/* Weekend Total */}
                    <td className="px-2 py-2 text-center bg-blue-100/40 font-bold text-blue-900 text-sm">
                      {att.weekend.total}
                    </td>

                    {/* Week Combined Total */}
                    <td className="px-4 py-3 text-center font-extrabold text-slate-900 text-base">
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
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#111827] border border-black/[0.08] dark:border-white/[0.08] w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.05] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      Contador Táctil en Vivo
                    </h3>
                    <p className="text-xs text-zinc-400">Diseñado para conteo ágil con una mano en el Salón</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCounterOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.05] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Selectores de Semana, Reunión y Canal */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCounterTarget((prev) => ({ ...prev, meetingType: 'midweek' }))}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      counterTarget.meetingType === 'midweek'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-black/[0.04] dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Entre Semana ({settings.midweekMeetingDay})
                  </button>
                  <button
                    onClick={() => setCounterTarget((prev) => ({ ...prev, meetingType: 'weekend' }))}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      counterTarget.meetingType === 'weekend'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-black/[0.04] dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Fin de Semana ({settings.weekendMeetingDay})
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCounterTarget((prev) => ({ ...prev, channel: 'inPerson' }))}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      counterTarget.channel === 'inPerson'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-black/[0.04] dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Building2 size={14} /> Presencial (Salón)
                  </button>
                  <button
                    onClick={() => setCounterTarget((prev) => ({ ...prev, channel: 'zoom' }))}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      counterTarget.channel === 'zoom'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-black/[0.04] dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Video size={14} /> Zoom (Conexiones)
                  </button>
                </div>
              </div>

              {/* Pantalla Gigante del Contador */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-black/[0.06] dark:border-white/[0.06] p-6 text-center space-y-4">
                <div className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
                  {counterTarget.meetingType === 'midweek' ? 'Entre Semana' : 'Fin de Semana'} •{' '}
                  {counterTarget.channel === 'inPerson' ? 'Presencial' : 'Zoom'}
                </div>
                <div className="text-6xl sm:text-7xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {currentCount}
                </div>
                <div className="text-xs text-zinc-500 font-medium">
                  Total de la reunión: {curAtt[counterTarget.meetingType].total}
                </div>
              </div>

              {/* Botonera de Toque Rápido */}
              <div className="space-y-3">
                {/* Gran Botón +1 y -1 */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleCountDelta(-1)}
                    className="h-20 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer border border-rose-500/20"
                    title="Restar 1"
                  >
                    <Minus size={28} />
                  </button>

                  <button
                    onClick={() => handleCountDelta(1)}
                    className="col-span-2 h-20 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-3xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-600/25"
                    title="Sumar 1"
                  >
                    <Plus size={32} />
                    <span>+1 Persona</span>
                  </button>
                </div>

                {/* Botones de Lotes Rápido (+5, +10, Reiniciar) */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleCountDelta(5)}
                    className="py-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] font-bold text-xs text-zinc-800 dark:text-zinc-200 active:scale-95 transition-all cursor-pointer"
                  >
                    +5 Filas
                  </button>
                  <button
                    onClick={() => handleCountDelta(10)}
                    className="py-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] font-bold text-xs text-zinc-800 dark:text-zinc-200 active:scale-95 transition-all cursor-pointer"
                  >
                    +10 Grupo
                  </button>
                  <button
                    onClick={() => {
                      if (activeW) {
                        handleAttendanceChange(activeW.id, counterTarget.meetingType, counterTarget.channel, 0);
                      }
                    }}
                    className="py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 font-bold text-xs text-rose-600 dark:text-rose-400 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <RotateCcw size={12} /> Cero
                  </button>
                </div>
              </div>

              {/* Botón Guardar y Salir */}
              <button
                onClick={() => setIsCounterOpen(false)}
                className="w-full py-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-sm hover:opacity-90 active:scale-98 transition-all cursor-pointer"
              >
                Listo / Guardar en el Registro
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

