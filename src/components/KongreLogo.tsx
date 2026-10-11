import React, { useId } from 'react';

export interface KongreLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'gradient' | 'flat' | 'solid' | 'transparent';
  showBackground?: boolean;
  title?: string;
}

/**
 * Logotipo oficial de Kongre
 * Inspirado directamente en el favicon oficial de la aplicación:
 * - Lienzo squircle redondeado (rx=112) con degradado índigo profundo (desde #4f46e5 pasando por #4338ca hasta #1e1b4b).
 * - Cuadrícula 2x2 armónica con sutil sombra:
 *   - Superior Izquierda: Blanco nítido con degradado suave (#ffffff -> #e0e7ff)
 *   - Superior Derecha: Índigo suave aperlado (#c7d2fe -> #818cf8, 92% opacidad)
 *   - Inferior Izquierda: Índigo suave aperlado (#c7d2fe -> #818cf8, 92% opacidad)
 *   - Inferior Derecha: Acento cian eléctrico (#38bdf8, 95% opacidad)
 */
export const KongreLogo: React.FC<KongreLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'gradient',
  showBackground = true,
  title = 'Kongre',
}) => {
  const rawId = useId();
  // Safe HTML/SVG identifier without colons
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');

  const bgGradId = `kongre_bg_${safeId}`;
  const tileGrad1Id = `kongre_tile1_${safeId}`;
  const tileGrad2Id = `kongre_tile2_${safeId}`;
  const shadowId = `kongre_shadow_${safeId}`;

  const sizeMap: Record<NonNullable<KongreLogoProps['size']>, string> = {
    xs: 'w-6 h-6',
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16',
  };

  const hasBackground = showBackground && variant !== 'transparent';
  const hasCustomWidth = className.includes('w-') || className.includes('size-');
  const sizeClasses = hasCustomWidth ? '' : sizeMap[size];

  return (
    <svg
      viewBox={hasBackground ? '0 0 512 512' : '100 100 312 312'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${sizeClasses} ${className}`}
      aria-label={title}
      role="img"
    >
      <title>{title}</title>
      <defs>
        {/* Degradado de fondo índigo profundo a azul medianoche */}
        <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="50%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>

        {/* Mosaico superior izquierdo: blanco puro a lavanda sutil */}
        <linearGradient id={tileGrad1Id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>

        {/* Mosaicos aperlados (superior derecho e inferior izquierdo) */}
        <linearGradient id={tileGrad2Id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c7d2fe" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>

        {/* Sombra suave bajo los 4 paneles */}
        <filter id={shadowId} x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#0f172a" floodOpacity="0.32" />
        </filter>
      </defs>

      {/* Lienzo squircle redondeado oficial de Kongre */}
      {hasBackground && (
        <rect
          width="512"
          height="512"
          rx="112"
          fill={`url(#${bgGradId})`}
        />
      )}

      {/* Cuadrícula icónica de 4 paneles */}
      <g filter={hasBackground ? `url(#${shadowId})` : undefined}>
        {/* Mosaico Superior Izquierdo: Blanco */}
        <rect x="116" y="116" width="126" height="126" rx="28" fill={`url(#${tileGrad1Id})`} />
        {/* Mosaico Superior Derecho: Índigo Perla */}
        <rect x="270" y="116" width="126" height="126" rx="28" fill={`url(#${tileGrad2Id})`} fillOpacity="0.92" />
        {/* Mosaico Inferior Izquierdo: Índigo Perla */}
        <rect x="116" y="270" width="126" height="126" rx="28" fill={`url(#${tileGrad2Id})`} fillOpacity="0.92" />
        {/* Mosaico Inferior Derecho: Acento Cian Kongre */}
        <rect x="270" y="270" width="126" height="126" rx="28" fill="#38bdf8" fillOpacity="0.92" />
      </g>
    </svg>
  );
};

/**
 * Icono de panel de 4 cuadrados sin fondo
 */
export const KongreLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
  return <KongreLogo showBackground={false} className={className} />;
};

export default KongreLogo;
