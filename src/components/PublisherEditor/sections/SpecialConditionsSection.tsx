// src/components/PublisherEditor/sections/SpecialConditionsSection.tsx
import React from 'react';
import { Publisher } from '../../../types';
import { PremiumDatePicker } from '../../PremiumDatePicker';
import {
  Activity,
  User,
  Ear,
  Eye,
  Lock,
  Home,
  Baby,
  Truck,
  Video,
  Accessibility,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react';

interface SpecialConditionsSectionProps {
  formData: Publisher;
  handleChange: (field: keyof Publisher, value: any) => void;
}

export const SpecialConditionsSection: React.FC<SpecialConditionsSectionProps> = ({
  formData,
  handleChange,
}) => {
  const conditions = [
    {
      id: 'is_elderly',
      label: 'Edad Avanzada',
      desc: 'Atención pastoral y transporte',
      icon: <User size={15} />,
      activeStyle: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/60',
    },
    {
      id: 'is_infirm',
      label: 'Enfermo / Delicado',
      desc: 'Limitación física o convalecencia',
      icon: <Activity size={15} />,
      activeStyle: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/60',
    },
    {
      id: 'is_deaf',
      label: 'Sordo / Hipoacusia',
      desc: 'Lengua de señas o apoyo auditivo',
      icon: <Ear size={15} />,
      activeStyle: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-400/60',
    },
    {
      id: 'is_blind',
      label: 'Ciego / Baja Visión',
      desc: 'Formatos accesibles o lectura',
      icon: <Eye size={15} />,
      activeStyle: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-400/60',
    },
    {
      id: 'is_imprisoned',
      label: 'Encarcelado',
      desc: 'Seguimiento especial S-21',
      icon: <Lock size={15} />,
      activeStyle: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/60',
    },
    {
      id: 'is_head_of_household',
      label: 'Cabeza de Familia',
      desc: 'Responsable de núcleo familiar',
      icon: <Home size={15} />,
      activeStyle: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-400/60',
    },
    {
      id: 'is_child',
      label: 'Niño / Menor',
      desc: 'Supervisión parental en asignaciones',
      icon: <Baby size={15} />,
      activeStyle: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-400/60',
    },
    {
      id: 'is_moved',
      label: 'Se mudó de Congregación',
      desc: 'Envío de tarjeta S-21 y carta',
      icon: <Truck size={15} />,
      activeStyle: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-400/60',
    },
  ];

  const accommodationItems = [
    {
      id: 'zoom_regular',
      label: 'Conexión frecuente por Zoom / Videoconferencia',
      desc: 'Asiste regularmente de forma remota por salud o distancia',
      icon: <Video size={16} />,
    },
    {
      id: 'special_seating',
      label: 'Requiere asiento preferencial o acceso para silla de ruedas',
      desc: 'Consideración para acomodadores en reuniones y asambleas',
      icon: <Accessibility size={16} />,
    },
  ];

  return (
    <section className="bg-white dark:bg-[#0f1623] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-zinc-200 dark:border-white/[0.06] shadow-sm space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-white/[0.04]">
        <div className="p-2.5 bg-teal-50 dark:bg-teal-500/10 rounded-2xl text-teal-600 dark:text-teal-400">
          <Activity size={20} />
        </div>
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Condiciones Especiales y Accesibilidad
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Indicadores de salud, movilidad, modalidad de asistencia y traslado congregacional
          </p>
        </div>
      </div>

      {/* Cuadrícula de Condiciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {conditions.map((item) => {
          const isSel = !!(formData as any)[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleChange(item.id as any, !isSel)}
              className={`p-3.5 rounded-2xl text-left transition-all border flex items-start gap-3 cursor-pointer ${
                isSel
                  ? `${item.activeStyle} shadow-2xs`
                  : 'bg-zinc-50/70 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-400 border-zinc-200/70 dark:border-white/[0.06] hover:border-zinc-300'
              }`}
            >
              <div className={`mt-0.5 shrink-0 ${isSel ? '' : 'text-zinc-400'}`}>{item.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{item.label}</p>
                <p className="text-[10px] opacity-75 line-clamp-1 mt-0.5">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modalidades de Asistencia y Accesibilidad */}
      <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.04] space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Modalidad de Asistencia y Acomodación en el Salón
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accommodationItems.map((acc) => {
            const isActive = !!(formData as any)[acc.id];
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleChange(acc.id as any, !isActive)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200'
                    : 'bg-zinc-50/60 dark:bg-white/[0.02] border-zinc-200/70 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-3 pr-2">
                  <div className={isActive ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-400'}>
                    {acc.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{acc.label}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{acc.desc}</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'border border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  {isActive && <CheckCircle2 size={13} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel de Seguimiento de Mudanza / Traslado (Si 'is_moved' está activo) */}
      {formData.is_moved && (
        <div className="p-5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-800 dark:text-orange-300">
            <Truck size={16} />
            <span>Seguimiento de Traslado a Otra Congregación (Secretario)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1 block">
                Congregación de Destino / Origen
              </label>
              <input
                type="text"
                value={formData.moved_congregation_name || ''}
                onChange={(e) => handleChange('moved_congregation_name', e.target.value)}
                placeholder="Ej. Congregación Central"
                className="kf-input w-full bg-white dark:bg-zinc-900 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1 block">
                Fecha de Mudanza / Traslado
              </label>
              <PremiumDatePicker
                value={formData.moved_date || ''}
                onChange={(v) => handleChange('moved_date', v)}
                allowFutureYears={true}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() =>
                  handleChange(
                    'letter_of_introduction_sent',
                    !formData.letter_of_introduction_sent
                  )
                }
                className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  formData.letter_of_introduction_sent
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/[0.08]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileCheck2 size={15} />
                  Carta de presentación y S-21 enviados
                </span>
                {formData.letter_of_introduction_sent && <CheckCircle2 size={15} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
