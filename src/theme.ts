import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'sepia';
const KEY = 'kongre-theme';
const BAR: Record<Theme, string> = { light: '#4C3AED', dark: '#111827', sepia: '#F4ECD8' };

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  const cleanTheme: Theme = t === 'dark' ? 'dark' : t === 'sepia' ? 'sepia' : 'light';
  root.dataset.theme = cleanTheme;
  if (cleanTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('theme-sepia');
  } else if (cleanTheme === 'sepia') {
    root.classList.remove('dark');
    root.classList.add('theme-sepia');
  } else {
    root.classList.remove('dark');
    root.classList.remove('theme-sepia');
  }
  root.classList.remove('theme-cabina');
  try {
    localStorage.setItem(KEY, cleanTheme);
    localStorage.setItem('kongre_theme', cleanTheme);
    localStorage.setItem('theme', cleanTheme);
  } catch {}
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[cleanTheme] || '#4C3AED');
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  return { theme, setTheme };
}
