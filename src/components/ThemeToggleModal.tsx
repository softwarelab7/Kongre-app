// src/components/ThemeToggleModal.tsx
import React from 'react';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { Sun, Moon, Check, X, Sparkles, Sliders } from 'lucide-react';

interface ThemeToggleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeToggleModal: React.FC<ThemeToggleModalProps> = ({ isOpen, onClose }) => {
  const { themeMode, setThemeMode } = useTheme();

  if (!isOpen) return null;

  const options: Array<{
    id: ThemeMode;
    title: string;
    subtitle: string;
    icon: any;
    recommendedFor: string;
    previewBg: string;
    previewBorder: string;
    accentColor: string;
  }> = [
    {
      id: 'light',
      title: 'Modo Claro (Día)',
      subtitle: 'Iluminación estándar para preparación de reuniones y secretaría durante el día.',
      icon: Sun,
      recommendedFor: 'Preparación en casa, secretaría y estudio',
      previewBg: 'bg-white',
      previewBorder: 'border-slate-200',
      accentColor: 'text-amber-500 bg-amber-50 border-amber-200',
    },
    {
      id: 'dark',
      title: 'Modo Oscuro (Noche)',
      subtitle: 'Reduce el cansancio visual y protege la vista con fondos grafito y slate.',
      icon: Moon,
      recommendedFor: 'Uso nocturno, gestión y navegación general',
      previewBg: 'bg-slate-900',
      previewBorder: 'border-slate-700',
      accentColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-800',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Tema de visualización"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Tema de Visualización
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona la ambientación según el lugar de trabajo o la reunión
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar selector de tema"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="p-5 sm:p-6 space-y-3.5">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = themeMode === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => {
                  setThemeMode(opt.id);
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 relative cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${opt.accentColor}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {opt.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {opt.subtitle}
                  </p>
                  <div className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                    <span>{opt.recommendedFor}</span>
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute right-4 top-4 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info tip */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>El tema seleccionado se guarda automáticamente en este dispositivo.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold hover:opacity-90 transition text-xs shadow-xs"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
