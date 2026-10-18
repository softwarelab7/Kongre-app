import React from 'react';
import { Sparkles, GitBranch, ShieldCheck, History, ExternalLink } from 'lucide-react';
import { CURRENT_APP_VERSION, BUILD_DATE, BUILD_ENVIRONMENT } from '../utils/versionLog';
import Logo from '../Logo';
import { OfflineSyncBadge } from './OfflineSyncBadge';

interface AppFooterProps {
  onOpenVersionModal: () => void;
  onOpenQueueModal?: () => void;
  isOnline?: boolean;
  isDemoMode?: boolean;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  onOpenVersionModal,
  onOpenQueueModal,
  isOnline = true,
  isDemoMode = false,
}) => {
  return (
    <footer className="w-full mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md select-none transition-colors pb-20 md:pb-0">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          {/* Left: Brand & Status */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <Logo variant="isotipo" className="w-6 h-6 object-contain" />
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                Kongre
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline">
                Gestor Teocrático Integral
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden md:inline">•</span>
              {/* Build status indicator */}
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">Sistema</span> En línea
              </div>
            </div>
          </div>

          {/* Right: Offline Sync Badge & Version pill */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenQueueModal && !isDemoMode && (
              <OfflineSyncBadge
                isOnline={isOnline}
                onOpenQueueModal={onOpenQueueModal}
              />
            )}

            <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden lg:inline">
              Actualizado: {BUILD_DATE}
            </span>

            <button
              type="button"
              onClick={onOpenVersionModal}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700/70 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-2xs active:scale-95 text-xs font-semibold"
              title="Ver registro de cambios y versiones de la aplicación"
            >
              <GitBranch className="w-3.5 h-3.5 text-indigo-500 group-hover:rotate-12 transition-transform" />
              <span>v{CURRENT_APP_VERSION}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                Changelog
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
