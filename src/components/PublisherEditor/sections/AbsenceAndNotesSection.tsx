// src/components/PublisherEditor/sections/AbsenceAndNotesSection.tsx
import React, { useMemo } from 'react';
import { Publisher } from '../../../types';
import {
  CalendarDays,
  Plus,
  Plane,
  Trash2,
  History,
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
    if (!start || !end) return { label: 'Programada', style: 'bg-zinc-100 text-zinc-600' };
    if (todayIso >= start && todayIso <= end) {
      return {
        label: 'En curso hoy',
        style:
          'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300/60',
      };
    }
    if (todayIso < start) {
      return {
        label: 'Próxima',
        style:
          'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60',
      };
    }
    return {
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

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Absence Card */}
      <div className="bg-white dark:bg-[#0f1623] rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-white/[0.06] shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
              <CalendarDays size={18} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-zinc-800 dark:text-zinc-200">
                Periodos de Ausencia
              </h3>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                Evita programar asignaciones en fechas no disponibles
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAbsenceModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus size={14} /> Registrar Ausencia
          </button>
        </div>

        <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1 flex-1">
          {(formData.ausencias || []).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-8 opacity-50">
              <Plane size={32} className="text-zinc-400 mb-2" />
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Sin periodos de ausencia registrados
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                El publicador figura disponible para todas las semanas
              </p>
            </div>
          ) : (
            (formData.ausencias || []).map((abs) => {
              const start = abs.start_date || (abs as any).startDate || '';
              const end = abs.end_date || (abs as any).endDate || '';
              const status = getAbsenceStatus(start, end);
              const days = calculateDays(start, end);

              return (
                <div
                  key={abs.id}
                  className="flex items-center justify-between bg-zinc-50 dark:bg-white/[0.02] p-3.5 rounded-2xl border border-zinc-200/60 dark:border-white/[0.05] group"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {start}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-semibold px-1.5 py-0.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-md">
                        al
                      </span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {end}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.style}`}>
                        {status.label}
                      </span>
                      {days && (
                        <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-0.5">
                          <Clock size={10} /> {days}d
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
      </div>

      {/* Notes Card */}
      <div className="bg-white dark:bg-[#0f1623] rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-white/[0.06] shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <History size={18} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-zinc-800 dark:text-zinc-200">
                Notas Administrativas y Observaciones
              </h3>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                Detalles de disponibilidad, horarios laborales o referencias internas
              </p>
            </div>
          </div>
          {formData.notes && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={12} /> Con notas
            </span>
          )}
        </div>
        <textarea
          value={(formData as any).notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="kf-input w-full resize-none flex-1 min-h-[180px] text-xs"
          placeholder="Escribe observaciones sobre disponibilidad para asignaciones, turnos de trabajo, apoyo familiar o hitos administrativos..."
        />
      </div>
    </section>
  );
};
