// src/components/SearchableCombobox.tsx
import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface SearchableComboboxProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  emptyMessage?: string;
  disabled?: boolean;
}

// Normaliza texto eliminando acentos y diacríticos para búsqueda flexible
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Escribe para buscar o seleccionar...',
  helperText,
  required = false,
  emptyMessage = 'No se encontraron coincidencias. Puedes escribir tu opción personalizada.',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const datalistId = useId();

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrado de opciones en base al texto escrito
  const queryNormalized = normalizeText(value || '');
  const filteredOptions = queryNormalized
    ? options.filter((option) => normalizeText(option).includes(queryNormalized))
    : options;

  const handleSelectOption = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
        <span>{label}</span>
        {required && <span className="text-rose-500">*</span>}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          list={datalistId}
          autoComplete="off"
          className="w-full px-3 py-1.5 sm:py-2 pr-14 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
        />

        {/* Browser native datalist fallback for accessibility */}
        <datalist id={datalistId}>
          {options.slice(0, 100).map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Borrar texto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Mostrar opciones"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''}`}
            />
          </button>
        </div>
      </div>

      {helperText && (
        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">
          {helperText}
        </span>
      )}

      {/* Lista desplegable interactiva con filtro en tiempo real */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-56 overflow-y-auto rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-900/10 py-1 text-xs sm:text-sm animate-in fade-in-50 duration-150">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = option.toLowerCase() === value.trim().toLowerCase();
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer text-xs sm:text-sm ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{option}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400">
              <p>{emptyMessage}</p>
              {value.trim() && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs underline cursor-pointer"
                >
                  Usar «{value.trim()}» como personalizada
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
