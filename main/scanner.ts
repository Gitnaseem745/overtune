import chokidar from 'chokidar';
import { getDb } from './db';
import * as path from 'path';
import * as fs from 'fs';
import * as mm from 'music-metadata';
import crypto from 'crypto';
import { app, BrowserWindow } from 'electron';

const watchers = new Map<string, chokidar.FSWatcher>();
const supportedExtensions = ['.mp3', '.flac', '.wav', '.m4a', '.ogg'];

type Task = () => Promise<void>;
class AsyncQueue {
  private queue: Task[] = [];
  private activeCount = 0;
  constructor(private concurrencyLimit: number) {}

  add(task: Task) {
    this.queue.push(task);
    this.processNext();
  }

  private async processNext() {
    if (this.activeCount >= this.concurrencyLimit || this.queue.length === 0) {
      return;
    }
    this.activeCount++;
    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch (e) {
        console.error(e);
      } finally {
        this.activeCount--;
        this.processNext();
      }
    }
  }
}

const fileProcessQueue = new AsyncQueue(5);

function notifyLibraryUpdated() {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((win) => {
    win.webContents.send('library-updated');
  });
}

export function startWatching(folderPath: string) {
  if (watchers.has(folderPath)) {
    return;
  }

  const watcher = chokidar.watch(folderPath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
  });

  watcher
    .on('add', (filePath) => {
      if (isAudioFile(filePath)) {
        fileProcessQueue.add(() => handleFileAdded(filePath));
      }
    })
    .on('unlink', (filePath) => {
      if (isAudioFile(filePath)) {
        handleFileRemoved(filePath);
      }
    });

  watchers.set(folderPath, watcher);
}

export function stopWatching(folderPath: string) {
  const watcher = watchers.get(folderPath);
  if (watcher) {
    watcher.close();
    watchers.delete(folderPath);
  }
}

export function isAudioFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return supportedExtensions.includes(ext);
}

async function saveCoverArt(picture: mm.IPicture, albumId: number): Promise<string | null> {
  try {
    const userDataPath = app.getPath('userData');
    const coversDir = path.join(userDataPath, 'covers');
    if (!fs.existsSync(coversDir)) {
      fs.mkdirSync(coversDir, { recursive: true });
    }
    const ext = picture.format.includes('png') ? '.png' : '.jpg';
    const coverPath = path.join(coversDir, `album_${albumId}${ext}`);
    await fs.promises.writeFile(coverPath, picture.data);
    return coverPath;
  } catch (err) {
    console.error('Error saving cover art:', err);
    return null;
  }
}

export async function insertOrGetTrack(filePath: string): Promise<number | null> {
  const db = getDb();
  
  const existing = db.prepare('SELECT id FROM tracks WHERE path = ?').get(filePath) as { id: number } | undefined;
  if (existing) {
    return existing.id;
  }

  try {
    const metadata = await mm.parseFile(filePath);
    
    const title = metadata.common.title || path.basename(filePath, path.extname(filePath));
    const artistName = metadata.common.artist || 'Unknown Artist';
    const albumTitle = metadata.common.album || 'Unknown Album';
    const duration = metadata.format.duration || 0;
    const year = metadata.common.year || null;
    const trackNumber = metadata.common.track.no || null;
    const genre = metadata.common.genre ? metadata.common.genre[0] : null;

    const fileHash = crypto.createHash('md5').update(`${artistName}-${title}-${duration}`).digest('hex');

    const insertArtist = db.prepare(`INSERT INTO artists (name) VALUES (?) ON CONFLICT(name) DO UPDATE SET name=excluded.name RETURNING id`);
    const artistRow = insertArtist.get(artistName) as { id: number };
    const artistId = artistRow.id;

    const insertAlbum = db.prepare(`INSERT INTO albums (title, artist_id, year) VALUES (?, ?, ?) ON CONFLICT(title, artist_id) DO UPDATE SET title=excluded.title RETURNING id`);
    const albumRow = insertAlbum.get(albumTitle, artistId, year) as { id: number };
    const albumId = albumRow.id;

    // Check and save cover art if available
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const coverArtPath = await saveCoverArt(metadata.common.picture[0], albumId);
      if (coverArtPath) {
        db.prepare(`UPDATE albums SET cover_art_path = ? WHERE id = ?`).run(coverArtPath, albumId);
      }
    }

    const insertTrack = db.prepare(`
      INSERT INTO tracks (title, album_id, artist_id, path, duration, track_number, genre, file_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(path) DO NOTHING
    `);
    
    insertTrack.run(title, albumId, artistId, filePath, duration, trackNumber, genre, fileHash);
    
    const trackRow = db.prepare('SELECT id FROM tracks WHERE path = ?').get(filePath) as { id: number } | undefined;
    return trackRow ? trackRow.id : null;
  } catch (error) {
    console.error(`Error processing track ${filePath}:`, error);
    return null;
  }
}

