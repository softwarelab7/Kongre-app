// src/components/DemoBanner.tsx
/**
 * DemoBanner - Insignia de modo de prueba inspirada en Organized (DemoBanner).
 * Se muestra junto al logotipo en la barra de navegación para indicar visualmente
 * que el usuario está explorando un entorno de demostración con datos de prueba.
 */
import React, { useState } from 'react';
import { Sparkles, Shield, Building2, RotateCcw, LogOut, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';

interface DemoBannerProps {
  onOpenRoleModal?: () => void;
  onOpenRegisterModal?: () => void;
  onExitDemo?: () => void;
  onResetDemo?: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  onOpenRoleModal,
  onOpenRegisterModal,
  onExitDemo,
  onResetDemo,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { activeRole, effectiveRoleInfo } = useAuth();
  const { settings } = useCongregation();

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 font-bold text-[10px] sm:text-[10.5px] tracking-wide transition-all cursor-pointer select-none active:scale-95 shadow-2xs"
        title="Modo de prueba activo - Clic para ver opciones"
      >
        <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400 group-hover:rotate-12 transition-transform shrink-0" />
        <span className="sm:hidden">Demo</span>
        <span className="hidden sm:inline">Modo Prueba</span>
        <ChevronDown className="w-3 h-3 text-indigo-400 dark:text-indigo-400 opacity-70 group-hover:opacity-100 shrink-0 transition-opacity" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed sm:absolute top-14 sm:top-full left-3 right-3 sm:left-0 sm:right-auto sm:mt-2 sm:w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-2.5 pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Entorno de Demostración
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {settings.congregationName || 'Congregación Central (Demo)'}
                </p>
                <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.5 rounded-md">
                  <Shield className="w-2.5 h-2.5" />
                  <span>Rol: {effectiveRoleInfo?.name || activeRole}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              {onOpenRoleModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenRoleModal();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition cursor-pointer text-left"
                >
                  <Shield className="w-4 h-4 text-purple-500" />
                  <span>Cambiar rol de prueba</span>
                </button>
              )}

              {onResetDemo && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onResetDemo();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition cursor-pointer text-left"
                >
                  <RotateCcw className="w-4 h-4 text-slate-400" />
                  <span>Restablecer datos de prueba</span>
                </button>
              )}

              {onOpenRegisterModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenRegisterModal();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 font-semibold transition cursor-pointer text-left"
                >
                  <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Registrar mi congregación real</span>
                </button>
              )}

              {onExitDemo && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onExitDemo();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-medium transition cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Salir del modo de prueba</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
