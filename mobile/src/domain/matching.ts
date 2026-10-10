/**
 * Overtone iOS — Track Matching Logic
 *
 * Deterministic matching: normalized title + artist, with album/duration as confidence.
 * Presents ambiguous or missing matches for review rather than silently selecting.
 */

import type { SyncPlaylistTrack, TrackMatchResult, MobileTrack } from './models';

/** Normalize a string for comparison: lowercase, trim, collapse whitespace, strip accents. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Check if two durations are close enough (within 3 seconds). */
function durationClose(a: number, b: number, toleranceSec = 3): boolean {
  return Math.abs(a - b) <= toleranceSec;
}

/**
 * Match a single synced track against the local library.
 * Returns the best match with a confidence level.
 */
export function matchTrack(
  syncTrack: SyncPlaylistTrack,
  localTracks: MobileTrack[],
  getArtistName: (id: number | null) => string,
  getAlbumTitle: (id: number | null) => string
): TrackMatchResult {
  const normTitle = normalize(syncTrack.title);
  const normArtist = normalize(syncTrack.artist);
  const normAlbum = normalize(syncTrack.album);

  let bestMatch: MobileTrack | null = null;
  let bestConfidence: 'exact' | 'fuzzy' | 'unmatched' = 'unmatched';
  let matchReason = 'No matching track found in library';

  for (const local of localTracks) {
    const localTitle = normalize(local.title);
    const localArtist = normalize(getArtistName(local.artistId));
    const localAlbum = normalize(getAlbumTitle(local.albumId));

    // Exact: title + artist match
    if (localTitle === normTitle && localArtist === normArtist) {
      // Check album and duration for extra confidence
      const albumMatch = localAlbum === normAlbum;
      const durMatch = durationClose(local.duration, syncTrack.duration);

      if (albumMatch && durMatch) {
        return {
          syncTrack,
          localTrackId: local.id,
          confidence: 'exact',
          matchReason: 'Title, artist, album, and duration match',
        };
      }

      if (albumMatch || durMatch) {
        bestMatch = local;
        bestConfidence = 'exact';
        matchReason = albumMatch
          ? 'Title, artist, and album match'
          : 'Title, artist, and duration match';
      } else if (bestConfidence !== 'exact') {
        bestMatch = local;
        bestConfidence = 'exact';
        matchReason = 'Title and artist match';
      }
    }

    // Fuzzy: title match with partial artist
    if (
      bestConfidence === 'unmatched' &&
      localTitle === normTitle &&
      (localArtist.includes(normArtist) || normArtist.includes(localArtist))
    ) {
      bestMatch = local;
      bestConfidence = 'fuzzy';
      matchReason = 'Title matches, artist is a partial match';
    }
  }

  return {
    syncTrack,
    localTrackId: bestMatch?.id ?? null,
    confidence: bestConfidence,
    matchReason,
  };
}

/**
 * Match all tracks in a sync playlist against the local library.
 */
export function matchPlaylistTracks(
  syncTracks: SyncPlaylistTrack[],
  localTracks: MobileTrack[],
  getArtistName: (id: number | null) => string,
  getAlbumTitle: (id: number | null) => string
): TrackMatchResult[] {
  return syncTracks.map((st) =>
    matchTrack(st, localTracks, getArtistName, getAlbumTitle)
  );
}
