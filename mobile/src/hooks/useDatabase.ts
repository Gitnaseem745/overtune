/**
 * Overtone iOS — Database Hook
 *
 * Initializes SQLite, runs migrations, and provides repository instances.
 */

import { useMemo, useEffect, useState } from 'react';
import { openDatabaseSync } from 'expo-sqlite';
import { runMigrations } from '../db/migrations/001_initial';
import {
  TrackRepository,
  AlbumRepository,
  ArtistRepository,
  PlaylistRepository,
  FavoritesRepository,
  PlayHistoryRepository,
  PlaybackStateRepository,
  PairedDeviceRepository,
  SettingsRepository,
  SearchRepository,
  LyricOffsetRepository,
} from '../db/repositories';

export interface DatabaseContext {
  tracks: TrackRepository;
  albums: AlbumRepository;
  artists: ArtistRepository;
  playlists: PlaylistRepository;
  favorites: FavoritesRepository;
  playHistory: PlayHistoryRepository;
  playbackState: PlaybackStateRepository;
  pairedDevices: PairedDeviceRepository;
  settings: SettingsRepository;
  search: SearchRepository;
  lyricOffsets: LyricOffsetRepository;
  isReady: boolean;
}

let dbInstance: any = null;
let repos: Omit<DatabaseContext, 'isReady'> | null = null;

export function getDatabaseRepos(): Omit<DatabaseContext, 'isReady'> | null {
  return repos;
}

/**
 * Background auto-healer: finds any existing tracks in SQLite that have duration <= 0,
 * inspects their audio headers or file sizes, and writes the real duration to SQLite.
 */
async function healMissingTrackDurations(trackRepo: TrackRepository): Promise<void> {
  try {
    const tracks = trackRepo.getAll();
    const missing = tracks.filter((t) => !t.duration || t.duration <= 0);
    if (missing.length === 0) return;

    const { parseAudioHeaderDuration, probeAudioDuration } = await import(
      '../services/metadata/MetadataExtractor'
    );

    for (const track of missing) {
      if (!track.fileUri) continue;
      try {
        let dur = 0;
        const ext = track.format || track.fileUri.split('.').pop() || 'mp3';
        dur = await parseAudioHeaderDuration(track.fileUri, track.fileSize || 0, ext);
        if (!dur || dur <= 0) {
          dur = await probeAudioDuration(track.fileUri);
        }
        if (dur > 0) {
          trackRepo.updateDuration(track.id, dur);
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[DB] Failed to heal track durations:', err);
  }
}

export function useDatabase(): DatabaseContext {
  const [isReady, setIsReady] = useState(!!dbInstance);

  useEffect(() => {
    if (dbInstance) return;

    try {
      dbInstance = openDatabaseSync('overtone.db');
      runMigrations(dbInstance);

      repos = {
        tracks: new TrackRepository(dbInstance),
        albums: new AlbumRepository(dbInstance),
        artists: new ArtistRepository(dbInstance),
        playlists: new PlaylistRepository(dbInstance),
        favorites: new FavoritesRepository(dbInstance),
        playHistory: new PlayHistoryRepository(dbInstance),
        playbackState: new PlaybackStateRepository(dbInstance),
        pairedDevices: new PairedDeviceRepository(dbInstance),
        settings: new SettingsRepository(dbInstance),
        search: new SearchRepository(dbInstance),
        lyricOffsets: new LyricOffsetRepository(dbInstance),
      };

      setIsReady(true);
      console.log('[DB] Database initialized successfully');

      // Heal any existing tracks with duration = 0
      healMissingTrackDurations(repos.tracks);
    } catch (error) {
      console.error('[DB] Failed to initialize database:', error);
    }
  }, []);

  return {
    ...(repos || {
      tracks: null as any,
      albums: null as any,
      artists: null as any,
      playlists: null as any,
      favorites: null as any,
      playHistory: null as any,
      playbackState: null as any,
      pairedDevices: null as any,
      settings: null as any,
      search: null as any,
      lyricOffsets: null as any,
    }),
    isReady,
  };
}
