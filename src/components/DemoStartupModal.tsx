// src/components/DemoStartupModal.tsx
/**
 * DemoStartupModal - Pantalla de carga y preparación de datos de prueba,
 * inspirada directamente en DemoStartup de Organized (src/features/demo/start/index.tsx).
 */
import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface DemoStartupModalProps {
  isOpen: boolean;
}

export const DemoStartupModal: React.FC<DemoStartupModalProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Preparando modo de prueba de Kongre"
    >
      <div className="max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 shadow-2xl p-6 sm:p-8 flex items-center gap-5 animate-in zoom-in-95 duration-200">
        <div className="relative flex items-center justify-center shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-inner">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <Loader2 className="absolute -inset-1.5 w-17 h-17 text-purple-600 dark:text-purple-400 animate-spin opacity-40" />
        </div>

        <div className="space-y-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
            Modo de prueba de Kongre
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Preparando todo para que puedas probar Kongre en acción con una congregación modelo...
          </p>
        </div>
      </div>
    </div>
  );
};
