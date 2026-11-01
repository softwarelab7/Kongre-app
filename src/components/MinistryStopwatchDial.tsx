// src/components/MinistryStopwatchDial.tsx
import React, { useMemo } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Plus,
  Minus,
  Timer,
  Home,
  MapPin,
  Users,
  PhoneCall,
  BookOpen,
  UserCheck,
  FileText,
  ShieldCheck,
  CalendarPlus,
  Sparkles,
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
  startedAt?: number | null;
  sessionNotes?: string;
  onUpdateSessionNotes?: (notes: string) => void;
  loggedMinutesThisMonth?: number;
  monthlyHours?: number;
  hourGoal?: number;
  onUpdateModality?: (mod: MinistryTimeLog['modality']) => void;
  onChangeModality?: (mod: MinistryTimeLog['modality']) => void;
  onOpenManualLog?: () => void;
  onOpenManualModal?: () => void;
  modalityLabels?: Record<string, string>;
}

interface ModalityOption {
  key: MinistryTimeLog['modality'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MODALITY_OPTIONS: ModalityOption[] = [
  { key: 'casa_en_casa', label: 'De casa en casa', icon: Home },
  { key: 'carritos', label: 'Carritos / Público', icon: MapPin },
  { key: 'revisitas', label: 'Revisitas', icon: UserCheck },
  { key: 'estudio', label: 'Curso bíblico', icon: BookOpen },
  { key: 'informal', label: 'Informal / Cartas', icon: Users },
];

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
  onChangeModality,
  onOpenManualLog,
  onOpenManualModal,
  modalityLabels,
}) => {
  const handleModalityChange = (mod: MinistryTimeLog['modality']) => {
    if (onUpdateModality) onUpdateModality(mod);
    else if (onChangeModality) onChangeModality(mod);
  };

  const handleOpenManual = onOpenManualLog || onOpenManualModal;

  // Desglose numérico del tiempo
  const { hours, minutes, seconds } = useMemo(() => {
    const total = Math.max(0, Math.floor(displaySeconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return {
      hours: h.toString().padStart(2, '0'),
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0'),
    };
  }, [displaySeconds]);

  // Progreso dentro de la hora actual (0 a 100%)
  const hourProgress = useMemo(() => {
    if (displaySeconds <= 0) return 0;
    const rem = displaySeconds % 3600;
    return Math.round(((rem === 0 ? 3600 : rem) / 3600) * 100);
  }, [displaySeconds]);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl kg-glass-surface kg-sheen-top transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between gap-3.5 sm:gap-4 h-full shadow-lg ${
        isRunning
          ? 'border-emerald-500/60 dark:border-emerald-500/50 shadow-emerald-500/10 ring-2 ring-emerald-500/25'
          : displaySeconds > 0
          ? 'border-amber-500/60 dark:border-amber-500/50 shadow-amber-500/10 ring-2 ring-amber-500/25'
          : 'border-zinc-200/80 dark:border-white/[0.08]'
      }`}
    >
      {/* =========================================================================
          1. CABECERA COMPACTA: ESTADO + BOTÓN MANUAL
         ========================================================================= */}
      <div className="relative z-10 flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-100 dark:border-white/[0.08]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              isRunning
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : displaySeconds > 0
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-[#A1A1AA] border border-zinc-200 dark:border-white/[0.08]'
            }`}
          >
            <Timer className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-extrabold tracking-wide uppercase text-zinc-900 dark:text-[#F4F4F5] truncate">
              Cronómetro
            </span>
            {isRunning ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60 shrink-0 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                EN VIVO
              </span>
            ) : displaySeconds > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60 shrink-0 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                PAUSADO
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 dark:text-[#A1A1AA] border border-zinc-200/80 dark:border-white/[0.08] shrink-0">
                LISTO
              </span>
            )}
          </div>
        </div>

        {handleOpenManual && (
          <button
            type="button"
            onClick={handleOpenManual}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-zinc-700 dark:text-[#F4F4F5] font-bold text-[11px] transition-all cursor-pointer active:scale-95 border border-zinc-200 dark:border-white/[0.08] shrink-0 whitespace-nowrap"
            title="Añadir horas de predicación de forma manual"
          >
            <CalendarPlus className="w-3 h-3 text-indigo-500 shrink-0" />
            <span>+ Manual</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          2. SELECTOR DE MODALIDAD EN TIRA HORIZONTAL COMPACTA (SIN SALTOS DE LÍNEA)
         ========================================================================= */}
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-0.5 px-0.5">
          {MODALITY_OPTIONS.map((item) => {
            const isSelected = modality === item.key;
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleModalityChange(item.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/25 ring-1 ring-indigo-500/30'
                    : 'bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-zinc-600 dark:text-[#A1A1AA] border-zinc-200/80 dark:border-white/[0.08]'
                }`}
              >
                <Icon className={`w-3 h-3 shrink-0 ${isSelected ? 'text-white' : 'text-zinc-400 dark:text-[#A1A1AA]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          3. HERO DIGITAL COMPACTO: RELOJ Y AJUSTES
         ========================================================================= */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="relative px-5 py-3 rounded-2xl bg-zinc-100/70 dark:bg-black/40 border border-zinc-200/80 dark:border-white/[0.08] w-full flex flex-col items-center backdrop-blur-md shadow-inner">
          <span className="text-[10px] font-extrabold tracking-widest text-zinc-500 dark:text-[#A1A1AA] uppercase">
            {isRunning ? 'Tiempo Transcurrido' : displaySeconds > 0 ? 'Sesión en Pausa' : 'Tiempo Listo'}
          </span>

          {/* DÍGITOS DIGITALES COMPACTOS */}
          <div className="flex items-baseline justify-center font-mono font-black tabular-nums tracking-tight my-1">
            <span className="text-4xl sm:text-5xl text-zinc-900 dark:text-white drop-shadow-xs">
              {hours}
            </span>
            <span
              className={`text-2xl sm:text-3xl mx-1 transition-opacity ${
                isRunning ? 'animate-pulse text-emerald-500' : 'text-zinc-300 dark:text-zinc-700'
              }`}
            >
              :
            </span>
            <span className="text-4xl sm:text-5xl text-zinc-900 dark:text-white drop-shadow-xs">
              {minutes}
            </span>
            <span
              className={`text-2xl sm:text-3xl mx-1 transition-opacity ${
                isRunning ? 'animate-pulse text-emerald-500' : 'text-zinc-300 dark:text-zinc-700'
              }`}
            >
              :
            </span>
            <span
              className={`text-4xl sm:text-5xl transition-colors drop-shadow-xs ${
                isRunning
                  ? 'text-emerald-600 dark:text-emerald-400 font-black'
                  : displaySeconds > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-400 dark:text-[#71717A]'
              }`}
            >
              {seconds}
            </span>
          </div>

          {/* Barra de progreso de la hora */}
          <div className="w-full max-w-[180px] mt-1.5 flex flex-col items-center gap-1">
            <div className="w-full h-1 bg-zinc-200/80 dark:bg-[#27272A] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isRunning
                    ? 'bg-emerald-500'
                    : displaySeconds > 0
                    ? 'bg-amber-500'
                    : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
                style={{ width: `${Math.max(2, hourProgress)}%` }}
              />
            </div>
            <span className="text-[9px] font-semibold text-zinc-400 dark:text-[#A1A1AA] font-mono tabular-nums">
              {displaySeconds > 0 ? `${hourProgress}% de la hora` : '00:00:00'}
            </span>
          </div>

          {/* Píldoras de ajuste de tiempo */}
          <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
            <button
              type="button"
              onClick={() => onAdjustMinutes(-5)}
              disabled={displaySeconds <= 0}
              className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold font-mono tabular-nums bg-white dark:bg-[#121216] text-zinc-600 dark:text-[#A1A1AA] hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-[#27272A] hover:border-rose-300 dark:hover:border-rose-800 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Restar 5 minutos"
            >
              -5m
            </button>
            <button
              type="button"
              onClick={() => onAdjustMinutes(15)}
              className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold font-mono tabular-nums bg-white dark:bg-[#121216] text-zinc-700 dark:text-[#F4F4F5] hover:text-emerald-600 dark:hover:text-emerald-400 border border-zinc-200 dark:border-[#27272A] hover:border-emerald-300 dark:hover:border-emerald-800 transition-all active:scale-95 cursor-pointer"
              title="Sumar 15 minutos"
            >
              +15m
            </button>
            <button
              type="button"
              onClick={() => onAdjustMinutes(30)}
              className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold font-mono tabular-nums bg-white dark:bg-[#121216] text-zinc-700 dark:text-[#F4F4F5] hover:text-emerald-600 dark:hover:text-emerald-400 border border-zinc-200 dark:border-[#27272A] hover:border-emerald-300 dark:hover:border-emerald-800 transition-all active:scale-95 cursor-pointer"
              title="Sumar 30 minutos"
            >
              +30m
            </button>
            <button
              type="button"
              onClick={() => onAdjustMinutes(60)}
              className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold font-mono tabular-nums bg-white dark:bg-[#121216] text-zinc-700 dark:text-[#F4F4F5] hover:text-indigo-600 dark:hover:text-indigo-400 border border-zinc-200 dark:border-[#27272A] hover:border-indigo-300 dark:hover:border-indigo-800 transition-all active:scale-95 cursor-pointer"
              title="Sumar 1 hora"
            >
              +1h
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. CONTADORES COMPACTOS: REVISITAS Y PUBLICACIONES
         ========================================================================= */}
      <div className="relative z-10 grid grid-cols-2 gap-2.5">
        {/* Tarjeta de Revisitas */}
        <div className="rounded-2xl p-2.5 sm:p-3 bg-white/70 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/10 shadow-xs flex items-center justify-between gap-1.5 transition-all">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
            </div>
            <div className="min-w-0">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block leading-tight truncate">
                Revisitas
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums leading-none">
                {sessionReturnVisits}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onUpdateReturnVisits((prev) => Math.max(0, prev - 1))}
              disabled={sessionReturnVisits <= 0}
              className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-200 border border-zinc-200/60 dark:border-white/10 flex items-center justify-center transition-all active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Restar una revisita"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateReturnVisits((prev) => prev + 1)}
              className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              aria-label="Añadir una revisita"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Tarjeta de Publicaciones */}
        <div className="rounded-2xl p-2.5 sm:p-3 bg-white/70 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/10 shadow-xs flex items-center justify-between gap-1.5 transition-all">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5 shrink-0" />
            </div>
            <div className="min-w-0">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block leading-tight truncate">
                Publicac.
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums leading-none">
                {sessionPlacements}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onUpdatePlacements((prev) => Math.max(0, prev - 1))}
              disabled={sessionPlacements <= 0}
              className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-200 border border-zinc-200/60 dark:border-white/10 flex items-center justify-center transition-all active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Restar una publicación"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onUpdatePlacements((prev) => prev + 1)}
              className="w-7 h-7 rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-xs flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              aria-label="Añadir una publicación"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. BOTÓN DE ACCIÓN COMPACTO DE ANCHO COMPLETO
         ========================================================================= */}
      <div className="relative z-10">
        {!isRunning && displaySeconds === 0 ? (
          <button
            type="button"
            onClick={onStartPause}
            className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 border border-white/20 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98] group/btn kg-sheen-top"
          >
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5 text-white" />
            </div>
            <span className="tracking-wide">Iniciar Predicación</span>
          </button>
        ) : isRunning ? (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onStartPause}
              className="py-3 px-3 rounded-2xl font-bold text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 backdrop-blur-xs"
            >
              <Pause className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span>Pausar</span>
            </button>

            <button
              type="button"
              onClick={onFinish}
              className="py-3 px-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-500/20 border border-white/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 kg-sheen-top"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Finalizar</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-2">
            <button
              type="button"
              onClick={onStartPause}
              className="col-span-5 py-3 px-3 rounded-2xl font-bold text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 backdrop-blur-xs"
            >
              <Play className="w-3.5 h-3.5 text-emerald-500 fill-current ml-0.5" />
              <span>Reanudar</span>
            </button>

            <button
              type="button"
              onClick={onFinish}
              className="col-span-5 py-3 px-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 border border-white/10 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 kg-sheen-top"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Guardar</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="col-span-2 py-3 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-zinc-100/80 dark:bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
              title="Reiniciar cronómetro"
              aria-label="Reiniciar cronómetro"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          6. PIE DISCRETO DE PERSISTENCIA
         ========================================================================= */}
      <div className="relative z-10 pt-2 border-t border-zinc-100 dark:border-[#27272A]/80 flex items-center justify-between gap-2 text-[10px] text-zinc-400 dark:text-[#71717A]">
        <div className="flex items-center gap-1 min-w-0">
          <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
          <span className="truncate">
            Continúa activo aunque apagues la pantalla o salgas
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[9.5px] text-zinc-400 shrink-0">
          <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
          Auto-guardado
        </span>
      </div>
    </div>
  );
};
