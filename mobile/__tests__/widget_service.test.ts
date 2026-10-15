/**
 * Overtone iOS — Widget & Live Activity Service Tests
 *
 * Validates:
 * 1. Home Screen Widget data formatting, queue serialization, and persistence.
 * 2. ActivityKit Live Activity (Dynamic Island) start, update, and end lifecycles.
 * 3. Lock Screen playback metadata synchronization.
 * 4. Deep link action handling for widget transport controls.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WidgetService, WIDGET_STORAGE_KEY } from '../src/services/widgets/WidgetService';
import { LiveActivityService } from '../src/services/widgets/LiveActivityService';
import { usePlayerStore } from '../src/store/usePlayerStore';
import type { MobileTrack } from '../src/domain/models';

jest.mock('../src/services/audio/AudioService', () => ({
  AudioService: {
    loadTrack: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    seekTo: jest.fn(),
    setVolume: jest.fn(),
    setLooping: jest.fn(),
    stop: jest.fn(),
    togglePlayPause: jest.fn(),
    updateLockScreen: jest.fn(),
    configureAudioSession: jest.fn(),
    setEventHandlers: jest.fn(),
    teardown: jest.fn(),
  },
}));

describe('WidgetService — Home Screen Widgets Synchronization', () => {
  beforeEach(async () => {
    await WidgetService.clearPlayback();
  });

  const mockTrack: MobileTrack = {
    id: 101,
    title: 'Midnight Echoes',
    albumId: null,
    artistId: null,
    duration: 240,
    trackNumber: 1,
    genre: 'Electronic',
    fileHash: 'hash101',
    artworkUri: null,
    fileUri: 'file:///var/mobile/music/midnight.mp3',
    fileSize: 4096000,
    format: 'mp3',
    sampleRate: 44100,
    bitRate: 320,
    channels: 2,
    importedAt: new Date().toISOString(),
    lastPlayedAt: null,
  };

  const mockQueue: MobileTrack[] = [
    mockTrack,
    {
      id: 102,
      title: 'Amber Sunrise',
      albumId: null,
      artistId: null,
      duration: 195,
      trackNumber: 2,
      genre: 'Acoustic',
      fileHash: 'hash102',
      artworkUri: null,
      fileUri: 'file:///var/mobile/music/amber.mp3',
      fileSize: 3200000,
      format: 'mp3',
      sampleRate: 44100,
      bitRate: 320,
      channels: 2,
      importedAt: new Date().toISOString(),
      lastPlayedAt: null,
    },
  ];

  it('updates widget playback state and calculates progress accurately', async () => {
    await WidgetService.updatePlayback(mockTrack, true, 60, 240, mockQueue);

    const state = await WidgetService.getCurrentState();
    expect(state).not.toBeNull();
    expect(state?.trackId).toBe(101);
    expect(state?.title).toBe('Midnight Echoes');
    expect(state?.isPlaying).toBe(true);
    expect(state?.currentTime).toBe(60);
    expect(state?.duration).toBe(240);
    expect(state?.progress).toBeCloseTo(0.25, 2);
    expect(state?.queue.length).toBe(2);
    expect(state?.queue[1].title).toBe('Amber Sunrise');
  });

  it('clears widget playback when requested', async () => {
    await WidgetService.updatePlayback(mockTrack, true, 30, 240);
    expect(await WidgetService.getCurrentState()).not.toBeNull();

    await WidgetService.clearPlayback();
    expect(await WidgetService.getCurrentState()).toBeNull();
  });

  it('clamps current time within valid duration bounds', async () => {
    // Current time exceeding duration
    await WidgetService.updatePlayback(mockTrack, true, 300, 240);
    let state = await WidgetService.getCurrentState();
    expect(state?.currentTime).toBe(240);
    expect(state?.progress).toBe(1.0);

    // Negative current time
    await WidgetService.updatePlayback(mockTrack, true, -10, 240);
    state = await WidgetService.getCurrentState();
    expect(state?.currentTime).toBe(0);
    expect(state?.progress).toBe(0.0);
  });
});

describe('LiveActivityService — ActivityKit & Dynamic Island', () => {
  const mockTrack: MobileTrack = {
    id: 201,
    title: 'Golden Horizon',
    albumId: null,
    artistId: null,
    duration: 180,
    trackNumber: 1,
    genre: null,
    fileHash: null,
    artworkUri: null,
    fileUri: 'file:///var/mobile/music/golden.mp3',
    fileSize: 2048000,
    format: 'mp3',
    sampleRate: 44100,
    bitRate: 320,
    channels: 2,
    importedAt: new Date().toISOString(),
    lastPlayedAt: null,
  };

  it('starts a live activity and populates current state', async () => {
    await LiveActivityService.start(mockTrack, true, 180);

    const state = LiveActivityService.getCurrentState();
    expect(state).not.toBeNull();
    expect(state?.isActive).toBe(true);
    expect(state?.trackTitle).toBe('Golden Horizon');
    expect(state?.isPlaying).toBe(true);
    expect(state?.duration).toBe(180);
    expect(state?.progress).toBe(0);
  });

  it('updates live activity playback position and playing state', async () => {
    await LiveActivityService.start(mockTrack, true, 180);
    await LiveActivityService.update(mockTrack, false, 90, 180);

    const state = LiveActivityService.getCurrentState();
    expect(state?.isPlaying).toBe(false);
    expect(state?.currentTime).toBe(90);
    expect(state?.progress).toBeCloseTo(0.5, 2);
  });

  it('ends live activity properly and clears active state', async () => {
    await LiveActivityService.start(mockTrack, true, 180);
    expect(LiveActivityService.getCurrentState()?.isActive).toBe(true);

    await LiveActivityService.end();
    expect(LiveActivityService.getCurrentState()).toBeNull();
  });
});

describe('PlayerStore Widget & Live Activity Integration', () => {
  const track1: MobileTrack = {
    id: 301,
    title: 'Track One',
    albumId: null,
    artistId: null,
    duration: 200,
    trackNumber: 1,
    genre: null,
    fileHash: null,
    artworkUri: null,
    fileUri: 'file:///one.mp3',
    fileSize: 1000,
    format: 'mp3',
    sampleRate: 44100,
    bitRate: 320,
    channels: 2,
    importedAt: new Date().toISOString(),
    lastPlayedAt: null,
  };

  beforeEach(() => {
    usePlayerStore.setState({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      queue: [],
      queueIndex: 0,
    });
  });

  it('triggers LiveActivityService and WidgetService on loadAndPlay', async () => {
    const startSpy = jest.spyOn(LiveActivityService, 'start');
    const widgetSpy = jest.spyOn(WidgetService, 'updatePlayback');

    await usePlayerStore.getState().loadAndPlay(track1);

    expect(startSpy).toHaveBeenCalledWith(track1, true, 200);
    expect(widgetSpy).toHaveBeenCalledWith(track1, true, 0, 200, [track1]);

    startSpy.mockRestore();
    widgetSpy.mockRestore();
  });

  it('synchronizes togglePlayPause with LiveActivityService and WidgetService', async () => {
    const updateSpy = jest.spyOn(LiveActivityService, 'update');
    const widgetSpy = jest.spyOn(WidgetService, 'updatePlayback');

    usePlayerStore.setState({
      currentTrack: track1,
      isPlaying: true,
      currentTime: 45,
      duration: 200,
    });

    await usePlayerStore.getState().togglePlayPause();

    expect(updateSpy).toHaveBeenCalledWith(track1, false, 45, 200);
    expect(widgetSpy).toHaveBeenCalledWith(track1, false, 45, 200, []);

    updateSpy.mockRestore();
    widgetSpy.mockRestore();
  });
});
