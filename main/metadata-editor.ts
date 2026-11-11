import * as path from 'path';
import * as fs from 'fs';
import type { TagPatch } from 'music-metadata';
import { writeMp3Tags } from './mp3-tags';
import { getDb, updateTrackMetadataCatalog, type TrackMetadataUpdate } from './db';
import { app, dialog, shell } from 'electron';

// ── File Tag Writing ─────────────────────────────────────────────────
// Writes metadata changes back into audio file tags where supported.
// Uses music-metadata for MP3 tags, with catalog updates always persisted.

/**
 * Update track metadata in both the Overtune catalog and optionally
 * write supported tags back into the audio file.
 */
export async function updateTrackMetadata(
  trackId: number,
  fields: TrackMetadataUpdate,
  writeToFile: boolean = false
): Promise<{ success: boolean; catalogUpdated: boolean; fileUpdated: boolean; error?: string }> {
  const db = getDb();
  const track = db.prepare(`SELECT path FROM tracks WHERE id = ?`).get(trackId) as { path: string } | undefined;
  if (!track) {
    return { success: false, catalogUpdated: false, fileUpdated: false, error: 'Track not found' };
  }

  // Always update the catalog first
  const catalogOk = updateTrackMetadataCatalog(trackId, fields);
  if (!catalogOk) {
    return { success: false, catalogUpdated: false, fileUpdated: false, error: 'Failed to update catalog database' };
  }

  if (!writeToFile) {
    return { success: true, catalogUpdated: true, fileUpdated: false };
  }

  // Check if file exists on disk
  if (!fs.existsSync(track.path)) {
    return {
      success: true,
      catalogUpdated: true,
      fileUpdated: false,
      error: 'Audio file does not exist on disk at the specified path',
    };
  }

  const ext = path.extname(track.path).toLowerCase();
  if (ext === '.mp3') {
    try {
      const tags: TagPatch = {};
      if (fields.title !== undefined) tags.title = fields.title;
      if (fields.artist !== undefined) tags.artist = fields.artist;
      if (fields.album !== undefined) tags.album = fields.album;
      if (fields.track_number !== undefined && fields.track_number !== null) {
        tags.track = { no: fields.track_number };
      }
      if (fields.genre !== undefined && fields.genre !== null) tags.genre = fields.genre;
      if (fields.year !== undefined && fields.year !== null) tags.year = Number(fields.year);

      await writeMp3Tags(track.path, tags);
      return { success: true, catalogUpdated: true, fileUpdated: true };
    } catch (err) {
      return {
        success: true,
        catalogUpdated: true,
        fileUpdated: false,
        error: `Error writing ID3 tags: ${String(err)}`,
      };
    }
  } else {
    // Non-MP3 formats: catalog updated, file write clearly disclosed
    return {
      success: true,
      catalogUpdated: true,
      fileUpdated: false,
      error: `Tag writing is currently supported for MP3 files. Catalog was successfully updated for this ${ext.toUpperCase().replace('.', '')} file.`,
    };
  }
}

// ── Missing File Detection ───────────────────────────────────────────

/**
 * Scan all track paths and return those that no longer exist on disk.
 */
export function findMissingFiles(): Array<{
  id: number;
  title: string;
  artist: string;
  album: string;
  path: string;
}> {
  const db = getDb();
  const allTracks = db.prepare(`
    SELECT t.id, t.title, t.path,
           COALESCE(a.name, 'Unknown Artist') AS artist,
           COALESCE(al.title, 'Unknown Album') AS album
    FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
  `).all() as Array<{ id: number; title: string; path: string; artist: string; album: string }>;

  const missing: Array<{ id: number; title: string; artist: string; album: string; path: string }> = [];

  for (const track of allTracks) {
    try {
      if (!fs.existsSync(track.path)) {
        missing.push(track);
      }
    } catch {
      missing.push(track);
    }
  }

  return missing;
}

/**
 * Show a dialog to select a new file path for relinking a missing track.
 */
export async function relinkTrackDialog(trackId: number): Promise<{ success: boolean; newPath?: string }> {
  const db = getDb();
  const track = db.prepare(`SELECT title, path FROM tracks WHERE id = ?`).get(trackId) as { title: string; path: string } | undefined;
  if (!track) return { success: false };

  const ext = path.extname(track.path).replace('.', '').toLowerCase();

  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: `Relink: ${track.title}`,
    filters: [
      { name: 'Audio Files', extensions: [ext || 'mp3', 'mp3', 'flac', 'wav', 'm4a', 'ogg', 'opus', 'aac'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile'],
  });

  if (canceled || filePaths.length === 0) return { success: false };

  const newPath = filePaths[0];
  db.prepare(`UPDATE tracks SET path = ? WHERE id = ?`).run(newPath, trackId);

  return { success: true, newPath };
}

/**
 * Relink track directly with a given new file path.
 */
export function relinkTrack(trackId: number, newPath: string): { success: boolean; error?: string } {
  if (!fs.existsSync(newPath)) {
    return { success: false, error: 'Target file does not exist on disk' };
  }
  const db = getDb();
  db.prepare(`UPDATE tracks SET path = ? WHERE id = ?`).run(newPath, trackId);
  return { success: true };
}

/**
 * Show a dialog to select replacement artwork for an album, copy it, and optionally embed into MP3 files.
 */
export async function replaceAlbumArtworkDialog(
  albumId: number,
  writeToFile: boolean = false
): Promise<{ success: boolean; newPath?: string; error?: string }> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Album Artwork',
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] }],
    properties: ['openFile'],
  });

  if (canceled || filePaths.length === 0) return { success: false };

  const srcPath = filePaths[0];
  const userDataPath = app.getPath('userData');
  const coversDir = path.join(userDataPath, 'covers');
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
  }

  const ext = path.extname(srcPath);
  const destPath = path.join(coversDir, `album_${albumId}_${Date.now()}${ext}`);
  fs.copyFileSync(srcPath, destPath);

  const db = getDb();
  db.prepare(`UPDATE albums SET cover_art_path = ? WHERE id = ?`).run(destPath, albumId);

  if (writeToFile) {
    try {
      const data = fs.readFileSync(destPath);
      const formats: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.bmp': 'image/bmp' };
      const format = formats[path.extname(destPath).toLowerCase()];
      if (!format) throw new Error('Unrecognized artwork format');
      const tracks = db.prepare(`SELECT path FROM tracks WHERE album_id = ?`).all(albumId) as Array<{ path: string }>;
      for (const t of tracks) {
        if (path.extname(t.path).toLowerCase() === '.mp3' && fs.existsSync(t.path)) {
          await writeMp3Tags(t.path, { picture: [{ format, type: 'Cover (front)', data }] });
        }
      }
    } catch (e) {
      console.warn('Could not write artwork to audio files:', e);
    }
  }

  return { success: true, newPath: destPath };
}

/**
 * Reveal a file in the system file explorer.
 */
export function revealInExplorer(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
      return true;
    } else {
      // If file doesn't exist, open its directory if parent exists
      const parentDir = path.dirname(filePath);
      if (fs.existsSync(parentDir)) {
        shell.openPath(parentDir);
        return true;
      }
      return false;
    }
  } catch {
    return false;
  }
}
