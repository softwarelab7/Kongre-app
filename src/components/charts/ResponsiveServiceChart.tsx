// src/components/charts/ResponsiveServiceChart.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Publisher, MonthlyServiceReport } from '../../types';
import { Clock, BookOpen, TrendingUp, Calendar, Users, Award } from 'lucide-react';

interface ResponsiveServiceChartProps {
  publishers: Publisher[];
  monthlyReports: MonthlyServiceReport[];
}

interface MonthDataPoint {
  key: string;       // 'YYYY-MM'
  label: string;     // 'Oct' or 'Oct 25'
  fullLabel: string; // 'Octubre 2025'
  year: number;
  monthIndex: number;
  hours: number;
  studies: number;
  publishersCount: number;
}

const SPANISH_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const SPANISH_MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

// Helper to construct smooth cubic bezier curves
function getCurvedPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function getAreaPath(points: { x: number; y: number }[], baselineY: number): string {
  if (points.length === 0) return '';
  const curve = getCurvedPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${curve} L ${last.x.toFixed(1)} ${baselineY.toFixed(1)} L ${first.x.toFixed(1)} ${baselineY.toFixed(1)} Z`;
}

export const ResponsiveServiceChart: React.FC<ResponsiveServiceChartProps> = ({
  publishers,
  monthlyReports,
}) => {
  const [range, setRange] = useState<'6' | '12'>('6');
  const [activeMetric, setActiveMetric] = useState<'horas' | 'estudios' | 'ambos'>('ambos');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ width: number; height: number }>({ width: 700, height: 230 });

  // Keep pixel size in sync with container to eliminate stretching
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0) {
          setDims({
            width: Math.floor(rect.width),
            height: 230,
          });
        }
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute month points backwards from current month
  const chartData: MonthDataPoint[] = useMemo(() => {
    const count = range === '6' ? 6 : 12;
    const now = new Date();
    const result: MonthDataPoint[] = [];

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth(); // 0..11
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const shortMonth = SPANISH_MONTHS_SHORT[monthIdx];
      const fullMonth = `${SPANISH_MONTHS[monthIdx]} ${year}`;

      // Aggregate from monthlyReports
      let hoursSum = 0;
      let studiesSum = 0;
      let pubsReporting = 0;

      const directReports = monthlyReports.filter((r) => r.month === key && r.participated);
      if (directReports.length > 0) {
        directReports.forEach((r) => {
          hoursSum += r.hours || 0;
          studiesSum += r.bibleStudies || 0;
        });
        pubsReporting = directReports.length;
      }

      // Also check publisher S-21 records (service year usually spans Sep-Aug)
      const serviceYear = monthIdx >= 8 ? String(year + 1) : String(year);
      publishers.forEach((p) => {
        const s21Recs = (p.s21_records || {})[serviceYear];
        if (Array.isArray(s21Recs)) {
          // Look for month by index or key
          const monthName = SPANISH_MONTHS[monthIdx].toLowerCase();
          const found = s21Recs.find(
            (rec: any) =>
              rec.month?.toLowerCase() === monthName ||
              rec.monthKey === key ||
              rec.monthKey === `${year}-${String(monthIdx + 1).padStart(2, '0')}`
          );
          if (found && (found.participated || (found.hours && found.hours > 0))) {
            // Only add if not already captured in direct monthlyReports
            const alreadyInMonthly = directReports.some((r) => r.publisherId === p.id);
            if (!alreadyInMonthly) {
              hoursSum += (found.hours || 0) + (found.credit || 0);
              studiesSum += found.bible_studies || found.bibleStudies || 0;
              pubsReporting++;
            }
          }
        }
      });

      result.push({
        key,
        label: count === 12 ? `${shortMonth}` : `${shortMonth} '${String(year).slice(2)}`,
        fullLabel: fullMonth,
        year,
        monthIndex: monthIdx,
        hours: hoursSum,
        studies: studiesSum,
        publishersCount: pubsReporting,
      });
    }

    return result;
  }, [range, monthlyReports, publishers]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalHours = 0;
    let totalStudies = 0;
    let maxHours = 0;
    let peakMonth = '';

    chartData.forEach((d) => {
      totalHours += d.hours;
      totalStudies += d.studies;
      if (d.hours > maxHours) {
        maxHours = d.hours;
        peakMonth = d.fullLabel;
      }
    });

    const avgHours = chartData.length > 0 ? Math.round(totalHours / chartData.length) : 0;
    const avgStudies = chartData.length > 0 ? Math.round(totalStudies / chartData.length) : 0;

    return {
      totalHours,
      totalStudies,
      avgHours,
      avgStudies,
      peakMonth: peakMonth || 'Sin registros',
      maxHours,
    };
  }, [chartData]);

  // Calculate coordinates within exact pixel dimensions
  const padding = { top: 24, right: 28, bottom: 38, left: 46 };
  const plotWidth = Math.max(100, dims.width - padding.left - padding.right);
  const plotHeight = Math.max(80, dims.height - padding.top - padding.bottom);
  const baselineY = padding.top + plotHeight;

  // Dynamic Y scales
  const maxHoursValue = useMemo(() => {
    const rawMax = Math.max(...chartData.map((d) => d.hours), 0);
    if (rawMax === 0) return 40; // Clean non-zero default scale
    if (rawMax <= 20) return 25;
    if (rawMax <= 50) return 60;
    if (rawMax <= 100) return 120;
    if (rawMax <= 250) return 300;
    if (rawMax <= 500) return 600;
    return Math.ceil(rawMax * 1.2 / 50) * 50;
  }, [chartData]);

  const maxStudiesValue = useMemo(() => {
    const rawMax = Math.max(...chartData.map((d) => d.studies), 0);
    if (rawMax === 0) return 10;
    return Math.max(10, Math.ceil(rawMax * 1.25));
  }, [chartData]);

  // Calculate points
  const hourPoints = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.map((d, i) => {
      const x = padding.left + (i / Math.max(1, chartData.length - 1)) * plotWidth;
      const y = baselineY - (d.hours / maxHoursValue) * plotHeight;
      return { x, y, data: d };
    });
  }, [chartData, plotWidth, plotHeight, baselineY, padding.left, maxHoursValue]);

  const studyPoints = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.map((d, i) => {
      const x = padding.left + (i / Math.max(1, chartData.length - 1)) * plotWidth;
      const y = baselineY - (d.studies / maxStudiesValue) * plotHeight;
      return { x, y, data: d };
    });
  }, [chartData, plotWidth, plotHeight, baselineY, padding.left, maxStudiesValue]);

  // SVG Paths
  const hourPath = useMemo(() => getCurvedPath(hourPoints), [hourPoints]);
  const hourAreaPath = useMemo(() => getAreaPath(hourPoints, baselineY), [hourPoints, baselineY]);
  const studyPath = useMemo(() => getCurvedPath(studyPoints), [studyPoints]);

  // Y-ticks
  const yTicks = [
    { value: maxHoursValue, y: padding.top },
    { value: Math.round(maxHoursValue * 0.66), y: padding.top + plotHeight * 0.34 },
    { value: Math.round(maxHoursValue * 0.33), y: padding.top + plotHeight * 0.67 },
    { value: 0, y: baselineY },
  ];

  const currentHover = hoveredIdx !== null ? chartData[hoveredIdx] : null;
  const currentHoverPoint = hoveredIdx !== null ? hourPoints[hoveredIdx] : null;

  return (
    <div className="bg-white dark:bg-[#121216] rounded-xl border border-zinc-200 dark:border-[#27272A] p-5 shadow-xs flex flex-col justify-between">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-[#F4F4F5] tracking-tight">
              Actividad de Servicio del Campo
            </h3>
            {stats.totalHours > 0 && (
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md font-mono tabular-nums">
                {stats.totalHours} hrs totales
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] font-medium mt-0.5">
            Registro dinámico de horas de predicación y estudios bíblicos
          </p>
        </div>

        {/* CONTROLS: METRICS & RANGE */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Metric Selector */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveMetric('ambos')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                activeMetric === 'ambos'
                  ? 'bg-white dark:bg-[#27272A] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-white'
              }`}
            >
              Ambos
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('horas')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                activeMetric === 'horas'
                  ? 'bg-white dark:bg-[#27272A] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-white'
              }`}
            >
              Horas
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('estudios')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                activeMetric === 'estudios'
                  ? 'bg-white dark:bg-[#27272A] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-white'
              }`}
            >
              Estudios
            </button>
          </div>

          {/* Range Selector */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setRange('6')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                range === '6'
                  ? 'bg-white dark:bg-[#27272A] text-zinc-900 dark:text-[#F4F4F5] shadow-xs'
                  : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-white'
              }`}
            >
              6 meses
            </button>
            <button
              type="button"
              onClick={() => setRange('12')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                range === '12'
                  ? 'bg-white dark:bg-[#27272A] text-zinc-900 dark:text-[#F4F4F5] shadow-xs'
                  : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-white'
              }`}
            >
              12 meses
            </button>
          </div>
        </div>
      </div>

      {/* LEGEND INDICATORS */}
      <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500 dark:text-[#A1A1AA] mb-2">
        {(activeMetric === 'horas' || activeMetric === 'ambos') && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-900 inline-block" />
            <span className="text-zinc-700 dark:text-[#E4E4E7]">Horas de Predicación</span>
          </span>
        )}
        {(activeMetric === 'estudios' || activeMetric === 'ambos') && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900 inline-block" />
            <span className="text-zinc-700 dark:text-[#E4E4E7]">Estudios Bíblicos</span>
          </span>
        )}
      </div>

      {/* MAIN CHART CONTAINER */}
      <div
        ref={containerRef}
        className="relative w-full h-[230px] select-none touch-none"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <svg
          width={dims.width}
          height={dims.height}
          viewBox={`0 0 ${dims.width} ${dims.height}`}
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Area Gradient for Hours */}
            <linearGradient id="serviceHoursGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6556F0" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#6556F0" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#6556F0" stopOpacity="0.00" />
            </linearGradient>

            {/* Subtle glow filter for interactive dots */}
            <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6556F0" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Grid lines and Y labels */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={dims.width - padding.right}
                y2={tick.y}
                stroke="currentColor"
                strokeDasharray={i === yTicks.length - 1 ? undefined : '3 3'}
                strokeWidth={i === yTicks.length - 1 ? 1.5 : 1}
                className="text-zinc-200 dark:text-zinc-700/60"
              />
              <text
                x={padding.left - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] font-semibold fill-zinc-400 dark:fill-zinc-500 font-mono"
              >
                {tick.value}h
              </text>
            </g>
          ))}

          {/* Area fill for hours */}
          {(activeMetric === 'horas' || activeMetric === 'ambos') && hourAreaPath && (
            <path
              d={hourAreaPath}
              fill="url(#serviceHoursGradient)"
              className="transition-all duration-300"
            />
          )}

          {/* Smooth Bezier line for Hours */}
          {(activeMetric === 'horas' || activeMetric === 'ambos') && hourPath && (
            <path
              d={hourPath}
              fill="none"
              stroke="#6556F0"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Smooth line for Bible Studies */}
          {(activeMetric === 'estudios' || activeMetric === 'ambos') && studyPath && (
            <path
              d={studyPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={2.2}
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* X-Axis Month Labels */}
          {chartData.map((d, i) => {
            const x = padding.left + (i / Math.max(1, chartData.length - 1)) * plotWidth;
            const isHovered = hoveredIdx === i;
            return (
              <g key={i}>
                <text
                  x={x}
                  y={baselineY + 18}
                  textAnchor="middle"
                  className={`text-[10px] font-semibold transition-colors ${
                    isHovered
                      ? 'fill-indigo-600 dark:fill-indigo-400 font-bold'
                      : 'fill-zinc-400 dark:fill-zinc-500'
                  }`}
                >
                  {d.label}
                </text>
              </g>
            );
          })}

          {/* Active Hover Guideline and Data Points */}
          {hoveredIdx !== null && (
            <g>
              <line
                x1={hourPoints[hoveredIdx].x}
                y1={padding.top}
                x2={hourPoints[hoveredIdx].x}
                y2={baselineY}
                stroke="#6556F0"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                className="opacity-70 dark:opacity-80"
              />

              {/* Glowing Point for Hours */}
              {(activeMetric === 'horas' || activeMetric === 'ambos') && (
                <circle
                  cx={hourPoints[hoveredIdx].x}
                  cy={hourPoints[hoveredIdx].y}
                  r={6}
                  fill="#6556F0"
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  filter="url(#pointGlow)"
                />
              )}

              {/* Glowing Point for Studies */}
              {(activeMetric === 'estudios' || activeMetric === 'ambos') && (
                <circle
                  cx={studyPoints[hoveredIdx].x}
                  cy={studyPoints[hoveredIdx].y}
                  r={5}
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            </g>
          )}

          {/* Invisible interactive vertical touch/mouse zones */}
          {chartData.map((_, i) => {
            const sliceWidth = plotWidth / Math.max(1, chartData.length - 1);
            const x = padding.left + i * sliceWidth - sliceWidth / 2;
            return (
              <rect
                key={i}
                x={Math.max(padding.left, x)}
                y={padding.top}
                width={sliceWidth}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onTouchStart={() => setHoveredIdx(i)}
              />
            );
          })}
        </svg>

        {/* FLOATING HOVER TOOLTIP */}
        {currentHover && currentHoverPoint && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full pb-3 transition-transform duration-75"
            style={{
              left: `${currentHoverPoint.x}px`,
              top: `${Math.max(padding.top + 30, currentHoverPoint.y)}px`,
            }}
          >
            <div className="bg-zinc-900/95 dark:bg-zinc-950/95 text-white backdrop-blur-md rounded-xl p-3 shadow-xl border border-white/10 text-xs min-w-[150px]">
              <div className="font-bold text-zinc-200 border-b border-white/10 pb-1 mb-1.5 flex items-center justify-between">
                <span>{currentHover.fullLabel}</span>
                <span className="text-[10px] font-normal text-zinc-400">
                  {currentHover.publishersCount} publ.
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                    Horas:
                  </span>
                  <span className="font-bold text-white font-mono">{currentHover.hours}h</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    Estudios:
                  </span>
                  <span className="font-bold text-white font-mono">{currentHover.studies}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER METRICS SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 mt-1 border-t border-zinc-200 dark:border-[#27272A] text-xs">
        <div>
          <span className="text-zinc-500 dark:text-[#A1A1AA] block text-[11px]">Promedio mensual</span>
          <span className="font-mono font-bold tabular-nums text-zinc-900 dark:text-[#F4F4F5] text-sm">
            {stats.avgHours} hrs
          </span>
        </div>
        <div>
          <span className="text-zinc-500 dark:text-[#A1A1AA] block text-[11px]">Estudios activos</span>
          <span className="font-mono font-bold tabular-nums text-zinc-900 dark:text-[#F4F4F5] text-sm">
            {stats.totalStudies} bibl.
          </span>
        </div>
        <div>
          <span className="text-zinc-500 dark:text-[#A1A1AA] block text-[11px]">Mes más activo</span>
          <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm truncate block">
            {stats.peakMonth}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 dark:text-[#A1A1AA] block text-[11px]">Tendencia</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {stats.totalHours > 0 ? 'Activo' : 'Sin datos'}
          </span>
        </div>
      </div>
    </div>
  );
};
