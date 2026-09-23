import { 
  Track, Album, Artist, Playlist, LyricsData,
  WatchedFolder, ScanError, DuplicateGroup, MissingFile, HealthReport, ScanDashboard, TrackMetadataUpdate,
  PlayHistoryEntry, SmartPlaylistRule, SmartPlaylist, PlaybackState
} from './music';

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
      reorderPlaylistTracks: (playlistId: number, trackIds: number[]) => Promise<boolean>;
      exportPlaylistM3U: (playlistId: number) => Promise<boolean>;
      importPlaylistM3U: () => Promise<Playlist | null>;
      importDirectoryPlaylists: (folderPath?: string) => Promise<{
        success: boolean;
        playlistsCreated: number;
        tracksImported: number;
        playlists: Array<{ name: string; trackCount: number }>;
      }>;

      // Favorites & Metadata
      getFavorites: () => Promise<number[]>;
      toggleFavorite: (trackId: number) => Promise<boolean>;
      updateTrackDuration: (trackId: number, duration: number) => Promise<boolean>;

      // Lyrics
      getLyricsForTrack: (trackPath: string, trackId: number) => Promise<LyricsData>;
      getLyricOffset: (trackId: number) => Promise<number>;
      setLyricOffset: (trackId: number, offsetMs: number) => Promise<boolean>;

      // Library Care & Metadata
      getWatchedFolders: () => Promise<WatchedFolder[]>;
      addWatchedFolder: (folderPath: string) => Promise<boolean>;
      removeWatchedFolder: (folderId: number) => Promise<boolean>;
      getScanErrors: (folderId?: number) => Promise<ScanError[]>;
      clearScanErrors: (folderId?: number) => Promise<boolean>;
      rescanFolder: (folderPath: string) => Promise<{ tracksFound: number }>;
      removeFolderFromLibrary: (folderPath: string) => Promise<{ tracksRemoved: number }>;
      getTrackDetails: (trackId: number) => Promise<Track & { artist_id: number; album_id: number; year?: number | null } | undefined>;
      updateTrackMetadata: (trackId: number, fields: TrackMetadataUpdate, writeToFile?: boolean) => Promise<{
        success: boolean;
        catalogUpdated: boolean;
        fileUpdated: boolean;
        error?: string;
      }>;
      findDuplicates: () => Promise<DuplicateGroup[]>;
      findMissingFiles: () => Promise<MissingFile[]>;
      relinkTrackDialog: (trackId: number) => Promise<{ success: boolean; newPath?: string }>;
      relinkTrack: (trackId: number, newPath: string) => Promise<{ success: boolean; error?: string }>;
      replaceAlbumArtwork: (albumId: number, writeToFile?: boolean) => Promise<{ success: boolean; newPath?: string; error?: string }>;
      removeTrackFromLibrary: (trackId: number) => Promise<boolean>;
      revealInExplorer: (filePath: string) => Promise<boolean>;
      getLibraryHealthReport: () => Promise<HealthReport>;
      getScanDashboard: () => Promise<ScanDashboard>;

      // Personal Discovery, Ratings, Tags, Smart Playlists & Settings
      recordPlayEvent: (trackId: number, durationPlayed?: number) => Promise<boolean>;
      getPlayHistory: (limit?: number) => Promise<PlayHistoryEntry[]>;
      getPlayCounts: () => Promise<Record<number, number>>;
      clearPlayHistory: () => Promise<boolean>;
      setPlayHistoryEnabled: (enabled: boolean) => Promise<boolean>;
      isPlayHistoryEnabled: () => Promise<boolean>;
      setTrackRating: (trackId: number, rating: number) => Promise<boolean>;
      getTrackRating: (trackId: number) => Promise<number>;
      getAllTrackRatings: () => Promise<Record<number, number>>;
      addTrackTag: (trackId: number, tag: string) => Promise<boolean>;
      removeTrackTag: (trackId: number, tag: string) => Promise<boolean>;
      getTrackTags: (trackId: number) => Promise<string[]>;
      getAllTrackTagsMap: () => Promise<Record<number, string[]>>;
      createSmartPlaylist: (name: string, rules: SmartPlaylistRule[]) => Promise<SmartPlaylist>;
      getSmartPlaylists: () => Promise<SmartPlaylist[]>;
      updateSmartPlaylist: (id: number, name: string, rules: SmartPlaylistRule[]) => Promise<boolean>;
      deleteSmartPlaylist: (id: number) => Promise<boolean>;
      evaluateSmartPlaylist: (rules: SmartPlaylistRule[]) => Promise<Track[]>;
      getForgottenFavorites: (limit?: number) => Promise<Track[]>;
      getRecentAdditions: (limit?: number) => Promise<Track[]>;
      getMoreFromArtist: (artistId: number, limit?: number) => Promise<Track[]>;
      getSetting: (key: string, defaultValue?: string) => Promise<string>;
      setSetting: (key: string, value: string) => Promise<boolean>;
      savePlaybackState: (state: PlaybackState) => Promise<boolean>;
      getPlaybackState: () => Promise<PlaybackState | null>;

      // Miniplayer
      toggleMiniplayer: () => Promise<boolean>;
      setMiniplayer: (enable: boolean) => Promise<boolean>;
      getMiniplayerState: () => Promise<boolean>;
      onMiniplayerStateChanged: (callback: (isMini: boolean) => void) => () => void;

      // Window Controls
      minimizeWindow: () => Promise<boolean>;
      maximizeWindow: () => Promise<boolean>;
      closeWindow: () => Promise<boolean>;
      isMaximized: () => Promise<boolean>;

      onLibraryUpdated: (callback: () => void) => () => void;
    };
  }
}
