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

  // Dashboard Chart Mode ('last4weeks' default to highlight the 4-week LineChart comparison)
  const [chartView, setChartView] = useState<
    'last4weeks' | 'trends' | 'channels' | 'weekly' | 'table'
  >('last4weeks');

  // Line series mode for the 4-week comparison LineChart
  const [fourWeeksLineMode, setFourWeeksLineMode] = useState<
    'meetings' | 'channels' | 'all'
  >('meetings');

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

  // Compute Last 4 Weeks Comparative Dataset for Recharts LineChart
  const lastFourWeeksComparison = useMemo(() => {
    const sorted = [...weeks].sort((a, b) =>
      (a.weekStartDate || a.id).localeCompare(b.weekStartDate || b.id)
    );

    // Prefer weeks that have recorded attendance; otherwise take the 4 most recent weeks up to today/latest
    const weeksWithAttendance = sorted.filter(
      (w) =>
        (w.attendance?.midweek?.total || 0) > 0 ||
        (w.attendance?.weekend?.total || 0) > 0
    );

    let selectedFour: WeekSchedule[] = [];
    const isUsingSamplePreview = weeksWithAttendance.length === 0;

    if (weeksWithAttendance.length >= 4) {
      selectedFour = weeksWithAttendance.slice(-4);
    } else if (weeksWithAttendance.length > 0) {
      const lastRecordedIdx = sorted.findIndex(
        (w) => w.id === weeksWithAttendance[weeksWithAttendance.length - 1].id
      );
      const startIdx = Math.max(0, lastRecordedIdx - 3);
      selectedFour = sorted.slice(startIdx, startIdx + 4);
      if (selectedFour.length < 4) {
        selectedFour = sorted.slice(-4);
      }
    } else {
      selectedFour = sorted.slice(0, 4);
    }

    // Fallback baseline values when no attendance has been entered yet so the LineChart is immediately informative
    const sampleFallback = [
      { mwP: 54, mwZ: 16, weP: 66, weZ: 16 },
      { mwP: 57, mwZ: 15, weP: 69, weZ: 17 },
      { mwP: 55, mwZ: 17, weP: 68, weZ: 16 },
      { mwP: 61, mwZ: 15, weP: 74, weZ: 17 },
    ];

    const SHORT_MONTHS = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];

    const items = selectedFour.map((w, idx) => {
      const rawMwP = w.attendance?.midweek?.inPerson || 0;
      const rawMwZ = w.attendance?.midweek?.zoom || 0;
      const rawMwTotal = w.attendance?.midweek?.total || rawMwP + rawMwZ;

      const rawWeP = w.attendance?.weekend?.inPerson || 0;
      const rawWeZ = w.attendance?.weekend?.zoom || 0;
      const rawWeTotal = w.attendance?.weekend?.total || rawWeP + rawWeZ;

      const fb = sampleFallback[idx % sampleFallback.length];

      const midweekInPerson = isUsingSamplePreview ? fb.mwP : rawMwP;
      const midweekZoom = isUsingSamplePreview ? fb.mwZ : rawMwZ;
      const midweek = isUsingSamplePreview ? fb.mwP + fb.mwZ : rawMwTotal;

      const weekendInPerson = isUsingSamplePreview ? fb.weP : rawWeP;
      const weekendZoom = isUsingSamplePreview ? fb.weZ : rawWeZ;
      const weekend = isUsingSamplePreview ? fb.weP + fb.weZ : rawWeTotal;

      const inPersonTotal = midweekInPerson + weekendInPerson;
      const zoomTotal = midweekZoom + weekendZoom;
      const combinedTotal = midweek + weekend;
      const activeMeetingsCount = (midweek > 0 ? 1 : 0) + (weekend > 0 ? 1 : 0);
      const avgOverall =
        activeMeetingsCount > 0 ? Math.round(combinedTotal / activeMeetingsCount) : 0;

      let shortDate = w.weekStartDate || `Sem ${idx + 1}`;
      if (w.weekStartDate) {
        const parts = w.weekStartDate.split('-');
        if (parts.length === 3) {
          const mIdx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
          shortDate = `${parts[2]} ${SHORT_MONTHS[mIdx]}`;
        }
      }

      return {
        weekId: w.id,
        weekNumberLabel: `Semana ${idx + 1}`,
        shortDate,
        axisLabel: `Sem ${idx + 1} (${shortDate})`,
        fullDateRange: w.weekEndDate
          ? `${w.weekStartDate} al ${w.weekEndDate}`
          : w.weekStartDate,
        midweek,
        midweekInPerson,
        midweekZoom,
        weekend,
        weekendInPerson,
        weekendZoom,
        avgOverall,
        inPersonTotal,
        zoomTotal,
        combinedTotal,
        deltaFromPrev: 0,
      };
    });

    // Compute week-over-week delta
    for (let i = 1; i < items.length; i++) {
      items[i].deltaFromPrev = items[i].avgOverall - items[i - 1].avgOverall;
    }

    const validMidweeks = items.filter((i) => i.midweek > 0);
    const validWeekends = items.filter((i) => i.weekend > 0);
    const validOveralls = items.filter((i) => i.avgOverall > 0);

    const avg4Midweek =
      validMidweeks.length > 0
        ? Math.round(validMidweeks.reduce((acc, i) => acc + i.midweek, 0) / validMidweeks.length)
        : 0;
    const avg4Weekend =
      validWeekends.length > 0
        ? Math.round(validWeekends.reduce((acc, i) => acc + i.weekend, 0) / validWeekends.length)
        : 0;
    const avg4Overall =
      validOveralls.length > 0
        ? Math.round(validOveralls.reduce((acc, i) => acc + i.avgOverall, 0) / validOveralls.length)
        : 0;

    const firstWeek = items[0];
    const lastWeek = items[items.length - 1];
    const netChange =
      firstWeek && lastWeek ? lastWeek.avgOverall - firstWeek.avgOverall : 0;
    const netChangePct =
      firstWeek && firstWeek.avgOverall > 0
        ? Number(((netChange / firstWeek.avgOverall) * 100).toFixed(1))
        : 0;

    const peakItem = items.reduce(
      (best, cur) =>
        Math.max(cur.midweek, cur.weekend) > Math.max(best?.midweek || 0, best?.weekend || 0)
          ? cur
          : best,
      items[0]
    );

    return {
      items,
      isUsingSamplePreview,
      avg4Midweek,
      avg4Weekend,
      avg4Overall,
      netChange,
      netChangePct,
      peakValue: peakItem ? Math.max(peakItem.midweek, peakItem.weekend) : 0,
      peakWeekLabel: peakItem ? `${peakItem.weekNumberLabel} (${peakItem.shortDate})` : '—',
    };
  }, [weeks]);

  const handleApplyFourWeekSampleToState = () => {
    if (!onUpdateAttendance) return;
    lastFourWeeksComparison.items.forEach((item) => {
      onUpdateAttendance(item.weekId, {
        weekId: item.weekId,
        midweek: {
          inPerson: item.midweekInPerson,
          zoom: item.midweekZoom,
          total: item.midweek,
        },
        weekend: {
          inPerson: item.weekendInPerson,
          zoom: item.weekendZoom,
          total: item.weekend,
        },
      });
    });
  };

  // Color palette for charts adapting to light / dark
  const chartColors = useMemo(() => {
    if (isDark) {
      return {
        grid: '#1e293b',
        text: '#94a3b8',
        midweek: '#8579F3', // Indigo 400
        midweekGrad: '#6556F0',
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
      midweek: '#4C3AED', // Brand Color
      midweekGrad: '#9085F4',
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
        <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-[#121216]/95 backdrop-blur-md border border-zinc-200 dark:border-[#27272A] shadow-xl text-xs space-y-2 min-w-[210px] animate-fade-in">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#27272A] pb-1.5">
            <span className="font-bold text-zinc-800 dark:text-zinc-100">
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
              <span className="font-extrabold text-zinc-900 dark:text-white">
                {data.avgMidweek ?? data.midweek}
              </span>
            </div>

            {/* Weekend breakdown */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Fin de Semana:
              </span>
              <span className="font-extrabold text-zinc-900 dark:text-white">
                {data.avgWeekend ?? data.weekend}
              </span>
            </div>

            {/* In-Person vs Zoom Details if available */}
            {data.inPersonPct !== undefined && (
              <div className="pt-1.5 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
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
              <div className="text-[10px] text-zinc-400 dark:text-[#71717A] text-right">
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Top Card & Filter Controls (Light/Dark Theme Consistent) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121216] text-zinc-900 dark:text-white shadow-2xs border border-zinc-200 dark:border-[#27272A]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800">
                <BarChart3 className="w-3.5 h-3.5" />
                Año Teocrático (1 Sep - 31 Ago)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white tracking-tight">
              Tendencia Histórica de Asistencia
            </h2>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
              Análisis de asistencia entre semana y fin de semana •{' '}
              <strong className="text-zinc-800 dark:text-[#E4E4E7]">{settings.congregationName}</strong>
            </p>
          </div>

          {/* Right Selector & Action Pills */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            {/* Service Year Selector */}
            <div className="flex items-center justify-center gap-2 bg-zinc-50 dark:bg-[#18181F] px-3 py-2 rounded-xl border border-zinc-200 dark:border-[#27272A]">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <select
                value={selectedServiceYear}
                onChange={(e) => setSelectedServiceYear(e.target.value)}
                className="bg-transparent text-zinc-900 dark:text-white font-bold text-xs outline-hidden cursor-pointer"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y} className="text-zinc-900 bg-white dark:bg-[#121216] dark:text-white">
                    Año {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Copy Report Button */}
            <button
              type="button"
              onClick={handleCopyAnnualSummary}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] font-bold text-xs border border-zinc-200/80 dark:border-[#27272A] transition-all cursor-pointer active:scale-95"
              title="Copiar resumen del año de servicio al portapapeles"
            >
              {copiedSummary ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-emerald-600 dark:text-emerald-400 truncate">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">Copiar Resumen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Annual KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-zinc-100 dark:border-[#27272A]">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/70 dark:border-[#27272A]/70">
            <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-[#A1A1AA] tracking-wider block">
              Promedio Anual
            </span>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-0.5">
              {annualMetrics.annualAvgOverall}
            </div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Congregación total</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/70 dark:border-[#27272A]/70">
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider block">
              Entre Semana
            </span>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-0.5">
              {annualMetrics.annualAvgMidweek}
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] truncate block">
              {settings.midweekMeetingDay || 'Miércoles'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/70 dark:border-[#27272A]/70">
            <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 tracking-wider block">
              Fin de Semana
            </span>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-0.5">
              {annualMetrics.annualAvgWeekend}
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] truncate block">
              {settings.weekendMeetingDay || 'Domingo'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/70 dark:border-[#27272A]/70">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider block">
              Pico Máximo
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {annualMetrics.absolutePeak}
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] truncate block">
              {annualMetrics.peakMonth || '—'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/70 dark:border-[#27272A]/70">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block">
              Presencial / Zoom
            </span>
            <div className="text-base sm:text-lg font-black text-zinc-900 dark:text-white mt-0.5">
              {annualMetrics.annualInPersonPct}% / {annualMetrics.annualZoomPct}%
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Distribución anual</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/70 dark:border-[#27272A]/70">
            <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-[#A1A1AA] tracking-wider block">
              Tendencia Anual
            </span>
            <div className="flex items-center gap-1 text-base sm:text-lg font-black text-zinc-900 dark:text-white mt-0.5">
              {annualMetrics.trendDelta >= 0 ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">+{annualMetrics.trendDelta}</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span className="text-rose-600 dark:text-rose-400">{annualMetrics.trendDelta}</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] truncate block">
              {annualMetrics.monthsWithData} de 12 meses
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Pills & Visual Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#121216] p-2 sm:p-2.5 rounded-2xl border border-zinc-200/90 dark:border-[#27272A]/90 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setChartView('last4weeks')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              chartView === 'last4weeks'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-[#27272A]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Comparativa Últimas 4 Semanas (Líneas)</span>
          </button>

          <button
            type="button"
            onClick={() => setChartView('trends')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              chartView === 'trends'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-[#27272A]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Tendencia Mensual (Área)</span>
          </button>

          <button
            type="button"
            onClick={() => setChartView('channels')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              chartView === 'channels'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-[#27272A]'
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
                : 'text-zinc-600 dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-[#27272A]'
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
                : 'text-zinc-600 dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-[#27272A]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Tabla de Promedios S-88</span>
          </button>
        </div>

        {/* Chart View Secondary Filters */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {chartView === 'last4weeks' && (
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#18181F] p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setFourWeeksLineMode('meetings')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  fourWeeksLineMode === 'meetings'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Por Reunión
              </button>
              <button
                type="button"
                onClick={() => setFourWeeksLineMode('channels')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  fourWeeksLineMode === 'channels'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Presencial vs Zoom
              </button>
              <button
                type="button"
                onClick={() => setFourWeeksLineMode('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  fourWeeksLineMode === 'all'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Todas las Series
              </button>
            </div>
          )}

          {chartView === 'trends' && (
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#18181F] p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setMeetingFilter('both')}
                className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  meetingFilter === 'both'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
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
                    : 'text-zinc-500 hover:text-zinc-800'
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
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Fin de Semana
              </button>
            </div>
          )}

          {(chartView === 'trends' || chartView === 'last4weeks') && (
            <button
              type="button"
              onClick={() => setShowAverageLine(!showAverageLine)}
              className={`p-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                showAverageLine
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-500 border-transparent'
              }`}
              title="Alternar línea de promedio"
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
      <div className="bg-white dark:bg-[#121216] rounded-3xl border border-zinc-200/90 dark:border-[#27272A]/90 p-4 sm:p-6 shadow-xs">
        {/* VIEW 0: COMPARATIVA DE LAS ÚLTIMAS 4 SEMANAS (RECHARTS LINECHART) */}
        {chartView === 'last4weeks' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-[#27272A] pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base sm:text-lg">
                    Tendencia Histórica: Comparativa de las Últimas 4 Semanas
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Recharts LineChart
                  </span>
                  {lastFourWeeksComparison.isUsingSamplePreview && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Vista Previa de Muestra
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                  Evolución comparativa semana a semana entre la Reunión de Entre Semana ({settings.midweekMeetingDay}), Fin de Semana ({settings.weekendMeetingDay}) y el promedio general.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                {(fourWeeksLineMode === 'meetings' || fourWeeksLineMode === 'all') && (
                  <>
                    <span className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
                      <span className="w-3 h-3 rounded-full bg-indigo-500" />
                      Entre Semana ({settings.midweekMeetingDay})
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-sky-600 dark:text-sky-400">
                      <span className="w-3 h-3 rounded-full bg-sky-500" />
                      Fin de Semana ({settings.weekendMeetingDay})
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="w-3 h-1 bg-emerald-500 rounded-full" />
                      Promedio Semanal
                    </span>
                  </>
                )}
                {(fourWeeksLineMode === 'channels' || fourWeeksLineMode === 'all') && (
                  <>
                    <span className="flex items-center gap-1.5 font-semibold text-teal-600 dark:text-teal-400">
                      <span className="w-3 h-3 rounded-full bg-teal-500" />
                      Total Presencial
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-purple-600 dark:text-purple-400">
                      <span className="w-3 h-3 rounded-full bg-purple-500" />
                      Total Zoom
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 4-Week Summary KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-100 dark:border-indigo-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  Prom. 4 Semanas (Entre Semana)
                </span>
                <div className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">
                  {lastFourWeeksComparison.avg4Midweek}
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                  Reunión Vida y Ministerio ({settings.midweekMeetingDay})
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/25 border border-sky-100 dark:border-sky-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block">
                  Prom. 4 Semanas (Fin de Semana)
                </span>
                <div className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">
                  {lastFourWeeksComparison.avg4Weekend}
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                  Discurso Público y Atalaya ({settings.weekendMeetingDay})
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Variación (Sem 1 vs Sem 4)
                </span>
                <div className="flex items-center gap-1.5 text-2xl font-black mt-0.5">
                  {lastFourWeeksComparison.netChange >= 0 ? (
                    <>
                      <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">
                        +{lastFourWeeksComparison.netChange} ({lastFourWeeksComparison.netChangePct}%)
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <span className="text-rose-600 dark:text-rose-400">
                        {lastFourWeeksComparison.netChange} ({lastFourWeeksComparison.netChangePct}%)
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                  Promedio 4 semanas: <strong>{lastFourWeeksComparison.avg4Overall}</strong>
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/25 border border-amber-100 dark:border-amber-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  Mayor Asistencia (4 Semanas)
                </span>
                <div className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">
                  {lastFourWeeksComparison.peakValue}
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] truncate block">
                  {lastFourWeeksComparison.peakWeekLabel}
                </span>
              </div>
            </div>

            {/* Recharts LineChart Comparing the Last 4 Weeks */}
            <div className="h-[340px] sm:h-[390px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={lastFourWeeksComparison.items}
                  margin={{ top: 20, right: 24, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis
                    dataKey="axisLabel"
                    stroke={chartColors.text}
                    fontSize={12}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={{ stroke: chartColors.grid }}
                  />
                  <YAxis
                    stroke={chartColors.text}
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: chartColors.grid }}
                    domain={[0, (dataMax: number) => Math.max(90, Math.ceil(dataMax * 1.15))]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                  {showAverageLine && lastFourWeeksComparison.avg4Overall > 0 && (
                    <ReferenceLine
                      y={lastFourWeeksComparison.avg4Overall}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{
                        value: `Meta Promedio 4 Sem: ${lastFourWeeksComparison.avg4Overall}`,
                        position: 'insideTopRight',
                        fill: '#10b981',
                        fontSize: 11,
                        fontWeight: 'bold',
                      }}
                    />
                  )}

                  {(fourWeeksLineMode === 'meetings' || fourWeeksLineMode === 'all') && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="midweek"
                        name={`Entre Semana (${settings.midweekMeetingDay})`}
                        stroke={chartColors.midweek}
                        strokeWidth={3.5}
                        dot={{ r: 5, strokeWidth: 2, fill: chartColors.midweek }}
                        activeDot={{ r: 7 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weekend"
                        name={`Fin de Semana (${settings.weekendMeetingDay})`}
                        stroke={chartColors.weekend}
                        strokeWidth={3.5}
                        dot={{ r: 5, strokeWidth: 2, fill: chartColors.weekend }}
                        activeDot={{ r: 7 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgOverall"
                        name="Promedio Semanal"
                        stroke={chartColors.overall}
                        strokeWidth={2.5}
                        strokeDasharray="5 5"
                        dot={{ r: 4, strokeWidth: 2, fill: chartColors.overall }}
                        activeDot={{ r: 6 }}
                      />
                    </>
                  )}

                  {(fourWeeksLineMode === 'channels' || fourWeeksLineMode === 'all') && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="inPersonTotal"
                        name="Total Presencial (Salón)"
                        stroke={chartColors.inPerson}
                        strokeWidth={3}
                        dot={{ r: 5, strokeWidth: 2, fill: chartColors.inPerson }}
                        activeDot={{ r: 7 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="zoomTotal"
                        name="Total Zoom (Conexiones)"
                        stroke={chartColors.zoom}
                        strokeWidth={3}
                        dot={{ r: 5, strokeWidth: 2, fill: chartColors.zoom }}
                        activeDot={{ r: 7 }}
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 4-Week Comparative Cards Breakdown */}
            <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-[#27272A]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-[#D4D4D8]">
                  Desglose Comparativo de las Últimas 4 Semanas
                </h4>
                {lastFourWeeksComparison.isUsingSamplePreview && onUpdateAttendance && (
                  <button
                    type="button"
                    onClick={handleApplyFourWeekSampleToState}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Guardar estos datos de 4 semanas en el registro</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {lastFourWeeksComparison.items.map((wItem, idx) => (
                  <div
                    key={wItem.weekId || idx}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/80 dark:border-[#27272A]/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-[#27272A]/60 pb-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                          {wItem.weekNumberLabel}
                        </span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                          Semana del {wItem.shortDate}
                        </span>
                      </div>
                      {idx > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            wItem.deltaFromPrev >= 0
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {wItem.deltaFromPrev >= 0
                            ? `+${wItem.deltaFromPrev}`
                            : wItem.deltaFromPrev}{' '}
                          vs sem. ant.
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-[#A1A1AA]">
                          Entre Semana:
                        </span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {wItem.midweek}{' '}
                          <span className="text-[10px] font-normal text-zinc-400">
                            ({wItem.midweekInPerson}P / {wItem.midweekZoom}Z)
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-[#A1A1AA]">
                          Fin de Semana:
                        </span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">
                          {wItem.weekend}{' '}
                          <span className="text-[10px] font-normal text-zinc-400">
                            ({wItem.weekendInPerson}P / {wItem.weekendZoom}Z)
                          </span>
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-zinc-200/50 dark:border-[#27272A]/50 flex items-center justify-between">
                        <span className="font-semibold text-zinc-700 dark:text-[#D4D4D8]">
                          Promedio Semanal:
                        </span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {wItem.avgOverall}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 1: TRENDS (AREA + COMPOSED) */}
        {chartView === 'trends' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-[#27272A] pb-3">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  Evolución Mensual del Año de Servicio {selectedServiceYear}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-[#27272A] pb-3">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  Canales de Asistencia: Salón del Reino vs Zoom
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
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
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-100 dark:border-[#27272A] text-center space-y-3">
                <span className="text-xs font-bold text-zinc-700 dark:text-[#D4D4D8]">
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
                    <strong className="text-zinc-800 dark:text-white">
                      {annualMetrics.annualInPersonPct}%
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                      <Video className="w-3.5 h-3.5" /> Zoom:
                    </span>
                    <strong className="text-zinc-800 dark:text-white">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-[#27272A] pb-3">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  Línea de Tiempo Continua Semana a Semana
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
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
              <div className="py-16 text-center text-zinc-400 text-xs">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-[#27272A] pb-3">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  Tabla Oficial de Asistencia del Año de Servicio (Formulario S-88)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  Desglose mensual de promedios, reuniones celebradas y proporción por canal.
                </p>
              </div>

              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8]">
                Año {selectedServiceYear}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-[#27272A]">
              <table className="w-full text-left text-xs text-zinc-600 dark:text-[#D4D4D8]">
                <thead className="bg-zinc-50 dark:bg-[#18181F]/80 text-zinc-700 dark:text-[#E4E4E7] text-2xs uppercase tracking-wider font-bold border-b border-zinc-200 dark:border-[#27272A]">
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
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {monthlyData.map((m, idx) => {
                    const isTopMonth = m.avgOverall > 0 && m.avgOverall === Math.max(...monthlyData.map((d) => d.avgOverall));

                    return (
                      <tr
                        key={m.monthKey}
                        className={`hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors ${
                          !m.hasData ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <span>{idx + 1}.</span>
                          <span>{m.monthName}</span>
                          <span className="text-2xs text-zinc-400 font-normal">({m.year})</span>
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
                        <td className="py-3 px-3 text-right font-black text-zinc-900 dark:text-zinc-100">
                          {m.avgOverall || '—'}
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                          {m.hasData ? `${m.inPersonPct}%` : '—'}
                        </td>
                        <td className="py-3 px-3 text-center text-purple-600 dark:text-purple-400 font-bold">
                          {m.hasData ? `${m.zoomPct}%` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-zinc-700 dark:text-[#D4D4D8]">
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
                <tfoot className="bg-zinc-50/90 dark:bg-[#18181F]/90 font-black text-zinc-900 dark:text-zinc-100 border-t-2 border-zinc-200 dark:border-[#27272A] text-xs">
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
                    <td className="py-3 px-3 text-center text-2xs text-zinc-400">Oficial</td>
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
