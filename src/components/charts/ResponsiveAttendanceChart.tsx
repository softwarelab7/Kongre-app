// src/components/charts/ResponsiveAttendanceChart.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { WeekSchedule } from '../../types';
import { Users, TrendingUp, Sparkles } from 'lucide-react';

interface ResponsiveAttendanceChartProps {
  weeks: WeekSchedule[];
}

interface WeekAttendancePoint {
  id: string;
  label: string;       // e.g. '12 Oct'
  fullDate: string;
  midweekTotal: number;
  midweekInPerson: number;
  midweekZoom: number;
  weekendTotal: number;
  weekendInPerson: number;
  weekendZoom: number;
  combinedTotal: number;
}

export const ResponsiveAttendanceChart: React.FC<ResponsiveAttendanceChartProps> = ({ weeks }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ width: number; height: number }>({ width: 350, height: 230 });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Keep pixel size responsive
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

  // Compute last 4 to 6 weeks of attendance
  const attendanceData: WeekAttendancePoint[] = useMemo(() => {
    // If weeks exist in context, sort chronologically and take up to 6
    const sortedWeeks = [...weeks].sort((a, b) => {
      const dateA = a.weekStartDate || a.id;
      const dateB = b.weekStartDate || b.id;
      return dateA.localeCompare(dateB);
    });

    const recentWeeks = sortedWeeks.slice(-5); // last 5 weeks

    if (recentWeeks.length > 0) {
      return recentWeeks.map((w, idx) => {
        let label = `Sem ${idx + 1}`;
        let fullDate = w.weekStartDate || w.id;

        if (w.weekStartDate) {
          try {
            const parts = w.weekStartDate.split('-');
            if (parts.length === 3) {
              const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
              const day = d.getDate();
              const monthShort = d.toLocaleString('es-ES', { month: 'short' });
              label = `${day} ${monthShort}`;
              fullDate = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
            }
          } catch {
            // fallback
          }
        }

        const mid = w.attendance?.midweek;
        const wknd = w.attendance?.weekend;

        const midweekInPerson = mid?.inPerson || 0;
        const midweekZoom = mid?.zoom || 0;
        const midweekTotal = mid?.total || (midweekInPerson + midweekZoom);

        const weekendInPerson = wknd?.inPerson || 0;
        const weekendZoom = wknd?.zoom || 0;
        const weekendTotal = wknd?.total || (weekendInPerson + weekendZoom);

        return {
          id: w.id,
          label,
          fullDate,
          midweekTotal,
          midweekInPerson,
          midweekZoom,
          weekendTotal,
          weekendInPerson,
          weekendZoom,
          combinedTotal: midweekTotal + weekendTotal,
        };
      });
    }

    // Default 4 recent dates if no weeks exist yet
    const now = new Date();
    const fallback: WeekAttendancePoint[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
      const day = d.getDate();
      const monthShort = d.toLocaleString('es-ES', { month: 'short' });
      fallback.push({
        id: `mock-${i}`,
        label: `${day} ${monthShort}`,
        fullDate: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }),
        midweekTotal: 0,
        midweekInPerson: 0,
        midweekZoom: 0,
        weekendTotal: 0,
        weekendInPerson: 0,
        weekendZoom: 0,
        combinedTotal: 0,
      });
    }
    return fallback;
  }, [weeks]);

  // Overall attendance stats
  const stats = useMemo(() => {
    let sumMidweek = 0;
    let sumWeekend = 0;
    let countMidweek = 0;
    let countWeekend = 0;

    attendanceData.forEach((d) => {
      if (d.midweekTotal > 0) {
        sumMidweek += d.midweekTotal;
        countMidweek++;
      }
      if (d.weekendTotal > 0) {
        sumWeekend += d.weekendTotal;
        countWeekend++;
      }
    });

    const avgMidweek = countMidweek > 0 ? Math.round(sumMidweek / countMidweek) : 0;
    const avgWeekend = countWeekend > 0 ? Math.round(sumWeekend / countWeekend) : 0;

    return { avgMidweek, avgWeekend };
  }, [attendanceData]);

  // Plot layout calculations
  const padding = { top: 20, right: 16, bottom: 38, left: 36 };
  const plotWidth = Math.max(80, dims.width - padding.left - padding.right);
  const plotHeight = Math.max(80, dims.height - padding.top - padding.bottom);
  const baselineY = padding.top + plotHeight;

  // Max value for scale
  const maxAtt = useMemo(() => {
    const rawMax = Math.max(
      ...attendanceData.map((d) => Math.max(d.midweekTotal, d.weekendTotal)),
      0
    );
    if (rawMax === 0) return 100;
    if (rawMax <= 50) return 60;
    if (rawMax <= 100) return 120;
    if (rawMax <= 150) return 180;
    return Math.ceil(rawMax * 1.25 / 20) * 20;
  }, [attendanceData]);

  const yTicks = [
    { value: maxAtt, y: padding.top },
    { value: Math.round(maxAtt * 0.5), y: padding.top + plotHeight * 0.5 },
    { value: 0, y: baselineY },
  ];

  const groupWidth = plotWidth / Math.max(1, attendanceData.length);
  const barWidth = Math.min(18, Math.max(8, (groupWidth - 14) / 2));

  const currentHover = hoveredIdx !== null ? attendanceData[hoveredIdx] : null;

  return (
    <div className="bg-white dark:bg-[#121216] rounded-xl border border-zinc-200 dark:border-[#27272A] p-5 shadow-xs flex flex-col justify-between">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-[#F4F4F5]">
              Asistencia
            </h3>
            {stats.avgWeekend > 0 && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md font-mono tabular-nums">
                ~{stats.avgWeekend} prom.
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">Últimas semanas de reunión</p>
        </div>

        {/* LEGEND */}
        <div className="flex flex-col items-end gap-1 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-[#F4F4F5]">
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />
            Fin de Sem.
          </span>
          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-[#F4F4F5]">
            <span className="w-2.5 h-2.5 rounded-xs bg-violet-400 inline-block" />
            Entre Sem.
          </span>
        </div>
      </div>

      {/* SVG PLOT */}
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
          {/* Horizontal Grid lines and labels */}
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
                x={padding.left - 6}
                y={tick.y + 3}
                textAnchor="end"
                className="text-[10px] font-semibold fill-zinc-400 font-mono"
              >
                {tick.value}
              </text>
            </g>
          ))}

          {/* Grouped Bars per week */}
          {attendanceData.map((d, i) => {
            const groupCenterX = padding.left + i * groupWidth + groupWidth / 2;
            const midHeight = (d.midweekTotal / maxAtt) * plotHeight;
            const wkndHeight = (d.weekendTotal / maxAtt) * plotHeight;

            const midX = groupCenterX - barWidth - 1.5;
            const wkndX = groupCenterX + 1.5;

            const midY = baselineY - midHeight;
            const wkndY = baselineY - wkndHeight;

            const isHovered = hoveredIdx === i;

            return (
              <g key={d.id} className="cursor-pointer">
                {/* Midweek Bar (Entre semana: violet) */}
                <rect
                  x={midX}
                  y={midY}
                  width={barWidth}
                  height={Math.max(2, midHeight)}
                  rx={3}
                  className={`transition-all duration-200 ${
                    isHovered
                      ? 'fill-violet-500 shadow-lg'
                      : 'fill-violet-400 dark:fill-violet-500/80 hover:fill-violet-500'
                  }`}
                />

                {/* Weekend Bar (Fin de semana: indigo) */}
                <rect
                  x={wkndX}
                  y={wkndY}
                  width={barWidth}
                  height={Math.max(2, wkndHeight)}
                  rx={3}
                  className={`transition-all duration-200 ${
                    isHovered
                      ? 'fill-indigo-700 shadow-lg'
                      : 'fill-indigo-600 dark:fill-indigo-500 hover:fill-indigo-700'
                  }`}
                />

                {/* X-axis date label */}
                <text
                  x={groupCenterX}
                  y={baselineY + 16}
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

          {/* Transparent hit boxes for easy mouse/touch selection */}
          {attendanceData.map((_, i) => (
            <rect
              key={i}
              x={padding.left + i * groupWidth}
              y={padding.top}
              width={groupWidth}
              height={plotHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onTouchStart={() => setHoveredIdx(i)}
            />
          ))}
        </svg>

        {/* HOVER TOOLTIP */}
        {currentHover && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full pb-3 transition-transform duration-75"
            style={{
              left: `${padding.left + hoveredIdx! * groupWidth + groupWidth / 2}px`,
              top: `${padding.top + 70}px`,
            }}
          >
            <div className="bg-zinc-900/95 dark:bg-zinc-950/95 text-white backdrop-blur-md rounded-xl p-3 shadow-xl border border-white/10 text-xs min-w-[170px]">
              <div className="font-bold text-zinc-200 border-b border-white/10 pb-1 mb-1.5 flex items-center justify-between">
                <span>{currentHover.label}</span>
                <span className="text-[10px] font-normal text-zinc-400">
                  {currentHover.fullDate}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                    Fin de Sem:
                  </span>
                  <span className="font-bold text-white font-mono">
                    {currentHover.weekendTotal}
                    {currentHover.weekendInPerson > 0 && (
                      <span className="text-[9px] text-zinc-400 font-normal ml-1">
                        ({currentHover.weekendInPerson}p + {currentHover.weekendZoom}z)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-violet-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
                    Entre Sem:
                  </span>
                  <span className="font-bold text-white font-mono">
                    {currentHover.midweekTotal}
                    {currentHover.midweekInPerson > 0 && (
                      <span className="text-[9px] text-zinc-400 font-normal ml-1">
                        ({currentHover.midweekInPerson}p + {currentHover.midweekZoom}z)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER STAT */}
      <div className="pt-2 mt-1 border-t border-zinc-200 dark:border-[#27272A] flex items-center justify-between text-xs text-zinc-500 dark:text-[#A1A1AA]">
        <span>Promedio Fin de Semana</span>
        <span className="font-mono font-bold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
          {stats.avgWeekend > 0 ? `${stats.avgWeekend} personas` : 'Sin registros'}
        </span>
      </div>
    </div>
  );
};
