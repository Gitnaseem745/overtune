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
  const targetDbPath = path.join(userDataPath, 'overtone.db');

  // Automatic Migration: check if a database exists in legacy or dev paths and migrate seamlessly
  if (!fs.existsSync(targetDbPath)) {
    const appData = app.getPath('appData') || process.env.APPDATA || '';
    const possibleOldPaths = [
      path.join(appData, 'overtune', 'overtone.db'),
      path.join(appData, 'Electron', 'overtone.db'),
      path.join(appData, 'overtune', 'library.db'),
      path.join(userDataPath, 'library.db'),
      path.join(process.cwd(), 'overtone.db'),
      path.join(process.cwd(), 'library.db'),
    ];

    for (const oldPath of possibleOldPaths) {
      if (fs.existsSync(oldPath)) {
        try {
          console.log(`[DB] Migrating existing database from ${oldPath} to ${targetDbPath}`);
          fs.copyFileSync(oldPath, targetDbPath);
          if (fs.existsSync(`${oldPath}-wal`)) fs.copyFileSync(`${oldPath}-wal`, `${targetDbPath}-wal`);
          if (fs.existsSync(`${oldPath}-shm`)) fs.copyFileSync(`${oldPath}-shm`, `${targetDbPath}-shm`);
          break;
        } catch (copyErr) {
          console.error(`[DB] Failed to copy database from ${oldPath}:`, copyErr);
        }
      }
    }
  }

  return targetDbPath;
}

