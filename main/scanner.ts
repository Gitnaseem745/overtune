import chokidar from 'chokidar';
import { getDb } from './db';
import * as path from 'path';
import * as fs from 'fs';
import * as mm from 'music-metadata';
import crypto from 'crypto';

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

// Limit concurrency to 5 files at a time to prevent RAM and file-descriptor exhaustion
const fileProcessQueue = new AsyncQueue(5);

export function startWatching(folderPath: string) {
  if (watchers.has(folderPath)) {
    return; // Already watching
  }

  const watcher = chokidar.watch(folderPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
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

function isAudioFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return supportedExtensions.includes(ext);
}


async function handleFileAdded(filePath: string) {
  console.log(`File added: ${filePath}`);
  const db = getDb();

  try {
    const metadata = await mm.parseFile(filePath);
    
    // Fallback logic
    const title = metadata.common.title || path.basename(filePath, path.extname(filePath));
    const artistName = metadata.common.artist || 'Unknown Artist';
    const albumTitle = metadata.common.album || 'Unknown Album';
    const duration = metadata.format.duration || 0;
    const year = metadata.common.year || null;
    const trackNumber = metadata.common.track.no || null;
    const genre = metadata.common.genre ? metadata.common.genre[0] : null;

    // Create hash to deduplicate
    const fileHash = crypto.createHash('md5').update(`${artistName}-${title}-${duration}`).digest('hex');

    const insertArtist = db.prepare(`INSERT INTO artists (name) VALUES (?) ON CONFLICT(name) DO UPDATE SET name=excluded.name RETURNING id`);
    const artistRow = insertArtist.get(artistName) as { id: number };
    const artistId = artistRow.id;

    const insertAlbum = db.prepare(`INSERT INTO albums (title, artist_id, year) VALUES (?, ?, ?) ON CONFLICT(title, artist_id) DO UPDATE SET title=excluded.title RETURNING id`);
    const albumRow = insertAlbum.get(albumTitle, artistId, year) as { id: number };
    const albumId = albumRow.id;

    const insertTrack = db.prepare(`
      INSERT INTO tracks (title, album_id, artist_id, path, duration, track_number, genre, file_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(path) DO NOTHING
    `);
    
    insertTrack.run(title, albumId, artistId, filePath, duration, trackNumber, genre, fileHash);
    console.log(`Successfully added track: ${title} by ${artistName}`);
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
  } catch (error) {
    console.error(`Error deleting track: ${filePath}`, error);
  }
}
