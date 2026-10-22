// src/components/AutoLockRing.tsx
import React from 'react';

export interface AutoLockRingProps {
  size: number;
  stroke: number;
  fraction: number; // 0 to 1 (1 = lleno, 0 = vacío)
  state?: 'ok' | 'warn' | 'crit';
  colorClass?: string;
  isRefill?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const AutoLockRing: React.FC<AutoLockRingProps> = ({
  size,
  stroke,
  fraction,
  state = 'ok',
  colorClass,
  isRefill = false,
  className = '',
  children,
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, fraction));
  const dashoffset = c * (1 - clamped);

  // Selector de color dinámico según estado teocrático
  const getColorClass = () => {
    if (colorClass) return colorClass;
    switch (state) {
      case 'crit':
        return 'text-[#E11D48] dark:text-[#FB7185]';
      case 'warn':
        return 'text-[#D97706] dark:text-[#FBBF24]';
      case 'ok':
      default:
        return 'text-[#4C3AED] dark:text-[#9085F4]';
    }
  };

  return (
    <span
      className={`kg-ring ${getColorClass()} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      data-state={state}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        aria-hidden="true"
      >
        {/* Pista de fondo con opacidad suave */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.18}
          strokeWidth={stroke}
        />
        {/* Arco de progreso animado */}
        <circle
          className={`kg-arc ${isRefill ? 'refill' : ''}`}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <span className="relative z-10 flex flex-col items-center justify-center pointer-events-none">{children}</span>}
    </span>
  );
};
