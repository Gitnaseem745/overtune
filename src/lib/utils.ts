export function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
