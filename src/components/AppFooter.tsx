import React, { useState, useEffect } from 'react';
import { ScrollText, ShieldCheck, Scale, CloudOff } from 'lucide-react';
import { CURRENT_APP_VERSION } from '../utils/versionLog';
import Logo from '../Logo';
import { OfflineSyncBadge } from './OfflineSyncBadge';
import { TermsAndPrivacyModal, LegalModalTab, detectLegalRoute } from './TermsAndPrivacyModal';

interface AppFooterProps {
  onOpenVersionModal?: () => void;
  onOpenQueueModal?: () => void;
  isOnline?: boolean;
  isDemoMode?: boolean;
  variant?: 'app' | 'landing';
}

export const AppFooter: React.FC<AppFooterProps> = ({
  onOpenVersionModal,
  onOpenQueueModal,
  isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true,
  isDemoMode = false,
  variant = 'app',
}) => {
  const [legalModalOpen, setLegalModalOpen] = useState(() => {
    return detectLegalRoute() !== null;
  });
  const [legalModalTab, setLegalModalTab] = useState<LegalModalTab>(() => {
    return detectLegalRoute() || 'terms';
  });

  useEffect(() => {
    const handleRouteCheck = () => {
      const detected = detectLegalRoute();
      if (detected) {
        setLegalModalTab(detected);
        setLegalModalOpen(true);
      }
    };
    handleRouteCheck();
    window.addEventListener('hashchange', handleRouteCheck);
    window.addEventListener('popstate', handleRouteCheck);
    return () => {
      window.removeEventListener('hashchange', handleRouteCheck);
      window.removeEventListener('popstate', handleRouteCheck);
    };
  }, []);

  const handleOpenLegal = (tab: LegalModalTab) => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
    if (typeof window !== 'undefined') {
      window.history.pushState({ legal: true, tab }, '', `#${tab}`);
    }
  };

  const handleCloseLegal = () => {
    setLegalModalOpen(false);
    if (typeof window !== 'undefined') {
      const curHash = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase().split('?')[0];
      if (curHash === 'privacy' || curHash === 'privacidad' || curHash === 'terms' || curHash === 'terminos') {
        const fallback = variant === 'landing' ? '#portal' : '#inicio';
        window.history.pushState(null, '', fallback);
      }
    }
  };

  return (
    <>
      <footer
        className={`w-full mt-auto shrink-0 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md select-none transition-colors z-20 ${
          variant === 'app' ? 'pb-20 md:pb-0' : ''
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2">
          {/* Mobile Layout (Clean 2-row structure) */}
          <div className="flex md:hidden flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Logo variant="isotipo" className="w-5 h-5 object-contain shrink-0" />
                <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs tracking-tight">
                  Kongre
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                {isOnline ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>En línea</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 text-[10px] font-bold">
                    <CloudOff className="w-3 h-3 text-amber-500" />
                    <span>Offline</span>
                  </span>
                )}
              </div>

              {onOpenVersionModal && (
                <button
                  type="button"
                  onClick={onOpenVersionModal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 text-[10.5px] font-semibold border border-slate-200/80 dark:border-slate-700/80 active:scale-95 cursor-pointer shrink-0"
                >
                  <ScrollText className="w-3 h-3 text-amber-500" />
                  <span>v{CURRENT_APP_VERSION}</span>
                  <span className="px-1 py-0.2 rounded text-[8.5px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                    Alfa
                  </span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-1.5">
              <button
                type="button"
                onClick={() => handleOpenLegal('terms')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
              >
                Términos de Uso
              </button>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <button
                type="button"
                onClick={() => handleOpenLegal('privacy')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
              >
                Política de Privacidad
              </button>
            </div>
          </div>

          {/* Desktop Layout (Clean 3-Column Balanced Bar) */}
          <div className="hidden md:flex items-center justify-between gap-4 text-xs">
            {/* Left: Brand Identity & Subtitle */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Logo variant="isotipo" className="w-5 h-5 object-contain shrink-0" />
              <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm tracking-tight">
                Kongre
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium">
                Gestor Teocrático Integral
              </span>
            </div>

            {/* Center: Essential Legal Links without clutter */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => handleOpenLegal('terms')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer flex items-center gap-1.5"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-500/70" />
                <span>Términos de Uso</span>
              </button>

              <span className="text-slate-300 dark:text-slate-700">·</span>

              <button
                type="button"
                onClick={() => handleOpenLegal('privacy')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
                <span>Política de Privacidad</span>
              </button>
            </div>

            {/* Right: Network Status, Sync Badge & Version Pill */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Online / Offline status badge */}
              {isOnline ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>En línea</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 text-[11px] font-bold">
                  <CloudOff className="w-3 h-3 text-amber-500" />
                  <span>Modo Offline</span>
                </div>
              )}

              {/* Offline Queue Badge if present */}
              {variant === 'landing' && onOpenQueueModal && !isDemoMode && (
                <OfflineSyncBadge
                  isOnline={isOnline}
                  onOpenQueueModal={onOpenQueueModal}
                />
              )}

              {/* Version Pill */}
              {onOpenVersionModal && (
                <button
                  type="button"
                  onClick={onOpenVersionModal}
                  className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-2xs active:scale-95 text-xs font-semibold"
                  title="Ver registro de versiones y novedades"
                >
                  <ScrollText className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-6 transition-transform" />
                  <span>v{CURRENT_APP_VERSION}</span>
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-extrabold uppercase bg-amber-100/90 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                    Alfa
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>

      <TermsAndPrivacyModal
        isOpen={legalModalOpen}
        onClose={handleCloseLegal}
        initialTab={legalModalTab}
      />
    </>
  );
};
