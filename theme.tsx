import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type AppTheme = 'dark' | 'light';

export type ThemePalette = {
  mode: AppTheme;
  bgColors: string[];
  glow: string;
  darkGlow: string;
  dotColor: (alpha: number) => string;
  overlay: string[];
  card: string;
  cardFill: string;
  border: string;
  text: string;
  textDim: string;
  primary: string;
  primaryDark: string;
  bgMain: string;
};

export const THEMES: Record<AppTheme, ThemePalette> = {
  dark: {
    mode: 'dark',
    bgColors: ['#230D1E', '#1C0A18', '#160813', '#11050F', '#160813', '#1C0A18', '#230D1E'],
    glow: 'rgba(215,171,106,0.08)',
    darkGlow: 'rgba(0,0,0,0.25)',
    dotColor: (a) => `rgba(215,171,106,${a * 0.8})`,
    overlay: ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.3)'],
    card: 'rgba(26,9,22,0.75)',
    cardFill: 'rgba(42,16,36,0.65)',
    border: 'rgba(215,171,106,0.3)',
    text: '#FFFFFF',
    textDim: '#CBAF8C',
    primary: '#D7AB6A',
    primaryDark: '#11050F',
    bgMain: '#11050F',
  },
  light: {
    mode: 'light',
    bgColors: ['#FDFBF7', '#F8F4EA', '#F1EADC', '#EAE0CB', '#F1EADC', '#F8F4EA', '#FDFBF7'],
    glow: 'rgba(75,29,63,0.06)',
    darkGlow: 'rgba(255,255,255,0.40)',
    dotColor: (a) => `rgba(75,29,63,${Math.min(a * 0.5, 0.25)})`,
    overlay: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.4)'],
    card: 'rgba(255,255,255,0.92)',
    cardFill: 'rgba(255,255,255,0.82)',
    border: 'rgba(75,29,63,0.25)',
    text: '#31122B',
    textDim: '#73586C',
    primary: '#4B1D3F',
    primaryDark: '#31122B',
    bgMain: '#EAE0CB',
  },
};

const ThemeContext = createContext<{ theme: ThemePalette; mode: AppTheme; toggleTheme: () => void }>({
  theme: THEMES.dark,
  mode: 'dark',
  toggleTheme: () => {},
});

export const THEME_KEY = 'kworks_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppTheme>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark') setMode(v);
      })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
      return next;
    });
  };

  return <ThemeContext.Provider value={{ theme: THEMES[mode], mode, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);