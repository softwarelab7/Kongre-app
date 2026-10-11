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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              Asignar Participante
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">{title}</h3>
            <p className="text-xs text-slate-500">
              {isStudentRole
                ? 'Sugiere automáticamente la lección del folleto Maestros pendiente de trabajar.'
                : 'Solo se muestran personas activas, sin ausencias y con el rol habilitado.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar entre candidatos disponibles..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {onClearAssignment && (
            <button
              type="button"
              onClick={() => {
                onClearAssignment();
                onClose();
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
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
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500'
                      : c.hasConflictWarning
                      ? 'border-amber-200 bg-amber-50/30 hover:bg-amber-50'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        c.publisher.gender === 'hermana'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {c.publisher.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {c.publisher.name}
                        </span>

                        {c.isRecommended && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            Recomendado
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

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 truncate">
                        <span>Grupo {c.publisher.groupNumber || 1}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {c.lastAssignedDate
                            ? `Última vez: ${c.lastAssignedDate} (${c.daysSinceLastAssignment} días)`
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
