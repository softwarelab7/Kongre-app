import React, { createContext, useContext, useState, useEffect } from 'react';
import { applyTheme, Theme as BrandTheme } from '../theme';

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
      const saved = (localStorage.getItem('kongre-theme') || localStorage.getItem('kongre_theme')) as ThemeMode;
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

  const applyThemeToDOM = (mode: ThemeMode) => {
    applyTheme(mode as BrandTheme);
  };

  useEffect(() => {
    try {
      localStorage.setItem('kongre_theme', themeMode);
    } catch (e) {
      // ignore
    }
    applyThemeToDOM(themeMode);
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    try {
      localStorage.setItem('kongre_theme', mode);
    } catch (e) {}
    applyThemeToDOM(mode);
    setThemeModeState(mode);
  };

  const toggleTheme = () => {
    setThemeModeState((prev) => {
      let nextMode: ThemeMode = 'dark';
      if (prev === 'light') {
        nextMode = 'dark';
      } else if (prev === 'dark') {
        nextMode = 'cabina';
      } else if (prev === 'cabina') {
        nextMode = 'light';
      } else {
        nextMode = 'dark';
      }

      try {
        localStorage.setItem('kongre_theme', nextMode);
        localStorage.setItem('kongre-theme', nextMode);
        localStorage.setItem('theme', nextMode);
      } catch (e) {}
      applyThemeToDOM(nextMode);
      return nextMode;
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
