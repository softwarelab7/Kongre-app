// src/components/DemoBanner.tsx
/**
 * DemoBanner - Insignia de modo de prueba inspirada en Organized (DemoBanner).
 * Se muestra junto al logotipo en la barra de navegación para indicar visualmente
 * que el usuario está explorando un entorno de demostración con datos de prueba.
 */
import React, { useState } from 'react';
import { Shield, Building2, RotateCcw, LogOut, ChevronDown, Check } from 'lucide-react';
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
        onClick={() => {
          if (typeof window !== 'undefined' && window.innerWidth < 768 && onOpenRoleModal) {
            onOpenRoleModal();
          } else {
            setIsOpen((prev) => !prev);
          }
        }}
        className="group inline-flex items-center gap-1 sm:gap-1.5 h-6 px-2 rounded-lg bg-indigo-50/90 dark:bg-indigo-950/60 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 font-bold text-[10px] sm:text-[10.5px] tracking-wide transition-all cursor-pointer select-none active:scale-95 shadow-2xs"
        title="Modo de prueba activo - Clic para cambiar rol"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
        <span className="sm:hidden">Demo</span>
        <span className="hidden sm:inline">Modo Prueba</span>
        <ChevronDown className="hidden sm:inline w-3 h-3 text-indigo-400 dark:text-indigo-400 opacity-70 group-hover:opacity-100 shrink-0 transition-opacity" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed sm:absolute top-14 sm:top-full left-3 right-3 sm:left-0 sm:right-auto sm:mt-2 sm:w-72 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] shadow-lg p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-2.5 pb-2.5 mb-2 border-b border-zinc-200 dark:border-[#27272A]">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-600 dark:text-[#A1A1AA] flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-[#F4F4F5] truncate">
                  Entorno de Demostración
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] truncate">
                  {settings.congregationName || 'Congregación Central (Demo)'}
                </p>
                <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-700 dark:text-[#F4F4F5] bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] px-1.5 py-0.5 rounded-md">
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
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F] hover:text-zinc-900 dark:hover:text-white font-medium transition cursor-pointer text-left"
                >
                  <Shield className="w-4 h-4 text-zinc-400 dark:text-[#A1A1AA]" />
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
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F] font-medium transition cursor-pointer text-left"
                >
                  <RotateCcw className="w-4 h-4 text-zinc-400 dark:text-[#A1A1AA]" />
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
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/10 dark:hover:bg-indigo-950/30 font-semibold transition cursor-pointer text-left"
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
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-950/30 font-medium transition cursor-pointer text-left"
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
