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
  | 'LibraryCare';
