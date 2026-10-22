// src/components/MinistryStopwatchDial.tsx
import React, { useMemo } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Plus,
  Minus,
} from 'lucide-react';
import { AutoLockRing } from './AutoLockRing';
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
  onUpdateModality?: (mod: MinistryTimeLog['modality']) => void;
  onChangeModality?: (mod: MinistryTimeLog['modality']) => void;
  onOpenManualLog?: () => void;
  onOpenManualModal?: () => void;
  modalityLabels?: Record<string, string>;
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

  // Formatear segundos en HH:MM:SS
  const formatTime = (totalSecs: number) => {
    const s = Math.max(0, Math.floor(totalSecs));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fracción circular de 0 a 1 según la hora en curso (o 0 si en reposo)
  const fraction = useMemo(() => {
    if (displaySeconds <= 0) return 0;
    const rem = displaySeconds % 3600;
    return rem === 0 ? 1 : rem / 3600;
  }, [displaySeconds]);

  // Color dinámico del anillo SVG inspirado en el reloj de bloqueo
  const ringColor = useMemo(() => {
    if (isRunning) return 'text-emerald-500 dark:text-emerald-400';
    if (displaySeconds > 0) return 'text-amber-500 dark:text-amber-400';
    return 'text-slate-300 dark:text-slate-700';
  }, [isRunning, displaySeconds]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4.5 shadow-xs transition-all flex flex-col justify-between h-full">
      {/* Cabecera superior compacta */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              isRunning
                ? 'bg-emerald-500 animate-pulse'
                : displaySeconds > 0
                ? 'bg-amber-500'
                : 'bg-slate-400 dark:bg-slate-600'
            }`}
          />
          <h3 className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 truncate">
            Cronómetro de Predicación
          </h3>
          {isRunning && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
              En Vivo
            </span>
          )}
          {!isRunning && displaySeconds > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
              En Pausa
            </span>
          )}
        </div>

        {handleOpenManual && (
          <button
            type="button"
            onClick={handleOpenManual}
            className="shrink-0 text-[10.5px] font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 rounded-full px-2.5 py-0.5 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3 h-3" />
            <span>Añadir Manual</span>
          </button>
        )}
      </div>

      {/* Disposición integrada horizontal en 2 columnas: Anillo a la izquierda y Controles a la derecha */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center my-auto">
        {/* Columna Izquierda: Anillo SVG de tamaño equilibrado + Píldoras de ajuste debajo */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center text-center">
          <AutoLockRing
            size={126}
            stroke={6}
            fraction={fraction}
            colorClass={ringColor}
            className="shrink-0"
          >
            <div className="text-[22px] sm:text-[24px] font-black tracking-tight tabular-nums font-mono text-slate-900 dark:text-white leading-none">
              {formatTime(displaySeconds)}
            </div>
            <div className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mt-1">
              {isRunning ? 'EN PREDICACIÓN' : displaySeconds > 0 ? 'EN PAUSA' : 'LISTO'}
            </div>
          </AutoLockRing>

          {/* Píldoras de ajuste rápido de tiempo */}
          <div className="flex items-center justify-center gap-1 mt-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => onAdjustMinutes(-5)}
              disabled={displaySeconds <= 0}
              className="border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 rounded-md px-2 py-0.5 text-[10.5px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            >
              -5m
            </button>
            <button
              type="button"
              onClick={() => onAdjustMinutes(15)}
              className="border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 rounded-md px-2 py-0.5 text-[10.5px] font-bold transition-all cursor-pointer shadow-2xs"
            >
              +15m
            </button>
            <button
              type="button"
              onClick={() => onAdjustMinutes(30)}
              className="border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 rounded-md px-2 py-0.5 text-[10.5px] font-bold transition-all cursor-pointer shadow-2xs"
            >
              +30m
            </button>
            <button
              type="button"
              onClick={() => onAdjustMinutes(60)}
              className="border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400 rounded-md px-2 py-0.5 text-[10.5px] font-bold transition-all cursor-pointer shadow-2xs"
            >
              +1h
            </button>
          </div>
        </div>

        {/* Columna Derecha: Modalidad, Steppers y Acciones */}
        <div className="sm:col-span-7 flex flex-col justify-between space-y-2">
          {/* Selector de Modalidad */}
          <div>
            <label className="text-[9.5px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase block mb-0.5">
              Modalidad
            </label>
            <select
              value={modality}
              onChange={(e) => handleModalityChange(e.target.value as MinistryTimeLog['modality'])}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            >
              {modalityLabels ? (
                Object.entries(modalityLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))
              ) : (
                <>
                  <option value="casa">De casa en casa</option>
                  <option value="publica">Carritos / Público</option>
                  <option value="informal">Informal / Ocasional</option>
                  <option value="telefonica">Cartas / Telefónica</option>
                  <option value="cursos">Cursos Bíblicos</option>
                </>
              )}
            </select>
          </div>

          {/* Steppers en Rejilla 2 Columnas */}
          <div className="grid grid-cols-2 gap-2">
            {/* Revisitas */}
            <div className="bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-2 py-1 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400 truncate">
                Revisitas
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateReturnVisits((prev) => Math.max(0, prev - 1))}
                  disabled={sessionReturnVisits <= 0}
                  className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-20 cursor-pointer"
                  aria-label="Menos revisitas"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums min-w-[12px] text-center">
                  {sessionReturnVisits}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateReturnVisits((prev) => prev + 1)}
                  className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                  aria-label="Más revisitas"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* Publicaciones */}
            <div className="bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-2 py-1 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400 truncate">
                Publicaciones
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdatePlacements((prev) => Math.max(0, prev - 1))}
                  disabled={sessionPlacements <= 0}
                  className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-20 cursor-pointer"
                  aria-label="Menos publicaciones"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums min-w-[12px] text-center">
                  {sessionPlacements}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdatePlacements((prev) => prev + 1)}
                  className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                  aria-label="Más publicaciones"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Botones de acción principales */}
          <div>
            {!isRunning && displaySeconds === 0 ? (
              <button
                type="button"
                onClick={onStartPause}
                className="w-full py-2 px-3 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Iniciar Predicación</span>
              </button>
            ) : isRunning ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onStartPause}
                  className="flex-1 py-2 px-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pausar</span>
                </button>
                <button
                  type="button"
                  onClick={onFinish}
                  className="flex-1 py-2 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Finalizar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onStartPause}
                  className="flex-1 py-2 px-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Reanudar</span>
                </button>
                <button
                  type="button"
                  onClick={onFinish}
                  className="flex-1 py-2 px-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Terminar</span>
                </button>
                <button
                  type="button"
                  onClick={onReset}
                  className="py-2 px-2.5 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="Reiniciar cronómetro"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reiniciar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pie sutil */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-2 text-center sm:text-left">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
          El tiempo sigue corriendo aunque cierres la pestaña o apagues la pantalla del teléfono.
        </p>
      </div>
    </div>
  );
};
