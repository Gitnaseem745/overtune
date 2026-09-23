import { globalShortcut, BrowserWindow } from 'electron';

export interface ShortcutMap {
  playPause: string;
  nextTrack: string;
  prevTrack: string;
  volumeUp: string;
  volumeDown: string;
  toggleLyrics: string;
  toggleMiniplayer: string;
}

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  playPause: 'MediaPlayPause',
  nextTrack: 'MediaTrackNext',
  prevTrack: 'MediaTrackPrevious',
  volumeUp: 'VolumeUp',
  volumeDown: 'VolumeDown',
  toggleLyrics: 'CommandOrControl+L',
  toggleMiniplayer: 'CommandOrControl+M',
};

/**
 * Validate shortcuts and check for duplicates or conflicting accelerators.
 */
export function validateShortcuts(shortcuts: Partial<ShortcutMap>): { valid: boolean; conflicts: string[] } {
  const seen = new Map<string, string>();
  const conflicts: string[] = [];

  for (const [action, key] of Object.entries(shortcuts)) {
    if (!key || key.trim() === '') continue;
    const normalized = key.trim().toLowerCase();
    if (seen.has(normalized)) {
      conflicts.push(`"${action}" conflicts with "${seen.get(normalized)}" on key "${key}"`);
    } else {
      seen.set(normalized, action);
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Register global keyboard shortcuts in Electron.
 */
export function registerShortcuts(
  getWin: () => BrowserWindow | null,
  shortcuts: ShortcutMap
): { registered: string[]; failed: string[] } {
  // Always unregister existing global shortcuts first
  globalShortcut.unregisterAll();

  const registered: string[] = [];
  const failed: string[] = [];

  const handlers: Record<keyof ShortcutMap, () => void> = {
    playPause: () => {
      const win = getWin();
      if (win && !win.isDestroyed()) {
        win.webContents.send('playback:togglePlay');
      }
    },
    nextTrack: () => {
      const win = getWin();
      if (win && !win.isDestroyed()) {
        win.webContents.send('playback:next');
      }
    },
    prevTrack: () => {
      const win = getWin();
      if (win && !win.isDestroyed()) {
        win.webContents.send('playback:prev');
      }
    },
    volumeUp: () => {
      const win = getWin();
      if (win && !win.isDestroyed()) {
        win.webContents.send('playback:volumeStep', 0.05);
      }
    },
    volumeDown: () => {
      const win = getWin();
      if (win && !win.isDestroyed()) {
        win.webContents.send('playback:volumeStep', -0.05);
      }
    },
    toggleLyrics: () => {
      const win = getWin();
      if (win && !win.isDestroyed()) {
        win.webContents.send('ui:toggleLyrics');
      }
    },
    toggleMiniplayer: () => {
      const win = getWin();
      if (win && !win.isDestroyed()) {
        win.webContents.send('ui:toggleMiniplayer');
      }
    },
  };

  for (const [action, accelerator] of Object.entries(shortcuts)) {
    if (!accelerator || accelerator.trim() === '') continue;
    const actionKey = action as keyof ShortcutMap;
    const handler = handlers[actionKey];

    if (handler) {
      try {
        const success = globalShortcut.register(accelerator, handler);
        if (success) {
          registered.push(accelerator);
        } else {
          failed.push(accelerator);
        }
      } catch (err) {
        console.warn(`[Shortcuts] Failed to register accelerator "${accelerator}" for "${action}":`, err);
        failed.push(accelerator);
      }
    }
  }

  return { registered, failed };
}

/**
 * Unregister all global shortcuts.
 */
export function unregisterShortcuts(): void {
  try {
    globalShortcut.unregisterAll();
  } catch (err) {
    console.error('[Shortcuts] Error unregistering global shortcuts:', err);
  }
}
