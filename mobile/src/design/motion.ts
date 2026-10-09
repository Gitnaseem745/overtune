/**
 * Overtone iOS Design System — Motion Tokens
 *
 * Respects Reduce Motion. Motion explains state;
 * it does not decorate every control.
 */
import { Easing } from 'react-native';

export const motion = {
  /** Quick feedback (button press, state change) */
  fast: {
    duration: 150,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },

  /** Standard transitions (sheets, navigation) */
  standard: {
    duration: 300,
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  },

  /** Expressive transitions (mini-player ↔ now-playing) */
  expressive: {
    duration: 400,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  },

  /** Spring-like for interactive gestures */
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
} as const;

export const reducedMotion = {
  fast: { duration: 0 },
  standard: { duration: 0 },
  expressive: { duration: 0 },
} as const;
