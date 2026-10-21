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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
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
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Panel de Detección de Conflictos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitoreo continuo de cruces de horario, ausencias y sobrecarga.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope selector & stats bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewScope('current')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewScope === 'current'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semana Actual ({conflicts.length})
            </button>
            <button
              onClick={() => setViewScope('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewScope === 'all'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
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
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                ¡Excelente! No hay ningún conflicto detectado
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Todas las asignaciones respetan los roles habilitados, ausencias registradas y no presentan cruces de horario.
              </p>
            </div>
          ) : (
            currentList.map(item => {
              const isError = item.severity === 'error';
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isError
                      ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200'
                      : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isError
                            ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {isError ? (
                          <AlertOctagon className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {item.publisherName || 'Asignación'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isError
                                ? 'bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200'
                                : 'bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200'
                            }`}
                          >
                            {isError ? 'CRUCE CRÍTICO' : 'ADVERTENCIA'}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Semana del {item.weekStartDate}
                          </span>
                        </div>

                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">
                          {item.description}
                        </p>

                        {item.assignmentTitles && item.assignmentTitles.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.assignmentTitles.map((t, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
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
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                      <span>Ir a Resolver</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80 rounded-b-3xl">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Puedes ajustar qué reglas generan advertencias en la pestaña <strong>Ajustes</strong>.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
