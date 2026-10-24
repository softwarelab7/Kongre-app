// src/components/AutoLockToastWarning.tsx
import React from 'react';
import { useSecurity } from '../context/SecurityContext';
import { AutoLockRing } from './AutoLockRing';
import { Lock } from 'lucide-react';

function formatMmSs(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? '0' : ''}${rem}`;
}

export const AutoLockToastWarning: React.FC = () => {
  const {
    isAutoLockActive,
    isLocked,
    remainingSeconds,
    autoLockState,
    resetInactivityTimer,
  } = useSecurity();

  // Mostrar el toast durante el último minuto antes del bloqueo
  const isVisible = isAutoLockActive && !isLocked && remainingSeconds <= 60 && remainingSeconds > 0;

  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="assertive"
      onClick={resetInactivityTimer}
      title="Toca para continuar y restablecer el tiempo"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[9990] flex items-center gap-3.5 w-[min(92%,430px)] p-3.5 sm:p-4 bg-white/95 dark:bg-[#111827]/95 border border-amber-300 dark:border-amber-500/40 rounded-2xl shadow-2xl backdrop-blur-xl cursor-pointer select-none animate-in fade-in slide-in-from-bottom-4 duration-300 hover:scale-[1.01] active:scale-[0.99] transition-all"
    >
      <AutoLockRing
        size={46}
        stroke={4}
        fraction={remainingSeconds / 60}
        state={autoLockState}
      >
        <span className="text-sm font-black tabular-nums text-slate-900 dark:text-white">
          {remainingSeconds}
        </span>
      </AutoLockRing>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
          <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Se bloqueará por inactividad</span>
        </div>
        <p className="text-[11.5px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
          en <span className="font-bold text-slate-800 dark:text-slate-200">{formatMmSs(remainingSeconds)}</span>. Toca la pantalla o presiona una tecla para continuar.
        </p>
      </div>
    </div>
  );
};
