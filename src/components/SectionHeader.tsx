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
  subtitle,
  badgeText,
  badgeColor,
  actions,
  children,
}) => {
  if (!actions && !children && !subtitle && !badgeText) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      {subtitle || badgeText ? (
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          {badgeText && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                badgeColor || 'bg-slate-200/80 text-slate-700 dark:bg-white/10 dark:text-slate-300'
              }`}
            >
              {badgeText}
            </span>
          )}
          {subtitle && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">
              {subtitle}
            </p>
          )}
        </div>
      ) : (
        <div />
      )}
      {(actions || children) && (
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
};
