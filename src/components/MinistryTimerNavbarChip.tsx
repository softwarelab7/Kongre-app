// src/components/MinistryTimerNavbarChip.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause } from 'lucide-react';

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

  // Sync with custom event and storage events
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

  // Tick timer every second
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

  // Formatted mm:ss or hh:mm:ss
  const formattedTime = useMemo(() => {
    const hrs = Math.floor(displaySeconds / 3600);
    const mins = Math.floor((displaySeconds % 3600) / 60);
    const secs = displaySeconds % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [displaySeconds]);

  // Don't show chip if timer is completely idle (0 seconds and not running)
  if (displaySeconds === 0 && !timerState.isRunning) {
    return null;
  }

  // Mini ring calculations (22px diameter, radius 9px)
  const size = 22;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const sec = displaySeconds % 60;
  const progressRatio = timerState.isRunning
    ? (sec === 0 && displaySeconds > 0 ? 1 : sec / 60)
    : sec / 60;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const isRunning = timerState.isRunning;

  return (
    <button
      type="button"
      onClick={onNavigateToMinistry}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer select-none border active:scale-95 shadow-xs ${
        isRunning
          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/60'
      }`}
      title={
        isRunning
          ? `Predicación en curso: ${formattedTime} (Toca para abrir)`
          : `Predicación en pausa: ${formattedTime} (Toca para reanudar)`
      }
    >
      {/* Mini SVG Animated Circular Ring */}
      <div className="relative w-[22px] h-[22px] flex items-center justify-center shrink-0">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="opacity-20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: isRunning ? 'stroke-dashoffset 0.95s linear' : 'stroke-dashoffset 0.3s ease',
            }}
          />
        </svg>

        {/* Center micro icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isRunning ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          ) : (
            <Pause className="w-2.5 h-2.5 fill-current text-amber-600 dark:text-amber-400" />
          )}
        </div>
      </div>

      {/* Label and live timer digits */}
      <span className="font-mono font-black tracking-tight text-[11px] tabular-nums">
        {formattedTime}
      </span>

      <span className="hidden md:inline text-[10px] font-extrabold uppercase tracking-wider opacity-75">
        {isRunning ? 'Predicando' : 'Pausado'}
      </span>
    </button>
  );
};
