import React, { useState, useRef, useEffect, useId } from 'react';
import { Clock, Check, ChevronDown, X } from 'lucide-react';

export interface IosTimePickerProps {
  value: string; // Formato 24h: "HH:mm" (ej. "19:00", "09:30")
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  accentColor?: 'indigo' | 'emerald';
  presets?: string[]; // ej. ["18:30", "19:00", "19:30"]
}

const HOURS_12 = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const PERIODS = ['AM', 'PM'];

// Convierte "HH:mm" (24h) a { hour12: "07", minute: "00", period: "PM" }
function parse24to12(timeStr: string) {
  if (!timeStr || !timeStr.includes(':')) {
    return { hour12: '07', minute: '00', period: 'PM' };
  }
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h)) h = 19;
  const isPM = h >= 12;
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;

  // Redondear minuto al más cercano en pasos de 5
  let roundedM = Math.round(m / 5) * 5;
  if (roundedM >= 60) roundedM = 55;

  return {
    hour12: String(h12).padStart(2, '0'),
    minute: String(roundedM).padStart(2, '0'),
    period: isPM ? 'PM' : 'AM',
  };
}

// Convierte { hour12, minute, period } a "HH:mm" (24h)
function format12to24(hour12: string, minute: string, period: string): string {
  let h = parseInt(hour12, 10);
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${minute}`;
}

// Formatea "19:00" a "7:00 PM"
export function formatDisplayTime(timeStr: string): string {
  if (!timeStr || !timeStr.includes(':')) return '';
  const { hour12, minute, period } = parse24to12(timeStr);
  const h = parseInt(hour12, 10);
  return `${h}:${minute} ${period}`;
}

export const IosTimePicker: React.FC<IosTimePickerProps> = ({
  value,
  onChange,
  placeholder = 'Selecciona una hora...',
  className = '',
  disabled = false,
  accentColor = 'indigo',
  presets,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerId = useId();

  // Estados locales de la rueda iOS
  const parsed = parse24to12(value);
  const [selectedHour, setSelectedHour] = useState(parsed.hour12);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(parsed.period);

  // Refs para las 3 columnas de desplazamiento
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  const periodsRef = useRef<HTMLDivElement>(null);

  // Detección inteligente de dirección (arriba o abajo para evitar scroll)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // Si hay menos de 260px abajo y arriba hay más espacio, abrir hacia arriba
      if (spaceBelow < 260 && rect.top > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }

      // Sincronizar datos al abrir
      const p = parse24to12(value);
      setSelectedHour(p.hour12);
      setSelectedMinute(p.minute);
      setSelectedPeriod(p.period);
    }
  }, [isOpen, value]);

  // Click outside y escape listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Scroll suave al elemento seleccionado en la rueda (altura de item: 32px)
  const scrollToItem = (container: HTMLDivElement | null, index: number, itemHeight = 32) => {
    if (container) {
      container.scrollTo({
        top: index * itemHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      const hIdx = HOURS_12.indexOf(selectedHour);
      const mIdx = MINUTES.indexOf(selectedMinute);
      const pIdx = PERIODS.indexOf(selectedPeriod);

      setTimeout(() => {
        if (hIdx !== -1) scrollToItem(hoursRef.current, hIdx);
        if (mIdx !== -1) scrollToItem(minutesRef.current, mIdx);
        if (pIdx !== -1) scrollToItem(periodsRef.current, pIdx);
      }, 40);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const time24 = format12to24(selectedHour, selectedMinute, selectedPeriod);
    onChange(time24);
    setIsOpen(false);
  };

  const handleSelectPreset = (preset24: string) => {
    const p = parse24to12(preset24);
    setSelectedHour(p.hour12);
    setSelectedMinute(p.minute);
    setSelectedPeriod(p.period);
    onChange(preset24);
    setIsOpen(false);
  };

  const isEmerald = accentColor === 'emerald';
  const activeBg = isEmerald ? 'bg-emerald-600' : 'bg-indigo-600';
  const activeRing = isEmerald ? 'ring-emerald-500/20 border-emerald-500' : 'ring-indigo-500/20 border-indigo-500';
  const activeText = isEmerald ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400';

  const defaultPresets = isEmerald
    ? ['09:00', '09:30', '10:00', '16:00', '17:00']
    : ['18:30', '19:00', '19:30', '20:00'];

  const effectivePresets = presets || defaultPresets;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button - Estilo Cápsula Moderna iOS */}
      <button
        type="button"
        id={pickerId}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2.5 rounded-xl border bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none shadow-2xs ${
          isOpen
            ? `${activeRing} ring-2 shadow-xs`
            : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <Clock className={`w-4 h-4 shrink-0 ${value ? activeText : 'text-slate-400 dark:text-slate-500'}`} />
          {value ? (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm tracking-wide">
                {formatDisplayTime(value)}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 font-semibold">
                {value}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 font-normal">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          size={16}
          className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
            isOpen ? `rotate-180 ${activeText}` : ''
          }`}
        />
      </button>

      {/* Popover iOS Cupertino Wheel Picker (Auto-posicionado arriba o abajo para evitar scroll) */}
      {isOpen && !disabled && (
        <div
          className={`absolute z-50 left-0 sm:left-auto sm:right-0 w-full sm:w-76 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-slate-900/20 dark:shadow-black/70 border border-slate-200/90 dark:border-slate-800 overflow-hidden text-xs sm:text-sm animate-in fade-in zoom-in-95 duration-150 ${
            openUpward ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'
          }`}
        >
          {/* Header iOS compacto */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              Seleccionar Horario
            </span>
            <button
              type="button"
              onClick={handleConfirm}
              className={`px-3 py-1 rounded-full text-xs font-bold text-white ${activeBg} hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95`}
            >
              Listo
            </button>
          </div>

          {/* Quick Presets / Horarios habituales compactos */}
          <div className="p-2.5 pb-1 border-b border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block mb-1 px-1">
              Horarios Frecuentes
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {effectivePresets.map((preset) => {
                const isSelected = value === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? `${activeBg} text-white shadow-2xs`
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {formatDisplayTime(preset)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* iOS 3-Column Wheel Container Compacto (altura 100px) */}
          <div className="relative p-2.5 py-2">
            {/* Lente de selección central iOS */}
            <div className="absolute left-2.5 right-2.5 top-1/2 -translate-y-1/2 h-8 rounded-lg bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 pointer-events-none -z-0" />

            {/* Gradiente difuminado superior */}
            <div className="absolute left-2.5 right-2.5 top-2 h-9 bg-gradient-to-b from-white/95 via-white/70 to-transparent dark:from-slate-900/95 dark:via-slate-900/70 pointer-events-none z-10" />

            {/* Gradiente difuminado inferior */}
            <div className="absolute left-2.5 right-2.5 bottom-2 h-9 bg-gradient-to-t from-white/95 via-white/70 to-transparent dark:from-slate-900/95 dark:via-slate-900/70 pointer-events-none z-10" />

            <div className="grid grid-cols-3 gap-1.5 relative z-0">
              {/* Columna Horas */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Hora
                </span>
                <div
                  ref={hoursRef}
                  className="h-24 w-full overflow-y-auto scrollbar-none snap-y snap-mandatory py-8 text-center"
                >
                  {HOURS_12.map((hour, idx) => {
                    const isSelected = selectedHour === hour;
                    return (
                      <div
                        key={hour}
                        onClick={() => {
                          setSelectedHour(hour);
                          scrollToItem(hoursRef.current, idx, 32);
                        }}
                        className={`h-8 flex items-center justify-center snap-center text-xs font-bold cursor-pointer transition-all ${
                          isSelected
                            ? 'text-indigo-600 dark:text-indigo-400 font-black scale-110'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 scale-95'
                        }`}
                      >
                        {hour}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Columna Minutos */}
              <div className="flex flex-col items-center border-x border-slate-100 dark:border-slate-800/60">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Minuto
                </span>
                <div
                  ref={minutesRef}
                  className="h-24 w-full overflow-y-auto scrollbar-none snap-y snap-mandatory py-8 text-center"
                >
                  {MINUTES.map((min, idx) => {
                    const isSelected = selectedMinute === min;
                    return (
                      <div
                        key={min}
                        onClick={() => {
                          setSelectedMinute(min);
                          scrollToItem(minutesRef.current, idx, 32);
                        }}
                        className={`h-8 flex items-center justify-center snap-center text-xs font-bold cursor-pointer transition-all ${
                          isSelected
                            ? 'text-indigo-600 dark:text-indigo-400 font-black scale-110'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 scale-95'
                        }`}
                      >
                        {min}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Columna AM / PM */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Tanda
                </span>
                <div
                  ref={periodsRef}
                  className="h-24 w-full overflow-y-auto scrollbar-none snap-y snap-mandatory py-8 text-center"
                >
                  {PERIODS.map((period, idx) => {
                    const isSelected = selectedPeriod === period;
                    return (
                      <div
                        key={period}
                        onClick={() => {
                          setSelectedPeriod(period);
                          scrollToItem(periodsRef.current, idx, 32);
                        }}
                        className={`h-8 flex items-center justify-center snap-center text-xs font-bold cursor-pointer transition-all ${
                          isSelected
                            ? 'text-indigo-600 dark:text-indigo-400 font-black scale-110'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 scale-95'
                        }`}
                      >
                        {period}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Preview & Actions */}
          <div className="p-2.5 px-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-400 text-[10px] block">Hora seleccionada:</span>
              <span className="font-bold text-slate-900 dark:text-white text-xs">
                {parseInt(selectedHour, 10)}:{selectedMinute} {selectedPeriod}
              </span>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white ${activeBg} hover:opacity-95 transition-transform active:scale-95 cursor-pointer shadow-xs`}
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Aplicar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IosTimePicker;
