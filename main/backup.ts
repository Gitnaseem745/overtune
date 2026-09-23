import * as fs from 'fs';
import { app } from 'electron';
import Database from 'better-sqlite3';
import { getDb } from './db';
import { createPreMigrationBackup } from './migration';

export interface BackupArchiveData {
  format: 'overtone-backup';
  schemaVersion: '1.0';
  exportedAt: string;
  appVersion: string;
  data: {
    playlists: Array<{
      name: string;
      is_pinned: boolean;
      created_at: string;
      tracks: Array<{
        title: string;
        artist: string;
        album: string;
        duration: number;
        genre?: string;
        track_number?: number;
        path: string;
        position?: number;
      }>;
    }>;
    smartPlaylists: Array<{
      name: string;
      rules_json: string;
      created_at: string;
    }>;
    ratings: Array<{
      title: string;
      artist: string;
      album: string;
      path: string;
      rating: number;
      created_at: string;
    }>;
    tags: Array<{
      title: string;
      artist: string;
      album: string;
      path: string;
      tag: string;
      created_at: string;
    }>;
    playHistory: Array<{
      title: string;
      artist: string;
      album: string;
      path: string;
      played_at: string;
      duration_played: number;
    }>;
    lyricOffsets: Array<{
      title: string;
      artist: string;
      path: string;
      offset_ms: number;
    }>;
    settings: Record<string, string>;
  };
}

export interface BackupPreview {
  valid: boolean;
  error?: string;
  schemaVersion: string;
  exportedAt: string;
  counts: {
    playlists: number;
    existingPlaylists: number;
    smartPlaylists: number;
    ratings: number;
    tags: number;
    history: number;
    offsets: number;
    matchedTracks: number;
    unmatchedTracks: number;
  };
  samplePlaylists: string[];
}

export interface RestoreResult {
  success: boolean;
  error?: string;
  imported: {
    playlists: number;
    smartPlaylists: number;
    ratings: number;
    tags: number;
    history: number;
    offsets: number;
    settings: number;
  };
  backupPath?: string | null;
}

export interface RelocateResult {
  success: boolean;
  matchedTracks: number;
  updatedTracks: number;
  verifiedOnDisk: number;
  updatedFolders: number;
}

/**
 * Generate a complete, portable backup archive of the user's Overtone library data.
 */
