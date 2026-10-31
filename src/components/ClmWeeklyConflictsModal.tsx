import React, { useMemo } from 'react';
import type {
  ClmPrograma,
  ClmParte,
  Publisher,
  WeekSchedule,
  OutgoingSpeakerAssignment,
} from '../types';
import { checkPublisherConflictsOnDate, AssignmentConflict } from '../utils/assignmentConflictChecker';
import {
  X,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  ArrowRightLeft,
  Calendar,
  MessageCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface ClmWeeklyConflictsModalProps {
  isOpen: boolean;
  onClose: () => void;
  programa: ClmPrograma;
  publishers: Publisher[];
  weeks?: WeekSchedule[];
  outgoingSpeakers?: OutgoingSpeakerAssignment[];
  onOpenReplacementForPart: (part: ClmParte) => void;
}

export interface PartConflictItem {
  part: ClmParte;
  titularConflicts: AssignmentConflict[];
  ayudanteConflicts: AssignmentConflict[];
}

export const ClmWeeklyConflictsModal: React.FC<ClmWeeklyConflictsModalProps> = ({
  isOpen,
  onClose,
  programa,
  publishers,
  weeks = [],
  outgoingSpeakers = [],
  onOpenReplacementForPart,
}) => {
  // Analizar todas las partes del programa
  const conflictItems = useMemo(() => {
    if (!programa?.partes) return [];

    const items: PartConflictItem[] = [];

    programa.partes.forEach((parte) => {
      // 1. Titular
      let titularConflicts: AssignmentConflict[] = [];
      if (parte.asignado_nombre || parte.asignado_nid) {
        titularConflicts = checkPublisherConflictsOnDate(
          parte.asignado_nid || '',
          parte.asignado_nombre,
          programa.semana_fecha,
          {
            clmProgramas: [programa],
            weeks,
            publishers,
            outgoingSpeakers,
          },
          parte.id
        ).conflicts;
      }

      // 2. Ayudante
      let ayudanteConflicts: AssignmentConflict[] = [];
      if (parte.asignado_auxiliar_nombre || parte.asignado_auxiliar_nid) {
        ayudanteConflicts = checkPublisherConflictsOnDate(
          parte.asignado_auxiliar_nid || '',
          parte.asignado_auxiliar_nombre,
          programa.semana_fecha,
          {
            clmProgramas: [programa],
            weeks,
            publishers,
            outgoingSpeakers,
          },
          parte.id
        ).conflicts;
      }

      if (titularConflicts.length > 0 || ayudanteConflicts.length > 0) {
        items.push({
          part: parte,
          titularConflicts,
          ayudanteConflicts,
        });
      }
    });

    return items;
  }, [programa, publishers, weeks, outgoingSpeakers]);

  const strictCount = useMemo(() => {
    return conflictItems.reduce((acc, item) => {
      const strictTit = item.titularConflicts.filter((c) => c.severity === 'STRICT_CONFLICT').length;
      const strictAux = item.ayudanteConflicts.filter((c) => c.severity === 'STRICT_CONFLICT').length;
      return acc + strictTit + strictAux;
    }, 0);
  }, [conflictItems]);

  const warningCount = useMemo(() => {
    return conflictItems.reduce((acc, item) => {
      const warnTit = item.titularConflicts.filter((c) => c.severity === 'WARNING_SATURATION').length;
      const warnAux = item.ayudanteConflicts.filter((c) => c.severity === 'WARNING_SATURATION').length;
      return acc + warnTit + warnAux;
    }, 0);
  }, [conflictItems]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panel de conflictos de asignaciones de la semana"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white dark:bg-[#121216] rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#18181F]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]">
              {strictCount > 0 ? (
                <AlertOctagon size={20} className="text-rose-500" />
              ) : warningCount > 0 ? (
                <AlertTriangle size={20} className="text-amber-500" />
              ) : (
                <ShieldCheck size={20} className="text-indigo-500" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA]">
                Semana: {programa.rango_semana || programa.semana_fecha}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mt-0.5">
                Panel de Conflictos de la Semana
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de conflictos de la semana"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumen de contadores */}
        <div className="grid grid-cols-2 gap-3 p-4 sm:px-6 bg-zinc-100/60 dark:bg-[#18181F]/40 border-b border-zinc-200 dark:border-white/[0.06]">
          <div className="p-3 rounded-2xl bg-white dark:bg-[#18181F] border border-zinc-200/80 dark:border-white/5 shadow-2xs">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              Cruces Críticos
            </span>
            <div className="text-lg font-bold text-zinc-900 dark:text-[#F4F4F5] mt-1 font-mono tabular-nums">
              {strictCount}
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Choque con deberes, doble asignación o ausencias
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-[#18181F] border border-zinc-200/80 dark:border-white/5 shadow-2xs">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              Saturación Semanal
            </span>
            <div className="text-lg font-bold text-zinc-900 dark:text-[#F4F4F5] mt-1 font-mono tabular-nums">
              {warningCount}
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Intervención en VMC y Fin de Semana u orador saliente
            </p>
          </div>
        </div>

        {/* Lista de conflictos */}
        <div className="flex-1 overflow-y-auto p-4 sm:px-6 space-y-3">
          {conflictItems.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 dark:text-[#71717A]">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                ¡Reunión 100% libre de cruces!
              </h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Todos los hermanos asignados para esta semana están disponibles, sin ausencias ni
                incompatibilidades entre VMC, Fin de Semana o deberes.
              </p>
            </div>
          ) : (
            conflictItems.map(({ part, titularConflicts, ayudanteConflicts }) => (
              <div
                key={part.id}
                className="p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-[#18181F]/40 hover:border-zinc-300 dark:hover:border-white/20 transition-all space-y-3"
              >
                {/* Cabecera de la parte */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {part.seccion.replace('_', ' ')} •{' '}
                      {part.es_clase_auxiliar ? 'Sala Auxiliar' : 'Sala Principal'}
                    </span>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                      {part.titulo} {part.duracion_min ? `(${part.duracion_min} min)` : ''}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenReplacementForPart(part);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-zinc-800 dark:text-[#F4F4F5] text-xs font-semibold transition-all shadow-2xs cursor-pointer shrink-0"
                    title="Buscar un sustituto para esta asignación"
                  >
                    <ArrowRightLeft size={13} className="text-zinc-400 dark:text-[#71717A]" />
                    <span>Buscar Sustituto</span>
                  </button>
                </div>

                {/* Conflictos de Titular */}
                {titularConflicts.map((c, i) => (
                  <div
                    key={`tit-${i}`}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] text-xs flex items-start gap-2.5 shadow-2xs"
                  >
                    {c.severity === 'STRICT_CONFLICT' ? (
                      <AlertOctagon size={15} className="text-rose-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-[#F4F4F5]">
                        Titular ({part.asignado_nombre}): {c.assignmentTitle}
                      </p>
                      <p className="text-[11px] mt-0.5 text-zinc-500 dark:text-[#A1A1AA]">{c.details}</p>
                    </div>
                  </div>
                ))}

                {/* Conflictos de Ayudante */}
                {ayudanteConflicts.map((c, i) => (
                  <div
                    key={`aux-${i}`}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] text-xs flex items-start gap-2.5 shadow-2xs"
                  >
                    {c.severity === 'STRICT_CONFLICT' ? (
                      <AlertOctagon size={15} className="text-rose-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-[#F4F4F5]">
                        Ayudante ({part.asignado_auxiliar_nombre}): {c.assignmentTitle}
                      </p>
                      <p className="text-[11px] mt-0.5 text-zinc-500 dark:text-[#A1A1AA]">{c.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#18181F]/80 flex items-center justify-between text-xs text-zinc-500">
          <span>Se actualiza automáticamente al cambiar asignaciones.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
