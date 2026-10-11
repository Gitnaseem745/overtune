/**
 * Overtone iOS — Audio Service
 *
 * Service boundary for playback: queue, current item, state,
 * seek, interruptions, remote controls, and player teardown.
 * Uses expo-audio (official Expo SDK 57 audio module).
 */

import {
  setAudioModeAsync,
  createAudioPlayer,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import type { MobileTrack, RepeatMode } from '../../domain/models';

export interface AudioServiceEvents {
  onPlaybackStatusUpdate: (status: PlaybackStatus) => void;
  onTrackEnded: () => void;
  onError: (error: string) => void;
}

export interface PlaybackStatus {
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  isLoaded: boolean;
}

class AudioServiceImpl {
  private player: AudioPlayer | null = null;
  private events: AudioServiceEvents | null = null;
  private isAudioSessionConfigured = false;
  private statusSubscription: { remove: () => void } | null = null;

  /**
   * Configure the iOS audio session for background playback and Lock Screen controls.
   */
  async configureAudioSession(): Promise<void> {
    if (this.isAudioSessionConfigured) return;

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });
      this.isAudioSessionConfigured = true;
    } catch (err) {
      console.warn('[AudioService] Failed to configure audio session:', err);
    }
  }

  setEventHandlers(events: AudioServiceEvents): void {
    this.events = events;
  }

  /**
   * Load and play a track.
   */
  async loadTrack(track: MobileTrack, startPosition?: number): Promise<void> {
    await this.configureAudioSession();

    // Release previous player
    if (this.player) {
      this.statusSubscription?.remove();
      this.statusSubscription = null;
      try {
        this.player.pause();
        this.player.remove();
      } catch {
        // Ignore cleanup error
      }
      this.player = null;
    }

    try {
      const player = createAudioPlayer(
        { uri: track.fileUri },
        { updateInterval: 250 }
      );

      this.statusSubscription = player.addListener(
        'playbackStatusUpdate',
        (status: AudioStatus) => {
          this.handlePlaybackStatus(status);
        }
      );

      if (startPosition && startPosition > 0) {
        await player.seekTo(startPosition);
      }

      player.play();

      try {
        const anyTrack = track as any;
        player.setActiveForLockScreen(true, {
          title: track.title,
          artist: anyTrack.artist || anyTrack.artistName || undefined,
          albumTitle: anyTrack.album || anyTrack.albumTitle || undefined,
        });
      } catch {
        // Lock Screen controls optional in dev environments
      }

      this.player = player;
    } catch (err: any) {
      this.events?.onError(`Failed to load track: ${err?.message || err}`);
    }
  }

  private handlePlaybackStatus(status: AudioStatus): void {
    if (status.error) {
      this.events?.onError(`Playback error: ${status.error}`);
      return;
    }

    this.events?.onPlaybackStatusUpdate({
      isPlaying: status.playing,
      isBuffering: status.isBuffering,
      currentTime: status.currentTime || 0,
      duration: status.duration || 0,
      isLoaded: status.isLoaded,
    });

    if (status.didJustFinish && !this.player?.loop) {
      this.events?.onTrackEnded();
    }
  }

  async play(): Promise<void> {
    this.player?.play();
  }

  async pause(): Promise<void> {
    this.player?.pause();
  }

  async togglePlayPause(): Promise<void> {
    if (!this.player) return;
    if (this.player.playing) {
      this.player.pause();
    } else {
      this.player.play();
    }
  }

  async seekTo(seconds: number): Promise<void> {
    await this.player?.seekTo(seconds);
  }

  async setVolume(volume: number): Promise<void> {
    if (this.player) {
      this.player.volume = Math.max(0, Math.min(1, volume));
    }
  }

  async setLooping(loop: boolean): Promise<void> {
    if (this.player) {
      this.player.loop = loop;
    }
  }

  async stop(): Promise<void> {
    if (this.player) {
      this.statusSubscription?.remove();
      this.statusSubscription = null;
      try {
        this.player.pause();
        this.player.remove();
      } catch {
        // Ignore cleanup error
      }
      this.player = null;
    }
  }

  async getStatus(): Promise<PlaybackStatus | null> {
    if (!this.player) return null;
    return {
      isPlaying: this.player.playing,
      isBuffering: this.player.isBuffering,
      currentTime: this.player.currentTime || 0,
      duration: this.player.duration || 0,
      isLoaded: this.player.isLoaded,
    };
  }

  isLoaded(): boolean {
    return this.player !== null && this.player.isLoaded;
  }

  async teardown(): Promise<void> {
    await this.stop();
    this.events = null;
    this.isAudioSessionConfigured = false;
  }
}

/** Singleton AudioService instance */
export const AudioService = new AudioServiceImpl();
