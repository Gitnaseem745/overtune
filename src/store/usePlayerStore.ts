import { create } from 'zustand';
import { 
  Track, Album, Artist, Playlist, LyricsData, ThemeMode, LayoutMode, AccentColor, RepeatMode, ActiveTab,
  WatchedFolder, ScanError, DuplicateGroup, MissingFile, HealthReport, TrackMetadataUpdate,
  PlayHistoryEntry, SmartPlaylistRule, SmartPlaylist,
  ShortcutMap, DiagnosticBundle,
  MigrationStatus, BackupPreview, RestoreResult, RelocateResult, DeviceSyncStatus, AppInfo
} from '../types/music';

interface PlayerState {
  // ── Appearance & UI Preferences ──
  theme: ThemeMode;
  layout: LayoutMode;
  accentColor: AccentColor;
  activeTab: ActiveTab;
  tabHistory: ActiveTab[];
  tabHistoryIndex: number;
  searchQuery: string;
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  isRightPanelOpen: boolean;
  isSettingsOpen: boolean;
  isCreatePlaylistOpen: boolean;
  isMiniplayer: boolean;
  isLyricsPanelOpen: boolean;

  // ── Lyrics ──
  lyrics: LyricsData | null;
  lyricOffset: number;

  // ── Library Care ──
  libraryCareTab: 'scan' | 'metadata' | 'artwork' | 'duplicates' | 'missing' | 'health';
  watchedFolders: WatchedFolder[];
  scanErrors: ScanError[];
  duplicateGroups: DuplicateGroup[];
  missingFiles: MissingFile[];
  healthReport: HealthReport | null;
  isLibraryCareLoading: boolean;

  // ── Personal Discovery, Ratings & Smart Playlists ──
  playHistory: PlayHistoryEntry[];
  playCounts: Record<number, number>;
  isPlayHistoryEnabled: boolean;
  trackRatings: Record<number, number>;
  trackTags: Record<number, string[]>;
  smartPlaylists: SmartPlaylist[];
  selectedSmartPlaylist: SmartPlaylist | null;
  smartPlaylistTracks: Track[];
  forgottenFavorites: Track[];
  recentAdditions: Track[];
  resumePreference: 'always' | 'ask' | 'off';

  // ── Desktop Polish Preferences ──
  shortcuts: ShortcutMap;
  minimizeToTray: boolean;
  notificationsEnabled: boolean;
  focusMode: boolean;
  reducedMotion: boolean;
  textScale: 'small' | 'normal' | 'large';
  diagnosticBundle: DiagnosticBundle | null;

  // ── 0.2.0 Personal Music Hub State ──
  migrationStatus: MigrationStatus | null;
  backupPreview: BackupPreview | null;
  selectedBackupPath: string | null;
  restoreResult: RestoreResult | null;
  syncStatus: DeviceSyncStatus | null;
  appInfo: AppInfo | null;
  isFullscreenPlayerOpen: boolean;
  fullscreenMode: 'artwork' | 'lyrics';

  // ── Library Data ──
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  selectedPlaylist: Playlist | null;
  playlistTracks: Track[];
  favorites: Set<number>;
  selectedAlbum: Album | null;
  selectedArtist: Artist | null;

  // ── Audio Playback State ──
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffleOn: boolean;
  repeatMode: RepeatMode;
  audioError: string | null;

  // ── Queue Management ──
  queue: Track[];
  queueIndex: number;

  // ── Actions ──
  setTheme: (theme: ThemeMode) => void;
  setLayout: (layout: LayoutMode) => void;
  setAccentColor: (accent: AccentColor) => void;
  setActiveTab: (tab: ActiveTab) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleSettings: () => void;
  setSettingsOpen: (open: boolean) => void;
  setCreatePlaylistOpen: (open: boolean) => void;
  toggleMiniplayer: () => void;
  setMiniplayer: (mini: boolean) => void;
  toggleLyricsPanel: () => void;
  setLyricsPanelOpen: (open: boolean) => void;
  toggleFullscreenPlayer: () => void;
  setFullscreenPlayerOpen: (open: boolean) => void;
  setFullscreenMode: (mode: 'artwork' | 'lyrics') => void;
  ignoreDuplicate: (trackIds: number[]) => Promise<void>;
  fetchLyrics: (trackPath: string, trackId: number) => Promise<void>;
  adjustLyricOffset: (trackId: number, deltaMs: number) => Promise<void>;
  resetLyricOffset: (trackId: number) => Promise<void>;

  setTracks: (tracks: Track[]) => void;
  setAlbums: (albums: Album[]) => void;
  setArtists: (artists: Artist[]) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  toggleFavorite: (trackId: number) => Promise<void>;
  updateTrackDurationInStore: (trackId: number, duration: number) => void;
  selectAlbum: (album: Album | null) => void;
  selectArtist: (artist: Artist | null) => void;
  selectPlaylist: (playlist: Playlist | null) => Promise<void>;

