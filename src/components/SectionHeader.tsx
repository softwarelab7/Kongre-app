import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  highlightWord?: string;
  highlight?: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  colorTheme?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon: Icon,
  title,
  highlightWord,
  highlight,
  subtitle,
  badgeText,
  badgeColor,
  actions,
  children,
}) => {
  const activeHighlight = highlightWord || highlight;
  return (
    <div className="px-3.5 sm:px-6 py-3 sm:py-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-slate-900/60 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 shadow-2xs">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-xs shrink-0">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5 leading-tight">
              <span>{title}</span>
              {activeHighlight && (
                <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 sm:px-2 py-0.5 rounded-lg text-base sm:text-lg">
                  {activeHighlight}
                </span>
              )}
            </h1>
            {badgeText && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor || 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300'}`}>
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
};
