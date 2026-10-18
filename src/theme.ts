import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'cabina';
const KEY = 'kongre-theme';
const BAR: Record<Theme, string> = { light: '#4C3AED', dark: '#111827', cabina: '#000000' };

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.dataset.theme = t;
  if (t === 'dark' || t === 'cabina') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  if (t === 'cabina') {
    root.classList.add('theme-cabina');
  } else {
    root.classList.remove('theme-cabina');
  }
  try {
    localStorage.setItem(KEY, t);
    localStorage.setItem('kongre_theme', t);
  } catch {}
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[t]);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.dataset.theme as Theme) || 'light'
  );
  useEffect(() => { applyTheme(theme); }, [theme]);
  return { theme, setTheme };
}
