/**
 * Overtone iOS — File Import Service
 *
 * Handles iOS document picker, app-owned file copying,
 * metadata extraction, artwork caching, and import lifecycle.
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { ImportResult, ImportError, MobileTrack } from '../../domain/models';

export const MUSIC_DIR = `${FileSystem.documentDirectory}Music/`;
export const AUDIO_DIR = `${FileSystem.documentDirectory}audio/`;
export const ARTWORK_DIR = `${FileSystem.documentDirectory}artwork/`;

const SUPPORTED_EXTENSIONS = new Set([
  'mp3', 'aac', 'm4a', 'wav', 'flac', 'ogg', 'opus', 'wma', 'aiff', 'alac',
]);

export type ImportProgressCallback = (current: number, total: number, fileName: string) => void;

class FileImportServiceImpl {
  private initialized = false;

  async ensureDirectories(): Promise<void> {
    if (this.initialized) return;
    const musicDirInfo = await FileSystem.getInfoAsync(MUSIC_DIR);
    if (!musicDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MUSIC_DIR, { intermediates: true });
    }
    const audioDirInfo = await FileSystem.getInfoAsync(AUDIO_DIR);
    if (!audioDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
    }
    const artDirInfo = await FileSystem.getInfoAsync(ARTWORK_DIR);
    if (!artDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(ARTWORK_DIR, { intermediates: true });
    }

    // Ensure root file exists so iOS Files app (On My iPhone) exposes the Overtone container immediately
    try {
      if (FileSystem.documentDirectory) {
        const markerUri = `${FileSystem.documentDirectory}Overtone Library.txt`;
        const markerInfo = await FileSystem.getInfoAsync(markerUri);
        if (!markerInfo.exists) {
          await FileSystem.writeAsStringAsync(
            markerUri,
            'Overtone Music Library\n\nAudio files placed in the "Music" folder are automatically available in Overtone and can be accessed by VLC, GarageBand, and other media players.\n'
          );
        }
      }
    } catch { /* ignore */ }

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

        const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        const cleanName = this.sanitizeFileName(baseName);
        let destUri = `${MUSIC_DIR}${cleanName}.${ext}`;

        // Check if track already exists in database
        if (db.tracks?.existsByFileUri(destUri)) {
          result.duplicates++;
          continue;
        }

        const destInfo = await FileSystem.getInfoAsync(destUri);
        if (destInfo.exists) {
          if (asset.size && destInfo.size === asset.size) {
            result.duplicates++;
            continue;
          }
          destUri = `${MUSIC_DIR}${cleanName}_${Date.now()}.${ext}`;
        }

        // Copy file directly to user-visible Music storage
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
    const ext = fileName.split('.').pop()?.toLowerCase() || 'mp3';
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    const destUri = `${MUSIC_DIR}${this.sanitizeFileName(baseName)}.${ext}`;
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
   * If saveToFilesApp is true (default), stores into the public "Music/" folder
   * inside the iOS Files app (On My iPhone > Overtone > Music) with clean human-readable name:
   * "Artist - Title.mp3", allowing other apps (VLC, GarageBand, Files) to open and play it.
   */
  async downloadRemoteTrack(
    remoteUri: string,
    trackId: number,
    title: string,
    artistName?: string,
    saveToFilesApp: boolean = true
  ): Promise<{ localUri: string; fileSize: number } | null> {
    try {
      await this.ensureDirectories();
      const safeTitle = this.sanitizeFileName(title || `track_${trackId}`);
      const safeArtist = artistName ? this.sanitizeFileName(artistName) : '';
      const humanName = safeArtist ? `${safeArtist} - ${safeTitle}` : safeTitle;

      const targetDir = saveToFilesApp ? MUSIC_DIR : AUDIO_DIR;
      const destUri = `${targetDir}${humanName}.mp3`;

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
   * Open the native Share / Save to Files sheet for an audio track.
   * Allows saving to any folder in the Files app (iCloud, On My iPhone, USB drive),
   * or opening directly in VLC, GarageBand, and other apps.
   */
  async shareOrExportTrack(localUri: string, title?: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        return false;
      }
      const ext = localUri.split('.').pop()?.toLowerCase() || 'mp3';
      let mimeType = 'audio/mpeg';
      let uti = 'public.mp3';
      if (ext === 'm4a' || ext === 'aac') {
        mimeType = 'audio/mp4';
        uti = 'public.audio';
      } else if (ext === 'flac') {
        mimeType = 'audio/flac';
        uti = 'public.audio';
      } else if (ext === 'wav') {
        mimeType = 'audio/wav';
        uti = 'com.microsoft.waveform-audio';
      }

      await Sharing.shareAsync(localUri, {
        mimeType,
        dialogTitle: title ? `Save or Open "${title}"` : 'Save to Files or Open in Other Apps',
        UTI: uti,
      });
      return true;
    } catch (err) {
      console.warn('[FileImportService] shareOrExportTrack failed:', err);
      return false;
    }
  }

  /**
   * Ensure all downloaded songs are placed in the user-visible Music/ folder
   * inside the Files app ("On My iPhone > Overtone > Music").
   * Automatically migrates tracks from AUDIO_DIR, removes redundant duplicate files
   * to prevent storage ballooning, and updates SQLite database records.
   */
  async syncAllToFilesApp(tracks: MobileTrack[], db?: any): Promise<number> {
    await this.ensureDirectories();
    let movedCount = 0;

    // Track assigned URIs to prevent two tracks from sharing the exact same file_uri
    const assignedUris = new Set<string>();
    if (db?.tracks?.getAll) {
      try {
        const all: MobileTrack[] = db.tracks.getAll();
        for (const t of all) {
          if (t.fileUri) {
            assignedUris.add(t.fileUri);
          }
        }
      } catch { /* ignore */ }
    }

    for (const track of tracks) {
      if (!track.fileUri || track.fileUri.startsWith('http://') || track.format === 'stream') {
        continue;
      }
      try {
        const ext = (track.format && track.format !== 'stream' ? track.format : track.fileUri.split('.').pop()?.toLowerCase()) || 'mp3';
        let safeTitle = this.sanitizeFileName(track.title || `track_${track.id}`);
        if (safeTitle.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) {
          safeTitle = safeTitle.slice(0, -(ext.length + 1));
        }

        let artistPrefix = '';
        if (track.artistId && db?.artists) {
          const artistName = db.artists.getNameById(track.artistId);
          if (artistName && artistName !== 'Unknown Artist') {
            artistPrefix = `${this.sanitizeFileName(artistName)} - `;
          }
        }

        const baseFileName = `${artistPrefix}${safeTitle}`;
        let candidateUri = `${MUSIC_DIR}${baseFileName}.${ext}`;

        // Ensure candidateUri is unique among assignedUris
        let counter = 0;
        while (assignedUris.has(candidateUri)) {
          if (track.fileUri === candidateUri) {
            break;
          }
          counter++;
          candidateUri = `${MUSIC_DIR}${baseFileName} (${track.id}${counter > 1 ? `_${counter}` : ''}).${ext}`;
        }

        const destUri = candidateUri;

        if (track.fileUri === destUri) {
          assignedUris.add(destUri);
          continue;
        }

        const exists = await FileSystem.getInfoAsync(destUri);
        if (!exists.exists) {
          await FileSystem.copyAsync({ from: track.fileUri, to: destUri });
          movedCount++;
        }

        // Clean up legacy copy in AUDIO_DIR
        if (typeof FileSystem.deleteAsync === 'function' && track.fileUri.startsWith(AUDIO_DIR)) {
          await FileSystem.deleteAsync(track.fileUri).catch(() => {});
        }

        if (track.fileUri) {
          assignedUris.delete(track.fileUri);
        }
        assignedUris.add(destUri);

        db?.tracks?.updateFileUri?.(track.id, destUri, ext);
        track.fileUri = destUri;
      } catch (e) {
        console.warn('[FileImportService] syncToFilesApp failed for track:', track.title, e);
      }
    }

    // Clean up any remaining orphaned duplicates in AUDIO_DIR from previous exports
    await this.cleanDuplicateAudioFiles(db);

    return movedCount;
  }

  /**
   * Scans AUDIO_DIR and cleans up duplicate or orphaned audio files that already
   * exist in MUSIC_DIR or are no longer referenced in the database, reclaiming space.
   */
  async cleanDuplicateAudioFiles(db?: any): Promise<number> {
    let reclaimedBytes = 0;
    try {
      if (typeof FileSystem.deleteAsync !== 'function') return 0;
      const audioFiles = await FileSystem.readDirectoryAsync(AUDIO_DIR).catch(() => []);
      if (!audioFiles || audioFiles.length === 0) return 0;

      const musicFiles = new Set(await FileSystem.readDirectoryAsync(MUSIC_DIR).catch(() => []));
      const activeUris = new Set<string>();
      if (db?.tracks?.getAll) {
        const all = db.tracks.getAll();
        for (const t of all) {
          if (t.fileUri) activeUris.add(t.fileUri);
        }
      }

      for (const file of audioFiles) {
        const audioUri = `${AUDIO_DIR}${file}`;
        const info = await FileSystem.getInfoAsync(audioUri);
        if (!info.exists || info.isDirectory) continue;

        const strippedName = file.replace(/^\d+_/, '');
        const isDuplicate = musicFiles.has(file) || musicFiles.has(strippedName);
        const isOrphaned = activeUris.size > 0 && !activeUris.has(audioUri);

        if (isDuplicate || isOrphaned) {
          reclaimedBytes += info.size || 0;
          await FileSystem.deleteAsync(audioUri).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('[FileImportService] cleanDuplicateAudioFiles error:', err);
    }
    return reclaimedBytes;
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
      const musicFiles = await FileSystem.readDirectoryAsync(MUSIC_DIR);
      for (const file of musicFiles) {
        const info = await FileSystem.getInfoAsync(`${MUSIC_DIR}${file}`);
        if (info.exists && !info.isDirectory) {
          audioBytes += info.size || 0;
        }
      }
    } catch { /* empty */ }

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

  /**
   * Resolves a stored file URI to an existing file on disk.
   * Handles iOS container UUID changes between launches/reloads,
   * directory migrations between audio/ and Music/, and URL decoding.
   */
  async resolveLocalFileUri(uri: string): Promise<string | null> {
    if (!uri || uri.startsWith('http://') || uri.startsWith('https://')) {
      return null;
    }

    // 1. Direct check
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) return uri;
    } catch { /* ignore */ }

    // 2. iOS container UUID remapping (when app container UUID changes between sessions/updates)
    if (FileSystem.documentDirectory && uri.includes('/Documents/')) {
      const relativePart = uri.substring(uri.indexOf('/Documents/') + '/Documents/'.length);
      const remappedUri = `${FileSystem.documentDirectory}${relativePart}`;
      try {
        const remappedInfo = await FileSystem.getInfoAsync(remappedUri);
        if (remappedInfo.exists) return remappedUri;
      } catch { /* ignore */ }

      // Try alternate directories (Music vs audio)
      if (relativePart.startsWith('audio/')) {
        const musicCandidate = `${MUSIC_DIR}${relativePart.replace(/^audio\//, '')}`;
        try {
          const info = await FileSystem.getInfoAsync(musicCandidate);
          if (info.exists) return musicCandidate;
        } catch { /* ignore */ }
      } else if (relativePart.startsWith('Music/')) {
        const audioCandidate = `${AUDIO_DIR}${relativePart.replace(/^Music\//, '')}`;
        try {
          const info = await FileSystem.getInfoAsync(audioCandidate);
          if (info.exists) return audioCandidate;
        } catch { /* ignore */ }
      }
    }

    // 3. Match by filename in MUSIC_DIR and AUDIO_DIR
    try {
      const rawName = uri.split('/').pop();
      if (rawName) {
        const decoded = decodeURIComponent(rawName);
        for (const candidate of [
          `${MUSIC_DIR}${rawName}`,
          `${MUSIC_DIR}${decoded}`,
          `${AUDIO_DIR}${rawName}`,
          `${AUDIO_DIR}${decoded}`,
        ]) {
          const cInfo = await FileSystem.getInfoAsync(candidate);
          if (cInfo.exists) return candidate;
        }
      }
    } catch { /* ignore */ }

    // 4. Fallback to original uri if it is a local file scheme (e.g. test environments)
    if (uri.startsWith('file://')) {
      return uri;
    }

    return null;
  }

  /**
   * Export all songs in a playlist into a dedicated folder in the Files app:
   * "On My iPhone > Overtone > Music > [Playlist Name]"
   * Also writes a [Playlist Name].m3u8 playlist file for media players (VLC, GarageBand, etc).
   */
  async exportPlaylistFolderToFiles(
    playlistName: string,
    tracks: MobileTrack[],
    db?: any
  ): Promise<{ folderUri: string; exportedCount: number }> {
    await this.ensureDirectories();
    const safeName = this.sanitizeFileName(playlistName || 'Playlist');
    const playlistDir = `${MUSIC_DIR}${safeName}/`;

    const dirInfo = await FileSystem.getInfoAsync(playlistDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(playlistDir, { intermediates: true });
    }

    let exportedCount = 0;
    const m3u8Lines: string[] = ['#EXTM3U'];

    for (let i = 0; i < tracks.length; i++) {
      const tr = tracks[i];
      if (!tr.fileUri || tr.fileUri.startsWith('http://') || tr.format === 'stream') {
        continue;
      }
      try {
        const srcUri = (await this.resolveLocalFileUri(tr.fileUri)) || tr.fileUri;

        if (srcUri !== tr.fileUri) {
          db?.tracks?.updateFileUri?.(tr.id, srcUri);
          tr.fileUri = srcUri;
        }

        const ext = (tr.format && tr.format !== 'stream' ? tr.format : srcUri.split('.').pop()?.toLowerCase()) || 'mp3';
        let safeTitle = this.sanitizeFileName(tr.title || `track_${tr.id}`);
        if (safeTitle.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) {
          safeTitle = safeTitle.slice(0, -(ext.length + 1));
        }

        let artistPrefix = '';
        if (tr.artistId && db?.artists) {
          const artistName = db.artists.getNameById(tr.artistId);
          if (artistName && artistName !== 'Unknown Artist') {
            artistPrefix = `${this.sanitizeFileName(artistName)} - `;
          }
        }

        const fileName = `${String(i + 1).padStart(2, '0')} - ${artistPrefix}${safeTitle}.${ext}`;
        const destUri = `${playlistDir}${fileName}`;

        if (srcUri !== destUri) {
          const exists = await FileSystem.getInfoAsync(destUri);
          if (!exists.exists) {
            try {
              await FileSystem.copyAsync({ from: srcUri, to: destUri });
            } catch (copyErr) {
              console.warn('[FileImportService] copyAsync failed:', copyErr);
            }
          }
        }

        exportedCount++;
        m3u8Lines.push(`#EXTINF:${Math.round(tr.duration || 0)},${tr.title}`);
        m3u8Lines.push(fileName);
      } catch (e) {
        console.warn('[FileImportService] exportPlaylistFolderToFiles failed for track:', tr.title, e);
      }
    }

    // Write playlist .m3u8 file
    try {
      const m3u8Uri = `${playlistDir}${safeName}.m3u8`;
      await FileSystem.writeAsStringAsync(m3u8Uri, m3u8Lines.join('\n'));
    } catch { /* ignore */ }

    return { folderUri: playlistDir, exportedCount };
  }

  /**
   * Share only the .m3u8 playlist file so other apps and desktop players can import the playlist structure.
   */
  async sharePlaylistM3U(playlistName: string, tracks: MobileTrack[]): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) return false;

      const safeName = this.sanitizeFileName(playlistName || 'Playlist');
      const m3uUri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}${safeName}.m3u8`;
      const m3u8Lines: string[] = ['#EXTM3U'];

      for (let i = 0; i < tracks.length; i++) {
        const tr = tracks[i];
        m3u8Lines.push(`#EXTINF:${Math.round(tr.duration || 0)},${tr.title}`);
        m3u8Lines.push(tr.fileUri || tr.title);
      }

      await FileSystem.writeAsStringAsync(m3uUri, m3u8Lines.join('\n'));
      await Sharing.shareAsync(m3uUri, {
        mimeType: 'audio/x-mpegurl',
        dialogTitle: `Share "${playlistName}" Playlist File`,
        UTI: 'public.m3u-playlist',
      });
      return true;
    } catch (err) {
      console.warn('[FileImportService] sharePlaylistM3U failed:', err);
      return false;
    }
  }

  /**
   * Package an entire playlist or set of songs into a standard .zip archive,
   * containing all audio files and an .m3u8 playlist file, then opens the native
   * iOS Share Sheet so the user can Save to Files (all songs at once), AirDrop, or share.
   */
  async sharePlaylistArchive(
    playlistName: string,
    tracks: MobileTrack[],
    onProgress?: (current: number, total: number) => void
  ): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        return false;
      }

      const validTracks = tracks.filter((t) => t.fileUri && !t.fileUri.startsWith('http://') && t.format !== 'stream');
      if (validTracks.length === 0) {
        return false;
      }

      // If only 1 track, share it directly without zipping
      if (validTracks.length === 1) {
        const resolved = await this.resolveLocalFileUri(validTracks[0].fileUri);
        return this.shareOrExportTrack(resolved || validTracks[0].fileUri, validTracks[0].title);
      }

      const safePlaylistName = this.sanitizeFileName(playlistName || 'Overtone_Playlist');
      const zipFileName = `${safePlaylistName}.zip`;
      const zipUri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}${zipFileName}`;

      const filesToZip: { name: string; data: Uint8Array }[] = [];
      const m3u8Lines: string[] = ['#EXTM3U'];

      for (let i = 0; i < validTracks.length; i++) {
        const tr = validTracks[i];
        onProgress?.(i + 1, validTracks.length);
        try {
          const srcUri = await this.resolveLocalFileUri(tr.fileUri);
          if (!srcUri) continue;

          if (srcUri !== tr.fileUri) {
            tr.fileUri = srcUri;
          }

          const ext = (tr.format && tr.format !== 'stream' ? tr.format : srcUri.split('.').pop()?.toLowerCase()) || 'mp3';
          let safeTitle = this.sanitizeFileName(tr.title || `track_${tr.id}`);
          if (safeTitle.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) {
            safeTitle = safeTitle.slice(0, -(ext.length + 1));
          }
          const indexPrefix = String(i + 1).padStart(2, '0');
          const entryName = `${indexPrefix} - ${safeTitle}.${ext}`;

          const b64 = await FileSystem.readAsStringAsync(srcUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const bytes = base64ToUint8(b64);
          filesToZip.push({ name: entryName, data: bytes });

          m3u8Lines.push(`#EXTINF:${Math.round(tr.duration || 0)},${tr.title}`);
          m3u8Lines.push(entryName);
        } catch (e) {
          console.warn('[FileImportService] Error reading track for zip:', tr.title, e);
        }
      }

      if (filesToZip.length === 0) {
        return false;
      }

      // Add .m3u8 playlist file into the ZIP
      const m3u8Text = m3u8Lines.join('\n');
      const textEncoder = new TextEncoder();
      filesToZip.push({
        name: `${safePlaylistName}.m3u8`,
        data: textEncoder.encode(m3u8Text),
      });

      // Generate ZIP Uint8Array
      const zipBytes = createZipUint8(filesToZip);
      const zipB64 = uint8ToBase64(zipBytes);

      await FileSystem.writeAsStringAsync(zipUri, zipB64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(zipUri, {
        mimeType: 'application/zip',
        dialogTitle: `Save or Share "${playlistName}" (${filesToZip.length - 1} songs)`,
        UTI: 'public.zip-archive',
      });

      return true;
    } catch (err) {
      console.warn('[FileImportService] sharePlaylistArchive failed:', err);
      return false;
    }
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9._ -]/g, '_');
  }
}

