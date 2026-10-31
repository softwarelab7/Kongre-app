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
      <div className="bg-white dark:bg-[#121216] p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors">
        {/* View Switcher Pills */}
        <div className="grid grid-cols-2 sm:flex items-center p-1.5 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200/70 dark:border-[#27272A] rounded-xl text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setMainView('dashboard')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
              mainView === 'dashboard'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Dashboard Visual</span>
          </button>
          <button
            type="button"
            onClick={() => setMainView('registro')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
              mainView === 'registro'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
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
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] border border-zinc-200/80 dark:border-[#27272A] font-bold text-xs transition-all active:scale-95 cursor-pointer"
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
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer"
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
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA]">Mes seleccionado:</span>
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-zinc-800 dark:text-[#F4F4F5] font-semibold text-xs sm:text-sm outline-hidden cursor-pointer font-mono tabular-nums"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m} className="text-zinc-900 bg-white dark:bg-[#18181F] dark:text-[#F4F4F5]">
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
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
            <div className="bg-white dark:bg-[#121216] rounded-2xl border border-zinc-200 dark:border-[#27272A] p-4 transition-colors">
              <div className="flex items-center justify-between text-zinc-500 dark:text-[#A1A1AA] mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Promedio Entre Semana</span>
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{metrics.avgMidweek}</div>
              <p className="text-2xs text-zinc-400 dark:text-[#A1A1AA] mt-1">
                {settings.midweekMeetingDay} • <span className="font-mono tabular-nums">{metrics.midweekCount}</span> reuniones
              </p>
            </div>

            <div className="bg-white dark:bg-[#121216] rounded-2xl border border-zinc-200 dark:border-[#27272A] p-4 transition-colors">
              <div className="flex items-center justify-between text-zinc-500 dark:text-[#A1A1AA] mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Promedio Fin de Semana</span>
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{metrics.avgWeekend}</div>
              <p className="text-2xs text-zinc-400 dark:text-[#A1A1AA] mt-1">
                {settings.weekendMeetingDay} • <span className="font-mono tabular-nums">{metrics.weekendCount}</span> reuniones
              </p>
            </div>

            <div className="bg-white dark:bg-[#121216] rounded-2xl border border-zinc-200 dark:border-[#27272A] p-4 transition-colors">
              <div className="flex items-center justify-between text-zinc-500 dark:text-[#A1A1AA] mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Promedio General</span>
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{metrics.avgOverall}</div>
              <p className="text-2xs text-zinc-400 dark:text-[#A1A1AA] mt-1">
                Máxima del mes: <strong className="text-zinc-700 dark:text-[#F4F4F5] font-mono tabular-nums">{metrics.maxAttendance}</strong>
              </p>
            </div>

            <div className="bg-white dark:bg-[#121216] rounded-2xl border border-zinc-200 dark:border-[#27272A] p-4 transition-colors">
              <div className="flex items-center justify-between text-zinc-500 dark:text-[#A1A1AA] mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Presencial vs Zoom</span>
                <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
                {metrics.inPersonPct}% / {metrics.zoomPct}%
              </div>
              {/* Progress bar */}
              <div className="w-full bg-zinc-100 dark:bg-[#18181F] h-2 rounded-full mt-2 overflow-hidden flex border border-zinc-200/60 dark:border-[#27272A]">
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
      <div className="bg-white dark:bg-[#121216] rounded-2xl border border-zinc-200 dark:border-[#27272A] p-4 sm:p-5 transition-colors space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-[#27272A] pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm sm:text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tendencia Histórica: Comparativa de las Últimas 4 Semanas</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 font-mono tabular-nums">
                Promedio General: {lastFourWeeksTrend.avgGeneral}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
              Comparación directa de asistencia en las últimas 4 semanas entre Entre Semana ({settings.midweekMeetingDay}), Fin de Semana ({settings.weekendMeetingDay}) y Promedio Semanal.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/60 dark:border-emerald-800/50 font-mono tabular-nums">
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
      <div className="bg-white dark:bg-[#121216] rounded-2xl border border-zinc-200 dark:border-[#27272A] overflow-hidden transition-colors">
        <div className="p-4 border-b border-zinc-100 dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/70 dark:bg-[#18181F]">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-base">
              Registro Semanal de Asistencia • <span className="font-mono tabular-nums">{selectedMonth}</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Ingrese los números de cada reunión; el total se calcula automáticamente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View layout toggle */}
            <div className="flex items-center p-1 bg-zinc-200/80 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] rounded-xl text-xs font-semibold">
              <button
                onClick={() => setLayoutMode('cards')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  layoutMode === 'cards'
                    ? 'bg-white dark:bg-[#121216] text-indigo-700 dark:text-[#F4F4F5] border border-zinc-200/80 dark:border-[#27272A] shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
                }`}
              >
                Vista Tarjetas Móvil
              </button>
              <button
                onClick={() => setLayoutMode('table')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  layoutMode === 'table'
                    ? 'bg-white dark:bg-[#121216] text-indigo-700 dark:text-[#F4F4F5] border border-zinc-200/80 dark:border-[#27272A] shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
                }`}
              >
                Tabla Completa
              </button>
            </div>

            <span className="hidden sm:inline-block text-xs font-semibold text-zinc-600 dark:text-[#A1A1AA] bg-white dark:bg-[#18181F] px-3 py-1 rounded-xl border border-zinc-200 dark:border-[#27272A] font-mono tabular-nums">
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
                  className="rounded-2xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50/50 dark:bg-[#18181F] p-4 space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-[#27272A] pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                        Semana #{idx + 1}
                      </span>
                      <h4 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm sm:text-base font-mono tabular-nums">
                        Del {week.weekStartDate} al {week.weekEndDate}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 dark:text-[#A1A1AA] uppercase font-semibold block">Total Semana</span>
                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">{weekCombinedTotal}</span>
                    </div>
                  </div>

                  {/* Two columns: Midweek & Weekend */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Entre Semana Panel */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#121216] border border-indigo-100 dark:border-[#27272A] space-y-3">
                      <div className="flex items-center justify-between border-b border-indigo-50 dark:border-[#27272A] pb-2">
                        <span className="font-bold text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Entre Semana ({settings.midweekMeetingDay})</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs font-mono tabular-nums border border-indigo-200/60 dark:border-indigo-900/40">
                          Total: {att.midweek.total}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Presencial */}
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">
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
                              className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all border border-zinc-200/80 dark:border-[#27272A]"
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
                              className="w-full text-center py-1.5 font-bold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5] bg-indigo-50/30 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
                              className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all border border-zinc-200/80 dark:border-[#27272A]"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Zoom */}
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">
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
                              className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all border border-zinc-200/80 dark:border-[#27272A]"
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
                              className="w-full text-center py-1.5 font-bold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5] bg-indigo-50/30 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
                              className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all border border-zinc-200/80 dark:border-[#27272A]"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fin de Semana Panel */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#121216] border border-blue-100 dark:border-[#27272A] space-y-3">
                      <div className="flex items-center justify-between border-b border-blue-50 dark:border-[#27272A] pb-2">
                        <span className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Fin de Semana ({settings.weekendMeetingDay})</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-extrabold text-xs font-mono tabular-nums border border-blue-200/60 dark:border-blue-900/40">
                          Total: {att.weekend.total}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Presencial */}
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">
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
                              className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all border border-zinc-200/80 dark:border-[#27272A]"
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
                              className="w-full text-center py-1.5 font-bold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5] bg-blue-50/30 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                              className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all border border-zinc-200/80 dark:border-[#27272A]"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Zoom */}
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">
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
                              className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all border border-zinc-200/80 dark:border-[#27272A]"
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
                              className="w-full text-center py-1.5 font-bold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5] bg-blue-50/30 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                              className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-bold text-sm flex items-center justify-center shrink-0 active:scale-95 transition-all border border-zinc-200/80 dark:border-[#27272A]"
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
            <thead className="bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#F4F4F5] font-bold border-b border-zinc-200 dark:border-[#27272A]">
              <tr>
                <th className="px-4 py-3">Semana</th>
                <th className="px-4 py-3 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-300 text-center border-x border-zinc-200 dark:border-[#27272A]" colSpan={3}>
                  Reunión Entre Semana ({settings.midweekMeetingDay})
                </th>
                <th className="px-4 py-3 bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 text-center border-r border-zinc-200 dark:border-[#27272A]" colSpan={3}>
                  Reunión Fin de Semana ({settings.weekendMeetingDay})
                </th>
                <th className="px-4 py-3 text-center">Total Semana</th>
              </tr>
              <tr className="bg-zinc-50 dark:bg-[#121216] text-2xs text-zinc-500 dark:text-[#A1A1AA] uppercase border-b border-zinc-200 dark:border-[#27272A]">
                <th className="px-4 py-2">Fecha Inicio</th>
                <th className="px-2 py-2 text-center bg-indigo-50/30 dark:bg-indigo-950/20">Presencial</th>
                <th className="px-2 py-2 text-center bg-indigo-50/30 dark:bg-indigo-950/20">Zoom</th>
                <th className="px-2 py-2 text-center bg-indigo-100/50 dark:bg-indigo-900/40 font-bold text-indigo-900 dark:text-indigo-300">
                  Total
                </th>
                <th className="px-2 py-2 text-center bg-blue-50/30 dark:bg-blue-950/20">Presencial</th>
                <th className="px-2 py-2 text-center bg-blue-50/30 dark:bg-blue-950/20">Zoom</th>
                <th className="px-2 py-2 text-center bg-blue-100/50 dark:bg-blue-900/40 font-bold text-blue-900 dark:text-blue-300">
                  Total
                </th>
                <th className="px-4 py-2 text-center font-bold">Combinado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-[#27272A]">
              {monthWeeks.map((week) => {
                const att = week.attendance || {
                  weekId: week.id,
                  midweek: { inPerson: 0, zoom: 0, total: 0 },
                  weekend: { inPerson: 0, zoom: 0, total: 0 },
                };

                const weekCombinedTotal = att.midweek.total + att.weekend.total;

                return (
                  <tr key={week.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#18181F]/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-zinc-900 dark:text-[#F4F4F5] whitespace-nowrap font-mono tabular-nums">
                      <div>{week.weekStartDate}</div>
                      <div className="text-zinc-400 dark:text-[#A1A1AA] font-normal text-2xs">al {week.weekEndDate}</div>
                    </td>

                    {/* Midweek In Person */}
                    <td className="px-2 py-2 text-center bg-indigo-50/20 dark:bg-indigo-950/10">
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
                        className="w-16 px-2 py-1.5 border border-zinc-300 dark:border-[#27272A] rounded-lg text-center font-semibold font-mono tabular-nums text-zinc-800 dark:text-[#F4F4F5] bg-white dark:bg-[#18181F] focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                    </td>

                    {/* Midweek Zoom */}
                    <td className="px-2 py-2 text-center bg-indigo-50/20 dark:bg-indigo-950/10">
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
                        className="w-16 px-2 py-1.5 border border-zinc-300 dark:border-[#27272A] rounded-lg text-center font-semibold font-mono tabular-nums text-zinc-800 dark:text-[#F4F4F5] bg-white dark:bg-[#18181F] focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                    </td>

                    {/* Midweek Total */}
                    <td className="px-2 py-2 text-center bg-indigo-100/40 dark:bg-indigo-950/30 font-bold text-indigo-900 dark:text-indigo-300 text-sm font-mono tabular-nums">
                      {att.midweek.total}
                    </td>

                    {/* Weekend In Person */}
                    <td className="px-2 py-2 text-center bg-blue-50/20 dark:bg-blue-950/10">
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
                        className="w-16 px-2 py-1.5 border border-zinc-300 dark:border-[#27272A] rounded-lg text-center font-semibold font-mono tabular-nums text-zinc-800 dark:text-[#F4F4F5] bg-white dark:bg-[#18181F] focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                    </td>

                    {/* Weekend Zoom */}
                    <td className="px-2 py-2 text-center bg-blue-50/20 dark:bg-blue-950/10">
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
                        className="w-16 px-2 py-1.5 border border-zinc-300 dark:border-[#27272A] rounded-lg text-center font-semibold font-mono tabular-nums text-zinc-800 dark:text-[#F4F4F5] bg-white dark:bg-[#18181F] focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                    </td>

                    {/* Weekend Total */}
                    <td className="px-2 py-2 text-center bg-blue-100/40 dark:bg-blue-950/30 font-bold text-blue-900 dark:text-blue-300 text-sm font-mono tabular-nums">
                      {att.weekend.total}
                    </td>

                    {/* Week Combined Total */}
                    <td className="px-4 py-3 text-center font-extrabold text-zinc-900 dark:text-[#F4F4F5] text-base font-mono tabular-nums">
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
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] w-full max-w-lg rounded-2xl p-6 sm:p-8 relative space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#27272A] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#F4F4F5]">
                      Contador Táctil en Vivo
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">Diseñado para conteo ágil con una mano en el Salón</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCounterOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] rounded-xl hover:bg-zinc-100 dark:hover:bg-[#18181F] cursor-pointer transition-colors"
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
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] border border-zinc-200/80 dark:border-[#27272A]'
                    }`}
                  >
                    Entre Semana ({settings.midweekMeetingDay})
                  </button>
                  <button
                    onClick={() => setCounterTarget((prev) => ({ ...prev, meetingType: 'weekend' }))}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      counterTarget.meetingType === 'weekend'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] border border-zinc-200/80 dark:border-[#27272A]'
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
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] border border-zinc-200/80 dark:border-[#27272A]'
                    }`}
                  >
                    <Building2 size={14} /> Presencial (Salón)
                  </button>
                  <button
                    onClick={() => setCounterTarget((prev) => ({ ...prev, channel: 'zoom' }))}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      counterTarget.channel === 'zoom'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] border border-zinc-200/80 dark:border-[#27272A]'
                    }`}
                  >
                    <Video size={14} /> Zoom (Conexiones)
                  </button>
                </div>
              </div>

              {/* Pantalla Gigante del Contador */}
              <div className="bg-zinc-50 dark:bg-[#18181F] rounded-2xl border border-zinc-200 dark:border-[#27272A] p-6 text-center space-y-4">
                <div className="text-xs uppercase tracking-widest text-zinc-400 dark:text-[#A1A1AA] font-semibold">
                  {counterTarget.meetingType === 'midweek' ? 'Entre Semana' : 'Fin de Semana'} •{' '}
                  {counterTarget.channel === 'inPerson' ? 'Presencial' : 'Zoom'}
                </div>
                <div className="text-6xl sm:text-7xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
                  {currentCount}
                </div>
                <div className="text-xs text-zinc-500 dark:text-[#A1A1AA] font-medium font-mono tabular-nums">
                  Total de la reunión: {curAtt[counterTarget.meetingType].total}
                </div>
              </div>

              {/* Botonera de Toque Rápido */}
              <div className="space-y-3">
                {/* Gran Botón +1 y -1 */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleCountDelta(-1)}
                    className="h-20 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer border border-rose-500/20"
                    title="Restar 1"
                  >
                    <Minus size={28} />
                  </button>

                  <button
                    onClick={() => handleCountDelta(1)}
                    className="col-span-2 h-20 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-3xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
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
                    className="py-3 rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] font-bold text-xs text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums active:scale-95 transition-all cursor-pointer"
                  >
                    +5 Filas
                  </button>
                  <button
                    onClick={() => handleCountDelta(10)}
                    className="py-3 rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] font-bold text-xs text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums active:scale-95 transition-all cursor-pointer"
                  >
                    +10 Grupo
                  </button>
                  <button
                    onClick={() => {
                      if (activeW) {
                        handleAttendanceChange(activeW.id, counterTarget.meetingType, counterTarget.channel, 0);
                      }
                    }}
                    className="py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 font-bold text-xs text-rose-600 dark:text-rose-400 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <RotateCcw size={12} /> Cero
                  </button>
                </div>
              </div>

              {/* Botón Guardar y Salir */}
              <button
                onClick={() => setIsCounterOpen(false)}
                className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-[#27272A] hover:bg-zinc-800 dark:hover:bg-[#323238] text-white font-bold text-sm border border-zinc-900 dark:border-[#3E3E42] active:scale-98 transition-all cursor-pointer"
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

