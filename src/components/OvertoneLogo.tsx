'use client';

import React, { useId } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getAccentColorHex, getAccentHoverHex } from '../lib/utils';
import { AccentColor } from '../types/music';

interface OvertoneLogoProps {
  size?: number | string;
  className?: string;
  accentColor?: AccentColor;
  accentHex?: string;
  rounded?: 'full' | 'xl' | '2xl' | 'none';
  showShadow?: boolean;
}

export function OvertoneLogo({
  size = 32,
  className = '',
  accentColor: propAccentColor,
  accentHex: propAccentHex,
  rounded = 'full',
  showShadow = true,
}: OvertoneLogoProps) {
  const storeAccentColor = usePlayerStore((s) => s.accentColor);
  const activeAccent = propAccentColor || storeAccentColor || 'orange';
  const activeHex = propAccentHex || getAccentColorHex(activeAccent);
  const hoverHex = getAccentHoverHex(activeAccent);
  
  const gradientId = useId().replace(/:/g, '-');

  // Determine inner glyph color based on background contrast
  const glyphColor = '#121212';

  const roundedClasses = {
    full: 'rounded-full',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    none: '',
  }[rounded];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none transition-all duration-300 ${roundedClasses} ${
        showShadow ? 'shadow-xs' : ''
      } ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
      }}
      aria-label="Overtone Logo"
    >
      <defs>
        <linearGradient
          id={`overtone-grad-${gradientId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={activeHex} />
          <stop offset="100%" stopColor={hoverHex} />
        </linearGradient>
      </defs>

      {/* Dynamic Background Disc */}
      <circle
        cx="256"
        cy="256"
        r="248"
        fill={`url(#overtone-grad-${gradientId})`}
      />

      {/* Emblem Inner Glyphs */}
      <g color={glyphColor}>
        {/* Center Ring */}
        <circle
          cx="256"
          cy="266"
          r="44"
          stroke="currentColor"
          strokeWidth="22"
          fill="none"
        />

        {/* Center Wave Connectors */}
        <path
          d="M 212 266 Q 197 288 180 266"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 300 266 Q 315 244 332 266"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />

        {/* Top Concentric Sound Waves */}
        <path
          d="M 195.2 205.2 A 86 86 0 0 1 316.8 205.2"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 166.9 176.9 A 126 126 0 0 1 345.1 176.9"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 138.6 148.6 A 166 166 0 0 1 373.4 148.6"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />

        {/* Left Resonance Sound Waves */}
        <path
          d="M 178.9 174.1 A 120 120 0 0 0 178.9 357.9"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 154.4 145.0 A 158 158 0 0 0 154.4 387.0"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right Resonance Sound Waves */}
        <path
          d="M 333.1 174.1 A 120 120 0 0 1 333.1 357.9"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 357.6 145.0 A 158 158 0 0 1 357.6 387.0"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
