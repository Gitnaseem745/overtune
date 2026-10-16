/**
 * Overtone iOS — File Import Service
 *
 * Handles iOS document picker, app-owned file copying,
 * metadata extraction, artwork caching, and import lifecycle.
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import type { ImportResult, ImportError, MobileTrack } from '../../domain/models';

const AUDIO_DIR = `${FileSystem.documentDirectory}audio/`;
const ARTWORK_DIR = `${FileSystem.documentDirectory}artwork/`;

const SUPPORTED_EXTENSIONS = new Set([
  'mp3', 'aac', 'm4a', 'wav', 'flac', 'ogg', 'opus', 'wma', 'aiff', 'alac',
]);

export type ImportProgressCallback = (current: number, total: number, fileName: string) => void;

class FileImportServiceImpl {
  private initialized = false;

  async ensureDirectories(): Promise<void> {
    if (this.initialized) return;
    const audioDirInfo = await FileSystem.getInfoAsync(AUDIO_DIR);
    if (!audioDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
    }
    const artDirInfo = await FileSystem.getInfoAsync(ARTWORK_DIR);
    if (!artDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(ARTWORK_DIR, { intermediates: true });
    }
    this.initialized = true;
  }

  /**
   * Open the iOS Files document picker for audio files.
   */
  async pickFiles(): Promise<DocumentPicker.DocumentPickerAsset[]> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return [];
    return result.assets;
  }

  /**
   * Import picked files into app-owned storage.
   */
  async importFiles(
    assets: DocumentPicker.DocumentPickerAsset[],
    onProgress?: ImportProgressCallback,
    checkDuplicate?: (fileUri: string) => boolean
  ): Promise<ImportResult> {
    await this.ensureDirectories();

    const result: ImportResult = {
      totalSelected: assets.length,
      imported: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
    };

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const fileName = asset.name || `track_${Date.now()}`;
      onProgress?.(i + 1, assets.length, fileName);

      try {
        // Check extension
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        if (!SUPPORTED_EXTENSIONS.has(ext)) {
          result.failed++;
          result.errors.push({
            fileName,
            reason: `Unsupported format: .${ext}`,
          });
          continue;
        }

        // Generate unique destination path
        const destUri = `${AUDIO_DIR}${Date.now()}_${this.sanitizeFileName(fileName)}`;

        // Check for duplicate
        if (checkDuplicate?.(destUri)) {
          result.duplicates++;
          continue;
        }

        // Copy from cache to app storage
        await FileSystem.copyAsync({
          from: asset.uri,
          to: destUri,
        });

        // Verify the copy succeeded
        const info = await FileSystem.getInfoAsync(destUri);
        if (!info.exists) {
          result.failed++;
          result.errors.push({ fileName, reason: 'File copy failed' });
          continue;
        }

        result.imported++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          fileName,
          reason: error instanceof Error ? error.message : 'Unknown error during import',
        });
      }
    }

    return result;
  }

  /**
   * High-level method: import picked files and persist to SQLite library repositories.
   */
  async importFilesAndSaveToLibrary(
    assets: DocumentPicker.DocumentPickerAsset[],
    db: any,
    onProgress?: ImportProgressCallback
  ): Promise<ImportResult> {
    await this.ensureDirectories();

    const result: ImportResult = {
      totalSelected: assets.length,
      imported: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
    };

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const fileName = asset.name || `track_${Date.now()}`;
      onProgress?.(i + 1, assets.length, fileName);

      try {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        if (!SUPPORTED_EXTENSIONS.has(ext)) {
          result.failed++;
          result.errors.push({ fileName, reason: `Unsupported format: .${ext}` });
          continue;
        }

        const destUri = `${AUDIO_DIR}${Date.now()}_${this.sanitizeFileName(fileName)}`;

        // Check if track already exists in database
        if (db.tracks?.existsByFileUri(destUri)) {
          result.duplicates++;
          continue;
        }

        // Copy file to app storage
        await FileSystem.copyAsync({ from: asset.uri, to: destUri });

        const info = await FileSystem.getInfoAsync(destUri);
        if (!info.exists) {
          result.failed++;
          result.errors.push({ fileName, reason: 'Failed to write file' });
          continue;
        }

        // Extract metadata
        const { extractAudioMetadata } = await import('../metadata/MetadataExtractor');
        const meta = await extractAudioMetadata(destUri, fileName);

        // Find or create artist
        let artistId: number | null = null;
        if (meta.artist && db.artists) {
          artistId = db.artists.findOrCreate(meta.artist);
        }

        // Find or create album
        let albumId: number | null = null;
        if (meta.album && db.albums) {
          albumId = db.albums.findOrCreate(meta.album, artistId, meta.year);
        }

        // Save track to DB
        if (db.tracks) {
          db.tracks.insert({
            title: meta.title,
            albumId,
            artistId,
            fileUri: destUri,
            duration: meta.duration || 0,
            trackNumber: meta.trackNumber,
            genre: meta.genre,
            fileHash: null,
            artworkUri: null,
            fileSize: info.size || 0,
            format: ext,
            sampleRate: meta.sampleRate || null,
            bitRate: meta.bitRate || null,
            channels: meta.channels || null,
            importedAt: new Date().toISOString(),
            lastPlayedAt: null,
          });
        }

        result.imported++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          fileName,
          reason: error instanceof Error ? error.message : 'Import failed',
        });
      }
    }

    return result;
  }

  /**
   * Copy a file to app-owned audio storage and return the new URI.
   */
  async copyToAppStorage(sourceUri: string, fileName: string): Promise<string> {
    await this.ensureDirectories();
    const destUri = `${AUDIO_DIR}${Date.now()}_${this.sanitizeFileName(fileName)}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    return destUri;
  }

  /**
   * Delete a file from app-owned storage.
   */
  async deleteFile(fileUri: string): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        await FileSystem.deleteAsync(fileUri);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Save artwork data to cache and return the URI.
   */
  async saveArtwork(trackId: number, base64Data: string): Promise<string> {
    await this.ensureDirectories();
    const artUri = `${ARTWORK_DIR}${trackId}.jpg`;
    await FileSystem.writeAsStringAsync(artUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return artUri;
  }

  /**
   * Download a remote audio stream to local device storage for offline playback.
   */
  async downloadRemoteTrack(
    remoteUri: string,
    trackId: number,
    title: string
  ): Promise<{ localUri: string; fileSize: number } | null> {
    try {
      await this.ensureDirectories();
      const safeTitle = this.sanitizeFileName(title || `track_${trackId}`);
      const destUri = `${AUDIO_DIR}${trackId}_${safeTitle}.mp3`;

      const downloadResult = await FileSystem.downloadAsync(remoteUri, destUri);
      if (downloadResult.status === 200) {
        const info = await FileSystem.getInfoAsync(destUri);
        return {
          localUri: destUri,
          fileSize: info.exists && info.size ? info.size : 0,
        };
      }
      return null;
    } catch (err) {
      console.warn('[FileImportService] downloadRemoteTrack failed:', err);
      return null;
    }
  }

  /**
   * Download remote artwork to local cache.
   */
  async downloadRemoteArtwork(remoteUri: string, trackId: number): Promise<string | null> {
    try {
      await this.ensureDirectories();
      const destUri = `${ARTWORK_DIR}art_${trackId}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(remoteUri, destUri);
      if (downloadResult.status === 200) {
        return destUri;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get storage usage in bytes.
   */
  async getStorageUsage(): Promise<{ audioBytes: number; artworkBytes: number; totalBytes: number }> {
    let audioBytes = 0;
    let artworkBytes = 0;

    try {
      const audioFiles = await FileSystem.readDirectoryAsync(AUDIO_DIR);
      for (const file of audioFiles) {
        const info = await FileSystem.getInfoAsync(`${AUDIO_DIR}${file}`);
        if (info.exists && !info.isDirectory) {
          audioBytes += info.size || 0;
        }
      }
    } catch { /* empty */ }

    try {
      const artFiles = await FileSystem.readDirectoryAsync(ARTWORK_DIR);
      for (const file of artFiles) {
        const info = await FileSystem.getInfoAsync(`${ARTWORK_DIR}${file}`);
        if (info.exists && !info.isDirectory) {
          artworkBytes += info.size || 0;
        }
      }
    } catch { /* empty */ }

    return { audioBytes, artworkBytes, totalBytes: audioBytes + artworkBytes };
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}

export const FileImportService = new FileImportServiceImpl();

/** Format bytes to human-readable string. */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Format seconds to mm:ss or h:mm:ss. */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const totalSeconds = Math.max(0, Math.round(seconds));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Format seconds to human-readable total duration for playlists, albums, and library (e.g. "4 hr 15 min" or "25 min"). */
export function formatTotalDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0 min';
  const totalSeconds = Math.max(0, Math.round(seconds));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) {
    return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
  }
  if (m > 0) {
    return s > 0 ? `${m} min ${s} sec` : `${m} min`;
  }
  return `${s} sec`;
}
