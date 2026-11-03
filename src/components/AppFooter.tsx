import React, { useState, useEffect } from 'react';
import { ScrollText, ShieldCheck, Scale, CloudOff, Sparkles } from 'lucide-react';
import { CURRENT_APP_VERSION } from '../utils/versionLog';
import Logo from '../Logo';
import { OfflineSyncBadge } from './OfflineSyncBadge';
import { TermsAndPrivacyModal, LegalModalTab, detectLegalRoute } from './TermsAndPrivacyModal';
import { DesktopUpdateInfo } from '../services/desktopUpdateService';

interface AppFooterProps {
  onOpenVersionModal?: () => void;
  onOpenQueueModal?: () => void;
  desktopUpdate?: DesktopUpdateInfo | null;
  onOpenDesktopUpdate?: () => void;
  isOnline?: boolean;
  isDemoMode?: boolean;
  variant?: 'app' | 'landing';
}

export const AppFooter: React.FC<AppFooterProps> = ({
  onOpenVersionModal,
  onOpenQueueModal,
  desktopUpdate,
  onOpenDesktopUpdate,
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
        className={`kg-glass-surface w-full mt-auto shrink-0 border-t border-zinc-200/80 dark:border-white/10 bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-xl select-none transition-colors z-20 ${
          variant === 'app' ? 'pb-20 md:pb-0' : ''
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2">
          {/* Mobile Layout (Clean 2-row structure) */}
          <div className="flex md:hidden flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Logo variant="isotipo" className="w-5 h-5 object-contain shrink-0" />
                <span className="font-extrabold text-zinc-900 dark:text-[#F4F4F5] text-xs tracking-tight">
                  Kongre
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                {isOnline ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>En línea</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                    <CloudOff className="w-3 h-3 text-amber-500" />
                    <span>Offline</span>
                  </span>
                )}
              </div>

              {onOpenVersionModal && (
                <button
                  type="button"
                  onClick={onOpenVersionModal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] text-[10.5px] font-semibold border border-zinc-200 dark:border-[#27272A] active:scale-95 cursor-pointer shrink-0"
                >
                  <ScrollText className="w-3 h-3 text-amber-500" />
                  <span className="font-mono tabular-nums">v{CURRENT_APP_VERSION}</span>
                  <span className="px-1 py-0.2 rounded text-[8.5px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                    Alfa
                  </span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 text-[11px] font-medium text-zinc-500 dark:text-[#A1A1AA] border-t border-zinc-100 dark:border-[#27272A] pt-1.5">
              <button
                type="button"
                onClick={() => handleOpenLegal('terms')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
              >
                Términos de Uso
              </button>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
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
              <span className="font-extrabold text-zinc-900 dark:text-[#F4F4F5] text-xs sm:text-sm tracking-tight">
                Kongre
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span className="text-[11.5px] text-zinc-500 dark:text-[#A1A1AA] font-medium">
                Gestor Teocrático Integral
              </span>
            </div>

            {/* Center: Essential Legal Links without clutter */}
            <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500 dark:text-[#A1A1AA]">
              <button
                type="button"
                onClick={() => handleOpenLegal('terms')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer flex items-center gap-1.5"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-500/70" />
                <span>Términos de Uso</span>
              </button>

              <span className="text-zinc-300 dark:text-zinc-700">·</span>

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
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>En línea</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[11px] font-bold">
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

              {/* Desktop Update Available Pill */}
              {desktopUpdate?.hasUpdate && (
                <button
                  type="button"
                  onClick={onOpenDesktopUpdate}
                  className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-md shadow-amber-500/25 transition-all cursor-pointer text-xs font-bold animate-pulse"
                  title={`¡Actualización disponible a v${desktopUpdate.latestVersion}! Pulsa para ver detalles.`}
                >
                  <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                  <span>Actualizar a v{desktopUpdate.latestVersion}</span>
                </button>
              )}

              {/* Version Pill */}
              {onOpenVersionModal && (
                <button
                  type="button"
                  onClick={onOpenVersionModal}
                  className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-[#18181F] dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#F4F4F5] hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-2xs active:scale-95 text-xs font-semibold"
                  title="Ver registro de versiones y novedades"
                >
                  <ScrollText className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-6 transition-transform" />
                  <span className="font-mono tabular-nums">v{CURRENT_APP_VERSION}</span>
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
