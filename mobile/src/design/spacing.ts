/**
 * Overtone iOS Design System — Spacing & Layout
 */

export const spacing = {
  /** 4px – tight gaps */
  xs: 4,
  /** 8px – small gaps */
  sm: 8,
  /** 12px – compact gaps */
  md: 12,
  /** 16px – standard gaps */
  lg: 16,
  /** 20px – comfortable gaps */
  xl: 20,
  /** 24px – section gaps */
  xxl: 24,
  /** 32px – large section gaps */
  xxxl: 32,
  /** 48px – screen-level padding */
  huge: 48,
} as const;

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 9999,
} as const;

export const hitSlop = {
  top: 8,
  right: 8,
  bottom: 8,
  left: 8,
} as const;

/** Minimum touch target per Apple HIG */
export const MIN_TOUCH_TARGET = 44;

/** Artwork sizes */
export const artworkSizes = {
  miniPlayer: 44,
  listRow: 52,
  albumGrid: 170,
  nowPlaying: 320,
  artistHero: 200,
} as const;

/** Tab bar + mini player heights */
export const layout = {
  tabBarHeight: 49,
  miniPlayerHeight: 64,
  headerHeight: 44,
} as const;