  // Playlist Actions
  createPlaylist: (name: string) => Promise<Playlist | null>;
  renamePlaylist: (id: number, name: string) => Promise<void>;
  deletePlaylist: (id: number) => Promise<void>;
  addTrackToPlaylist: (playlistId: number, trackId: number) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: number, trackId: number) => Promise<void>;
  reorderPlaylistTracks: (playlistId: number, trackIds: number[]) => Promise<void>;
  exportPlaylistM3U: (playlistId: number) => Promise<boolean>;
  importPlaylistM3U: () => Promise<void>;
  importDirectoryPlaylists: (folderPath?: string) => Promise<{ success: boolean; playlistsCreated: number; tracksImported: number } | null>;

  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (isMuted: boolean) => void;
  setShuffleOn: (shuffle: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  cycleRepeatMode: () => void;
  setAudioError: (error: string | null) => void;

  // Queue actions
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;

  // High-level Playback Triggers
  playTrack: (track: Track, contextQueue?: Track[]) => void;
  handleNext: () => void;
  handlePrev: () => void;
  refreshLibrary: () => Promise<void>;

  // Library Care Actions
  setLibraryCareTab: (tab: 'scan' | 'metadata' | 'artwork' | 'duplicates' | 'missing' | 'health') => void;
  loadLibraryCareData: () => Promise<void>;
  rescanWatchedFolder: (folderPath: string) => Promise<void>;
  removeWatchedFolder: (folderPath: string) => Promise<void>;
  clearScanErrors: (folderId?: number) => Promise<void>;
  fetchDuplicates: () => Promise<void>;
  fetchMissingFiles: () => Promise<void>;
  fetchHealthReport: () => Promise<void>;
  relinkMissingTrack: (trackId: number) => Promise<{ success: boolean; newPath?: string }>;
  removeTrackFromLibrary: (trackId: number) => Promise<void>;
  saveTrackMetadata: (trackId: number, fields: TrackMetadataUpdate, writeToFile?: boolean) => Promise<{
    success: boolean;
    catalogUpdated: boolean;
    fileUpdated: boolean;
    error?: string;
  }>;
  replaceAlbumArtwork: (albumId: number, writeToFile?: boolean) => Promise<{
    success: boolean;
    newPath?: string;
    error?: string;
  }>;

  // ── Discovery & Smart Playlist Actions ──
  recordPlayEvent: (trackId: number, durationPlayed?: number) => Promise<void>;
  loadPlayHistory: () => Promise<void>;
  clearPlayHistory: () => Promise<void>;
  setPlayHistoryEnabled: (enabled: boolean) => Promise<void>;
  setTrackRating: (trackId: number, rating: number) => Promise<void>;
  addTrackTag: (trackId: number, tag: string) => Promise<void>;
  removeTrackTag: (trackId: number, tag: string) => Promise<void>;
  loadRatingsAndTags: () => Promise<void>;
  loadSmartPlaylists: () => Promise<void>;
  createSmartPlaylist: (name: string, rules: SmartPlaylistRule[]) => Promise<SmartPlaylist | null>;
  updateSmartPlaylist: (id: number, name: string, rules: SmartPlaylistRule[]) => Promise<boolean>;
  deleteSmartPlaylist: (id: number) => Promise<boolean>;
  selectSmartPlaylist: (playlist: SmartPlaylist | null) => Promise<void>;
  loadMixes: () => Promise<void>;
  saveQueueAsPlaylist: (name?: string) => Promise<Playlist | null>;
  savePlaybackState: () => Promise<void>;
  restorePlaybackState: () => Promise<void>;
  setResumePreference: (pref: 'always' | 'ask' | 'off') => Promise<void>;

  // ── Desktop Polish Actions ──
  loadDesktopSettings: () => Promise<void>;
  setShortcuts: (shortcuts: ShortcutMap) => Promise<{ success: boolean; conflicts?: string[] }>;
  resetShortcuts: () => Promise<void>;
  setMinimizeToTray: (enabled: boolean) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setFocusMode: (enabled: boolean) => Promise<void>;
  setReducedMotion: (enabled: boolean) => void;
  setTextScale: (scale: 'small' | 'normal' | 'large') => void;
  loadDiagnosticReport: () => Promise<void>;
  exportDiagnostics: () => Promise<boolean>;

  // ── 0.2.0 Personal Music Hub Actions ──
  loadMigrationStatus: () => Promise<void>;
  triggerMigrations: () => Promise<void>;
  exportLibraryBackup: () => Promise<{ success: boolean; filePath?: string }>;
  selectBackupFile: () => Promise<void>;
  executeRestore: (mode: 'skip' | 'overwrite' | 'merge', restoreSettings: boolean) => Promise<boolean>;
  relocatePaths: (oldPrefix: string, newPrefix: string) => Promise<RelocateResult | null>;
  loadSyncStatus: () => Promise<void>;
  toggleDeviceSync: (enabled: boolean) => Promise<void>;
  generateSyncPin: () => Promise<{ pin: string; expiresInSeconds: number } | null>;
  pairWithPeerDevice: (ip: string, pin: string) => Promise<{ success: boolean; hostDeviceName?: string; error?: string }>;
  sendPlaylistToPeerDevice: (deviceId: string, playlistId: number) => Promise<{ success: boolean; error?: string }>;
  acceptSharedPlaylist: (pendingId: string) => Promise<boolean>;
  declineSharedPlaylist: (pendingId: string) => Promise<boolean>;
  revokeDevice: (deviceId: string) => Promise<boolean>;
  loadAppInfo: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Defaults - Light theme & Classic layout as requested by default
  theme: (typeof window !== 'undefined' && (localStorage.getItem('overtone_theme') as ThemeMode)) || 'light',
  layout: (typeof window !== 'undefined' && (localStorage.getItem('overtone_layout') as LayoutMode)) || 'classic',
  accentColor: (typeof window !== 'undefined' && (localStorage.getItem('overtone_accent') as AccentColor)) || 'orange',
  activeTab: 'Discover',
  tabHistory: ['Discover'],
  tabHistoryIndex: 0,
  searchQuery: '',
  isSidebarOpen: true,
  isSidebarCollapsed: (typeof window !== 'undefined' && localStorage.getItem('overtone_sidebar_collapsed') === 'true') || false,
  isRightPanelOpen: true,
  isSettingsOpen: false,
  isCreatePlaylistOpen: false,
  isMiniplayer: false,
  isLyricsPanelOpen: (typeof window !== 'undefined' && localStorage.getItem('overtone_lyrics_panel') === 'true') || false,

  lyrics: null,
  lyricOffset: 0,

  libraryCareTab: 'scan',
  watchedFolders: [],
  scanErrors: [],
  duplicateGroups: [],
  missingFiles: [],
  healthReport: null,
  isLibraryCareLoading: false,

  playHistory: [],
  playCounts: {},
  isPlayHistoryEnabled: true,
  trackRatings: {},
  trackTags: {},
  smartPlaylists: [],
  selectedSmartPlaylist: null,
  smartPlaylistTracks: [],
  forgottenFavorites: [],
  recentAdditions: [],
  resumePreference: 'always',

  shortcuts: {
    playPause: 'MediaPlayPause',
    nextTrack: 'MediaTrackNext',
    prevTrack: 'MediaTrackPrevious',
    volumeUp: 'VolumeUp',
    volumeDown: 'VolumeDown',
    toggleLyrics: 'CommandOrControl+L',
    toggleMiniplayer: 'CommandOrControl+M',
  },
  minimizeToTray: false,
  notificationsEnabled: false,
  focusMode: false,
  reducedMotion: (typeof window !== 'undefined' && localStorage.getItem('overtone_reduced_motion') === 'true') || false,
  textScale: (typeof window !== 'undefined' && (localStorage.getItem('overtone_text_scale') as 'small' | 'normal' | 'large')) || 'normal',
  diagnosticBundle: null,
  migrationStatus: null,
  backupPreview: null,
  selectedBackupPath: null,
  restoreResult: null,
  syncStatus: null,
  appInfo: null,
  isFullscreenPlayerOpen: false,
  fullscreenMode: 'artwork',

  tracks: [],
  albums: [],
  artists: [],
  playlists: [],
  selectedPlaylist: null,
  playlistTracks: [],
  favorites: new Set<number>(),
  selectedAlbum: null,
  selectedArtist: null,

  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  shuffleOn: false,
  repeatMode: 'off',
  audioError: null,

  queue: [],
  queueIndex: -1,

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('overtone_theme', theme);
    }
    set({ theme });
  },

  setLayout: (layout) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('overtone_layout', layout);
    }
    set({ layout });
  },

  setAccentColor: (accentColor) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('overtone_accent', accentColor);
    }
    set({ accentColor });
  },

  updateTrackDurationInStore: (trackId, duration) => {
    set((state) => {
      const updatedTracks = state.tracks.map((t) => (t.id === trackId ? { ...t, duration } : t));
      const updatedQueue = state.queue.map((t) => (t.id === trackId ? { ...t, duration } : t));
      const updatedPlaylistTracks = state.playlistTracks.map((t) => (t.id === trackId ? { ...t, duration } : t));
      const updatedCurrentTrack = state.currentTrack?.id === trackId ? { ...state.currentTrack, duration } : state.currentTrack;

      return {
        tracks: updatedTracks,
        queue: updatedQueue,
        playlistTracks: updatedPlaylistTracks,
        currentTrack: updatedCurrentTrack,
      };
    });
  },

  setActiveTab: (tab) => {
    const { tabHistory, tabHistoryIndex } = get();
    const newHistory = tabHistory.slice(0, tabHistoryIndex + 1);
    newHistory.push(tab);
    set({
      activeTab: tab,
      tabHistory: newHistory,
      tabHistoryIndex: newHistory.length - 1,
    });
  },

  navigateBack: () => {
    const { tabHistory, tabHistoryIndex } = get();
    if (tabHistoryIndex > 0) {
      const newIndex = tabHistoryIndex - 1;
      set({
        tabHistoryIndex: newIndex,
        activeTab: tabHistory[newIndex],
      });
    }
  },

  navigateForward: () => {
    const { tabHistory, tabHistoryIndex } = get();
    if (tabHistoryIndex < tabHistory.length - 1) {
      const newIndex = tabHistoryIndex + 1;
      set({
        tabHistoryIndex: newIndex,
        activeTab: tabHistory[newIndex],
      });
    }
  },

  setSearchQuery: (searchQuery) => {
    const { activeTab } = get();
    if (searchQuery.trim() && activeTab !== 'Songs' && activeTab !== 'Albums' && activeTab !== 'Artists') {
      set({ searchQuery, activeTab: 'Songs' });
    } else {
      set({ searchQuery });
    }
  },
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleSidebarCollapse: () => set((state) => {
    const next = !state.isSidebarCollapsed;
    if (typeof window !== 'undefined') {
      localStorage.setItem('overtone_sidebar_collapsed', String(next));
    }
    return { isSidebarCollapsed: next };
  }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setSidebarCollapsed: (isSidebarCollapsed) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('overtone_sidebar_collapsed', String(isSidebarCollapsed));
    }
    set({ isSidebarCollapsed });
  },
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  setRightPanelOpen: (isRightPanelOpen) => set({ isRightPanelOpen }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setCreatePlaylistOpen: (isCreatePlaylistOpen) => set({ isCreatePlaylistOpen }),
  toggleMiniplayer: () => {
    const { isMiniplayer } = get();
    const next = !isMiniplayer;
    if (typeof window !== 'undefined' && window.api?.toggleMiniplayer) {
      window.api.toggleMiniplayer();
    }
    set({ isMiniplayer: next });
  },
  setMiniplayer: (isMiniplayer) => {
    if (typeof window !== 'undefined' && window.api?.setMiniplayer) {
      window.api.setMiniplayer(isMiniplayer);
    }
    set({ isMiniplayer });
  },
  toggleLyricsPanel: () => {
    set((state) => {
      const next = !state.isLyricsPanelOpen;
      if (typeof window !== 'undefined') {
        localStorage.setItem('overtone_lyrics_panel', String(next));
      }
      return { isLyricsPanelOpen: next };
    });
  },
  setLyricsPanelOpen: (isLyricsPanelOpen) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('overtone_lyrics_panel', String(isLyricsPanelOpen));
    }
    set({ isLyricsPanelOpen });
  },
  toggleFullscreenPlayer: () => {
    const next = !get().isFullscreenPlayerOpen;
    set({ isFullscreenPlayerOpen: next });
    if (typeof window !== 'undefined' && window.api?.toggleFullScreen) {
      window.api.toggleFullScreen().catch(console.error);
    }
  },
  setFullscreenPlayerOpen: (isFullscreenPlayerOpen) => {
    set({ isFullscreenPlayerOpen });
  },
  setFullscreenMode: (fullscreenMode) => {
    set({ fullscreenMode });
  },
  fetchLyrics: async (trackPath, trackId) => {
    if (typeof window !== 'undefined' && window.api?.getLyricsForTrack) {
      try {
        const lyricsData = await window.api.getLyricsForTrack(trackPath, trackId);
        set({ lyrics: lyricsData, lyricOffset: lyricsData?.offset ?? 0 });
      } catch (err) {
        console.error('Error fetching lyrics:', err);
        set({ lyrics: null, lyricOffset: 0 });
      }
    } else {
      set({ lyrics: null, lyricOffset: 0 });
    }
  },
  adjustLyricOffset: async (trackId, deltaMs) => {
    const { lyricOffset } = get();
    const newOffset = lyricOffset + deltaMs;
    set({ lyricOffset: newOffset });
    if (typeof window !== 'undefined' && window.api?.setLyricOffset) {
      try {
        await window.api.setLyricOffset(trackId, newOffset);
      } catch (err) {
        console.error('Error saving lyric offset:', err);
      }
    }
  },
  resetLyricOffset: async (trackId) => {
    set({ lyricOffset: 0 });
    if (typeof window !== 'undefined' && window.api?.setLyricOffset) {
      try {
        await window.api.setLyricOffset(trackId, 0);
      } catch (err) {
        console.error('Error resetting lyric offset:', err);
      }
    }
  },

  setTracks: (tracks) => set({ tracks }),
  setAlbums: (albums) => set({ albums }),
  setArtists: (artists) => set({ artists }),
  setPlaylists: (playlists) => set({ playlists }),

  toggleFavorite: async (trackId) => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        await window.api.toggleFavorite(trackId);
        const favs = await window.api.getFavorites();
        set({ favorites: new Set(favs || []) });
      } catch (err) {
        console.error('Error toggling favorite:', err);
      }
    } else {
      set((state) => {
        const next = new Set(state.favorites);
        if (next.has(trackId)) next.delete(trackId);
        else next.add(trackId);
        return { favorites: next };
      });
    }
  },

  selectAlbum: (album) => {
    if (album) {
      const { tabHistory, tabHistoryIndex } = get();
      const newHistory = tabHistory.slice(0, tabHistoryIndex + 1);
      newHistory.push('AlbumDetail');
      set({
        selectedAlbum: album,
        activeTab: 'AlbumDetail',
        tabHistory: newHistory,
        tabHistoryIndex: newHistory.length - 1,
      });
    } else {
      set({ selectedAlbum: null });
    }
  },

  selectArtist: (artist) => {
    if (artist) {
      const { tabHistory, tabHistoryIndex } = get();
      const newHistory = tabHistory.slice(0, tabHistoryIndex + 1);
      newHistory.push('ArtistDetail');
      set({
        selectedArtist: artist,
        activeTab: 'ArtistDetail',
        tabHistory: newHistory,
        tabHistoryIndex: newHistory.length - 1,
      });
    } else {
      set({ selectedArtist: null });
    }
  },

  selectPlaylist: async (playlist) => {
    if (playlist) {
      const { tabHistory, tabHistoryIndex } = get();
      const newHistory = tabHistory.slice(0, tabHistoryIndex + 1);
      newHistory.push('PlaylistDetail');
      
      let pTracks: Track[] = [];
      if (typeof window !== 'undefined' && window.api) {
        try {
          pTracks = await window.api.getPlaylistTracks(playlist.id);
        } catch (err) {
          console.error('Error getting playlist tracks:', err);
        }
      }

      set({
        selectedPlaylist: playlist,
        playlistTracks: pTracks || [],
        activeTab: 'PlaylistDetail',
        tabHistory: newHistory,
        tabHistoryIndex: newHistory.length - 1,
      });
    } else {
      set({ selectedPlaylist: null, playlistTracks: [] });
    }
  },

  createPlaylist: async (name) => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        const newPl = await window.api.createPlaylist(name);
        const playlists = await window.api.getPlaylists();
        set({ playlists: playlists || [] });
        return newPl;
      } catch (err) {
        console.error('Error creating playlist:', err);
        return null;
      }
    }
    return null;
  },

  renamePlaylist: async (id, name) => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        await window.api.renamePlaylist(id, name);
        const playlists = await window.api.getPlaylists();
        const { selectedPlaylist } = get();
        const updatedSelected = selectedPlaylist?.id === id 
          ? { ...selectedPlaylist, name } 
          : selectedPlaylist;
        set({ playlists: playlists || [], selectedPlaylist: updatedSelected });
      } catch (err) {
        console.error('Error renaming playlist:', err);
      }
    }
  },

  deletePlaylist: async (id) => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        await window.api.deletePlaylist(id);
        const playlists = await window.api.getPlaylists();
        const { selectedPlaylist, activeTab } = get();
        set({
          playlists: playlists || [],
          selectedPlaylist: selectedPlaylist?.id === id ? null : selectedPlaylist,
          activeTab: selectedPlaylist?.id === id ? 'Discover' : activeTab,
        });
      } catch (err) {
        console.error('Error deleting playlist:', err);
      }
    }
  },

  addTrackToPlaylist: async (playlistId, trackId) => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        await window.api.addTrackToPlaylist(playlistId, trackId);
        const [playlists, pTracks] = await Promise.all([
          window.api.getPlaylists(),
          window.api.getPlaylistTracks(playlistId),
        ]);
        const { selectedPlaylist } = get();
        set({
          playlists: playlists || [],
          playlistTracks: selectedPlaylist?.id === playlistId ? (pTracks || []) : get().playlistTracks,
        });
      } catch (err) {
        console.error('Error adding track to playlist:', err);
      }
    }
  },

  removeTrackFromPlaylist: async (playlistId, trackId) => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        await window.api.removeTrackFromPlaylist(playlistId, trackId);
        const [playlists, pTracks] = await Promise.all([
          window.api.getPlaylists(),
          window.api.getPlaylistTracks(playlistId),
        ]);
        set({
          playlists: playlists || [],
          playlistTracks: pTracks || [],
        });
      } catch (err) {
        console.error('Error removing track from playlist:', err);
      }
    }
  },

  reorderPlaylistTracks: async (playlistId, trackIds) => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        await window.api.reorderPlaylistTracks(playlistId, trackIds);
        const pTracks = await window.api.getPlaylistTracks(playlistId);
        set({ playlistTracks: pTracks || [] });
      } catch (err) {
        console.error('Error reordering playlist tracks:', err);
      }
    }
  },

  exportPlaylistM3U: async (playlistId) => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        return await window.api.exportPlaylistM3U(playlistId);
      } catch (err) {
        console.error('Error exporting playlist:', err);
        return false;
      }
    }
    return false;
  },

  importPlaylistM3U: async () => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        const imported = await window.api.importPlaylistM3U();
        if (imported) {
          const playlists = await window.api.getPlaylists();
          set({ playlists: playlists || [] });
          await get().selectPlaylist(imported);
        }
      } catch (err) {
        console.error('Error importing playlist:', err);
      }
    }
  },

  importDirectoryPlaylists: async (folderPath) => {
    if (typeof window !== 'undefined' && window.api?.importDirectoryPlaylists) {
      try {
        const res = await window.api.importDirectoryPlaylists(folderPath);
        if (res?.success) {
          await get().refreshLibrary();
        }
        return res;
      } catch (err) {
        console.error('Error importing directory playlists:', err);
        return null;
      }
    }
    return null;
  },

  setCurrentTrack: (currentTrack) => set({ currentTrack }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setIsMuted: (isMuted) => set({ isMuted }),
  setShuffleOn: (shuffleOn) => set({ shuffleOn }),
  setRepeatMode: (repeatMode) => set({ repeatMode }),

  cycleRepeatMode: () =>
    set((state) => {
      if (state.repeatMode === 'off') return { repeatMode: 'all' };
      if (state.repeatMode === 'all') return { repeatMode: 'one' };
      return { repeatMode: 'off' };
    }),

  setAudioError: (audioError) => set({ audioError }),

  setQueue: (queue, startIndex = 0) => set({ queue, queueIndex: startIndex }),

  addToQueue: (track) =>
    set((state) => ({
      queue: [...state.queue, track],
      queueIndex: state.queueIndex === -1 ? 0 : state.queueIndex,
    })),

  playNextInQueue: (track) =>
    set((state) => {
      const q = [...state.queue];
      const insertAt = state.queueIndex + 1;
      q.splice(insertAt, 0, track);
      return { queue: q };
    }),

  removeFromQueue: (index) =>
    set((state) => {
      const q = state.queue.filter((_, i) => i !== index);
      let newIdx = state.queueIndex;
      if (index < state.queueIndex) newIdx--;
      else if (index === state.queueIndex && newIdx >= q.length) newIdx = q.length - 1;
      return { queue: q, queueIndex: newIdx };
    }),

  clearQueue: () => set({ queue: [], queueIndex: -1 }),

  playTrack: (track, contextQueue) => {
    const { currentTrack, isPlaying, tracks } = get();
    if (currentTrack?.id === track.id) {
      // Toggle play/pause
      set({ isPlaying: !isPlaying });
      return;
    }

    const currentContext = contextQueue || tracks;
    const idx = currentContext.findIndex((t) => t.id === track.id);

    set({
      currentTrack: track,
      currentTime: 0,
      duration: track.duration || 0,
      isPlaying: true,
      audioError: null,
      queue: currentContext,
      queueIndex: idx !== -1 ? idx : 0,
    });
  },

  handleNext: () => {
    const { queue, queueIndex, shuffleOn, repeatMode, tracks } = get();
    const activeList = queue.length > 0 ? queue : tracks;
    if (activeList.length === 0) return;

    if (shuffleOn) {
      const randIdx = Math.floor(Math.random() * activeList.length);
      const nextTrack = activeList[randIdx];
      set({
        currentTrack: nextTrack,
        currentTime: 0,
        duration: nextTrack.duration || 0,
        isPlaying: true,
        queueIndex: randIdx,
      });
      return;
    }

    if (queueIndex !== -1 && queueIndex < activeList.length - 1) {
      const nextIdx = queueIndex + 1;
      const nextTrack = activeList[nextIdx];
      set({
        currentTrack: nextTrack,
        currentTime: 0,
        duration: nextTrack.duration || 0,
        isPlaying: true,
        queueIndex: nextIdx,
      });
    } else if (repeatMode === 'all') {
      const nextTrack = activeList[0];
      set({
        currentTrack: nextTrack,
        currentTime: 0,
        duration: nextTrack.duration || 0,
        isPlaying: true,
        queueIndex: 0,
      });
    }
  },

  handlePrev: () => {
    const { queue, queueIndex, repeatMode, currentTime, tracks } = get();
    const activeList = queue.length > 0 ? queue : tracks;
    if (activeList.length === 0) return;

    // If more than 3 seconds in, restart track
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }

    if (queueIndex > 0) {
      const prevIdx = queueIndex - 1;
      const prevTrack = activeList[prevIdx];
      set({
        currentTrack: prevTrack,
        currentTime: 0,
        duration: prevTrack.duration || 0,
        isPlaying: true,
        queueIndex: prevIdx,
      });
    } else if (repeatMode === 'all') {
      const prevIdx = activeList.length - 1;
      const prevTrack = activeList[prevIdx];
      set({
        currentTrack: prevTrack,
        currentTime: 0,
        duration: prevTrack.duration || 0,
        isPlaying: true,
        queueIndex: prevIdx,
      });
    }
  },

  refreshLibrary: async () => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        const [t, al, ar, pl, favs] = await Promise.all([
          window.api.getTracks(),
          window.api.getAlbums(),
          window.api.getArtists(),
          window.api.getPlaylists(),
          window.api.getFavorites(),
        ]);
        set({
          tracks: t || [],
          albums: al || [],
          artists: ar || [],
          playlists: pl || [],
          favorites: new Set(favs || []),
        });
      } catch (err) {
        console.error('Error refreshing library:', err);
      }
    }
  },

  // ── Library Care Actions ──
  setLibraryCareTab: (tab) => set({ libraryCareTab: tab }),

  loadLibraryCareData: async () => {
    if (typeof window !== 'undefined' && window.api) {
      set({ isLibraryCareLoading: true });
      try {
        const [dash, health, dupes, missing] = await Promise.all([
          window.api.getScanDashboard(),
          window.api.getLibraryHealthReport(),
          window.api.findDuplicates(),
          window.api.findMissingFiles(),
        ]);
        set({
          watchedFolders: dash?.folders || [],
          scanErrors: dash?.recentErrors || [],
          healthReport: health || null,
          duplicateGroups: dupes || [],
          missingFiles: missing || [],
          isLibraryCareLoading: false,
        });
      } catch (err) {
        console.error('Error loading library care data:', err);
        set({ isLibraryCareLoading: false });
      }
    }
  },

  rescanWatchedFolder: async (folderPath) => {
    if (typeof window !== 'undefined' && window.api) {
      set({ isLibraryCareLoading: true });
      try {
        await window.api.rescanFolder(folderPath);
        await get().refreshLibrary();
        await get().loadLibraryCareData();
      } catch (e) {
        console.error('Error rescanning folder:', e);
      } finally {
        set({ isLibraryCareLoading: false });
      }
    }
  },

  removeWatchedFolder: async (folderPath) => {
    if (typeof window !== 'undefined' && window.api) {
      set({ isLibraryCareLoading: true });
      try {
        await window.api.removeFolderFromLibrary(folderPath);
        await get().refreshLibrary();
        await get().loadLibraryCareData();
      } catch (e) {
        console.error('Error removing watched folder:', e);
      } finally {
        set({ isLibraryCareLoading: false });
      }
    }
  },

  clearScanErrors: async (folderId) => {
    if (typeof window !== 'undefined' && window.api) {
      await window.api.clearScanErrors(folderId);
      const errors = await window.api.getScanErrors();
      set({ scanErrors: errors || [] });
    }
  },

  fetchDuplicates: async () => {
    if (typeof window !== 'undefined' && window.api) {
      const dupes = await window.api.findDuplicates();
      set({ duplicateGroups: dupes || [] });
    }
  },

  ignoreDuplicate: async (trackIds: number[]) => {
    if (typeof window !== 'undefined' && window.api?.ignoreDuplicate) {
      await window.api.ignoreDuplicate(trackIds);
      const dupes = await window.api.findDuplicates();
      set({ duplicateGroups: dupes || [] });
    }
  },

  fetchMissingFiles: async () => {
    if (typeof window !== 'undefined' && window.api) {
      const missing = await window.api.findMissingFiles();
      set({ missingFiles: missing || [] });
    }
  },

  fetchHealthReport: async () => {
    if (typeof window !== 'undefined' && window.api) {
      const health = await window.api.getLibraryHealthReport();
      set({ healthReport: health || null });
    }
  },

  relinkMissingTrack: async (trackId) => {
    if (typeof window !== 'undefined' && window.api) {
      const result = await window.api.relinkTrackDialog(trackId);
      if (result.success) {
        await get().fetchMissingFiles();
        await get().refreshLibrary();
      }
      return result;
    }
    return { success: false };
  },

  removeTrackFromLibrary: async (trackId) => {
    if (typeof window !== 'undefined' && window.api) {
      await window.api.removeTrackFromLibrary(trackId);
      await get().refreshLibrary();
      await get().loadLibraryCareData();
    }
  },

  saveTrackMetadata: async (trackId, fields, writeToFile) => {
    if (typeof window !== 'undefined' && window.api) {
      const result = await window.api.updateTrackMetadata(trackId, fields, writeToFile);
      if (result.success) {
        await get().refreshLibrary();
      }
      return result;
    }
    return { success: false, catalogUpdated: false, fileUpdated: false };
  },

  replaceAlbumArtwork: async (albumId, writeToFile) => {
    if (typeof window !== 'undefined' && window.api) {
      const result = await window.api.replaceAlbumArtwork(albumId, writeToFile);
      if (result.success) {
        await get().refreshLibrary();
      }
      return result;
    }
    return { success: false };
  },

  // ── Discovery, Ratings, Smart Playlists & State Actions ──
  recordPlayEvent: async (trackId, durationPlayed = 0) => {
    if (typeof window !== 'undefined' && window.api) {
      await window.api.recordPlayEvent(trackId, durationPlayed);
      const counts = await window.api.getPlayCounts();
      set({ playCounts: counts || {} });
    }
  },

  loadPlayHistory: async () => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        const [history, counts, enabled] = await Promise.all([
          window.api.getPlayHistory(100),
          window.api.getPlayCounts(),
          window.api.isPlayHistoryEnabled(),
        ]);
        set({
          playHistory: history || [],
          playCounts: counts || {},
          isPlayHistoryEnabled: enabled ?? true,
        });
      } catch (e) {
        console.error('Error loading play history:', e);
      }
    }
  },

  clearPlayHistory: async () => {
    if (typeof window !== 'undefined' && window.api) {
      await window.api.clearPlayHistory();
      set({ playHistory: [], playCounts: {} });
    }
  },

  setPlayHistoryEnabled: async (enabled) => {
    if (typeof window !== 'undefined' && window.api) {
      await window.api.setPlayHistoryEnabled(enabled);
      set({ isPlayHistoryEnabled: enabled });
    }
  },

  setTrackRating: async (trackId, rating) => {
    if (typeof window !== 'undefined' && window.api) {
      await window.api.setTrackRating(trackId, rating);
      const ratings = await window.api.getAllTrackRatings();
      set({ trackRatings: ratings || {} });
    }
  },

  addTrackTag: async (trackId, tag) => {
    if (typeof window !== 'undefined' && window.api) {
      await window.api.addTrackTag(trackId, tag);
      const tagMap = await window.api.getAllTrackTagsMap();
      set({ trackTags: tagMap || {} });
    }
  },

  removeTrackTag: async (trackId, tag) => {
    if (typeof window !== 'undefined' && window.api) {
      await window.api.removeTrackTag(trackId, tag);
      const tagMap = await window.api.getAllTrackTagsMap();
      set({ trackTags: tagMap || {} });
    }
  },

  loadRatingsAndTags: async () => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        const [ratings, tags] = await Promise.all([
          window.api.getAllTrackRatings(),
          window.api.getAllTrackTagsMap(),
        ]);
        set({
          trackRatings: ratings || {},
          trackTags: tags || {},
        });
      } catch (e) {
        console.error('Error loading ratings and tags:', e);
      }
    }
  },

  loadSmartPlaylists: async () => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        const spl = await window.api.getSmartPlaylists();
        set({ smartPlaylists: spl || [] });
      } catch (e) {
        console.error('Error loading smart playlists:', e);
      }
    }
  },

  createSmartPlaylist: async (name, rules) => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        const created = await window.api.createSmartPlaylist(name, rules);
        await get().loadSmartPlaylists();
        return created;
      } catch (e) {
        console.error('Error creating smart playlist:', e);
        return null;
      }
    }
    return null;
  },

  updateSmartPlaylist: async (id, name, rules) => {
    if (typeof window !== 'undefined' && window.api) {
      const ok = await window.api.updateSmartPlaylist(id, name, rules);
      if (ok) {
        await get().loadSmartPlaylists();
        const sel = get().selectedSmartPlaylist;
        if (sel && sel.id === id) {
          await get().selectSmartPlaylist({ ...sel, name, rules });
        }
      }
      return ok;
    }
    return false;
  },

  deleteSmartPlaylist: async (id) => {
    if (typeof window !== 'undefined' && window.api) {
      const ok = await window.api.deleteSmartPlaylist(id);
      if (ok) {
        await get().loadSmartPlaylists();
        if (get().selectedSmartPlaylist?.id === id) {
          set({ selectedSmartPlaylist: null, smartPlaylistTracks: [] });
        }
      }
      return ok;
    }
    return false;
  },

  selectSmartPlaylist: async (playlist) => {
    if (!playlist) {
      set({ selectedSmartPlaylist: null, smartPlaylistTracks: [] });
      return;
    }
    if (typeof window !== 'undefined' && window.api) {
      try {
        const evaluated = await window.api.evaluateSmartPlaylist(playlist.rules);
        set({
          selectedSmartPlaylist: playlist,
          smartPlaylistTracks: evaluated || [],
          activeTab: 'SmartPlaylists',
        });
      } catch (e) {
        console.error('Error evaluating smart playlist:', e);
      }
    }
  },

  loadMixes: async () => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        const [forgotten, recent] = await Promise.all([
          window.api.getForgottenFavorites(20),
          window.api.getRecentAdditions(20),
        ]);
        set({
          forgottenFavorites: forgotten || [],
          recentAdditions: recent || [],
        });
      } catch (e) {
        console.error('Error loading mixes:', e);
      }
    }
  },

  saveQueueAsPlaylist: async (name) => {
    const queue = get().queue;
    if (queue.length === 0) return null;
    const playlistName = name || `Queue Mix ${new Date().toLocaleDateString()}`;
    const newPlaylist = await get().createPlaylist(playlistName);
    if (newPlaylist && typeof window !== 'undefined' && window.api) {
      for (const track of queue) {
        await window.api.addTrackToPlaylist(newPlaylist.id, track.id);
      }
      await get().refreshLibrary();
      return newPlaylist;
    }
    return null;
  },

  savePlaybackState: async () => {
    if (typeof window !== 'undefined' && window.api) {
      const { currentTrack, currentTime, queue, resumePreference } = get();
      await window.api.savePlaybackState({
        trackId: currentTrack?.id ?? null,
        currentTime,
        queueIds: queue.map((t) => t.id),
        resumePreference,
      });
    }
  },

  restorePlaybackState: async () => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        const pref = (await window.api.getSetting('resume_preference', 'always')) as 'always' | 'ask' | 'off';
        set({ resumePreference: pref });
        if (pref === 'off') return;

        const state = await window.api.getPlaybackState();
        if (!state || !state.trackId) return;

        const tracks = get().tracks;
        const savedTrack = tracks.find((t) => t.id === state.trackId);
        if (savedTrack) {
          const restoredQueue = state.queueIds
            .map((id) => tracks.find((t) => t.id === id))
            .filter((t): t is Track => t !== undefined);

          set({
            currentTrack: savedTrack,
            currentTime: state.currentTime || 0,
            duration: savedTrack.duration || 0,
            queue: restoredQueue.length > 0 ? restoredQueue : [savedTrack],
            queueIndex: restoredQueue.findIndex((t) => t.id === savedTrack.id),
            isPlaying: false, // Do not auto-play audio loudly without listener action
          });
        }
      } catch (e) {
        console.error('Error restoring playback state:', e);
      }
    }
  },

  setResumePreference: async (pref) => {
    if (typeof window !== 'undefined' && window.api) {
      await window.api.setSetting('resume_preference', pref);
      set({ resumePreference: pref });
    }
  },

  // ── Desktop Polish Actions ──
  loadDesktopSettings: async () => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        const [sc, minTray, notif, focus] = await Promise.all([
          window.api.getShortcuts(),
          window.api.getSetting('minimize_to_tray', 'false'),
          window.api.getSetting('notifications_enabled', 'false'),
          window.api.getSetting('focus_mode', 'false'),
        ]);
        set({
          shortcuts: sc || get().shortcuts,
          minimizeToTray: minTray === 'true',
          notificationsEnabled: notif === 'true',
          focusMode: focus === 'true',
        });
      } catch (err) {
        console.error('Error loading desktop settings:', err);
      }
    }
  },

  setShortcuts: async (shortcuts) => {
    if (typeof window !== 'undefined' && window.api) {
      const res = await window.api.saveShortcuts(shortcuts);
      if (res.success) {
        set({ shortcuts });
      }
      return res;
    }
    return { success: false };
  },

  resetShortcuts: async () => {
    if (typeof window !== 'undefined' && window.api) {
      const res = await window.api.resetShortcuts();
      if (res.success) {
        set({ shortcuts: res.shortcuts });
      }
    }
  },

  setMinimizeToTray: async (enabled) => {
    if (typeof window !== 'undefined' && window.api) {
      await window.api.setSetting('minimize_to_tray', String(enabled));
      set({ minimizeToTray: enabled });
    }
  },

  setNotificationsEnabled: async (enabled) => {
    if (typeof window !== 'undefined' && window.api) {
      await window.api.setSetting('notifications_enabled', String(enabled));
      set({ notificationsEnabled: enabled });
    }
  },

  setFocusMode: async (enabled) => {
    if (typeof window !== 'undefined' && window.api) {
      await window.api.setSetting('focus_mode', String(enabled));
      set({ focusMode: enabled });
    }
  },

  setReducedMotion: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('overtone_reduced_motion', String(enabled));
      if (enabled) {
        document.documentElement.classList.add('reduced-motion');
      } else {
        document.documentElement.classList.remove('reduced-motion');
      }
    }
    set({ reducedMotion: enabled });
  },

  setTextScale: (scale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('overtone_text_scale', scale);
      document.documentElement.classList.remove('text-scale-small', 'text-scale-large');
      if (scale === 'small') document.documentElement.classList.add('text-scale-small');
      if (scale === 'large') document.documentElement.classList.add('text-scale-large');
    }
    set({ textScale: scale });
  },

  loadDiagnosticReport: async () => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        const report = await window.api.getDiagnosticReport();
        set({ diagnosticBundle: report });
      } catch (err) {
        console.error('Error getting diagnostic report:', err);
      }
    }
  },

  exportDiagnostics: async () => {
    if (typeof window !== 'undefined' && window.api) {
      return await window.api.exportDiagnosticReport();
    }
    return false;
  },

  // ── 0.2.0 Personal Music Hub Actions ──
  loadMigrationStatus: async () => {
    if (typeof window !== 'undefined' && window.api?.getMigrationStatus) {
      try {
        const status = await window.api.getMigrationStatus();
        set({ migrationStatus: status });
      } catch (err) {
        console.error('Error getting migration status:', err);
      }
    }
  },

  triggerMigrations: async () => {
    if (typeof window !== 'undefined' && window.api?.runMigrations) {
      try {
        await window.api.runMigrations();
        const status = await window.api.getMigrationStatus();
        set({ migrationStatus: status });
      } catch (err) {
        console.error('Error running migrations:', err);
      }
    }
  },

  exportLibraryBackup: async () => {
    if (typeof window !== 'undefined' && window.api?.exportBackup) {
      return await window.api.exportBackup();
    }
    return { success: false };
  },

  selectBackupFile: async () => {
    if (typeof window !== 'undefined' && window.api?.selectBackupForPreview) {
      const res = await window.api.selectBackupForPreview();
      if (!res.canceled && res.preview && res.filePath) {
        set({ backupPreview: res.preview, selectedBackupPath: res.filePath, restoreResult: null });
      }
    }
  },

  executeRestore: async (mode, restoreSettings) => {
    const { selectedBackupPath } = get();
    if (!selectedBackupPath || typeof window === 'undefined' || !window.api?.restoreBackup) {
      return false;
    }
    try {
      const result = await window.api.restoreBackup(selectedBackupPath, mode, restoreSettings);
      set({ restoreResult: result });
      if (result.success) {
        await get().refreshLibrary();
        await get().loadSmartPlaylists();
        await get().loadRatingsAndTags();
      }
      return result.success;
    } catch (err) {
      console.error('Error restoring backup:', err);
      return false;
    }
  },

  relocatePaths: async (oldPrefix, newPrefix) => {
    if (typeof window !== 'undefined' && window.api?.relocateLibrary) {
      try {
        const res = await window.api.relocateLibrary(oldPrefix, newPrefix);
        if (res.success) {
          await get().refreshLibrary();
        }
        return res;
      } catch (err) {
        console.error('Error relocating paths:', err);
        return null;
      }
    }
    return null;
  },

  loadSyncStatus: async () => {
    if (typeof window !== 'undefined' && window.api?.getDeviceSyncStatus) {
      try {
        const status = await window.api.getDeviceSyncStatus();
        set({ syncStatus: status });
      } catch (err) {
        console.error('Error getting device sync status:', err);
      }
    }
  },

  toggleDeviceSync: async (enabled) => {
    if (typeof window !== 'undefined' && window.api?.toggleDeviceSyncServer) {
      try {
        const status = await window.api.toggleDeviceSyncServer(enabled);
        set({ syncStatus: status });
      } catch (err) {
        console.error('Error toggling device sync server:', err);
      }
    }
  },

  generateSyncPin: async () => {
    if (typeof window !== 'undefined' && window.api?.generatePairingPin) {
      try {
        const res = await window.api.generatePairingPin();
        await get().loadSyncStatus();
        return res;
      } catch (err) {
        console.error('Error generating sync pin:', err);
        return null;
      }
    }
    return null;
  },

  pairWithPeerDevice: async (ip, pin) => {
    if (typeof window !== 'undefined' && window.api?.pairWithPeer) {
      const res = await window.api.pairWithPeer(ip, pin);
      if (res.success) {
        await get().loadSyncStatus();
      }
      return res;
    }
    return { success: false, error: 'API unavailable' };
  },

  sendPlaylistToPeerDevice: async (deviceId, playlistId) => {
    if (typeof window !== 'undefined' && window.api?.sendPlaylistToPeer) {
      return await window.api.sendPlaylistToPeer(deviceId, playlistId);
    }
    return { success: false, error: 'API unavailable' };
  },

  acceptSharedPlaylist: async (pendingId) => {
    if (typeof window !== 'undefined' && window.api?.acceptIncomingPlaylist) {
      const res = await window.api.acceptIncomingPlaylist(pendingId);
      if (res.success) {
        await get().loadSyncStatus();
        await get().refreshLibrary();
        return true;
      }
    }
    return false;
  },

  declineSharedPlaylist: async (pendingId) => {
    if (typeof window !== 'undefined' && window.api?.declineIncomingPlaylist) {
      const res = await window.api.declineIncomingPlaylist(pendingId);
      if (res) {
        await get().loadSyncStatus();
      }
      return res;
    }
    return false;
  },

  revokeDevice: async (deviceId) => {
    if (typeof window !== 'undefined' && window.api?.revokePairedDevice) {
      const res = await window.api.revokePairedDevice(deviceId);
      if (res) {
        await get().loadSyncStatus();
      }
      return res;
    }
    return false;
  },

  loadAppInfo: async () => {
    if (typeof window !== 'undefined' && window.api?.getAppInfo) {
      try {
        const info = await window.api.getAppInfo();
        set({ appInfo: info });
      } catch (err) {
        console.error('Error loading app info:', err);
      }
    }
  },
}));
