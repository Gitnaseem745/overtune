/**
 * Overtone iOS — Player Store (Zustand)
 *
 * App-level state for playback. Database remains the source of truth
 * for persistent library data; this store handles transient playback
 * state, queue management, and UI coordination.
 */

import { create } from 'zustand';
import { AudioService } from '../services/audio/AudioService';
import type { MobileTrack, RepeatMode } from '../domain/models';

interface PlayerState {
  // Current playback
  currentTrack: MobileTrack | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;

  // Queue
  queue: MobileTrack[];
  queueIndex: number;
  originalQueue: MobileTrack[]; // for unshuffle
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;

  // UI
  isMiniPlayerVisible: boolean;
  isNowPlayingOpen: boolean;
  isQueueVisible: boolean;
  isSeeking: boolean;
  seekPosition: number;

  // Volume
  volume: number;
  setVolume: (vol: number) => Promise<void>;

  // Actions
  loadAndPlay: (track: MobileTrack, queue?: MobileTrack[], startIndex?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  startSeeking: (position: number) => void;
  finishSeeking: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setQueue: (tracks: MobileTrack[], startIndex?: number) => void;
  addToQueue: (track: MobileTrack) => void;
  playNext: (track: MobileTrack) => void;
  updateTrack: (updatedTrack: MobileTrack) => void;
  removeTrack: (trackId: number) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  updatePlaybackStatus: (time: number, dur: number, playing: boolean, buffering: boolean) => void;
  handleTrackEnded: () => Promise<void>;
  setNowPlayingOpen: (open: boolean) => void;
  setQueueVisible: (visible: boolean) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  queue: [],
  queueIndex: 0,
  originalQueue: [],
  shuffleEnabled: false,
  repeatMode: 'off',
  isMiniPlayerVisible: false,
  isNowPlayingOpen: false,
  isQueueVisible: false,
  isSeeking: false,
  seekPosition: 0,
  volume: 0.75,

  setVolume: async (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    set({ volume: clamped });
    try {
      await AudioService.setVolume(clamped);
    } catch (e) {
      console.warn('[PlayerStore] Error setting volume:', e);
    }
  },

  loadAndPlay: async (track, queue, startIndex) => {
    const tracks = queue || [track];
    const index = startIndex ?? tracks.findIndex((t) => t.id === track.id);

    set({
      currentTrack: track,
      queue: tracks,
      originalQueue: tracks,
      queueIndex: Math.max(0, index),
      isMiniPlayerVisible: true,
      isPlaying: true,
      isBuffering: true,
      currentTime: 0,
      duration: track.duration || 0,
    });

    // If track duration is 0, proactively resolve it from audio header
    if ((!track.duration || track.duration <= 0) && track.fileUri) {
      import('../services/metadata/MetadataExtractor')
        .then(({ parseAudioHeaderDuration, probeAudioDuration }) => {
          const ext = track.format || track.fileUri.split('.').pop() || 'mp3';
          parseAudioHeaderDuration(track.fileUri, track.fileSize || 0, ext)
            .then(async (headerDur) => {
              let dur = headerDur;
              if (!dur || dur <= 0) {
                dur = await probeAudioDuration(track.fileUri);
              }
              if (dur > 0) {
                const rounded = Math.round(dur);
                const { currentTrack: active, queue: q, originalQueue: oq } = get();
                if (active?.id === track.id) {
                  set({
                    duration: rounded,
                    currentTrack: { ...active, duration: rounded },
                    queue: q.map((t) => (t.id === track.id ? { ...t, duration: rounded } : t)),
                    originalQueue: oq.map((t) => (t.id === track.id ? { ...t, duration: rounded } : t)),
                  });
                  try {
                    const { getDatabaseRepos } = require('../hooks/useDatabase');
                    getDatabaseRepos?.()?.tracks?.updateDuration(track.id, rounded);
                  } catch {}
                }
              }
            })
            .catch(() => {});
        })
        .catch(() => {});
    }

    try {
      await AudioService.loadTrack(track);
    } catch (error) {
      console.error('[Player] Failed to load track:', error);
      set({ isPlaying: false, isBuffering: false });
    }
  },

  togglePlayPause: async () => {
    const { isPlaying, currentTrack } = get();
    if (!currentTrack) return;

    try {
      await AudioService.togglePlayPause();
      set({ isPlaying: !isPlaying });
    } catch (error) {
      console.error('[Player] Toggle error:', error);
    }
  },

  seekTo: async (seconds) => {
    try {
      await AudioService.seekTo(seconds);
      set({ currentTime: seconds });
    } catch (error) {
      console.error('[Player] Seek error:', error);
    }
  },

  startSeeking: (position) => {
    set({ isSeeking: true, seekPosition: position });
  },

  finishSeeking: async () => {
    const { seekPosition } = get();
    set({ isSeeking: false });
    await get().seekTo(seekPosition);
  },

  next: async () => {
    const { queue, queueIndex, repeatMode } = get();
    if (queue.length === 0) return;

    let nextIndex = queueIndex + 1;

    if (repeatMode === 'one') {
      nextIndex = queueIndex; // replay same
    } else if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        // End of queue, stop
        set({ isPlaying: false });
        return;
      }
    }

    const nextTrack = queue[nextIndex];
    if (!nextTrack) return;

    set({
      currentTrack: nextTrack,
      queueIndex: nextIndex,
      currentTime: 0,
      duration: nextTrack.duration || 0,
      isBuffering: true,
    });

