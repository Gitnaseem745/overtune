import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';
import * as fs from 'fs';

let db: Database.Database;

function getDbPath() {
  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  return path.join(userDataPath, 'overtone.db');
}

export function initDb() {
  if (db) return db;

  try {
    const dbPath = getDbPath();
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  } catch (err) {
    console.error('[DB] Failed to initialize SQLite database:', err);
    throw err;
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist_id INTEGER,
      year INTEGER,
      cover_art_path TEXT,
      FOREIGN KEY(artist_id) REFERENCES artists(id),
      UNIQUE(title, artist_id)
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      album_id INTEGER,
      artist_id INTEGER,
      path TEXT NOT NULL UNIQUE,
      duration REAL,
      track_number INTEGER,
      genre TEXT,
      file_hash TEXT,
      FOREIGN KEY(album_id) REFERENCES albums(id),
      FOREIGN KEY(artist_id) REFERENCES artists(id)
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_pinned BOOLEAN DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id INTEGER,
      track_id INTEGER,
      position INTEGER,
      PRIMARY KEY(playlist_id, track_id),
      FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      track_id INTEGER PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );
  `);

  return db;
}

export function getDb() {
  if (!db) return initDb();
  return db;
}

// ── Playlist Operations ───────────────────────────────────────────────

export function getPlaylists() {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT 
      p.id, p.name, p.created_at, p.is_pinned,
      COUNT(pt.track_id) AS track_count,
      (
        SELECT al.cover_art_path 
        FROM playlist_tracks pt2 
        JOIN tracks t ON pt2.track_id = t.id 
        LEFT JOIN albums al ON t.album_id = al.id 
        WHERE pt2.playlist_id = p.id AND al.cover_art_path IS NOT NULL 
        LIMIT 1
      ) AS cover_art
    FROM playlists p
    LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);
  return stmt.all();
}

export function getPlaylistTracks(playlistId: number) {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT 
      t.id, t.title, t.path, t.duration, t.track_number, t.genre, t.file_hash,
      COALESCE(a.name, 'Unknown Artist') AS artist,
      COALESCE(al.title, 'Unknown Album') AS album,
      al.cover_art_path AS cover_art,
      pt.position
    FROM playlist_tracks pt
    JOIN tracks t ON pt.track_id = t.id
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE pt.playlist_id = ?
    ORDER BY pt.position ASC, pt.rowid ASC
  `);
  return stmt.all(playlistId);
}

export function createPlaylist(name: string) {
  const database = getDb();
  const stmt = database.prepare(`INSERT INTO playlists (name) VALUES (?)`);
  const info = stmt.run(name.trim() || 'New Playlist');
  return {
    id: Number(info.lastInsertRowid),
    name: name.trim() || 'New Playlist',
    created_at: new Date().toISOString(),
    is_pinned: 0,
    track_count: 0,
    cover_art: null,
  };
}

export function renamePlaylist(id: number, name: string) {
  const database = getDb();
  const stmt = database.prepare(`UPDATE playlists SET name = ? WHERE id = ?`);
  stmt.run(name.trim() || 'Untitled Playlist', id);
  return true;
}

export function deletePlaylist(id: number) {
  const database = getDb();
  const deleteTracks = database.prepare(`DELETE FROM playlist_tracks WHERE playlist_id = ?`);
  const deletePlaylistStmt = database.prepare(`DELETE FROM playlists WHERE id = ?`);
  deleteTracks.run(id);
  deletePlaylistStmt.run(id);
  return true;
}

export function addTrackToPlaylist(playlistId: number, trackId: number) {
  const database = getDb();
  const posStmt = database.prepare(`
    SELECT COALESCE(MAX(position), -1) + 1 AS next_pos 
    FROM playlist_tracks 
    WHERE playlist_id = ?
  `);
  const row = posStmt.get(playlistId) as { next_pos: number };
  const nextPos = row?.next_pos || 0;

  const insertStmt = database.prepare(`
    INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position)
    VALUES (?, ?, ?)
  `);
  insertStmt.run(playlistId, trackId, nextPos);
  return true;
}

export function removeTrackFromPlaylist(playlistId: number, trackId: number) {
  const database = getDb();
  const stmt = database.prepare(`
    DELETE FROM playlist_tracks 
    WHERE playlist_id = ? AND track_id = ?
  `);
  stmt.run(playlistId, trackId);
  return true;
}

// ── Favorites (Liked Songs) Operations ────────────────────────────────

export function getFavorites(): number[] {
  const database = getDb();
  const stmt = database.prepare(`SELECT track_id FROM favorites`);
  const rows = stmt.all() as { track_id: number }[];
  return rows.map((r) => r.track_id);
}

export function toggleFavorite(trackId: number): boolean {
  const database = getDb();
  const checkStmt = database.prepare(`SELECT track_id FROM favorites WHERE track_id = ?`);
  const existing = checkStmt.get(trackId);

  if (existing) {
    database.prepare(`DELETE FROM favorites WHERE track_id = ?`).run(trackId);
    return false; // Not liked anymore
  } else {
    database.prepare(`INSERT OR IGNORE INTO favorites (track_id) VALUES (?)`).run(trackId);
    return true; // Now liked
  }
}

// ── M3U Playlist Export & Import ──────────────────────────────────────

export async function exportPlaylistToM3U(playlistId: number, destinationPath: string): Promise<boolean> {
  const database = getDb();
  const playlist = database.prepare(`SELECT name FROM playlists WHERE id = ?`).get(playlistId) as { name: string } | undefined;
  if (!playlist) throw new Error('Playlist not found');

  const tracks = getPlaylistTracks(playlistId) as Array<{ duration?: number; artist?: string; title?: string; path?: string }>;
  
  let content = `#EXTM3U\n#PLAYLIST:${playlist.name}\n\n`;
  for (const t of tracks) {
    const duration = Math.round(t.duration || 0);
    content += `#EXTINF:${duration},${t.artist || 'Unknown Artist'} - ${t.title || 'Unknown Title'}\n`;
    content += `${t.path || ''}\n`;
  }

  await fs.promises.writeFile(destinationPath, content, 'utf-8');
  return true;
}

export async function importPlaylistFromM3U(m3uFilePath: string): Promise<Record<string, unknown> | undefined> {
  const database = getDb();
  const fileContent = await fs.promises.readFile(m3uFilePath, 'utf-8');
  const playlistName = path.basename(m3uFilePath, path.extname(m3uFilePath));

  const newPlaylist = createPlaylist(playlistName);
  const lines = fileContent.split(/\r?\n/);
  const m3uDir = path.dirname(m3uFilePath);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    // Resolve relative paths if any
    const trackPath = path.isAbsolute(line) ? line : path.resolve(m3uDir, line);

    // Find track by exact path or filename in DB
    const findStmt = database.prepare(`
      SELECT id FROM tracks WHERE path = ? OR path LIKE ?
    `);
    const trackRow = findStmt.get(trackPath, `%${path.basename(trackPath)}`) as { id: number } | undefined;

    if (trackRow) {
      addTrackToPlaylist(newPlaylist.id, trackRow.id);
    }
  }

  return (getPlaylists() as Array<{ id: number; [key: string]: unknown }>).find((p) => p.id === newPlaylist.id);
}

// ── Track Metadata Updates ───────────────────────────────────────────

export function updateTrackDuration(trackId: number, duration: number): boolean {
  try {
    const database = getDb();
    database.prepare(`UPDATE tracks SET duration = ? WHERE id = ?`).run(duration, trackId);
    return true;
  } catch (e) {
    console.error('Error updating track duration in DB:', e);
    return false;
  }
}

