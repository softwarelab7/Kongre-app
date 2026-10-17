import React from 'react';
import { Publisher } from '../../../types';
import { 
  Check, 
  Clock, 
  Sparkles,
  TrendingUp,
  Download,
  CalendarDays,
  Award,
  Lock
} from 'lucide-react';

import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../context/AuthContext';

interface S21RecordsSectionProps {
  formData: Publisher;
  selectedServiceYear: string;
  setSelectedServiceYear: (val: string) => void;
  handleS21ChangeLocal: (monthIdx: number, field: string, value: any) => void;
}

export const S21RecordsSection: React.FC<S21RecordsSectionProps> = ({
  formData,
  selectedServiceYear,
  setSelectedServiceYear,
  handleS21ChangeLocal
}) => {

  const months = ['septiembre', 'octubre', 'noviembre', 'diciembre', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto'];
  const currentRecords = (formData.s21_records || {})[selectedServiceYear] || Array(12).fill(null).map((_, i) => ({
    month: months[i],
    participated: false,
    bible_studies: 0,
    auxiliary_pioneer: false,
    hours: 0,
    credit: 0,
    late: false,
    comments: ''
  }));

  const { showToast } = useToast();
  const { canEditS21 } = usePermissions();

  const chartData = currentRecords.map((record: any) => ({
    name: record.month.substring(0, 3).toUpperCase(),
    horas: (record.hours || 0) + (record.credit || 0),
    estudios: record.bible_studies || 0
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-4xl mx-auto w-full">
      {!canEditS21 && (
        <div className="flex items-center gap-2.5 p-3 text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl shadow-2xs">
          <Lock size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Modo solo lectura:</strong> Las tarjetas de registro S-21 solo pueden ser modificadas por el Secretario o el Coordinador.
          </span>
        </div>
      )}
      
      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-white dark:bg-[#0f1623] p-4 md:p-6 rounded-[2rem] border border-zinc-100 dark:border-white/[0.04] shadow-sm">
        
        {/* CABECERA INTEGRADA */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#f59e0b] text-white rounded-xl flex items-center justify-center shadow-md shadow-[#f59e0b]/20">
                 <TrendingUp size={16} />
              </div>
              <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">Registro Predicación</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="flex items-center bg-[#f4f4f7] dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200/50 dark:border-white/[0.06]">
                {['2025', '2026'].map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedServiceYear(year)}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      selectedServiceYear === year 
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20' 
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    Año {year}
                  </button>
                ))}
             </div>
             

          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar pb-2">
          <table className="w-full text-left border-separate border-spacing-y-1">
            <thead>
              <tr className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400">
                <th className="pb-3 px-3 font-black">Mes</th>
                <th className="pb-3 px-2 text-center">Part.</th>
                <th className="pb-3 px-2 text-center">Estudios</th>
                <th className="pb-3 px-2 text-center">P. Aux.</th>
                <th className="pb-3 px-2 text-center">Horas</th>
                <th className="pb-3 px-2 text-center">Crédito</th>
                <th className="pb-3 px-2 text-center">Tarde</th>
                <th className="pb-3 px-3 min-w-[150px]">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.map((record: any, idx: number) => {
                const displayMonth = record.month.charAt(0).toUpperCase() + record.month.slice(1);
                const isActive = record.participated || record.hours > 0;
                
                return (
                  <tr key={idx} className={`group transition-all rounded-xl ${isActive ? 'bg-[#fffbeb] dark:bg-amber-900/10' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'}`}>
                    <td className="py-1.5 px-3 rounded-l-xl">
                      <div className="flex items-center gap-2">
                         <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${isActive ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-500/20 text-amber-600' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200/50 dark:border-white/5 text-zinc-400'}`}>
                           <CalendarDays size={12} />
                         </div>
                         <span className={`text-[12px] font-bold ${isActive ? 'text-amber-700 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                           {displayMonth}
                         </span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2">
                      <button 
                        disabled={!canEditS21}
                        onClick={() => handleS21ChangeLocal(idx, 'participated', !record.participated)}
                        className={`w-7 h-7 mx-auto rounded-lg border transition-all flex items-center justify-center ${!canEditS21 ? 'opacity-60 cursor-not-allowed' : ''} ${record.participated ? 'bg-amber-500 border-transparent text-white shadow-sm shadow-amber-500/30' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/[0.08] hover:border-amber-300'}`}
                      >
                        {record.participated && <Check size={14} strokeWidth={4} />}
                      </button>
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <div className="relative inline-block w-14">
                        <input 
                          type="number" 
                          disabled={!canEditS21}
                          value={record.bible_studies || ''} 
                          onChange={e => handleS21ChangeLocal(idx, 'bible_studies', parseInt(e.target.value) || 0)}
                          className={`w-full h-8 bg-white dark:bg-zinc-900 border rounded-lg text-center text-[12px] font-black focus:ring-0 outline-none transition-all ${!canEditS21 ? 'opacity-60 cursor-not-allowed' : ''} ${record.bible_studies > 0 ? 'border-amber-500/30 text-amber-600 bg-amber-50/50 dark:bg-amber-900/20' : 'border-zinc-200/50 dark:border-white/[0.04] text-zinc-600 focus:border-amber-500/50'}`}
                          placeholder="0"
                        />
                      </div>
                    </td>
                    <td className="py-1.5 px-2">
                      <button 
                        disabled={!canEditS21}
                        onClick={() => handleS21ChangeLocal(idx, 'auxiliary_pioneer', !record.auxiliary_pioneer)}
                        className={`w-7 h-7 mx-auto rounded-lg border transition-all flex items-center justify-center ${!canEditS21 ? 'opacity-60 cursor-not-allowed' : ''} ${record.auxiliary_pioneer ? 'bg-[#10b981] border-transparent text-white shadow-sm shadow-[#10b981]/30' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/[0.08] hover:border-[#10b981]/40'}`}
                      >
                        {record.auxiliary_pioneer && <Award size={14} strokeWidth={4} />}
                      </button>
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <input 
                        type="number" 
                        disabled={!canEditS21}
                        value={record.hours || ''} 
                        onChange={e => handleS21ChangeLocal(idx, 'hours', parseInt(e.target.value) || 0)}
                        className={`w-14 h-8 mx-auto bg-white dark:bg-zinc-900 border rounded-lg text-center text-[12px] font-black focus:ring-0 outline-none transition-all ${!canEditS21 ? 'opacity-60 cursor-not-allowed' : ''} ${record.hours > 0 ? 'border-amber-500/30 text-amber-600 bg-amber-50/50 dark:bg-amber-900/20' : 'border-zinc-200/50 dark:border-white/[0.04] text-zinc-600 focus:border-amber-500/50'}`}
                        placeholder="0"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <input 
                        type="number" 
                        disabled={!canEditS21}
                        value={record.credit || ''} 
                        onChange={e => handleS21ChangeLocal(idx, 'credit', parseInt(e.target.value) || 0)}
                        className={`w-14 h-8 mx-auto bg-white dark:bg-zinc-900 border rounded-lg text-center text-[12px] font-black focus:ring-0 outline-none transition-all ${!canEditS21 ? 'opacity-60 cursor-not-allowed' : ''} ${record.credit > 0 ? 'border-blue-500/30 text-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'border-zinc-200/50 dark:border-white/[0.04] text-zinc-600 focus:border-blue-500/50'}`}
                        placeholder="0"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <button 
                        disabled={!canEditS21}
                        onClick={() => handleS21ChangeLocal(idx, 'late', !record.late)}
                        className={`w-7 h-7 mx-auto rounded-lg border transition-all flex items-center justify-center ${!canEditS21 ? 'opacity-60 cursor-not-allowed' : ''} ${record.late ? 'bg-rose-500 border-transparent text-white shadow-sm shadow-rose-500/30' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/[0.08] hover:border-rose-300'}`}
                      >
                        {record.late && <Clock size={14} strokeWidth={4} />}
                      </button>
                    </td>
                    <td className="py-1.5 px-3 rounded-r-xl">
                      <input 
                        type="text" 
                        disabled={!canEditS21}
                        value={record.comments || ''} 
                        onChange={e => handleS21ChangeLocal(idx, 'comments', e.target.value)}
                        placeholder="Observaciones..."
                        className={`kf-input ${!canEditS21 ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GRÁFICO HISTÓRICO */}
      <div className="bg-white dark:bg-[#0f1623] p-4 md:p-6 rounded-[2rem] border border-zinc-100 dark:border-white/[0.04] shadow-sm mt-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Rendimiento del Año {selectedServiceYear}</h4>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> Horas
            </span>
            <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
              <span className="w-3 h-1 bg-violet-500 inline-block rounded-full" /> Estudios
            </span>
          </div>
        </div>
        <div className="h-56 w-full relative pt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
            {/* Grid lines */}
            {[20, 65, 110, 155].map((y, idx) => (
              <line key={idx} x1="10" y1={y} x2="590" y2={y} stroke="currentColor" className="text-zinc-200 dark:text-white/5" strokeDasharray="3 3" />
            ))}
            {/* Bars for Horas */}
            {chartData.map((d: any, idx: number) => {
              const maxHours = Math.max(30, ...chartData.map((c: any) => c.horas));
              const height = maxHours > 0 ? (d.horas / maxHours) * 135 : 0;
              const x = idx * 48 + 22;
              const y = 160 - height;
              return (
                <g key={idx} className="group cursor-pointer">
                  <rect
                    x={x}
                    y={y}
                    width={22}
                    height={Math.max(2, height)}
                    rx={4}
                    className="fill-amber-500 hover:fill-amber-400 transition-colors"
                  />
                  <text
                    x={x + 11}
                    y={180}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-zinc-400 select-none"
                  >
                    {d.name}
                  </text>
                  {d.horas > 0 && (
                    <text
                      x={x + 11}
                      y={Math.max(14, y - 4)}
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-amber-600 dark:fill-amber-400 select-none opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {d.horas}h
                    </text>
                  )}
                </g>
              );
            })}
            {/* Line for Estudios */}
            {(() => {
              const maxEstudios = Math.max(5, ...chartData.map((c: any) => c.estudios));
              const points = chartData.map((d: any, idx: number) => {
                const x = idx * 48 + 33;
                const y = 160 - (d.estudios / maxEstudios) * 120;
                return `${x},${y}`;
              }).join(' ');
              return (
                <>
                  <polyline
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    points={points}
                  />
                  {chartData.map((d: any, idx: number) => {
                    const x = idx * 48 + 33;
                    const y = 160 - (d.estudios / maxEstudios) * 120;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r={3.5}
                        fill="#fff"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                      />
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* RESUMEN ANUAL TIPO BANNER */}
      <div className="bg-amber-500 dark:bg-[#d97706] rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-xl shadow-amber-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-20 -mt-32 blur-3xl group-hover:bg-white/20 transition-all duration-700 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -ml-20 -mb-20 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/30 transform group-hover:rotate-12 transition-transform duration-500">
              <Sparkles size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-bold leading-none text-white">Resumen Anual</h4>
              <p className="text-[12px] font-bold text-white/80 mt-2">Cierre de año de servicio {selectedServiceYear}</p>
            </div>
          </div>
          
          <div className="flex gap-1 bg-black/10 backdrop-blur-md p-1.5 rounded-3xl border border-white/10 w-full md:w-auto overflow-x-auto">
            <div className="flex flex-col items-center justify-center px-8 py-3 bg-white/5 rounded-2xl min-w-[120px]">
              <p className="text-[11px] font-bold text-white/70 mb-1">Total Horas</p>
              <p className="text-3xl font-black text-white">{currentRecords.reduce((acc: number, r: any) => acc + (r.hours || 0) + (r.credit || 0), 0)}</p>
            </div>
            <div className="flex flex-col items-center justify-center px-8 py-3 bg-white/5 rounded-2xl min-w-[120px]">
              <p className="text-[11px] font-bold text-white/70 mb-1">Promedio</p>
              <p className="text-3xl font-black text-white">{(currentRecords.reduce((acc: number, r: any) => acc + (r.hours || 0), 0) / (currentRecords.filter((r: any) => r.participated).length || 1)).toFixed(1)}</p>
            </div>
            <div className="flex flex-col items-center justify-center px-8 py-3 bg-white/5 rounded-2xl min-w-[120px]">
              <p className="text-[11px] font-bold text-white/70 mb-1">Max. Estudios</p>
              <p className="text-3xl font-black text-white">{Math.max(0, ...currentRecords.map((r: any) => r.bible_studies || 0))}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
