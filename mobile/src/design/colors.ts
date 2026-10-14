/**
 * Overtone iOS Design System — Color Tokens
 *
 * Warm, expressive palette built around album artwork,
 * deep neutral surfaces, and a restrained accent.
 * Supports both light and dark appearances.
 */

export const palette = {
  // Brand — Overtone Warm Amber/Yellow
  accent: '#F9A826',       // signature warm amber-yellow
  accentLight: '#FBBF24',
  accentDark: '#D97706',
  accentSubtle: 'rgba(249, 168, 38, 0.15)',
  accentGlow: 'rgba(249, 168, 38, 0.40)',

  // Surfaces – Dark
  darkBg: '#0A0A0F',
  darkSurface: '#13131A',
  darkSurfaceElevated: '#1C1C26',
  darkSurfaceOverlay: '#252532',
  darkBorder: 'rgba(255, 255, 255, 0.08)',

  // Surfaces – Light
  lightBg: '#FAFAF8',
  lightSurface: '#FFFFFF',
  lightSurfaceElevated: '#F5F5F2',
  lightSurfaceOverlay: '#EBEBEA',
  lightBorder: 'rgba(0, 0, 0, 0.08)',

  // Text – Dark
  darkTextPrimary: '#F0EEEC',
  darkTextSecondary: '#9A9898',
  darkTextTertiary: '#5E5D5C',

  // Text – Light
  lightTextPrimary: '#1A1918',
  lightTextSecondary: '#6B6966',
  lightTextTertiary: '#A3A09D',

  // Semantic
  success: '#4CAF82',
  warning: '#F59E0B',
  error: '#D94F4F',
  info: '#5B8DEF',

  // Playback
  progressTrack: 'rgba(255, 255, 255, 0.14)',
  progressFill: '#F9A826',

  // Common
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

/** Theme-aware color sets (Sleek is the sole canonical theme) */
export const colors = {
  sleek: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFDF5',
    surfaceOverlay: '#FEF3C7',
    border: 'rgba(249, 168, 38, 0.18)',
    textPrimary: '#1F180B',
    textSecondary: '#786C5A',
    textTertiary: '#A89E8C',
    accent: '#F9A826',
    accentLight: '#FBBF24',
    accentSubtle: 'rgba(249, 168, 38, 0.15)',
    tabBar: 'rgba(255, 255, 255, 0.94)',
    tabBarInactive: '#A89E8C',
    miniPlayer: '#1A1408',
    error: palette.error,
    success: palette.success,
    warning: palette.warning,
  },
  dark: {
    background: '#0A0A0F',
    surface: '#13131A',
    surfaceElevated: '#1C1C26',
    surfaceOverlay: '#252532',
    border: 'rgba(249, 168, 38, 0.18)',
    textPrimary: '#F0EEEC',
    textSecondary: '#9A9898',
    textTertiary: '#5E5D5C',
    accent: '#F9A826',
    accentLight: '#FBBF24',
    accentSubtle: 'rgba(249, 168, 38, 0.15)',
    tabBar: 'rgba(10, 10, 15, 0.92)',
    tabBarInactive: '#5E5D5C',
    miniPlayer: '#18182280',
    error: palette.error,
    success: palette.success,
    warning: palette.warning,
  },
  light: {
    background: '#FAFAF8',
    surface: '#FFFFFF',
    surfaceElevated: '#F5F5F2',
    surfaceOverlay: '#EBEBEA',
    border: 'rgba(249, 168, 38, 0.18)',
    textPrimary: '#1A1918',
    textSecondary: '#6B6966',
    textTertiary: '#A3A09D',
    accent: '#F9A826',
    accentLight: '#D97706',
    accentSubtle: 'rgba(249, 168, 38, 0.15)',
    tabBar: 'rgba(250, 250, 248, 0.92)',
    tabBarInactive: '#A3A09D',
    miniPlayer: 'rgba(255, 255, 255, 0.88)',
    error: palette.error,
    success: palette.success,
    warning: palette.warning,
  },
} as const;

export const sleekTokens = {
  // Drawer (Sidebar underneath) - Warm Obsidian Amber
  drawerBgTop: '#000000ff',
  drawerBgMid: '#140F06',
  drawerBgBottom: '#0C0A04',
  avatarGlow: 'rgba(249, 168, 38, 0.40)', // Overtone warm amber aura
  avatarBorderRadius: 22,
  greetingText: '#A89E8C',
  userNameText: '#FFFFFF',
  navTextActive: '#F9A826',               // Warm amber active navigation text
  navTextInactive: '#968D7B',
  navPillBg: 'rgba(249, 168, 38, 0.20)', // Restrained amber pill background
  navPillBorder: 'rgba(249, 168, 38, 0.38)',
  navPillGlow: 'rgba(249, 168, 38, 0.28)',

  // 3D Perspective Card Layers - Luminous Golden Sand & Amber
  ambientCanvasBg: '#F3E8CE',             // Warm champagne amber canvas
  ambientCanvasBgLight: '#FDF8EC',        // Luminous glowing sand canvas
  cardLayer3Bg: 'rgba(180, 115, 20, 0.65)', // Deep warm amber layer
  cardLayer3Border: 'rgba(255, 255, 255, 0.25)',
  cardLayer2Bg: 'rgba(245, 175, 45, 0.68)', // Luminous amber perspective card
  cardLayer2Border: 'rgba(255, 255, 255, 0.40)',
  cardLayer1Shadow: 'rgba(30, 20, 5, 0.48)',
  cardBorderRadius: 36,

  // Main Screen (Foremost Card) - Signature Warm Amber Gradient
  headerGradientStart: '#E68A00',         // Vibrant rich amber header
  headerGradientEnd: '#FBBF24',           // Luminous golden amber header
  headerBg: '#E68A00',
  headerText: '#FFFFFF',
  headerSubtext: 'rgba(255, 255, 255, 0.88)',
  sheetBg: '#FFFFFF',
  handlePill: '#EAE3D2',                  // Warm sand handle pill
  textPrimary: '#1F180B',                 // Deep warm charcoal text
  seeMoreText: '#968D7B',                 // Warm sand see more text
  playPillBg: '#FFFFFF',
  playPillIcon: '#F9A826',                // Amber play icon
  miniPlayerBg: '#1A1408',                // Deep warm obsidian miniplayer
  miniPlayerText: '#FFFFFF',
  miniPlayerSub: '#B8A88E',               // Warm champagne subtext
  miniPlayerBtn: '#FFFFFF',
  miniPlayerBtnIcon: '#D97706',           // Deep amber miniplayer action icon
  accent: '#F9A826',
  accentLight: '#FBBF24',
  accentGlow: 'rgba(249, 168, 38, 0.45)',
  accentSubtle: 'rgba(249, 168, 38, 0.15)',
} as const;

export interface ThemeColors {
  readonly background: string;
  readonly surface: string;
  readonly surfaceElevated: string;
  readonly surfaceOverlay: string;
  readonly border: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textTertiary: string;
  readonly accent: string;
  readonly accentLight: string;
  readonly accentSubtle: string;
  readonly tabBar: string;
  readonly tabBarInactive: string;
  readonly miniPlayer: string;
  readonly error: string;
  readonly success: string;
  readonly warning: string;
}
export type ColorScheme = 'sleek' | 'dark' | 'light';
