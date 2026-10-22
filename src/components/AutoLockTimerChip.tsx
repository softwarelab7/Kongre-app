// src/components/AutoLockTimerChip.tsx
import React from 'react';
import { useSecurity } from '../context/SecurityContext';
import { AutoLockRing } from './AutoLockRing';

function formatMmSs(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? '0' : ''}${rem}`;
}

export const AutoLockTimerChip: React.FC = () => {
  const {
    isAutoLockActive,
    isLocked,
    remainingSeconds,
    autoLockFraction,
    autoLockState,
    isRefilling,
    resetInactivityTimer,
  } = useSecurity();

  if (!isAutoLockActive || isLocked) {
    return null;
  }

  const timeLabel = formatMmSs(remainingSeconds);

  return (
    <button
      type="button"
      onClick={resetInactivityTimer}
      className={`kg-autolock-chip border transition-all cursor-pointer ${
        autoLockState === 'crit'
          ? 'border-rose-400 dark:border-rose-500/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300'
          : autoLockState === 'warn'
          ? 'border-amber-400 dark:border-amber-500/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
          : 'border-slate-200/80 dark:border-white/[0.08] bg-slate-100/90 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700'
      }`}
      data-state={autoLockState}
      title={`Bloqueo automático en ${timeLabel} por inactividad. Clic para reiniciar tiempo.`}
      aria-label={`Bloqueo por inactividad en ${timeLabel}`}
    >
      <AutoLockRing
        size={22}
        stroke={2.5}
        fraction={autoLockFraction}
        state={autoLockState}
        isRefill={isRefilling}
      />
      <b className="tabular-nums">{timeLabel}</b>
    </button>
  );
};
