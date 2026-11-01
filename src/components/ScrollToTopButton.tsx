import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  isInspectorOpen?: boolean;
  threshold?: number;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  isInspectorOpen = false,
  threshold = 280,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const calculateScroll = useCallback(() => {
    const scrollTop =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    const scrollHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      1
    );
    const clientHeight =
      window.innerHeight || document.documentElement.clientHeight || 1;
    const docHeight = scrollHeight - clientHeight;

    if (docHeight > 0) {
      const progress = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
      setScrollProgress(progress);
    } else {
      setScrollProgress(0);
    }

    setIsVisible(scrollTop > threshold);
  }, [threshold]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          calculateScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // Llamada inicial para establecer el estado
    calculateScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [calculateScroll]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    try {
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  // Parámetros para el anillo circular de progreso SVG
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 8, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed z-30 transition-all duration-300 ease-in-out ${
            // En móvil: sobre la barra de navegación inferior (bottom-20)
            // En desktop: bottom-6
            // Si el inspector de estudio está abierto en pantallas grandes (lg), ajusta el margen derecho para dejar espacio al panel
            isInspectorOpen
              ? 'bottom-20 md:bottom-6 right-4 sm:right-6 lg:right-[436px]'
              : 'bottom-20 md:bottom-6 right-4 sm:right-6 md:right-8'
          }`}
        >
          <div className="relative group">
            {/* Tooltip estilizado en hover */}
            <div className="absolute bottom-full right-0 mb-2.5 pointer-events-none opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-200 ease-out z-40 whitespace-nowrap">
              <div className="px-2.5 py-1 rounded-lg text-xs font-medium tracking-wide shadow-lg bg-zinc-900/90 dark:bg-zinc-800/90 backdrop-blur-md text-white border border-white/10 flex items-center gap-1.5">
                <span>Subir al inicio</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {Math.round(scrollProgress)}%
                </span>
              </div>
            </div>

            {/* Botón flotante interactivo */}
            <motion.button
              type="button"
              onClick={scrollToTop}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Volver arriba en la página"
              title="Volver arriba"
              className="relative w-12 h-12 rounded-full flex items-center justify-center bg-white/95 dark:bg-[#18181F]/95 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-800/90 text-zinc-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-[0_4px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_28px_rgba(79,70,229,0.25)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.45)] dark:hover:shadow-[0_8px_28px_rgba(99,102,241,0.3)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#09090B]"
            >
              {/* Anillo SVG de progreso circular */}
              <svg
                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                {/* Círculo base tenue */}
                <circle
                  cx="24"
                  cy="24"
                  r={radius}
                  fill="none"
                  strokeWidth="2.5"
                  className="stroke-zinc-200/70 dark:stroke-zinc-800/80"
                />
                {/* Círculo activo con progreso real de scroll */}
                <circle
                  cx="24"
                  cy="24"
                  r={radius}
                  fill="none"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="stroke-indigo-600 dark:stroke-indigo-400 transition-[stroke-dashoffset] duration-150 ease-out"
                />
              </svg>

              {/* Icono de flecha animado en hover */}
              <ArrowUp className="w-5 h-5 relative z-10 transition-transform duration-200 group-hover:-translate-y-0.5" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
