// src/components/DemoNoticeModal.tsx
/**
 * DemoNoticeModal - Modal de bienvenida al modo de prueba de Kongre.
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Users,
  CheckCircle2,
  Building2,
  ArrowRight,
  Shield,
  X,
  MapPin,
} from 'lucide-react';
import AnimatedLogo from '../AnimatedLogo';

interface DemoNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegisterModal: () => void;
}

const DEMO_HIGHLIGHTS = [
  {
    icon: Calendar,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    title: 'Reuniones y S-89',
    description: 'Programas de entre semana y fin de semana con asignaciones.',
  },
  {
    icon: Users,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    title: 'Publicadores',
    description: 'Cuerpo de ancianos, siervos, precursores y grupos.',
  },
  {
    icon: MapPin,
    iconColor: 'text-amber-600 dark:text-amber-400',
    title: 'Territorios y Carritos',
    description: 'Control de manzanas, mapas y turnos metropolitanos.',
  },
  {
    icon: Shield,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    title: 'Selector de Roles',
    description: 'Prueba cómo ve la app un coordinador, anciano o publicador.',
  },
];

export const DemoNoticeModal: React.FC<DemoNoticeModalProps> = ({
  isOpen,
  onClose,
  onOpenRegisterModal,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Bienvenida al modo de prueba de Kongre"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200/90 dark:border-[#27272A] shadow-2xl p-6 sm:p-7 space-y-5 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50/90 dark:bg-[#18181F] border border-indigo-100 dark:border-[#27272A] flex items-center justify-center shrink-0">
                  <AnimatedLogo height={32} iconOnly />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-0.5">
                    <span>Entorno de Demostración</span>
                    <span aria-hidden="true">·</span>
                    <span>Congregación Modelo</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white leading-tight tracking-tight">
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
            <div className="text-xs sm:text-sm text-zinc-600 dark:text-[#D4D4D8] space-y-1.5 leading-relaxed">
              <p>
                Estás explorando una <strong>congregación modelo preconfigurada</strong> con programas semanales, publicadores y territorios de ejemplo.
              </p>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Funciona de manera 100% local en tu dispositivo sin conexión a la nube de Supabase, por lo que puedes probar cada herramienta con total libertad.
              </p>
            </div>

            {/* Staggered Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {DEMO_HIGHLIGHTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.28,
                      delay: 0.06 + idx * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="p-3 rounded-2xl bg-zinc-50/90 dark:bg-[#18181F]/70 border border-zinc-200/70 dark:border-[#27272A] flex items-start gap-2.5"
                  >
                    <Icon className={`w-4 h-4 ${item.iconColor} mt-0.5 shrink-0`} />
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-[#E4E4E7] block">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] leading-snug block mt-0.5">
                        {item.description}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Notice Info Footer */}
            <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                Cuando estés listo para configurar tu congregación oficial, puedes usar el asistente de registro en cualquier momento.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRegisterModal();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#D4D4D8] font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Registrar mi Congregación</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#4C3AED] hover:bg-[#3f2ec8] text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
              >
                <span>Comenzar a Explorar</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
