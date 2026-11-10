// src/components/DemoStartupModal.tsx
/**
 * DemoStartupModal - Animación de transición y preparación del entorno de demostración de Kongre.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Calendar, Users, MapPin, ShieldCheck } from 'lucide-react';
import AnimatedLogo from '../AnimatedLogo';

interface DemoStartupModalProps {
  isOpen: boolean;
}

const STARTUP_STEPS = [
  {
    id: 'congregation',
    label: 'Cargando Congregación Modelo Central',
    detail: 'Publicadores, grupos de servicio y nombramientos',
    icon: Users,
  },
  {
    id: 'schedule',
    label: 'Sincronizando programas de reunión y S-89',
    detail: 'Vida y Ministerio Cristianos y Fin de Semana',
    icon: Calendar,
  },
  {
    id: 'territories',
    label: 'Preparando territorios S-13 y paneles locales',
    detail: 'Modo autónomo sin conexión a base de datos real',
    icon: MapPin,
  },
];

export const DemoStartupModal: React.FC<DemoStartupModalProps> = ({ isOpen }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    if (!isOpen) {
      setActiveStep(0);
      setProgress(12);
      return;
    }

    const t1 = setTimeout(() => {
      setActiveStep(1);
      setProgress(52);
    }, 320);

    const t2 = setTimeout(() => {
      setActiveStep(2);
      setProgress(88);
    }, 660);

    const t3 = setTimeout(() => {
      setActiveStep(3);
      setProgress(100);
    }, 960);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Iniciando entorno de demostración de Kongre"
        >
          {/* Ambient radial glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="pointer-events-none absolute w-96 h-96 rounded-full bg-indigo-600/15 dark:bg-indigo-500/15 blur-3xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-md w-full rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200/90 dark:border-[#27272A] shadow-2xl p-6 sm:p-7 overflow-hidden"
          >
            {/* Top animated progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-100 dark:bg-[#18181F] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#4C3AED] via-indigo-500 to-emerald-500"
                initial={{ width: '8%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            {/* Header with AnimatedLogo & Progress Percentage */}
            <div className="flex items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-[#27272A]/80">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative flex items-center justify-center w-13 h-13 rounded-2xl bg-indigo-50/80 dark:bg-[#18181F] border border-indigo-100 dark:border-[#27272A] shrink-0">
                  <AnimatedLogo height={34} iconOnly />
                  <motion.div
                    className="pointer-events-none absolute -inset-1 rounded-2xl border border-indigo-500/35 dark:border-indigo-400/30"
                    animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.15, 0.6] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    <span>Entorno Interactivo</span>
                    <span aria-hidden="true">·</span>
                    <span>100% Local</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white tracking-tight truncate mt-0.5">
                    Iniciando Modo Demo
                  </h3>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-lg sm:text-xl font-extrabold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                  {progress}%
                </span>
              </div>
            </div>

            {/* Staggered Checklist of Demo Modules */}
            <div className="py-4 space-y-2.5">
              {STARTUP_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isDone = activeStep > index;
                const isCurrent = activeStep === index;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: activeStep >= index ? 1 : 0.45,
                      x: 0,
                    }}
                    transition={{
                      duration: 0.25,
                      delay: index * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-colors duration-200 ${
                      isDone
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/40'
                        : isCurrent
                        ? 'bg-indigo-50/60 dark:bg-[#18181F] border-indigo-200/80 dark:border-indigo-500/30'
                        : 'bg-zinc-50/60 dark:bg-[#18181F]/40 border-zinc-200/50 dark:border-[#27272A]/50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-[#4C3AED] text-white'
                          : 'bg-zinc-200/70 dark:bg-[#27272A] text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {isDone ? (
                        <motion.span
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </motion.span>
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {step.label}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] truncate">
                        {step.detail}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer assurance */}
            <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A]/80 flex items-center justify-between text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Tus datos reales permanecen intactos</span>
              </span>
              <span className="font-mono tabular-nums text-[10px] text-zinc-400">
                Rol: Coordinador
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
