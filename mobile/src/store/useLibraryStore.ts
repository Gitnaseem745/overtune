/**
 * Overtone iOS — Library Store (Zustand)
 *
 * Manages library state and coordinates with DB repositories.
 * Database is the source of truth; this store caches for UI rendering.
 */

import { create } from 'zustand';
import type {
  MobileTrack,
  MobileAlbum,
  MobileArtist,
  MobilePlaylist,
  ImportResult,
} from '../domain/models';

type LibraryTab = 'songs' | 'albums' | 'artists' | 'playlists';
type SortOption = 'title' | 'artist' | 'album' | 'recent' | 'added';

interface LibraryState {
  // Data
  tracks: MobileTrack[];
  albums: MobileAlbum[];
  artists: MobileArtist[];
  playlists: MobilePlaylist[];
  favorites: Set<number>;
  recentlyPlayed: MobileTrack[];
  recentlyAdded: MobileTrack[];

  // UI state
  activeTab: LibraryTab;
  sortBy: SortOption;
  isLoading: boolean;
  isImporting: boolean;
  importProgress: { current: number; total: number; fileName: string } | null;
  lastImportResult: ImportResult | null;

  // Actions
  setTracks: (tracks: MobileTrack[]) => void;
  setAlbums: (albums: MobileAlbum[]) => void;
  setArtists: (artists: MobileArtist[]) => void;
  setPlaylists: (playlists: MobilePlaylist[]) => void;
  setFavorites: (ids: Set<number>) => void;
  toggleFavorite: (trackId: number) => void;
  setRecentlyPlayed: (tracks: MobileTrack[]) => void;
  setRecentlyAdded: (tracks: MobileTrack[]) => void;
  setActiveTab: (tab: LibraryTab) => void;
  setSortBy: (sort: SortOption) => void;
  setLoading: (loading: boolean) => void;
  setImporting: (importing: boolean) => void;
  setImportProgress: (progress: { current: number; total: number; fileName: string } | null) => void;
  setLastImportResult: (result: ImportResult | null) => void;
  refreshAll: () => void;
  _refreshCallback: (() => void) | null;
  setRefreshCallback: (cb: () => void) => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  tracks: [],
  albums: [],
  artists: [],
  playlists: [],
  favorites: new Set(),
  recentlyPlayed: [],
  recentlyAdded: [],
  activeTab: 'songs',
  sortBy: 'title',
  isLoading: false,
  isImporting: false,
  importProgress: null,
  lastImportResult: null,

  setTracks: (tracks) => set({ tracks }),
  setAlbums: (albums) => set({ albums }),
  setArtists: (artists) => set({ artists }),
  setPlaylists: (playlists) => set({ playlists }),
  setFavorites: (ids) => set({ favorites: ids }),
  toggleFavorite: (trackId) => {
    set((state) => {
      const newFavs = new Set(state.favorites);
      if (newFavs.has(trackId)) {
        newFavs.delete(trackId);
      } else {
        newFavs.add(trackId);
      }
      return { favorites: newFavs };
    });
  },
  setRecentlyPlayed: (tracks) => set({ recentlyPlayed: tracks }),
  setRecentlyAdded: (tracks) => set({ recentlyAdded: tracks }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setLoading: (loading) => set({ isLoading: loading }),
  setImporting: (importing) => set({ isImporting: importing }),
  setImportProgress: (progress) => set({ importProgress: progress }),
  setLastImportResult: (result) => set({ lastImportResult: result }),
  refreshAll: () => {
    const cb = get()._refreshCallback;
    if (cb) cb();
  },
  _refreshCallback: null,
  setRefreshCallback: (cb) => set({ _refreshCallback: cb }),
}));
