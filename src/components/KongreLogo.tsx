import React from 'react';

interface KongreLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'gradient' | 'flat' | 'solid';
}

/**
 * Icono de panel de 4 cuadrados de Kongre (cuadrícula 2x2 armónica)
 */
export const KongreLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo Kongre (Panel de 4 cuadrados)"
    >
      {/* 4 cuadrados redondeados formando el panel modular */}
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.8" fill="currentColor" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" fill="currentColor" fillOpacity="0.88" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" fill="currentColor" fillOpacity="0.88" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8" fill="currentColor" fillOpacity="0.68" />
    </svg>
  );
};

/**
 * Contenedor estilizado para el logotipo de Kongre
 */
export const KongreLogo: React.FC<KongreLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'gradient',
}) => {
  const sizeMap = {
    xs: 'w-6 h-6 p-1 rounded-lg',
    sm: 'w-7 h-7 p-1 rounded-xl',
    md: 'w-8 h-8 p-1.5 rounded-xl',
    lg: 'w-9 h-9 sm:w-10 sm:h-10 p-2 rounded-xl',
    xl: 'w-12 h-12 p-2.5 rounded-2xl',
  };

  const variantMap = {
    gradient: 'bg-linear-to-tr from-indigo-600 via-indigo-500 to-blue-500 text-white shadow-xs',
    flat: 'bg-indigo-600 text-white shadow-xs',
    solid: 'bg-indigo-700 dark:bg-indigo-600 text-white shadow-md',
  };

  return (
    <div
      className={`flex items-center justify-center shrink-0 ${variantMap[variant]} ${sizeMap[size]} ${className}`}
      title="Kongre"
    >
      <KongreLogoIcon className="w-full h-full" />
    </div>
  );
};

export default KongreLogo;
