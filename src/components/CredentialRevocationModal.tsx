import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  KeyRound,
  Sparkles,
  Smartphone,
  Laptop,
  Tablet,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { CredentialRevocationReasonId } from '../types';
import { REVOCATION_REASON_OPTIONS } from '../context/SecurityContext';

export interface CredentialRevocationTarget {
  publisherId: string;
  publisherName: string;
  role: string;
  currentPinOrCode?: string;
  redeemedDeviceInfo?: string;
  redeemedDeviceType?: 'mobile' | 'tablet' | 'desktop';
  redeemedAt?: string;
}

interface CredentialRevocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: CredentialRevocationTarget | null;
  onGenerateRandomPin: () => string;
  onConfirmRevokeAndReplace: (params: {
    publisherId: string;
    publisherName: string;
    role: string;
    oldPinOrCode?: string;
    newPinOrCode: string;
    reasonId: CredentialRevocationReasonId;
    reasonDetails: string;
  }) => void;
}

export const CredentialRevocationModal: React.FC<CredentialRevocationModalProps> = ({
  isOpen,
  onClose,
  target,
  onGenerateRandomPin,
  onConfirmRevokeAndReplace,
}) => {
  const [selectedReason, setSelectedReason] = useState<CredentialRevocationReasonId>('olvido');
  const [reasonDetails, setReasonDetails] = useState('');
  const [newPin, setNewPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && target) {
      setSelectedReason('olvido');
      setReasonDetails('');
      setErrorMsg(null);
      setNewPin(onGenerateRandomPin());
    }
  }, [isOpen, target, onGenerateRandomPin]);

  if (!isOpen || !target) return null;

  const formatDateAndTime = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dayStr = d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { dayStr, timeStr };
  };

  const redeemedFormatted = formatDateAndTime(target.redeemedAt);

  const DeviceIcon =
    target.redeemedDeviceType === 'mobile'
      ? Smartphone
      : target.redeemedDeviceType === 'tablet'
      ? Tablet
      : Laptop;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNewPin = newPin.trim();
    if (!cleanNewPin || cleanNewPin.length < 4) {
      setErrorMsg('El nuevo código o PIN debe tener al menos 4 dígitos.');
      return;
    }
    if (target.currentPinOrCode && cleanNewPin === target.currentPinOrCode.trim()) {
      setErrorMsg('El nuevo código debe ser distinto al código anterior que será revocado.');
      return;
    }
    if (selectedReason === 'otro_motivo' && !reasonDetails.trim()) {
      setErrorMsg('Por favor especifica brevemente el motivo en el campo de observaciones.');
      return;
    }

    onConfirmRevokeAndReplace({
      publisherId: target.publisherId,
      publisherName: target.publisherName,
      role: target.role,
      oldPinOrCode: target.currentPinOrCode,
      newPinOrCode: cleanNewPin,
      reasonId: selectedReason,
      reasonDetails: reasonDetails.trim(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Formulario de revocación y cambio de código"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Cambiar Código y Revocar Anterior
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hermano: <strong className="text-slate-800 dark:text-slate-200">{target.publisherName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar formulario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Current Code & Redemption Info Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Credencial que quedará revocada
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Se revocará al confirmar
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">Código anterior:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  {target.currentPinOrCode ? `••${target.currentPinOrCode.slice(-2)}` : 'Asignado'}
                </span>
              </div>

              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Dispositivos privados del publicador</span>
              </span>
            </div>
          </div>

          {/* 1. Mandatory Reason Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
              1. Especifica la razón del cambio (Obligatorio) *
            </label>
            <div className="space-y-2">
              {REVOCATION_REASON_OPTIONS.map((option) => {
                const isSelected = selectedReason === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSelectedReason(option.id);
                      setErrorMsg(null);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/15'
                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-rose-600 bg-rose-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`block text-xs font-bold ${
                          isSelected ? 'text-rose-900 dark:text-rose-200' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {option.label}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {option.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Additional Notes / Details */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">
              2. Detalles adicionales del motivo {selectedReason === 'otro_motivo' ? '*' : '(Opcional)'}
            </label>
            <textarea
              rows={2}
              value={reasonDetails}
              onChange={(e) => {
                setReasonDetails(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Ej. El hermano avisó hoy antes de la reunión que extravió su teléfono celular..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-hidden"
            />
          </div>

          {/* 3. New Code / PIN Assignment */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>3. Nuevo Código / PIN Personal</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setNewPin(onGenerateRandomPin());
                  setErrorMsg(null);
                }}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generar otro aleatorio</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={8}
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value.replace(/\D/g, ''));
                  setErrorMsg(null);
                }}
                placeholder="4 a 8 dígitos"
                className="flex-1 px-3.5 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-mono text-sm font-extrabold tracking-widest text-center text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                Al guardar, el código anterior quedará <strong>revocado permanentemente</strong> y se cerrará cualquier sesión abierta con él.
              </span>
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Revocar Anterior y Asignar Nuevo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
