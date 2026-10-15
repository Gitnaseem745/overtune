/**
 * Overtone iOS — Widget Service
 *
 * Coordinates data synchronization between the Overtone React Native
 * app and iOS Home Screen Widgets (Small, Medium, Large) via App Groups
 * and local shared storage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { MobileTrack } from '../../domain/models';

export const APP_GROUP_IDENTIFIER = 'group.com.overtone.music';
export const WIDGET_STORAGE_KEY = 'overtone_now_playing_data';

export interface WidgetQueueTrack {
  id: number;
  title: string;
  artist: string;
  duration?: number;
}

export interface WidgetPlaybackState {
  trackId: number;
  title: string;
  artist: string;
  album: string;
  artworkBase64?: string | null;
  isPlaying: boolean;
  progress: number; // 0.0 to 1.0
  currentTime: number;
  duration: number;
  updatedAt: number;
  queue: WidgetQueueTrack[];
}

class WidgetServiceImpl {
  private lastSavedState: WidgetPlaybackState | null = null;
  private lastUpdateTimestamp = 0;

  /**
   * Update the widget timeline with the latest playback state and queue.
   */
  async updatePlayback(
    track: MobileTrack | null,
    isPlaying: boolean,
    currentTime: number,
    duration: number,
    queue: MobileTrack[] = []
  ): Promise<void> {
    if (!track) {
      await this.clearPlayback();
      return;
    }

    const safeDuration = duration > 0 ? duration : track.duration || 180;
    const safeCurrentTime = Math.max(0, Math.min(safeDuration, currentTime));
    const progress = safeDuration > 0 ? safeCurrentTime / safeDuration : 0;

    const queueItems: WidgetQueueTrack[] = queue.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.title,
      artist: (t as any).artist || (t as any).artistName || 'Unknown Artist',
      duration: t.duration,
    }));

    const state: WidgetPlaybackState = {
      trackId: track.id,
      title: track.title,
      artist: (track as any).artist || (track as any).artistName || 'Overtone Music',
      album: (track as any).album || (track as any).albumTitle || 'Sleek Collection',
      artworkBase64: (track as any).artworkBase64 || null,
      isPlaying,
      progress,
      currentTime: safeCurrentTime,
      duration: safeDuration,
      updatedAt: Date.now(),
      queue: queueItems,
    };

    // Throttle progress writes to at most once per 2 seconds unless major change or seek jump
    const isMajorChange =
      !this.lastSavedState ||
      this.lastSavedState.trackId !== state.trackId ||
      this.lastSavedState.isPlaying !== state.isPlaying ||
      Math.abs(this.lastSavedState.currentTime - state.currentTime) >= 3 ||
      Math.abs(Date.now() - this.lastUpdateTimestamp) > 2000;

    if (!isMajorChange) return;

    this.lastSavedState = state;
    this.lastUpdateTimestamp = Date.now();

    try {
      await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(state));

      // In iOS native environment, if native widget reload is available, notify WidgetCenter
      if (typeof Platform !== 'undefined' && Platform?.OS === 'ios') {
        try {
          const { NativeModules } = require('react-native');
          NativeModules?.OvertoneWidgetBridge?.reloadWidgets?.();
        } catch {
          // Native module optional in Expo Go / web
        }
      }
    } catch (err) {
      console.warn('[WidgetService] Failed to persist widget state:', err);
    }
  }

  /**
   * Clear widget playback when queue is empty or stopped.
   */
  async clearPlayback(): Promise<void> {
    this.lastSavedState = null;
    try {
      await AsyncStorage.removeItem(WIDGET_STORAGE_KEY);
    } catch {
      // Ignore cleanup error
    }
  }

  /**
   * Read the currently saved widget playback state.
   */
  async getCurrentState(): Promise<WidgetPlaybackState | null> {
    if (this.lastSavedState) return this.lastSavedState;
    try {
      const raw = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
      if (raw) {
        this.lastSavedState = JSON.parse(raw);
        return this.lastSavedState;
      }
    } catch {
      // Ignore
    }
    return null;
  }
}

export const WidgetService = new WidgetServiceImpl();
