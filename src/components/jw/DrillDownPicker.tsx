import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { DrillDownLevel } from '../../types/jwDesignSystem';

interface DrillDownPickerProps {
  levels: DrillDownLevel[];
  selectedIndices: number[]; // e.g. [currentLevel0Idx, currentLevel1Idx, currentLevel2Idx]
  onSelectPath: (pathIndices: number[]) => void;
  titlePlaceholder?: string;
}

export const DrillDownPicker: React.FC<DrillDownPickerProps> = ({
  levels,
  selectedIndices,
  onSelectPath,
  titlePlaceholder = 'Seleccionar...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [tempIndices, setTempIndices] = useState<number[]>(selectedIndices);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempIndices(selectedIndices);
  }, [selectedIndices]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpen = () => {
    setTempIndices(selectedIndices);
    setActiveStep(0);
    setIsOpen((prev) => !prev);
  };

  const handleSelectItem = (itemIndex: number) => {
    const updated = [...tempIndices];
    updated[activeStep] = itemIndex;
    setTempIndices(updated);

    // If there is a next level, automatically advance (Rule of 3 Touches)
    if (activeStep < levels.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      // Final selection reached!
      onSelectPath(updated);
      setIsOpen(false);
    }
  };

  // Breadcrumb label display
  const currentBreadcrumb = levels.map((lvl, idx) => {
    const selectedItem = lvl.items[tempIndices[idx]];
    return selectedItem?.label || lvl.levelTitle;
  });

  const currentLevel = levels[activeStep] || levels[0];

  return (
    <div ref={containerRef} className="relative inline-block text-left select-none">
      {/* Topbar Compound Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
          isOpen
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
            : 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-[#27272A] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#18181F]'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate max-w-[280px] sm:max-w-[420px]">
          {currentBreadcrumb.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="opacity-40">/</span>}
              <span className={idx === currentBreadcrumb.length - 1 ? 'font-bold' : 'opacity-80'}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-60 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Drill-Down In-Situ Matrix Popover Panel */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[calc(100vw-32px)] max-w-md sm:w-[420px] bg-white dark:bg-[#121216] rounded-2xl shadow-2xl border border-zinc-200 dark:border-[#27272A] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Step Tabs Bar (Categoría / Mes -> Grupo / Semana -> Ítem) */}
          <div className="flex items-center gap-1 pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
            {levels.map((lvl, idx) => {
              const isCurrent = activeStep === idx;
              const hasSelection = tempIndices[idx] !== undefined;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                      : hasSelection
                      ? 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                      : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  <span className="block text-[10px] uppercase tracking-wider opacity-60">Paso {idx + 1}</span>
                  <span className="truncate block font-extrabold">{lvl.levelTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Matrix Grid of Items for Active Step */}
          <div className="max-h-[280px] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentLevel.items.map((item, itemIdx) => {
                const isSelected = tempIndices[activeStep] === itemIdx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(itemIdx)}
                    className={`h-12 px-2.5 rounded-xl border text-left flex flex-col justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs ring-2 ring-indigo-400/40'
                        : 'bg-zinc-50 dark:bg-[#18181F] border-zinc-200/80 dark:border-[#27272A] text-zinc-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold truncate leading-tight">{item.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                      {item.badge && !isSelected && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.sublabel && (
                      <span
                        className={`text-[10px] truncate leading-none mt-0.5 ${
                          isSelected ? 'text-indigo-100' : 'text-zinc-400 dark:text-zinc-400'
                        }`}
                      >
                        {item.sublabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
