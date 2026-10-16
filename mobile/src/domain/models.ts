/**
 * Overtone iOS — Domain Models
 *
 * Platform-independent types. Does NOT import desktop main-process
 * modules, Electron APIs, or desktop filesystem paths.
 * iOS sandbox URIs are device-local and never synced.
 */

// ── Core Entities ──────────────────────────────────────────────────────

export interface MobileTrack {
  id: number;
  title: string;
  albumId: number | null;
  artistId: number | null;
  /** URI inside app-owned storage (never shared with desktop) */
  fileUri: string;
  duration: number;
  trackNumber: number | null;
  genre: string | null;
  fileHash: string | null;
  /** URI to cached artwork image */
  artworkUri: string | null;
  fileSize: number;
  format: string | null;
  sampleRate: number | null;
  bitRate: number | null;
  channels: number | null;
  importedAt: string;
  lastPlayedAt: string | null;
}

export interface MobileAlbum {
  id: number;
  title: string;
  artistId: number | null;
  artistName: string | null;
  year: number | null;
  artworkUri: string | null;
  trackCount: number;
}

export interface MobileArtist {
  id: number;
  name: string;
  albumCount: number;
  trackCount: number;
}

export interface MobilePlaylist {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  trackCount: number;
  artworkUri: string | null;
  /** Where the playlist came from */
  source: 'local' | 'synced';
  sourceDeviceName: string | null;
}

export interface MobilePlaylistItem {
  playlistId: number;
  trackId: number;
  position: number;
  addedAt: string;
}

export interface MobileFavorite {
  trackId: number;
  createdAt: string;
}

export interface PlayHistoryEntry {
  id: number;
  trackId: number;
  playedAt: string;
  durationPlayed: number;
}

// ── Playback ───────────────────────────────────────────────────────────

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlaybackState {
  currentTrackId: number | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isBuffering: boolean;
  queue: number[];
  queueIndex: number;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
}

export interface PersistedPlaybackState {
  trackId: number | null;
  currentTime: number;
  queueIds: number[];
  queueIndex: number;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
}

// ── Lyrics ─────────────────────────────────────────────────────────────

export interface LyricLine {
  time: number; // seconds, -1 for unsynced
  text: string;
}

export interface LyricsData {
  lines: LyricLine[];
  isSynced: boolean;
  source: 'embedded' | 'lrc' | 'txt' | 'none';
  offset: number; // ms
}

// ── Sync ───────────────────────────────────────────────────────────────

export interface PairedDevice {
  id: string;
  name: string;
  ip: string;
  port: number;
  pairedAt: string;
  lastSeenAt: string;
}

export interface SyncPlaylistTrack {
  desktopTrackId?: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre?: string;
  trackNumber?: number;
  artworkUri?: string;
  fileUri?: string;
}

export interface SyncNowPlayingState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  track: {
    id: number;
    title: string;
    artist: string;
    album: string;
    duration: number;
    coverArt?: string;
  } | null;
  updatedAt: number;
}

export interface SyncTrackPayload {
  desktopTrackId: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre?: string;
  trackNumber?: number;
}

export interface SyncPlaylistPayload {
  playlistName: string;
  tracks: SyncPlaylistTrack[];
}

export interface TrackMatchResult {
  syncTrack: SyncPlaylistTrack;
  localTrackId: number | null;
  confidence: 'exact' | 'fuzzy' | 'unmatched';
  matchReason: string;
}

export interface PlaylistPreview {
  playlistName: string;
  totalTracks: number;
  matchedTracks: number;
  unmatchedTracks: number;
  matches: TrackMatchResult[];
}

export interface DiscoveredDevice {
  name: string;
  host: string;
  port: number;
  app?: string;
}

export type SyncConnectionStatus =
  | 'disconnected'
  | 'discovering'
  | 'connecting'
  | 'pairing'
  | 'paired'
  | 'syncing'
  | 'error';

// ── File Import ────────────────────────────────────────────────────────

export interface ImportResult {
  totalSelected: number;
  imported: number;
  failed: number;
  duplicates: number;
  errors: ImportError[];
}

export interface ImportError {
  fileName: string;
  reason: string;
}

export type ImportStatus = 'idle' | 'copying' | 'extracting' | 'saving' | 'complete' | 'error';

// ── Search ─────────────────────────────────────────────────────────────

export interface SearchResults {
  tracks: MobileTrack[];
  albums: MobileAlbum[];
  artists: MobileArtist[];
  playlists: MobilePlaylist[];
}

// ── Settings ───────────────────────────────────────────────────────────

export type AppearanceMode = 'system' | 'dark' | 'light';

export interface AppSettings {
  appearance: AppearanceMode;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  gaplessPlayback: boolean;
  resumeOnLaunch: boolean;
}
