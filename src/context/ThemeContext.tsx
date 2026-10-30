import React, { createContext, useContext, useState, useEffect } from 'react';
import { applyTheme, Theme as BrandTheme } from '../theme';

export type ThemeMode = 'light' | 'dark' | 'sepia';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isSepia: boolean;
  isCabinaMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Siempre predeterminado en modo Claro ('light') al iniciar la aplicación
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  const applyThemeToDOM = (mode: ThemeMode) => {
    applyTheme(mode as BrandTheme);
  };

  useEffect(() => {
    try {
      localStorage.setItem('kongre_theme', themeMode);
      localStorage.setItem('kongre-theme', themeMode);
      localStorage.setItem('theme', themeMode);
    } catch (e) {
      // ignore
    }
    applyThemeToDOM(themeMode);
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    const cleanMode: ThemeMode = mode === 'dark' ? 'dark' : mode === 'sepia' ? 'sepia' : 'light';
    try {
      localStorage.setItem('kongre_theme', cleanMode);
      localStorage.setItem('kongre-theme', cleanMode);
      localStorage.setItem('theme', cleanMode);
    } catch (e) {}
    applyThemeToDOM(cleanMode);
    setThemeModeState(cleanMode);
  };

  const toggleTheme = () => {
    setThemeModeState((prev) => {
      const nextMode: ThemeMode = prev === 'dark' ? 'light' : 'dark';
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
        isDark: themeMode === 'dark',
        isSepia: themeMode === 'sepia',
        isCabinaMode: false,
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
