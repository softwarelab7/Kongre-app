// src/components/AutoLockSettingsCard.tsx
import React, { useState, useEffect } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { useCongregation } from '../context/CongregationContext';
import { AutoLockRing } from './AutoLockRing';
import { KeyRound } from 'lucide-react';

interface AutoLockSettingsCardProps {
  onOpenPinModal?: () => void;
}

export const AutoLockSettingsCard: React.FC<AutoLockSettingsCardProps> = ({
  onOpenPinModal,
}) => {
  const {
    autoLockMinutes,
    setAutoLockMinutes,
    isPinEnabled,
  } = useSecurity();
  const { isDemoMode } = useCongregation();

  // Guardar en memoria el último valor activo (por defecto 5 min)
  const [lastActiveMinutes, setLastActiveMinutes] = useState<number>(() => {
    return autoLockMinutes > 0 ? autoLockMinutes : 5;
  });

  useEffect(() => {
    if (autoLockMinutes > 0) {
      setLastActiveMinutes(autoLockMinutes);
    }
  }, [autoLockMinutes]);

  const isOn = autoLockMinutes > 0 && !isDemoMode;
  const currentMins = isOn ? autoLockMinutes : lastActiveMinutes;

  const handleToggleSwitch = () => {
    if (!isPinEnabled || isDemoMode) return;
    if (isOn) {
      setAutoLockMinutes(0);
    } else {
      setAutoLockMinutes(lastActiveMinutes || 5);
    }
  };

  const handleChangeMinutes = (mins: number) => {
    if (!isPinEnabled || isDemoMode) return;
    setLastActiveMinutes(mins);
    setAutoLockMinutes(mins);
  };

  const presets = [
    { m: 5, label: '5 min (recomendado)' },
    { m: 10, label: '10 min' },
    { m: 15, label: '15 min' },
  ];

  return (
    <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-4">
      {/* Fila principal con Anillo SVG, Títulos y Switch */}
      <div className="flex items-center gap-4">
        {/* Anillo de 60px con indicador de minutos */}
        <AutoLockRing
          size={60}
          stroke={5}
          fraction={isOn ? 1 : 0}
          state="ok"
          className="shrink-0"
        >
          <b className="text-lg font-black text-slate-900 dark:text-white leading-none">
            {isOn ? currentMins : '–'}
          </b>
          <small className="text-[9.5px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">
            min
          </small>
        </AutoLockRing>

        {/* Título y subtítulo explicativo */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Bloqueo automático
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            {isDemoMode
              ? 'El auto-bloqueo está desactivado temporalmente en modo demo.'
              : isOn
              ? `Se bloquea tras ${currentMins} min sin actividad.`
              : 'Desactivado: solo bloqueo manual.'}
          </p>
        </div>

        {/* Switch On/Off */}
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-label="Bloqueo automático por inactividad"
          disabled={!isPinEnabled || isDemoMode}
          onClick={handleToggleSwitch}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-40 disabled:cursor-not-allowed ${
            isOn ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              isOn ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Controles de Rango y Presets */}
      <div className={`transition-opacity duration-200 ${isOn ? '' : 'opacity-40 pointer-events-none'}`}>
        {/* Deslizador continuo de 5 a 15 min */}
        <input
          type="range"
          min={5}
          max={15}
          step={1}
          value={currentMins}
          disabled={!isOn}
          onChange={(e) => handleChangeMinutes(Number(e.target.value))}
          className="kg-range-slider"
          aria-label="Minutos de inactividad antes de bloquear"
        />

        {/* Marcas de minutos (5 a 15) */}
        <div className="flex justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums mt-1 px-1">
          {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((m) => (
            <span
              key={m}
              onClick={() => isOn && handleChangeMinutes(m)}
              className={`transition-colors cursor-pointer ${
                m === currentMins && isOn
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-110'
                  : 'hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {m}
            </span>
          ))}
        </div>

        {/* Botones de presets rápidos */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {presets.map((p) => {
            const isPresetActive = currentMins === p.m && isOn;
            return (
              <button
                key={p.m}
                type="button"
                disabled={!isOn}
                onClick={() => handleChangeMinutes(p.m)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isPresetActive
                    ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mensaje informativo si no hay PIN */}
      {!isPinEnabled && (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs">
          <span>* Requiere configurar un PIN de seguridad primero.</span>
          {onOpenPinModal && (
            <button
              type="button"
              onClick={onOpenPinModal}
              className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer shrink-0"
            >
              <KeyRound size={13} />
              <span>Configurar PIN</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
