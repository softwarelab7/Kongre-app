// src/components/BatchWhatsAppModal.tsx
import React, { useState, useMemo } from 'react';
import { WeekSchedule, Publisher } from '../types';
import { useCongregation } from '../context/CongregationContext';
import {
  extractWeekAssignments,
  createAssignmentWhatsAppMessage,
  openWhatsAppLink,
  WeeklyAssignmentEntry,
} from '../utils/whatsapp';
import { OFFICIAL_STUDENT_LESSONS } from '../utils/theocraticData';
import {
  X,
  MessageCircle,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  ExternalLink,
  Filter,
  Check,
  Phone,
  Calendar,
  Sparkles,
  Users,
} from 'lucide-react';

interface BatchWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  week: WeekSchedule;
}

export const BatchWhatsAppModal: React.FC<BatchWhatsAppModalProps> = ({
  isOpen,
  onClose,
  week,
}) => {
  const { publishers, settings } = useCongregation();

  const [meetingFilter, setMeetingFilter] = useState<'todas' | 'midweek' | 'weekend'>('todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendientes' | 'confirmadas' | 'rechazadas'>('todos');
  const [isReminderMode, setIsReminderMode] = useState(false);
  const [sentItemIds, setSentItemIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  // Map publishers
  const publishersMap = useMemo(() => {
    const map = new Map<string, Publisher>();
    publishers.forEach((p) => map.set(p.id, p));
    return map;
  }, [publishers]);

  // Extract all assignments for this week
  const allAssignments = useMemo(() => {
    return extractWeekAssignments(week, publishersMap);
  }, [week, publishersMap]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return allAssignments.filter((item) => {
      if (meetingFilter !== 'todas' && item.meetingType !== meetingFilter) return false;
      if (statusFilter === 'pendientes' && item.status !== 'pendiente') return false;
      if (statusFilter === 'confirmadas' && item.status !== 'confirmada') return false;
      if (statusFilter === 'rechazadas' && item.status !== 'rechazada') return false;
      return true;
    });
  }, [allAssignments, meetingFilter, statusFilter]);

  // Helper to get lesson title
  const getLessonTitle = (lessonNum?: number) => {
    if (!lessonNum) return undefined;
    const lesson = OFFICIAL_STUDENT_LESSONS.find((l) => l.number === lessonNum);
    return lesson?.title;
  };

  // Build message for an entry
  const getMessageForEntry = (entry: WeeklyAssignmentEntry) => {
    return createAssignmentWhatsAppMessage(
      entry.publisher,
      week,
      entry.roleTitle,
      entry.meetingType,
      entry.meetingDate,
      {
        isReminder: isReminderMode,
        assistantName: entry.assistant?.name,
        room: entry.room,
        timeMinutes: entry.timeMinutes,
        lessonNumber: entry.lessonNumber,
        lessonTitle: getLessonTitle(entry.lessonNumber),
        congregationName: settings.congregationName,
        assignmentPath: entry.assignmentPath,
      }
    );
  };

  const handleSendSingle = (entry: WeeklyAssignmentEntry) => {
    const message = getMessageForEntry(entry);
    openWhatsAppLink(entry.publisher.phone || '', message);
    setSentItemIds((prev) => new Set(prev).add(entry.id));
  };

  const handleCopySingle = (entry: WeeklyAssignmentEntry) => {
    const message = getMessageForEntry(entry);
    navigator.clipboard.writeText(message);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const combined = filteredAssignments
      .map((entry, idx) => {
        const msg = getMessageForEntry(entry);
        return `══════ Asignación ${idx + 1}: ${entry.publisher.name} (${entry.roleTitle}) ══════\n${msg}\n`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(combined);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2500);
  };

  if (!isOpen) return null;

  const totalCount = allAssignments.length;
  const sentCount = sentItemIds.size;
  const confirmedCount = allAssignments.filter((a) => a.status === 'confirmada').length;
  const pendingCount = allAssignments.filter((a) => a.status === 'pendiente').length;
  const rejectedCount = allAssignments.filter((a) => a.status === 'rechazada').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Recordatorios y Confirmaciones de Asignación por WhatsApp"
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-linear-to-r from-emerald-50 via-teal-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Automatización WhatsApp
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Semana {week.weekStartDate} al {week.weekEndDate}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Recordatorios y Confirmaciones de Asignación
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar recordatorios de WhatsApp"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Stats & Mode toggle */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 font-bold text-slate-800 shadow-2xs">
              {totalCount} partes totales
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
              {sentCount} enviados en sesión
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-800 font-bold">
              {confirmedCount} confirmadas
            </span>
            {rejectedCount > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-bold animate-pulse">
                {rejectedCount} reemplazo solicitado
              </span>
            )}
          </div>

          {/* Mode Switch: Invitación inicial vs Recordatorio cariñoso */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-semibold">Tipo de mensaje:</span>
            <div className="inline-flex p-0.5 bg-slate-200/80 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setIsReminderMode(false)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  !isReminderMode
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nueva Asignación
              </button>
              <button
                onClick={() => setIsReminderMode(true)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  isReminderMode
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Recordatorio
              </button>
            </div>
          </div>
        </div>

        {/* Filters & Actions row */}
        <div className="px-5 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {/* Meeting Filter */}
            <select
              value={meetingFilter}
              onChange={(e) => setMeetingFilter(e.target.value as any)}
              aria-label="Filtrar por tipo de reunión"
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="todas">Todas las reuniones</option>
              <option value="midweek">Entre semana (Vida y Min.)</option>
              <option value="weekend">Fin de semana (Pública / Atalaya)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filtrar por estado de confirmación"
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendientes">Pendientes ({pendingCount})</option>
              <option value="confirmadas">Confirmadas ({confirmedCount})</option>
              <option value="rechazadas">Reemplazo solicitado ({rejectedCount})</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
              title="Copiar todos los mensajes al portapapeles"
            >
              {allCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{allCopied ? '¡Todos Copiados!' : 'Copiar Todos'}</span>
            </button>
          </div>
        </div>

        {/* Assignments List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 bg-slate-50/50">
          {filteredAssignments.length > 0 ? (
            filteredAssignments.map((entry) => {
              const isSent = sentItemIds.has(entry.id);
              const isCopied = copiedId === entry.id;
              const hasPhone = Boolean(entry.publisher.phone);

              return (
                <div
                  key={entry.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isSent
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : entry.status === 'rechazada'
                      ? 'bg-rose-50/70 border-rose-200'
                      : entry.status === 'confirmada'
                      ? 'bg-white border-slate-200 shadow-2xs'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Publisher & Assignment Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {entry.section}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            entry.status === 'confirmada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : entry.status === 'rechazada'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {entry.status === 'confirmada'
                            ? 'Confirmada'
                            : entry.status === 'rechazada'
                            ? 'Reemplazo solicitado'
                            : 'Pendiente'}
                        </span>

                        {isSent && (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> Enviado
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {entry.publisher.name}
                        </h4>
                        <span className="text-xs text-slate-500 font-medium">
                          {hasPhone ? entry.publisher.phone : '⚠️ Sin número de teléfono'}
                        </span>
                      </div>

                      <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                        {entry.roleTitle}
                        {entry.room === 'auxiliar' && ' (Sala Auxiliar)'}
                        {entry.assistant && ` • Ayudante: ${entry.assistant.name}`}
                        {entry.lessonNumber && ` • Lección #${entry.lessonNumber}`}
                      </p>

                      <p className="text-[11px] text-slate-500 mt-0.5">
                        📅 {entry.meetingDate} • {entry.meetingType === 'midweek' ? 'Entre semana' : 'Fin de semana'}
                        {entry.timeMinutes ? ` • ${entry.timeMinutes} minutos` : ''}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleCopySingle(entry)}
                        className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                        title="Copiar texto del mensaje para pegar en WhatsApp"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        <span className="hidden sm:inline">{isCopied ? 'Copiado' : 'Copiar'}</span>
                      </button>

                      <button
                        onClick={() => handleSendSingle(entry)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                          isSent
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-emerald-700 hover:bg-emerald-800 text-white hover:shadow-md'
                        }`}
                        title="Abrir chat de WhatsApp con el mensaje precargado"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSent ? 'Reenviar' : 'Enviar WhatsApp'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 px-4">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No hay asignaciones para los filtros seleccionados</h4>
              <p className="text-xs text-slate-500 mt-1">
                Cambia el filtro de reunión o estado para ver a los hermanos participantes.
              </p>
            </div>
          )}
        </div>

        {/* Footer info notice */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Cada mensaje incluye un <strong>enlace directo de 1 clic</strong> para que el hermano confirme o pida reemplazo sin instalar nada.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors ml-auto"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
