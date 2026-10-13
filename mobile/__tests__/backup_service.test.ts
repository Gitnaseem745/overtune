/**
 * Backup Service Tests
 *
 * Validates JSON backup creation structure, preview parsing,
 * invalid file detection, and non-destructive restore matching.
 */

import { describe, it, expect, jest } from '@jest/globals';
import { BackupService, type BackupPayload } from '../src/services/backup/BackupService';

import * as FileSystem from 'expo-file-system/legacy';

describe('BackupService', () => {
  const validBackup: BackupPayload = {
    version: 1,
    app: 'Overtone',
    createdAt: '2026-10-15T12:00:00.000Z',
    playlists: [
      {
        name: 'Chill Vibes',
        source: 'local',
        tracks: [
          { title: 'Sunset Lover', artist: 'Petit Biscuit', duration: 237 },
          { title: 'Intro', artist: 'The xx', duration: 128 },
        ],
      },
    ],
    favoriteTrackIds: [1, 2],
    favoriteTrackTitles: [
      { title: 'Sunset Lover', artist: 'Petit Biscuit' },
    ],
    settings: {
      gapless: 'true',
      resumeOnLaunch: 'true',
      userName: 'MusicLover',
    },
    stats: {
      playlistCount: 1,
      favoriteCount: 1,
      trackCount: 10,
    },
  };

  it('correctly validates and parses a valid Overtone backup JSON', async () => {
    (FileSystem.readAsStringAsync as any).mockResolvedValueOnce(
      JSON.stringify(validBackup)
    );

    const result = await BackupService.previewBackup('file:///backups/valid.json');
    expect(result.valid).toBe(true);
    expect(result.summary).toBeDefined();
    expect(result.summary?.playlistCount).toBe(1);
    expect(result.summary?.playlistNames).toContain('Chill Vibes');
    expect(result.summary?.favoriteCount).toBe(1);
  });

  it('rejects an invalid JSON file not created by Overtone', async () => {
    (FileSystem.readAsStringAsync as any).mockResolvedValueOnce(
      JSON.stringify({ someOtherApp: true, data: [] })
    );

    const result = await BackupService.previewBackup('file:///backups/invalid.json');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Not an Overtone backup');
  });

  it('exports local database state into standard backup structure', async () => {
    const mockDb = {
      playlists: {
        getAll: () => [{ id: 1, name: 'Drive Music', source: 'local' }],
        getTracks: () => [{ title: 'Nightcall', artistId: 10, albumId: null, duration: 259 }],
      },
      favorites: {
        getAll: () => [{ id: 1, title: 'Nightcall', artistId: 10 }],
        getIds: () => new Set([1]),
      },
      tracks: {
        getAll: () => [{ id: 1, title: 'Nightcall' }],
      },
      artists: {
        getNameById: () => 'Kavinsky',
      },
      albums: {
        getTitleById: () => null,
      },
      settings: {
        get: (k: string) => (k === 'userName' ? 'KavinskyFan' : ''),
      },
    };

    const res = await BackupService.exportBackup(mockDb);
    expect(res.success).toBe(true);
    expect(res.filePath).toBeDefined();
    expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
  });

  it('safely restores playlists and matches existing local tracks without duplication', async () => {
    (FileSystem.readAsStringAsync as any).mockResolvedValueOnce(
      JSON.stringify(validBackup)
    );

    const createdPlaylists: any[] = [];
    const addedTracks: any[] = [];

    const mockDb = {
      playlists: {
        getAll: () => [],
        create: jest.fn((name: string, source: string) => {
          const id = createdPlaylists.length + 1;
          createdPlaylists.push({ id, name, source });
          return id;
        }),
        addTrack: jest.fn((plId: number, trkId: number) => {
          addedTracks.push({ plId, trkId });
        }),
      },
      favorites: {
        add: jest.fn(),
      },
      tracks: {
        getAll: () => [
          { id: 101, title: 'Sunset Lover' },
          { id: 102, title: 'Intro' },
        ],
      },
      artists: {
        getNameById: () => 'Petit Biscuit',
      },
      settings: {
        set: jest.fn(),
      },
    };

    const res = await BackupService.restoreBackup('file:///backups/valid.json', mockDb);
    expect(res.success).toBe(true);
    expect(res.restoredPlaylists).toBe(1);
    expect(mockDb.playlists.create).toHaveBeenCalledWith('Chill Vibes', 'local');
    expect(mockDb.playlists.addTrack).toHaveBeenCalledWith(1, 101);
  });
});
