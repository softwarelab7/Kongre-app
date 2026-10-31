// src/components/ConflictsModal.tsx
import React, { useState } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { ConflictAlert } from '../types';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  X,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface ConflictsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToWeek: (weekId: string) => void;
}

export const ConflictsModal: React.FC<ConflictsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToWeek,
}) => {
  const { conflicts, allWeeksConflicts, currentWeekId, weeks } = useCongregation();
  const [viewScope, setViewScope] = useState<'current' | 'all'>('current');

  if (!isOpen) return null;

  const currentList = viewScope === 'current' ? conflicts : allWeeksConflicts;
  const errorCount = currentList.filter(c => c.severity === 'error').length;
  const warningCount = currentList.filter(c => c.severity === 'warning').length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panel de Detección de Conflictos"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-900/60 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-[#121216] rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[90dvh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-zinc-100 dark:border-[#27272A] pb-[env(safe-area-inset-bottom,0px)] sm:pb-0 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              data-mobile-back-btn="true"
              onClick={onClose}
              aria-label="Volver"
              className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-zinc-800 dark:text-zinc-100 shrink-0 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>
            <div className={`hidden sm:flex w-10 h-10 rounded-xl items-center justify-center ${
              currentList.length > 0
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
            }`}>
              {currentList.length > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-zinc-900 dark:text-white">
                Panel de Detección de Conflictos
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Monitoreo continuo de cruces de horario, ausencias y sobrecarga.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de conflictos"
            className="hidden sm:flex p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#27272A] min-h-[44px] min-w-[44px] items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope selector & stats bar */}
        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-[#27272A] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-200/70 dark:bg-[#18181F] p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewScope('current')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewScope === 'current'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-zinc-600 dark:text-[#D4D4D8] hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Semana Actual ({conflicts.length})
            </button>
            <button
              onClick={() => setViewScope('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewScope === 'all'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-zinc-600 dark:text-[#D4D4D8] hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Todas las Semanas ({allWeeksConflicts.length})
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-bold">
              <AlertOctagon className="w-3.5 h-3.5" />
              {errorCount} {errorCount === 1 ? 'Error Crítico' : 'Errores Críticos'}
            </span>
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {warningCount} {warningCount === 1 ? 'Advertencia' : 'Advertencias'}
            </span>
          </div>
        </div>

        {/* Conflict list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {currentList.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-100">
                ¡Excelente! No hay ningún conflicto detectado
              </h4>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-sm mx-auto">
                Todas las asignaciones respetan los roles habilitados, ausencias registradas y no presentan cruces de horario.
              </p>
            </div>
          ) : (
            currentList.map(item => {
              const isError = item.severity === 'error';
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]">
                        {isError ? (
                          <AlertOctagon className="w-4 h-4 text-rose-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-zinc-900 dark:text-[#F4F4F5]">
                            {item.publisherName || 'Asignación'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#D4D4D8]">
                            <span className={`w-1.5 h-1.5 rounded-full ${isError ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            {isError ? 'Cruce Crítico' : 'Advertencia'}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] flex items-center gap-1 font-mono tabular-nums">
                            <Calendar className="w-3 h-3" />
                            Semana del {item.weekStartDate}
                          </span>
                        </div>

                        <p className="text-xs font-medium text-zinc-700 dark:text-[#E4E4E7] mt-1 leading-relaxed">
                          {item.description}
                        </p>

                        {item.assignmentTitles && item.assignmentTitles.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.assignmentTitles.map((t, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-100 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] text-zinc-700 dark:text-[#D4D4D8] font-medium"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onNavigateToWeek(item.weekId);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-xs font-semibold text-zinc-800 dark:text-[#F4F4F5] transition-all shadow-2xs shrink-0 cursor-pointer"
                    >
                      <span>Ir a Resolver</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 dark:text-[#71717A]" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/80 rounded-b-3xl">
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
            Puedes ajustar qué reglas generan advertencias en la pestaña <strong>Ajustes</strong>.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-indigo-600 dark:hover:bg-zinc-100 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
