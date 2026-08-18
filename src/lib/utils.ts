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
    case 'retro':
      return '#ef9995';
    case 'valentine':
      return '#e96d7b';
    case 'pastel':
      return '#d1c1d7';
    case 'halloween':
      return '#f28c18';
    case 'synthwave':
      return '#e779c1';
    case 'cyberpunk':
      return '#ff7598';
    case 'aqua':
      return '#09ecf3';
    case 'cupcake':
      return '#65c3c8';
    case 'coffee':
      return '#db924b';
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
    case 'retro':
      return '#f4b3b0';
    case 'valentine':
      return '#f08e9a';
    case 'pastel':
      return '#dfd3e4';
    case 'halloween':
      return '#fa9f37';
    case 'synthwave':
      return '#ed93cd';
    case 'cyberpunk':
      return '#ff94af';
    case 'aqua':
      return '#38f2f7';
    case 'cupcake':
      return '#7ed0d5';
    case 'coffee':
      return '#e4a568';
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
  } catch {
    return '';
  }
}

