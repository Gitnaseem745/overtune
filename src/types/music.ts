export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
  track_number?: number | null;
  genre?: string | null;
  path: string;
  file_hash?: string;
  cover_art?: string | null;
}

export interface LyricLine {
  time: number;  // seconds (-1 for unsynced lines)
  text: string;
}

export interface LyricsData {
  lines: LyricLine[];
  isSynced: boolean;
  source: 'lrc' | 'txt' | 'embedded' | 'none';
  offset: number; // ms offset stored in DB
}

export interface Album {
  id: number;
  title: string;
  artist: string;
  year?: number | null;
  cover_art?: string | null;
  track_count: number;
}

export interface Artist {
  id: number;
  name: string;
  album_count: number;
  track_count: number;
}

export interface Playlist {
  id: number;
  name: string;
  created_at: string;
  is_pinned: boolean;
  track_count?: number;
  cover_art?: string | null;
}

export interface WatchedFolder {
  id: number;
  path: string;
  last_scan_at: string | null;
  track_count: number;
  status: 'idle' | 'scanning' | 'error';
}

export interface ScanError {
  id: number;
  folder_id: number | null;
  file_path: string;
  error_message: string;
  created_at: string;
}

export interface DuplicateGroup {
  file_hash: string;
  count: number;
  tracks: Track[];
}

export interface MissingFile {
  id: number;
  title: string;
  artist: string;
  album: string;
  path: string;
}

export interface HealthReport {
  totalTracks: number;
  totalAlbums: number;
  totalArtists: number;
  missingTitle: number;
  missingArtist: number;
  zeroDuration: number;
  missingGenre: number;
  duplicateCount: number;
  albumsMissingArt: number;
  zeroDurationTracks: Array<{ id: number; title: string; path: string }>;
  albumsMissingArtList: Array<{ id: number; title: string; artist: string }>;
}

export interface ScanDashboard {
  folders: WatchedFolder[];
  totalTracks: number;
  recentErrors: ScanError[];
}

export interface TrackMetadataUpdate {
  title?: string;
  artist?: string;
  album?: string;
  track_number?: number | null;
  genre?: string | null;
  year?: number | null;
}

export interface PlayHistoryEntry extends Track {
  history_id: number;
  played_at: string;
  duration_played: number;
}

export interface SmartPlaylistRule {
  field: 'genre' | 'artist' | 'album' | 'year' | 'rating' | 'min_rating' | 'min_plays' | 'unplayed' | 'tag';
  operator: 'contains' | 'equals' | 'gte' | 'lte' | 'is';
  value: string | number;
}

export interface SmartPlaylist {
  id: number;
  name: string;
  rules: SmartPlaylistRule[];
  created_at: string;
}

export interface PlaybackState {
  trackId: number | null;
  currentTime: number;
  queueIds: number[];
  resumePreference: 'always' | 'ask' | 'off';
}

export interface ShortcutMap {
  playPause: string;
  nextTrack: string;
  prevTrack: string;
  volumeUp: string;
  volumeDown: string;
  toggleLyrics: string;
  toggleMiniplayer: string;
}

export interface DiagnosticBundle {
  generatedAt: string;
  app: {
    name: string;
    version: string;
    electronVersion: string;
    nodeVersion: string;
    chromeVersion: string;
    isPackaged: boolean;
  };
  system: {
    platform: string;
    release: string;
    arch: string;
    totalMemoryMB: number;
    freeMemoryMB: number;
    cpus: number;
  };
  library: {
    tracksCount: number;
    albumsCount: number;
    artistsCount: number;
    playlistsCount: number;
    watchedFoldersCount: number;
  };
  sanitizedErrors: Array<{
    file: string;
    error: string;
    time: string;
  }>;
}

export type ThemeMode = 'light' | 'dark';
export type LayoutMode = 'classic' | 'spotify';
export type AccentColor = 
  | 'orange' 
  | 'green' 
  | 'purple' 
  | 'blue' 
  | 'retro' 
  | 'valentine' 
  | 'pastel' 
  | 'halloween' 
  | 'synthwave' 
  | 'cyberpunk' 
  | 'aqua' 
  | 'cupcake' 
  | 'coffee';
export type RepeatMode = 'off' | 'all' | 'one';
export type ActiveTab = 
  | 'Discover' 
  | 'Songs' 
  | 'Albums' 
  | 'Artists' 
  | 'Local Files' 
  | 'AlbumDetail' 
  | 'ArtistDetail' 
  | 'PlaylistDetail' 
  | 'LikedSongs'
  | 'LibraryCare'
  | 'RecentlyPlayed'
  | 'SmartPlaylists';

// ── 0.2.0 Personal Music Hub Types ──

export interface MigrationStatus {
  currentVersion: number;
  latestVersion: number;
  appliedMigrations: Array<{ version: number; name: string; applied_at: string }>;
  backupAvailable: boolean;
  latestBackupPath: string | null;
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

export interface PairedDevice {
  id: string;
  name: string;
  ip: string;
  paired_at: string;
  last_seen_at: string;
}

export interface PendingSharedPlaylist {
  id: string;
  fromDeviceName: string;
  playlistName: string;
  trackCount: number;
  tracks: Array<{
    title: string;
    artist: string;
    album: string;
    duration: number;
    genre?: string;
  }>;
  receivedAt: string;
}

export interface DeviceSyncStatus {
  enabled: boolean;
  deviceName: string;
  localIp: string;
  port: number;
  activePairingPin: string | null;
  pinExpiresInSeconds: number;
  pairedDevices: PairedDevice[];
  pendingPlaylists: PendingSharedPlaylist[];
}

export interface AppInfo {
  name: string;
  version: string;
  electron: string;
  node: string;
  chrome: string;
  platform: string;
  arch: string;
}
