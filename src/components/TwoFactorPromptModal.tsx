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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Encabezado */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                Verificación en Dos Pasos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {publisherName ? `Cuenta de: ${publisherName}` : 'Seguridad Teocrática'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!useBackupMode ? (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2 border border-indigo-200/50">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Código de Microsoft Authenticator
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
                  className="w-full text-center text-3xl font-mono tracking-[0.35em] font-extrabold py-3 px-3 rounded-2xl border-2 border-indigo-400/80 dark:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-sm disabled:opacity-60"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-200/50">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Código de Respaldo de Emergencia
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
                  className="w-full text-center text-xl font-mono tracking-widest font-extrabold py-3 px-3 rounded-2xl border-2 border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 shadow-sm uppercase disabled:opacity-60"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Opción de Recordar Dispositivo por 30 días */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="trust-device-check"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
            />
            <label htmlFor="trust-device-check" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              <strong className="block text-slate-900 dark:text-white">Recordar este dispositivo por 30 días</strong>
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
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isVerifying || code.trim().length < (useBackupMode ? 8 : 6)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
