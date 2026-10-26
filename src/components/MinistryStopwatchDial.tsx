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
      className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-300 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between gap-3 sm:gap-3.5 h-full ${
        isRunning
          ? 'border-emerald-500/40 dark:border-emerald-500/30 shadow-emerald-500/10 dark:shadow-emerald-950/40 ring-1 ring-emerald-500/20'
          : displaySeconds > 0
          ? 'border-amber-500/40 dark:border-amber-500/30 shadow-amber-500/10'
          : 'border-slate-200/90 dark:border-slate-800 shadow-slate-200/40 dark:shadow-slate-950/40'
      }`}
    >
      {/* Resplandor ambiental de fondo cuando está activo */}
      {isRunning && (
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
      )}
      {!isRunning && displaySeconds > 0 && (
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl" />
      )}

      {/* =========================================================================
          1. CABECERA COMPACTA: ESTADO + BOTÓN MANUAL
         ========================================================================= */}
      <div className="relative z-10 flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              isRunning
                ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30'
                : displaySeconds > 0
                ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Timer className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-black tracking-wider uppercase text-slate-800 dark:text-slate-200 truncate">
                Cronómetro de Predicación
              </span>
              {isRunning ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  EN VIVO
                </span>
              ) : displaySeconds > 0 ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  PAUSADO
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                  LISTO
                </span>
              )}
            </div>
          </div>
        </div>

        {handleOpenManual && (
          <button
            type="button"
            onClick={handleOpenManual}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-all cursor-pointer active:scale-95 shadow-2xs border border-slate-200/60 dark:border-slate-700/60 shrink-0"
            title="Añadir horas de predicación de forma manual"
          >
            <CalendarPlus className="w-3 h-3 text-indigo-500" />
            <span>Manual</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          2. SELECTOR DE MODALIDAD EN PÍLDORAS COMPACTAS
         ========================================================================= */}
      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-1.5">
          {MODALITY_OPTIONS.map((item) => {
            const isSelected = modality === item.key;
            const Icon = item.icon;
            const displayLabel = modalityLabels?.[item.key] || item.label;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleModalityChange(item.key)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xs shadow-indigo-600/25 ring-1 ring-indigo-500/30'
                    : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <Icon className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{displayLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          3. HERO DIGITAL COMPACTO: RELOJ Y AJUSTES
         ========================================================================= */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="relative px-4 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/90 shadow-inner w-full flex flex-col items-center">
          <span className="text-[9px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
            {isRunning ? 'Tiempo Transcurrido' : displaySeconds > 0 ? 'Sesión en Pausa' : 'Tiempo Listo'}
          </span>

          {/* DÍGITOS DIGITALES COMPACTOS */}
          <div className="flex items-baseline justify-center font-mono font-black tabular-nums tracking-tight my-0.5">
            <span className="text-3xl sm:text-4xl text-slate-900 dark:text-white">
              {hours}
            </span>
            <span
              className={`text-2xl sm:text-3xl mx-0.5 transition-opacity ${
                isRunning ? 'animate-pulse text-emerald-500' : 'text-slate-300 dark:text-slate-700'
              }`}
            >
              :
            </span>
            <span className="text-3xl sm:text-4xl text-slate-900 dark:text-white">
              {minutes}
            </span>
            <span
              className={`text-2xl sm:text-3xl mx-0.5 transition-opacity ${
                isRunning ? 'animate-pulse text-emerald-500' : 'text-slate-300 dark:text-slate-700'
              }`}
            >
              :
            </span>
            <span
              className={`text-3xl sm:text-4xl transition-colors ${
                isRunning
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : displaySeconds > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              {seconds}
            </span>
          </div>

          {/* Barra de progreso de la hora */}
          <div className="w-full max-w-[180px] mt-1.5 flex flex-col items-center gap-1">
            <div className="w-full h-1 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isRunning
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : displaySeconds > 0
                    ? 'bg-amber-500'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
                style={{ width: `${Math.max(2, hourProgress)}%` }}
              />
            </div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono">
              {displaySeconds > 0 ? `${hourProgress}% de la hora` : '00:00:00'}
            </span>
          </div>

          {/* Píldoras de ajuste de tiempo */}
          <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
            <button
              type="button"
              onClick={() => onAdjustMinutes(-5)}
              disabled={displaySeconds <= 0}
              className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 transition-all shadow-2xs active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Restar 5 minutos"
            >
              -5m
            </button>
            <button
              type="button"
              onClick={() => onAdjustMinutes(15)}
              className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Sumar 15 minutos"
            >
              +15m
            </button>
            <button
              type="button"
              onClick={() => onAdjustMinutes(30)}
              className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Sumar 30 minutos"
            >
              +30m
            </button>
            <button
              type="button"
              onClick={() => onAdjustMinutes(60)}
              className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all shadow-2xs active:scale-95 cursor-pointer"
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
        <div className="rounded-xl p-2 sm:p-2.5 bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block leading-tight truncate">
                Revisitas
              </span>
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
                {sessionReturnVisits}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onUpdateReturnVisits((prev) => Math.max(0, prev - 1))}
              disabled={sessionReturnVisits <= 0}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center justify-center transition-all active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              aria-label="Restar una revisita"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateReturnVisits((prev) => prev + 1)}
              className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-xs shadow-blue-600/30"
              aria-label="Añadir una revisita"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Tarjeta de Publicaciones */}
        <div className="rounded-xl p-2 sm:p-2.5 bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <FileText className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block leading-tight truncate">
                Publicac.
              </span>
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
                {sessionPlacements}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onUpdatePlacements((prev) => Math.max(0, prev - 1))}
              disabled={sessionPlacements <= 0}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center justify-center transition-all active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              aria-label="Restar una publicación"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onUpdatePlacements((prev) => prev + 1)}
              className="w-7 h-7 rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-xs shadow-purple-600/30"
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
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-500 shadow-md shadow-emerald-600/25 dark:shadow-emerald-950/40 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] group/btn"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
              <Play className="w-3 h-3 fill-current ml-0.5" />
            </div>
            <span>Iniciar Predicación</span>
          </button>
        ) : isRunning ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onStartPause}
              className="py-2.5 px-3 rounded-xl font-black text-xs text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-xs shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pausar</span>
            </button>

            <button
              type="button"
              onClick={onFinish}
              className="py-2.5 px-3 rounded-xl font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xs shadow-emerald-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
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
              className="col-span-5 py-2.5 px-3 rounded-xl font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xs shadow-emerald-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              <span>Reanudar</span>
            </button>

            <button
              type="button"
              onClick={onFinish}
              className="col-span-5 py-2.5 px-3 rounded-xl font-black text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xs shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Guardar</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="col-span-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 transition-all cursor-pointer active:scale-95 shadow-2xs flex items-center justify-center"
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
      <div className="relative z-10 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-[10px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1 min-w-0">
          <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
          <span className="truncate">
            Continúa activo aunque apagues la pantalla o salgas
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[9.5px] text-slate-400 shrink-0">
          <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
          Auto-guardado
        </span>
      </div>
    </div>
  );
};
