// src/components/shepherding/ShepherdingVisitModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Publisher, ShepherdingVisit, ShepherdingFocus } from '../../types';
import {
  SHEPHERDING_FOCUS_CONFIG,
  buildShepherdingFamilyInviteWhatsApp,
  buildShepherdingCompanionReminderWhatsApp,
} from '../../utils/shepherdingEngine';
import { openWhatsAppLink } from '../../utils/whatsapp';
import {
  X,
  Calendar,
  Clock,
  User,
  Users,
  HeartHandshake,
  BookOpen,
  MessageCircle,
  Save,
  Sparkles,
  AlertCircle,
  Send,
  MapPin,
  Phone,
} from 'lucide-react';

interface ShepherdingVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitToEdit?: ShepherdingVisit | null;
  initialPublisherId?: string;
  publishers: Publisher[];
  elders: Publisher[];
  onSave: (visitData: Omit<ShepherdingVisit, 'id' | 'createdAt'>, visitId?: string) => void;
}

export const ShepherdingVisitModal: React.FC<ShepherdingVisitModalProps> = ({
  isOpen,
  onClose,
  visitToEdit,
  initialPublisherId,
  publishers,
  elders,
  onSave,
}) => {
  const [publisherId, setPublisherId] = useState('');
  const [elder1Id, setElder1Id] = useState('');
  const [elder2Id, setElder2Id] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('18:30');
  const [focus, setFocus] = useState<ShepherdingFocus>('general');
  const [scripturesOrPoints, setScripturesOrPoints] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (visitToEdit) {
      setPublisherId(visitToEdit.publisherId);
      setElder1Id(visitToEdit.elder1Id);
      setElder2Id(visitToEdit.elder2Id || '');
      setScheduledDate(visitToEdit.scheduledDate);
      setScheduledTime(visitToEdit.scheduledTime || '18:30');
      setFocus(visitToEdit.focus);
      setScripturesOrPoints(visitToEdit.scripturesOrPoints || '');
      setNotes(visitToEdit.notes || '');
    } else {
      const defaultElder = elders[0]?.id || '';
      const companionElder = elders[1]?.id || '';
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const tomorrowIso = tomorrow.toISOString().slice(0, 10);

      setPublisherId(initialPublisherId || publishers[0]?.id || '');
      setElder1Id(defaultElder);
      setElder2Id(companionElder);
      setScheduledDate(tomorrowIso);
      setScheduledTime('18:30');
      setFocus('general');
      setScripturesOrPoints(SHEPHERDING_FOCUS_CONFIG.general.suggestedScriptures.join(', '));
      setNotes('');
    }
    setFormError(null);
  }, [isOpen, visitToEdit, initialPublisherId, publishers, elders]);

  const selectedPublisher = useMemo(
    () => publishers.find((p) => p.id === publisherId),
    [publishers, publisherId]
  );
  const selectedElder1 = useMemo(() => elders.find((e) => e.id === elder1Id), [elders, elder1Id]);
  const selectedElder2 = useMemo(() => elders.find((e) => e.id === elder2Id), [elders, elder2Id]);

  if (!isOpen) return null;

  const handleFocusChange = (newFocus: ShepherdingFocus) => {
    setFocus(newFocus);
    const suggested = SHEPHERDING_FOCUS_CONFIG[newFocus]?.suggestedScriptures.join(', ') || '';
    if (!scripturesOrPoints || scripturesOrPoints.trim() === '') {
      setScripturesOrPoints(suggested);
    }
  };

  const handleAppendScripture = (scrip: string) => {
    if (!scripturesOrPoints.includes(scrip)) {
      setScripturesOrPoints((prev) => (prev ? `${prev}, ${scrip}` : scrip));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publisherId) {
      setFormError('Por favor selecciona un publicador o familia.');
      return;
    }
    if (!elder1Id) {
      setFormError('Por favor selecciona al menos un anciano titular.');
      return;
    }
    if (!scheduledDate) {
      setFormError('Por favor especifica la fecha programada.');
      return;
    }

    const payload: Omit<ShepherdingVisit, 'id' | 'createdAt'> = {
      publisherId,
      publisherName: selectedPublisher?.name || 'Publicador',
      groupNumber: selectedPublisher?.groupNumber,
      scheduledDate,
      scheduledTime: scheduledTime || undefined,
      elder1Id,
      elder1Name: selectedElder1?.name || 'Anciano',
      elder2Id: elder2Id || undefined,
      elder2Name: selectedElder2?.name || undefined,
      status: visitToEdit?.status || 'programada',
      focus,
      scripturesOrPoints: scripturesOrPoints.trim() || undefined,
      notes: notes.trim() || undefined,
      completedDate: visitToEdit?.completedDate,
    };

    onSave(payload, visitToEdit?.id);
    onClose();
  };

  const handleSendFamilyWhatsApp = () => {
    if (!selectedPublisher) return;
    const msg = buildShepherdingFamilyInviteWhatsApp({
      publisherName: selectedPublisher.name,
      date: scheduledDate,
      time: scheduledTime,
      elder1Name: selectedElder1?.name || 'Anciano',
      elder2Name: selectedElder2?.name,
      focus,
      scriptures: scripturesOrPoints,
    });
    openWhatsAppLink(selectedPublisher.phone || '', msg);
  };

  const handleSendCompanionWhatsApp = () => {
    if (!selectedElder2) return;
    const msg = buildShepherdingCompanionReminderWhatsApp({
      companionName: selectedElder2.name,
      publisherName: selectedPublisher?.name || 'Publicador',
      date: scheduledDate,
      time: scheduledTime,
      phone: selectedPublisher?.phone,
      address: selectedPublisher?.address,
      focus,
      scriptures: scripturesOrPoints,
      notes,
    });
    openWhatsAppLink(selectedElder2.phone || '', msg);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-md animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden my-auto max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-900 dark:to-teal-900 p-5 sm:p-6 text-white shrink-0 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-md shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                {visitToEdit ? 'Editar Visita de Pastoreo' : 'Programar Nueva Visita de Pastoreo'}
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Cuidado pastoral y estímulo espiritual del Cuerpo de Ancianos
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Seleccionar Publicador / Familia */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Publicador o Familia a Pastorear *
            </label>
            <select
              value={publisherId}
              onChange={(e) => setPublisherId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="" disabled>
                -- Selecciona un publicador --
              </option>
              {publishers
                .filter((p) => p.status !== 'deleted')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.groupNumber ? `(Grupo ${p.groupNumber})` : ''} · Última visita:{' '}
                    {p.last_shepherding_visit || 'Sin reg.'}
                  </option>
                ))}
            </select>
            {selectedPublisher && (
              <div className="mt-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/5 flex flex-wrap items-center gap-4 text-[11px] text-zinc-600 dark:text-zinc-400">
                {selectedPublisher.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{selectedPublisher.phone}</span>
                  </span>
                )}
                {selectedPublisher.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{selectedPublisher.address}</span>
                  </span>
                )}
                <span className="font-mono text-zinc-500">
                  Última visita: <strong>{selectedPublisher.last_shepherding_visit || 'Nunca'}</strong>
                </span>
              </div>
            )}
          </div>

          {/* 2. Pareja de Ancianos Visitadores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Anciano Titular (Conductor) *
              </label>
              <select
                value={elder1Id}
                onChange={(e) => setElder1Id(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="" disabled>
                  -- Seleccionar anciano --
                </option>
                {elders.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Anciano / Siervo Acompañante
              </label>
              <select
                value={elder2Id}
                onChange={(e) => setElder2Id(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">-- Sin acompañante asignado --</option>
                {elders
                  .filter((e) => e.id !== elder1Id)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* 3. Fecha y Hora Acordada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Fecha Programada *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Hora de la Visita
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 4. Enfoque Pastoral y Sugerencias Bíblicas */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Enfoque Pastoral / Necesidad Espiritual
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(SHEPHERDING_FOCUS_CONFIG) as ShepherdingFocus[]).map((fKey) => {
                const conf = SHEPHERDING_FOCUS_CONFIG[fKey];
                const isSelected = focus === fKey;
                return (
                  <button
                    key={fKey}
                    type="button"
                    onClick={() => handleFocusChange(fKey)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{conf.label}</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                      {conf.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Textos Bíblicos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Textos Bíblicos o Puntos de Ánimo
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-500">Sugerencias:</span>
                {SHEPHERDING_FOCUS_CONFIG[focus]?.suggestedScriptures.map((scrip) => (
                  <button
                    key={scrip}
                    type="button"
                    onClick={() => handleAppendScripture(scrip)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-200/70 dark:bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-600 transition cursor-pointer font-mono"
                  >
                    + {scrip}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={scripturesOrPoints}
              onChange={(e) => setScripturesOrPoints(e.target.value)}
              placeholder="Ej: Romanos 1:11, 12, Salmo 34:18"
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 6. Notas Confidenciales */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Notas Confidenciales de Seguimiento (Solo Cuerpo de Ancianos)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotaciones para la visita, circunstancias familiares, apoyos requeridos..."
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Quick WhatsApp Action bar */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Notificaciones Inmediatas por WhatsApp:</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendFamilyWhatsApp}
                disabled={!selectedPublisher}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <Send className="w-3 h-3" />
                <span>A la Familia</span>
              </button>
              {selectedElder2 && (
                <button
                  type="button"
                  onClick={handleSendCompanionWhatsApp}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 dark:bg-white/10 dark:hover:bg-white/20 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <Send className="w-3 h-3" />
                  <span>Al Acompañante</span>
                </button>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 font-bold text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{visitToEdit ? 'Guardar Cambios' : 'Agendar Visita'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
