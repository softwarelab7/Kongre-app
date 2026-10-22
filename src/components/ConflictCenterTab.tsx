// src/components/ConflictCenterTab.tsx
import React, { useState } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { ConflictAlert, AssignmentStatus } from '../types';
import { ReplacementsModal } from './ReplacementsModal';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react';

interface ConflictCenterTabProps {
  onNavigateToWeek: (weekId: string) => void;
}

export const ConflictCenterTab: React.FC<ConflictCenterTabProps> = ({ onNavigateToWeek }) => {
  const { allWeeksConflicts, weeks, publishersMap } = useCongregation();
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Replacements modal
  const [replacementModal, setReplacementModal] = useState<{
    isOpen: boolean;
    weekId: string;
    meetingType: 'midweek' | 'weekend';
    meetingDate: string;
    assignmentTitle: string;
    assignmentPath: string;
    currentPublisherId?: string;
    roleKey: string;
  }>({
    isOpen: false,
    weekId: '',
    meetingType: 'midweek',
    meetingDate: '',
    assignmentTitle: '',
    assignmentPath: '',
    roleKey: '',
  });

  const filteredConflicts = allWeeksConflicts.filter(c => {
    const matchesSeverity = filterSeverity === 'all' || c.severity === filterSeverity;
    const matchesSearch =
      c.publisherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const criticalErrors = allWeeksConflicts.filter(c => c.severity === 'error');
  const warnings = allWeeksConflicts.filter(c => c.severity === 'warning');

  return (
    <div className="space-y-6">
      {/* Barra de Acciones del Centro de Conflictos (Opción 1: arranque directo sin banner redundante) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            Detección en Tiempo Real
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
            Supervisión integral de asignaciones duplicadas, ausencias y descansos
          </span>
        </div>

        {/* Counters */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 flex items-center gap-2 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Cruces Críticos:</span>
            <span className="text-sm font-black">{criticalErrors.length}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center gap-2 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Advertencias:</span>
            <span className="text-sm font-black">{warnings.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por hermano o descripción..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold">Severidad:</span>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value as any)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="all">Todos ({allWeeksConflicts.length})</option>
            <option value="error">Solo Cruces Críticos ({criticalErrors.length})</option>
            <option value="warning">Solo Advertencias ({warnings.length})</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredConflicts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              ¡Cero Cruces y Cero Conflictos!
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Todas las asignaciones registradas para todas las semanas respetan las ausencias, roles habilitados y no generan sobrecarga.
            </p>
          </div>
        ) : (
          filteredConflicts.map(item => {
            const isError = item.severity === 'error';
            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isError
                    ? 'border-rose-200 bg-rose-50/40 text-rose-950'
                    : 'border-amber-200 bg-amber-50/40 text-amber-950'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isError ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isError ? <AlertOctagon className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-slate-900">
                        {item.publisherName}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isError ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {isError ? 'CRUCE CRÍTICO' : 'ADVERTENCIA'}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Semana del {item.weekStartDate}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-700 leading-relaxed">
                      {item.description}
                    </p>

                    {item.assignmentTitles.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.assignmentTitles.map((t, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px] bg-white border border-slate-200 text-slate-700 font-semibold"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                  <button
                    onClick={() => onNavigateToWeek(item.weekId)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 shadow-xs transition-all"
                  >
                    <span>Ver Semana</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Replacement modal if opened */}
      {replacementModal.isOpen && (
        <ReplacementsModal
          isOpen={replacementModal.isOpen}
          onClose={() => setReplacementModal(prev => ({ ...prev, isOpen: false }))}
          weekId={replacementModal.weekId}
          meetingType={replacementModal.meetingType}
          meetingDate={replacementModal.meetingDate}
          assignmentTitle={replacementModal.assignmentTitle}
          assignmentPath={replacementModal.assignmentPath}
          currentPublisherId={replacementModal.currentPublisherId}
          roleKey={replacementModal.roleKey}
        />
      )}
    </div>
  );
};
