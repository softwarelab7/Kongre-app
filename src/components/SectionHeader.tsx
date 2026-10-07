import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  highlightWord?: string;
  subtitle?: string;
  colorTheme?: string;
  actions?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon: Icon,
  title,
  highlightWord,
  subtitle,
  actions,
}) => {
  return (
    <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-white/[0.08] bg-white/50 dark:bg-slate-900/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-xs">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
            {title}
            {highlightWord && (
              <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg text-lg">
                {highlightWord}
              </span>
            )}
          </h1>
          {subtitle && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
};
