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
  private _trackEndedFired = false;

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

    // Proactively heal corrupted stream:// or stale desktop IP addresses
    let playUri = track.fileUri;
    if (!playUri || playUri.startsWith('stream://') || (playUri.startsWith('http://') && playUri.includes('/api/sync/audio/'))) {
      try {
        const { getDatabaseRepos } = require('../../hooks/useDatabase');
        const repos = getDatabaseRepos?.();
        const pairedDevices = repos?.pairedDevices?.getAll?.() || [];
        const activeDevice = pairedDevices[0];
        if (activeDevice) {
          if (!playUri || playUri.startsWith('stream://')) {
            const encodedTitle = encodeURIComponent(track.title);
            playUri = `http://${activeDevice.ip}:${activeDevice.port}/api/sync/audio/by-title/${encodedTitle}`;
            track.fileUri = playUri;
            if (repos?.tracks?.updateFileUri) {
              const artUri = `http://${activeDevice.ip}:${activeDevice.port}/api/sync/artwork/by-title/${encodedTitle}`;
              repos.tracks.updateFileUri(track.id, playUri, 'stream', undefined, artUri);
              track.artworkUri = artUri;
            }
          } else if (playUri.startsWith('http://') && !playUri.includes(activeDevice.ip)) {
            // Live desktop IP changed on local WiFi
            playUri = playUri.replace(/http:\/\/[^/]+(?::\d+)?/, `http://${activeDevice.ip}:${activeDevice.port}`);
            track.fileUri = playUri;
            if (repos?.tracks?.updateFileUri) {
              repos.tracks.updateFileUri(track.id, playUri);
            }
          }
        }
      } catch {
        // Ignore resolution error
      }
    }

    if (!playUri || playUri.startsWith('stream://')) {
      this.events?.onError(`Playback error: invalid audio URL (${playUri || 'empty'})`);
      return;
    }

    this._trackEndedFired = false;

    try {
      const player = createAudioPlayer(
        { uri: playUri },
        { updateInterval: 500 }
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
        player.setActiveForLockScreen(
          true,
          {
            title: track.title,
            artist: anyTrack.artist || anyTrack.artistName || undefined,
            albumTitle: anyTrack.album || anyTrack.albumTitle || undefined,
            artworkUrl: track.artworkUri || undefined,
          },
          {
            showSeekForward: true,
            showSeekBackward: true,
            isLiveStream: false,
          }
        );
      } catch {
        // Lock Screen controls optional in dev environments
      }

      this.player = player;
    } catch (err: any) {
      this.events?.onError(`Failed to load track: ${err?.message || err}`);
    }
  }

  /**
   * Update Lock Screen & Control Center Now Playing metadata and playback options.
   */
  updateLockScreen(track?: MobileTrack | null, isPlaying?: boolean): void {
    if (!this.player || !track) return;
    try {
      const anyTrack = track as any;
      this.player.setActiveForLockScreen(
        true,
        {
          title: track.title,
          artist: anyTrack.artist || anyTrack.artistName || undefined,
          albumTitle: anyTrack.album || anyTrack.albumTitle || undefined,
          artworkUrl: track.artworkUri || undefined,
        },
        {
          showSeekForward: true,
          showSeekBackward: true,
          isLiveStream: false,
        }
      );
    } catch {
      // Optional
    }
  }

  private handlePlaybackStatus(status: AudioStatus): void {
    if (status.error) {
      this.events?.onError(`Playback error: ${status.error}`);
      return;
    }

    const rawTime = status.currentTime || 0;
    const rawDur = status.duration || 0;
    // Clamp currentTime so it never exceeds duration (prevents timeline overshoot)
    const clampedTime = rawDur > 0 ? Math.min(rawTime, rawDur) : rawTime;

    this.events?.onPlaybackStatusUpdate({
      isPlaying: status.playing,
      isBuffering: status.isBuffering,
      currentTime: clampedTime,
      duration: rawDur,
      isLoaded: status.isLoaded,
    });

    if (status.didJustFinish && !this.player?.loop && !this._trackEndedFired) {
      this._trackEndedFired = true;
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
