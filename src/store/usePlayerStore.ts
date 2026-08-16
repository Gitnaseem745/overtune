import { create } from 'zustand';
import { Track, Album, Artist, ThemeMode, LayoutMode, RepeatMode, ActiveTab } from '../types/music';

interface PlayerState {
  // ── Appearance & UI Preferences ──
  theme: ThemeMode;
  layout: LayoutMode;
  activeTab: ActiveTab;
  tabHistory: ActiveTab[];
  tabHistoryIndex: number;
  searchQuery: string;
  isRightPanelOpen: boolean;
  isSettingsOpen: boolean;

  // ── Library Data ──
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
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
  setActiveTab: (tab: ActiveTab) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  setSearchQuery: (query: string) => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleSettings: () => void;
  setSettingsOpen: (open: boolean) => void;

  setTracks: (tracks: Track[]) => void;
  setAlbums: (albums: Album[]) => void;
  setArtists: (artists: Artist[]) => void;
  toggleFavorite: (trackId: number) => void;
  selectAlbum: (album: Album | null) => void;
  selectArtist: (artist: Artist | null) => void;

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
  activeTab: 'Discover',
  tabHistory: ['Discover'],
  tabHistoryIndex: 0,
  searchQuery: '',
  isRightPanelOpen: true,
  isSettingsOpen: false,

  tracks: [],
  albums: [],
  artists: [],
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

  setTracks: (tracks) => set({ tracks }),
  setAlbums: (albums) => set({ albums }),
  setArtists: (artists) => set({ artists }),

  toggleFavorite: (trackId) =>
    set((state) => {
      const next = new Set(state.favorites);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return { favorites: next };
    }),

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
        const [t, al, ar] = await Promise.all([
          window.api.getTracks(),
          window.api.getAlbums(),
          window.api.getArtists(),
        ]);
        set({
          tracks: t || [],
          albums: al || [],
          artists: ar || [],
        });
      } catch (err) {
        console.error('Error refreshing library:', err);
      }
    }
  },
}));
