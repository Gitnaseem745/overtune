/**
 * Lyrics Service Tests
 *
 * Verifies LRC parser, synchronized timestamp extraction,
 * plain-text fallback, and active line tracking with offsets.
 */

import { describe, it, expect } from '@jest/globals';
import { LyricsService } from '../src/services/lyrics/LyricsService';

describe('LyricsService', () => {
  const sampleLRC = `
[ti:Midnight City]
[ar:M83]
[al:Hurry Up, We're Dreaming]
[00:10.50]Waiting in a car
[00:15.20]Waiting for a ride in the dark
[00:22.00]The city is my church
[00:28.80]It wraps me in the blinding twilight
`;

  it('parses synchronized LRC content correctly into sorted LyricLine objects', () => {
    const lines = LyricsService.parseLRC(sampleLRC);
    expect(lines.length).toBe(4);

    expect(lines[0].text).toBe('Waiting in a car');
    expect(lines[0].time).toBe(10.5);

    expect(lines[1].text).toBe('Waiting for a ride in the dark');
    expect(lines[1].time).toBe(15.2);

    expect(lines[2].text).toBe('The city is my church');
    expect(lines[2].time).toBe(22.0);

    expect(lines[3].text).toBe('It wraps me in the blinding twilight');
    expect(lines[3].time).toBe(28.8);
  });

  it('handles multi-timestamp lines in LRC', () => {
    const multiLRC = `[00:05.00][00:15.00]Chorus repeats here`;
    const lines = LyricsService.parseLRC(multiLRC);
    expect(lines.length).toBe(2);
    expect(lines[0].time).toBe(5.0);
    expect(lines[0].text).toBe('Chorus repeats here');
    expect(lines[1].time).toBe(15.0);
    expect(lines[1].text).toBe('Chorus repeats here');
  });

  it('correctly tracks active line based on current playback time', () => {
    const lines = LyricsService.parseLRC(sampleLRC);

    // Before any line begins
    expect(LyricsService.getActiveLineIndex(lines, 5.0, 0)).toBe(-1);

    // During first line
    expect(LyricsService.getActiveLineIndex(lines, 12.0, 0)).toBe(0);

    // During second line
    expect(LyricsService.getActiveLineIndex(lines, 18.0, 0)).toBe(1);

    // During last line
    expect(LyricsService.getActiveLineIndex(lines, 35.0, 0)).toBe(3);
  });

  it('applies per-track lyric timing offset correctly', () => {
    const lines = LyricsService.parseLRC(sampleLRC);

    // At 10.0s without offset, line 0 hasn't started (it starts at 10.5s)
    expect(LyricsService.getActiveLineIndex(lines, 10.0, 0)).toBe(-1);

    // With a +1000ms offset (audio is ahead of lyrics), effective time is 11.0s, so line 0 is active
    expect(LyricsService.getActiveLineIndex(lines, 10.0, 1000)).toBe(0);

    // With a -1000ms offset (lyrics earlier), at 11.0s effective time is 10.0s, so line 0 is not yet active
    expect(LyricsService.getActiveLineIndex(lines, 11.0, -1000)).toBe(-1);
  });

  it('parses plain text lyrics into static lyric lines', () => {
    const plain = `Line one\nLine two\nLine three`;
    const lines = LyricsService.parsePlainText(plain);
    expect(lines.length).toBe(3);
    expect(lines[0].text).toBe('Line one');
    expect(lines[0].time).toBe(-1);
    expect(lines[1].text).toBe('Line two');
    expect(lines[2].text).toBe('Line three');
  });
});