export function findAudioFilesRecursively(dirPath: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        results.push(...findAudioFilesRecursively(fullPath));
      } else if (entry.isFile() && isAudioFile(fullPath)) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err);
  }
  return results;
}

export async function importDirectoryAsPlaylists(rootDir: string): Promise<{
  success: boolean;
  playlistsCreated: number;
  tracksImported: number;
  playlists: Array<{ name: string; trackCount: number }>;
}> {
  const db = getDb();
  if (!fs.existsSync(rootDir)) {
    return { success: false, playlistsCreated: 0, tracksImported: 0, playlists: [] };
  }

  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(rootDir, { withFileTypes: true });
  } catch (err) {
    console.error(`Failed to read directory: ${rootDir}`, err);
    return { success: false, playlistsCreated: 0, tracksImported: 0, playlists: [] };
  }

  const subDirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.'));
  const rootAudioFiles = entries
    .filter((e) => e.isFile() && isAudioFile(path.join(rootDir, e.name)))
    .map((e) => path.join(rootDir, e.name));

  const playlistMap = new Map<string, string[]>();

  if (subDirs.length > 0) {
    for (const subDir of subDirs) {
      const subDirPath = path.join(rootDir, subDir.name);
      const audioFiles = findAudioFilesRecursively(subDirPath);
      if (audioFiles.length > 0) {
        playlistMap.set(subDir.name, audioFiles);
      }
    }
    if (rootAudioFiles.length > 0) {
      const rootName = path.basename(rootDir) || 'Library';
      playlistMap.set(rootName, rootAudioFiles);
    }
  } else {
    const audioFiles = findAudioFilesRecursively(rootDir);
    if (audioFiles.length > 0) {
      const folderName = path.basename(rootDir) || 'Imported Playlist';
      playlistMap.set(folderName, audioFiles);
    }
  }

  let totalPlaylistsCreated = 0;
  let totalTracksImported = 0;
  const resultPlaylists: Array<{ name: string; trackCount: number }> = [];

  for (const [playlistName, filePaths] of playlistMap.entries()) {
    let playlistRow = db.prepare(`SELECT id, name FROM playlists WHERE name = ?`).get(playlistName) as { id: number; name: string } | undefined;
    if (!playlistRow) {
      const info = db.prepare(`INSERT INTO playlists (name) VALUES (?)`).run(playlistName);
      playlistRow = { id: Number(info.lastInsertRowid), name: playlistName };
      totalPlaylistsCreated++;
    }

    const playlistId = playlistRow.id;
    let addedToPlaylistCount = 0;

    for (const filePath of filePaths) {
      try {
        const trackId = await insertOrGetTrack(filePath);
        if (trackId) {
          const posRow = db.prepare(`SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM playlist_tracks WHERE playlist_id = ?`).get(playlistId) as { next_pos: number };
          const nextPos = posRow?.next_pos || 0;

          const res = db.prepare(`INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)`).run(playlistId, trackId, nextPos);
          if (res.changes > 0) {
            addedToPlaylistCount++;
          }
          totalTracksImported++;
        }
      } catch (err) {
        console.error(`Error importing track ${filePath} for playlist ${playlistName}:`, err);
      }
    }

    resultPlaylists.push({
      name: playlistName,
      trackCount: addedToPlaylistCount,
    });
  }

  startWatching(rootDir);
  notifyLibraryUpdated();

  return {
    success: true,
    playlistsCreated: totalPlaylistsCreated,
    tracksImported: totalTracksImported,
    playlists: resultPlaylists,
  };
}

async function handleFileAdded(filePath: string) {
  console.log(`File added: ${filePath}`);
  try {
    const trackId = await insertOrGetTrack(filePath);
    if (trackId) {
      console.log(`Successfully indexed track: ${filePath}`);
      notifyLibraryUpdated();
    }
  } catch (error) {
    console.error(`Error inserting track: ${filePath}`, error);
  }
}

function handleFileRemoved(filePath: string) {
  console.log(`File removed: ${filePath}`);
  const db = getDb();
  try {
    const stmt = db.prepare(`DELETE FROM tracks WHERE path = ?`);
    stmt.run(filePath);
    notifyLibraryUpdated();
  } catch (error) {
    console.error(`Error deleting track: ${filePath}`, error);
  }
}
