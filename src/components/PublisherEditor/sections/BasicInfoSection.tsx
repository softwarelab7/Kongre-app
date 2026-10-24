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
  Sparkles,
  Lock,
  Copy,
  Check,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';

interface BasicInfoSectionProps {
  formData: Publisher;
  handleChange: (field: keyof Publisher, value: any) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ formData, handleChange }) => {
  const { publishers } = useCongregation();
  const [copiedId, setCopiedId] = useState(false);
  const [familySearch, setFamilySearch] = useState('');

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

  // Cálculo de edad cronológica
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

      return {
        age: age >= 0 ? age : null,
      };
    } catch {
      return null;
    }
  }, [formData.birth_date, formData.birthDate]);

  return (
    <section className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm transition-all space-y-5 sm:space-y-6">
      {/* Cabecera y Resumen de Perfil Personal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-white/[0.04]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shadow-xs shrink-0 ring-4 ring-indigo-500/5">
            {formData.gender === 'female' || formData.gender === 'hermana' ? '♀' : '♂'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Información Personal
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                <Lock size={10} /> {uniquePublisherId}
              </span>
              {formData.is_head_of_household && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                  <Home size={10} /> Cabeza de familia
                </span>
              )}
              {linkedFamilyMembers.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                  <Users size={10} /> {linkedFamilyMembers.length} familiar(es) en congregación
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Datos personales, filiación e identificador único congregacional del publicador
            </p>
          </div>
        </div>

        {/* Badge de Edad Calculada */}
        {ageInfo?.age !== null && ageInfo?.age !== undefined && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-zinc-50 dark:bg-white/[0.03] px-3 py-1.5 rounded-xl border border-zinc-200/60 dark:border-white/[0.06]">
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                <Calendar size={13} className="text-indigo-500" />
                <span>{ageInfo.age} años</span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Edad registrada
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid de Nombres y Apellidos */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2.5 block">
          Nombres y Apellidos
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: 'first_name', label: 'Primer Nombre', placeholder: 'Ej. Juan' },
            { id: 'middle_name', label: 'Segundo Nombre', placeholder: 'Ej. Carlos' },
            { id: 'last_name', label: 'Primer Apellido', placeholder: 'Ej. Pérez' },
            { id: 'second_last_name', label: 'Segundo Apellido', placeholder: 'Ej. Gómez' },
          ].map((field) => (
            <div key={field.id}>
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
                {field.label}
              </label>
              <input
                type="text"
                value={(formData as any)[field.id] || ''}
                onChange={(e) => handleChange(field.id as any, e.target.value)}
                placeholder={field.placeholder}
                className="kf-input w-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ID Único Inmutable del Publicador y Género */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
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
            <div className="w-full h-[42px] px-3.5 rounded-xl bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between select-all cursor-not-allowed">
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
            <span>Generado automáticamente para este publicador. No se puede cambiar nunca.</span>
          </p>
        </div>

        <div>
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
            Género
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
              <span>Hermano (Varón)</span>
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
        <div>
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
            Fecha de Nacimiento
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
        </div>

        <div>
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
            Estado Civil
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'soltero', label: 'Soltero(a)' },
              { id: 'casado', label: 'Casado(a)' },
              { id: 'viudo', label: 'Viudo(a)' },
              { id: 'divorciado', label: 'Divorciado(a)' },
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
        </div>
      </div>

      {/* Datos Conyugales y Cabeza de Familia (si está casado o se selecciona) */}
      {formData.marital_status === 'casado' && (
        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
          <div>
            <label className="text-[11px] font-medium text-indigo-900 dark:text-indigo-300 mb-1.5 block">
              Cónyuge en la Congregación (o Nombre)
            </label>
            <div className="space-y-2">
              <select
                value={formData.spouse_nid || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  handleChange('spouse_nid', selectedId);
                  const found = (publishers || []).find(
                    (p) => getPubId(p) === selectedId
                  );
                  if (found) {
                    handleChange('spouse_name', getPubDisplayName(found));
                    handleAddFamilyMember(found);
                  }
                }}
                aria-label="Seleccionar cónyuge de la congregación"
                className="kf-input w-full bg-white dark:bg-zinc-900 text-xs"
              >
                <option value="">— Seleccionar cónyuge del directorio (opcional) —</option>
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
                  placeholder="O escribe el nombre del esposo(a) si no está en lista"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <label className="text-[11px] font-medium text-indigo-900 dark:text-indigo-300 mb-2 block">
              Rol Familiar en el Hogar
            </label>
            <button
              type="button"
              onClick={() =>
                handleChange('is_head_of_household', !formData.is_head_of_household)
              }
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs font-medium cursor-pointer ${
                formData.is_head_of_household
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Home size={15} />
                <span>¿Es Cabeza de Familia?</span>
              </div>
              <CheckCircle2
                size={16}
                className={formData.is_head_of_household ? 'opacity-100' : 'opacity-30'}
              />
            </button>
          </div>
        </div>
      )}

      {/* NÚCLEO FAMILIAR Y AGRUPACIÓN INTELIGENTE (ESTILO KHS FAMILY SCHEDULING) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.06] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Users size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Núcleo Familiar y Agrupación en Reuniones (KHS)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Same-Night Grouping
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Vincula padres, hijos, cónyuge o hermanos carnales para priorizar asignarlos la misma noche y validar parejas familiares en demostraciones VMC (pauta S-38).
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
            <Sparkles size={14} />
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

      {/* Ocupación y Habilidades Útiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-zinc-100 dark:border-white/[0.04]">
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
              placeholder="Ej. Docente, Electricista, Jubilado, Estudiante"
            />
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 pl-1">
            Ayuda a los ancianos a coordinar labores y apoyo teocrático
          </p>
        </div>

        <div>
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
            Idiomas
          </label>
          <div className="relative">
            <Languages
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              value={
                Array.isArray(formData.languages)
                  ? formData.languages.join(', ')
                  : (formData.languages as any) || ''
              }
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
          <p className="text-[10px] text-zinc-400 mt-1 pl-1">
            Separados por coma para grupos de idiomas y asambleas
          </p>
        </div>
      </div>
    </section>
  );
};