/** Pure JS fast Base64 to Uint8Array decoder (zero native dependencies). */
function base64ToUint8(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') bufferLength--;
  }

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const enc1 = lookup[base64.charCodeAt(i)];
    const enc2 = lookup[base64.charCodeAt(i + 1)];
    const enc3 = lookup[base64.charCodeAt(i + 2)];
    const enc4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (enc1 << 2) | (enc2 >> 4);
    if (base64[i + 2] !== '=') bytes[p++] = ((enc2 & 15) << 4) | (enc3 >> 2);
    if (base64[i + 3] !== '=') bytes[p++] = ((enc3 & 3) << 6) | enc4;
  }
  return bytes;
}

/** Pure JS fast Uint8Array to Base64 encoder (zero native dependencies). */
function uint8ToBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;
    base64 += chars[b0 >> 2];
    base64 += chars[((b0 & 3) << 4) | (b1 >> 4)];
    base64 += i + 1 < len ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    base64 += i + 2 < len ? chars[b2 & 63] : '=';
  }
  return base64;
}

/** Pure JS standard uncompressed (Store) ZIP archive generator. */
function createZipUint8(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c >>> 0;
  }
  function calcCrc32(arr: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < arr.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ arr[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  const textEncoder = new TextEncoder();
  const fileEntries: Array<{
    nameBytes: Uint8Array;
    dataBytes: Uint8Array;
    crc: number;
    localSize: number;
    centralSize: number;
    offset: number;
  }> = [];

  let totalLocalSize = 0;
  let totalCentralSize = 0;

  for (const f of files) {
    const nameBytes = textEncoder.encode(f.name);
    const dataBytes = f.data;
    const crc = calcCrc32(dataBytes);
    const localHeaderSize = 30 + nameBytes.length;
    const localSize = localHeaderSize + dataBytes.length;
    const centralSize = 46 + nameBytes.length;

    fileEntries.push({
      nameBytes,
      dataBytes,
      crc,
      localSize,
      centralSize,
      offset: totalLocalSize,
    });

    totalLocalSize += localSize;
    totalCentralSize += centralSize;
  }

  const totalSize = totalLocalSize + totalCentralSize + 22;
  const out = new Uint8Array(totalSize);
  const view = new DataView(out.buffer);

  let pos = 0;

  // 1. Write Local Headers + Data
  for (const entry of fileEntries) {
    view.setUint32(pos, 0x04034b50, true); // signature
    view.setUint16(pos + 4, 10, true);     // version needed
    view.setUint16(pos + 6, 0, true);      // flags
    view.setUint16(pos + 8, 0, true);      // store
    view.setUint16(pos + 10, 0, true);     // time
    view.setUint16(pos + 12, 0, true);     // date
    view.setUint32(pos + 14, entry.crc, true);
    view.setUint32(pos + 18, entry.dataBytes.length, true); // compressed
    view.setUint32(pos + 22, entry.dataBytes.length, true); // uncompressed
    view.setUint16(pos + 26, entry.nameBytes.length, true);
    view.setUint16(pos + 28, 0, true);     // extra len
    pos += 30;

    out.set(entry.nameBytes, pos);
    pos += entry.nameBytes.length;

    out.set(entry.dataBytes, pos);
    pos += entry.dataBytes.length;
  }

  const centralOffset = pos;

  // 2. Write Central Directory
  for (const entry of fileEntries) {
    view.setUint32(pos, 0x02014b50, true); // signature
    view.setUint16(pos + 4, 20, true);     // version made by
    view.setUint16(pos + 6, 10, true);     // version needed
    view.setUint16(pos + 8, 0, true);      // flags
    view.setUint16(pos + 10, 0, true);     // store
    view.setUint16(pos + 12, 0, true);     // time
    view.setUint16(pos + 14, 0, true);     // date
    view.setUint32(pos + 16, entry.crc, true);
    view.setUint32(pos + 20, entry.dataBytes.length, true);
    view.setUint32(pos + 24, entry.dataBytes.length, true);
    view.setUint16(pos + 28, entry.nameBytes.length, true);
    view.setUint16(pos + 30, 0, true);     // extra len
    view.setUint16(pos + 32, 0, true);     // comment len
    view.setUint16(pos + 34, 0, true);     // disk start
    view.setUint16(pos + 36, 0, true);     // internal attr
    view.setUint32(pos + 38, 0, true);     // external attr
    view.setUint32(pos + 42, entry.offset, true); // local header offset
    pos += 46;

    out.set(entry.nameBytes, pos);
    pos += entry.nameBytes.length;
  }

  // 3. End of Central Directory
  view.setUint32(pos, 0x06054b50, true);
  view.setUint16(pos + 4, 0, true); // disk num
  view.setUint16(pos + 6, 0, true); // start disk
  view.setUint16(pos + 8, files.length, true);
  view.setUint16(pos + 10, files.length, true);
  view.setUint32(pos + 12, totalCentralSize, true);
  view.setUint32(pos + 16, centralOffset, true);
  view.setUint16(pos + 20, 0, true); // comment len

  return out;
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
