/**
 * Overtone iOS — Live Activity & Dynamic Island Service
 *
 * Manages Apple ActivityKit Live Activities and Dynamic Island
 * presentation states (expanded, compact leading, compact trailing, minimal)
 * during background audio playback.
 */

import { Platform } from 'react-native';
import type { MobileTrack } from '../../domain/models';

export interface LiveActivityState {
  activityId?: string;
  isActive: boolean;
  trackTitle: string;
  artistName: string;
  albumTitle: string;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  artworkBase64?: string | null;
  updatedAt: number;
}

class LiveActivityServiceImpl {
  private currentState: LiveActivityState | null = null;
  private lastUpdateTimestamp = 0;

  /**
   * Whether Live Activities and Dynamic Island are supported on the current device.
   * Requires iOS 16.1+ and physical or simulator device.
   */
  isSupported(): boolean {
    try {
      if (typeof Platform === 'undefined' || !Platform?.OS) return false;
      if (Platform.OS !== 'ios') return false;
      const majorVersion = parseInt(String(Platform.Version), 10);
      return majorVersion >= 16;
    } catch {
      return false;
    }
  }

  /**
   * Start a new Live Activity for the Dynamic Island when playback begins.
   */
  async start(
    track: MobileTrack,
    isPlaying: boolean = true,
    duration: number = 0
  ): Promise<void> {
    const safeDuration = duration > 0 ? duration : track.duration || 180;
    const state: LiveActivityState = {
      isActive: true,
      trackTitle: track.title,
      artistName: (track as any).artist || (track as any).artistName || 'Overtone Music',
      albumTitle: (track as any).album || (track as any).albumTitle || 'Sleek Collection',
      isPlaying,
      progress: 0,
      currentTime: 0,
      duration: safeDuration,
      artworkBase64: (track as any).artworkBase64 || null,
      updatedAt: Date.now(),
    };

    this.currentState = state;
    this.lastUpdateTimestamp = Date.now();

    if (this.isSupported()) {
      try {
        const { NativeModules } = require('react-native');
        NativeModules?.OvertoneWidgetBridge?.startLiveActivity?.(state);
      } catch (err) {
        // Native ActivityKit module optional in dev client
      }
    }
  }

  /**
   * Update the Dynamic Island state (e.g. progress tick, play/pause toggle).
   */
  async update(
    track: MobileTrack,
    isPlaying: boolean,
    currentTime: number,
    duration: number
  ): Promise<void> {
    if (!this.currentState?.isActive) {
      await this.start(track, isPlaying, duration);
      return;
    }

    const safeDuration = duration > 0 ? duration : track.duration || 180;
    const safeCurrent = Math.max(0, Math.min(safeDuration, currentTime));
    const progress = safeDuration > 0 ? safeCurrent / safeDuration : 0;

    const isMajorChange =
      this.currentState.isPlaying !== isPlaying ||
      this.currentState.trackTitle !== track.title ||
      Math.abs(Date.now() - this.lastUpdateTimestamp) > 1500;

    if (!isMajorChange) return;

    this.currentState = {
      ...this.currentState,
      trackTitle: track.title,
      artistName: (track as any).artist || (track as any).artistName || 'Overtone Music',
      albumTitle: (track as any).album || (track as any).albumTitle || 'Sleek Collection',
      isPlaying,
      progress,
      currentTime: safeCurrent,
      duration: safeDuration,
      updatedAt: Date.now(),
    };
    this.lastUpdateTimestamp = Date.now();

    if (this.isSupported()) {
      try {
        const { NativeModules } = require('react-native');
        NativeModules?.OvertoneWidgetBridge?.updateLiveActivity?.(this.currentState);
      } catch {
        // Optional
      }
    }
  }

  /**
   * End the Live Activity and dismiss the Dynamic Island presentation.
   */
  async end(): Promise<void> {
    if (!this.currentState?.isActive) return;

    this.currentState = null;

    if (this.isSupported()) {
      try {
        const { NativeModules } = require('react-native');
        NativeModules?.OvertoneWidgetBridge?.endLiveActivity?.();
      } catch {
        // Optional
      }
    }
  }

  getCurrentState(): LiveActivityState | null {
    return this.currentState;
  }
}

export const LiveActivityService = new LiveActivityServiceImpl();
