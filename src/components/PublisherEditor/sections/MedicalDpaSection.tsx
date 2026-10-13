// src/components/PublisherEditor/sections/MedicalDpaSection.tsx
import React from 'react';
import { Publisher } from '../../../types';
import { PremiumDatePicker } from '../../PremiumDatePicker';
import {
  ShieldAlert,
  FileCheck2,
  Phone,
  User,
  HeartPulse,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface MedicalDpaSectionProps {
  formData: Publisher;
  handleChange: (field: keyof Publisher, value: any) => void;
}

export const MedicalDpaSection: React.FC<MedicalDpaSectionProps> = ({
  formData,
  handleChange,
}) => {
  return (
    <section className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm transition-all space-y-5 sm:space-y-6">
      {/* Cabecera DPA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-400">
            <HeartPulse size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Directriz Médica Anticipada (DPA)
              </h3>
              {formData.has_dpa ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 size={11} /> DPA Vigente
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <AlertCircle size={11} /> Pendiente / Sin DPA
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Registro teocrático de voluntad médica y representantes de salud
            </p>
          </div>
        </div>
      </div>

      {/* Estado del Documento DPA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleChange('has_dpa', !formData.has_dpa)}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-xs font-semibold cursor-pointer ${
            formData.has_dpa
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800 shadow-2xs'
              : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-400 border-zinc-200/70 dark:border-white/[0.06] hover:bg-zinc-100'
          }`}
        >
          <div className="flex items-center gap-3 text-left">
            <FileCheck2
              size={18}
              className={formData.has_dpa ? 'text-emerald-600' : 'text-zinc-400'}
            />
            <div>
              <p className="font-bold">¿Cuenta con DPA firmado y vigente?</p>
              <p className="text-[10px] font-normal text-zinc-400">
                Documento de voluntad anticipada y no transfusión de sangre
              </p>
            </div>
          </div>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              formData.has_dpa
                ? 'bg-emerald-600 text-white'
                : 'border border-zinc-300 dark:border-zinc-700'
            }`}
          >
            {formData.has_dpa && <CheckCircle2 size={14} />}
          </div>
        </button>

        <div>
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
            Fecha de Última Revisión / Firma del DPA
          </label>
          <PremiumDatePicker
            value={formData.dpa_date || ''}
            onChange={(val) => handleChange('dpa_date', val)}
            accentColor="emerald"
            allowFutureYears={false}
          />
        </div>
      </div>

      {/* Representantes Médicos */}
      <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-white/[0.04]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Representantes de Atención Médica Designados
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
              <User size={13} className="text-rose-500" />
              <span>Representante Principal</span>
            </div>
            <div>
              <label className="text-[10px] font-medium text-zinc-500 block mb-1">Nombre</label>
              <input
                type="text"
                value={formData.healthcare_agent_name || ''}
                onChange={(e) => handleChange('healthcare_agent_name', e.target.value)}
                className="kf-input w-full bg-white dark:bg-zinc-900"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-zinc-500 block mb-1">Teléfono</label>
              <div className="relative">
                <Phone
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="tel"
                  value={formData.healthcare_agent_phone || ''}
                  onChange={(e) => handleChange('healthcare_agent_phone', e.target.value)}
                  className="kf-input kf-input-icon w-full bg-white dark:bg-zinc-900"
                  placeholder="Número de contacto urgente"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
              <User size={13} className="text-zinc-400" />
              <span>Representante Suplente</span>
            </div>
            <div>
              <label className="text-[10px] font-medium text-zinc-500 block mb-1">Nombre</label>
              <input
                type="text"
                value={formData.healthcare_agent_alternate_name || ''}
                onChange={(e) =>
                  handleChange('healthcare_agent_alternate_name', e.target.value)
                }
                className="kf-input w-full bg-white dark:bg-zinc-900"
                placeholder="Nombre completo suplente"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-zinc-500 block mb-1">Teléfono</label>
              <div className="relative">
                <Phone
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="tel"
                  value={formData.healthcare_agent_alternate_phone || ''}
                  onChange={(e) =>
                    handleChange('healthcare_agent_alternate_phone', e.target.value)
                  }
                  className="kf-input kf-input-icon w-full bg-white dark:bg-zinc-900"
                  placeholder="Número de contacto suplente"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alergias o Consideraciones Médicas Críticas */}
      <div className="pt-2">
        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
          Alergias o Condiciones Médicas de Urgencia
        </label>
        <textarea
          rows={2}
          value={formData.medical_allergies || ''}
          onChange={(e) => handleChange('medical_allergies', e.target.value)}
          className="kf-input w-full resize-none"
          placeholder="Ej. Alérgico a penicilina, condición diabética, insulina dependiente, etc."
        />
        <p className="text-[10px] text-zinc-400 mt-1 pl-1">
          Información confidencial para comités de enlace con los hospitales (CLH) en emergencias
        </p>
      </div>
    </section>
  );
};
