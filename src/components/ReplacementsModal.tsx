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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Gestión de Reemplazo
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{assignmentTitle}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {meetingDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status and assigned person card */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-500">Asignado actualmente:</span>
              <p className="text-sm font-bold text-slate-800">
                {currentPub ? currentPub.name : 'Nadie asignado'}
              </p>
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStatusChange('confirmada')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedStatus === 'confirmada'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirmada</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('pendiente')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedStatus === 'pendiente'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pendiente</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('rechazada')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedStatus === 'rechazada'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rechazada</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Candidates */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar entre sustitutos disponibles y habilitados..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Available candidates list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Candidatos sugeridos (Ordenados por tiempo sin participar)
          </p>

          {filteredCandidates.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No hay otros candidatos disponibles sin ausencias para esta reunión.
            </div>
          ) : (
            filteredCandidates.map(c => (
              <div
                key={c.publisher.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  c.hasConflictWarning
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      c.publisher.gender === 'hermana'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {c.publisher.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
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
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span>Grupo {c.publisher.groupNumber || 1}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {c.lastAssignedDate
                          ? `Última vez: ${c.lastAssignedDate} (${c.daysSinceLastAssignment} días)`
                          : 'Sin participaciones'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleApplyReplacement(c.publisher.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all shrink-0"
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
