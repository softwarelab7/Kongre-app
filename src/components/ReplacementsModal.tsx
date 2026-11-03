// src/components/ReplacementsModal.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { Publisher, AssignmentStatus, Gender } from '../types';
import { getEligibleCandidates } from '../utils/autoAssigner';
import {
  X,
  Search,
  Sparkles,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  Calendar,
} from 'lucide-react';

interface ReplacementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekId: string;
  meetingType: 'midweek' | 'weekend';
  meetingDate: string;
  assignmentTitle: string;
  assignmentPath: string;
  currentPublisherId?: string;
  currentStatus?: AssignmentStatus;
  roleKey: string;
  targetGender?: Gender | 'any';
}

export const ReplacementsModal: React.FC<ReplacementsModalProps> = ({
  isOpen,
  onClose,
  weekId,
  meetingType,
  meetingDate,
  assignmentTitle,
  assignmentPath,
  currentPublisherId,
  currentStatus = 'pendiente',
  roleKey,
  targetGender = 'any',
}) => {
  const {
    publishers,
    weeks,
    currentWeek,
    replaceAssignment,
    publishersMap,
  } = useCongregation();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AssignmentStatus>(currentStatus);

  const currentPub = currentPublisherId ? publishersMap.get(currentPublisherId) : null;

  // Build current assigned in meeting set
  const currentAssignedInMeeting = useMemo(() => {
    const set = new Set<string>();
    const targetWeek = weeks.find(w => w.id === weekId) || currentWeek;
    if (!targetWeek) return set;

    if (meetingType === 'midweek') {
      if (targetWeek.midweek.presidentId) set.add(targetWeek.midweek.presidentId);
      if (targetWeek.midweek.initialPrayerId) set.add(targetWeek.midweek.initialPrayerId);
      if (targetWeek.midweek.finalPrayerId) set.add(targetWeek.midweek.finalPrayerId);
      if (targetWeek.midweek.tesoros.discurso.publisherId) set.add(targetWeek.midweek.tesoros.discurso.publisherId);
      if (targetWeek.midweek.tesoros.perlas.publisherId) set.add(targetWeek.midweek.tesoros.perlas.publisherId);
      if (targetWeek.midweek.tesoros.lecturaBiblia.publisherId) set.add(targetWeek.midweek.tesoros.lecturaBiblia.publisherId);
      targetWeek.midweek.maestros.items.forEach(m => {
        if (m.publisherId) set.add(m.publisherId);
        if (m.assistantId) set.add(m.assistantId);
      });
      targetWeek.midweek.vidaCristiana.items.forEach(v => {
        if (v.publisherId) set.add(v.publisherId);
      });
      if (targetWeek.midweek.vidaCristiana.estudioBiblico.conductorId) set.add(targetWeek.midweek.vidaCristiana.estudioBiblico.conductorId);
      if (targetWeek.midweek.vidaCristiana.estudioBiblico.lectorId) set.add(targetWeek.midweek.vidaCristiana.estudioBiblico.lectorId);
      Object.values(targetWeek.midweek.duties).forEach(ids => ids.forEach(id => set.add(id)));
    } else {
      if (targetWeek.weekend.presidentId) set.add(targetWeek.weekend.presidentId);
      if (targetWeek.weekend.atalayaConductorId) set.add(targetWeek.weekend.atalayaConductorId);
      if (targetWeek.weekend.atalayaLectorId) set.add(targetWeek.weekend.atalayaLectorId);
      if (targetWeek.weekend.initialPrayerId) set.add(targetWeek.weekend.initialPrayerId);
      if (targetWeek.weekend.finalPrayerId) set.add(targetWeek.weekend.finalPrayerId);
      Object.values(targetWeek.weekend.duties).forEach(ids => ids.forEach(id => set.add(id)));
    }

    if (currentPublisherId) {
      set.delete(currentPublisherId);
    }
    return set;
  }, [weeks, currentWeek, weekId, meetingType, currentPublisherId]);

  const candidates = useMemo(() => {
    return getEligibleCandidates(
      roleKey,
      meetingDate,
      targetGender,
      currentAssignedInMeeting,
      publishers,
      weeks
    ).filter(c => c.publisher.id !== currentPublisherId);
  }, [roleKey, meetingDate, targetGender, currentAssignedInMeeting, publishers, weeks, currentPublisherId]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c =>
      c.publisher.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [candidates, searchTerm]);

  if (!isOpen) return null;

  const handleApplyReplacement = (newPubId: string) => {
    replaceAssignment(weekId, meetingType, assignmentPath, newPubId, selectedStatus);
    onClose();
  };

  const handleStatusChange = (status: AssignmentStatus) => {
    setSelectedStatus(status);
    if (currentPublisherId) {
      replaceAssignment(weekId, meetingType, assignmentPath, currentPublisherId, status);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Gestión de reemplazo: ${assignmentTitle}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="kg-card-bento kg-glass-surface kg-sheen-top rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[90dvh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-zinc-200/80 dark:border-white/10 pb-[env(safe-area-inset-bottom,0px)] sm:pb-0 overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* Mobile Bottom Sheet Handle */}
        <div onClick={onClose} className="sm:hidden w-full pt-3 pb-1 flex justify-center items-center cursor-pointer shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-white/20" />
        </div>

        {/* Header Bento */}
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/70 dark:bg-[#18181F]/60 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 dark:border-indigo-500/30 shadow-xs">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 dark:bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                Gestión de Reemplazo
              </span>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">{assignmentTitle}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-mono tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" /> {meetingDate}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar gestión de reemplazo"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status and assigned person card */}
        <div className="p-4 bg-zinc-100/50 dark:bg-[#141418] border-b border-zinc-200/60 dark:border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Asignado actualmente:</span>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">
                {currentPub ? currentPub.name : 'Nadie asignado'}
              </p>
            </div>

            {/* Status tactile pills */}
            <div className="bg-zinc-200/60 dark:bg-white/[0.06] p-1 rounded-2xl border border-zinc-300/40 dark:border-white/[0.08] inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStatusChange('confirmada')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedStatus === 'confirmada'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirmada</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('pendiente')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedStatus === 'pendiente'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pendiente</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('rechazada')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedStatus === 'rechazada'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rechazada</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Candidates Bento */}
        <div className="p-3.5 sm:px-6 border-b border-zinc-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-[#121216]/40">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar entre sustitutos disponibles y habilitados..."
              aria-label="Buscar entre sustitutos disponibles y habilitados"
              className="w-full pl-9 pr-4 py-2 text-xs rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Available candidates list */}
        <div className="flex-1 overflow-y-auto p-4 sm:px-6 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Candidatos sugeridos ({filteredCandidates.length})
            </p>
            <span className="text-[10px] text-zinc-400">Ordenados por rotación</span>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-xs">
              No hay otros candidatos disponibles sin ausencias para esta reunión.
            </div>
          ) : (
            filteredCandidates.map(c => (
              <div
                key={c.publisher.id}
                className={`kg-card-bento p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-2xs ${
                  c.hasConflictWarning
                    ? 'border-amber-500/30 bg-amber-500/[0.06] dark:bg-amber-500/10'
                    : 'border-zinc-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#18181F]/70 hover:border-indigo-400 dark:hover:border-indigo-600'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                      c.publisher.gender === 'hermana'
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20'
                        : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/20'
                    }`}
                  >
                    {c.publisher.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm truncate">
                        {c.publisher.name}
                      </span>
                      {c.isRecommended && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                          <Sparkles className="w-3 h-3 text-emerald-500" />
                          Recomendado
                        </span>
                      )}
                      {c.hasConflictWarning && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          {c.hasConflictWarning}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 flex-wrap font-mono tabular-nums">
                      <span>Grupo {c.publisher.groupNumber || 1}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        {c.lastAssignedDate
                          ? `Última vez: ${c.lastAssignedDate} (${c.daysSinceLastAssignment} días)`
                          : 'Sin participaciones'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyReplacement(c.publisher.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  Asignar Reemplazo
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
