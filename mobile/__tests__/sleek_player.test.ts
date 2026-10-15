/**
 * Sleek Player Screen & Controls Tests
 *
 * Validates player store controls, volume clamping, repeat cycling,
 * seeking, and sleek player design tokens.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

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
  },
}));

import { usePlayerStore } from '../src/store/usePlayerStore';
import { sleekTokens } from '../src/design/colors';

describe('Sleek Player Controls & Store Integration', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 214,
      volume: 0.75,
      repeatMode: 'off',
      isSeeking: false,
      seekPosition: 0,
    });
  });

  it('initializes with default volume 0.75 and repeat mode off', () => {
    const state = usePlayerStore.getState();
    expect(state.volume).toBe(0.75);
    expect(state.repeatMode).toBe('off');
    expect(state.isPlaying).toBe(false);
  });

  it('updates and clamps volume between 0.0 and 1.0', async () => {
    await usePlayerStore.getState().setVolume(0.5);
    expect(usePlayerStore.getState().volume).toBe(0.5);

    // Clamp upper bound
    await usePlayerStore.getState().setVolume(1.8);
    expect(usePlayerStore.getState().volume).toBe(1.0);

    // Clamp lower bound
    await usePlayerStore.getState().setVolume(-0.4);
    expect(usePlayerStore.getState().volume).toBe(0.0);
  });

  it('cycles repeat modes: off -> all -> one -> off', () => {
    expect(usePlayerStore.getState().repeatMode).toBe('off');

    usePlayerStore.getState().cycleRepeatMode();
    expect(usePlayerStore.getState().repeatMode).toBe('all');

    usePlayerStore.getState().cycleRepeatMode();
    expect(usePlayerStore.getState().repeatMode).toBe('one');

    usePlayerStore.getState().cycleRepeatMode();
    expect(usePlayerStore.getState().repeatMode).toBe('off');
  });

  it('handles seeking lifecycle correctly', async () => {
    usePlayerStore.getState().startSeeking(45);
    expect(usePlayerStore.getState().isSeeking).toBe(true);
    expect(usePlayerStore.getState().seekPosition).toBe(45);

    await usePlayerStore.getState().finishSeeking();
    expect(usePlayerStore.getState().isSeeking).toBe(false);
    expect(usePlayerStore.getState().currentTime).toBe(45);
  });

  it('contains essential sleek player tokens matching aesthetic', () => {
    expect(sleekTokens.cardBorderRadius).toBe(36);
    expect(sleekTokens.headerGradientStart).toBe('#E68A00');
    expect(sleekTokens.handlePill).toBe('#EAE3D2');
    expect(sleekTokens.textPrimary).toBe('#1F180B');
  });

  it('toggles isNowPlayingOpen state correctly', () => {
    expect(usePlayerStore.getState().isNowPlayingOpen).toBe(false);
    usePlayerStore.getState().setNowPlayingOpen(true);
    expect(usePlayerStore.getState().isNowPlayingOpen).toBe(true);
    usePlayerStore.getState().setNowPlayingOpen(false);
    expect(usePlayerStore.getState().isNowPlayingOpen).toBe(false);
  });

  it('correctly filters touches on the radial volume arc ring versus inner disc', () => {
    const CX = 135;
    const CY = 135;
    const isTouchOnArc = (x: number, y: number) => {
      const dist = Math.sqrt((x - CX) ** 2 + (y - CY) ** 2);
      return dist >= 78 && dist <= 155;
    };

    // Center disc touches (e.g. tapping album art) should NOT be on the arc
    expect(isTouchOnArc(135, 135)).toBe(false);
    expect(isTouchOnArc(150, 150)).toBe(false);
    expect(isTouchOnArc(135, 135 - 50)).toBe(false);

    // Points on the actual volume arc radius (R = 114)
    expect(isTouchOnArc(135, 135 - 114)).toBe(true);
    expect(isTouchOnArc(135 - 114, 135)).toBe(true);

    // Points far outside the arc
    expect(isTouchOnArc(10, 10)).toBe(false);
    expect(isTouchOnArc(260, 260)).toBe(false);
  });

  it('supports playNext, updateTrack, and removeTrack queue actions', () => {
    const track1: any = { id: 1, title: 'Track 1', duration: 180 };
    const track2: any = { id: 2, title: 'Track 2', duration: 200 };
    const track3: any = { id: 3, title: 'Track 3', duration: 220 };

    usePlayerStore.setState({
      currentTrack: track1,
      queue: [track1, track3],
      originalQueue: [track1, track3],
      queueIndex: 0,
    });

    // 1. playNext inserts track2 right after currentTrack (index 1)
    usePlayerStore.getState().playNext(track2);
    expect(usePlayerStore.getState().queue.map((t) => t.id)).toEqual([1, 2, 3]);

    // 2. updateTrack updates track info in place
    usePlayerStore.getState().updateTrack({ id: 2, title: 'Renamed Track 2' } as any);
    expect(usePlayerStore.getState().queue[1].title).toBe('Renamed Track 2');

    // 3. removeTrack removes track from queue
    usePlayerStore.getState().removeTrack(2);
    expect(usePlayerStore.getState().queue.map((t) => t.id)).toEqual([1, 3]);
  });
});
