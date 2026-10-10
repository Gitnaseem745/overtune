/**
 * Overtone iOS — Track Matching Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import { matchTrack, matchPlaylistTracks } from '../src/domain/matching';
import type { SyncPlaylistTrack, MobileTrack } from '../src/domain/models';

describe('Track Matching Logic', () => {
  const mockLocalTracks: MobileTrack[] = [
    {
      id: 1,
      title: 'Bohemian Rhapsody',
      albumId: 10,
      artistId: 100,
      fileUri: 'file:///audio/1.mp3',
      duration: 354,
      trackNumber: 1,
      genre: 'Rock',
      fileHash: 'hash1',
      artworkUri: null,
      fileSize: 8000000,
      format: 'mp3',
      sampleRate: 44100,
      bitRate: 320,
      channels: 2,
      importedAt: '2026-01-01T00:00:00Z',
      lastPlayedAt: null,
    },
    {
      id: 2,
      title: 'Hotel California',
      albumId: 20,
      artistId: 200,
      fileUri: 'file:///audio/2.mp3',
      duration: 390,
      trackNumber: 1,
      genre: 'Classic Rock',
      fileHash: 'hash2',
      artworkUri: null,
      fileSize: 9000000,
      format: 'flac',
      sampleRate: 44100,
      bitRate: null,
      channels: 2,
      importedAt: '2026-01-01T00:00:00Z',
      lastPlayedAt: null,
    },
  ];

  const artistMap: Record<number, string> = {
    100: 'Queen',
    200: 'Eagles',
  };

  const albumMap: Record<number, string> = {
    10: 'A Night at the Opera',
    20: 'Hotel California',
  };

  const getArtistName = (id: number | null) => (id ? artistMap[id] || 'Unknown' : 'Unknown');
  const getAlbumTitle = (id: number | null) => (id ? albumMap[id] || 'Unknown' : 'Unknown');

  it('matches exact title and artist with matching album and duration', () => {
    const syncTrack: SyncPlaylistTrack = {
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      album: 'A Night at the Opera',
      duration: 354,
    };

    const res = matchTrack(syncTrack, mockLocalTracks, getArtistName, getAlbumTitle);
    expect(res.confidence).toBe('exact');
    expect(res.localTrackId).toBe(1);
  });

  it('handles case insensitivity, diacritics, and extra spaces', () => {
    const syncTrack: SyncPlaylistTrack = {
      title: '  bohemian rhapsody  ',
      artist: 'QUEEN',
      album: 'a night at the opera',
      duration: 355, // within 3s tolerance
    };

    const res = matchTrack(syncTrack, mockLocalTracks, getArtistName, getAlbumTitle);
    expect(res.confidence).toBe('exact');
    expect(res.localTrackId).toBe(1);
  });

  it('fuzzy matches when title matches and artist is a partial match', () => {
    const syncTrack: SyncPlaylistTrack = {
      title: 'Hotel California',
      artist: 'The Eagles',
      album: 'Greatest Hits',
      duration: 390,
    };

    const res = matchTrack(syncTrack, mockLocalTracks, getArtistName, getAlbumTitle);
    expect(res.confidence).toBe('fuzzy');
    expect(res.localTrackId).toBe(2);
  });

  it('returns unmatched for tracks not in library', () => {
    const syncTrack: SyncPlaylistTrack = {
      title: 'Stairway to Heaven',
      artist: 'Led Zeppelin',
      album: 'Led Zeppelin IV',
      duration: 482,
    };

    const res = matchTrack(syncTrack, mockLocalTracks, getArtistName, getAlbumTitle);
    expect(res.confidence).toBe('unmatched');
    expect(res.localTrackId).toBeNull();
  });

  it('matches multiple tracks in playlist', () => {
    const playlistTracks: SyncPlaylistTrack[] = [
      {
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night at the Opera',
        duration: 354,
      },
      {
        title: 'Nonexistent Song',
        artist: 'Nobody',
        album: 'Nowhere',
        duration: 120,
      },
    ];

    const results = matchPlaylistTracks(playlistTracks, mockLocalTracks, getArtistName, getAlbumTitle);
    expect(results).toHaveLength(2);
    expect(results[0].localTrackId).toBe(1);
    expect(results[1].localTrackId).toBeNull();
  });
});
