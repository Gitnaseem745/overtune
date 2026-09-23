import { Tray, Menu, BrowserWindow, app, nativeImage } from 'electron';
import * as fs from 'fs';

let tray: Tray | null = null;
let currentTrackInfo = { title: '', artist: '', isPlaying: false };

/**
 * Initialize or update the system tray icon and context menu.
 */
export function initTray(
  iconPath: string,
  getWin: () => BrowserWindow | null
): Tray | null {
  if (tray) return tray;

  if (!iconPath || !fs.existsSync(iconPath)) {
    console.warn('[Tray] Icon path does not exist, skipping tray creation:', iconPath);
    return null;
  }

  try {
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    tray = new Tray(icon);
    tray.setToolTip('Overtone - Modern Local Music Player');

    const updateMenu = () => {
      const win = getWin();
      const isVisible = win && !win.isDestroyed() && win.isVisible();

      const trackLabel = currentTrackInfo.title
        ? `🎵 ${currentTrackInfo.title} — ${currentTrackInfo.artist}`
        : 'Overtone — Ready';

      const contextMenu = Menu.buildFromTemplate([
        {
          label: trackLabel,
          enabled: false,
        },
        { type: 'separator' },
        {
          label: currentTrackInfo.isPlaying ? 'Pause' : 'Play',
          click: () => {
            if (win && !win.isDestroyed()) {
              win.webContents.send('playback:togglePlay');
            }
          },
        },
        {
          label: 'Next Track',
          click: () => {
            if (win && !win.isDestroyed()) {
              win.webContents.send('playback:next');
            }
          },
        },
        {
          label: 'Previous Track',
          click: () => {
            if (win && !win.isDestroyed()) {
              win.webContents.send('playback:prev');
            }
          },
        },
        { type: 'separator' },
        {
          label: isVisible ? 'Minimize to Tray' : 'Show Overtone',
          click: () => {
            if (win && !win.isDestroyed()) {
              if (win.isVisible()) {
                win.hide();
              } else {
                win.show();
                win.focus();
              }
              updateMenu();
            }
          },
        },
        {
          label: 'Preferences...',
          click: () => {
            if (win && !win.isDestroyed()) {
              if (!win.isVisible()) win.show();
              win.focus();
              win.webContents.send('ui:openSettings');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Quit Overtone',
          click: () => {
            // Force true quit bypassing minimize-to-tray
            (app as unknown as { isQuitting?: boolean }).isQuitting = true;
            app.quit();
          },
        },
      ]);

      tray?.setContextMenu(contextMenu);
    };

    tray.on('click', () => {
      const win = getWin();
      if (win && !win.isDestroyed()) {
        if (win.isVisible()) {
          win.hide();
        } else {
          win.show();
          win.focus();
        }
        updateMenu();
      }
    });

    updateMenu();
    return tray;
  } catch (err) {
    console.error('[Tray] Failed to initialize tray:', err);
    return null;
  }
}

/**
 * Update current playing track info in the tray tooltip and menu.
 */
export function updateTrayTrack(
  title: string,
  artist: string,
  isPlaying: boolean,
  getWin: () => BrowserWindow | null
): void {
  currentTrackInfo = { title, artist, isPlaying };
  if (tray) {
    const tooltip = title ? `Overtone: ${title} - ${artist}` : 'Overtone - Modern Local Music Player';
    tray.setToolTip(tooltip);

    // Rebuild context menu with updated track status
    const win = getWin();
    const isVisible = win && !win.isDestroyed() && win.isVisible();

    const trackLabel = title ? `🎵 ${title} — ${artist}` : 'Overtone — Ready';

    const contextMenu = Menu.buildFromTemplate([
      {
        label: trackLabel,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: isPlaying ? 'Pause' : 'Play',
        click: () => {
          if (win && !win.isDestroyed()) {
            win.webContents.send('playback:togglePlay');
          }
        },
      },
      {
        label: 'Next Track',
        click: () => {
          if (win && !win.isDestroyed()) {
            win.webContents.send('playback:next');
          }
        },
      },
      {
        label: 'Previous Track',
        click: () => {
          if (win && !win.isDestroyed()) {
            win.webContents.send('playback:prev');
          }
        },
      },
      { type: 'separator' },
      {
        label: isVisible ? 'Minimize to Tray' : 'Show Overtone',
        click: () => {
          if (win && !win.isDestroyed()) {
            if (win.isVisible()) {
              win.hide();
            } else {
              win.show();
              win.focus();
            }
          }
        },
      },
      {
        label: 'Preferences...',
        click: () => {
          if (win && !win.isDestroyed()) {
            if (!win.isVisible()) win.show();
            win.focus();
            win.webContents.send('ui:openSettings');
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Quit Overtone',
        click: () => {
          (app as unknown as { isQuitting?: boolean }).isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
  }
}

/**
 * Destroy the system tray.
 */
export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
