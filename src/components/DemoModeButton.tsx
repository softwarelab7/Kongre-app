import React from 'react';

export interface DemoModeButtonProps {
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'onBrand';
  title?: string;
  size?: 'sm' | 'md';
}

/**
 * DemoModeButton - Botón estándar, minimalista y serio de Modo Demo para toda la app Kongre.
 * Mantiene coherencia visual absoluta en barra de navegación, portal de bienvenida y cockpit.
 */
export const DemoModeButton: React.FC<DemoModeButtonProps> = ({
  onClick,
  className = '',
  variant = 'default',
  title = 'Entrar a Kongre en Modo Demostración',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3.5 text-xs';

  if (variant === 'onBrand') {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`inline-flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold backdrop-blur-xs transition-all cursor-pointer shadow-2xs active:scale-95 ${sizeClasses} ${className}`}
      >
        <span>Modo Demo</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 ${sizeClasses} ${className}`}
    >
      <span>Modo Demo</span>
    </button>
  );
};

export default DemoModeButton;
