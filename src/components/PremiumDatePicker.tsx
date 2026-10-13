import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';

export interface PremiumDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  accentColor?: 'indigo' | 'violet' | 'emerald' | 'rose' | 'amber';
  size?: 'sm' | 'md';
  allowFutureYears?: boolean;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

export const PremiumDatePicker: React.FC<PremiumDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Seleccionar fecha',
  accentColor = 'indigo',
  size = 'md',
  allowFutureYears = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'years'>('days');
  const [viewDate, setViewDate] = useState(value ? new Date(value + 'T00:00:00') : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync view date with value when opened
  useEffect(() => {
    if (isOpen && value) {
      setViewDate(new Date(value + 'T00:00:00'));
      setViewMode('days');
    }
  }, [isOpen, value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(formatDate(newDate));
    setIsOpen(false);
  };

  const handleYearClick = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setViewMode('days');
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const isSelected = (day: number) => {
    if (!value) return false;
    const currentValDate = new Date(value + 'T00:00:00');
    return (
      currentValDate.getDate() === day &&
      currentValDate.getMonth() === viewDate.getMonth() &&
      currentValDate.getFullYear() === viewDate.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewDate.getMonth() &&
      today.getFullYear() === viewDate.getFullYear()
    );
  };

  const displayDate = value ? (() => {
    try {
      const d = new Date(value + 'T00:00:00');
      if (isNaN(d.getTime())) return value;
      return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return value;
    }
  })() : '';

  const textColors: Record<string, string> = {
    indigo: 'text-indigo-500',
    violet: 'text-violet-500',
    emerald: 'text-emerald-500',
    rose: 'text-rose-500',
    amber: 'text-amber-500',
  };

  const activeAccentClasses: Record<string, string> = {
    indigo: 'bg-indigo-600 text-white',
    violet: 'bg-violet-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    rose: 'bg-rose-600 text-white',
    amber: 'bg-amber-600 text-white',
  };

  const ringColors: Record<string, string> = {
    indigo: 'ring-indigo-500/20 border-indigo-500/50',
    violet: 'ring-violet-500/20 border-violet-500/50',
    emerald: 'ring-emerald-500/20 border-emerald-500/50',
    rose: 'ring-rose-500/20 border-rose-500/50',
    amber: 'ring-amber-500/20 border-amber-500/50',
  };

  const todayClasses: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/30',
    violet: 'bg-violet-500/10 text-violet-500 ring-1 ring-violet-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30',
    rose: 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/30',
    amber: 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30',
  };

  const currentYear = new Date().getFullYear();
  const startYear = allowFutureYears ? currentYear + 10 : currentYear;
  const years = Array.from({ length: 110 }, (_, i) => startYear - i);

  return (
    <div className={`relative ${size === 'sm' ? 'w-auto' : 'w-full'}`} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block ml-1">
          {label}
        </label>
      )}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl font-bold outline-none cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-800 shadow-xs ${size === 'sm' ? 'py-1.5 px-3 text-[10px] min-h-[32px]' : 'py-2 px-3 sm:py-2.5 sm:px-4 text-xs sm:text-sm min-h-[40px]'} ${isOpen ? `ring-2 ${ringColors[accentColor]}` : ''}`}
      >
        <CalendarIcon size={size === 'sm' ? 12 : 14} className={value ? textColors[accentColor] : 'text-slate-400'} />
        <span className={`flex-1 truncate ${!value ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
          {displayDate || placeholder}
        </span>
        {value && (
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={size === 'sm' ? 10 : 12} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[100] top-full mt-2 left-0 w-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 origin-top">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <button 
                type="button"
                onClick={() => setViewMode(viewMode === 'days' ? 'years' : 'days')}
                className="text-xs font-black text-slate-800 dark:text-slate-100 hover:text-indigo-600 transition-colors text-left flex items-center gap-1 group"
              >
                {MONTHS[viewDate.getMonth()]}
                <ChevronDown size={12} className={`text-slate-400 group-hover:text-indigo-600 transition-transform ${viewMode === 'years' ? 'rotate-180' : ''}`} />
              </button>
              <button 
                type="button"
                onClick={() => setViewMode(viewMode === 'days' ? 'years' : 'days')}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors text-left"
              >
                {viewDate.getFullYear()}
              </button>
            </div>
            {viewMode === 'days' && (
              <div className="flex gap-1">
                <button type="button" onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" onClick={() => changeMonth(1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {viewMode === 'days' ? (
            <>
              {/* Days Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(day => (
                  <div key={day} className="text-[9px] font-black text-slate-400 text-center uppercase py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const selected = isSelected(day);
                  const today = isToday(day);
                  
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      className={`
                        aspect-square rounded-lg text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer
                        ${selected 
                          ? activeAccentClasses[accentColor] 
                          : today 
                            ? todayClasses[accentColor] 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
              {years.map(year => (
                <button
                  key={year}
                  type="button"
                  onClick={() => handleYearClick(year)}
                  className={`
                    py-2 rounded-lg text-xs font-bold transition-all cursor-pointer
                    ${viewDate.getFullYear() === year 
                      ? activeAccentClasses[accentColor] 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                  `}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <button 
              type="button"
              onClick={() => { setViewDate(new Date()); setViewMode('days'); }}
              className={`text-[10px] font-bold uppercase tracking-widest ${textColors[accentColor]} hover:underline cursor-pointer`}
            >
              Hoy
            </button>
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