    try {
      await AudioService.loadTrack(nextTrack);
    } catch (error) {
      console.error('[Player] Next track error:', error);
      set({ isPlaying: false, isBuffering: false });
    }
  },

  previous: async () => {
    const { queue, queueIndex, currentTime } = get();
    if (queue.length === 0) return;

    // If more than 3 seconds in, restart current track
    if (currentTime > 3) {
      await get().seekTo(0);
      return;
    }

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) prevIndex = queue.length - 1;

    const prevTrack = queue[prevIndex];
    if (!prevTrack) return;

    set({
      currentTrack: prevTrack,
      queueIndex: prevIndex,
      currentTime: 0,
      duration: prevTrack.duration || 0,
      isBuffering: true,
    });

    try {
      await AudioService.loadTrack(prevTrack);
    } catch (error) {
      console.error('[Player] Previous track error:', error);
      set({ isPlaying: false, isBuffering: false });
    }
  },

  toggleShuffle: () => {
    const { shuffleEnabled, queue, originalQueue, queueIndex, currentTrack } = get();

    if (shuffleEnabled) {
      // Unshuffle: restore original order
      const newIndex = currentTrack
        ? originalQueue.findIndex((t) => t.id === currentTrack.id)
        : 0;
      set({ shuffleEnabled: false, queue: originalQueue, queueIndex: Math.max(0, newIndex) });
    } else {
      // Shuffle: keep current track at front
      const remaining = queue.filter((_, i) => i !== queueIndex);
      const shuffled = [queue[queueIndex], ...shuffleArray(remaining)];
      set({ shuffleEnabled: true, queue: shuffled, queueIndex: 0 });
    }
  },

  cycleRepeatMode: () => {
    const { repeatMode } = get();
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const current = modes.indexOf(repeatMode);
    set({ repeatMode: modes[(current + 1) % modes.length] });
  },

  setQueue: (tracks, startIndex = 0) => {
    set({ queue: tracks, originalQueue: tracks, queueIndex: startIndex });
  },

  addToQueue: (track) => {
    set((state) => ({
      queue: [...state.queue, track],
      originalQueue: [...state.originalQueue, track],
    }));
  },

  playNext: (track) => {
    set((state) => {
      const nextIndex = state.queueIndex + 1;
      const newQueue = [...state.queue];
      newQueue.splice(nextIndex, 0, track);
      const newOriginal = [...state.originalQueue];
      newOriginal.splice(nextIndex, 0, track);
      return { queue: newQueue, originalQueue: newOriginal };
    });
  },

  updateTrack: (updatedTrack) => {
    set((state) => {
      const isCurrent = state.currentTrack?.id === updatedTrack.id;
      const newQueue = state.queue.map((t) => (t.id === updatedTrack.id ? { ...t, ...updatedTrack } : t));
      const newOriginal = state.originalQueue.map((t) => (t.id === updatedTrack.id ? { ...t, ...updatedTrack } : t));
      return {
        currentTrack: isCurrent && state.currentTrack ? { ...state.currentTrack, ...updatedTrack } : state.currentTrack,
        queue: newQueue,
        originalQueue: newOriginal,
      };
    });
  },

  removeTrack: (trackId) => {
    const { currentTrack, next } = get();
    set((state) => {
      const newQueue = state.queue.filter((t) => t.id !== trackId);
      const newOriginal = state.originalQueue.filter((t) => t.id !== trackId);
      let newIndex = state.queueIndex;
      if (newIndex >= newQueue.length) {
        newIndex = Math.max(0, newQueue.length - 1);
      }
      return { queue: newQueue, originalQueue: newOriginal, queueIndex: newIndex };
    });
    if (currentTrack?.id === trackId) {
      next();
    }
  },

  removeFromQueue: (index) => {
    set((state) => {
      const newQueue = state.queue.filter((_, i) => i !== index);
      let newIndex = state.queueIndex;
      if (index < state.queueIndex) newIndex--;
      if (index === state.queueIndex && newIndex >= newQueue.length) {
        newIndex = Math.max(0, newQueue.length - 1);
      }
      return { queue: newQueue, queueIndex: newIndex };
    });
  },

  clearQueue: () => {
    set({ queue: [], originalQueue: [], queueIndex: 0 });
  },

  updatePlaybackStatus: (time, dur, playing, buffering) => {
    const { isSeeking, currentTrack, queue, originalQueue, duration } = get();
    if (isSeeking) return; // Don't update during seek gesture

    const validDuration = dur > 0 ? dur : duration;
    const updates: any = {
      currentTime: time,
      duration: validDuration,
      isPlaying: playing,
      isBuffering: buffering,
    };

    // Auto-heal current track and queue tracks if duration was 0 or invalid
    if (dur > 0 && currentTrack && (!currentTrack.duration || currentTrack.duration <= 0)) {
      const rounded = Math.round(dur);
      const updatedTrack = { ...currentTrack, duration: rounded };
      updates.currentTrack = updatedTrack;
      updates.queue = queue.map((t) => (t.id === currentTrack.id ? { ...t, duration: rounded } : t));
      updates.originalQueue = originalQueue.map((t) => (t.id === currentTrack.id ? { ...t, duration: rounded } : t));

      try {
        const { getDatabaseRepos } = require('../hooks/useDatabase');
        const repos = getDatabaseRepos?.();
        if (repos?.tracks) {
          repos.tracks.updateDuration(currentTrack.id, rounded);
        }
      } catch {}
    }

    set(updates);
  },

  handleTrackEnded: async () => {
    await get().next();
  },

  setNowPlayingOpen: (open) => set({ isNowPlayingOpen: open }),
  setQueueVisible: (visible) => set({ isQueueVisible: visible }),
}));
