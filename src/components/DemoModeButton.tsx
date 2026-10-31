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
  const sizeClasses = size === 'sm' ? 'h-8 px-2.5 text-[11px] sm:text-xs' : 'h-9 px-3.5 text-xs';
  const hasDisplayClass = /\b(hidden|flex|inline-flex|block|inline-block)\b/.test(className);
  const displayClass = hasDisplayClass ? '' : 'inline-flex';

  if (variant === 'onBrand') {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`${displayClass} items-center justify-center shrink-0 whitespace-nowrap rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold backdrop-blur-xs transition-all cursor-pointer shadow-2xs active:scale-95 ${sizeClasses} ${className}`}
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
      className={`${displayClass} items-center justify-center shrink-0 whitespace-nowrap rounded-xl border border-zinc-200 dark:border-[#27272A]/80 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 ${sizeClasses} ${className}`}
    >
      <span>Modo Demo</span>
    </button>
  );
};

export default DemoModeButton;