export function generateBackupData(customDb?: Database.Database): BackupArchiveData {
  const db = customDb || getDb();

  let appVersion = '0.2.0';
  try {
    appVersion = app.getVersion();
  } catch {
    // Non-electron test runner fallback
  }

  // 1. Playlists & tracks
  const playlistsRows = db.prepare('SELECT id, name, created_at, is_pinned FROM playlists ORDER BY id ASC').all() as Array<{
    id: number;
    name: string;
    created_at: string;
    is_pinned: number;
  }>;

  const playlists: BackupArchiveData['data']['playlists'] = [];

  for (const pl of playlistsRows) {
    const trackRows = db.prepare(`
      SELECT 
        t.title, COALESCE(a.name, 'Unknown Artist') as artist, COALESCE(al.title, 'Unknown Album') as album,
        t.duration, t.genre, t.track_number, t.path, pt.position
      FROM playlist_tracks pt
      JOIN tracks t ON pt.track_id = t.id
      LEFT JOIN artists a ON t.artist_id = a.id
      LEFT JOIN albums al ON t.album_id = al.id
      WHERE pt.playlist_id = ?
      ORDER BY pt.position ASC, pt.track_id ASC
    `).all(pl.id) as Array<{
      title: string;
      artist: string;
      album: string;
      duration: number;
      genre?: string;
      track_number?: number;
      path: string;
      position?: number;
    }>;

    playlists.push({
      name: pl.name,
      is_pinned: Boolean(pl.is_pinned),
      created_at: pl.created_at,
      tracks: trackRows,
    });
  }

  // 2. Smart Playlists
  const smartPlaylists = db.prepare('SELECT name, rules_json, created_at FROM smart_playlists ORDER BY id ASC').all() as Array<{
    name: string;
    rules_json: string;
    created_at: string;
  }>;

  // 3. Track Ratings
  const ratings = db.prepare(`
    SELECT t.title, COALESCE(a.name, 'Unknown Artist') as artist, COALESCE(al.title, 'Unknown Album') as album,
           t.path, r.rating, r.created_at
    FROM track_ratings r
    JOIN tracks t ON r.track_id = t.id
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    ORDER BY r.created_at ASC
  `).all() as BackupArchiveData['data']['ratings'];

  // 4. Track Tags
  const tags = db.prepare(`
    SELECT t.title, COALESCE(a.name, 'Unknown Artist') as artist, COALESCE(al.title, 'Unknown Album') as album,
           t.path, tg.tag, tg.created_at
    FROM track_tags tg
    JOIN tracks t ON tg.track_id = t.id
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    ORDER BY tg.id ASC
  `).all() as BackupArchiveData['data']['tags'];

  // 5. Play History
  const playHistory = db.prepare(`
    SELECT t.title, COALESCE(a.name, 'Unknown Artist') as artist, COALESCE(al.title, 'Unknown Album') as album,
           t.path, h.played_at, h.duration_played
    FROM play_history h
    JOIN tracks t ON h.track_id = t.id
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    ORDER BY h.id ASC
  `).all() as BackupArchiveData['data']['playHistory'];

  // 6. Lyric Offsets
  const lyricOffsets = db.prepare(`
    SELECT t.title, COALESCE(a.name, 'Unknown Artist') as artist, t.path, lo.offset_ms
    FROM lyric_offsets lo
    JOIN tracks t ON lo.track_id = t.id
    LEFT JOIN artists a ON t.artist_id = a.id
    WHERE lo.offset_ms != 0
  `).all() as BackupArchiveData['data']['lyricOffsets'];

  // 7. Settings (portable preferences only)
  const settingsRows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  const settings: Record<string, string> = {};
  const EXCLUDED_KEYS = new Set(['window_bounds', 'last_playback_state']);
  for (const s of settingsRows) {
    if (!EXCLUDED_KEYS.has(s.key)) {
      settings[s.key] = s.value;
    }
  }

  return {
    format: 'overtone-backup',
    schemaVersion: '1.0',
    exportedAt: new Date().toISOString(),
    appVersion,
    data: {
      playlists,
      smartPlaylists,
      ratings,
      tags,
      playHistory,
      lyricOffsets,
      settings,
    },
  };
}

/**
 * Export backup to a JSON file.
 */
export async function exportBackupToFile(filePath: string, customDb?: Database.Database): Promise<boolean> {
  const backup = generateBackupData(customDb);
  const json = JSON.stringify(backup, null, 2);
  await fs.promises.writeFile(filePath, json, 'utf-8');
  return true;
}

/**
 * Inspect and preview the contents of a backup archive before restoring.
 */
