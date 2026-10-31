// src/components/PublisherEditor/sections/BasicInfoSection.tsx
import React, { useMemo, useState } from 'react';
import { Publisher } from '../../../types';
import { PremiumDatePicker } from '../../PremiumDatePicker';
import { ensureImmutablePublisherCode } from '../../../utils/publisherDeduplication';
import { useCongregation } from '../../../context/CongregationContext';
import {
  getPubDisplayName,
  getPubId,
  getPublisherFamilyMembers,
  suggestPotentialFamilyMembers,
} from '../../../utils/familyGrouping';
import {
  User,
  Users,
  Heart,
  Home,
  Calendar,
  Briefcase,
  Languages,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  ShieldCheck,
  UserPlus,
  X,
  Wrench,
  Baby,
  Plus,
  Wand2,
} from 'lucide-react';

interface BasicInfoSectionProps {
  formData: Publisher;
  handleChange: (field: keyof Publisher, value: any) => void;
}

const SUGGESTED_SKILLS = [
  'Electricidad',
  'Plomería',
  'Carpintería',
  'Albañilería / Pintura',
  'Audio / Video',
  'Informática / Redes',
  'Primeros Auxilios / Salud',
  'Contabilidad / Administración',
  'Jardinería',
  'Cocina / Hospitalidad',
  'Herrería / Soldadura',
  'Aire Acondicionado (HVAC)',
];

