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

  // Miembros del núcleo familiar actualmente vinculados
  const linkedFamilyMembers = useMemo(() => {
    return getPublisherFamilyMembers(formData, publishers || []);
  }, [formData, publishers]);

  // Sugerencias automáticas por apellido o dirección compartida
  const familySuggestions = useMemo(() => {
    return suggestPotentialFamilyMembers(formData, publishers || []);
  }, [formData, publishers]);

  // Candidatos buscables para agregar al núcleo familiar
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

  // Cálculo de edad cronológica, etapa de vida y próximo cumpleaños
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

      // Etapa de vida
      let stageLabel = 'Adulto';
      let stageColor = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/50';
      if (age < 13) {
        stageLabel = 'Niño(a)';
        stageColor = 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800/50';
      } else if (age < 18) {
        stageLabel = 'Joven menor';
        stageColor = 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/50';
      } else if (age < 30) {
        stageLabel = 'Joven adulto';
        stageColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50';
      } else if (age >= 65) {
        stageLabel = 'Edad Avanzada (65+)';
        stageColor = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50';
      }

      const monthNames = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
      ];
      const formattedDayMonth = `${birth.getDate()} de ${monthNames[birth.getMonth()]}`;

      return {
        age,
        stageLabel,
        stageColor,
        formattedDayMonth,
        isSenior: age >= 65,
        isMinor: age < 18,
      };
    } catch {
      return null;
    }
  }, [formData.birth_date, formData.birthDate]);

  // Auto-separar nombre completo en los 4 campos si el usuario edita el nombre completo directamente
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

  // Habilidades (skills)
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

  // Idiomas (languages)
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

  return (
    <section className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-xs transition-all space-y-6">
      {/* Cabecera Editorial de Perfil Personal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-white/[0.05]">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shrink-0 border border-indigo-200/50 dark:border-indigo-500/20">
            {formData.gender === 'female' || formData.gender === 'hermana' ? '♀' : '♂'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Información Personal y Familiar
              </h3>
              <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500">
                · {uniquePublisherId}
                {formData.is_head_of_household ? ' · Cabeza de familia' : ''}
                {formData.is_child ? ' · Menor / Estudiante' : ''}
                {linkedFamilyMembers.length > 0
                  ? ` · ${linkedFamilyMembers.length} familiar(es)`
                  : ''}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Datos civiles, filiación familiar, oficios de apoyo e identificador único en la congregación
            </p>
          </div>
        </div>

        {/* Edad Calculada y Etapa (Tabular Nums) */}
        {ageInfo && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto bg-zinc-50 dark:bg-white/[0.02] px-3.5 py-2 rounded-xl border border-zinc-200/70 dark:border-white/[0.06]">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 text-xs font-bold font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                <Calendar size={13} className="text-indigo-500" />
                <span>{ageInfo.age} años</span>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span className="font-sans text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  {ageInfo.stageLabel}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Nacido el {ageInfo.formattedDayMonth}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Nombre Completo para Mostrar + Desglose en 4 Campos */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.06] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <User size={13} className="text-indigo-500" />
              <span>Nombre Completo en Listas, Programas (S-140) y Tarjeta S-21</span>
            </label>
            <button
              type="button"
              onClick={handleAutoSplitFullName}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/50 hover:bg-indigo-50 transition-colors cursor-pointer self-start sm:self-auto"
              title="Separar automáticamente el nombre completo en nombres y apellidos"
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
            className="kf-input w-full bg-white dark:bg-zinc-900 font-semibold text-sm"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {[
              { id: 'first_name', label: 'Primer Nombre', placeholder: 'Ej. Juan' },
              { id: 'middle_name', label: 'Segundo Nombre', placeholder: 'Ej. Carlos' },
              { id: 'last_name', label: 'Primer Apellido', placeholder: 'Ej. Pérez' },
              { id: 'second_last_name', label: 'Segundo Apellido', placeholder: 'Ej. Gómez' },
            ].map((field) => (
              <div key={field.id}>
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
                  {field.label}
                </label>
                <input
                  type="text"
                  value={(formData as any)[field.id] || ''}
                  onChange={(e) => handleChange(field.id as any, e.target.value)}
                  placeholder={field.placeholder}
                  className="kf-input w-full bg-white dark:bg-zinc-900"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ID Único Inmutable del Publicador y Género */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <span>ID Único del Publicador</span>
            </label>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              <Lock size={10} /> Permanente • No modificable
            </span>
          </div>
          <div className="relative flex items-center">
            <div className="w-full h-[42px] px-3.5 rounded-xl bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between select-all">
              <div className="flex items-center gap-2.5 min-w-0">
                <ShieldCheck size={15} className="text-indigo-500 shrink-0" />
                <span className="font-mono font-bold text-sm tracking-wider text-zinc-800 dark:text-zinc-100 truncate">
                  {uniquePublisherId}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyUniqueId}
                title="Copiar ID único del publicador"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-zinc-200/70 dark:border-white/[0.08] shadow-2xs transition-all cursor-pointer shrink-0 active:scale-95"
              >
                {copiedId ? (
                  <>
                    <Check size={12} className="text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copiar ID</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 pl-1 flex items-center gap-1">
            <Lock size={10} className="shrink-0 text-zinc-400" />
            <span>Identificador permanente que preserva el historial de asignaciones aunque cambie el nombre.</span>
          </p>
        </div>

        <div>
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
            Sexo / Género (Registro S-21)
          </label>
          <div className="flex p-1 bg-zinc-100 dark:bg-white/[0.04] rounded-xl h-[42px] border border-black/[0.04] dark:border-white/[0.04]">
            <button
              type="button"
              onClick={() => handleChange('gender', 'male')}
              className={`flex items-center justify-center gap-2 flex-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                formData.gender === 'male' || formData.gender === 'hermano'
                  ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <User size={13} />
              <span>Hermano (Hombre)</span>
            </button>
            <button
              type="button"
              onClick={() => handleChange('gender', 'female')}
              className={`flex items-center justify-center gap-2 flex-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                formData.gender === 'female' || formData.gender === 'hermana'
                  ? 'bg-white dark:bg-[#1e293b] text-rose-500 dark:text-rose-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <User size={13} />
              <span>Hermana (Mujer)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fecha de Nacimiento y Estado Civil */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
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
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200/70 dark:border-amber-800/50 hover:bg-amber-100 cursor-pointer"
            >
              <CheckCircle2 size={12} />
              <span>Tiene {ageInfo.age} años • ¿Marcar como «Edad Avanzada» en ficha?</span>
            </button>
          )}
          {ageInfo?.isMinor && !formData.is_child && (
            <button
              type="button"
              onClick={() => handleChange('is_child', true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/50 px-2.5 py-1 rounded-lg border border-pink-200/70 dark:border-pink-800/50 hover:bg-pink-100 cursor-pointer"
            >
              <Baby size={12} />
              <span>Tiene {ageInfo.age} años • ¿Marcar como «Menor / Niño» en ficha?</span>
            </button>
          )}
        </div>

        <div>
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
            Estado Civil
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
                  className={`py-2 px-2 text-center rounded-xl text-xs font-semibold transition-all border cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 shadow-2xs font-bold'
                      : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 border-zinc-200/60 dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* Roles en el hogar siempre disponibles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
            <button
              type="button"
              onClick={() => handleChange('is_head_of_household', !formData.is_head_of_household)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                formData.is_head_of_household
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-300 border-zinc-200/70 dark:border-white/[0.06] hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Home size={14} />
                <span>Cabeza de Familia</span>
              </div>
              <CheckCircle2 size={14} className={formData.is_head_of_household ? 'opacity-100' : 'opacity-30'} />
            </button>

            <button
              type="button"
              onClick={() => handleChange('is_child', !formData.is_child)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                formData.is_child
                  ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                  : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-300 border-zinc-200/70 dark:border-white/[0.06] hover:border-pink-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Baby size={14} />
                <span>Menor de Edad / Hijo</span>
              </div>
              <CheckCircle2 size={14} className={formData.is_child ? 'opacity-100' : 'opacity-30'} />
            </button>
          </div>
        </div>
      </div>

      {/* Datos Conyugales si está casado */}
      {formData.marital_status === 'casado' && (
        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
          <div>
            <label className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 mb-1.5 block">
              Seleccionar Cónyuge en la Congregación
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
              aria-label="Seleccionar cónyuge de la congregación"
              className="kf-input w-full bg-white dark:bg-zinc-900 text-xs"
            >
              <option value="">— Seleccionar del directorio de la congregación —</option>
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
            <label className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 mb-1.5 block">
              Nombre del Esposo(a) (si no pertenece a la congregación)
            </label>
            <div className="relative">
              <Heart
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400"
              />
              <input
                type="text"
                value={formData.spouse_name || ''}
                onChange={(e) => handleChange('spouse_name', e.target.value)}
                className="kf-input kf-input-icon w-full bg-white dark:bg-zinc-900"
                placeholder="Nombre completo del cónyuge"
              />
            </div>
          </div>
        </div>
      )}

      {/* Padre / Madre / Tutor si es menor de edad */}
      {formData.is_child && (
        <div className="p-4 rounded-2xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200/70 dark:border-pink-900/40 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
          <div>
            <label className="text-[11px] font-semibold text-pink-900 dark:text-pink-300 mb-1.5 block">
              Padre, Madre o Tutor Responsable en la Congregación
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
            <label className="text-[11px] font-semibold text-pink-900 dark:text-pink-300 mb-1.5 block">
              Nombre del Padre / Tutor Responsable
            </label>
            <input
              type="text"
              value={formData.parent_guardian_name || ''}
              onChange={(e) => handleChange('parent_guardian_name', e.target.value)}
              className="kf-input w-full bg-white dark:bg-zinc-900"
              placeholder="Nombre del padre, madre o tutor"
            />
          </div>
        </div>
      )}

      {/* NÚCLEO FAMILIAR Y AGRUPACIÓN INTELIGENTE */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.06] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Users size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Núcleo Familiar y Agrupación en Reuniones
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Misma Noche
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Vincula padres, hijos, cónyuge o hermanos carnales para priorizar asignarlos la misma noche y validar parejas familiares en demostraciones VMC y carritos.
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
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              formData.groupWithFamilyInMeetings !== false
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
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

        {/* Lista de familiares vinculados */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block">
            Familiares vinculados en la congregación ({linkedFamilyMembers.length})
          </label>
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
                    className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                  >
                    {isSpouse ? (
                      <Heart size={12} className="text-rose-500 shrink-0" />
                    ) : (
                      <Users size={12} className="text-indigo-500 shrink-0" />
                    )}
                    <span>{getPubDisplayName(fam)}</span>
                    {isSpouse && (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        (Cónyuge)
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFamilyMember(fam)}
                      aria-label={`Desvincular a ${getPubDisplayName(fam)}`}
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

        {/* Buscador para añadir cualquier familiar de la congregación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="relative">
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
              Añadir familiar de la congregación (Padre, Madre, Hijo, Hermano)
            </label>
            <input
              type="text"
              value={familySearch}
              onChange={(e) => setFamilySearch(e.target.value)}
              placeholder="Escribe el nombre para vincular..."
              className="kf-input w-full bg-white dark:bg-zinc-900 text-xs"
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

          {/* Sugerencias inteligentes por apellido o dirección */}
          {familySuggestions.length > 0 && (
            <div>
              <label className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 mb-1 block">
                Sugerencias detectadas por apellido o domicilio
              </label>
              <div className="flex flex-wrap gap-1.5">
                {familySuggestions.slice(0, 5).map(({ publisher: sug, reason }) => (
                  <button
                    key={getPubId(sug)}
                    type="button"
                    onClick={() => handleAddFamilyMember(sug)}
                    title={reason}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer"
                  >
                    <UserPlus size={12} className="text-emerald-600 shrink-0" />
                    <span>{getPubDisplayName(sug)}</span>
                    <span className="text-[9px] opacity-75">({reason})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profesión, Oficios / Habilidades de Apoyo e Idiomas */}
      <div className="space-y-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
              Profesión / Ocupación Habitual
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
                className="kf-input kf-input-icon w-full"
                placeholder="Ej. Docente, Electricista, Enfermero, Jubilado, Estudiante"
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 pl-1">
              Útil para coordinar mantenimiento del Salón, emergencias y voluntariado LDC
            </p>
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
              Idiomas que Habla o Domina
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
                className="kf-input kf-input-icon w-full"
                placeholder="Ej. Español, Inglés, Lengua de Señas"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {SUGGESTED_LANGUAGES.map((lang) => {
                const active = currentLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleToggleLanguage(lang)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 border-zinc-200 dark:border-white/[0.06] hover:border-indigo-300'
                    }`}
                  >
                    {active ? `✓ ${lang}` : `+ ${lang}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Habilidades Prácticas y Oficios para el Salón / Emergencias */}
        <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.06] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wrench size={15} className="text-indigo-500" />
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Oficios y Habilidades Prácticas (Mantenimiento, Emergencias y Salón)
              </span>
              {currentSkills.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {currentSkills.length} seleccionada(s)
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
                placeholder="Otra habilidad..."
                className="px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                title="Añadir habilidad personalizada"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set([...SUGGESTED_SKILLS, ...currentSkills])).map((skill) => {
              const isSelected = currentSkills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleToggleSkill(skill)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-300'
                  }`}
                >
                  {isSelected && <Check size={11} />}
                  <span>{skill}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
