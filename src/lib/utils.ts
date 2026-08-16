import { AccentColor } from '../types/music';

export function formatTime(seconds: number): string {
  if (seconds === undefined || seconds === null || !isFinite(seconds) || seconds <= 0) {
    return '--:--';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function getAccentColorHex(accent: AccentColor = 'orange'): string {
  switch (accent) {
    case 'green':
      return '#1db954';
    case 'purple':
      return '#a855f7';
    case 'blue':
      return '#3b82f6';
    case 'orange':
    default:
      return '#f9a826';
  }
}

export function getAccentHoverHex(accent: AccentColor = 'orange'): string {
  switch (accent) {
    case 'green':
      return '#1ed760';
    case 'purple':
      return '#c084fc';
    case 'blue':
      return '#60a5fa';
    case 'orange':
    default:
      return '#ea9719';
  }
}

/**
 * Encodes a local file path into a local:// URL using base64 in a query param.
 * Avoids all URL parsing issues with Windows drive letters and special chars.
 */
export function getLocalUrl(filePath?: string | null): string {
  if (!filePath) return '';
  try {
    const base64 = btoa(unescape(encodeURIComponent(filePath)));
    return `local://file?p=${base64}`;
  } catch (e) {
    return '';
  }
}

