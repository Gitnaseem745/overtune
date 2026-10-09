/**
 * Overtone iOS Design System — Typography
 *
 * Uses SF Pro (system) through React Native's default.
 * Provides a clear ladder for screen titles, metadata, labels, and captions.
 */
import { TextStyle, Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  default: 'System',
});

export const typography = {
  /** Large screen titles (e.g. Listen, Library) */
  largeTitle: {
    fontFamily,
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.37,
  } as TextStyle,

  /** Section / screen titles */
  title1: {
    fontFamily,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: 0.36,
  } as TextStyle,

  /** Subsection titles */
  title2: {
    fontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: 0.35,
  } as TextStyle,

  /** Card / item titles (album, track) */
  title3: {
    fontFamily,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: 0.38,
  } as TextStyle,

  /** Headlines */
  headline: {
    fontFamily,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.41,
  } as TextStyle,

  /** Body text */
  body: {
    fontFamily,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.41,
  } as TextStyle,

  /** Callouts */
  callout: {
    fontFamily,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.32,
  } as TextStyle,

  /** Subheadlines */
  subheadline: {
    fontFamily,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.24,
  } as TextStyle,

  /** Footnotes */
  footnote: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.08,
  } as TextStyle,

  /** Small captions */
  caption1: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0,
  } as TextStyle,

  /** Tiny captions */
  caption2: {
    fontFamily,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
    letterSpacing: 0.07,
  } as TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;
