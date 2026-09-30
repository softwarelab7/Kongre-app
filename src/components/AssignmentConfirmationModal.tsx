// src/components/AssignmentConfirmationModal.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { AssignmentStatus, Publisher, WeekSchedule } from '../types';
import { OFFICIAL_STUDENT_LESSONS } from '../utils/theocraticData';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  Clock,
  User,
  Users,
  BookOpen,
  Send,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface AssignmentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekId: string;
  meetingType: 'midweek' | 'weekend';
  assignmentPath: string;
  publisherId: string;
}

export const AssignmentConfirmationModal: React.FC<AssignmentConfirmationModalProps> = ({
  isOpen,
  onClose,
  weekId,
  meetingType,
  assignmentPath,
  publisherId,
}) => {
  const { weeks, publishers, settings, updateAssignmentStatus } = useCongregation();

  const [replacementReason, setReplacementReason] = useState('');
  const [showReplacementPrompt, setShowReplacementPrompt] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<AssignmentStatus | null>(null);

  const targetWeek = useMemo(() => {
    return weeks.find((w) => w.id === weekId);
  }, [weeks, weekId]);

  const targetPublisher = useMemo(() => {
    return publishers.find((p) => p.id === publisherId);
  }, [publishers, publisherId]);

  // Extract assignment details
  const assignmentDetails = useMemo(() => {
    if (!targetWeek || !targetPublisher) return null;

    let roleTitle = 'Asignación de Reunión';
    let room: 'principal' | 'auxiliar' | undefined = undefined;
    let assistant: Publisher | undefined = undefined;
    let timeMinutes: number | undefined = undefined;
    let lessonNumber: number | undefined = undefined;
    let currentStatus: AssignmentStatus = 'pendiente';

    if (meetingType === 'midweek') {
      if (assignmentPath === 'presidentId') {
        roleTitle = 'Presidente de la Reunión';
        currentStatus = 'confirmada';
      } else if (assignmentPath === 'initialPrayerId') {
        roleTitle = 'Oración Inicial';
        currentStatus = 'confirmada';
      } else if (assignmentPath === 'finalPrayerId') {
        roleTitle = 'Oración Final';
        currentStatus = 'confirmada';
      } else if (assignmentPath === 'tesoros.discurso') {
        const item = targetWeek.midweek.tesoros.discurso;
        roleTitle = item.title || 'Discurso de Tesoros (10 min)';
        timeMinutes = 10;
        currentStatus = item.status || 'pendiente';
      } else if (assignmentPath === 'tesoros.perlas') {
        const item = targetWeek.midweek.tesoros.perlas;
        roleTitle = item.title || 'Busquemos Perlas Escondidas (10 min)';
        timeMinutes = 10;
        currentStatus = item.status || 'pendiente';
      } else if (assignmentPath === 'tesoros.lecturaBiblia') {
        const item = targetWeek.midweek.tesoros.lecturaBiblia;
        roleTitle = item.title || 'Lectura de la Biblia';
        timeMinutes = 4;
        room = item.room;
        lessonNumber = item.lessonNumber;
        currentStatus = item.status || 'pendiente';
      } else if (assignmentPath.startsWith('maestros.')) {
        const idx = parseInt(assignmentPath.split('.')[1], 10);
        const item = targetWeek.midweek.maestros.items[idx];
        if (item) {
          roleTitle = item.title || `Seamos Mejores Maestros #${idx + 1}`;
          timeMinutes = item.timeMinutes || 4;
          room = item.room;
          lessonNumber = item.lessonNumber;
          if (item.assistantId) {
            assistant = publishers.find((p) => p.id === item.assistantId);
          }
          currentStatus = item.status || 'pendiente';
        }
      } else if (assignmentPath.startsWith('vida.')) {
        const idx = parseInt(assignmentPath.split('.')[1], 10);
        const item = targetWeek.midweek.vidaCristiana.items[idx];
        if (item) {
          roleTitle = item.title || `Nuestra Vida Cristiana #${idx + 1}`;
          timeMinutes = item.timeMinutes || 15;
          currentStatus = item.status || 'pendiente';
        }
      }
    } else {
      if (assignmentPath === 'presidentId') {
        roleTitle = 'Presidente del Fin de Semana';
        currentStatus = 'confirmada';
      } else if (assignmentPath === 'atalayaConductorId') {
        roleTitle = 'Conductor del Estudio de La Atalaya';
        timeMinutes = 60;
        currentStatus = 'confirmada';
      } else if (assignmentPath === 'atalayaLectorId') {
        roleTitle = 'Lector del Estudio de La Atalaya';
        timeMinutes = 60;
        currentStatus = 'confirmada';
      } else if (assignmentPath === 'initialPrayerId') {
        roleTitle = 'Oración de Inicio (Fin de Semana)';
        currentStatus = 'confirmada';
      } else if (assignmentPath === 'finalPrayerId') {
        roleTitle = 'Oración Final (Fin de Semana)';
        currentStatus = 'confirmada';
      }
    }

    const lessonObj = lessonNumber
      ? OFFICIAL_STUDENT_LESSONS.find((l) => l.number === lessonNumber)
      : undefined;

    const meetingDate =
      meetingType === 'midweek'
        ? targetWeek.midweek.date || targetWeek.weekStartDate
        : targetWeek.weekend.date || targetWeek.weekEndDate;

    return {
      roleTitle,
      room,
      assistant,
      timeMinutes,
      lessonNumber,
      lessonTitle: lessonObj?.title,
      meetingDate,
      currentStatus,
    };
  }, [targetWeek, targetPublisher, meetingType, assignmentPath, publishers]);

  if (!isOpen || !targetWeek || !targetPublisher || !assignmentDetails) return null;

  const handleConfirm = () => {
    updateAssignmentStatus(weekId, meetingType, assignmentPath, 'confirmada');
    setSubmittedStatus('confirmada');
  };

  const handleRequestReplacement = () => {
    updateAssignmentStatus(
      weekId,
      meetingType,
      assignmentPath,
      'rechazada',
      replacementReason.trim() || 'El hermano(a) solicitó reemplazo mediante enlace directo'
    );
    setSubmittedStatus('rechazada');
  };

  const effectiveStatus = submittedStatus || assignmentDetails.currentStatus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header Card */}
        <div className="px-6 py-5 bg-linear-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-200">
              {settings.congregationName || 'Gestor Teocrático'}
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white">
            Confirmación de Asignación
          </h2>
          <p className="text-xs text-indigo-200 mt-0.5">
            {meetingType === 'midweek'
              ? 'Reunión Vida y Ministerio Cristianos'
              : 'Reunión del Fin de Semana'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Greeting */}
          <div>
            <span className="text-xs text-slate-500 font-medium">Asignado a:</span>
            <h3 className="text-lg font-bold text-slate-900">
              {targetPublisher.gender === 'hermana' ? 'Hna.' : 'Hno.'} {targetPublisher.name}
            </h3>
          </div>

          {/* Details Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Parte asignada
                </span>
                <p className="text-sm font-bold text-slate-900 leading-snug">
                  {assignmentDetails.roleTitle}
                </p>
                {assignmentDetails.room && (
                  <p className="text-xs font-semibold text-indigo-700 mt-0.5">
                    🏛️ Sala: {assignmentDetails.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{assignmentDetails.meetingDate}</span>
              </div>
              {assignmentDetails.timeMinutes && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{assignmentDetails.timeMinutes} minutos</span>
                </div>
              )}
            </div>

            {assignmentDetails.assistant && (
              <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-700 font-medium">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Ayudante: <strong>{assignmentDetails.assistant.name}</strong></span>
              </div>
            )}

            {assignmentDetails.lessonNumber && (
              <div className="pt-2 border-t border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Punto de consejo:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  📖 Lección #{assignmentDetails.lessonNumber}: {assignmentDetails.lessonTitle || ''}
                </p>
              </div>
            )}
          </div>

          {/* Current Status Feedback */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <span className="font-semibold text-slate-600">Estado de tu respuesta:</span>
            <span
              className={`px-2.5 py-1 rounded-full font-bold ${
                effectiveStatus === 'confirmada'
                  ? 'bg-emerald-100 text-emerald-800'
                  : effectiveStatus === 'rechazada'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {effectiveStatus === 'confirmada'
                ? '✅ Confirmada'
                : effectiveStatus === 'rechazada'
                ? '⚠️ Reemplazo Solicitado'
                : 'Pendiente de Respuesta'}
            </span>
          </div>

          {/* Replacement input textarea if active */}
          {showReplacementPrompt && effectiveStatus !== 'rechazada' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-amber-900 block">
                Motivo del reemplazo (opcional):
              </label>
              <textarea
                value={replacementReason}
                onChange={(e) => setReplacementReason(e.target.value)}
                placeholder="Ej. Tengo viaje de trabajo, problema de salud..."
                className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                rows={2}
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowReplacementPrompt(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRequestReplacement}
                  className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
                >
                  Enviar Solicitud de Reemplazo
                </button>
              </div>
            </div>
          )}

          {/* Success messages */}
          {effectiveStatus === 'confirmada' && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-emerald-900">
                ¡Gracias por confirmar tu asignación!
              </p>
              <p className="text-xs text-emerald-700">
                El superintendente y el coordinador ya pueden ver tu confirmación en el programa.
              </p>
            </div>
          )}

          {effectiveStatus === 'rechazada' && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-1">
              <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
              <p className="text-sm font-bold text-rose-900">
                Se ha notificado que requieres un reemplazo
              </p>
              <p className="text-xs text-rose-700">
                El superintendente de la reunión asignará a un hermano sustituto a la brevedad.
              </p>
            </div>
          )}

          {/* Action buttons if not confirmed/rejected yet */}
          {effectiveStatus === 'pendiente' && !showReplacementPrompt && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleConfirm}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Aceptar Asignación</span>
              </button>

              <button
                onClick={() => setShowReplacementPrompt(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-700 font-bold text-sm transition-all active:scale-95"
              >
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Solicitar Reemplazo</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Kongre • Gestor Teocrático</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
