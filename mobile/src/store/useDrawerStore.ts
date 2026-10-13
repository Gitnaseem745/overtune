/**
 * Overtone iOS — Drawer Store (Zustand)
 *
 * Coordinates sidebar drawer open/close state and active navigation
 * destination for the Sleek Theme.
 */

import { create } from 'zustand';

export type SleekNavTab = 'home' | 'songs' | 'favorites' | 'playlists' | 'search' | 'settings';

interface DrawerState {
  isOpen: boolean;
  activeTab: SleekNavTab;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setActiveTab: (tab: SleekNavTab) => void;
}

export const useDrawerStore = create<DrawerState>((set) => ({
  isOpen: false,
  activeTab: 'home',
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
