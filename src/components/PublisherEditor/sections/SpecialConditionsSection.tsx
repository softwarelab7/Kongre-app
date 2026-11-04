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
  HeartHandshake,
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
      label: 'Edad Avanzada (65+)',
      desc: 'Atención pastoral, transporte y apoyo práctico',
      icon: <User size={16} />,
      activeStyle:
        'bg-amber-500/[0.08] text-amber-800 dark:text-amber-300 border-amber-400/70 dark:border-amber-500/50',
      badge: 'Pastoreo',
    },
    {
      id: 'is_infirm',
      label: 'Enfermo / Delicado de Salud',
      desc: 'Limitación física crónica o convalecencia',
      icon: <Activity size={16} />,
      activeStyle:
        'bg-rose-500/[0.08] text-rose-800 dark:text-rose-300 border-rose-400/70 dark:border-rose-500/50',
      badge: 'Salud',
    },
    {
      id: 'is_deaf',
      label: 'Sordo / Hipoacusia',
      desc: 'Lengua de señas o apoyo auditivo en el Salón',
      icon: <Ear size={16} />,
      activeStyle:
        'bg-cyan-500/[0.08] text-cyan-800 dark:text-cyan-300 border-cyan-400/70 dark:border-cyan-500/50',
      badge: 'Accesibilidad',
    },
    {
      id: 'is_blind',
      label: 'Ciego / Baja Visión',
      desc: 'Formatos accesibles, Braille o letra grande',
      icon: <Eye size={16} />,
      activeStyle:
        'bg-sky-500/[0.08] text-sky-800 dark:text-sky-300 border-sky-400/70 dark:border-sky-500/50',
      badge: 'Accesibilidad',
    },
    {
      id: 'is_imprisoned',
      label: 'Encarcelado',
      desc: 'Seguimiento especial de informe S-21',
      icon: <Lock size={16} />,
      activeStyle:
        'bg-red-500/[0.08] text-red-800 dark:text-red-300 border-red-400/70 dark:border-red-500/50',
      badge: 'S-21',
    },
    {
      id: 'is_head_of_household',
      label: 'Cabeza de Familia',
      desc: 'Responsable principal del núcleo familiar',
      icon: <Home size={16} />,
      activeStyle:
        'bg-indigo-500/[0.08] text-indigo-800 dark:text-indigo-300 border-indigo-400/70 dark:border-indigo-500/50',
      badge: 'Familia',
    },
    {
      id: 'is_child',
      label: 'Niño / Menor de Edad',
      desc: 'Supervisión parental en asignaciones y campo',
      icon: <Baby size={16} />,
      activeStyle:
        'bg-pink-500/[0.08] text-pink-800 dark:text-pink-300 border-pink-400/70 dark:border-pink-500/50',
      badge: 'Menor',
    },
    {
      id: 'is_moved',
      label: 'Se Mudó de Congregación',
      desc: 'Trámite de envío de tarjeta S-21 y carta',
      icon: <Truck size={16} />,
      activeStyle:
        'bg-orange-500/[0.08] text-orange-800 dark:text-orange-300 border-orange-400/70 dark:border-orange-500/50',
      badge: 'Traslado',
    },
  ];

  const accommodationItems = [
    {
      id: 'zoom_regular',
      label: 'Conexión Frecuente por Videoconferencia (Zoom)',
      desc: 'Asiste regularmente de forma remota por motivos de salud, edad avanzada o distancia',
      icon: <Video size={18} />,
    },
    {
      id: 'special_seating',
      label: 'Requiere Asiento Preferencial o Espacio para Silla de Ruedas',
      desc: 'Consideración prioritaria para los acomodadores en reuniones semanales y asambleas',
      icon: <Accessibility size={18} />,
    },
  ];

  const activeConditionsCount = conditions.filter((c) => !!(formData as any)[c.id]).length;
  const activeAccommodationsCount = accommodationItems.filter(
    (a) => !!(formData as any)[a.id]
  ).length;

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* BLOQUE 1: CABECERA EJECUTIVA + CINTA DE KPIs DE CONDICIONES           */}
      {/* ===================================================================== */}
      <section className="kg-card-bento kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 rounded-3xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-xs">
        <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm kg-glow-badge">
              <HeartHandshake size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-500/20">
                  09 · Accesibilidad y Cuidado
                </span>
                <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
                  Condiciones Especiales, Accesibilidad y Traslados
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Indicadores de salud, movilidad en el Salón del Reino, modalidad de asistencia y control de mudanzas
              </p>
            </div>
          </div>
        </div>

        {/* CINTA DE 4 INDICADORES (KPI STRIP) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 dark:divide-white/[0.05] bg-zinc-50/60 dark:bg-white/[0.01]">
          <div className="p-4 md:px-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Indicadores Activos
            </p>
            <p className="text-xl font-black font-mono tabular-nums text-zinc-900 dark:text-white mt-1">
              {activeConditionsCount}{' '}
              <span className="text-xs font-semibold text-zinc-400">/ {conditions.length}</span>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {activeConditionsCount === 0 ? 'Sin condiciones especiales' : 'Registrados en ficha'}
            </p>
          </div>

          <div className="p-4 md:px-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Modalidad de Asistencia
            </p>
            <p className="text-base font-black text-teal-600 dark:text-teal-400 mt-1 truncate">
              {(formData as any).zoom_regular ? 'Zoom / Híbrido' : 'Presencial en Salón'}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {(formData as any).special_seating
                ? 'Con asiento preferencial'
                : 'Acomodación estándar'}
            </p>
          </div>

          <div className="p-4 md:px-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Atención Pastoral / Salud
            </p>
            <p className="text-base font-black text-zinc-900 dark:text-white mt-1 truncate">
              {formData.is_elderly || formData.is_infirm
                ? 'Prioridad de Pastoreo'
                : 'Seguimiento Regular'}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {formData.is_deaf || formData.is_blind
                ? 'Requiere apoyo sensorial'
                : 'Sin barreras sensoriales'}
            </p>
          </div>

          <div className="p-4 md:px-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Estado de Residencia
            </p>
            <p
              className={`text-base font-black mt-1 truncate ${
                formData.is_moved
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formData.is_moved ? 'En Traslado / Mudado' : 'Congregación Local'}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
              {formData.is_moved
                ? formData.moved_congregation_name || 'Pendiente destino'
                : 'Miembro activo en lista'}
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* BLOQUE 2: MATRIZ DE INDICADORES PERSONALES Y PASTORALES               */}
      {/* ===================================================================== */}
      <section className="kg-card-bento kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 rounded-3xl border border-zinc-200/80 dark:border-white/10 p-6 md:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.05] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 font-mono text-xs font-black flex items-center justify-center">
              1
            </span>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Indicadores de Salud, Familia y Situación Personal
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Selecciona las condiciones que apliquen para adaptar las asignaciones, el pastoreo y la preparación ante emergencias
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {conditions.map((item) => {
            const isSel = !!(formData as any)[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleChange(item.id as any, !isSel)}
                className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between gap-3 cursor-pointer ${
                  isSel
                    ? `${item.activeStyle} shadow-xs`
                    : 'bg-zinc-50/70 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-400 border-zinc-200/70 dark:border-white/[0.06] hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSel
                        ? 'bg-white/70 dark:bg-black/20'
                        : 'bg-zinc-200/60 dark:bg-white/[0.05] text-zinc-500'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06]">
                    {item.badge}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold">{item.label}</p>
                  <p className="text-[11px] opacity-75 mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* BLOQUE 3: MODALIDAD DE ASISTENCIA Y ACOMODACIÓN EN EL SALÓN           */}
      {/* ===================================================================== */}
      <section className="kg-card-bento kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 rounded-3xl border border-zinc-200/80 dark:border-white/10 p-6 md:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.05] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 font-mono text-xs font-black flex items-center justify-center">
              2
            </span>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Modalidad de Asistencia y Acomodación en el Salón del Reino
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {activeAccommodationsCount} consideración(es) activa(s) para el departamento de acomodadores y audio/video
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accommodationItems.map((acc) => {
            const isActive = !!(formData as any)[acc.id];
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleChange(acc.id as any, !isActive)}
                className={`flex items-center justify-between p-5 rounded-2xl border transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-400/70 dark:border-teal-700 text-teal-900 dark:text-teal-200 shadow-2xs'
                    : 'bg-zinc-50/60 dark:bg-white/[0.02] border-zinc-200/70 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-start gap-3.5 pr-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'bg-zinc-200/70 dark:bg-white/[0.05] text-zinc-500'
                    }`}
                  >
                    {acc.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{acc.label}</p>
                    <p className="text-[11px] opacity-80 mt-0.5 leading-snug">{acc.desc}</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'border border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  {isActive && <CheckCircle2 size={14} />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* BLOQUE 4: SEGUIMIENTO DE TRASLADO A OTRA CONGREGACIÓN (SI SE MUDÓ)    */}
      {/* ===================================================================== */}
      {formData.is_moved && (
        <section className="kg-card-bento kg-glass-surface kg-sheen-top bg-orange-50/50 dark:bg-orange-950/20 rounded-3xl border border-orange-200/80 dark:border-orange-800/50 p-6 md:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-orange-200/60 dark:border-orange-800/40 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-orange-500 text-white font-mono text-xs font-black flex items-center justify-center">
                3
              </span>
              <div>
                <h4 className="text-sm font-bold text-orange-900 dark:text-orange-200">
                  Control de Secretaría: Traslado de Congregación y Envío de S-21
                </h4>
                <p className="text-[11px] text-orange-700/80 dark:text-orange-300/80">
                  Registro de la congregación receptora, fecha de mudanza y confirmación de carta de presentación
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 block">
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
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 block">
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
                className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  formData.letter_of_introduction_sent
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/[0.08]'
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
        </section>
      )}
    </div>
  );
};
