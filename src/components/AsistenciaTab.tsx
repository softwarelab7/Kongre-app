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
} from 'lucide-react';

export const AsistenciaTab: React.FC = () => {
  const { weeks, updateMeetingAttendance, settings } = useCongregation();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    // Current year-month (e.g. 2026-10)
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'cards' | 'table'>('cards');

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
      {/* Top Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold tracking-wide uppercase">
              Módulo Oficial Teocrático
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold">
              Registro del Secretario
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-400" />
            <span>Control de Asistencia a las Reuniones</span>
          </h2>
          <p className="text-blue-100 text-sm mt-1 max-w-2xl">
            Registro semana a semana de asistencia presencial y por Zoom para reuniones de entre
            semana y fin de semana, con cálculo automático de promedios mensuales.
          </p>
        </div>

        {/* Month selector & Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
            <Calendar className="w-4 h-4 text-blue-300" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-bold text-sm outline-hidden cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="text-slate-900">
                  Mes: {m}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCopySecretaryReport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-blue-900 font-bold text-xs hover:bg-blue-50 transition-all shadow-md active:scale-95"
          >
            {copiedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>¡Copiado para el Secretario!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Informe Mensual</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Promedio Entre Semana</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics.avgMidweek}</div>
          <p className="text-2xs text-slate-400 mt-1">
            {settings.midweekMeetingDay} • {metrics.midweekCount} reuniones registradas
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Promedio Fin de Semana</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics.avgWeekend}</div>
          <p className="text-2xs text-slate-400 mt-1">
            {settings.weekendMeetingDay} • {metrics.weekendCount} reuniones registradas
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Promedio General</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics.avgOverall}</div>
          <p className="text-2xs text-slate-400 mt-1">
            Máxima del mes: <strong className="text-slate-700">{metrics.maxAttendance}</strong>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Presencial vs Zoom</span>
            <Video className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {metrics.inPersonPct}% / {metrics.zoomPct}%
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden flex">
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
  );
};