export function previewBackupData(
  jsonOrPath: string,
  isFilePath = false,
  customDb?: Database.Database
): BackupPreview {
  const db = customDb || getDb();

  let parsed: BackupArchiveData;
  try {
    const raw = isFilePath ? fs.readFileSync(jsonOrPath, 'utf-8') : jsonOrPath;
    parsed = JSON.parse(raw);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      error: `Invalid backup JSON format: ${msg}`,
      schemaVersion: '',
      exportedAt: '',
      counts: {
        playlists: 0,
        existingPlaylists: 0,
        smartPlaylists: 0,
        ratings: 0,
        tags: 0,
        history: 0,
        offsets: 0,
        matchedTracks: 0,
        unmatchedTracks: 0,
      },
      samplePlaylists: [],
    };
  }

  if (parsed.format !== 'overtone-backup' || !parsed.data) {
    return {
      valid: false,
      error: 'Unrecognized backup archive schema. Expected format: "overtone-backup"',
      schemaVersion: parsed.schemaVersion || 'unknown',
      exportedAt: parsed.exportedAt || '',
      counts: {
        playlists: 0,
        existingPlaylists: 0,
        smartPlaylists: 0,
        ratings: 0,
        tags: 0,
        history: 0,
        offsets: 0,
        matchedTracks: 0,
        unmatchedTracks: 0,
      },
      samplePlaylists: [],
    };
  }

  // Count existing playlists
  const existingNames = new Set(
    (db.prepare('SELECT name FROM playlists').all() as Array<{ name: string }>).map(p => p.name.toLowerCase())
  );

  let existingPlaylistsCount = 0;
  const samplePlaylists: string[] = [];

  for (const pl of parsed.data.playlists || []) {
    samplePlaylists.push(pl.name);
    if (existingNames.has(pl.name.toLowerCase())) {
      existingPlaylistsCount++;
    }
  }

  // Track match analysis
  let matchedTracks = 0;
  let unmatchedTracks = 0;

  // Cache local tracks by path and (title + artist)
  const localTracks = db.prepare(`
    SELECT t.path, LOWER(t.title) as title, LOWER(COALESCE(a.name, '')) as artist
    FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
  `).all() as Array<{ path: string; title: string; artist: string }>;

  const localPaths = new Set(localTracks.map(t => t.path));
  const localTitleArtist = new Set(localTracks.map(t => `${t.title}:::${t.artist}`));

  // Check unique tracks in backup
  const checkedTracks = new Set<string>();
  const allBackupTracks = [
    ...(parsed.data.playlists || []).flatMap(p => p.tracks || []),
    ...(parsed.data.ratings || []),
    ...(parsed.data.tags || []),
    ...(parsed.data.playHistory || []),
  ];

  for (const tr of allBackupTracks) {
    const key = tr.path || `${tr.title}:::${tr.artist}`;
    if (checkedTracks.has(key)) continue;
    checkedTracks.add(key);

    const matchesPath = tr.path && localPaths.has(tr.path);
    const matchesTitleArtist = localTitleArtist.has(`${(tr.title || '').toLowerCase()}:::${(tr.artist || '').toLowerCase()}`);

    if (matchesPath || matchesTitleArtist) {
      matchedTracks++;
    } else {
      unmatchedTracks++;
    }
  }

  return {
    valid: true,
    schemaVersion: parsed.schemaVersion || '1.0',
    exportedAt: parsed.exportedAt || '',
    counts: {
      playlists: parsed.data.playlists?.length || 0,
      existingPlaylists: existingPlaylistsCount,
      smartPlaylists: parsed.data.smartPlaylists?.length || 0,
      ratings: parsed.data.ratings?.length || 0,
      tags: parsed.data.tags?.length || 0,
      history: parsed.data.playHistory?.length || 0,
      offsets: parsed.data.lyricOffsets?.length || 0,
      matchedTracks,
      unmatchedTracks,
    },
    samplePlaylists: samplePlaylists.slice(0, 5),
  };
}

/**
 * Helper to find a track in the local database by exact path, or fuzzy title + artist.
 */
function findLocalTrackId(
  db: Database.Database,
  track: { path?: string; title?: string; artist?: string }
): number | null {
  if (track.path) {
    const row = db.prepare('SELECT id FROM tracks WHERE path = ?').get(track.path) as { id: number } | undefined;
    if (row) return row.id;
  }

  if (track.title) {
    const row = db.prepare(`
      SELECT t.id FROM tracks t
      LEFT JOIN artists a ON t.artist_id = a.id
      WHERE LOWER(t.title) = LOWER(?)
        AND (LOWER(COALESCE(a.name, '')) = LOWER(?) OR ? = '')
      LIMIT 1
    `).get(track.title, track.artist || '', track.artist || '') as { id: number } | undefined;
    if (row) return row.id;
  }

  return null;
}

/**
 * Restore library data from a backup archive with conflict resolution modes:
 * - 'skip': Only insert records that do not already exist.
 * - 'overwrite': Replace conflicting records with backup data.
 * - 'merge': Combine records (e.g. merge playlist tracks, update ratings).
 */
