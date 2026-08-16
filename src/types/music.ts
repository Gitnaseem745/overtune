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

export type ThemeMode = 'light' | 'dark';
export type LayoutMode = 'classic' | 'spotify';
export type AccentColor = 'orange' | 'green' | 'purple' | 'blue';
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
  | 'LikedSongs';