const SUGGESTED_LANGUAGES = [
  'Español',
  'Inglés',
  'Lengua de Señas (LSA/LSM)',
  'Portugués',
  'Guaraní',
  'Quechua',
  'Francés',
  'Italiano',
  'Chino Mandarín',
];

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ formData, handleChange }) => {
  const { publishers } = useCongregation();
  const [copiedId, setCopiedId] = useState(false);
  const [familySearch, setFamilySearch] = useState('');
  const [customSkillInput, setCustomSkillInput] = useState('');

  const selfId = getPubId(formData);

  const linkedFamilyMembers = useMemo(() => {
    return getPublisherFamilyMembers(formData, publishers || []);
  }, [formData, publishers]);

  const familySuggestions = useMemo(() => {
    return suggestPotentialFamilyMembers(formData, publishers || []);
  }, [formData, publishers]);

  const searchableRelatives = useMemo(() => {
    const q = familySearch.trim().toLowerCase();
    if (!q) return [];
    const linkedIds = new Set(linkedFamilyMembers.map((m) => getPubId(m)));
    return (publishers || [])
      .filter((p) => {
        const pid = getPubId(p);
        if (!pid || pid === selfId || linkedIds.has(pid)) return false;
        return getPubDisplayName(p).toLowerCase().includes(q);
      })
      .slice(0, 6);
  }, [familySearch, publishers, linkedFamilyMembers, selfId]);

  const handleAddFamilyMember = (targetPub: Publisher) => {
    const targetId = getPubId(targetPub);
    if (!targetId) return;
    const currentList = Array.isArray(formData.familyMemberIds)
      ? [...formData.familyMemberIds]
      : [];
    if (!currentList.includes(targetId)) {
      handleChange('familyMemberIds', [...currentList, targetId]);
    }
    setFamilySearch('');
  };

  const handleRemoveFamilyMember = (targetPub: Publisher) => {
    const targetId = getPubId(targetPub);
    const currentList = Array.isArray(formData.familyMemberIds)
      ? formData.familyMemberIds.filter(
          (id) => id !== targetId && id !== targetPub.id && id !== targetPub.nid
        )
      : [];
    handleChange('familyMemberIds', currentList);
    if (
      formData.spouse_nid &&
      (formData.spouse_nid === targetId ||
        formData.spouse_nid === targetPub.id ||
        formData.spouse_nid === targetPub.nid)
    ) {
      handleChange('spouse_nid', '');
    }
  };

  const uniquePublisherId = useMemo(() => {
    return ensureImmutablePublisherCode(formData);
  }, [formData.publisherCode, formData.nid, formData.id]);

  const handleCopyUniqueId = () => {
    navigator.clipboard.writeText(uniquePublisherId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const ageInfo = useMemo(() => {
    const rawBirthDate = formData.birth_date || formData.birthDate;
    if (!rawBirthDate) return null;

    try {
      const birth = new Date(rawBirthDate + 'T00:00:00');
      if (isNaN(birth.getTime())) return null;

      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      const dayDiff = today.getDate() - birth.getDate();

      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }

      if (age < 0) return null;

      let stageLabel = 'Adulto';
      if (age < 13) stageLabel = 'Niño(a)';
      else if (age < 18) stageLabel = 'Joven menor';
      else if (age < 30) stageLabel = 'Joven adulto';
      else if (age >= 65) stageLabel = 'Edad Avanzada (65+)';

      const monthNames = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ];
      const formattedDayMonth = `${birth.getDate()} de ${monthNames[birth.getMonth()]}`;

      return {
        age,
        stageLabel,
        formattedDayMonth,
        isSenior: age >= 65,
        isMinor: age < 18,
      };
    } catch {
      return null;
    }
  }, [formData.birth_date, formData.birthDate]);

  const handleAutoSplitFullName = () => {
    const raw = (formData.full_name || formData.name || '').trim();
    if (!raw) return;
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      handleChange('first_name', parts[0]);
      handleChange('middle_name', '');
      handleChange('last_name', '');
      handleChange('second_last_name', '');
    } else if (parts.length === 2) {
      handleChange('first_name', parts[0]);
      handleChange('middle_name', '');
      handleChange('last_name', parts[1]);
      handleChange('second_last_name', '');
    } else if (parts.length === 3) {
      handleChange('first_name', parts[0]);
      handleChange('middle_name', '');
      handleChange('last_name', parts[1]);
      handleChange('second_last_name', parts[2]);
    } else {
      handleChange('first_name', parts[0]);
      handleChange('middle_name', parts[1]);
      handleChange('last_name', parts[2]);
      handleChange('second_last_name', parts.slice(3).join(' '));
    }
  };

  const currentSkills: string[] = useMemo(() => {
    if (Array.isArray(formData.skills)) return formData.skills;
    if (typeof formData.skills === 'string' && (formData.skills as string).trim()) {
      return (formData.skills as string)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, [formData.skills]);

  const handleToggleSkill = (skill: string) => {
    if (currentSkills.includes(skill)) {
      handleChange(
        'skills',
        currentSkills.filter((s) => s !== skill)
      );
    } else {
      handleChange('skills', [...currentSkills, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    const clean = customSkillInput.trim();
    if (!clean) return;
    if (!currentSkills.includes(clean)) {
      handleChange('skills', [...currentSkills, clean]);
    }
    setCustomSkillInput('');
  };

  const currentLanguages: string[] = useMemo(() => {
    if (Array.isArray(formData.languages)) return formData.languages;
    if (typeof formData.languages === 'string' && (formData.languages as string).trim()) {
      return (formData.languages as string)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, [formData.languages]);

  const handleToggleLanguage = (lang: string) => {
    if (currentLanguages.includes(lang)) {
      handleChange(
        'languages',
        currentLanguages.filter((l) => l !== lang)
      );
    } else {
      handleChange('languages', [...currentLanguages, lang]);
    }
  };

  const isFemale = formData.gender === 'female' || formData.gender === 'hermana';

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-6">
      {/* BLOQUE 1: CABECERA DEMOGRÁFICA Y CINTA DE IDENTIDAD */}
      <section className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 md:px-8 border-b border-zinc-100 dark:border-white/[0.05] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shrink-0 border border-indigo-200/50 dark:border-indigo-500/20">
              {isFemale ? '♀' : '♂'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Información Personal, Filiación y Perfil de Apoyo
                </h3>
                <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500">
                  · {uniquePublisherId}
                  {formData.is_head_of_household ? ' · Cabeza de familia' : ''}
                  {formData.is_child ? ' · Menor / Estudiante' : ''}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Identidad civil para la tarjeta S-21, vínculo con el núcleo familiar, idiomas y oficios prácticos
              </p>
            </div>
          </div>

          {/* Botón Copiar ID Inmutable */}
          <button
            type="button"
            onClick={handleCopyUniqueId}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-200 border border-zinc-200/70 dark:border-white/[0.08] text-xs font-mono tabular-nums font-bold transition-all cursor-pointer self-start lg:self-auto"
            title="Copiar identificador permanente del publicador"
          >
            <ShieldCheck size={14} className="text-indigo-500" />
            <span>{uniquePublisherId}</span>
            {copiedId ? (
              <Check size={13} className="text-emerald-500" />
            ) : (
              <Copy size={13} className="opacity-50" />
            )}
          </button>
        </div>

        {/* Cinta de Resumen Demográfico (Tabular Nums) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100 dark:divide-white/[0.05] bg-zinc-50/40 dark:bg-white/[0.01]">
          <div className="px-6 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Sexo (Registro S-21)
            </span>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {isFemale ? 'Hermana (Mujer)' : 'Hermano (Hombre)'}
            </p>
          </div>
          <div className="px-6 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Edad y Etapa
            </span>
            <p className="text-sm font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-0.5">
              {ageInfo ? `${ageInfo.age} años · ${ageInfo.stageLabel}` : 'Sin fecha reg.'}
            </p>
          </div>
          <div className="px-6 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Estado Civil
            </span>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 capitalize mt-0.5">
              {formData.marital_status || 'Soltero(a)'}
              {formData.spouse_name ? ` (${formData.spouse_name})` : ''}
            </p>
          </div>
          <div className="px-6 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Núcleo Familiar
            </span>
            <p className="text-sm font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
              {linkedFamilyMembers.length}{' '}
              {linkedFamilyMembers.length === 1 ? 'familiar vinculado' : 'familiares vinculados'}
            </p>
          </div>
        </div>

        {/* Cuerpo de Identidad y Datos Civiles */}
        <div className="p-6 md:p-8 space-y-6">
          {/* 1. Nombre Oficial y Desglose en 4 Campos */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                1. Nombre Oficial en Listas, Programas (S-140) y Tarjeta S-21
              </span>
              <button
                type="button"
                onClick={handleAutoSplitFullName}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/50 hover:bg-indigo-100 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Wand2 size={12} />
                <span>Autoseparar en Nombres y Apellidos</span>
              </button>
            </div>

            <input
              type="text"
              value={formData.full_name || formData.name || ''}
              onChange={(e) => handleChange('full_name', e.target.value)}
              placeholder="Ej. Juan Carlos Pérez Gómez"
              className="kf-input w-full font-bold text-sm"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { id: 'first_name', label: 'Primer Nombre', placeholder: 'Ej. Juan' },
                { id: 'middle_name', label: 'Segundo Nombre', placeholder: 'Ej. Carlos' },
                { id: 'last_name', label: 'Primer Apellido', placeholder: 'Ej. Pérez' },
                { id: 'second_last_name', label: 'Segundo Apellido', placeholder: 'Ej. Gómez' },
              ].map((field) => (
                <div key={field.id}>
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={(formData as any)[field.id] || ''}
                    onChange={(e) => handleChange(field.id as any, e.target.value)}
                    placeholder={field.placeholder}
                    className="kf-input w-full text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 2. Sexo, Fecha de Nacimiento y Estado Civil */}
          <div className="pt-5 border-t border-zinc-100 dark:border-white/[0.05] grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sexo + Fecha de nacimiento (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                  2. Sexo y Fecha de Nacimiento
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/70 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleChange('gender', 'male')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !isFemale
                        ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-2xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    ♂ Hermano
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('gender', 'female')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isFemale
                        ? 'bg-white dark:bg-rose-600 text-rose-600 dark:text-white shadow-2xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    ♀ Hermana
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                  Fecha de Nacimiento (S-21)
                </label>
                <PremiumDatePicker
                  value={formData.birth_date || formData.birthDate || ''}
                  onChange={(val) => {
                    handleChange('birth_date', val);
                    handleChange('birthDate', val);
                  }}
                  accentColor="indigo"
                  allowFutureYears={false}
                />
                {ageInfo?.isSenior && !formData.is_elderly && (
                  <button
                    type="button"
                    onClick={() => handleChange('is_elderly', true)}
                    className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200/70 dark:border-amber-800/50 cursor-pointer"
                  >
                    <CheckCircle2 size={12} />
                    <span>Tiene {ageInfo.age} años · ¿Marcar «Edad Avanzada»?</span>
                  </button>
                )}
                {ageInfo?.isMinor && !formData.is_child && (
                  <button
                    type="button"
                    onClick={() => handleChange('is_child', true)}
                    className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/50 px-2.5 py-1 rounded-lg border border-pink-200/70 dark:border-pink-800/50 cursor-pointer"
                  >
                    <Baby size={12} />
                    <span>Tiene {ageInfo.age} años · ¿Marcar «Menor / Hijo»?</span>
                  </button>
                )}
              </div>
            </div>

            {/* Estado Civil y Rol en el Hogar (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                  3. Estado Civil y Posición en el Hogar
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'soltero', label: 'Soltero(a)' },
                    { id: 'casado', label: 'Casado(a)' },
                    { id: 'viudo', label: 'Viudo(a)' },
                    { id: 'divorciado', label: 'Divorciado(a)' },
                    { id: 'separado', label: 'Separado(a)' },
                  ].map((st) => {
                    const isSelected = (formData.marital_status || 'soltero') === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleChange('marital_status', st.id)}
                        className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-400 border-zinc-200/70 dark:border-white/[0.06] hover:border-zinc-300'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleChange('is_head_of_household', !formData.is_head_of_household)
                  }
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all text-xs font-bold cursor-pointer ${
                    formData.is_head_of_household
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border-indigo-400 dark:border-indigo-500/70 shadow-2xs'
                      : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-300 border-zinc-200/70 dark:border-white/[0.06]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Home size={15} className="text-indigo-500" />
                    <span>Cabeza de Familia</span>
                  </span>
                  <CheckCircle2
                    size={15}
                    className={
                      formData.is_head_of_household
                        ? 'text-indigo-600 opacity-100'
                        : 'opacity-25'
                    }
                  />
                </button>

                <button
                  type="button"
                  onClick={() => handleChange('is_child', !formData.is_child)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all text-xs font-bold cursor-pointer ${
                    formData.is_child
                      ? 'bg-pink-50/70 dark:bg-pink-950/40 text-pink-800 dark:text-pink-200 border-pink-400 dark:border-pink-500/70 shadow-2xs'
                      : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-300 border-zinc-200/70 dark:border-white/[0.06]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Baby size={15} className="text-pink-500" />
                    <span>Menor de Edad / Hijo(a)</span>
                  </span>
                  <CheckCircle2
                    size={15}
                    className={formData.is_child ? 'text-pink-600 opacity-100' : 'opacity-25'}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Datos Conyugales o de Tutoría */}
          {(formData.marital_status === 'casado' || formData.is_child) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {formData.marital_status === 'casado' && (
                <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/40 space-y-3 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 mb-1 block">
                      Cónyuge en la Congregación
                    </label>
                    <select
                      value={formData.spouse_nid || ''}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        handleChange('spouse_nid', selectedId);
                        const found = (publishers || []).find((p) => getPubId(p) === selectedId);
                        if (found) {
                          handleChange('spouse_name', getPubDisplayName(found));
                          handleAddFamilyMember(found);
                        }
                      }}
                      className="kf-input w-full bg-white dark:bg-zinc-900 text-xs"
                    >
                      <option value="">— Seleccionar del directorio —</option>
                      {(publishers || [])
                        .filter((p) => getPubId(p) !== selfId)
                        .map((p) => {
                          const pid = getPubId(p);
                          return (
                            <option key={pid} value={pid}>
                              {getPubDisplayName(p)}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 mb-1 block">
                      Nombre del Cónyuge (manual o externo)
                    </label>
                    <input
                      type="text"
                      value={formData.spouse_name || ''}
                      onChange={(e) => handleChange('spouse_name', e.target.value)}
                      className="kf-input w-full bg-white dark:bg-zinc-900 text-xs"
                      placeholder="Nombre completo del esposo(a)"
                    />
                  </div>
                </div>
              )}

              {formData.is_child && (
                <div className="p-4 rounded-2xl bg-pink-50/40 dark:bg-pink-950/20 border border-pink-200/70 dark:border-pink-800/40 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-pink-900 dark:text-pink-300 mb-1 block">
                      Padre / Madre / Tutor en la Congregación
                    </label>
                    <select
                      value={formData.parent_guardian_nid || ''}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        handleChange('parent_guardian_nid', selectedId);
                        const found = (publishers || []).find((p) => getPubId(p) === selectedId);
                        if (found) {
                          handleChange('parent_guardian_name', getPubDisplayName(found));
                          handleAddFamilyMember(found);
                        }
                      }}
                      className="kf-input w-full bg-white dark:bg-zinc-900 text-xs"
                    >
                      <option value="">— Seleccionar padre/madre del directorio —</option>
                      {(publishers || [])
                        .filter((p) => getPubId(p) !== selfId && !p.is_child)
                        .map((p) => {
                          const pid = getPubId(p);
                          return (
                            <option key={pid} value={pid}>
                              {getPubDisplayName(p)}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-pink-900 dark:text-pink-300 mb-1 block">
                      Nombre del Padre o Tutor Responsable
                    </label>
                    <input
                      type="text"
                      value={formData.parent_guardian_name || ''}
                      onChange={(e) => handleChange('parent_guardian_name', e.target.value)}
                      className="kf-input w-full bg-white dark:bg-zinc-900 text-xs"
                      placeholder="Nombre completo del padre/madre"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* BLOQUE 2: NÚCLEO FAMILIAR Y MOTOR DE REUNIONES (MISMA NOCHE) */}
      <section className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-2xl sm:rounded-3xl p-6 md:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-white/[0.05]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                4. Núcleo Familiar y Programación en Reuniones
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Vincula padres, hijos, cónyuge o hermanos carnales para priorizar asignarlos la misma noche y validar parejas en VMC
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              handleChange(
                'groupWithFamilyInMeetings',
                formData.groupWithFamilyInMeetings === false ? true : false
              )
            }
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              formData.groupWithFamilyInMeetings !== false
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>
              {formData.groupWithFamilyInMeetings !== false
                ? 'Agrupar misma noche: Activo'
                : 'Agrupar misma noche: Inactivo'}
            </span>
          </button>
        </div>

        {/* Familiares vinculados */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            Integrantes del hogar vinculados ({linkedFamilyMembers.length})
          </span>
          {linkedFamilyMembers.length === 0 ? (
            <p className="text-xs text-zinc-400 italic">
              Aún no se han vinculado familiares directos en el directorio.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {linkedFamilyMembers.map((fam) => {
                const famId = getPubId(fam);
                const isSpouse =
                  (formData.spouse_nid && formData.spouse_nid === famId) ||
                  (formData.spouse_name &&
                    formData.spouse_name.toLowerCase() ===
                      getPubDisplayName(fam).toLowerCase());
                return (
                  <span
                    key={famId}
                    className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl text-xs font-semibold bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/[0.08]"
                  >
                    {isSpouse ? (
                      <Heart size={12} className="text-rose-500 shrink-0" />
                    ) : (
                      <Users size={12} className="text-indigo-500 shrink-0" />
                    )}
                    <span>{getPubDisplayName(fam)}</span>
                    {isSpouse && (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        · Cónyuge
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFamilyMember(fam)}
                      className="p-0.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Buscador y sugerencias por apellido/dirección */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="relative">
            <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
              Buscar y vincular familiar de la congregación
            </label>
            <input
              type="text"
              value={familySearch}
              onChange={(e) => setFamilySearch(e.target.value)}
              placeholder="Escribe el nombre para vincular..."
              className="kf-input w-full text-xs"
            />
            {searchableRelatives.length > 0 && (
              <div className="mt-1.5 p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg space-y-1 max-h-44 overflow-y-auto">
                {searchableRelatives.map((rel) => (
                  <button
                    key={getPubId(rel)}
                    type="button"
                    onClick={() => handleAddFamilyMember(rel)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex items-center justify-between cursor-pointer"
                  >
                    <span>{getPubDisplayName(rel)}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      <UserPlus size={12} /> Vincular
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {familySuggestions.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1 block">
                Coincidencias detectadas por apellido o domicilio
              </label>
              <div className="flex flex-wrap gap-1.5">
                {familySuggestions.slice(0, 5).map(({ publisher: sug, reason }) => (
                  <button
                    key={getPubId(sug)}
                    type="button"
                    onClick={() => handleAddFamilyMember(sug)}
                    title={reason}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50 hover:bg-emerald-100 transition-all cursor-pointer"
                  >
                    <UserPlus size={12} className="text-emerald-600 shrink-0" />
                    <span>{getPubDisplayName(sug)}</span>
                    <span className="text-[10px] opacity-75">({reason})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* BLOQUE 3: OCUPACIÓN, IDIOMAS Y HABILIDADES PRÁCTICAS (LDC / SALÓN) */}
      <section className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-2xl sm:rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 block">
              5. Profesión u Ocupación Habitual
            </label>
            <div className="relative">
              <Briefcase
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={formData.occupation || ''}
                onChange={(e) => handleChange('occupation', e.target.value)}
                className="kf-input kf-input-icon w-full text-xs"
                placeholder="Ej. Docente, Electricista, Enfermero, Jubilado, Estudiante"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 block">
              6. Idiomas que Habla o Domina
            </label>
            <div className="relative mb-2">
              <Languages
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={currentLanguages.join(', ')}
                onChange={(e) => {
                  const arr = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  handleChange('languages', arr);
                }}
                className="kf-input kf-input-icon w-full text-xs"
                placeholder="Ej. Español, Inglés, Lengua de Señas"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_LANGUAGES.map((lang) => {
                const active = currentLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleToggleLanguage(lang)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 border-zinc-200/70 dark:border-white/[0.06] hover:border-indigo-300'
                    }`}
                  >
                    {active ? `✓ ${lang}` : `+ ${lang}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Matriz de Oficios y Habilidades Prácticas */}
        <div className="pt-5 border-t border-zinc-100 dark:border-white/[0.05] space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wrench size={15} className="text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                7. Oficios y Habilidades Prácticas (Mantenimiento del Salón y Emergencias)
              </span>
              {currentSkills.length > 0 && (
                <span className="text-xs font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-bold">
                  · {currentSkills.length} activa(s)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSkill();
                  }
                }}
                placeholder="Añadir otro oficio..."
                className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs w-44 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                title="Añadir oficio personalizado"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {Array.from(new Set([...SUGGESTED_SKILLS, ...currentSkills])).map((skill) => {
              const isSelected = currentSkills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleToggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-white/[0.06] hover:border-indigo-300'
                  }`}
                >
                  {isSelected && <Check size={12} />}
                  <span>{skill}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
