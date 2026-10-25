// src/components/PublisherEditor/sections/MedicalDpaSection.tsx
import React, { useMemo, useState } from 'react';
import { Publisher } from '../../../types';
import { PremiumDatePicker } from '../../PremiumDatePicker';
import { useCongregation } from '../../../context/CongregationContext';
import {
  FileCheck2,
  Phone,
  User,
  HeartPulse,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Search,
  FolderCheck,
  Stethoscope,
} from 'lucide-react';

interface MedicalDpaSectionProps {
  formData: Publisher;
  handleChange: (field: keyof Publisher, value: any) => void;
}

export const MedicalDpaSection: React.FC<MedicalDpaSectionProps> = ({
  formData,
  handleChange,
}) => {
  const { publishers } = useCongregation();
  const [proxySearchTarget, setProxySearchTarget] = useState<'primary' | 'alternate' | null>(null);
  const [proxyQuery, setProxyQuery] = useState('');

  const dpaReviewStatus = useMemo(() => {
    if (!formData.dpa_date) return null;
    try {
      const signed = new Date(formData.dpa_date + 'T00:00:00');
      if (isNaN(signed.getTime())) return null;
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - signed.getTime()) / (1000 * 60 * 60 * 24));
      const months = Math.floor(diffDays / 30);
      return {
        days: diffDays,
        months,
        needsAnnualReview: diffDays > 365,
      };
    } catch {
      return null;
    }
  }, [formData.dpa_date]);

  const matchingPublishers = useMemo(() => {
    const q = proxyQuery.trim().toLowerCase();
    return publishers
      .filter((p) => {
        if (p.status === 'deleted' || p.id === formData.id) return false;
        const name = (p.full_name || p.name || '').toLowerCase();
        return !q || name.includes(q);
      })
      .slice(0, 6);
  }, [publishers, proxyQuery, formData.id]);

  const handleSelectProxy = (target: 'primary' | 'alternate', pub: Publisher) => {
    const fullName = pub.full_name || pub.name || '';
    const phone = pub.phone || pub.home_phone || '';
    if (target === 'primary') {
      handleChange('healthcare_agent_name', fullName);
      if (phone) handleChange('healthcare_agent_phone', phone);
    } else {
      handleChange('healthcare_agent_alternate_name', fullName);
      if (phone) handleChange('healthcare_agent_alternate_phone', phone);
    }
    setProxySearchTarget(null);
    setProxyQuery('');
  };

  const cleanPhone = (val?: string) => (val || '').replace(/[^0-9]/g, '');

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-6">
      {/* BLOQUE 1: ESTADO DE LA DIRECTRIZ DPA Y CINTA DE VIGENCIA */}
      <section className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 md:px-8 border-b border-zinc-100 dark:border-white/[0.05] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/50 dark:border-rose-500/20">
              <HeartPulse size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Directriz Médica Anticipada (DPA) y Salud
                </h3>
                <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500">
                  · {formData.has_dpa ? 'DPA Firmado ✓' : 'Sin DPA registrado'}
                  {dpaReviewStatus?.needsAnnualReview ? ' · Revisión anual sugerida' : ''}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Voluntad médica anticipada, representantes legales designados y consideraciones para el Comité de Enlace (CLH)
              </p>
            </div>
          </div>
        </div>

        {/* Cinta KPI de Vigencia Médica */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100 dark:divide-white/[0.05] bg-zinc-50/40 dark:bg-white/[0.01]">
          <div className="px-6 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Tarjeta DPA / Identidad
            </span>
            <p
              className={`text-sm font-bold mt-0.5 ${
                formData.has_dpa
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {formData.has_dpa ? 'Vigente y firmada' : 'Pendiente'}
            </p>
          </div>
          <div className="px-6 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Copia de Respaldo
            </span>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {formData.dpa_copy_on_file ? 'Entregada ✓' : 'No archivada'}
            </p>
          </div>
          <div className="px-6 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Fecha de Firma
            </span>
            <p className="text-sm font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-0.5">
              {formData.dpa_date || 'Sin fecha'}
            </p>
          </div>
          <div className="px-6 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Representante 1°
            </span>
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400 truncate mt-0.5">
              {formData.healthcare_agent_name || 'Sin asignar'}
            </p>
          </div>
        </div>

        {/* 1. Estado del Documento y Fechas */}
        <div className="p-6 md:p-8 space-y-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            1. Verificación del Documento y Fechas de Revisión
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleChange('has_dpa', !formData.has_dpa)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-xs font-bold cursor-pointer ${
                formData.has_dpa
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/35 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-500/60 shadow-2xs'
                  : 'bg-zinc-50/70 dark:bg-white/[0.02] text-zinc-700 dark:text-zinc-300 border-zinc-200/70 dark:border-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-3 text-left">
                <FileCheck2
                  size={18}
                  className={formData.has_dpa ? 'text-emerald-600' : 'text-zinc-400'}
                />
                <div>
                  <p>Cuenta con tarjeta DPA / Tarjeta de Identidad vigente</p>
                  <p className="text-[11px] font-normal text-zinc-500">
                    Firmada ante testigos y portada por el publicador
                  </p>
                </div>
              </div>
              <CheckCircle2
                size={16}
                className={formData.has_dpa ? 'text-emerald-600 opacity-100' : 'opacity-25'}
              />
            </button>

            <button
              type="button"
              onClick={() => handleChange('dpa_copy_on_file', !formData.dpa_copy_on_file)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-xs font-bold cursor-pointer ${
                formData.dpa_copy_on_file
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/35 text-indigo-900 dark:text-indigo-200 border-indigo-400 dark:border-indigo-500/60 shadow-2xs'
                  : 'bg-zinc-50/70 dark:bg-white/[0.02] text-zinc-700 dark:text-zinc-300 border-zinc-200/70 dark:border-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-3 text-left">
                <FolderCheck
                  size={18}
                  className={formData.dpa_copy_on_file ? 'text-indigo-600' : 'text-zinc-400'}
                />
                <div>
                  <p>Copia entregada a representantes y superintendente</p>
                  <p className="text-[11px] font-normal text-zinc-500">
                    Respaldo disponible para localización inmediata
                  </p>
                </div>
              </div>
              <CheckCircle2
                size={16}
                className={formData.dpa_copy_on_file ? 'text-indigo-600 opacity-100' : 'opacity-25'}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                Fecha de Firma o Última Revisión del DPA
              </label>
              <PremiumDatePicker
                value={formData.dpa_date || ''}
                onChange={(val) => handleChange('dpa_date', val)}
                accentColor="emerald"
                allowFutureYears={false}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                Próxima Revisión Recomendada (Opcional)
              </label>
              <PremiumDatePicker
                value={formData.dpa_expiry_date || ''}
                onChange={(val) => handleChange('dpa_expiry_date', val)}
                accentColor="indigo"
                allowFutureYears={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* BLOQUE 2: REPRESENTANTES DE ATENCIÓN MÉDICA DESIGNADOS */}
      <section className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100 dark:border-white/[0.05]">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            2. Representantes de Atención Médica Designados en el DPA
          </h4>
          <span className="text-xs text-zinc-400">
            Vincula desde el directorio de la congregación o escribe manualmente
          </span>
        </div>

        {proxySearchTarget && (
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-800 dark:text-indigo-200 flex items-center gap-1.5">
                <Search size={14} /> Seleccionar Representante{' '}
                {proxySearchTarget === 'primary' ? 'Principal' : 'Suplente'} del Directorio
              </span>
              <button
                type="button"
                onClick={() => {
                  setProxySearchTarget(null);
                  setProxyQuery('');
                }}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            <input
              type="text"
              value={proxyQuery}
              onChange={(e) => setProxyQuery(e.target.value)}
              placeholder="Buscar hermano o hermana por nombre..."
              className="kf-input w-full bg-white dark:bg-zinc-900 text-xs"
              autoFocus
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {matchingPublishers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProxy(proxySearchTarget, p)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-white/[0.06] hover:border-indigo-400 text-left transition-all cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">
                      {p.full_name || p.name}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-500 truncate">
                      {p.phone || p.home_phone || 'Sin teléfono reg.'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 ml-2 shrink-0">
                    Elegir
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Representante Principal */}
          <div className="p-5 rounded-2xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.06] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                <User size={15} className="text-rose-500" />
                <span>Representante Médico Principal (1°)</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setProxySearchTarget(proxySearchTarget === 'primary' ? null : 'primary')
                }
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Search size={11} /> Directorio
              </button>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.healthcare_agent_name || ''}
                onChange={(e) => handleChange('healthcare_agent_name', e.target.value)}
                className="kf-input w-full bg-white dark:bg-zinc-900 text-xs"
                placeholder="Nombre del representante principal"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
                Teléfono de urgencia
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={formData.healthcare_agent_phone || ''}
                  onChange={(e) => handleChange('healthcare_agent_phone', e.target.value)}
                  className="kf-input flex-1 bg-white dark:bg-zinc-900 font-mono text-xs"
                  placeholder="Número de contacto urgente"
                />
                {cleanPhone(formData.healthcare_agent_phone) && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${cleanPhone(formData.healthcare_agent_phone)}`}
                      className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Llamar"
                    >
                      <Phone size={14} />
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhone(formData.healthcare_agent_phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle size={14} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Representante Suplente */}
          <div className="p-5 rounded-2xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.06] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                <User size={15} className="text-zinc-400" />
                <span>Representante Médico Suplente (2°)</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setProxySearchTarget(proxySearchTarget === 'alternate' ? null : 'alternate')
                }
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Search size={11} /> Directorio
              </button>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.healthcare_agent_alternate_name || ''}
                onChange={(e) =>
                  handleChange('healthcare_agent_alternate_name', e.target.value)
                }
                className="kf-input w-full bg-white dark:bg-zinc-900 text-xs"
                placeholder="Nombre completo suplente"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
                Teléfono de urgencia
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={formData.healthcare_agent_alternate_phone || ''}
                  onChange={(e) =>
                    handleChange('healthcare_agent_alternate_phone', e.target.value)
                  }
                  className="kf-input flex-1 bg-white dark:bg-zinc-900 font-mono text-xs"
                  placeholder="Número de contacto suplente"
                />
                {cleanPhone(formData.healthcare_agent_alternate_phone) && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${cleanPhone(formData.healthcare_agent_alternate_phone)}`}
                      className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Llamar"
                    >
                      <Phone size={14} />
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhone(formData.healthcare_agent_alternate_phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle size={14} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BLOQUE 3: ALERGIAS Y CONSIDERACIONES MÉDICAS */}
      <section className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-xs space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
          3. Alergias y Condiciones Crónicas (Apoyo de Emergencia y CLH)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <AlertCircle size={13} className="text-rose-500" />
              Alergias a Medicamentos o Sustancias
            </label>
            <textarea
              rows={2}
              value={formData.medical_allergies || ''}
              onChange={(e) => handleChange('medical_allergies', e.target.value)}
              className="kf-input w-full resize-none text-xs"
              placeholder="Ej. Alérgico a penicilina, sulfas, látex..."
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Stethoscope size={13} className="text-indigo-500" />
              Condiciones Médicas o Tratamientos Relevantes
            </label>
            <textarea
              rows={2}
              value={formData.medical_conditions || ''}
              onChange={(e) => handleChange('medical_conditions', e.target.value)}
              className="kf-input w-full resize-none text-xs"
              placeholder="Ej. Hipertensión, diabetes, marcapasos, medicación diaria..."
            />
          </div>
        </div>
      </section>
    </div>
  );
};
