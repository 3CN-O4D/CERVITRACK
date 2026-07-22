import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { getItem, setItem } from '../services/storage';

export interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  border: string;
  error: string;
  danger: string;
  success: string;
  warning: string;
  inputBg: string;
  tabBar: string;
  statusBar: string;
}

const light: ThemeColors = {
  bg: '#FCFBFE',
  card: '#FFFFFF',
  text: '#1E1A4B',
  textSecondary: '#7E84A3',
  primary: '#6C5CE7',
  primaryLight: '#F6F3FF',
  secondary: '#A0A5BA',
  accent: '#00C853',
  border: '#F1F2F6',
  error: '#FF4D4D',
  danger: '#E74C3C',
  success: '#00C853',
  warning: '#FFB800',
  inputBg: '#F8F7FF',
  tabBar: '#FFFFFF',
  statusBar: '#FCFBFE',
};

const dark: ThemeColors = {
  bg: '#0D0D1A',
  card: '#1A1A2E',
  text: '#F0F0FF',
  textSecondary: '#8E8EB0',
  primary: '#8B7CF7',
  primaryLight: '#1E1A3A',
  secondary: '#5A5A7A',
  accent: '#00E676',
  border: '#2A2A44',
  error: '#FF5252',
  danger: '#C0392B',
  success: '#00E676',
  warning: '#FFD740',
  inputBg: '#12122A',
  tabBar: '#1A1A2E',
  statusBar: '#0D0D1A',
};

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_KEY = '@cervitrack_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await getItem(THEME_KEY);
      if (stored === 'dark') setIsDark(true);
    })();
  }, []);

  const toggleTheme = async () => {
    setIsDark((prev) => {
      const next = !prev;
      setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  const colors = useMemo(() => (isDark ? dark : light), [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default ThemeContext;
