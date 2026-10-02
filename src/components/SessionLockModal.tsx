// src/components/SessionLockModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { useCongregation } from '../context/CongregationContext';
import { ShieldCheck, Lock, Unlock, AlertCircle, KeyRound, Delete } from 'lucide-react';

export const SessionLockModal: React.FC = () => {
  const { isLocked, unlockSession } = useSecurity();
  const { settings } = useCongregation();

  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLocked) {
      setEnteredPin('');
      setErrorMsg(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const handleKeyPress = (digit: string) => {
    if (enteredPin.length < 8) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setErrorMsg(null);
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMsg(null);
  };

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!enteredPin) {
      setErrorMsg('Ingrese el PIN de seguridad');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const success = await unlockSession(enteredPin);
    setIsSubmitting(false);

    if (!success) {
      setErrorMsg('PIN incorrecto. Intente nuevamente.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setEnteredPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-fade-in select-none">
      <div
        className={`w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl transition-transform ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Theocratic Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-4 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-black text-white tracking-tight">
          {settings.congregationName || 'Gestor Teocrático'}
        </h2>
        <p className="text-xs text-slate-400 mt-2 mb-6">
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
                    : 'bg-slate-700 border border-slate-600'
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

        {/* On-screen Numeric Keypad for Touchscreens / Booth Tablet */}
        <div className="grid grid-cols-3 gap-2.5 mb-6 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold text-lg border border-slate-700/60 active:scale-95 transition-all shadow-xs"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 font-semibold text-xs border border-slate-700/40 active:scale-95 transition-all"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold text-lg border border-slate-700/60 active:scale-95 transition-all shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700/40 active:scale-95 transition-all"
            title="Borrar"
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

        <p className="text-[11px] text-slate-500 mt-4">
          Protección tipo Organized con cifrado AES-256 local
        </p>
      </div>
    </div>
  );
};
