import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface Option {
  value: string | number;
  label: string;
}

export interface SelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  iconClassName?: string;
  disabled?: boolean;
}

function optionsEqual(a: Option[], b: Option[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].value !== b[i].value || a[i].label !== b[i].label) return false;
  }
  return true;
}

function selectPropsEqual(prev: SelectProps, next: SelectProps): boolean {
  return (
    prev.value === next.value &&
    prev.placeholder === next.placeholder &&
    prev.className === next.className &&
    prev.buttonClassName === next.buttonClassName &&
    prev.iconClassName === next.iconClassName &&
    prev.disabled === next.disabled &&
    optionsEqual(prev.options, next.options)
  );
}

const SelectComponent: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  className = '',
  buttonClassName = '',
  iconClassName = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const normalizeString = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredOptions = options.filter(opt => 
    normalizeString(opt.label).includes(normalizeString(searchTerm))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string | number) => {
    onChange(String(optionValue));
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            if (inputRef.current) inputRef.current.focus();
          }
        }}
        className={
          buttonClassName ||
          `w-full flex items-center justify-between rounded-xl border bg-slate-50 dark:bg-slate-800/80 px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all outline-none focus-within:ring-2 focus-within:ring-indigo-500/30 disabled:opacity-50 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text'} ${
            isOpen
              ? 'border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
          }`
        }
      >
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          placeholder={isOpen && selectedOption ? selectedOption.label : placeholder}
          value={isOpen ? searchTerm : (selectedOption ? selectedOption.label : '')}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          readOnly={!isOpen}
          className={`w-full bg-transparent outline-none truncate ${!selectedOption && !isOpen ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200 font-semibold'} placeholder:text-slate-400 ${disabled ? 'cursor-not-allowed' : isOpen ? 'cursor-text' : 'cursor-pointer'}`}
        />
        <ChevronDown
          size={16}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setIsOpen(!isOpen);
          }}
          className={`${iconClassName || 'text-slate-400'} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} cursor-pointer shrink-0 ml-2`}
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 min-w-full w-max max-w-sm overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 focus:outline-none text-xs sm:text-sm animate-in fade-in zoom-in-95 duration-200 origin-top">
          <div className="max-h-60 overflow-y-auto p-1.5 scrollbar-thin">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`relative flex w-full select-none items-center justify-between py-2 px-3 cursor-pointer transition-all rounded-xl mb-1 last:mb-0 text-left ${
                    option.value === value
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:translate-x-0.5'
                  }`}
                >
                  <span className="block truncate">{option.label}</span>
                  {option.value === value && (
                    <span className="flex items-center shrink-0 ml-2">
                      <Check size={14} aria-hidden="true" strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="py-4 px-4 text-center text-slate-400 text-xs font-medium">No se encontraron resultados</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const Select = React.memo(SelectComponent, selectPropsEqual);
