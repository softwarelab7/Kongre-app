// src/components/PinManagementModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  KeyRound,
  ShieldAlert,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Database,
  BellRing,
  FileText,
} from 'lucide-react';
import { PinChangeRequestReasonId, SolicitudCambioPin } from '../types';
import {
  PIN_CHANGE_REQUEST_REASONS,
  SOLICITUDES_CAMBIO_PIN_COLLECTION,
  submitSolicitudCambioPinToSupabase,
  loadLocalPinChangeRequests,
  fetchSolicitudesCambioPinFromSupabase,
} from '../services/pinChangeRequestsService';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { useToast } from '../context/ToastContext';

export interface PinManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  publisherId?: string;
  publisherName?: string;
  publisherEmail?: string;
  role?: string;
}

export const PinManagementModal: React.FC<PinManagementModalProps> = ({
  isOpen,
  onClose,
  publisherId,
  publisherName,
  publisherEmail,
  role,
}) => {
  const { user, currentPublisherId, currentBrotherName, effectiveRoleInfo } = useAuth();
  const { settings, publishers } = useCongregation();
  const { showToast } = useToast();

  const [selectedReason, setSelectedReason] = useState<PinChangeRequestReasonId>('olvido');
  const [details, setDetails] = useState('');
  const [customBrotherName, setCustomBrotherName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<SolicitudCambioPin | null>(null);
  const [allRequests, setAllRequests] = useState<SolicitudCambioPin[]>(() =>
    loadLocalPinChangeRequests()
  );

  const effectivePubId =
    publisherId ||
    currentPublisherId ||
    (typeof window !== 'undefined' ? localStorage.getItem('kongre_current_publisher_id_v2') || '' : '') ||
    'pub-1';

  const effectivePubName =
    publisherName ||
    currentBrotherName ||
    user?.displayName ||
    customBrotherName ||
    'Publicador';

  const effectiveEmail = publisherEmail || user?.email || undefined;
  const effectiveRole = role || effectiveRoleInfo?.id || 'publico';
  const congregationId =
    settings?.congregationNumber ||
    settings?.congregationId ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('kongre_congregation_number') ||
        localStorage.getItem('kongre_congregation_id') ||
        'CONG-LOCAL'
      : 'CONG-LOCAL');

  useEffect(() => {
    if (!isOpen) return;
    setSubmittedRecord(null);
    setSelectedReason('olvido');
    setDetails('');
    setAllRequests(loadLocalPinChangeRequests());

    fetchSolicitudesCambioPinFromSupabase(congregationId).then((list) => {
      setAllRequests(list);
    });

    const handleUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (Array.isArray(detail)) {
        setAllRequests(detail);
      } else {
        setAllRequests(loadLocalPinChangeRequests());
      }
    };

    window.addEventListener('kongre_pin_requests_updated', handleUpdated);
    return () => window.removeEventListener('kongre_pin_requests_updated', handleUpdated);
  }, [isOpen, congregationId]);

  const selectedReasonInfo = useMemo(() => {
    return (
      PIN_CHANGE_REQUEST_REASONS.find((r) => r.id === selectedReason) ||
      PIN_CHANGE_REQUEST_REASONS[0]
    );
  }, [selectedReason]);

  // Filter requests strictly to the current publisher
  const myRequests = useMemo(() => {
    const cleanName = effectivePubName.toLowerCase().trim();
    return allRequests.filter((r) => {
      if (effectivePubId && r.publisher_id === effectivePubId) return true;
      if (cleanName && r.publisher_name.toLowerCase().trim() === cleanName) return true;
      return false;
    });
  }, [allRequests, effectivePubId, effectivePubName]);

  if (!isOpen) return null;

  const needsNameSelection =
    !publisherName && !currentBrotherName && !user?.displayName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = (
      publisherName ||
      currentBrotherName ||
      user?.displayName ||
      customBrotherName
    )?.trim();

    if (!finalName) {
      showToast('Por favor selecciona o escribe tu nombre para identificar tu solicitud', 'error');
      return;
    }

    const matchedPub = publishers.find(
      (p) => p.name.toLowerCase().trim() === finalName.toLowerCase()
    );

    setIsSubmitting(true);
    try {
      const res = await submitSolicitudCambioPinToSupabase({
        congregationId,
        publisherId: matchedPub?.id || effectivePubId,
        publisherName: matchedPub?.name || finalName,
        publisherEmail: matchedPub?.email || effectiveEmail,
        role: matchedPub?.theocraticRole || effectiveRole,
        reasonId: selectedReason,
        details: details.trim() || undefined,
      });

      setSubmittedRecord(res.record);
      setAllRequests(loadLocalPinChangeRequests());
      showToast(
        'Solicitud registrada en SolicitudesCambioPin. Los ancianos han sido notificados automáticamente.',
        'success'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Solicitar cambio de PIN personal"
    >
      <div className="bg-white dark:bg-[#121216] rounded-3xl max-w-lg w-full shadow-2xl border border-zinc-200 dark:border-[#27272A] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                Solicitar Cambio de PIN Personal
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Notificación automática a los ancianos ({SOLICITUDES_CAMBIO_PIN_COLLECTION})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {submittedRecord ? (
            <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 space-y-4 text-center animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200">
                  <BellRing className="w-3 h-3" />
                  Ancianos Notificados Automáticamente
                </span>
                <h4 className="text-base font-extrabold text-zinc-900 dark:text-white pt-1">
                  ¡Tu solicitud de cambio de PIN ha sido enviada!
                </h4>
                <p className="text-xs text-zinc-600 dark:text-[#D4D4D8] leading-relaxed">
                  Se creó un registro en la colección <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{SOLICITUDES_CAMBIO_PIN_COLLECTION}</code> de Supabase para que el cuerpo de ancianos revoque tu PIN anterior y te entregue uno nuevo.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181F] border border-emerald-200/80 dark:border-emerald-800/50 text-left space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">Publicador:</span>
                  <strong className="text-zinc-900 dark:text-white">{submittedRecord.publisher_name}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">Razón reportada:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400">{submittedRecord.reason_label}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">Estado:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    Pendiente de atención por ancianos
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSubmittedRecord(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] font-bold transition-colors cursor-pointer"
                >
                  Enviar otra solicitud
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Info Banner */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/50 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-[11px] text-zinc-600 dark:text-[#D4D4D8] leading-relaxed">
                  <strong className="text-zinc-900 dark:text-white block">
                    Solicitud exclusiva para el publicador
                  </strong>
                  Por seguridad teocrática, cuando solicitas un cambio de PIN se registra automáticamente en <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{SOLICITUDES_CAMBIO_PIN_COLLECTION}</span> para que un anciano revoque el PIN anterior y te asigne uno nuevo.
                </div>
              </div>

              {/* Publisher Identity (or selector if opened from login screen before identifying) */}
              {needsNameSelection ? (
                <div>
                  <label className="block text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mb-1.5">
                    Tu Nombre Completo *
                  </label>
                  <select
                    value={customBrotherName}
                    onChange={(e) => setCustomBrotherName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">— Selecciona tu nombre en la congregación —</option>
                    {publishers.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-[#A1A1AA] font-semibold">
                    Publicador solicitante:
                  </span>
                  <strong className="text-zinc-900 dark:text-white font-extrabold">
                    {effectivePubName}
                  </strong>
                </div>
              )}

              {/* Predefined Reasons Dropdown Menu */}
              <div>
                <label
                  htmlFor="pin-change-reason-select"
                  className="block text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mb-1.5"
                >
                  Motivo de la solicitud de cambio de PIN *
                </label>
                <select
                  id="pin-change-reason-select"
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value as PinChangeRequestReasonId)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {PIN_CHANGE_REQUEST_REASONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] mt-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{selectedReasonInfo.description}</span>
                </p>
              </div>

              {/* Optional Details */}
              <div>
                <label
                  htmlFor="pin-change-details"
                  className="block text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mb-1.5"
                >
                  Nota u observación adicional para los ancianos (Opcional)
                </label>
                <textarea
                  id="pin-change-details"
                  rows={2}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Ej. Cambié mi teléfono esta semana, por favor envíenme el nuevo PIN por WhatsApp."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Submit & Cancel */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-[#27272A]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#D4D4D8] font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Enviando solicitud...' : 'Enviar Solicitud a los Ancianos'}</span>
                </button>
              </div>
            </form>
          )}

          {/* User's Own Previous Requests */}
          {myRequests.length > 0 && (
            <div className="pt-4 border-t border-zinc-100 dark:border-[#27272A] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Mis Solicitudes de Cambio de PIN ({myRequests.length})</span>
                </span>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {myRequests.map((req) => {
                  const dt = new Date(req.created_at);
                  const dateStr = isNaN(dt.getTime())
                    ? req.created_at
                    : `${dt.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} · ${dt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
                  return (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {req.reason_label}
                          </span>
                        </div>
                        <span className="block text-[10.5px] text-zinc-500 dark:text-[#A1A1AA]">
                          Enviada: {dateStr}
                          {req.resolved_by ? ` · Atendida por: ${req.resolved_by}` : ''}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          req.status === 'atendida'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : req.status === 'rechazada'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {req.status === 'atendida'
                          ? 'Atendida'
                          : req.status === 'rechazada'
                          ? 'Cerrada'
                          : 'Pendiente'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
