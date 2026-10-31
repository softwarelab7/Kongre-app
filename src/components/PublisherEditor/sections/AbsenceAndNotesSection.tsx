// src/components/PublisherEditor/sections/AbsenceAndNotesSection.tsx
import React, { useMemo } from 'react';
import { Publisher } from '../../../types';
import {
  CalendarDays,
  Plus,
  Plane,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface AbsenceAndNotesSectionProps {
  formData: Publisher;
  handleChange: (field: keyof Publisher, value: any) => void;
  setShowAbsenceModal: (show: boolean) => void;
  handleDeleteAbsence: (id: string) => void;
}

export const AbsenceAndNotesSection: React.FC<AbsenceAndNotesSectionProps> = ({
  formData,
  handleChange,
  setShowAbsenceModal,
  handleDeleteAbsence,
}) => {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const getAbsenceStatus = (start: string, end: string) => {
    if (!start || !end)
      return {
        code: 'scheduled',
        label: 'Programada',
        style: 'bg-zinc-100 text-zinc-600',
      };
    if (todayIso >= start && todayIso <= end) {
      return {
        code: 'active',
        label: 'En curso hoy',
        style:
          'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300/60',
      };
    }
    if (todayIso < start) {
      return {
        code: 'upcoming',
        label: 'Próxima',
        style:
          'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60',
      };
    }
    return {
      code: 'past',
      label: 'Finalizada',
      style: 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400',
    };
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return null;
    try {
      const s = new Date(start + 'T00:00:00');
      const e = new Date(end + 'T00:00:00');
      const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : null;
    } catch {
      return null;
    }
  };

  const absences = formData.ausencias || [];
  const activeOrUpcomingCount = absences.filter((a) => {
    const end = a.end_date || (a as any).endDate || '';
    return end >= todayIso;
  }).length;

  const isCurrentlyAbsent = absences.some((a) => {
    const start = a.start_date || (a as any).startDate || '';
    const end = a.end_date || (a as any).endDate || '';
    return start && end && todayIso >= start && todayIso <= end;
  });

  const totalDaysRegistered = absences.reduce((acc, a) => {
    const start = a.start_date || (a as any).startDate || '';
    const end = a.end_date || (a as any).endDate || '';
    const d = calculateDays(start, end);
    return acc + (d || 0);
  }, 0);

  const notesText = String((formData as any).notes || '');

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* BLOQUE 1: CABECERA EJECUTIVA + CINTA DE KPIs DE DISPONIBILIDAD        */}
      {/* ===================================================================== */}
      <section className="bg-white dark:bg-[#121216] rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-[#27272A] overflow-hidden shadow-xs">
        <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CalendarDays size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20">
                  10 · Disponibilidad y Notas
                </span>
                <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
                  Periodos de Ausencia y Observaciones Administrativas
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Bloqueo preventivo de fechas en el programador de reuniones y registro de disponibilidad laboral o familiar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAbsenceModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Plus size={15} /> Registrar Ausencia
          </button>
        </div>

        {/* CINTA DE 4 INDICADORES (KPI STRIP) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 dark:divide-white/[0.05] bg-zinc-50/60 dark:bg-white/[0.01]">
          <div className="p-4 md:px-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Disponibilidad Hoy
            </p>
            <p
              className={`text-base font-black mt-1 ${
                isCurrentlyAbsent
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isCurrentlyAbsent ? 'En Periodo de Ausencia' : 'Disponible'}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isCurrentlyAbsent
                ? 'Bloqueado para asignaciones hoy'
                : 'Apto para programación semanal'}
            </p>
          </div>

          <div className="p-4 md:px-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Ausencias Vigentes / Próximas
            </p>
            <p className="text-xl font-black font-mono tabular-nums text-zinc-900 dark:text-white mt-1">
              {activeOrUpcomingCount}{' '}
              <span className="text-xs font-semibold text-zinc-400">/ {absences.length} total</span>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Periodos registrados en agenda
            </p>
          </div>

          <div className="p-4 md:px-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Días Acumulados
            </p>
            <p className="text-xl font-black font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
              {totalDaysRegistered} <span className="text-xs font-semibold text-zinc-400">días</span>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Suma de intervalos programados
            </p>
          </div>

          <div className="p-4 md:px-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Notas Administrativas
            </p>
            <p className="text-base font-black text-zinc-900 dark:text-white mt-1">
              {notesText.trim().length > 0 ? 'Con Observaciones' : 'Sin Notas'}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono tabular-nums">
              {notesText.trim().length} caracteres
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* BLOQUES 2 Y 3: AGENDA DE AUSENCIAS + BLOC DE NOTAS ADMINISTRATIVAS     */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloque 2: Agenda de Periodos de Ausencia */}
        <section className="bg-white dark:bg-[#121216] rounded-2xl sm:rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-[#27272A] shadow-xs flex flex-col space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.05] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-black flex items-center justify-center">
                1
              </span>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Calendario de Ausencias y Viajes
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Evita choques al asignar partes en Vida y Ministerio, Discursos o Acomodación
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1 flex-1">
            {absences.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/[0.04] flex items-center justify-center text-zinc-400 mb-3">
                  <Plane size={22} />
                </div>
                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  Sin periodos de ausencia registrados
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5 max-w-xs">
                  El publicador figura disponible para todas las semanas de reunión.
                </p>
              </div>
            ) : (
              absences.map((abs) => {
                const start = abs.start_date || (abs as any).startDate || '';
                const end = abs.end_date || (abs as any).endDate || '';
                const status = getAbsenceStatus(start, end);
                const days = calculateDays(start, end);

                return (
                  <div
                    key={abs.id}
                    className="flex items-center justify-between bg-zinc-50/80 dark:bg-white/[0.02] p-4 rounded-2xl border border-zinc-200/70 dark:border-white/[0.06]"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                          {start}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-semibold px-1.5 py-0.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-md">
                          al
                        </span>
                        <span className="text-xs font-mono font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                          {end}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${status.style}`}
                        >
                          {status.label}
                        </span>
                        {days && (
                          <span className="text-[10px] font-mono font-semibold text-zinc-400 flex items-center gap-1">
                            <Clock size={11} /> {days}d
                          </span>
                        )}
                      </div>
                      {abs.reason && (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                          Motivo: {abs.reason}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAbsence(abs.id)}
                      className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all cursor-pointer"
                      title="Eliminar periodo de ausencia"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Bloque 3: Notas Administrativas y Observaciones */}
        <section className="bg-white dark:bg-[#121216] rounded-2xl sm:rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-[#27272A] shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.05] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-black flex items-center justify-center">
                2
              </span>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Notas Administrativas y Horarios de Disponibilidad
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Turnos laborales rotativos, apoyo familiar o referencias para los ancianos
                </p>
              </div>
            </div>
            {notesText.trim().length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                <CheckCircle2 size={12} /> Guardado
              </span>
            )}
          </div>

          <textarea
            value={notesText}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="kf-input w-full resize-none flex-1 min-h-[210px] text-xs leading-relaxed"
            placeholder="Escribe observaciones sobre disponibilidad para asignaciones, turnos de trabajo, preferencias de acompañamiento en predicación o notas administrativas..."
          />

          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
            <span className="flex items-center gap-1.5">
              <FileText size={12} /> Visible únicamente para administradores y comité
            </span>
            <span className="font-mono tabular-nums">{notesText.length} car.</span>
          </div>
        </section>
      </div>
    </div>
  );
};
