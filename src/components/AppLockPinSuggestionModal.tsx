// src/components/AppLockPinSuggestionModal.tsx
import React, { useState } from 'react';
import { useSecurity } from '../context/SecurityContext';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Smartphone,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AppLockPinSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AppLockPinSuggestionModal: React.FC<AppLockPinSuggestionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { setPersonalPin } = useSecurity();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDismiss = () => {
    // Record that the user decided to skip for now
    localStorage.setItem('kongre_lock_pin_suggestion_dismissed', 'true');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPin = pin.trim();
    const cleanConfirm = confirmPin.trim();

    if (!cleanPin) {
      setError('Por favor introduce un PIN numérico de 4 a 6 dígitos.');
      return;
    }

    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setError('El PIN de bloqueo debe tener entre 4 y 6 dígitos.');
      return;
    }

    if (!/^\d+$/.test(cleanPin)) {
      setError('El PIN solo debe contener números.');
      return;
    }

    if (cleanPin !== cleanConfirm) {
      setError('Los dos PIN ingresados no coinciden. Por favor verifica.');
      return;
    }

    try {
      setIsSubmitting(true);
      await setPersonalPin(cleanPin);
      localStorage.setItem('kongre_lock_pin_suggestion_dismissed', 'true');
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        setPin('');
        setConfirmPin('');
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el PIN de bloqueo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Configurar PIN de bloqueo de la aplicación"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/75 backdrop-blur-xs transition-opacity"
        onClick={handleDismiss}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 dark:border-[#27272A] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                PIN de Bloqueo de la Aplicación
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Sugerencia de seguridad en este dispositivo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
            title="Cerrar y omitir por ahora"
            aria-label="Cerrar y omitir configuración de PIN por ahora"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-white">
              ¡PIN de Bloqueo Activado!
            </h4>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-xs mx-auto">
              Tu aplicación en este dispositivo ahora está protegida. Podrás bloquearla en cualquier momento o dejar que se bloquee por inactividad.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Friendly Explanation Banner */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2 text-xs">
              <p className="text-zinc-700 dark:text-[#D4D4D8] leading-relaxed">
                Has iniciado sesión con éxito. Para proteger las listas confidenciales de publicadores y asignaciones en este equipo o teléfono, te sugerimos activar un <strong>PIN de bloqueo rápido</strong>.
              </p>
              <div className="flex items-start gap-1.5 pt-1 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-500" />
                <span>
                  <strong>Nota:</strong> Este PIN es exclusivo para bloquear la pantalla localmente. Es independiente del PIN de la congregación y de los códigos de invitación.
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-[#D4D4D8] mb-1">
                  Nuevo PIN de Bloqueo (4 a 6 dígitos): *
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full p-2.5 pr-10 font-mono font-bold text-center tracking-widest text-base rounded-xl border border-zinc-300 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-white"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    aria-label={showPin ? 'Ocultar PIN de bloqueo' : 'Mostrar PIN de bloqueo'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-[#D4D4D8] mb-1">
                  Confirma tu PIN de Bloqueo: *
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Repite el PIN"
                  className="w-full p-2.5 font-mono font-bold text-center tracking-widest text-base rounded-xl border border-zinc-300 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-[#27272A]">
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2.5 rounded-xl text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-xs font-bold transition-colors cursor-pointer"
              >
                Omitir por ahora
              </button>

              <button
                type="submit"
                disabled={isSubmitting || pin.length < 4}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Guardando...' : 'Activar PIN de Bloqueo'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
