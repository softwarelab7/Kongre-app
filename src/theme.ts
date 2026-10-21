import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'kongre-theme';
const BAR: Record<Theme, string> = { light: '#4C3AED', dark: '#111827' };

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  const cleanTheme: Theme = t === 'dark' ? 'dark' : 'light';
  root.dataset.theme = cleanTheme;
  if (cleanTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.classList.remove('theme-cabina');
  try {
    localStorage.setItem(KEY, cleanTheme);
    localStorage.setItem('kongre_theme', cleanTheme);
  } catch {}
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[cleanTheme] || '#4C3AED');
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => ((document.documentElement.dataset.theme as Theme) === 'dark' ? 'dark' : 'light')
  );
  useEffect(() => { applyTheme(theme); }, [theme]);
  return { theme, setTheme };
}
