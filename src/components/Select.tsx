import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface Option {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
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
  searchable?: boolean;
  placement?: 'auto' | 'top' | 'bottom';
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
    prev.searchable === next.searchable &&
    prev.placement === next.placement &&
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
  searchable,
  placement = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectId = useId();

  // If searchable is not explicitly defined, enable search when options > 7
  const isSearchActive = searchable !== undefined ? searchable : options.length > 7;

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Auto-detect placement: open upward if limited space below
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (placement === 'top') {
        setOpenUpward(true);
        return;
      }
      if (placement === 'bottom') {
        setOpenUpward(false);
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      let spaceBelow = window.innerHeight - rect.bottom;
      let spaceAbove = rect.top;

      // Check closest scrollable or bounded container (card, modal, dialog, etc.)
      const boundaryContainer = containerRef.current.closest<HTMLElement>(
        '.card, [role="dialog"], .kg-form-enter, .overflow-hidden, .overflow-y-auto, .overflow-auto'
      );
      if (boundaryContainer) {
        const bRect = boundaryContainer.getBoundingClientRect();
        const bSpaceBelow = bRect.bottom - rect.bottom;
        const bSpaceAbove = rect.top - bRect.top;
        spaceBelow = Math.min(spaceBelow, bSpaceBelow);
        spaceAbove = Math.max(0, Math.min(spaceAbove, bSpaceAbove));
      }

      const estimatedMenuHeight = Math.min(options.length * 44 + (isSearchActive ? 52 : 16), 260);
      setOpenUpward(spaceBelow < estimatedMenuHeight && spaceAbove >= 120);
    }
  }, [isOpen, options.length, isSearchActive, placement]);

  // Focus search input on open (only on desktop >= 640px to avoid jarring virtual keyboard jump on mobile)
  useEffect(() => {
    if (isOpen && isSearchActive && searchInputRef.current && window.innerWidth >= 640) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen, isSearchActive]);

  // Click outside and escape key listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
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

  const normalizeString = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredOptions = isSearchActive && searchTerm
    ? options.filter((opt) => normalizeString(opt.label).includes(normalizeString(searchTerm)))
    : options;

  const handleSelect = (optionValue: string | number) => {
    onChange(String(optionValue));
    setIsOpen(false);
  };

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-auto'} ${className}`} ref={containerRef}>
      {/* Modern Trigger Button */}
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={
          buttonClassName ||
          `w-full flex items-center justify-between gap-2.5 rounded-xl border bg-white dark:bg-slate-800/90 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none shadow-2xs ${
            isOpen
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800'
          }`
        }
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-slate-500 dark:text-slate-400">
              {selectedOption.icon}
            </span>
          )}
          <span
            className={`truncate ${
              selectedOption
                ? 'text-slate-900 dark:text-white font-medium'
                : 'text-slate-400 dark:text-slate-500 font-normal'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          size={16}
          className={`${
            iconClassName || 'text-slate-400 dark:text-slate-500'
          } transition-transform duration-200 shrink-0 ml-1.5 ${
            isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
          }`}
        />
      </button>

      {/* Modern Floating Menu (Fixed Bottom-Sheet on Mobile <sm, Floating Popover on Desktop >=sm) */}
      {isOpen && !disabled && (
        <>
          {/* Mobile backdrop to prevent accidental outside taps and highlight sheet */}
          <div
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] sm:hidden animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`fixed inset-x-3 bottom-4 z-50 sm:Generate sm:absolute sm:inset-x-0 sm:bottom-auto min-w-full sm:w-full rounded-2xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/30 dark:shadow-black/80 border border-slate-200/90 dark:border-slate-800 overflow-hidden text-xs sm:text-sm animate-in fade-in zoom-in-95 duration-150 ${
              openUpward
                ? 'sm:bottom-full sm:mb-1.5 origin-bottom'
                : 'sm:top-full sm:mt-1.5 origin-top'
            }`}
          >
            {/* Mobile Sheet Header */}
            <div className="flex sm:hidden items-center justify-between px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                {placeholder}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                aria-label="Cerrar selector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar (when options > 7 or searchable=true) */}
            {isSearchActive && (
              <div className="p-2.5 sm:p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 relative">
                <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 sm:pl-7 pr-8 py-2 sm:py-1.5 rounded-xl sm:rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Options List */}
            <div className="max-h-[55dvh] sm:max-h-60 overflow-y-auto p-1.5 scrollbar-thin space-y-0.5">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = String(option.value) === String(value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`group relative flex w-full select-none items-center justify-between min-h-[42px] py-2.5 px-3 cursor-pointer transition-all rounded-xl text-left ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-indigo-50/70 dark:hover:bg-slate-800/90 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1 pr-2">
                        {option.icon && (
                          <span
                            className={`shrink-0 mt-0.5 sm:mt-0 ${
                              isSelected ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                            }`}
                          >
                            {option.icon}
                          </span>
                        )}
                        <span className="block whitespace-normal sm:truncate leading-snug">
                          {option.label}
                        </span>
                      </div>

                      {isSelected && (
                        <span className="flex items-center shrink-0 ml-1 text-white">
                          <Check size={16} strokeWidth={2.5} />
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-5 px-4 text-center text-slate-400 text-xs font-medium">
                  No se encontraron opciones
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const Select = React.memo(SelectComponent, selectPropsEqual);
export default Select;
