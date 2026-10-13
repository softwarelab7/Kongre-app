import React from 'react';
import { Publisher } from '../../../types';
import { PremiumDatePicker } from '../../PremiumDatePicker';
import { User, FileText } from 'lucide-react';

interface BasicInfoSectionProps {
  formData: Publisher;
  handleChange: (field: keyof Publisher, value: any) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ formData, handleChange }) => {
  return (
    <section className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
          <User size={18} />
        </div>
        <h3 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200">Información Básica</h3>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'first_name', label: 'Primer Nombre' },
            { id: 'middle_name', label: 'Segundo Nombre' },
            { id: 'last_name', label: 'Primer Apellido' },
            { id: 'second_last_name', label: 'Segundo Apellido' }
          ].map(field => (
            <div key={field.id}>
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block ml-1">{field.label}</label>
              <input 
                type="text" 
                value={(formData as any)[field.id] || ''}
                onChange={e => handleChange(field.id as any, e.target.value)}
                className="kf-input w-full"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block ml-1">ID Personal (NID)</label>
            <div className="relative">
              <FileText size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                value={formData.nid || ''}
                onChange={e => handleChange('nid', e.target.value)}
                className="kf-input kf-input-icon w-full"
                placeholder="Documento o ID único"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 mt-2 border-t border-zinc-100 dark:border-white/[0.04]">
          <div>
            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-2 block ml-1">Género</label>
            <div className="flex p-1 bg-zinc-100 dark:bg-white/[0.04] rounded-xl h-[38px] border border-black/[0.04] dark:border-white/[0.04]">
              <button onClick={() => handleChange('gender', 'male')} className={`flex items-center justify-center gap-2 flex-1 rounded-lg text-[12px] font-medium transition-all ${formData.gender === 'male' ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}>
                Hombre
              </button>
              <button onClick={() => handleChange('gender', 'female')} className={`flex items-center justify-center gap-2 flex-1 rounded-lg text-[12px] font-medium transition-all ${formData.gender === 'female' ? 'bg-white dark:bg-[#1e293b] text-rose-500 dark:text-rose-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}>
                Mujer
              </button>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-2 block ml-1">Fecha de Nacimiento</label>
            <PremiumDatePicker 
              value={formData.birth_date || ''} 
              onChange={val => handleChange('birth_date', val)} 
              accentColor="indigo"
              allowFutureYears={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
