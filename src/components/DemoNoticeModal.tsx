// src/components/DemoNoticeModal.tsx
/**
 * DemoNoticeModal - Modal de bienvenida al modo de prueba de Kongre.
 */
import React from 'react';
import {
  Sparkles,
  Calendar,
  Users,
  CheckCircle2,
  Building2,
  ArrowRight,
  Shield,
  Layers,
  X,
  MapPin,
  ClipboardList,
} from 'lucide-react';

interface DemoNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegisterModal: () => void;
}

export const DemoNoticeModal: React.FC<DemoNoticeModalProps> = ({
  isOpen,
  onClose,
  onOpenRegisterModal,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenida al modo de prueba de Kongre"
    >
      <div className="relative w-full max-w-lg rounded-3xl kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 border border-zinc-200/80 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="kg-glow-badge w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold uppercase tracking-wide mb-1">
                Entorno de Prueba
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                ¡Bienvenido al modo de prueba de Kongre!
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition cursor-pointer"
            title="Cerrar"
            aria-label="Cerrar aviso del modo de prueba"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="text-xs sm:text-sm text-zinc-600 dark:text-[#D4D4D8] space-y-2 leading-relaxed">
          <p>
            Este es un entorno de demostración con datos predefinidos para una <strong>congregación modelo imaginaria</strong>.
          </p>
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
            Funciona de manera 100% local en tu dispositivo sin conexión a la nube de Supabase, por lo que puedes explorar y probar todas las herramientas sin afectar datos reales.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-100 dark:border-[#27272A] flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-zinc-800 dark:text-[#E4E4E7] block">Reuniones y S-89</span>
              <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">Programas de entre semana y fin de semana con asignaciones.</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-100 dark:border-[#27272A] flex items-start gap-2.5">
            <Users className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-zinc-800 dark:text-[#E4E4E7] block">Publicadores</span>
              <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">Cuerpo de ancianos, siervos, precursores y grupos.</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-100 dark:border-[#27272A] flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-zinc-800 dark:text-[#E4E4E7] block">Territorios y Carritos</span>
              <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">Control de manzanas, mapas y turnos metropolitanos.</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-100 dark:border-[#27272A] flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-zinc-800 dark:text-[#E4E4E7] block">Selector de Roles</span>
              <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">Prueba cómo ve la app un coordinador, anciano o publicador.</span>
            </div>
          </div>
        </div>

        {/* Notice Info Footer */}
        <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-900/60 text-xs text-purple-800 dark:text-purple-300 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <span>
            Cuando estés listo para configurar tu congregación oficial, puedes usar el asistente de registro en cualquier momento.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenRegisterModal();
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#D4D4D8] font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span>Registrar mi Congregación</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Comenzar a Explorar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
