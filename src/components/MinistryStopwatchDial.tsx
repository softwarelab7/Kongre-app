// src/components/MinistryStopwatchDial.tsx
import React, { useMemo } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Plus,
  Home,
  Users,
  BookOpen,
  Phone,
  Store,
  PlusCircle,
  MinusCircle,
  Clock,
  Sparkles,
  Compass,
} from 'lucide-react';
import { MinistryTimeLog } from './MinisterioPublicadorTab';

interface MinistryStopwatchDialProps {
  displaySeconds: number;
  isRunning: boolean;
  modality: MinistryTimeLog['modality'];
  onStartPause: () => void;
  onFinish: () => void;
  onReset: () => void;
  onAdjustMinutes: (deltaMinutes: number) => void;
  sessionReturnVisits: number;
  onUpdateReturnVisits: (val: number | ((prev: number) => number)) => void;
  sessionPlacements: number;
  onUpdatePlacements: (val: number | ((prev: number) => number)) => void;
  onUpdateModality: (modality: MinistryTimeLog['modality']) => void;
  onOpenManualLog: () => void;
  modalityLabels: Record<MinistryTimeLog['modality'], string>;
}

export const MinistryStopwatchDial: React.FC<MinistryStopwatchDialProps> = ({
  displaySeconds,
  isRunning,
  modality,
  onStartPause,
  onFinish,
  onReset,
  onAdjustMinutes,
  sessionReturnVisits,
  onUpdateReturnVisits,
  sessionPlacements,
  onUpdatePlacements,
  onUpdateModality,
  onOpenManualLog,
  modalityLabels,
}) => {
  // Format total seconds into Hours, Minutes, and Seconds
  const { hrs, mins, secs, totalMinutes } = useMemo(() => {
    const hrs = Math.floor(displaySeconds / 3600);
    const mins = Math.floor((displaySeconds % 3600) / 60);
    const secs = displaySeconds % 60;
    const totalMinutes = Math.floor(displaySeconds / 60);
    return {
      hrs: String(hrs).padStart(2, '0'),
      mins: String(mins).padStart(2, '0'),
      secs: String(secs).padStart(2, '0'),
      totalMinutes,
    };
  }, [displaySeconds]);

  // SVG Dial Calculations
  // Outer diameter 220px, strokeWidth 8px, radius 100px
  const size = 220;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth - 4; // 106 - 8 - 4 = 94
  const circumference = 2 * Math.PI * radius;

  // Progress calculations:
  // Sweep corresponds to seconds within the current minute (0..59)
  // or subtle progression when idle/paused
  const secondsInMinute = displaySeconds % 60;
  const progressRatio = isRunning
    ? (secondsInMinute === 0 && displaySeconds > 0 ? 1 : secondsInMinute / 60)
    : displaySeconds > 0
    ? (secondsInMinute / 60)
    : 0.04;

  const strokeDashoffset = circumference - progressRatio * circumference;

  // Orbiting bead coordinates
  // Start from top (-90 deg / -PI/2)
  const angle = progressRatio * 2 * Math.PI - Math.PI / 2;
  const beadX = center + radius * Math.cos(angle);
  const beadY = center + radius * Math.sin(angle);

  // Dynamic Theme Colors based on State (Active, Paused, Idle)
  const dialTheme = useMemo(() => {
    if (isRunning) {
      return {
        badgeBg: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300',
        badgeText: '● EN VIVO',
        ringGradient: 'url(#stopwatchGradRunning)',
        glowFilter: 'url(#stopwatchGlowRunning)',
        ambientGlow: 'from-emerald-500/15 via-teal-500/10 to-transparent',
        beadFill: '#34D399',
        beadStroke: '#10B981',
        digitsColor: 'text-white',
        secColor: 'text-emerald-300',
        activePulse: true,
      };
    }
    if (displaySeconds > 0) {
      return {
        badgeBg: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
        badgeText: '❚❚ EN PAUSA',
        ringGradient: 'url(#stopwatchGradPaused)',
        glowFilter: 'url(#stopwatchGlowPaused)',
        ambientGlow: 'from-amber-500/15 via-orange-500/10 to-transparent',
        beadFill: '#FBBF24',
        beadStroke: '#F59E0B',
        digitsColor: 'text-slate-100',
        secColor: 'text-amber-300',
        activePulse: false,
      };
    }
    return {
      badgeBg: 'bg-indigo-500/20 border-indigo-400/30 text-indigo-300',
      badgeText: 'LISTO PARA PREDICAR',
      ringGradient: 'url(#stopwatchGradIdle)',
      glowFilter: 'none',
      ambientGlow: 'from-indigo-500/10 via-purple-500/5 to-transparent',
      beadFill: '#818CF8',
      beadStroke: '#6366F1',
      digitsColor: 'text-slate-200',
      secColor: 'text-indigo-300/80',
      activePulse: false,
    };
  }, [isRunning, displaySeconds]);

  // Modality Icons
  const ModalityIcon = useMemo(() => {
    switch (modality) {
      case 'casa_en_casa':
        return Home;
      case 'carritos':
        return Store;
      case 'revisitas':
        return Users;
      case 'estudio':
        return BookOpen;
      case 'informal':
        return Phone;
      default:
        return Compass;
    }
  }, [modality]);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/90 text-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-indigo-500/20 flex flex-col justify-between gap-5 transition-all">
      {/* Ambient Radial Glow behind the Dial */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gradient-to-tr ${dialTheme.ambientGlow} blur-3xl pointer-events-none transition-all duration-700`}
      />

      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isRunning
                  ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]'
                  : displaySeconds > 0
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                  : 'bg-slate-500'
              }`}
            />
            {isRunning && (
              <span className="absolute w-5 h-5 rounded-full bg-emerald-400/40 animate-ping pointer-events-none" />
            )}
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
            <span>
              {isRunning
                ? 'Ministerio en Vivo'
                : displaySeconds > 0
                ? 'Sesión en Pausa'
                : 'Cronómetro de Ministerio'}
            </span>
            {totalMinutes > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-indigo-300 border border-white/10">
                {totalMinutes} min
              </span>
            )}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenManualLog}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold text-indigo-100 transition cursor-pointer border border-white/10 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-300" />
          <span>Añadir Manualmente</span>
        </button>
      </div>

      {/* Central Dial Area (Inspired by AutoLock Clock & Swiss Chronometer) */}
      <div className="flex flex-col items-center justify-center relative py-2 sm:py-3 z-10">
        <div className="relative flex items-center justify-center select-none">
          {/* SVG Progress Ring */}
          <svg
            width={size}
            height={size}
            className="overflow-visible"
            viewBox={`0 0 ${size} ${size}`}
          >
            <defs>
              {/* Gradient Running (Emerald to Cyan) */}
              <linearGradient id="stopwatchGradRunning" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="60%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>

              {/* Gradient Paused (Amber to Orange) */}
              <linearGradient id="stopwatchGradPaused" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>

              {/* Gradient Idle (Indigo to Violet) */}
              <linearGradient id="stopwatchGradIdle" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>

              {/* Glow Filter Running */}
              <filter id="stopwatchGlowRunning" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Glow Filter Paused */}
              <filter id="stopwatchGlowPaused" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Subtle Circular Degree Ticks (Precision Watch Markings) */}
            {Array.from({ length: 60 }).map((_, i) => {
              const tickAngle = (i * 6 * Math.PI) / 180 - Math.PI / 2;
              const isMajor = i % 5 === 0;
              const tickInner = isMajor ? radius - 14 : radius - 10;
              const tickOuter = radius - 6;
              const x1 = center + tickInner * Math.cos(tickAngle);
              const y1 = center + tickInner * Math.sin(tickAngle);
              const x2 = center + tickOuter * Math.cos(tickAngle);
              const y2 = center + tickOuter * Math.sin(tickAngle);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isMajor ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)'}
                  strokeWidth={isMajor ? 1.5 : 1}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Background Track Circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
            />

            {/* Active Sweeping Progress Ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={dialTheme.ringGradient}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              filter={dialTheme.glowFilter}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
                transition: isRunning ? 'stroke-dashoffset 0.95s linear' : 'stroke-dashoffset 0.4s ease',
              }}
            />

            {/* Orbiting Glowing Bead at the tip of the arc */}
            {displaySeconds > 0 && (
              <g
                style={{
                  transition: isRunning ? 'all 0.95s linear' : 'all 0.4s ease',
                }}
              >
                {/* Bead outer glow */}
                <circle
                  cx={beadX}
                  cy={beadY}
                  r={8}
                  fill={dialTheme.beadFill}
                  opacity={0.35}
                />
                {/* Bead core */}
                <circle
                  cx={beadX}
                  cy={beadY}
                  r={4.5}
                  fill="#FFFFFF"
                  stroke={dialTheme.beadStroke}
                  strokeWidth={2}
                />
              </g>
            )}
          </svg>

          {/* Dial Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            {/* Live State Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${dialTheme.badgeBg}`}
            >
              <span>{dialTheme.badgeText}</span>
            </div>

            {/* Big Chronometer Digits */}
            <div className="mt-2.5 flex items-baseline justify-center font-mono font-black tracking-tight text-4xl sm:text-5xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              <span className="tabular-nums">{hrs}</span>
              <span className="text-indigo-400 mx-0.5 text-3xl sm:text-4xl animate-pulse">:</span>
              <span className="tabular-nums">{mins}</span>
              <span className="text-indigo-400 mx-0.5 text-2xl sm:text-3xl">:</span>
              <span className={`text-2xl sm:text-3xl font-extrabold tabular-nums ${dialTheme.secColor}`}>
                {secs}
              </span>
            </div>

            {/* Segment Labels */}
            <div className="flex items-center justify-center gap-6 text-[9px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
              <span>HRS</span>
              <span className="ml-1">MIN</span>
              <span className="ml-1">SEG</span>
            </div>

            {/* Active Modality Capsule inside dial */}
            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-extrabold text-indigo-200">
              <ModalityIcon className="w-3 h-3 text-indigo-300" />
              <span className="max-w-[130px] truncate">{modalityLabels[modality]}</span>
            </div>
          </div>
        </div>

        {/* Subtitle notice */}
        <p className="text-[11px] text-indigo-200/80 mt-2 text-center flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>El tiempo corre en segundo plano aunque cierres o bloquees tu pantalla</span>
        </p>
      </div>

      {/* Quick Time Adjustment Buttons (Micro-Pill Bar) */}
      <div className="flex items-center justify-center gap-2 flex-wrap relative z-10">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
          Ajustar:
        </span>
        <button
          type="button"
          onClick={() => onAdjustMinutes(-5)}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 active:scale-95 text-xs font-mono font-bold text-slate-300 hover:text-rose-200 border border-white/10 transition-all cursor-pointer shadow-2xs"
          title="Restar 5 minutos"
        >
          -5m
        </button>
        <button
          type="button"
          onClick={() => onAdjustMinutes(15)}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/20 active:scale-95 text-xs font-mono font-bold text-emerald-300 border border-white/10 transition-all cursor-pointer shadow-2xs"
          title="Sumar 15 minutos"
        >
          +15m
        </button>
        <button
          type="button"
          onClick={() => onAdjustMinutes(30)}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/20 active:scale-95 text-xs font-mono font-bold text-emerald-300 border border-white/10 transition-all cursor-pointer shadow-2xs"
          title="Sumar 30 minutos"
        >
          +30m
        </button>
        <button
          type="button"
          onClick={() => onAdjustMinutes(60)}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/20 active:scale-95 text-xs font-mono font-bold text-emerald-300 border border-white/10 transition-all cursor-pointer shadow-2xs"
          title="Sumar 1 hora"
        >
          +1h
        </button>
      </div>

      {/* Modality & Session Counters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10 relative z-10 backdrop-blur-xs">
        {/* Modality Selector */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block mb-1 flex items-center gap-1">
            <Compass className="w-3 h-3" />
            <span>Modalidad</span>
          </label>
          <select
            value={modality}
            onChange={(e) => onUpdateModality(e.target.value as MinistryTimeLog['modality'])}
            className="w-full rounded-xl bg-slate-900/90 border border-white/15 px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
          >
            {Object.entries(modalityLabels).map(([k, label]) => (
              <option key={k} value={k} className="bg-slate-900 text-white">
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Revisitas Counter */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block mb-1 flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>Revisitas en Salida</span>
          </label>
          <div className="flex items-center justify-between bg-slate-900/80 rounded-xl px-2.5 py-1.5 border border-white/15">
            <button
              type="button"
              onClick={() => onUpdateReturnVisits((prev) => Math.max(0, prev - 1))}
              className="p-1 text-slate-400 hover:text-white active:scale-90 transition cursor-pointer"
              title="Restar revisita"
            >
              <MinusCircle className="w-4 h-4" />
            </button>
            <span className="font-mono font-black text-sm text-white px-2">
              {sessionReturnVisits}
            </span>
            <button
              type="button"
              onClick={() => onUpdateReturnVisits((prev) => prev + 1)}
              className="p-1 text-emerald-400 hover:text-emerald-300 active:scale-90 transition cursor-pointer"
              title="Sumar revisita"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Publicaciones / Videos Counter */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block mb-1 flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>Publicaciones / Videos</span>
          </label>
          <div className="flex items-center justify-between bg-slate-900/80 rounded-xl px-2.5 py-1.5 border border-white/15">
            <button
              type="button"
              onClick={() => onUpdatePlacements((prev) => Math.max(0, prev - 1))}
              className="p-1 text-slate-400 hover:text-white active:scale-90 transition cursor-pointer"
              title="Restar publicación"
            >
              <MinusCircle className="w-4 h-4" />
            </button>
            <span className="font-mono font-black text-sm text-white px-2">
              {sessionPlacements}
            </span>
            <button
              type="button"
              onClick={() => onUpdatePlacements((prev) => prev + 1)}
              className="p-1 text-emerald-400 hover:text-emerald-300 active:scale-90 transition cursor-pointer"
              title="Sumar publicación"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap relative z-10">
        <button
          type="button"
          onClick={onStartPause}
          className={`flex-1 py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-95 border ${
            isRunning
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 text-slate-950 border-amber-300/60 shadow-amber-500/25'
              : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:brightness-105 text-slate-950 border-emerald-300/60 shadow-emerald-500/25'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Pausar Tiempo</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>{displaySeconds > 0 ? 'Reanudar Predicación' : 'Iniciar Predicación'}</span>
            </>
          )}
        </button>

        {displaySeconds > 0 && (
          <>
            <button
              type="button"
              onClick={onFinish}
              className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:brightness-110 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl border border-indigo-400/40 transition-all cursor-pointer active:scale-95 shadow-indigo-500/20"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Guardar Sesión</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-rose-500/30 text-slate-300 hover:text-rose-200 border border-white/10 transition-all cursor-pointer active:scale-90"
              title="Reiniciar a cero"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
