import { app, BrowserWindow, dialog, ipcMain, protocol, net } from 'electron';
import * as path from 'path';
import { initDb, getDb } from './db';
import { startWatching } from './scanner';

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, we'll load the static exported Next.js app
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }
}

app.whenReady().then(() => {
  protocol.handle('local', (request) => {
    const filePath = request.url.slice('local://'.length);
    return net.fetch('file://' + filePath);
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

// IPC handler for getting tracks
ipcMain.handle('db:getTracks', () => {
  const db = getDb();
  const stmt = db.prepare(`SELECT * FROM tracks`);
  return stmt.all();
});
