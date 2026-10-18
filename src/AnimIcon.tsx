import { useState, type CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';

export type Motion = 'tilt' | 'drop' | 'pulse' | 'wiggle' | 'blink' | 'rise' | 'flash';

/** Cuenta cuántas veces se activó (hover, foco o clic). */
export function usePlay() {
  const [n, set] = useState(0);
  return [n, () => set((v) => v + 1)] as const;
}

/** Ícono que se dibuja al entrar y hace su movimiento al activarse.
 *  Al subir `play`, se vuelve a dibujar y se mueve. */
export default function AnimIcon({
  icon: Icon, motion, delay = 0, size = 28, play = 0,
}: { icon: LucideIcon; motion: Motion; delay?: number; size?: number; play?: number }) {
  const style = { '--d': `${play > 0 ? 0 : delay}s`, '--m': `kg-${motion}` } as CSSProperties;
  return (
    <span key={play} className={`kg-ico inline-flex text-brand ${play > 0 ? 'kg-m' : ''}`} style={style}>
      <Icon size={size} strokeWidth={2} aria-hidden />
    </span>
  );
}
