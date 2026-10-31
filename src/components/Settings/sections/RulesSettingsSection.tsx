// src/components/Settings/sections/RulesSettingsSection.tsx
import React from 'react';
import { ShieldAlert, Save } from 'lucide-react';
import { SplashCheckbox } from '../../SplashCheckbox';

export interface RulesSettingsSectionProps {
  allowPartAndDuty: boolean;
  setAllowPartAndDuty: (val: boolean) => void;
  allowAudioAndMics: boolean;
  setAllowAudioAndMics: (val: boolean) => void;
  allowPresAndPart: boolean;
  setAllowPresAndPart: (val: boolean) => void;
  enforceSisters: boolean;
  setEnforceSisters: (val: boolean) => void;
  maxConsecutiveDuty: number;
  setMaxConsecutiveDuty: (val: number) => void;
  maxConsecutivePart: number;
  setMaxConsecutivePart: (val: number) => void;
  warnOutlineMonths: number;
  setWarnOutlineMonths: (val: number) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export const RulesSettingsSection: React.FC<RulesSettingsSectionProps> = ({
  allowPartAndDuty,
  setAllowPartAndDuty,
  allowAudioAndMics,
  setAllowAudioAndMics,
  allowPresAndPart,
  setAllowPresAndPart,
  enforceSisters,
  setEnforceSisters,
  maxConsecutiveDuty,
  setMaxConsecutiveDuty,
  maxConsecutivePart,
  setMaxConsecutivePart,
  warnOutlineMonths,
  setWarnOutlineMonths,
  onSave,
  isSaving,
}) => {
  return (
    <div className="bg-white dark:bg-[#121216] p-6 rounded-3xl border border-zinc-200 dark:border-[#27272A] space-y-6">
      <div className="pb-3 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/50 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5]">
              Reglas de Detección de Cruces y Conflictos
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Define qué asignaciones simultáneas están prohibidas para que el sistema emita alertas en tiempo real
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        {/* Rule 1: Part + Duty clash */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100/70 dark:hover:bg-[#27272A]/40 transition-colors">
          <SplashCheckbox
            checked={allowPartAndDuty}
            onChange={(e) => setAllowPartAndDuty(e.target.checked)}
            label="Permitir que quien tenga una parte en el programa tenga también un deber"
            description="Si se desmarca (recomendado), el sistema generará un error crítico si alguien con parte en plataforma es asignado simultáneamente a Audio, Video, Micrófonos o Acomodador."
          />
        </div>

        {/* Rule 2: Audio + Mic clash */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100/70 dark:hover:bg-[#27272A]/40 transition-colors">
          <SplashCheckbox
            checked={allowAudioAndMics}
            onChange={(e) => setAllowAudioAndMics(e.target.checked)}
            label="Permitir que el operador de Audio/Video haga micrófonos al mismo tiempo"
            description="Si se desmarca, evitará que una persona que debe estar en cabina técnica sea asignada a correr micrófonos o estar en la puerta."
          />
        </div>

        {/* Rule 3: President clash */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100/70 dark:hover:bg-[#27272A]/40 transition-colors">
          <SplashCheckbox
            checked={allowPresAndPart}
            onChange={(e) => setAllowPresAndPart(e.target.checked)}
            label="Permitir que el Presidente de la reunión tenga otra parte o deber"
            description="Si se desmarca, alertará para que el presidente se enfoque exclusivamente en dirigir la reunión."
          />
        </div>

        {/* Rule 4: Sister demonstrations */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100/70 dark:hover:bg-[#27272A]/40 transition-colors">
          <SplashCheckbox
            checked={enforceSisters}
            onChange={(e) => setEnforceSisters(e.target.checked)}
            label="Exigir que la ayudante de una hermana titular sea siempre otra hermana"
            description="Alineado con las directrices de la Escuela del Ministerio Teocrático / Vida y Ministerio."
          />
        </div>

        {/* Consecutive weeks control */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-zinc-800 dark:text-[#F4F4F5] mb-1">
              Límite de semanas seguidas con deberes:
            </label>
            <select
              value={maxConsecutiveDuty}
              onChange={(e) => setMaxConsecutiveDuty(Number(e.target.value))}
              className="w-full p-2 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums cursor-pointer"
            >
              <option value={1}>1 semana (Rotación semanal estricta)</option>
              <option value={2}>2 semanas seguidas (Recomendado)</option>
              <option value={3}>3 semanas seguidas</option>
              <option value={4}>4 semanas seguidas</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-zinc-800 dark:text-[#F4F4F5] mb-1">
              Límite de semanas seguidas con partes:
            </label>
            <select
              value={maxConsecutivePart}
              onChange={(e) => setMaxConsecutivePart(Number(e.target.value))}
              className="w-full p-2 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums cursor-pointer"
            >
              <option value={1}>1 semana</option>
              <option value={2}>2 semanas seguidas (Recomendado)</option>
              <option value={3}>3 semanas seguidas</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-zinc-800 dark:text-[#F4F4F5] mb-1">
              Alerta de repetición de Bosquejos Públicos:
            </label>
            <select
              value={warnOutlineMonths}
              onChange={(e) => setWarnOutlineMonths(Number(e.target.value))}
              className="w-full p-2 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums cursor-pointer"
            >
              <option value={6}>No repetir el mismo bosquejo antes de 6 meses</option>
              <option value={9}>No repetir el mismo bosquejo antes de 9 meses</option>
              <option value={12}>No repetir antes de 12 meses (Recomendación Teocrática)</option>
              <option value={18}>No repetir antes de 18 meses</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-[#27272A]">
        <button
          type="button"
          onClick={() => onSave()}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Guardando...' : 'Guardar Reglas'}</span>
        </button>
      </div>
    </div>
  );
};
