import React from 'react';
import { Publisher } from '../../../types';
import { 
  Activity, 
  User, 
  Ear, 
  Eye, 
  Lock, 
  Home, 
  Baby, 
  Truck 
} from 'lucide-react';

interface SpecialConditionsSectionProps {
  formData: Publisher;
  handleChange: (field: keyof Publisher, value: any) => void;
}

export const SpecialConditionsSection: React.FC<SpecialConditionsSectionProps> = ({ formData, handleChange }) => {
  const conditions = [
    { id: 'is_elderly', label: 'Edad Avanzada', icon: <User size={14} />, color: 'bg-amber-500/10 text-amber-600 border-amber-200/50' },
    { id: 'is_infirm', label: 'Enfermo', icon: <Activity size={14} />, color: 'bg-rose-500/10 text-rose-600 border-rose-200/50' },
    { id: 'is_deaf', label: 'Sordo', icon: <Ear size={14} />, color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200/50' },
    { id: 'is_blind', label: 'Ciego', icon: <Eye size={14} />, color: 'bg-sky-500/10 text-sky-600 border-sky-200/50' },
    { id: 'is_imprisoned', label: 'Encarcelado', icon: <Lock size={14} />, color: 'bg-red-500/10 text-red-600 border-red-200/50' },
    { id: 'is_head_of_household', label: 'Cabeza de Familia', icon: <Home size={14} />, color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200/50' },
    { id: 'is_child', label: 'Niño', icon: <Baby size={14} />, color: 'bg-pink-500/10 text-pink-600 border-pink-200/50' },
    { id: 'is_moved', label: 'Se mudó', icon: <Truck size={14} />, color: 'bg-orange-500/10 text-orange-600 border-orange-200/50' }
  ];

  return (
    <section className="bg-zinc-50 dark:bg-[#0f1623] rounded-3xl p-6 md:p-8 border border-zinc-100 dark:border-white/[0.06] shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400">
          <Activity size={18} />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200">Situación Especial</h3>
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Indicadores especiales para registros congregacionales</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {conditions.map(item => {
          const isSel = !!(formData as any)[item.id];
          return (
            <button 
              key={item.id}
              onClick={() => handleChange(item.id as any, !isSel)}
              className={`py-2.5 px-4 rounded-2xl text-[12px] font-medium transition-all border flex items-center justify-center gap-2.5 ${isSel ? `${item.color} shadow-sm ring-1 ring-black/5 dark:ring-white/10` : 'bg-white dark:bg-[#1a1a24] text-zinc-500 border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.12]'}`}
            >
              <span className={isSel ? '' : 'text-zinc-400 dark:text-zinc-500'}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};
