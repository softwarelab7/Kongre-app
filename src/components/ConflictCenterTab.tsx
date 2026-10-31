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
      {/* Barra de Acciones y Filtros del Centro de Conflictos (Unified Container) */}
      <div className="bg-white dark:bg-[#121216] p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex items-center justify-center text-zinc-600 dark:text-[#A1A1AA] shrink-0">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-[#F4F4F5]">
                  Auditoría de Cruces y Conflictos
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] border border-zinc-200 dark:border-[#27272A]">
                  En tiempo real
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] hidden sm:block">
                Supervisión integral de asignaciones duplicadas, ausencias y descansos
              </p>
            </div>
          </div>

          {/* Counters: Clean neutral pills with subtle indicator dots */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="text-[11px] font-medium text-zinc-500 dark:text-[#A1A1AA]">Cruces Críticos:</span>
              <span className="text-xs font-bold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">{criticalErrors.length}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="text-[11px] font-medium text-zinc-500 dark:text-[#A1A1AA]">Advertencias:</span>
              <span className="text-xs font-bold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">{warnings.length}</span>
            </div>
          </div>
        </div>

        {/* Filter and search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-zinc-100 dark:border-[#27272A]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#71717A]" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por hermano o descripción..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] font-semibold">Severidad:</span>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value as any)}
              className="text-xs py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-700 dark:text-[#F4F4F5] font-semibold cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5]">Todos ({allWeeksConflicts.length})</option>
              <option value="error" className="bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5]">Solo Cruces Críticos ({criticalErrors.length})</option>
              <option value="warning" className="bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5]">Solo Advertencias ({warnings.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredConflicts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#121216] rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800 dark:text-[#F4F4F5]">
              ¡Cero Cruces y Cero Conflictos!
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-md mx-auto">
              Todas las asignaciones registradas para todas las semanas respetan las ausencias, roles habilitados y no generan sobrecarga.
            </p>
          </div>
        ) : (
          filteredConflicts.map(item => {
            const isError = item.severity === 'error';
            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]">
                    {isError ? <AlertOctagon className="w-4.5 h-4.5 text-rose-500" /> : <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-[#F4F4F5]">
                        {item.publisherName}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#D4D4D8]">
                        <span className={`w-1.5 h-1.5 rounded-full ${isError ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        {isError ? 'Cruce Crítico' : 'Advertencia'}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-[#71717A] flex items-center gap-1 font-mono tabular-nums">
                        <Calendar className="w-3.5 h-3.5" />
                        Semana del {item.weekStartDate}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-[#A1A1AA] leading-relaxed">
                      {item.description}
                    </p>

                    {item.assignmentTitles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.assignmentTitles.map((t, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-100 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] text-zinc-700 dark:text-[#D4D4D8] font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-[#27272A]">
                  <button
                    type="button"
                    onClick={() => onNavigateToWeek(item.weekId)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-800 dark:text-[#F4F4F5] text-xs font-semibold border border-zinc-200 dark:border-[#27272A] transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <span>Ver Semana</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 dark:text-[#71717A]" />
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
