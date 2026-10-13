/**
 * Overtone iOS — Theme Hook
 *
 * Provides theme-aware colors based on system appearance.
 */

import { useThemeStore } from '../store/useThemeStore';
import type { ThemeColors, ColorScheme } from '../design/colors';

export function useTheme(): {
  colors: ThemeColors;
  scheme: ColorScheme;
  isDark: boolean;
  isSleek: boolean;
  setScheme: (scheme: ColorScheme) => void;
} {
  const { colors, scheme, isDark, isSleek, setScheme } = useThemeStore();
  return { colors, scheme, isDark, isSleek, setScheme };
}
