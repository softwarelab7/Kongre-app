/**
 * src/components/charts/AttendanceTrendsDashboard.tsx
 * Dashboard visual de tendencias históricas de asistencia a reuniones
 * durante el Año de Servicio teocrático (Septiembre a Agosto) usando Recharts.
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Video,
  Building2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  Award,
  Filter,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Info,
} from 'lucide-react';
import { WeekSchedule, CongregationSettings, MeetingAttendance } from '../../types';
import {
  getCurrentServiceYear,
  getAvailableServiceYears,
  getServiceYearMonths,
} from '../../utils/s21Helper';
import { useTheme } from '../../context/ThemeContext';

interface AttendanceTrendsDashboardProps {
  weeks: WeekSchedule[];
  settings: CongregationSettings;
  onUpdateAttendance?: (weekId: string, attendance: MeetingAttendance) => void;
  onSelectMonth?: (monthKey: string) => void;
}

export interface MonthAttendanceSummary {
  monthKey: string; // 'YYYY-MM'
  monthNumber: number;
  monthName: string;
  monthShort: string;
  year: number;
  weeksCount: number;
  midweekTotal: number;
  midweekInPerson: number;
  midweekZoom: number;
  avgMidweek: number;
  weekendTotal: number;
  weekendInPerson: number;
  weekendZoom: number;
  avgWeekend: number;
  combinedTotal: number;
  avgOverall: number;
  maxAttendance: number;
  inPersonPct: number;
  zoomPct: number;
  hasData: boolean;
}

export const AttendanceTrendsDashboard: React.FC<AttendanceTrendsDashboardProps> = ({
  weeks,
  settings,
  onUpdateAttendance,
  onSelectMonth,
}) => {
  const { isDark } = useTheme();

  // Selected Service Year (e.g. '2026-2027')
  const [selectedServiceYear, setSelectedServiceYear] = useState<string>(() => getCurrentServiceYear());
  
  // Available Service Years
  const availableYears = useMemo(() => getAvailableServiceYears(), []);

  // Dashboard Chart Mode
  const [chartView, setChartView] = useState<'trends' | 'channels' | 'weekly' | 'table'>('trends');

  // Meeting Filter for Charts
  const [meetingFilter, setMeetingFilter] = useState<'both' | 'midweek' | 'weekend'>('both');

  // Show Reference Line Toggle
  const [showAverageLine, setShowAverageLine] = useState<boolean>(true);

  // Copy success notification
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Compute 12 theocratic months for the selected service year (Sep -> Aug)
  const serviceYearMonths = useMemo(() => {
    return getServiceYearMonths(selectedServiceYear);
  }, [selectedServiceYear]);

  // Aggregate monthly attendance data from weeks
  const monthlyData: MonthAttendanceSummary[] = useMemo(() => {
    return serviceYearMonths.map((m) => {
      // Find all weeks that belong to this month
      const matchingWeeks = weeks.filter((w) => {
        const dateStr = w.weekStartDate || w.id;
        return dateStr.startsWith(m.monthKey);
      });

      let mwTotal = 0;
      let mwInPerson = 0;
      let mwZoom = 0;
      let mwCount = 0;

      let weTotal = 0;
      let weInPerson = 0;
      let weZoom = 0;
      let weCount = 0;

      let maxAtt = 0;

      matchingWeeks.forEach((w) => {
        const att = w.attendance;
        if (att) {
          if (att.midweek && att.midweek.total > 0) {
            mwTotal += att.midweek.total;
            mwInPerson += att.midweek.inPerson;
            mwZoom += att.midweek.zoom;
            mwCount++;
            if (att.midweek.total > maxAtt) maxAtt = att.midweek.total;
          }
          if (att.weekend && att.weekend.total > 0) {
            weTotal += att.weekend.total;
            weInPerson += att.weekend.inPerson;
            weZoom += att.weekend.zoom;
            weCount++;
            if (att.weekend.total > maxAtt) maxAtt = att.weekend.total;
          }
        }
      });

      const avgMidweek = mwCount > 0 ? Math.round(mwTotal / mwCount) : 0;
      const avgWeekend = weCount > 0 ? Math.round(weTotal / weCount) : 0;
      const totalMeetings = mwCount + weCount;
      const avgOverall = totalMeetings > 0 ? Math.round((mwTotal + weTotal) / totalMeetings) : 0;

      const totalAttendance = mwTotal + weTotal;
      const totalInPerson = mwInPerson + weInPerson;
      const totalZoom = mwZoom + weZoom;

      const inPersonPct = totalAttendance > 0 ? Math.round((totalInPerson / totalAttendance) * 100) : 0;
      const zoomPct = totalAttendance > 0 ? Math.round((totalZoom / totalAttendance) * 100) : 0;
      const hasData = totalMeetings > 0;

      return {
        monthKey: m.monthKey,
        monthNumber: m.monthNumber,
        monthName: m.monthName,
        monthShort: m.monthShort,
        year: m.year,
        weeksCount: matchingWeeks.length,
        midweekTotal: mwTotal,
        midweekInPerson: mwInPerson,
        midweekZoom: mwZoom,
        avgMidweek,
        weekendTotal: weTotal,
        weekendInPerson: weInPerson,
        weekendZoom: weZoom,
        avgWeekend,
        combinedTotal: totalAttendance,
        avgOverall,
        maxAttendance: maxAtt,
        inPersonPct,
        zoomPct,
        hasData,
      };
    });
  }, [serviceYearMonths, weeks]);

  // Annual service year cumulative KPI metrics
  const annualMetrics = useMemo(() => {
    let sumMwAvg = 0;
    let countMwMonths = 0;
    let sumWeAvg = 0;
    let countWeMonths = 0;
    let totalAllAttendance = 0;
    let totalInPersonAll = 0;
    let totalZoomAll = 0;
    let absolutePeak = 0;
    let peakMonth = '';
    let monthsWithData = 0;

    monthlyData.forEach((m) => {
      if (m.hasData) {
        monthsWithData++;
        if (m.avgMidweek > 0) {
          sumMwAvg += m.avgMidweek;
          countMwMonths++;
        }
        if (m.avgWeekend > 0) {
          sumWeAvg += m.avgWeekend;
          countWeMonths++;
        }
        totalAllAttendance += m.combinedTotal;
        totalInPersonAll += (m.midweekInPerson + m.weekendInPerson);
        totalZoomAll += (m.midweekZoom + m.weekendZoom);
        if (m.maxAttendance > absolutePeak) {
          absolutePeak = m.maxAttendance;
          peakMonth = `${m.monthName} ${m.year}`;
        }
      }
    });

    const annualAvgMidweek = countMwMonths > 0 ? Math.round(sumMwAvg / countMwMonths) : 0;
    const annualAvgWeekend = countWeMonths > 0 ? Math.round(sumWeAvg / countWeMonths) : 0;
    const annualAvgOverall =
      countMwMonths + countWeMonths > 0
        ? Math.round((sumMwAvg + sumWeAvg) / (countMwMonths + countWeMonths))
        : 0;

    const annualInPersonPct =
      totalAllAttendance > 0 ? Math.round((totalInPersonAll / totalAllAttendance) * 100) : 0;
    const annualZoomPct =
      totalAllAttendance > 0 ? Math.round((totalZoomAll / totalAllAttendance) * 100) : 0;

    // First half vs second half trend (Sep-Feb vs Mar-Aug)
    const firstHalf = monthlyData.slice(0, 6).filter((m) => m.hasData);
    const secondHalf = monthlyData.slice(6, 12).filter((m) => m.hasData);

    const avgFirstHalf =
      firstHalf.length > 0
        ? Math.round(firstHalf.reduce((acc, m) => acc + m.avgOverall, 0) / firstHalf.length)
        : 0;
    const avgSecondHalf =
      secondHalf.length > 0
        ? Math.round(secondHalf.reduce((acc, m) => acc + m.avgOverall, 0) / secondHalf.length)
        : 0;

    const trendDelta = avgFirstHalf > 0 && avgSecondHalf > 0 ? avgSecondHalf - avgFirstHalf : 0;

    return {
      annualAvgMidweek,
      annualAvgWeekend,
      annualAvgOverall,
      absolutePeak,
      peakMonth,
      totalAllAttendance,
      totalInPersonAll,
      totalZoomAll,
      annualInPersonPct,
      annualZoomPct,
      monthsWithData,
      trendDelta,
    };
  }, [monthlyData]);

  // Compute continuous week-by-week data for the selected service year
  const weeklyData = useMemo(() => {
    // Get start date of Sep 1 and end date of Aug 31
    const [startYearStr, endYearStr] = selectedServiceYear.split('-');
    const minDate = `${startYearStr}-09-01`;
    const maxDate = `${endYearStr}-08-31`;

    const filteredWeeks = weeks
      .filter((w) => {
        const d = w.weekStartDate || w.id;
        return d >= minDate && d <= maxDate;
      })
      .sort((a, b) => (a.weekStartDate || a.id).localeCompare(b.weekStartDate || b.id));

    return filteredWeeks.map((w, idx) => {
      let label = `S${idx + 1}`;
      if (w.weekStartDate) {
        const parts = w.weekStartDate.split('-');
        if (parts.length === 3) {
          label = `${parts[2]}/${parts[1]}`;
        }
      }

      const mw = w.attendance?.midweek?.total || 0;
      const mwP = w.attendance?.midweek?.inPerson || 0;
      const mwZ = w.attendance?.midweek?.zoom || 0;
      const we = w.attendance?.weekend?.total || 0;
      const weP = w.attendance?.weekend?.inPerson || 0;
      const weZ = w.attendance?.weekend?.zoom || 0;
      const total = mw + we;

      return {
        id: w.id,
        label,
        date: w.weekStartDate,
        midweek: mw,
        midweekInPerson: mwP,
        midweekZoom: mwZ,
        weekend: we,
        weekendInPerson: weP,
        weekendZoom: weZ,
        total,
      };
    });
  }, [weeks, selectedServiceYear]);

  // Color palette for charts adapting to light / dark
  const chartColors = useMemo(() => {
    if (isDark) {
      return {
        grid: '#1e293b',
        text: '#94a3b8',
        midweek: '#818cf8', // Indigo 400
        midweekGrad: '#6366f1',
        weekend: '#38bdf8', // Sky 400
        weekendGrad: '#0284c7',
        overall: '#34d399', // Emerald 400
        inPerson: '#10b981', // Emerald 500
        zoom: '#a855f7', // Purple 500
        tooltipBg: '#0f172a',
        tooltipBorder: '#334155',
      };
    }
    return {
      grid: '#f1f5f9',
      text: '#64748b',
      midweek: '#4f46e5', // Indigo 600
      midweekGrad: '#818cf8',
      weekend: '#0284c7', // Sky 600
      weekendGrad: '#38bdf8',
      overall: '#059669', // Emerald 600
      inPerson: '#059669',
      zoom: '#9333ea',
      tooltipBg: '#ffffff',
      tooltipBorder: '#e2e8f0',
    };
  }, [isDark]);

  // Channel proportion data for pie breakdown
  const pieData = useMemo(() => {
    if (annualMetrics.totalAllAttendance === 0) {
      return [
        { name: 'Presencial', value: 75, color: '#10b981' },
        { name: 'Zoom', value: 25, color: '#a855f7' },
      ];
    }
    return [
      { name: 'Presencial', value: annualMetrics.totalInPersonAll, color: '#10b981' },
      { name: 'Zoom', value: annualMetrics.totalZoomAll, color: '#a855f7' },
    ];
  }, [annualMetrics]);

  // Action: Copy annual summary report
  const handleCopyAnnualSummary = () => {
    let report = `📊 INFORME ANUAL DE ASISTENCIA A LAS REUNIONES (S-88)\n`;
    report += `Congregación: ${settings.congregationName}\n`;
    report += `Año de Servicio: ${selectedServiceYear} (1 Sep - 31 Ago)\n`;
    report += `--------------------------------------------------\n\n`;
    report += `📈 RESUMEN DEL AÑO DE SERVICIO:\n`;
    report += `• Promedio Anual Entre Semana (${settings.midweekMeetingDay}): ${annualMetrics.annualAvgMidweek} asistentes\n`;
    report += `• Promedio Anual Fin de Semana (${settings.weekendMeetingDay}): ${annualMetrics.annualAvgWeekend} asistentes\n`;
    report += `• Promedio General de la Congregación: ${annualMetrics.annualAvgOverall} asistentes\n`;
    report += `• Asistencia Máxima del Año: ${annualMetrics.absolutePeak} (${annualMetrics.peakMonth || '—'})\n`;
    report += `• Proporción Anual: ${annualMetrics.annualInPersonPct}% Presencial / ${annualMetrics.annualZoomPct}% Zoom\n`;
    report += `• Asistencia Total Acumulada: ${annualMetrics.totalAllAttendance.toLocaleString()} asistentes\n\n`;
    report += `🗓️ PROMEDIOS MENSUALES (AÑO DE SERVICIO ${selectedServiceYear}):\n`;

    monthlyData.forEach((m) => {
      report += `• ${m.monthName} ${m.year}: General ${m.avgOverall} | Entre Semana ${m.avgMidweek} | Fin de Semana ${m.avgWeekend} (Presencial: ${m.inPersonPct}% / Zoom: ${m.zoomPct}%)\n`;
    });

    navigator.clipboard.writeText(report);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  // Helper to generate seed demo data if the service year is empty
  const handleSeedDemoData = () => {
    if (!onUpdateAttendance) return;
    const [startYearStr, endYearStr] = selectedServiceYear.split('-');
    const startYear = parseInt(startYearStr, 10);
    const endYear = parseInt(endYearStr, 10);

    // Baseline size from publishers count or default 75
    const baseCount = Math.max(50, Math.min(120, settings.congregationName ? 78 : 70));

    weeks.forEach((w) => {
      const d = w.weekStartDate || w.id;
      if (!d) return;
      const parts = d.split('-');
      if (parts.length !== 3) return;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);

      const isInServiceYear =
        (y === startYear && m >= 9) || (y === endYear && m <= 8);

      if (isInServiceYear && (!w.attendance || (w.attendance.midweek.total === 0 && w.attendance.weekend.total === 0))) {
        // Generate realistic variations
        const mwVariation = Math.floor((Math.sin(m * 1.5) + Math.cos(y)) * 6);
        const weVariation = Math.floor((Math.cos(m * 1.2) + Math.sin(m)) * 8);

        const mwTotal = Math.max(30, baseCount - 8 + mwVariation);
        const mwZoom = Math.round(mwTotal * 0.22);
        const mwInPerson = mwTotal - mwZoom;

        const weTotal = Math.max(35, baseCount + 5 + weVariation);
        const weZoom = Math.round(weTotal * 0.18);
        const weInPerson = weTotal - weZoom;

        const att: MeetingAttendance = {
          weekId: w.id,
          midweek: { inPerson: mwInPerson, zoom: mwZoom, total: mwTotal },
          weekend: { inPerson: weInPerson, zoom: weZoom, total: weTotal },
        };
        onUpdateAttendance(w.id, att);
      }
    });
  };

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-2 min-w-[210px] animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-100">
              {data.monthName ? `${data.monthName} ${data.year}` : `Semana ${label}`}
            </span>
            {data.avgOverall !== undefined && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                Promedio: {data.avgOverall}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {/* Midweek breakdown */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Entre Semana:
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {data.avgMidweek ?? data.midweek}
              </span>
            </div>

            {/* Weekend breakdown */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Fin de Semana:
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {data.avgWeekend ?? data.weekend}
              </span>
            </div>

            {/* In-Person vs Zoom Details if available */}
            {data.inPersonPct !== undefined && (
              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-500" />
                  Presencial: {data.inPersonPct}%
                </span>
                <span className="flex items-center gap-1">
                  <Video className="w-3 h-3 text-purple-500" />
                  Zoom: {data.zoomPct}%
                </span>
              </div>
            )}

            {data.maxAttendance > 0 && (
              <div className="text-[10px] text-slate-400 dark:text-slate-500 text-right">
                Pico del mes: {data.maxAttendance} personas
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Filter Controls */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                <BarChart3 className="w-3.5 h-3.5" />
                Dashboard Recharts
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Año Teocrático (1 Sep - 31 Ago)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Tendencia Histórica de Asistencia
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Análisis dinámico de asistencia a las reuniones entre semana y fin de semana para la congregación{' '}
              <strong className="text-white underline decoration-indigo-400">{settings.congregationName}</strong>.
            </p>
          </div>

          {/* Right Selector & Action Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Service Year Selector */}
            <div className="flex items-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 transition-all">
              <Calendar className="w-4 h-4 text-indigo-300 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-300 font-medium">Año de Servicio</span>
                <select
                  value={selectedServiceYear}
                  onChange={(e) => setSelectedServiceYear(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs sm:text-sm outline-hidden cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y} className="text-slate-900 bg-white">
                      Año {y} {y === getCurrentServiceYear() ? '(Actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Copy Report Button */}
            <button
              type="button"
              onClick={handleCopyAnnualSummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Copiar resumen del año de servicio al portapapeles"
            >
              {copiedSummary ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-indigo-300" />
                  <span>Copiar Resumen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Annual KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mt-5 pt-5 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
              Promedio Anual
            </span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {annualMetrics.annualAvgOverall}
            </div>
            <span className="text-[10px] text-indigo-300">Congregación total</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
              Entre Semana
            </span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {annualMetrics.annualAvgMidweek}
            </div>
            <span className="text-[10px] text-slate-300 truncate block">
              {settings.midweekMeetingDay || 'Miércoles'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-sky-300 tracking-wider">
              Fin de Semana
            </span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {annualMetrics.annualAvgWeekend}
            </div>
            <span className="text-[10px] text-slate-300 truncate block">
              {settings.weekendMeetingDay || 'Domingo'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
              Pico Máximo
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
              {annualMetrics.absolutePeak}
            </div>
            <span className="text-[10px] text-slate-300 truncate block">
              {annualMetrics.peakMonth || '—'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
              Presencial / Zoom
            </span>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">
              {annualMetrics.annualInPersonPct}% / {annualMetrics.annualZoomPct}%
            </div>
            <span className="text-[10px] text-emerald-300">Distribución anual</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
              Tendencia Anual
            </span>
            <div className="flex items-center gap-1 text-base sm:text-lg font-black text-white mt-0.5">
              {annualMetrics.trendDelta >= 0 ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">+{annualMetrics.trendDelta}</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4 text-rose-400" />
                  <span className="text-rose-400">{annualMetrics.trendDelta}</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-300 truncate block">
              {annualMetrics.monthsWithData} de 12 meses
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Pills & Visual Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setChartView('trends')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              chartView === 'trends'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tendencia Mensual (Área)</span>
          </button>

          <button
            type="button"
            onClick={() => setChartView('channels')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              chartView === 'channels'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Presencial vs Zoom (Barras)</span>
          </button>

          <button
            type="button"
            onClick={() => setChartView('weekly')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              chartView === 'weekly'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semana a Semana ({weeklyData.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setChartView('table')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              chartView === 'table'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Tabla de Promedios S-88</span>
          </button>
        </div>

        {/* Chart View Secondary Filters */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {chartView === 'trends' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setMeetingFilter('both')}
                className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  meetingFilter === 'both'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setMeetingFilter('midweek')}
                className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  meetingFilter === 'midweek'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Entre Semana
              </button>
              <button
                type="button"
                onClick={() => setMeetingFilter('weekend')}
                className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  meetingFilter === 'weekend'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Fin de Semana
              </button>
            </div>
          )}

          {chartView === 'trends' && (
            <button
              type="button"
              onClick={() => setShowAverageLine(!showAverageLine)}
              className={`p-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                showAverageLine
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent'
              }`}
              title="Alternar línea de promedio anual"
            >
              Línea Meta
            </button>
          )}

          {annualMetrics.monthsWithData === 0 && onUpdateAttendance && (
            <button
              type="button"
              onClick={handleSeedDemoData}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer transition-all active:scale-95"
              title="Cargar datos de asistencia estimados para visualizar las gráficas"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simular Datos</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-4 sm:p-6 shadow-xs">
        {/* VIEW 1: TRENDS (AREA + COMPOSED) */}
        {chartView === 'trends' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Evolución Mensual del Año de Servicio {selectedServiceYear}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Promedio de asistencia por reunión a lo largo de los 12 meses teocráticos.
                </p>
              </div>

              {/* Legend Badges */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {(meetingFilter === 'both' || meetingFilter === 'midweek') && (
                  <span className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
                    <span className="w-3 h-3 rounded-full bg-indigo-500" />
                    Entre Semana ({settings.midweekMeetingDay})
                  </span>
                )}
                {(meetingFilter === 'both' || meetingFilter === 'weekend') && (
                  <span className="flex items-center gap-1.5 font-semibold text-sky-600 dark:text-sky-400">
                    <span className="w-3 h-3 rounded-full bg-sky-500" />
                    Fin de Semana ({settings.weekendMeetingDay})
                  </span>
                )}
                {meetingFilter === 'both' && (
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="w-3 h-1 bg-emerald-500 rounded-full" />
                    Promedio General
                  </span>
                )}
              </div>
            </div>

            <div className="h-[340px] sm:h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyData}
                  margin={{ top: 20, right: 15, left: -10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorMidweek" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.midweek} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={chartColors.midweek} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorWeekend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.weekend} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={chartColors.weekend} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis
                    dataKey="monthShort"
                    stroke={chartColors.text}
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: chartColors.grid }}
                  />
                  <YAxis
                    stroke={chartColors.text}
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: chartColors.grid }}
                    domain={[0, (dataMax: number) => Math.max(80, Math.ceil(dataMax * 1.15))]}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {/* Reference line for annual average */}
                  {showAverageLine && annualMetrics.annualAvgOverall > 0 && (
                    <ReferenceLine
                      y={annualMetrics.annualAvgOverall}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{
                        value: `Promedio: ${annualMetrics.annualAvgOverall}`,
                        position: 'insideTopRight',
                        fill: '#10b981',
                        fontSize: 11,
                        fontWeight: 'bold',
                      }}
                    />
                  )}

                  {/* Midweek Area */}
                  {(meetingFilter === 'both' || meetingFilter === 'midweek') && (
                    <Area
                      type="monotone"
                      dataKey="avgMidweek"
                      name="Entre Semana"
                      stroke={chartColors.midweek}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorMidweek)"
                    />
                  )}

                  {/* Weekend Area */}
                  {(meetingFilter === 'both' || meetingFilter === 'weekend') && (
                    <Area
                      type="monotone"
                      dataKey="avgWeekend"
                      name="Fin de Semana"
                      stroke={chartColors.weekend}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorWeekend)"
                    />
                  )}

                  {/* Overall Average Line */}
                  {meetingFilter === 'both' && (
                    <Line
                      type="monotone"
                      dataKey="avgOverall"
                      name="Promedio General"
                      stroke={chartColors.overall}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: chartColors.overall }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIEW 2: CHANNELS (STACKED BAR PRESENCIAL VS ZOOM) */}
        {chartView === 'channels' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Canales de Asistencia: Salón del Reino vs Zoom
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Volumen mensual acumulado de asistencia presencial física y conexiones virtuales.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-3 h-3 rounded-md bg-emerald-500" />
                  Presencial ({annualMetrics.annualInPersonPct}%)
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-purple-600 dark:text-purple-400">
                  <span className="w-3 h-3 rounded-md bg-purple-500" />
                  Zoom ({annualMetrics.annualZoomPct}%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
              {/* Stacked Bar Chart */}
              <div className="lg:col-span-3 h-[320px] sm:h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 20, right: 15, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                    <XAxis
                      dataKey="monthShort"
                      stroke={chartColors.text}
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: chartColors.grid }}
                    />
                    <YAxis
                      stroke={chartColors.text}
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: chartColors.grid }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey={(d) => d.midweekInPerson + d.weekendInPerson}
                      name="Presencial"
                      stackId="channel"
                      fill={chartColors.inPerson}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey={(d) => d.midweekZoom + d.weekendZoom}
                      name="Zoom"
                      stackId="channel"
                      fill={chartColors.zoom}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Annual Proportion Donut */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Proporción Anual
                </span>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> Presencial:
                    </span>
                    <strong className="text-slate-800 dark:text-white">
                      {annualMetrics.annualInPersonPct}%
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                      <Video className="w-3.5 h-3.5" /> Zoom:
                    </span>
                    <strong className="text-slate-800 dark:text-white">
                      {annualMetrics.annualZoomPct}%
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: WEEKLY TIMELINE */}
        {chartView === 'weekly' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Línea de Tiempo Continua Semana a Semana
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Detalle semanal para identificar picos por visitas del SC, conmemoraciones o asambleas.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Entre Semana
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-sky-600 dark:text-sky-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  Fin de Semana
                </span>
              </div>
            </div>

            {weeklyData.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No hay semanas registradas para el año de servicio {selectedServiceYear}.
              </div>
            ) : (
              <div className="h-[340px] sm:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={weeklyData}
                    margin={{ top: 20, right: 15, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke={chartColors.text}
                      fontSize={10}
                      tickLine={false}
                      interval={Math.max(1, Math.floor(weeklyData.length / 14))}
                      axisLine={{ stroke: chartColors.grid }}
                    />
                    <YAxis
                      stroke={chartColors.text}
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: chartColors.grid }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="midweek"
                      name="Entre Semana"
                      stroke={chartColors.midweek}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weekend"
                      name="Fin de Semana"
                      stroke={chartColors.weekend}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: S-88 TABULAR BREAKDOWN */}
        {chartView === 'table' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Tabla Oficial de Asistencia del Año de Servicio (Formulario S-88)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Desglose mensual de promedios, reuniones celebradas y proporción por canal.
                </p>
              </div>

              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Año {selectedServiceYear}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-2xs uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Mes de Servicio</th>
                    <th className="py-3 px-3 text-center">Semanas</th>
                    <th className="py-3 px-3 text-right">Prom. Entre Semana</th>
                    <th className="py-3 px-3 text-right">Prom. Fin de Semana</th>
                    <th className="py-3 px-3 text-right">Promedio General</th>
                    <th className="py-3 px-3 text-center">Presencial</th>
                    <th className="py-3 px-3 text-center">Zoom</th>
                    <th className="py-3 px-3 text-right">Pico Máximo</th>
                    <th className="py-3 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {monthlyData.map((m, idx) => {
                    const isTopMonth = m.avgOverall > 0 && m.avgOverall === Math.max(...monthlyData.map((d) => d.avgOverall));

                    return (
                      <tr
                        key={m.monthKey}
                        className={`hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors ${
                          !m.hasData ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>{idx + 1}.</span>
                          <span>{m.monthName}</span>
                          <span className="text-2xs text-slate-400 font-normal">({m.year})</span>
                          {isTopMonth && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300/60">
                              Líder
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">{m.weeksCount}</td>
                        <td className="py-3 px-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                          {m.avgMidweek || '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-sky-600 dark:text-sky-400">
                          {m.avgWeekend || '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                          {m.avgOverall || '—'}
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                          {m.hasData ? `${m.inPersonPct}%` : '—'}
                        </td>
                        <td className="py-3 px-3 text-center text-purple-600 dark:text-purple-400 font-bold">
                          {m.hasData ? `${m.zoomPct}%` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                          {m.maxAttendance || '—'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {onSelectMonth && (
                            <button
                              type="button"
                              onClick={() => onSelectMonth(m.monthKey)}
                              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              Ver Semanas
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50/90 dark:bg-slate-800/90 font-black text-slate-900 dark:text-slate-100 border-t-2 border-slate-200 dark:border-slate-700 text-xs">
                  <tr>
                    <td className="py-3 px-4">PROMEDIO ANUAL (S-88)</td>
                    <td className="py-3 px-3 text-center">12 meses</td>
                    <td className="py-3 px-3 text-right text-indigo-600 dark:text-indigo-400">
                      {annualMetrics.annualAvgMidweek}
                    </td>
                    <td className="py-3 px-3 text-right text-sky-600 dark:text-sky-400">
                      {annualMetrics.annualAvgWeekend}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 text-sm">
                      {annualMetrics.annualAvgOverall}
                    </td>
                    <td className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400">
                      {annualMetrics.annualInPersonPct}%
                    </td>
                    <td className="py-3 px-3 text-center text-purple-600 dark:text-purple-400">
                      {annualMetrics.annualZoomPct}%
                    </td>
                    <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400">
                      {annualMetrics.absolutePeak}
                    </td>
                    <td className="py-3 px-3 text-center text-2xs text-slate-400">Oficial</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