export function restoreBackupData(
  jsonOrPath: string,
  isFilePath = false,
  options: {
    mode?: 'skip' | 'overwrite' | 'merge';
    restoreSettings?: boolean;
    customDb?: Database.Database;
  } = {}
): RestoreResult {
  const mode = options.mode || 'skip';
  const restoreSettings = options.restoreSettings ?? false;
  const db = options.customDb || getDb();

  let parsed: BackupArchiveData;
  try {
    const raw = isFilePath ? fs.readFileSync(jsonOrPath, 'utf-8') : jsonOrPath;
    parsed = JSON.parse(raw);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Failed to read backup: ${msg}`,
      imported: { playlists: 0, smartPlaylists: 0, ratings: 0, tags: 0, history: 0, offsets: 0, settings: 0 },
    };
  }

  if (parsed.format !== 'overtone-backup' || !parsed.data) {
    return {
      success: false,
      error: 'Invalid backup archive schema.',
      imported: { playlists: 0, smartPlaylists: 0, ratings: 0, tags: 0, history: 0, offsets: 0, settings: 0 },
    };
  }

  // Pre-restore safety backup
  let backupPath: string | null = null;
  if (!options.customDb) {
    backupPath = createPreMigrationBackup();
  }

  let importedPlaylists = 0;
  let importedSmartPlaylists = 0;
  let importedRatings = 0;
  let importedTags = 0;
  let importedHistory = 0;
  let importedOffsets = 0;
  let importedSettings = 0;

  try {
    db.transaction(() => {
      // 1. Playlists
      for (const pl of parsed.data.playlists || []) {
        const existing = db.prepare('SELECT id FROM playlists WHERE LOWER(name) = LOWER(?)').get(pl.name) as { id: number } | undefined;

        let targetPlaylistId: number | null = null;

        if (existing) {
          if (mode === 'skip') {
            continue; // Skip this playlist entirely
          } else if (mode === 'overwrite') {
            db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ?').run(existing.id);
            targetPlaylistId = existing.id;
          } else if (mode === 'merge') {
            targetPlaylistId = existing.id;
          }
        } else {
          const insertRes = db.prepare('INSERT INTO playlists (name, is_pinned, created_at) VALUES (?, ?, ?)').run(
            pl.name,
            pl.is_pinned ? 1 : 0,
            pl.created_at || new Date().toISOString()
          );
          targetPlaylistId = Number(insertRes.lastInsertRowid);
          importedPlaylists++;
        }

        if (targetPlaylistId && pl.tracks) {
          const existingTrackIds = new Set(
            (db.prepare('SELECT track_id FROM playlist_tracks WHERE playlist_id = ?').all(targetPlaylistId) as Array<{ track_id: number }>).map(r => r.track_id)
          );

          let pos = (db.prepare('SELECT COALESCE(MAX(position), 0) as maxPos FROM playlist_tracks WHERE playlist_id = ?').get(targetPlaylistId) as { maxPos: number }).maxPos + 1;

          for (const tr of pl.tracks) {
            const trackId = findLocalTrackId(db, tr);
            if (trackId && !existingTrackIds.has(trackId)) {
              db.prepare('INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)').run(
                targetPlaylistId,
                trackId,
                pos++
              );
              existingTrackIds.add(trackId);
            }
          }
        }
      }

      // 2. Smart Playlists
      for (const sp of parsed.data.smartPlaylists || []) {
        const existing = db.prepare('SELECT id FROM smart_playlists WHERE LOWER(name) = LOWER(?)').get(sp.name) as { id: number } | undefined;
        if (existing) {
          if (mode === 'overwrite' || mode === 'merge') {
            db.prepare('UPDATE smart_playlists SET rules_json = ? WHERE id = ?').run(sp.rules_json, existing.id);
            importedSmartPlaylists++;
          }
        } else {
          db.prepare('INSERT INTO smart_playlists (name, rules_json, created_at) VALUES (?, ?, ?)').run(
            sp.name,
            sp.rules_json,
            sp.created_at || new Date().toISOString()
          );
          importedSmartPlaylists++;
        }
      }

      // 3. Track Ratings
      for (const r of parsed.data.ratings || []) {
        const trackId = findLocalTrackId(db, r);
        if (!trackId) continue;

        const existing = db.prepare('SELECT rating FROM track_ratings WHERE track_id = ?').get(trackId) as { rating: number } | undefined;
        if (existing) {
          if (mode === 'overwrite') {
            db.prepare('UPDATE track_ratings SET rating = ? WHERE track_id = ?').run(r.rating, trackId);
            importedRatings++;
          }
        } else {
          db.prepare('INSERT OR REPLACE INTO track_ratings (track_id, rating, created_at) VALUES (?, ?, ?)').run(
            trackId,
            r.rating,
            r.created_at || new Date().toISOString()
          );
          importedRatings++;
        }
      }

      // 4. Track Tags
      for (const tg of parsed.data.tags || []) {
        const trackId = findLocalTrackId(db, tg);
        if (!trackId) continue;

        const res = db.prepare('INSERT OR IGNORE INTO track_tags (track_id, tag, created_at) VALUES (?, ?, ?)').run(
          trackId,
          tg.tag,
          tg.created_at || new Date().toISOString()
        );
        if (res.changes > 0) importedTags++;
      }

      // 5. Play History
      for (const h of parsed.data.playHistory || []) {
        const trackId = findLocalTrackId(db, h);
        if (!trackId) continue;

        db.prepare('INSERT INTO play_history (track_id, played_at, duration_played) VALUES (?, ?, ?)').run(
          trackId,
          h.played_at || new Date().toISOString(),
          h.duration_played || 0
        );
        importedHistory++;
      }

      // 6. Lyric Offsets
      for (const lo of parsed.data.lyricOffsets || []) {
        const trackId = findLocalTrackId(db, lo);
        if (!trackId) continue;

        const existing = db.prepare('SELECT offset_ms FROM lyric_offsets WHERE track_id = ?').get(trackId) as { offset_ms: number } | undefined;
        if (existing) {
          if (mode === 'overwrite') {
            db.prepare('UPDATE lyric_offsets SET offset_ms = ? WHERE track_id = ?').run(lo.offset_ms, trackId);
            importedOffsets++;
          }
        } else {
          db.prepare('INSERT OR REPLACE INTO lyric_offsets (track_id, offset_ms) VALUES (?, ?)').run(trackId, lo.offset_ms);
          importedOffsets++;
        }
      }

      // 7. Settings (Optional)
      if (restoreSettings && parsed.data.settings) {
        for (const [k, v] of Object.entries(parsed.data.settings)) {
          if (mode === 'overwrite' || mode === 'merge') {
            db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(k, v);
            importedSettings++;
          } else if (mode === 'skip') {
            const has = db.prepare('SELECT key FROM settings WHERE key = ?').get(k);
            if (!has) {
              db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(k, v);
              importedSettings++;
            }
          }
        }
      }
    })();

    return {
      success: true,
      imported: {
        playlists: importedPlaylists,
        smartPlaylists: importedSmartPlaylists,
        ratings: importedRatings,
        tags: importedTags,
        history: importedHistory,
        offsets: importedOffsets,
        settings: importedSettings,
      },
      backupPath,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Backup] Error during restore transaction:', err);
    return {
      success: false,
      error: `Restore failed: ${msg}`,
      imported: { playlists: 0, smartPlaylists: 0, ratings: 0, tags: 0, history: 0, offsets: 0, settings: 0 },
      backupPath,
    };
  }
}

/**
 * Batch relocate catalog file paths when moving a library to another directory or computer.
 */
export function relocateLibraryPaths(
  oldPrefix: string,
  newPrefix: string,
  customDb?: Database.Database
): RelocateResult {
  const db = customDb || getDb();

  if (!oldPrefix || !newPrefix || oldPrefix.trim() === '' || newPrefix.trim() === '') {
    return { success: false, matchedTracks: 0, updatedTracks: 0, verifiedOnDisk: 0, updatedFolders: 0 };
  }

  const cleanOld = oldPrefix.replace(/[/\\]+$/, '');
  const cleanNew = newPrefix.replace(/[/\\]+$/, '');

  const tracks = db.prepare('SELECT id, path FROM tracks WHERE path LIKE ? || \'%\'').all(cleanOld) as Array<{ id: number; path: string }>;

  let updatedTracks = 0;
  let verifiedOnDisk = 0;

  db.transaction(() => {
    const updateStmt = db.prepare('UPDATE tracks SET path = ? WHERE id = ?');

    for (const tr of tracks) {
      const newPath = tr.path.replace(cleanOld, cleanNew);
      updateStmt.run(newPath, tr.id);
      updatedTracks++;

      try {
        if (fs.existsSync(newPath)) {
          verifiedOnDisk++;
        }
      } catch {
        // Disk access check fallback
      }
    }

    // Update watched_folders
    const folders = db.prepare('SELECT id, path FROM watched_folders WHERE path LIKE ? || \'%\'').all(cleanOld) as Array<{ id: number; path: string }>;
    const updateFolderStmt = db.prepare('UPDATE watched_folders SET path = ? WHERE id = ?');
    for (const f of folders) {
      const newPath = f.path.replace(cleanOld, cleanNew);
      updateFolderStmt.run(newPath, f.id);
    }
  })();

  const updatedFoldersCount = (db.prepare('SELECT COUNT(*) as count FROM watched_folders WHERE path LIKE ? || \'%\'').get(cleanNew) as { count: number }).count;

  return {
    success: true,
    matchedTracks: tracks.length,
    updatedTracks,
    verifiedOnDisk,
    updatedFolders: updatedFoldersCount,
  };
}
