// src/components/SessionLockModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { useCongregation } from '../context/CongregationContext';
import { ShieldCheck, Lock, Unlock, AlertCircle, KeyRound, Delete, ShieldAlert } from 'lucide-react';
import {
  getPinLockoutRemainingSeconds,
  recordFailedPinAttempt,
  resetFailedPinAttempts,
  isSafeDemoMode,
} from '../utils/theocraticSecurity';

export const SessionLockModal: React.FC = () => {
  const { isLocked, unlockSession } = useSecurity();
  const { settings, isDemoMode } = useCongregation();

  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDemo =
    isDemoMode ||
    settings?.congregationNumber?.includes('DEMO') ||
    settings?.congregationId?.includes('DEMO') ||
    isSafeDemoMode(settings?.congregationNumber || settings?.congregationId, settings?.isRegistered);

  // Check lockout on mount and on lock
  useEffect(() => {
    if (isLocked && !isDemo) {
      setEnteredPin('');
      setErrorMsg(null);
      const remaining = getPinLockoutRemainingSeconds();
      setLockoutSeconds(remaining);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLocked, isDemo]);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  if (isDemo || !isLocked) return null;

  const handleKeyPress = (digit: string) => {
    if (lockoutSeconds > 0) return;
    if (enteredPin.length < 8) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setErrorMsg(null);
    }
  };

  const handleDelete = () => {
    if (lockoutSeconds > 0) return;
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    if (lockoutSeconds > 0) return;
    setEnteredPin('');
    setErrorMsg(null);
  };

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (lockoutSeconds > 0) {
      setErrorMsg(`Por seguridad teocrática, espera ${lockoutSeconds}s para volver a intentar.`);
      return;
    }

    if (!enteredPin) {
      setErrorMsg('Ingrese el PIN de seguridad');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const success = await unlockSession(enteredPin);
    setIsSubmitting(false);

    if (success) {
      resetFailedPinAttempts();
      setLockoutSeconds(0);
    } else {
      const lockout = recordFailedPinAttempt();
      if (lockout.isLockedOut) {
        setLockoutSeconds(lockout.remainingSeconds);
        setErrorMsg(`Demasiados intentos fallidos. Bloqueado por ${lockout.remainingSeconds}s.`);
      } else {
        setErrorMsg(`PIN incorrecto (intento ${lockout.attempts}/5).`);
      }
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setEnteredPin('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/95 backdrop-blur-md p-4 animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Pantalla de bloqueo de seguridad"
    >
      <div
        className={`w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl transition-transform ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Theocratic Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-4 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-black text-white tracking-tight">
          {settings.congregationName || 'Gestor Teocrático'}
        </h2>
        <p className="text-xs text-zinc-400 mt-2 mb-6">
          Introduce tu PIN de Bloqueo para acceder a tu información
        </p>

        {/* PIN Dots Display */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const hasChar = enteredPin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  hasChar
                    ? 'bg-indigo-400 scale-125 shadow-xs shadow-indigo-500/50'
                    : 'bg-zinc-700 border border-zinc-600'
                }`}
              />
            );
          })}
        </div>

        {/* Hidden Input for physical keyboard */}
        <form onSubmit={handleUnlock} className="mb-4">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={enteredPin}
            onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
            aria-label="PIN de desbloqueo de sesión"
            className="sr-only"
            autoFocus
          />
        </form>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Lockout Notice */}
        {lockoutSeconds > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 animate-pulse">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Bloqueo temporal de seguridad: {lockoutSeconds}s</span>
          </div>
        )}

        {/* On-screen Numeric Keypad for Touchscreens / Booth Tablet */}
        <div className="grid grid-cols-3 gap-2.5 mb-6 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              disabled={lockoutSeconds > 0}
              onClick={() => handleKeyPress(num)}
              className="h-12 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 text-white font-bold text-lg border border-zinc-700/60 active:scale-95 transition-all shadow-xs disabled:opacity-40 disabled:pointer-events-none"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            disabled={lockoutSeconds > 0}
            onClick={handleClear}
            aria-label="Limpiar todo el PIN ingresado"
            className="h-12 rounded-2xl bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 font-semibold text-xs border border-zinc-700/40 active:scale-95 transition-all disabled:opacity-40"
          >
            C
          </button>
          <button
            type="button"
            disabled={lockoutSeconds > 0}
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 text-white font-bold text-lg border border-zinc-700/60 active:scale-95 transition-all shadow-xs disabled:opacity-40 disabled:pointer-events-none"
          >
            0
          </button>
          <button
            type="button"
            disabled={lockoutSeconds > 0}
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 flex items-center justify-center border border-zinc-700/40 active:scale-95 transition-all disabled:opacity-40"
            title="Borrar"
            aria-label="Borrar último dígito"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Unlock Button */}
        <button
          onClick={() => handleUnlock()}
          disabled={enteredPin.length === 0 || isSubmitting}
          className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-98 cursor-pointer"
        >
          <Unlock className="w-4 h-4" />
          <span>{isSubmitting ? 'Verificando...' : 'Desbloquear Sesión'}</span>
        </button>

        <p className="text-[11px] text-zinc-500 mt-4">
          Protección teocrática con cifrado AES-256 local
        </p>
      </div>
    </div>
  );
};
