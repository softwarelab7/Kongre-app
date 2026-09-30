// src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'cabina';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isCabinaMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('kongre_theme') as ThemeMode;
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'cabina')) {
        return saved;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      // ignore
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('kongre_theme', themeMode);
    } catch (e) {
      // ignore
    }

    const root = document.documentElement;
    const metaTheme = document.querySelector('meta[name="theme-color"]');

    if (themeMode === 'light') {
      root.classList.remove('dark');
      root.classList.remove('theme-cabina');
      if (metaTheme) metaTheme.setAttribute('content', '#4f46e5');
    } else if (themeMode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('theme-cabina');
      if (metaTheme) metaTheme.setAttribute('content', '#0f172a');
    } else if (themeMode === 'cabina') {
      root.classList.add('dark');
      root.classList.add('theme-cabina');
      if (metaTheme) metaTheme.setAttribute('content', '#000000');
    }
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const toggleTheme = () => {
    setThemeModeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'cabina';
      return 'light';
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        toggleTheme,
        isDark: themeMode === 'dark' || themeMode === 'cabina',
        isCabinaMode: themeMode === 'cabina',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
