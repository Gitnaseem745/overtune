import { Track, Album, Artist, Playlist } from './music';

export {};

declare global {
  interface Window {
    api?: {
      scanFolder: () => Promise<string[]>;
      getTracks: () => Promise<Track[]>;
      getAlbums: () => Promise<Album[]>;
      getArtists: () => Promise<Artist[]>;
      
      // Playlists
      getPlaylists: () => Promise<Playlist[]>;
      getPlaylistTracks: (playlistId: number) => Promise<Track[]>;
      createPlaylist: (name: string) => Promise<Playlist>;
      renamePlaylist: (id: number, name: string) => Promise<boolean>;
      deletePlaylist: (id: number) => Promise<boolean>;
      addTrackToPlaylist: (playlistId: number, trackId: number) => Promise<boolean>;
      removeTrackFromPlaylist: (playlistId: number, trackId: number) => Promise<boolean>;
      exportPlaylistM3U: (playlistId: number) => Promise<boolean>;
      importPlaylistM3U: () => Promise<Playlist | null>;

      // Favorites & Metadata
      getFavorites: () => Promise<number[]>;
      toggleFavorite: (trackId: number) => Promise<boolean>;
      updateTrackDuration: (trackId: number, duration: number) => Promise<boolean>;

      onLibraryUpdated: (callback: () => void) => () => void;
    };
  }
}
