/**
 * Playlist Duplicate Track Prevention Tests
 *
 * Verifies that a song cannot be added twice to the same playlist,
 * and that duplicate additions return false and are detected by hasTrack.
 */

import { describe, it, expect, jest } from '@jest/globals';
import { PlaylistRepository } from '../src/db/repositories/index';

describe('PlaylistRepository Duplicate Prevention', () => {
  it('detects existing tracks using hasTrack', () => {
    const mockDb = {
      getFirstSync: jest.fn().mockReturnValueOnce({ '1': 1 }).mockReturnValueOnce(null),
      getAllSync: jest.fn(),
      runSync: jest.fn(),
    };

    const repo = new PlaylistRepository(mockDb as any);

    // Track exists
    expect(repo.hasTrack(1, 42)).toBe(true);

    // Track does not exist
    expect(repo.hasTrack(1, 99)).toBe(false);
  });

  it('prevents adding the same song more than once', () => {
    let storedTracks = new Set<string>();

    const mockDb = {
      getFirstSync: jest.fn((query: string, params: any[]) => {
        if (query.includes('SELECT 1 FROM playlist_tracks')) {
          const key = `${params[0]}-${params[1]}`;
          return storedTracks.has(key) ? { 1: 1 } : null;
        }
        if (query.includes('COALESCE(MAX(position)')) {
          return { maxPos: storedTracks.size };
        }
        return null;
      }),
      runSync: jest.fn((query: string, params: any[]) => {
        if (query.includes('INSERT')) {
          storedTracks.add(`${params[0]}-${params[1]}`);
        }
        return { changes: 1 };
      }),
      getAllSync: jest.fn(),
    };

    const repo = new PlaylistRepository(mockDb as any);

    // First addition should succeed
    const firstAdd = repo.addTrack(1, 101);
    expect(firstAdd).toBe(true);
    expect(repo.hasTrack(1, 101)).toBe(true);

    // Duplicate addition should be prevented and return false
    const duplicateAdd = repo.addTrack(1, 101);
    expect(duplicateAdd).toBe(false);

    // A different song can still be added
    const secondAdd = repo.addTrack(1, 102);
    expect(secondAdd).toBe(true);
    expect(repo.hasTrack(1, 102)).toBe(true);
  });
});
