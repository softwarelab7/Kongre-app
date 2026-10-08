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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                strictCount > 0
                  ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                  : warningCount > 0
                  ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
              }`}
            >
              {strictCount > 0 ? (
                <AlertOctagon size={20} />
              ) : warningCount > 0 ? (
                <AlertTriangle size={20} />
              ) : (
                <ShieldCheck size={20} />
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Semana: {programa.rango_semana || programa.semana_fecha}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Panel de Conflictos de la Semana
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumen de contadores */}
        <div className="grid grid-cols-2 gap-3 p-4 sm:px-6 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <AlertOctagon size={13} className="text-rose-500" />
              Cruces Críticos
            </span>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
              {strictCount}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Choque con deberes, doble asignación o ausencias
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock size={13} className="text-amber-500" />
              Saturación Semanal
            </span>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
              {warningCount}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Intervención en VMC y Fin de Semana u orador saliente
            </p>
          </div>
        </div>

        {/* Lista de conflictos */}
        <div className="flex-1 overflow-y-auto p-4 sm:px-6 space-y-3">
          {conflictItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                ¡Reunión 100% libre de cruces!
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Todos los hermanos asignados para esta semana están disponibles, sin ausencias ni
                incompatibilidades entre VMC, Fin de Semana o deberes.
              </p>
            </div>
          ) : (
            conflictItems.map(({ part, titularConflicts, ayudanteConflicts }) => (
              <div
                key={part.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3"
              >
                {/* Cabecera de la parte */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {part.seccion.replace('_', ' ')} •{' '}
                      {part.es_clase_auxiliar ? 'Sala Auxiliar' : 'Sala Principal'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {part.titulo} {part.duracion_min ? `(${part.duracion_min} min)` : ''}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenReplacementForPart(part);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                    title="Buscar un sustituto para esta asignación"
                  >
                    <ArrowRightLeft size={13} />
                    <span>Buscar Sustituto</span>
                  </button>
                </div>

                {/* Conflictos de Titular */}
                {titularConflicts.map((c, i) => (
                  <div
                    key={`tit-${i}`}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      c.severity === 'STRICT_CONFLICT'
                        ? 'bg-rose-50/80 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200'
                        : 'bg-amber-50/80 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200'
                    }`}
                  >
                    {c.severity === 'STRICT_CONFLICT' ? (
                      <AlertOctagon size={15} className="text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">
                        Titular ({part.asignado_nombre}): {c.assignmentTitle}
                      </p>
                      <p className="text-[11px] mt-0.5 opacity-90">{c.details}</p>
                    </div>
                  </div>
                ))}

                {/* Conflictos de Ayudante */}
                {ayudanteConflicts.map((c, i) => (
                  <div
                    key={`aux-${i}`}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      c.severity === 'STRICT_CONFLICT'
                        ? 'bg-rose-50/80 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200'
                        : 'bg-amber-50/80 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200'
                    }`}
                  >
                    {c.severity === 'STRICT_CONFLICT' ? (
                      <AlertOctagon size={15} className="text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">
                        Ayudante ({part.asignado_auxiliar_nombre}): {c.assignmentTitle}
                      </p>
                      <p className="text-[11px] mt-0.5 opacity-90">{c.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>Se actualiza automáticamente al cambiar asignaciones.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
