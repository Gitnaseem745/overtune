import { app, BrowserWindow, dialog, ipcMain, protocol, net } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { Readable } from 'stream';
import { 
  initDb, getDb, 
  getPlaylists, getPlaylistTracks, createPlaylist, 
  renamePlaylist, deletePlaylist, addTrackToPlaylist, 
  removeTrackFromPlaylist, getFavorites, toggleFavorite, 
  exportPlaylistToM3U, importPlaylistFromM3U,
  updateTrackDuration
} from './db';
import { startWatching } from './scanner';

const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';

// ── Uncaught Exception Handling ─────────────────────────────────────
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Main] Unhandled Rejection:', reason);
});

// MIME type lookup for audio and image files
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.flac': 'audio/flac',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.ogg': 'audio/ogg',
    '.aac': 'audio/aac',
    '.wma': 'audio/x-ms-wma',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);

let mainWindow: BrowserWindow | null = null;

function getAppIconPath(): string {
  const icoCandidate = path.join(__dirname, '../build/icon.ico');
  const overtuneLogo = path.join(__dirname, '../public/overtune_logo.png');
  const iconCandidate = path.join(__dirname, '../build/icon.png');
  const pngCandidate = path.join(__dirname, '../public/icon.png');
  if (fs.existsSync(icoCandidate)) return icoCandidate;
  if (fs.existsSync(overtuneLogo)) return overtuneLogo;
  if (fs.existsSync(iconCandidate)) return iconCandidate;
  if (fs.existsSync(pngCandidate)) return pngCandidate;
  return '';
}

function createWindow() {
  const iconPath = getAppIconPath();
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    icon: iconPath || undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  });

  // Fallback to guarantee window is visible
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 1000);

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[WebContents] Failed to load: ${validatedURL} (${errorCode}: ${errorDescription})`);
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the static exported Next.js app
    const indexPath = path.join(__dirname, '../out/index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('[Main] Failed to loadFile:', err);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure single instance lock so multiple clicks don't spawn orphan background processes
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
    }
  });

  app.whenReady().then(() => {
    // ── local:// protocol handler ──────────────────────────────────────
    protocol.handle('local', (request) => {
      try {
        const url = new URL(request.url);
        const base64Path = url.searchParams.get('p');

        if (!base64Path) {
          console.error('[local://] Missing "p" query parameter in:', request.url);
          return new Response('Bad request: missing path parameter', { status: 400 });
        }

        // Decode the base64-encoded absolute file path
        const filePath = Buffer.from(base64Path, 'base64').toString('utf-8');

        if (!fs.existsSync(filePath)) {
          console.error('[local://] File not found:', filePath);
          return new Response('File not found', { status: 404 });
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const mimeType = getMimeType(filePath);
        const rangeHeader = request.headers.get('Range');

        if (rangeHeader) {
          // ── Range request (audio seeking) ──
          const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
          if (match) {
            const start = parseInt(match[1], 10);
            const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
            const chunkSize = end - start + 1;

            const nodeStream = fs.createReadStream(filePath, { start, end });
            const webStream = Readable.toWeb(nodeStream) as ReadableStream;

            return new Response(webStream, {
              status: 206,
              headers: {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': String(chunkSize),
                'Content-Type': mimeType,
              },
            });
          }
        }

        // ── Full file request (initial load) ──
        const nodeStream = fs.createReadStream(filePath);
        const webStream = Readable.toWeb(nodeStream) as ReadableStream;

        return new Response(webStream, {
          status: 200,
          headers: {
            'Accept-Ranges': 'bytes',
            'Content-Length': String(fileSize),
            'Content-Type': mimeType,
          },
        });
      } catch (err) {
        console.error('[local://] Protocol handler error:', err);
        return new Response('Internal error', { status: 500 });
      }
    });

    try {
      initDb();
    } catch (e) {
      console.error('[Main] initDb error:', e);
    }
    createWindow();

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });
}

// IPC handler for opening folder dialog
ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory', 'multiSelections'],
  });
  if (canceled) {
    return [];
  } else {
    filePaths.forEach((folderPath) => {
      startWatching(folderPath);
    });
    return filePaths;
  }
});

// IPC handler for getting tracks with artist & album names
ipcMain.handle('db:getTracks', () => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      t.id, t.title, t.path, t.duration, t.track_number, t.genre, t.file_hash,
      COALESCE(a.name, 'Unknown Artist') AS artist,
      COALESCE(al.title, 'Unknown Album') AS album,
      al.cover_art_path AS cover_art
    FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    ORDER BY t.title ASC
  `);
  return stmt.all();
});

