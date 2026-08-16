import { create } from 'zustand';
import { Track, Album, Artist, Playlist, ThemeMode, LayoutMode, AccentColor, RepeatMode, ActiveTab } from '../types/music';

interface PlayerState {
  // ── Appearance & UI Preferences ──
  theme: ThemeMode;
  layout: LayoutMode;
  accentColor: AccentColor;
  activeTab: ActiveTab;
  tabHistory: ActiveTab[];
  tabHistoryIndex: number;
  searchQuery: string;
  isRightPanelOpen: boolean;
  isSettingsOpen: boolean;
  isCreatePlaylistOpen: boolean;

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
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleSettings: () => void;
  setSettingsOpen: (open: boolean) => void;
  setCreatePlaylistOpen: (open: boolean) => void;

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
  exportPlaylistM3U: (playlistId: number) => Promise<boolean>;
  importPlaylistM3U: () => Promise<void>;

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
  isRightPanelOpen: true,
  isSettingsOpen: false,

  tracks: [],
  albums: [],
  artists: [],
  playlists: [],
  selectedPlaylist: null,
  playlistTracks: [],
  favorites: new Set<number>(),
  selectedAlbum: null,
  selectedArtist: null,
  isCreatePlaylistOpen: false,

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

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  setRightPanelOpen: (isRightPanelOpen) => set({ isRightPanelOpen }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setCreatePlaylistOpen: (isCreatePlaylistOpen) => set({ isCreatePlaylistOpen }),

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
}));
