// src/components/PublisherEditor/sections/BasicInfoSection.tsx
import React, { useMemo } from 'react';
import { Publisher } from '../../../types';
import { PremiumDatePicker } from '../../PremiumDatePicker';
import {
  User,
  FileText,
  Heart,
  Home,
  Cake,
  Briefcase,
  Languages,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface BasicInfoSectionProps {
  formData: Publisher;
  handleChange: (field: keyof Publisher, value: any) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ formData, handleChange }) => {
  // Cálculo de edad exacta y próximo cumpleaños
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

      // Próximo cumpleaños
      const nextBday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      if (nextBday < today) {
        nextBday.setFullYear(today.getFullYear() + 1);
      }
      const diffTime = nextBday.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        age: age >= 0 ? age : null,
        daysUntilBirthday: daysUntil,
        isBirthdaySoon: daysUntil <= 30 && daysUntil >= 0,
        isBirthdayToday: daysUntil === 0,
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
            {formData.gender === 'female' ? '♀' : '♂'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Información Personal
              </h3>
              {formData.is_head_of_household && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                  <Home size={10} /> Cabeza de familia
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Datos civiles, filiación y registro básico del publicador
            </p>
          </div>
        </div>

        {/* Badge de Edad y Cumpleaños */}
        {ageInfo?.age !== null && ageInfo?.age !== undefined && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-zinc-50 dark:bg-white/[0.03] px-3 py-1.5 rounded-xl border border-zinc-200/60 dark:border-white/[0.06]">
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                <Cake size={13} className="text-indigo-500" />
                <span>{ageInfo.age} años</span>
              </div>
              <p className="text-[10px] text-zinc-400">
                {ageInfo.isBirthdayToday
                  ? '¡Cumpleaños hoy!'
                  : ageInfo.isBirthdaySoon
                  ? `Cumple en ${ageInfo.daysUntilBirthday} días`
                  : 'Registrado'}
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

      {/* Documento ID y Género */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        <div>
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
            Documento de Identidad / NID
          </label>
          <div className="relative">
            <FileText
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              value={formData.nid || ''}
              onChange={(e) => handleChange('nid', e.target.value)}
              className="kf-input kf-input-icon w-full"
              placeholder="Cédula, DNI o ID congregacional"
            />
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 pl-1">
            Identificador único para tarjetas de registro S-21 y sucursal
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
                formData.gender === 'male'
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
                formData.gender === 'female'
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
              Nombre del Cónyuge
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
                placeholder="Nombre completo del esposo(a)"
              />
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
