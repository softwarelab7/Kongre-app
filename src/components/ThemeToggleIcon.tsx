import type { ThemeMode } from '../context/ThemeContext';

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * Sol -> Luna animado con micro-transiciones suaves y física bezier.
 * Utiliza --tt-bg para el recorte de la luna, garantizando compatibilidad y fluidez total.
 */
export default function ThemeToggleIcon({
  mode,
  size = 20,
  className = '',
}: {
  mode: ThemeMode | string;
  size?: number;
  className?: string;
}) {
  const isDark = mode === 'dark';

  return (
    <span
      className={`tt ${className}`}
      data-mode={isDark ? 'dark' : 'light'}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg className="tt-sun" viewBox="0 0 24 24" fill="currentColor">
        <circle className="tt-disc" cx="12" cy="12" r="5" />
        <circle className="tt-bite" cx="12" cy="12" r="7" />
        <g className="tt-rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {RAYS.map((a) => (
            <line key={a} x1="12" y1="2.2" x2="12" y2="4.6" transform={`rotate(${a} 12 12)`} />
          ))}
        </g>
        <g className="tt-stars">
          <circle cx="18.2" cy="6.2" r="1" />
          <circle cx="20.6" cy="10.4" r="0.7" />
        </g>
      </svg>
    </span>
  );
}
