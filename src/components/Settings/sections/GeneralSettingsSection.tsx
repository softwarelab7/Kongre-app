// src/components/Settings/sections/GeneralSettingsSection.tsx
import React from 'react';
import { Calendar, Save } from 'lucide-react';
import { Select } from '../../Select';
import { IosTimePicker } from '../../IosTimePicker';

export interface GeneralSettingsSectionProps {
  congName: string;
  setCongName: (name: string) => void;
  hallAddress: string;
  setHallAddress: (address: string) => void;
  midDay: string;
  setMidDay: (day: string) => void;
  midTime: string;
  setMidTime: (time: string) => void;
  fdsDay: string;
  setFdsDay: (day: string) => void;
  fdsTime: string;
  setFdsTime: (time: string) => void;
  onUserEdit: () => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export const GeneralSettingsSection: React.FC<GeneralSettingsSectionProps> = ({
  congName,
  setCongName,
  hallAddress,
  setHallAddress,
  midDay,
  setMidDay,
  midTime,
  setMidTime,
  fdsDay,
  setFdsDay,
  fdsTime,
  setFdsTime,
  onUserEdit,
  onSave,
  isSaving,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Información y Horarios de Reunión
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Parámetros oficiales del Salón del Reino y agenda semanal
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Nombre de la Congregación
          </label>
          <input
            type="text"
            required
            value={congName}
            onChange={(e) => {
              setCongName(e.target.value);
              onUserEdit();
            }}
            placeholder="Ej. Congregación Central"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold"
          />
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Este nombre oficial es el que se mostrará en el banner superior, programas y hojas S-89.
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Dirección del Salón del Reino
          </label>
          <input
            type="text"
            value={hallAddress}
            onChange={(e) => {
              setHallAddress(e.target.value);
              onUserEdit();
            }}
            placeholder="Ej. Av. Las Palmeras 450"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* Reunión Entre Semana */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Día Entre Semana
            </label>
            <Select
              value={midDay}
              onChange={(val: string) => {
                setMidDay(val);
                onUserEdit();
              }}
              options={[
                { value: 'Lunes', label: 'Lunes' },
                { value: 'Martes', label: 'Martes' },
                { value: 'Miércoles', label: 'Miércoles' },
                { value: 'Jueves', label: 'Jueves' },
                { value: 'Viernes', label: 'Viernes' },
              ]}
              placeholder="Selecciona un día..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Hora de Inicio
            </label>
            <IosTimePicker
              value={midTime}
              onChange={(val: string) => {
                setMidTime(val);
                onUserEdit();
              }}
              placeholder="Hora (ej. 19:00)"
              accentColor="indigo"
              presets={['18:30', '19:00', '19:30', '20:00']}
            />
          </div>
        </div>

        {/* Reunión Fin de Semana */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Día Fin de Semana
            </label>
            <Select
              value={fdsDay}
              onChange={(val: string) => {
                setFdsDay(val);
                onUserEdit();
              }}
              options={[
                { value: 'Sábado', label: 'Sábado' },
                { value: 'Domingo', label: 'Domingo' },
              ]}
              placeholder="Selecciona un día..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Hora de Inicio
            </label>
            <IosTimePicker
              value={fdsTime}
              onChange={(val: string) => {
                setFdsTime(val);
                onUserEdit();
              }}
              placeholder="Hora (ej. 10:00)"
              accentColor="emerald"
              presets={['09:00', '09:30', '10:00', '16:00', '17:00']}
            />
          </div>
        </div>
      </div>

      {/* Botón de Guardado dentro del contenedor */}
      <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onSave()}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Guardando...' : 'Guardar Horarios'}</span>
        </button>
      </div>
    </div>
  );
};
