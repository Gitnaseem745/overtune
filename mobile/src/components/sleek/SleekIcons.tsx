/**
 * Overtone iOS — Sleek Theme SVG Icons
 *
 * Highly polished, precision vector icons inspired by Apple SF Pro
 * and luxury audio interfaces, styled in warm amber & gold.
 */

import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  fill?: string;
  filled?: boolean;
}

/** 1. Home icon: Clean minimalist house */
export function SleekHomeIcon({ size = 20, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L11.15 3.37C11.64 2.94 12.36 2.94 12.85 3.37L21 10.5C21.63 11.05 22 11.85 22 12.69V19C22 20.1 21.1 21 20 21H16C15.45 21 15 20.55 15 20V15C15 14.45 14.55 14 14 14H10C9.45 14 9 14.45 9 15V20C9 20.55 8.55 21 8 21H4C2.9 21 2 20.1 2 19V12.69C2 11.85 2.37 11.05 3 10.5Z"
        fill={color}
      />
    </Svg>
  );
}

/** 2. Favorites icon: Clean outline or filled heart */
export function SleekHeartIcon({ size = 20, color = '#968D7B', fill = 'none', filled = false }: IconProps) {
  const actualFill = filled || fill !== 'none' ? (fill !== 'none' ? fill : color) : 'none';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21.15L10.55 19.82C5.4 15.15 2 12.08 2 8.3C2 5.22 4.42 2.8 7.5 2.8C9.24 2.8 10.91 3.61 12 4.89C13.09 3.61 14.76 2.8 16.5 2.8C19.58 2.8 22 5.22 22 8.3C22 12.08 18.6 15.15 13.45 19.84L12 21.15Z"
        fill={actualFill}
        stroke={actualFill !== 'none' ? actualFill : color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 3. Playlists icon: Stacked music cards with beamed eighth note */
export function SleekPlaylistsIcon({ size = 20, color = '#968D7B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6.5C3 5.67 3.67 5 4.5 5H19.5C20.33 5 21 5.67 21 6.5C21 7.33 20.33 8 19.5 8H4.5C3.67 8 3 7.33 3 6.5Z"
        fill={color}
      />
      <Path
        d="M3 11.5C3 10.67 3.67 10 4.5 10H14.5C15.33 10 16 10.67 16 11.5C16 12.33 15.33 13 14.5 13H4.5C3.67 13 3 12.33 3 11.5Z"
        fill={color}
      />
      <Path
        d="M3 16.5C3 15.67 3.67 15 4.5 15H11.5C12.33 15 13 15.67 13 16.5C13 17.33 12.33 18 11.5 18H4.5C3.67 18 3 17.33 3 16.5Z"
        fill={color}
      />
      <Circle cx="18" cy="17" r="2.5" fill={color} />
      <Path
        d="M20.5 17V10C20.5 9.45 20.05 9 19.5 9C18.95 9 18.5 9.45 18.5 10V17"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 4. Search icon: Precision magnifying glass */
export function SleekSearchIcon({ size = 20, color = '#968D7B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

/** 5. Settings icon: Apple SF Symbols-style rounded 6-tooth gear */
export function SleekSettingsIcon({ size = 20, color = '#968D7B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 6. Menu / Hamburger icon */
export function SleekMenuIcon({ size = 24, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6.5" width="18" height="2.2" rx="1.1" fill={color} />
      <Rect x="3" y="14" width="13" height="2.2" rx="1.1" fill={color} />
    </Svg>
  );
}

/** 7. Play icon */
export function SleekPlayIcon({ size = 16, color = '#F9A826' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.5 4.8C7.5 3.9 8.5 3.3 9.3 3.8L20.2 10.7C20.9 11.2 20.9 12.3 20.2 12.8L9.3 19.7C8.5 20.2 7.5 19.6 7.5 18.7V4.8Z"
        fill={color}
      />
    </Svg>
  );
}

/** 8. Pause icon */
export function SleekPauseIcon({ size = 16, color = '#F9A826' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5.5" y="4" width="4" height="16" rx="2" fill={color} />
      <Rect x="14.5" y="4" width="4" height="16" rx="2" fill={color} />
    </Svg>
  );
}

/** 9. More / Context icon (vertical) */
export function SleekMoreIcon({ size = 18, color = '#9E9BB0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="1.8" fill={color} />
      <Circle cx="12" cy="12" r="1.8" fill={color} />
      <Circle cx="12" cy="19" r="1.8" fill={color} />
    </Svg>
  );
}

/** 10. Horizontal three dots icon */
export function SleekHorizontalMoreIcon({ size = 20, color = '#968D7B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="12" r="1.8" fill={color} />
      <Circle cx="12" cy="12" r="1.8" fill={color} />
      <Circle cx="19" cy="12" r="1.8" fill={color} />
    </Svg>
  );
}

/** 11. Speaker Low / Mute icon */
export function SleekSpeakerLowIcon({ size = 18, color = '#968D7B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 5L6 9H2V15H6L11 19V5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 12. Speaker High / Loud icon */
export function SleekSpeakerHighIcon({ size = 18, color = '#968D7B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 5L6 9H2V15H6L11 19V5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.5 8.5C16.4 9.4 17 10.6 17 12C17 13.4 16.4 14.6 15.5 15.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M19 5C20.8 6.8 22 9.3 22 12C22 14.7 20.8 17.2 19 19"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 13. Skip Previous (<<) icon */
export function SleekSkipBackIcon({ size = 20, color = '#968D7B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 18V6L2 12L11 18Z" fill={color} />
      <Path d="M21 18V6L12 12L21 18Z" fill={color} />
    </Svg>
  );
}

/** 14. Skip Next (>>) icon */
export function SleekSkipForwardIcon({ size = 20, color = '#968D7B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6V18L12 12L3 6Z" fill={color} />
      <Path d="M13 6V18L22 12L13 6Z" fill={color} />
    </Svg>
  );
}

/** 15. Repeat icon */
export function SleekRepeatIcon({ size = 20, color = '#968D7B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 2L21 6L17 10"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 11V9C3 7.34 4.34 6 6 6H21"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 22L3 18L7 14"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 13V15C21 16.66 19.66 18 18 18H3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 16. Share / Export icon */
export function SleekShareIcon({ size = 20, color = '#968D7B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12V20C4 20.55 4.45 21 5 21H19C19.55 21 20 20.55 20 20V12"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 3V15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M7 8L12 3L17 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** 17. Chevron Down icon for sheets/modals */
export function SleekChevronDownIcon({ size = 20, color = '#1F180B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** 18. Chevron Right icon (iOS list disclosure accessory) */
export function SleekChevronRightIcon({ size = 18, color = '#968D7B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6L15 12L9 18" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** 19. Lyrics icon */
export function SleekLyricsIcon({ size = 20, color = '#968D7B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 8H17M7 12H14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** 20. Queue icon */
export function SleekQueueIcon({ size = 20, color = '#968D7B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6H21M3 12H15M3 18H15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M19 14V20L23 17L19 14Z" fill={color} />
    </Svg>
  );
}

/** 21. Music Note icon (for library / empty states) */
export function SleekMusicNoteIcon({ size = 24, color = '#F9A826' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18V5L20 3V16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="6" cy="18" r="3" fill={color} />
      <Circle cx="17" cy="16" r="3" fill={color} />
    </Svg>
  );
}

/** 22. Import Audio Files icon */
export function SleekImportIcon({ size = 20, color = '#F9A826' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3V15M12 15L7 10M12 15L17 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 17V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** 23. Wi-Fi Desktop Sync icon */
export function SleekDesktopSyncIcon({ size = 22, color = '#F9A826' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="13" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M8 20H16M12 17V20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="10.5" r="1.5" fill={color} />
      <Path d="M9 8C10.6 6.7 13.4 6.7 15 8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M6.5 5.5C9.5 3.5 14.5 3.5 17.5 5.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

/** 24. Clean Checkmark icon */
export function SleekCheckIcon({ size = 16, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13L9.5 17.5L19 7" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** 25. Clean Plus icon */
export function SleekPlusIcon({ size = 16, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

/** 26. Clean Close / Dismiss icon */
export function SleekCloseIcon({ size = 16, color = '#968D7B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6L18 18M6 18L18 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

/** 27. Clean Trash / Delete icon */
export function SleekTrashIcon({ size = 18, color = '#DC2626' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6H21M8 6V4C8 3.45 8.45 3 9 3H15C15.55 3 16 3.45 16 4V6M19 6V20C19 20.55 18.55 21 18 21H6C5.45 21 5 20.55 5 20V6H19Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 11V16M14 11V16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** 28. Edit / Pencil icon */
export function SleekEditIcon({ size = 18, color = '#F9A826' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 29. Chevron Left / Back icon */
export function SleekChevronLeftIcon({ size = 20, color = '#1F180B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** 30. Shuffle icon */
export function SleekShuffleIcon({ size = 18, color = '#968D7B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 3H21V8M4 20L21 3M21 16V21H16M15 15L21 21M4 4L9 9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

