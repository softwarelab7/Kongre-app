// src/components/AssignmentSelectorModal.tsx
import React, { useState, useMemo } from 'react';
import { Publisher, WeekSchedule, Gender } from '../types';
import { useCongregation } from '../context/CongregationContext';
import { getEligibleCandidates } from '../utils/autoAssigner';
import { OFFICIAL_STUDENT_LESSONS } from '../utils/theocraticData';
import {
  X,
  Search,
  Sparkles,
  AlertTriangle,
  UserCheck,
  Check,
  Clock,
  BookOpen,
  Award,
  UserMinus,
} from 'lucide-react';

interface AssignmentSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  roleKey: string;
  targetGender?: Gender | 'any';
  meetingDate: string;
  meetingType: 'midweek' | 'weekend';
  currentAssignedId?: string;
  onSelectPublisher: (publisherId: string, suggestedLessonNumber?: number) => void;
  onClearAssignment: () => void;
}

export const AssignmentSelectorModal: React.FC<AssignmentSelectorModalProps> = ({
  isOpen,
  onClose,
  title,
  roleKey,
  targetGender = 'any',
  meetingDate,
  meetingType,
  currentAssignedId,
  onSelectPublisher,
  onClearAssignment,
}) => {
  const { publishers, weeks, currentWeek } = useCongregation();
  const [searchTerm, setSearchTerm] = useState('');

  const isStudentRole =
    roleKey === 'vym_tesoros_lectura' ||
    roleKey === 'vym_maestros_titular' ||
    roleKey.startsWith('vym_maestros');

  // Collect publisher IDs already assigned in this meeting to identify intra-meeting conflicts
  const currentAssignedInMeeting = useMemo(() => {
    const set = new Set<string>();
    if (!currentWeek) return set;

    if (meetingType === 'midweek') {
      if (currentWeek.midweek.presidentId) set.add(currentWeek.midweek.presidentId);
      if (currentWeek.midweek.initialPrayerId) set.add(currentWeek.midweek.initialPrayerId);
      if (currentWeek.midweek.finalPrayerId) set.add(currentWeek.midweek.finalPrayerId);
      if (currentWeek.midweek.tesoros.discurso.publisherId) set.add(currentWeek.midweek.tesoros.discurso.publisherId);
      if (currentWeek.midweek.tesoros.perlas.publisherId) set.add(currentWeek.midweek.tesoros.perlas.publisherId);
      if (currentWeek.midweek.tesoros.lecturaBiblia.publisherId) set.add(currentWeek.midweek.tesoros.lecturaBiblia.publisherId);
      currentWeek.midweek.maestros.items.forEach(m => {
        if (m.publisherId) set.add(m.publisherId);
        if (m.assistantId) set.add(m.assistantId);
      });
      currentWeek.midweek.vidaCristiana.items.forEach(v => {
        if (v.publisherId) set.add(v.publisherId);
      });
      if (currentWeek.midweek.vidaCristiana.estudioBiblico.conductorId) {
        set.add(currentWeek.midweek.vidaCristiana.estudioBiblico.conductorId);
      }
      if (currentWeek.midweek.vidaCristiana.estudioBiblico.lectorId) {
        set.add(currentWeek.midweek.vidaCristiana.estudioBiblico.lectorId);
      }
      Object.values(currentWeek.midweek.duties).forEach(ids => {
        ids.forEach(id => set.add(id));
      });
    } else {
      if (currentWeek.weekend.presidentId) set.add(currentWeek.weekend.presidentId);
      if (currentWeek.weekend.atalayaConductorId) set.add(currentWeek.weekend.atalayaConductorId);
      if (currentWeek.weekend.atalayaLectorId) set.add(currentWeek.weekend.atalayaLectorId);
      if (currentWeek.weekend.initialPrayerId) set.add(currentWeek.weekend.initialPrayerId);
      if (currentWeek.weekend.finalPrayerId) set.add(currentWeek.weekend.finalPrayerId);
      Object.values(currentWeek.weekend.duties).forEach(ids => {
        ids.forEach(id => set.add(id));
      });
    }

    // Exclude current selection so self-replacement doesn't flag itself
    if (currentAssignedId) {
      set.delete(currentAssignedId);
    }

    return set;
  }, [currentWeek, meetingType, currentAssignedId]);

  // Candidates sorted by recommendation (longest time without assignment)
  const candidateScores = useMemo(() => {
    return getEligibleCandidates(
      roleKey,
      meetingDate,
      targetGender,
      currentAssignedInMeeting,
      publishers,
      weeks
    );
  }, [roleKey, meetingDate, targetGender, currentAssignedInMeeting, publishers, weeks]);

  const filteredCandidates = useMemo(() => {
    return candidateScores.filter(c =>
      c.publisher.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [candidateScores, searchTerm]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Asignar participante: ${title}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92dvh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] sm:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded-full">
              Asignar Participante
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1 truncate">{title}</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
              {isStudentRole
                ? 'Sugiere automáticamente la lección del folleto Maestros pendiente de trabajar.'
                : 'Solo se muestran personas activas, sin ausencias y con el rol habilitado.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector de participante"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar entre candidatos disponibles..."
              aria-label="Buscar entre candidatos disponibles"
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {onClearAssignment && (
            <button
              type="button"
              onClick={() => {
                onClearAssignment();
                onClose();
              }}
              aria-label="Quitar asignación actual y dejar vacante"
              className="px-3.5 py-2 text-xs font-bold rounded-xl text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs min-h-[40px]"
              title="Quitar asignación actual y dejar libre"
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>Quitar Asignado</span>
            </button>
          )}
        </div>

        {/* Candidates List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No hay publicadores disponibles que cumplan los requisitos para este rol en esta fecha.
            </div>
          ) : (
            filteredCandidates.map(c => {
              const isSelected = c.publisher.id === currentAssignedId;
              const currentLessonNum = isStudentRole ? (c.publisher.currentLessonNumber || 1) : undefined;
              const lessonObj = currentLessonNum
                ? OFFICIAL_STUDENT_LESSONS.find(l => l.number === currentLessonNum)
                : undefined;

              return (
                <button
                  key={c.publisher.id}
                  onClick={() => {
                    onSelectPublisher(c.publisher.id, currentLessonNum);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 min-h-[48px] ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 shadow-xs ring-1 ring-indigo-500'
                      : c.hasConflictWarning
                      ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        c.publisher.gender === 'hermana'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      }`}
                    >
                      {c.publisher.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                          {c.publisher.name}
                        </span>

                        {c.isRecommended && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            Recomendado
                          </span>
                        )}

                        {c.familyMembersInMeeting && c.familyMembersInMeeting.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300">
                            Familiar hoy: {c.familyMembersInMeeting[0]}
                          </span>
                        )}

                        {c.hasConflictWarning && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {c.hasConflictWarning}
                          </span>
                        )}
                      </div>

                      {/* Smart Student Lesson Suggestion Badge */}
                      {isStudentRole && currentLessonNum && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <BookOpen className="w-3 h-3 text-indigo-600" />
                            Lección #{currentLessonNum}: {lessonObj?.title || ''}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                        <span>Grupo {c.publisher.groupNumber || 1}</span>
                        <span>•</span>
                        <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                          Carga Ponderada: {c.weightedPoints ?? 0} pts ({c.totalHistoricalAssignments} asig.)
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {c.lastAssignedDate
                            ? `Última: ${c.lastAssignedDate} (${c.daysSinceLastAssignment}d)`
                            : 'Sin participaciones previas'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-indigo-600 hover:underline">
                        Asignar
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
