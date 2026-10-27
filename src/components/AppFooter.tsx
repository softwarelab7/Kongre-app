import React, { useState, useEffect } from 'react';
import { ScrollText, ShieldCheck, Scale, CloudOff, Monitor } from 'lucide-react';
import { CURRENT_APP_VERSION, BUILD_DATE } from '../utils/versionLog';
import Logo from '../Logo';
import { OfflineSyncBadge } from './OfflineSyncBadge';
import { TermsAndPrivacyModal, LegalModalTab, detectLegalRoute } from './TermsAndPrivacyModal';
import { DesktopDownloadModal } from './DesktopDownloadModal';

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
  const [desktopModalOpen, setDesktopModalOpen] = useState(false);

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
        className={`w-full mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md select-none transition-colors z-20 ${
          variant === 'app' ? 'pb-20 md:pb-0' : ''
        }`}
      >
        <div
          className={`w-full px-4 sm:px-6 md:px-8 lg:px-10 ${
            variant === 'app' ? 'py-2 md:py-3.5' : 'py-3 sm:py-3.5'
          }`}
        >
          {/* Ultra-compact single-line bar on mobile for in-app view */}
          {variant === 'app' && (
            <div className="flex md:hidden items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <Logo variant="isotipo" className="w-4 h-4 object-contain shrink-0" />
                <span className="font-bold text-slate-700 dark:text-slate-200">Kongre</span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <button
                  type="button"
                  onClick={() => handleOpenLegal('terms')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
                >
                  Términos
                </button>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <button
                  type="button"
                  onClick={() => handleOpenLegal('privacy')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
                >
                  Privacidad
                </button>
              </div>

              {onOpenVersionModal ? (
                <button
                  type="button"
                  onClick={onOpenVersionModal}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-semibold text-[10.5px] shrink-0 active:scale-95 cursor-pointer"
                  title="Ver registro de cambios y versiones (Versión Alfa)"
                >
                  <ScrollText className="w-3 h-3 text-amber-500" />
                  <span>v{CURRENT_APP_VERSION}</span>
                  <span className="px-1 py-0.2 rounded text-[8.5px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                    Alfa
                  </span>
                </button>
              ) : (
                <span className="text-[10.5px] text-slate-400 shrink-0">v{CURRENT_APP_VERSION} (Alfa)</span>
              )}
            </div>
          )}

          <div
            className={`${
              variant === 'app' ? 'hidden md:flex' : 'flex flex-col md:flex-row'
            } items-center justify-between gap-2.5 md:gap-4 text-xs text-slate-500 dark:text-slate-400`}
          >
            {/* Top / Left Group: Brand, Online/Offline Status & Version on Mobile */}
            <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shrink-0">
                  <Logo variant="isotipo" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm tracking-tight">
                  Kongre
                </span>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <span className="text-[11.5px] text-slate-500 dark:text-slate-400 hidden sm:inline truncate">
                  Gestor Teocrático Integral
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                {isOnline ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 text-[10px] font-bold whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>En línea</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 text-[10px] font-bold whitespace-nowrap">
                    <CloudOff className="w-3 h-3" />
                    <span>Modo Offline</span>
                  </span>
                )}
              </div>

              {/* Mobile-only Version Button on top row for landing footer */}
              {onOpenVersionModal && (
                <button
                  type="button"
                  onClick={onOpenVersionModal}
                  className="md:hidden group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-amber-50 dark:hover:bg-amber-950/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer shadow-2xs active:scale-95 text-[11px] font-semibold shrink-0"
                  title="Ver registro de cambios y versiones"
                >
                  <ScrollText className="w-3 h-3 text-amber-500" />
                  <span>v{CURRENT_APP_VERSION}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-100/90 dark:bg-amber-900/70 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                    Alfa
                  </span>
                </button>
              )}
            </div>

            {/* Center Group: Legal Links (Terms of Use & Privacy Policy) + Offline PWA notice */}
            <div className="w-full md:w-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11.5px] sm:text-xs border-t md:border-t-0 border-slate-100 dark:border-slate-800/80 pt-2 md:pt-0">
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#presentacion';
                }}
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
              >
                <ScrollText className="w-3.5 h-3.5 text-indigo-500" />
                <span>Presentación y Docs</span>
              </button>

              <span className="text-slate-300 dark:text-slate-700">•</span>

              <button
                type="button"
                onClick={() => handleOpenLegal('terms')}
                className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-500/80" />
                <span>Términos de Uso</span>
              </button>

              <span className="text-slate-300 dark:text-slate-700">•</span>

              <button
                type="button"
                onClick={() => handleOpenLegal('privacy')}
                className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/90" />
                <span>Política de Privacidad</span>
              </button>

              <span className="text-slate-300 dark:text-slate-700">•</span>

              <button
                type="button"
                onClick={() => setDesktopModalOpen(true)}
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
              >
                <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                <span>Kongre App (PC / Mac)</span>
              </button>

              <span className="text-slate-300 dark:text-slate-700 hidden lg:inline">•</span>

              <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                <CloudOff className="w-3 h-3 text-slate-400" />
                <span>Sincronización Offline PWA</span>
              </span>
            </div>

            {/* Right Group (Desktop & Sync Queue): Offline Sync Badge & Version Pill */}
            <div className="hidden md:flex items-center gap-2.5 shrink-0">
              {variant === 'landing' && onOpenQueueModal && !isDemoMode && (
                <OfflineSyncBadge
                  isOnline={isOnline}
                  onOpenQueueModal={onOpenQueueModal}
                />
              )}

              <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden xl:inline">
                {BUILD_DATE}
              </span>

              {onOpenVersionModal && (
                <button
                  type="button"
                  onClick={onOpenVersionModal}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-amber-50 dark:hover:bg-amber-950/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-700/70 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 transition-all cursor-pointer shadow-2xs active:scale-95 text-xs font-semibold"
                  title="Ver registro de cambios y versiones de la aplicación (Fase Alfa)"
                >
                  <ScrollText className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
                  <span>v{CURRENT_APP_VERSION}</span>
                  <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase bg-amber-100/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 group-hover:bg-amber-600 group-hover:text-white transition-colors">
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

      <DesktopDownloadModal
        isOpen={desktopModalOpen}
        onClose={() => setDesktopModalOpen(false)}
      />
    </>
  );
};
