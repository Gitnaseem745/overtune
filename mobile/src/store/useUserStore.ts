/**
 * Overtone iOS — User Profile Store (Zustand)
 *
 * Coordinates user profile state, custom display name, and persistence
 * with SQLite settings repository across all screens and sidebar in real-time.
 */

import { create } from 'zustand';
import type { DatabaseContext } from '../hooks/useDatabase';

interface UserState {
  userName: string;
  isCustom: boolean;
  setUserName: (name: string, db?: DatabaseContext | any) => void;
  loadUserName: (db: DatabaseContext | any) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  userName: 'USER',
  isCustom: false,

  setUserName: (name: string, db?: any) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set({ userName: trimmed, isCustom: true });

    if (db?.isReady && db?.settings) {
      try {
        db.settings.set('userName', trimmed);
      } catch (err) {
        console.warn('[useUserStore] Failed to persist userName to SQLite:', err);
      }
    }
  },

  loadUserName: (db: any) => {
    if (db?.isReady && db?.settings) {
      try {
        const stored = db.settings.get('userName', '');
        if (stored && stored.trim()) {
          set({ userName: stored.trim(), isCustom: true });
        }
      } catch (err) {
        console.warn('[useUserStore] Failed to load userName from SQLite:', err);
      }
    }
  },
}));