export function initDb() {
  if (db) return db;

  try {
    const dbPath = getDbPath();
    console.log(`[DB] Initializing SQLite database at: ${dbPath}`);
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

    CREATE TABLE IF NOT EXISTS lyric_offsets (
      track_id INTEGER PRIMARY KEY,
      offset_ms INTEGER DEFAULT 0,
      FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS watched_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL UNIQUE,
      last_scan_at DATETIME,
      track_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'idle'
    );

    CREATE TABLE IF NOT EXISTS scan_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_id INTEGER,
      file_path TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(folder_id) REFERENCES watched_folders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS play_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id INTEGER NOT NULL,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration_played REAL DEFAULT 0,
      FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS track_ratings (
      track_id INTEGER PRIMARY KEY,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS track_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE,
      UNIQUE(track_id, tag)
    );

    CREATE TABLE IF NOT EXISTS smart_playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rules_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
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

export function reorderPlaylistTracks(playlistId: number, trackIds: number[]) {
  const database = getDb();
  const updateStmt = database.prepare(`
    UPDATE playlist_tracks SET position = ? 
    WHERE playlist_id = ? AND track_id = ?
  `);
  const runTransaction = database.transaction((ids: number[]) => {
    ids.forEach((id, index) => {
      updateStmt.run(index, playlistId, id);
    });
  });
  runTransaction(trackIds);
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

// ── Lyric Offset Operations ──────────────────────────────────────────

export function getLyricOffset(trackId: number): number {
  const database = getDb();
  const row = database.prepare(`SELECT offset_ms FROM lyric_offsets WHERE track_id = ?`).get(trackId) as { offset_ms: number } | undefined;
  return row?.offset_ms ?? 0;
}

export function setLyricOffset(trackId: number, offsetMs: number): boolean {
  try {
    const database = getDb();
    database.prepare(`
      INSERT INTO lyric_offsets (track_id, offset_ms) VALUES (?, ?)
      ON CONFLICT(track_id) DO UPDATE SET offset_ms = excluded.offset_ms
    `).run(trackId, offsetMs);
    return true;
  } catch (e) {
    console.error('Error setting lyric offset in DB:', e);
    return false;
  }
}

// ── Watched Folders Operations ───────────────────────────────────────

export function getWatchedFolders() {
  const database = getDb();
  return database.prepare(`SELECT * FROM watched_folders ORDER BY path ASC`).all();
}

export function addWatchedFolder(folderPath: string) {
  const database = getDb();
  database.prepare(`
    INSERT OR IGNORE INTO watched_folders (path, last_scan_at, status)
    VALUES (?, CURRENT_TIMESTAMP, 'idle')
  `).run(folderPath);
}

export function updateWatchedFolder(folderPath: string, trackCount: number, status: string) {
  const database = getDb();
  database.prepare(`
    UPDATE watched_folders SET track_count = ?, status = ?, last_scan_at = CURRENT_TIMESTAMP
    WHERE path = ?
  `).run(trackCount, status, folderPath);
}

export function removeWatchedFolder(folderId: number) {
  const database = getDb();
  database.prepare(`DELETE FROM scan_errors WHERE folder_id = ?`).run(folderId);
  database.prepare(`DELETE FROM watched_folders WHERE id = ?`).run(folderId);
  return true;
}

// ── Scan Errors ──────────────────────────────────────────────────────

export function logScanError(folderId: number | null, filePath: string, errorMessage: string) {
  const database = getDb();
  database.prepare(`
    INSERT INTO scan_errors (folder_id, file_path, error_message) VALUES (?, ?, ?)
  `).run(folderId, filePath, errorMessage);
}

export function getScanErrors(folderId?: number) {
  const database = getDb();
  if (folderId) {
    return database.prepare(`SELECT * FROM scan_errors WHERE folder_id = ? ORDER BY created_at DESC LIMIT 100`).all(folderId);
  }
  return database.prepare(`SELECT * FROM scan_errors ORDER BY created_at DESC LIMIT 100`).all();
}

export function clearScanErrors(folderId?: number) {
  const database = getDb();
  if (folderId) {
    database.prepare(`DELETE FROM scan_errors WHERE folder_id = ?`).run(folderId);
  } else {
    database.prepare(`DELETE FROM scan_errors`).run();
  }
  return true;
}

// ── Metadata Editor Operations ───────────────────────────────────────

export function getTrackDetails(trackId: number) {
  const database = getDb();
  return database.prepare(`
    SELECT
      t.id, t.title, t.path, t.duration, t.track_number, t.genre, t.file_hash,
      COALESCE(a.name, 'Unknown Artist') AS artist,
      a.id AS artist_id,
      COALESCE(al.title, 'Unknown Album') AS album,
      al.id AS album_id,
      al.year, al.cover_art_path AS cover_art
    FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE t.id = ?
  `).get(trackId);
}

export interface TrackMetadataUpdate {
  title?: string;
  artist?: string;
  album?: string;
  track_number?: number | null;
  genre?: string | null;
  year?: number | null;
}

export function updateTrackMetadataCatalog(trackId: number, fields: TrackMetadataUpdate): boolean {
  try {
    const database = getDb();

    if (fields.title) {
      database.prepare(`UPDATE tracks SET title = ? WHERE id = ?`).run(fields.title, trackId);
    }
    if (fields.track_number !== undefined) {
      database.prepare(`UPDATE tracks SET track_number = ? WHERE id = ?`).run(fields.track_number, trackId);
    }
    if (fields.genre !== undefined) {
      database.prepare(`UPDATE tracks SET genre = ? WHERE id = ?`).run(fields.genre, trackId);
    }
    if (fields.artist) {
      const artistRow = database.prepare(`INSERT INTO artists (name) VALUES (?) ON CONFLICT(name) DO UPDATE SET name=excluded.name RETURNING id`).get(fields.artist) as { id: number };
      database.prepare(`UPDATE tracks SET artist_id = ? WHERE id = ?`).run(artistRow.id, trackId);
    }
    if (fields.album) {
      const track = database.prepare(`SELECT artist_id FROM tracks WHERE id = ?`).get(trackId) as { artist_id: number } | undefined;
      if (track) {
        const albumRow = database.prepare(`INSERT INTO albums (title, artist_id, year) VALUES (?, ?, ?) ON CONFLICT(title, artist_id) DO UPDATE SET title=excluded.title RETURNING id`)
          .get(fields.album, track.artist_id, fields.year ?? null) as { id: number };
        database.prepare(`UPDATE tracks SET album_id = ? WHERE id = ?`).run(albumRow.id, trackId);
      }
    }
    if (fields.year !== undefined && !fields.album) {
      const track = database.prepare(`SELECT album_id FROM tracks WHERE id = ?`).get(trackId) as { album_id: number } | undefined;
      if (track?.album_id) {
        database.prepare(`UPDATE albums SET year = ? WHERE id = ?`).run(fields.year, track.album_id);
      }
    }
    return true;
  } catch (e) {
    console.error('Error updating track metadata in catalog:', e);
    return false;
  }
}

export function updateAlbumArtwork(albumId: number, artworkPath: string): boolean {
  try {
    const database = getDb();
    database.prepare(`UPDATE albums SET cover_art_path = ? WHERE id = ?`).run(artworkPath, albumId);
    return true;
  } catch (e) {
    console.error('Error updating album artwork:', e);
    return false;
  }
}

// ── Duplicate Detection ──────────────────────────────────────────────

export function findDuplicates() {
  const database = getDb();
  const groups = database.prepare(`
    SELECT file_hash, COUNT(*) as count
    FROM tracks
    WHERE file_hash IS NOT NULL AND file_hash != ''
    GROUP BY file_hash
    HAVING count > 1
    ORDER BY count DESC
  `).all() as Array<{ file_hash: string; count: number }>;

  return groups.map((group) => {
    const tracks = database.prepare(`
      SELECT
        t.id, t.title, t.path, t.duration, t.track_number, t.genre, t.file_hash,
        COALESCE(a.name, 'Unknown Artist') AS artist,
        COALESCE(al.title, 'Unknown Album') AS album,
        al.cover_art_path AS cover_art
      FROM tracks t
      LEFT JOIN artists a ON t.artist_id = a.id
      LEFT JOIN albums al ON t.album_id = al.id
      WHERE t.file_hash = ?
    `).all(group.file_hash);
    return { file_hash: group.file_hash, count: group.count, tracks };
  });
}

export function removeTrackFromLibrary(trackId: number): boolean {
  try {
    const database = getDb();
    database.prepare(`DELETE FROM playlist_tracks WHERE track_id = ?`).run(trackId);
    database.prepare(`DELETE FROM favorites WHERE track_id = ?`).run(trackId);
    database.prepare(`DELETE FROM lyric_offsets WHERE track_id = ?`).run(trackId);
    database.prepare(`DELETE FROM tracks WHERE id = ?`).run(trackId);
    return true;
  } catch (e) {
    console.error('Error removing track from library:', e);
    return false;
  }
}

// ── Missing File Detection ───────────────────────────────────────────

export function getAllTrackPaths(): Array<{ id: number; path: string }> {
  const database = getDb();
  return database.prepare(`SELECT id, path FROM tracks`).all() as Array<{ id: number; path: string }>;
}

export function relinkTrack(trackId: number, newPath: string): boolean {
  try {
    const database = getDb();
    database.prepare(`UPDATE tracks SET path = ? WHERE id = ?`).run(newPath, trackId);
    return true;
  } catch (e) {
    console.error('Error relinking track:', e);
    return false;
  }
}

// ── Library Health Report ────────────────────────────────────────────

export function getLibraryHealthReport() {
  const database = getDb();

  const totalTracks = (database.prepare(`SELECT COUNT(*) as c FROM tracks`).get() as { c: number }).c;
  const totalAlbums = (database.prepare(`SELECT COUNT(*) as c FROM albums`).get() as { c: number }).c;
  const totalArtists = (database.prepare(`SELECT COUNT(*) as c FROM artists`).get() as { c: number }).c;

  const missingTitle = database.prepare(`
    SELECT id, path FROM tracks WHERE title IS NULL OR title = ''
  `).all() as Array<{ id: number; path: string }>;

  const missingArtist = database.prepare(`
    SELECT t.id, t.path FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
    WHERE a.name IS NULL OR a.name = '' OR a.name = 'Unknown Artist'
  `).all() as Array<{ id: number; path: string }>;

  const zeroDuration = database.prepare(`
    SELECT id, title, path FROM tracks WHERE duration IS NULL OR duration <= 0
  `).all() as Array<{ id: number; title: string; path: string }>;

  const missingGenre = (database.prepare(`SELECT COUNT(*) as c FROM tracks WHERE genre IS NULL OR genre = ''`).get() as { c: number }).c;

  const duplicateCount = (database.prepare(`
    SELECT COUNT(*) as c FROM (
      SELECT file_hash FROM tracks WHERE file_hash IS NOT NULL AND file_hash != ''
      GROUP BY file_hash HAVING COUNT(*) > 1
    )
  `).get() as { c: number }).c;

  const albumsMissingArt = database.prepare(`
    SELECT al.id, al.title, COALESCE(a.name, 'Unknown Artist') as artist
    FROM albums al LEFT JOIN artists a ON al.artist_id = a.id
    WHERE al.cover_art_path IS NULL OR al.cover_art_path = ''
  `).all();

  return {
    totalTracks,
    totalAlbums,
    totalArtists,
    missingTitle: missingTitle.length,
    missingArtist: missingArtist.length,
    zeroDuration: zeroDuration.length,
    missingGenre,
    duplicateCount,
    albumsMissingArt: albumsMissingArt.length,
    zeroDurationTracks: zeroDuration.slice(0, 50),
    albumsMissingArtList: albumsMissingArt.slice(0, 50),
  };
}

// ── Scan Dashboard ───────────────────────────────────────────────────

export function getScanDashboard() {
  const database = getDb();
  const folders = getWatchedFolders();
  const totalTracks = (database.prepare(`SELECT COUNT(*) as c FROM tracks`).get() as { c: number }).c;
  const recentErrors = getScanErrors();
  return { folders, totalTracks, recentErrors };
}

// ── Personal Discovery & Play History ────────────────────────────────

export function isPlayHistoryEnabled(): boolean {
  try {
    const database = getDb();
    const row = database.prepare(`SELECT value FROM settings WHERE key = 'play_history_enabled'`).get() as { value: string } | undefined;
    return row ? row.value !== 'false' : true;
  } catch {
    return true;
  }
}

export function setPlayHistoryEnabled(enabled: boolean): boolean {
  try {
    const database = getDb();
    database.prepare(`
      INSERT INTO settings (key, value) VALUES ('play_history_enabled', ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `).run(enabled ? 'true' : 'false');
    return true;
  } catch (e) {
    console.error('Error setting play history preference:', e);
    return false;
  }
}

export function recordPlayEvent(trackId: number, durationPlayed: number = 0): boolean {
  try {
    if (!isPlayHistoryEnabled()) return false;
    const database = getDb();
    database.prepare(`
      INSERT INTO play_history (track_id, duration_played) VALUES (?, ?)
    `).run(trackId, durationPlayed);
    return true;
  } catch (e) {
    console.error('Error recording play event:', e);
    return false;
  }
}

export function getPlayHistory(limit: number = 50) {
  const database = getDb();
  return database.prepare(`
    SELECT 
      ph.id AS history_id,
      ph.played_at,
      ph.duration_played,
      t.id, t.title, t.duration, t.track_number, t.genre, t.path,
      COALESCE(a.name, 'Unknown Artist') AS artist,
      COALESCE(al.title, 'Unknown Album') AS album,
      al.cover_art_path AS cover_art
    FROM play_history ph
    JOIN tracks t ON ph.track_id = t.id
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    ORDER BY ph.played_at DESC
    LIMIT ?
  `).all(limit);
}

export function getPlayCounts(): Record<number, number> {
  const database = getDb();
  const rows = database.prepare(`
    SELECT track_id, COUNT(*) as count FROM play_history GROUP BY track_id
  `).all() as Array<{ track_id: number; count: number }>;
  const counts: Record<number, number> = {};
  for (const r of rows) {
    counts[r.track_id] = r.count;
  }
  return counts;
}

export function clearPlayHistory(): boolean {
  try {
    const database = getDb();
    database.prepare(`DELETE FROM play_history`).run();
    return true;
  } catch (e) {
    console.error('Error clearing play history:', e);
    return false;
  }
}

// ── Track Ratings ────────────────────────────────────────────────────

export function setTrackRating(trackId: number, rating: number): boolean {
  try {
    const database = getDb();
    if (rating <= 0) {
      database.prepare(`DELETE FROM track_ratings WHERE track_id = ?`).run(trackId);
    } else {
      const clamped = Math.max(1, Math.min(5, Math.round(rating)));
      database.prepare(`
        INSERT INTO track_ratings (track_id, rating) VALUES (?, ?)
        ON CONFLICT(track_id) DO UPDATE SET rating=excluded.rating
      `).run(trackId, clamped);
    }
    return true;
  } catch (e) {
    console.error('Error setting track rating:', e);
    return false;
  }
}

export function getTrackRating(trackId: number): number {
  try {
    const database = getDb();
    const row = database.prepare(`SELECT rating FROM track_ratings WHERE track_id = ?`).get(trackId) as { rating: number } | undefined;
    return row?.rating ?? 0;
  } catch {
    return 0;
  }
}

export function getAllTrackRatings(): Record<number, number> {
  const database = getDb();
  const rows = database.prepare(`SELECT track_id, rating FROM track_ratings`).all() as Array<{ track_id: number; rating: number }>;
  const ratings: Record<number, number> = {};
  for (const r of rows) {
    ratings[r.track_id] = r.rating;
  }
  return ratings;
}

// ── Track Tags ───────────────────────────────────────────────────────

export function addTrackTag(trackId: number, tag: string): boolean {
  try {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return false;
    const database = getDb();
    database.prepare(`
      INSERT OR IGNORE INTO track_tags (track_id, tag) VALUES (?, ?)
    `).run(trackId, cleanTag);
    return true;
  } catch (e) {
    console.error('Error adding track tag:', e);
    return false;
  }
}

export function removeTrackTag(trackId: number, tag: string): boolean {
  try {
    const database = getDb();
    database.prepare(`DELETE FROM track_tags WHERE track_id = ? AND tag = ?`).run(trackId, tag.trim().toLowerCase());
    return true;
  } catch (e) {
    console.error('Error removing track tag:', e);
    return false;
  }
}

export function getTrackTags(trackId: number): string[] {
  const database = getDb();
  const rows = database.prepare(`SELECT tag FROM track_tags WHERE track_id = ? ORDER BY tag ASC`).all(trackId) as Array<{ tag: string }>;
  return rows.map((r) => r.tag);
}

export function getAllTrackTagsMap(): Record<number, string[]> {
  const database = getDb();
  const rows = database.prepare(`SELECT track_id, tag FROM track_tags ORDER BY tag ASC`).all() as Array<{ track_id: number; tag: string }>;
  const map: Record<number, string[]> = {};
  for (const r of rows) {
    if (!map[r.track_id]) map[r.track_id] = [];
    map[r.track_id].push(r.tag);
  }
  return map;
}

// ── Smart Playlists ──────────────────────────────────────────────────

export interface SmartPlaylistRule {
  field: 'genre' | 'artist' | 'album' | 'year' | 'rating' | 'min_rating' | 'min_plays' | 'unplayed' | 'tag';
  operator: 'contains' | 'equals' | 'gte' | 'lte' | 'is';
  value: string | number;
}

export interface SmartPlaylistRecord {
  id: number;
  name: string;
  rules: SmartPlaylistRule[];
  created_at: string;
}

export function createSmartPlaylist(name: string, rules: SmartPlaylistRule[]): SmartPlaylistRecord {
  const database = getDb();
  const rulesJson = JSON.stringify(rules);
  const result = database.prepare(`
    INSERT INTO smart_playlists (name, rules_json) VALUES (?, ?)
  `).run(name, rulesJson);

  return {
    id: Number(result.lastInsertRowid),
    name,
    rules,
    created_at: new Date().toISOString(),
  };
}

export function getSmartPlaylists(): SmartPlaylistRecord[] {
  const database = getDb();
  const rows = database.prepare(`SELECT * FROM smart_playlists ORDER BY id ASC`).all() as Array<{
    id: number;
    name: string;
    rules_json: string;
    created_at: string;
  }>;

  return rows.map((r) => {
    let rules: SmartPlaylistRule[] = [];
    try {
      rules = JSON.parse(r.rules_json);
    } catch {
      rules = [];
    }
    return {
      id: r.id,
      name: r.name,
      rules,
      created_at: r.created_at,
    };
  });
}

export function updateSmartPlaylist(id: number, name: string, rules: SmartPlaylistRule[]): boolean {
  try {
    const database = getDb();
    database.prepare(`UPDATE smart_playlists SET name = ?, rules_json = ? WHERE id = ?`).run(name, JSON.stringify(rules), id);
    return true;
  } catch (e) {
    console.error('Error updating smart playlist:', e);
    return false;
  }
}

export function deleteSmartPlaylist(id: number): boolean {
  try {
    const database = getDb();
    database.prepare(`DELETE FROM smart_playlists WHERE id = ?`).run(id);
    return true;
  } catch (e) {
    console.error('Error deleting smart playlist:', e);
    return false;
  }
}

export function evaluateSmartPlaylist(rules: SmartPlaylistRule[]) {
  const database = getDb();
  let query = `
    SELECT
      t.id, t.title, t.path, t.duration, t.track_number, t.genre, t.file_hash,
      COALESCE(a.name, 'Unknown Artist') AS artist,
      COALESCE(al.title, 'Unknown Album') AS album,
      al.year,
      al.cover_art_path AS cover_art,
      COALESCE(tr.rating, 0) AS rating,
      COALESCE(pc.play_count, 0) AS play_count
    FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    LEFT JOIN track_ratings tr ON t.id = tr.track_id
    LEFT JOIN (
      SELECT track_id, COUNT(*) as play_count FROM play_history GROUP BY track_id
    ) pc ON t.id = pc.track_id
    WHERE 1=1
  `;

  const params: unknown[] = [];

  for (const rule of rules) {
    if (rule.field === 'genre') {
      if (rule.operator === 'equals') {
        query += ` AND LOWER(t.genre) = LOWER(?)`;
        params.push(String(rule.value));
      } else {
        query += ` AND LOWER(t.genre) LIKE LOWER(?)`;
        params.push(`%${rule.value}%`);
      }
    } else if (rule.field === 'artist') {
      if (rule.operator === 'equals') {
        query += ` AND LOWER(a.name) = LOWER(?)`;
        params.push(String(rule.value));
      } else {
        query += ` AND LOWER(a.name) LIKE LOWER(?)`;
        params.push(`%${rule.value}%`);
      }
    } else if (rule.field === 'album') {
      if (rule.operator === 'equals') {
        query += ` AND LOWER(al.title) = LOWER(?)`;
        params.push(String(rule.value));
      } else {
        query += ` AND LOWER(al.title) LIKE LOWER(?)`;
        params.push(`%${rule.value}%`);
      }
    } else if (rule.field === 'year') {
      if (rule.operator === 'gte') {
        query += ` AND al.year >= ?`;
        params.push(Number(rule.value));
      } else if (rule.operator === 'lte') {
        query += ` AND al.year <= ?`;
        params.push(Number(rule.value));
      } else {
        query += ` AND al.year = ?`;
        params.push(Number(rule.value));
      }
    } else if (rule.field === 'rating' || rule.field === 'min_rating') {
      query += ` AND COALESCE(tr.rating, 0) >= ?`;
      params.push(Number(rule.value));
    } else if (rule.field === 'min_plays') {
      query += ` AND COALESCE(pc.play_count, 0) >= ?`;
      params.push(Number(rule.value));
    } else if (rule.field === 'unplayed') {
      query += ` AND COALESCE(pc.play_count, 0) = 0`;
    } else if (rule.field === 'tag') {
      query += ` AND t.id IN (SELECT track_id FROM track_tags WHERE LOWER(tag) = LOWER(?))`;
      params.push(String(rule.value));
    }
  }

  query += ` ORDER BY t.title ASC LIMIT 200`;
  return database.prepare(query).all(...params);
}

// ── Mix Tools ────────────────────────────────────────────────────────

export function getForgottenFavorites(limit: number = 25) {
  const database = getDb();
  // Tracks with rating >= 3 or plays >= 2, that have not been played in the last 15 play events
  return database.prepare(`
    SELECT
      t.id, t.title, t.path, t.duration, t.track_number, t.genre, t.file_hash,
      COALESCE(a.name, 'Unknown Artist') AS artist,
      COALESCE(al.title, 'Unknown Album') AS album,
      al.cover_art_path AS cover_art
    FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    LEFT JOIN track_ratings tr ON t.id = tr.track_id
    LEFT JOIN (SELECT track_id, COUNT(*) as pc FROM play_history GROUP BY track_id) ph ON t.id = ph.track_id
    WHERE (COALESCE(tr.rating, 0) >= 3 OR COALESCE(ph.pc, 0) >= 2)
      AND t.id NOT IN (
        SELECT track_id FROM play_history ORDER BY played_at DESC LIMIT 15
      )
    ORDER BY RANDOM()
    LIMIT ?
  `).all(limit);
}

export function getRecentAdditions(limit: number = 25) {
  const database = getDb();
  return database.prepare(`
    SELECT
      t.id, t.title, t.path, t.duration, t.track_number, t.genre, t.file_hash,
      COALESCE(a.name, 'Unknown Artist') AS artist,
      COALESCE(al.title, 'Unknown Album') AS album,
      al.cover_art_path AS cover_art
    FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    ORDER BY t.id DESC
    LIMIT ?
  `).all(limit);
}

export function getMoreFromArtist(artistId: number, limit: number = 25) {
  const database = getDb();
  return database.prepare(`
    SELECT
      t.id, t.title, t.path, t.duration, t.track_number, t.genre, t.file_hash,
      COALESCE(a.name, 'Unknown Artist') AS artist,
      COALESCE(al.title, 'Unknown Album') AS album,
      al.cover_art_path AS cover_art
    FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE t.artist_id = ?
    ORDER BY RANDOM()
    LIMIT ?
  `).all(artistId, limit);
}

// ── Settings & Playback State ─────────────────────────────────────────

export function getSetting(key: string, defaultValue: string = ''): string {
  try {
    const database = getDb();
    const row = database.prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as { value: string } | undefined;
    return row ? row.value : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setSetting(key: string, value: string): boolean {
  try {
    const database = getDb();
    database.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `).run(key, value);
    return true;
  } catch (e) {
    console.error(`Error saving setting ${key}:`, e);
    return false;
  }
}

export interface PlaybackState {
  trackId: number | null;
  currentTime: number;
  queueIds: number[];
  resumePreference: 'always' | 'ask' | 'off';
}

export function saveLastPlaybackState(state: PlaybackState): boolean {
  return setSetting('last_playback_state', JSON.stringify(state));
}

export function getLastPlaybackState(): PlaybackState | null {
  try {
    const val = getSetting('last_playback_state', '');
    if (!val) return null;
    return JSON.parse(val);
  } catch {
    return null;
  }
}

