export {};

declare global {
  interface Window {
    api?: {
      scanFolder: () => Promise<string[]>;
      getTracks: () => Promise<any[]>;
      getAlbums: () => Promise<any[]>;
      getArtists: () => Promise<any[]>;
      
      // Playlists
      getPlaylists: () => Promise<any[]>;
      getPlaylistTracks: (playlistId: number) => Promise<any[]>;
      createPlaylist: (name: string) => Promise<any>;
      renamePlaylist: (id: number, name: string) => Promise<boolean>;
      deletePlaylist: (id: number) => Promise<boolean>;
      addTrackToPlaylist: (playlistId: number, trackId: number) => Promise<boolean>;
      removeTrackFromPlaylist: (playlistId: number, trackId: number) => Promise<boolean>;
      exportPlaylistM3U: (playlistId: number) => Promise<boolean>;
      importPlaylistM3U: () => Promise<any | null>;

      // Favorites
      getFavorites: () => Promise<number[]>;
      toggleFavorite: (trackId: number) => Promise<boolean>;

      onLibraryUpdated: (callback: () => void) => () => void;
    };
  }
}

