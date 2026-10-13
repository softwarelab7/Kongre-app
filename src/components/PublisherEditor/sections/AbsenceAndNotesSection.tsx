import React from 'react';
import { Publisher } from '../../../types';
import { 
  CalendarDays, 
  Plus, 
  Plane, 
  Trash2, 
  History 
} from 'lucide-react';

interface AbsenceAndNotesSectionProps {
  formData: Publisher;
  handleChange: (field: keyof Publisher, value: any) => void;
  setShowAbsenceModal: (show: boolean) => void;
  handleDeleteAbsence: (id: string) => void;
}

export const AbsenceAndNotesSection: React.FC<AbsenceAndNotesSectionProps> = ({
  formData,
  handleChange,
  setShowAbsenceModal,
  handleDeleteAbsence
}) => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
       {/* Absence Card */}
       <div className="bg-white dark:bg-[#0f1623] rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-white/[0.06] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                   <CalendarDays size={18} />
                </div>
                <div>
                   <h3 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200">Periodos de Ausencia</h3>
                   <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Seguimiento de inactividad temporal</p>
                </div>
             </div>
             <button onClick={() => setShowAbsenceModal(true)} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[12px] font-medium transition-all hover:bg-indigo-100 dark:hover:bg-indigo-500/20 flex items-center gap-2">
                <Plus size={14} /> Registrar
             </button>
          </div>
          
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin flex-1">
            {(formData.ausencias || []).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-6 opacity-40">
                <Plane size={32} className="text-zinc-400 mb-2" />
                <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">Sin registros</p>
              </div>
            ) : (
              (formData.ausencias || []).map(abs => (
                <div key={abs.id} className="flex items-center justify-between bg-zinc-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-zinc-100 dark:border-white/[0.04] shadow-sm group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">{abs.start_date}</span>
                      <span className="text-[11px] text-zinc-400 font-medium px-1.5 py-0.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-md">al</span>
                      <span className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">{abs.end_date}</span>
                    </div>
                    {abs.reason && <p className="text-[11px] text-zinc-500 font-medium line-clamp-1">{abs.reason}</p>}
                  </div>
                  <button onClick={() => handleDeleteAbsence(abs.id)} className="p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
       </div>

       {/* Notes Card */}
       <div className="bg-white dark:bg-[#0f1623] rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-white/[0.06] shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
               <History size={18} />
            </div>
            <div>
               <h3 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200">Historial y Notas</h3>
               <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Administración y seguimiento</p>
            </div>
          </div>
          <textarea 
            value={(formData as any).notes || ''}
            onChange={e => handleChange('notes', e.target.value)}
            className="kf-input w-full resize-none"
            placeholder="Escribe hitos importantes o notas administrativas aquí..."
            style={{ minHeight: '180px' }}
          />
       </div>
    </section>
  );
};
