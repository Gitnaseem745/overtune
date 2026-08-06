import { app, BrowserWindow, dialog, ipcMain, protocol, net } from 'electron';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { initDb, getDb } from './db';
import { startWatching } from './scanner';

const isDev = process.env.NODE_ENV === 'development';

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

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the static exported Next.js app
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }
}

app.whenReady().then(() => {
  // ── local:// protocol handler ──────────────────────────────────────
  // The renderer encodes file paths as base64 in a query parameter:
  //   local://file?p=<base64-encoded-absolute-path>
  // This completely avoids URL authority/path parsing issues with
  // Windows drive letters (C:) and special characters (spaces, apostrophes).
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
      const fileUrl = pathToFileURL(filePath).toString();

      console.log('[local://] Serving:', filePath);

      // bypassCustomProtocolHandlers delegates to Chromium's native file:// handler
      // which supports HTTP Range headers required for audio seeking
      return net.fetch(fileUrl, { bypassCustomProtocolHandlers: true });
    } catch (err) {
      console.error('[local://] Protocol handler error:', err);
      return new Response('Internal error', { status: 500 });
    }
  });

  initDb();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

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
