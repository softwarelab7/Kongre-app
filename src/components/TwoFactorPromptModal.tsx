// src/components/TwoFactorPromptModal.tsx
import React, { useState } from 'react';
import {
  ShieldCheck,
  Smartphone,
  KeyRound,
  AlertCircle,
  X,
  RefreshCw,
  Check,
  Lock,
} from 'lucide-react';

interface TwoFactorPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  publisherName: string;
  onVerifyCode: (codeOrBackup: string, trustThisDevice: boolean) => Promise<{ success: boolean; message: string; usedBackupCode?: boolean }>;
  onSuccess: () => void;
}

export const TwoFactorPromptModal: React.FC<TwoFactorPromptModalProps> = ({
  isOpen,
  onClose,
  publisherName,
  onVerifyCode,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [useBackupMode, setUseBackupMode] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = code.trim();
    if (!useBackupMode && clean.replace(/\D/g, '').length !== 6) {
      setErrorMsg('Por favor escribe los 6 dígitos del código.');
      return;
    }
    if (useBackupMode && clean.length < 8) {
      setErrorMsg('Por favor escribe el código de respaldo completo.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const result = await onVerifyCode(clean, trustDevice);
      if (result.success) {
        onSuccess();
      } else {
        setErrorMsg(result.message || 'Código incorrecto. Inténtalo nuevamente.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al verificar el código.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (useBackupMode) {
      setCode(val.toUpperCase());
    } else {
      const numeric = val.replace(/\D/g, '').slice(0, 6);
      setCode(numeric);
      if (numeric.length === 6) {
        // Auto-envío opcional al completar los 6 dígitos
        setTimeout(() => {
          setIsVerifying(true);
          setErrorMsg(null);
          onVerifyCode(numeric, trustDevice)
            .then((res) => {
              if (res.success) onSuccess();
              else setErrorMsg(res.message || 'Código incorrecto.');
            })
            .catch((err) => setErrorMsg(err.message || 'Error al verificar.'))
            .finally(() => setIsVerifying(false));
        }, 150);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 rounded-3xl shadow-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
        {/* Encabezado */}
        <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-850">
          <div className="flex items-center gap-3">
            <div className="kg-glow-badge p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base sm:text-lg">
                Verificación en Dos Pasos
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                {publisherName ? `Cuenta de: ${publisherName}` : 'Seguridad Teocrática'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-800 dark:text-zinc-200 text-xs flex items-start gap-2.5 shadow-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!useBackupMode ? (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 flex items-center justify-center mx-auto mb-2 border border-zinc-200 dark:border-[#27272A]">
                  <Smartphone className="w-5 h-5 text-zinc-500" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                  Código de Microsoft Authenticator
                </h4>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  Abre tu aplicación de autenticación e ingresa el código temporal de 6 dígitos.
                </p>
              </div>

              <div className="max-w-[260px] mx-auto">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={handleCodeChange}
                  disabled={isVerifying}
                  className="w-full text-center text-3xl font-mono tracking-[0.35em] font-extrabold py-3 px-3 rounded-2xl border-2 border-zinc-300 dark:border-[#27272A] focus:border-zinc-500 bg-white dark:bg-[#18181F] text-zinc-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10 shadow-xs disabled:opacity-60"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 flex items-center justify-center mx-auto mb-2 border border-zinc-200 dark:border-[#27272A]">
                  <KeyRound className="w-5 h-5 text-amber-500" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                  Código de Respaldo de Emergencia
                </h4>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  Escribe uno de los 8 códigos de respaldo guardados durante la configuración (ej: <code>A4B8-92EF</code>).
                </p>
              </div>

              <div className="max-w-[260px] mx-auto">
                <input
                  type="text"
                  maxLength={12}
                  placeholder="XXXX-XXXX"
                  value={code}
                  onChange={handleCodeChange}
                  disabled={isVerifying}
                  className="w-full text-center text-xl font-mono tracking-widest font-extrabold py-3 px-3 rounded-2xl border-2 border-zinc-300 dark:border-[#27272A] focus:border-zinc-500 bg-white dark:bg-[#18181F] text-zinc-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10 shadow-xs uppercase disabled:opacity-60"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Opción de Recordar Dispositivo por 30 días */}
          <div className="p-3 bg-zinc-50 dark:bg-[#18181F]/60 rounded-2xl border border-zinc-200/70 dark:border-[#27272A] flex items-start gap-2.5">
            <input
              type="checkbox"
              id="trust-device-check"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-600 cursor-pointer"
            />
            <label htmlFor="trust-device-check" className="text-xs text-zinc-600 dark:text-[#D4D4D8] cursor-pointer select-none">
              <strong className="block text-zinc-900 dark:text-white">Recordar este dispositivo por 30 días</strong>
              No se te volverá a pedir el código en este navegador durante el próximo mes.
            </label>
          </div>

          {/* Alternar entre Authenticator y Código de Respaldo */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setUseBackupMode(!useBackupMode);
                setCode('');
                setErrorMsg(null);
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
            >
              {useBackupMode
                ? '← Volver a usar código de Microsoft Authenticator'
                : '¿No tienes acceso a tu teléfono? Usar código de respaldo'}
            </button>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isVerifying}
              className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-600 dark:text-[#D4D4D8] text-xs font-semibold hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isVerifying || code.trim().length < (useBackupMode ? 8 : 6)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 disabled:opacity-50 text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Confirmar acceso</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
