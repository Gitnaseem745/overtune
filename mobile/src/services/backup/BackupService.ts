/**
 * Overtone iOS — Backup & Restore Service
 *
 * Local-first, non-destructive library backup and restore.
 * Dumps playlists, favorites, track metadata, and settings to a versioned
 * JSON file and safely restores them without touching or overwriting audio files.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { Share } from 'react-native';

export interface BackupPayload {
  version: number;
  app: 'Overtone';
  createdAt: string;
  playlists: Array<{
    name: string;
    source: string;
    tracks: Array<{
      title: string;
      artist?: string;
      album?: string;
      duration?: number;
    }>;
  }>;
  favoriteTrackIds: number[];
  favoriteTrackTitles: Array<{ title: string; artist?: string }>;
  settings: Record<string, string>;
  stats: {
    playlistCount: number;
    favoriteCount: number;
    trackCount: number;
  };
}

export interface BackupPreviewSummary {
  createdAt: string;
  playlistCount: number;
  favoriteCount: number;
  trackCount: number;
  playlistNames: string[];
}

class BackupServiceImpl {
  private BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;

  private async ensureDir(): Promise<void> {
    const info = await FileSystem.getInfoAsync(this.BACKUP_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(this.BACKUP_DIR, { intermediates: true });
    }
  }

  /**
   * Export local library data (playlists, favorites, settings) to a JSON file.
   */
  async exportBackup(db: any): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      await this.ensureDir();

      const allPlaylists = db.playlists?.getAll() || [];
      const allFavorites = db.favorites?.getAll() || [];
      const allTracks = db.tracks?.getAll() || [];

      const playlistsData = allPlaylists.map((pl: any) => {
        const trs = db.playlists.getTracks(pl.id);
        return {
          name: pl.name,
          source: pl.source,
          tracks: trs.map((t: any) => ({
            title: t.title,
            artist: t.artistId ? db.artists.getNameById(t.artistId) : undefined,
            album: t.albumId ? db.albums.getTitleById(t.albumId) : undefined,
            duration: t.duration,
          })),
        };
      });

      const favoriteTitles = allFavorites.map((f: any) => ({
        title: f.title,
        artist: f.artistId ? db.artists.getNameById(f.artistId) : undefined,
      }));

      const settingsKeys = ['gapless', 'resumeOnLaunch', 'userName'];
      const settingsMap: Record<string, string> = {};
      for (const k of settingsKeys) {
        settingsMap[k] = db.settings?.get(k, '') || '';
      }

      const backup: BackupPayload = {
        version: 1,
        app: 'Overtone',
        createdAt: new Date().toISOString(),
        playlists: playlistsData,
        favoriteTrackIds: Array.from(db.favorites?.getIds() || []),
        favoriteTrackTitles: favoriteTitles,
        settings: settingsMap,
        stats: {
          playlistCount: playlistsData.length,
          favoriteCount: allFavorites.length,
          trackCount: allTracks.length,
        },
      };

      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `overtone_backup_${dateStr}_${Date.now().toString().slice(-4)}.json`;
      const filePath = `${this.BACKUP_DIR}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backup, null, 2));

      return { success: true, filePath };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create backup' };
    }
  }

  /**
   * Share exported backup file via native iOS share sheet.
   */
  async shareBackup(filePath: string): Promise<void> {
    try {
      await Share.share({
        url: filePath,
        message: 'Overtone Music Player Library Backup',
      });
    } catch {}
  }

  /**
   * Let user pick a backup JSON file from iOS Files document picker.
   */
  async pickBackupFile(): Promise<{ uri?: string; name?: string; canceled: boolean }> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/json', 'public.json'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { canceled: true };
    }

    const asset = result.assets[0];
    return { uri: asset.uri, name: asset.name, canceled: false };
  }

  /**
   * Read and validate backup file, returning preview summary.
   */
  async previewBackup(fileUri: string): Promise<{ valid: boolean; summary?: BackupPreviewSummary; error?: string }> {
    try {
      const content = await FileSystem.readAsStringAsync(fileUri);
      const data: BackupPayload = JSON.parse(content);

      if (data.app !== 'Overtone' || !Array.isArray(data.playlists)) {
        return { valid: false, error: 'Invalid file: Not an Overtone backup JSON.' };
      }

      const summary: BackupPreviewSummary = {
        createdAt: data.createdAt,
        playlistCount: data.playlists.length,
        favoriteCount: data.favoriteTrackTitles?.length || data.favoriteTrackIds?.length || 0,
        trackCount: data.stats?.trackCount || 0,
        playlistNames: data.playlists.map((p) => p.name),
      };

      return { valid: true, summary };
    } catch (err: any) {
      return { valid: false, error: 'Failed to read or parse backup file.' };
    }
  }

  /**
   * Restore playlists and favorites from backup.
   * Matches tracks against current local library non-destructively.
   */
  async restoreBackup(
    fileUri: string,
    db: any
  ): Promise<{ success: boolean; restoredPlaylists: number; restoredFavorites: number; error?: string }> {
    try {
      const content = await FileSystem.readAsStringAsync(fileUri);
      const data: BackupPayload = JSON.parse(content);

      if (data.app !== 'Overtone' || !Array.isArray(data.playlists)) {
        return { success: false, restoredPlaylists: 0, restoredFavorites: 0, error: 'Invalid backup file' };
      }

      const localTracks = db.tracks?.getAll() || [];
      let restoredPlaylists = 0;
      let restoredFavorites = 0;

      // 1. Restore playlists
      for (const pl of data.playlists) {
        const source = pl.source || 'local';
        const playlistId = db.playlists.create(pl.name, source);
        restoredPlaylists++;

        for (const pt of pl.tracks || []) {
          // Find matching local track by title and optional artist
          const match = localTracks.find((lt: any) => {
            const sameTitle = lt.title.toLowerCase().trim() === pt.title.toLowerCase().trim();
            if (!sameTitle) return false;
            if (pt.artist && lt.artistId) {
              const artistName = db.artists.getNameById(lt.artistId);
              return artistName.toLowerCase().includes(pt.artist.toLowerCase());
            }
            return true;
          });

          if (match) {
            db.playlists.addTrack(playlistId, match.id);
          }
        }
      }

      // 2. Restore favorites
      for (const fav of data.favoriteTrackTitles || []) {
        const match = localTracks.find(
          (lt: any) => lt.title.toLowerCase().trim() === fav.title.toLowerCase().trim()
        );
        if (match) {
          if (typeof db.favorites?.isFavorite === 'function') {
            if (!db.favorites.isFavorite(match.id)) {
              db.favorites.toggle(match.id);
              restoredFavorites++;
            }
          } else if (typeof db.favorites?.add === 'function') {
            db.favorites.add(match.id);
            restoredFavorites++;
          }
        }
      }

      // 3. Restore settings
      if (data.settings) {
        for (const [k, v] of Object.entries(data.settings)) {
          if (v) db.settings?.set(k, v);
        }
      }

      return { success: true, restoredPlaylists, restoredFavorites };
    } catch (err: any) {
      return { success: false, restoredPlaylists: 0, restoredFavorites: 0, error: err?.message || 'Restore failed' };
    }
  }
}

export const BackupService = new BackupServiceImpl();
