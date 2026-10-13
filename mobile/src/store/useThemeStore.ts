/**
 * Overtone iOS — Theme Store (Zustand)
 *
 * Manages active theme: 'sleek' | 'dark' | 'light'.
 * Defaults to 'sleek' to match the signature iOS sleek UI redesign.
 */

import { create } from 'zustand';
import { colors, type ThemeColors, type ColorScheme } from '../design/colors';

interface ThemeState {
  scheme: ColorScheme;
  colors: ThemeColors;
  isDark: boolean;
  isSleek: boolean;
  setScheme: (scheme: ColorScheme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  scheme: 'sleek',
  colors: colors.sleek,
  isDark: false,
  isSleek: true,
  setScheme: (_scheme: ColorScheme) => {
    // Sleek is the app's only theme
    set({
      scheme: 'sleek',
      colors: colors.sleek,
      isDark: false,
      isSleek: true,
    });
  },
  toggleTheme: () => {
    // Sleek is the app's only theme
    set({
      scheme: 'sleek',
      colors: colors.sleek,
      isDark: false,
      isSleek: true,
    });
  },
}));
