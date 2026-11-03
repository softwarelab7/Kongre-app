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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Preparando modo de prueba de Kongre"
    >
      <div className="max-w-md w-full rounded-3xl kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 border border-purple-200/80 dark:border-white/10 shadow-2xl p-6 sm:p-8 flex items-center gap-5 animate-in zoom-in-95 duration-200">
        <div className="relative flex items-center justify-center shrink-0">
          <div className="kg-glow-badge w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-inner">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <Loader2 className="absolute -inset-1.5 w-17 h-17 text-purple-600 dark:text-purple-400 animate-spin opacity-40" />
        </div>

        <div className="space-y-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight">
            Modo de prueba de Kongre
          </h3>
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] leading-relaxed">
            Preparando todo para que puedas probar Kongre en acción con una congregación modelo...
          </p>
        </div>
      </div>
    </div>
  );
};
