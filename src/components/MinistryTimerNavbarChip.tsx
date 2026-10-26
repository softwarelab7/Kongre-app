// src/components/MinistryTimerNavbarChip.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { AutoLockRing } from './AutoLockRing';

interface ActiveTimerState {
  isRunning: boolean;
  startedAt: number | null;
  accumulatedSeconds: number;
}

const STORAGE_KEY_TIMER = 'kongre_ministry_active_timer_v1';

interface MinistryTimerNavbarChipProps {
  onNavigateToMinistry?: () => void;
}

export const MinistryTimerNavbarChip: React.FC<MinistryTimerNavbarChipProps> = ({
  onNavigateToMinistry,
}) => {
  const [timerState, setTimerState] = useState<ActiveTimerState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TIMER);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          isRunning: Boolean(parsed.isRunning),
          startedAt: parsed.startedAt || null,
          accumulatedSeconds: Number(parsed.accumulatedSeconds) || 0,
        };
      }
    } catch {}
    return { isRunning: false, startedAt: null, accumulatedSeconds: 0 };
  });

  const [displaySeconds, setDisplaySeconds] = useState<number>(0);

  // Sincronizar con eventos internos y cambios de almacenamiento
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_TIMER);
        if (raw) {
          const parsed = JSON.parse(raw);
          setTimerState({
            isRunning: Boolean(parsed.isRunning),
            startedAt: parsed.startedAt || null,
            accumulatedSeconds: Number(parsed.accumulatedSeconds) || 0,
          });
        } else {
          setTimerState({ isRunning: false, startedAt: null, accumulatedSeconds: 0 });
        }
      } catch {}
    };

    window.addEventListener('kongre_ministry_timer_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('kongre_ministry_timer_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Calcular tiempo transcurrido en tiempo real
  useEffect(() => {
    const compute = () => {
      if (timerState.isRunning && timerState.startedAt) {
        const delta = Math.max(0, Math.floor((Date.now() - timerState.startedAt) / 1000));
        return timerState.accumulatedSeconds + delta;
      }
      return timerState.accumulatedSeconds;
    };

    setDisplaySeconds(compute());

    if (!timerState.isRunning) return;
    const interval = setInterval(() => {
      setDisplaySeconds(compute());
    }, 1000);
    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.startedAt, timerState.accumulatedSeconds]);

  // Formato mm:ss o hh:mm:ss
  const formattedTime = useMemo(() => {
    const hrs = Math.floor(displaySeconds / 3600);
    const mins = Math.floor((displaySeconds % 3600) / 60);
    const secs = displaySeconds % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [displaySeconds]);

  // Si el cronómetro está en reposo (0s), mostrar acceso rápido discreto en móvil y escritorio (Ctrl+Shift+T en PC)
  if (displaySeconds === 0 && !timerState.isRunning) {
    return (
      <button
        type="button"
        onClick={onNavigateToMinistry}
        className="inline-flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/70 bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer text-xs font-semibold"
        title="Abrir Cronómetro de Predicación (Ctrl+Shift+T)"
        aria-label="Abrir Cronómetro de Predicación (Ctrl+Shift+T)"
      >
        <Clock className="w-3.5 h-3.5 text-emerald-500" />
        <span className="hidden lg:inline text-[11px] font-bold">Cronómetro</span>
      </button>
    );
  }

  const isRunning = timerState.isRunning;
  const sec = displaySeconds % 60;
  const fraction = isRunning
    ? sec === 0 && displaySeconds > 0
      ? 1
      : sec / 60
    : sec / 60;

  return (
    <button
      type="button"
      onClick={onNavigateToMinistry}
      className={`kg-autolock-chip border transition-all cursor-pointer ${
        isRunning
          ? 'border-emerald-300 dark:border-emerald-600/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
          : 'border-amber-300 dark:border-amber-600/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50'
      }`}
      title={
        isRunning
          ? `Predicación activa: ${formattedTime}. Clic o Ctrl+Shift+T para abrir el cronómetro.`
          : `Predicación en pausa: ${formattedTime}. Clic o Ctrl+Shift+T para reanudar.`
      }
      aria-label={`Cronómetro de predicación: ${formattedTime}`}
    >
      <AutoLockRing
        size={22}
        stroke={2.5}
        fraction={fraction}
        colorClass={
          isRunning
            ? 'text-emerald-500 dark:text-emerald-400'
            : 'text-amber-500 dark:text-amber-400'
        }
      />
      <b className="tabular-nums font-mono font-bold text-xs">{formattedTime}</b>
    </button>
  );
};