// IPC handler for getting albums
ipcMain.handle('db:getAlbums', () => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      al.id, al.title, al.year, al.cover_art_path AS cover_art,
      COALESCE(a.name, 'Unknown Artist') AS artist,
      COUNT(t.id) AS track_count
    FROM albums al
    LEFT JOIN artists a ON al.artist_id = a.id
    LEFT JOIN tracks t ON t.album_id = al.id
    GROUP BY al.id
    ORDER BY al.title ASC
  `);
  return stmt.all();
});

// IPC handler for getting artists
ipcMain.handle('db:getArtists', () => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      a.id, a.name,
      COUNT(DISTINCT al.id) AS album_count,
      COUNT(t.id) AS track_count
    FROM artists a
    LEFT JOIN albums al ON al.artist_id = a.id
    LEFT JOIN tracks t ON t.artist_id = a.id
    GROUP BY a.id
    ORDER BY a.name ASC
  `);
  return stmt.all();
});

// ── Playlist IPC Handlers ─────────────────────────────────────────────

ipcMain.handle('db:getPlaylists', () => {
  return getPlaylists();
});

ipcMain.handle('db:getPlaylistTracks', (_event, playlistId: number) => {
  return getPlaylistTracks(playlistId);
});

ipcMain.handle('db:createPlaylist', (_event, name: string) => {
  return createPlaylist(name);
});

ipcMain.handle('db:renamePlaylist', (_event, id: number, name: string) => {
  return renamePlaylist(id, name);
});

ipcMain.handle('db:deletePlaylist', (_event, id: number) => {
  return deletePlaylist(id);
});

ipcMain.handle('db:addTrackToPlaylist', (_event, playlistId: number, trackId: number) => {
  return addTrackToPlaylist(playlistId, trackId);
});

ipcMain.handle('db:removeTrackFromPlaylist', (_event, playlistId: number, trackId: number) => {
  return removeTrackFromPlaylist(playlistId, trackId);
});

// ── Favorites IPC Handlers ────────────────────────────────────────────

ipcMain.handle('db:getFavorites', () => {
  return getFavorites();
});

ipcMain.handle('db:toggleFavorite', (_event, trackId: number) => {
  return toggleFavorite(trackId);
});

// ── M3U Export & Import Dialog IPC ────────────────────────────────────

ipcMain.handle('dialog:exportPlaylistM3U', async (_event, playlistId: number) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export Playlist as .m3u',
    filters: [{ name: 'M3U Playlist', extensions: ['m3u'] }],
    defaultPath: 'playlist.m3u',
  });

  if (canceled || !filePath) return false;
  return await exportPlaylistToM3U(playlistId, filePath);
});

ipcMain.handle('dialog:importPlaylistM3U', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Import M3U / M3U8 Playlist',
    filters: [{ name: 'M3U Playlists', extensions: ['m3u', 'm3u8'] }],
    properties: ['openFile'],
  });

  if (canceled || filePaths.length === 0) return null;
  return await importPlaylistFromM3U(filePaths[0]);
});

ipcMain.handle('db:updateTrackDuration', (_event, trackId: number, duration: number) => {
  return updateTrackDuration(trackId, duration);
});


