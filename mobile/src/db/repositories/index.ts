/**
 * Overtone iOS — Database Repository Layer
 *
 * Typed service boundary for all SQLite operations.
 * Database is source of truth for persistent library/playlist data.
 */

import type {
  MobileTrack,
  MobileAlbum,
  MobileArtist,
  MobilePlaylist,
  PlayHistoryEntry,
  PersistedPlaybackState,
  PairedDevice,
  SearchResults,
  RepeatMode,
} from '../../domain/models';

type SQLiteDatabase = any;

// ── Track Repository ───────────────────────────────────────────────────

export class TrackRepository {
  constructor(private db: SQLiteDatabase) {}

  getAll(orderBy: string = 'title COLLATE NOCASE ASC'): MobileTrack[] {
    return this.db.getAllSync(
      `SELECT id, title, album_id as albumId, artist_id as artistId,
              file_uri as fileUri, duration, track_number as trackNumber,
              genre, file_hash as fileHash, artwork_uri as artworkUri,
              file_size as fileSize, format, sample_rate as sampleRate,
              bit_rate as bitRate, channels, imported_at as importedAt,
              last_played_at as lastPlayedAt
       FROM tracks ORDER BY ${orderBy}`
    ) as MobileTrack[];
  }

  getById(id: number): MobileTrack | null {
    const row = this.db.getFirstSync(
      `SELECT id, title, album_id as albumId, artist_id as artistId,
              file_uri as fileUri, duration, track_number as trackNumber,
              genre, file_hash as fileHash, artwork_uri as artworkUri,
              file_size as fileSize, format, sample_rate as sampleRate,
              bit_rate as bitRate, channels, imported_at as importedAt,
              last_played_at as lastPlayedAt
       FROM tracks WHERE id = ?`,
      [id]
    );
    return (row as MobileTrack) ?? null;
  }

  getByIds(ids: number[]): MobileTrack[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    return this.db.getAllSync(
      `SELECT id, title, album_id as albumId, artist_id as artistId,
              file_uri as fileUri, duration, track_number as trackNumber,
              genre, file_hash as fileHash, artwork_uri as artworkUri,
              file_size as fileSize, format, sample_rate as sampleRate,
              bit_rate as bitRate, channels, imported_at as importedAt,
              last_played_at as lastPlayedAt
       FROM tracks WHERE id IN (${placeholders})`,
      ids
    ) as MobileTrack[];
  }

  getByAlbum(albumId: number): MobileTrack[] {
    return this.db.getAllSync(
      `SELECT id, title, album_id as albumId, artist_id as artistId,
              file_uri as fileUri, duration, track_number as trackNumber,
              genre, file_hash as fileHash, artwork_uri as artworkUri,
              file_size as fileSize, format, sample_rate as sampleRate,
              bit_rate as bitRate, channels, imported_at as importedAt,
              last_played_at as lastPlayedAt
       FROM tracks WHERE album_id = ? ORDER BY track_number ASC, title COLLATE NOCASE ASC`,
      [albumId]
    ) as MobileTrack[];
  }

  getByArtist(artistId: number): MobileTrack[] {
    return this.db.getAllSync(
      `SELECT id, title, album_id as albumId, artist_id as artistId,
              file_uri as fileUri, duration, track_number as trackNumber,
              genre, file_hash as fileHash, artwork_uri as artworkUri,
              file_size as fileSize, format, sample_rate as sampleRate,
              bit_rate as bitRate, channels, imported_at as importedAt,
              last_played_at as lastPlayedAt
       FROM tracks WHERE artist_id = ? ORDER BY title COLLATE NOCASE ASC`,
      [artistId]
    ) as MobileTrack[];
  }

  insert(track: Omit<MobileTrack, 'id'>): number {
    const result = this.db.runSync(
      `INSERT INTO tracks (title, album_id, artist_id, file_uri, duration,
          track_number, genre, file_hash, artwork_uri, file_size, format,
          sample_rate, bit_rate, channels, imported_at, last_played_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        track.title, track.albumId, track.artistId, track.fileUri,
        track.duration, track.trackNumber, track.genre, track.fileHash,
        track.artworkUri, track.fileSize, track.format, track.sampleRate,
        track.bitRate, track.channels, track.importedAt, track.lastPlayedAt,
      ]
    );
    return result.lastInsertRowId;
  }

  updateLastPlayed(id: number): void {
    this.db.runSync(
      'UPDATE tracks SET last_played_at = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
  }

  updateMetadata(
    id: number,
    data: {
      title?: string;
      artistName?: string;
      albumTitle?: string;
      genre?: string;
      trackNumber?: number;
    },
    artistRepo?: ArtistRepository,
    albumRepo?: AlbumRepository
  ): boolean {
    let artistId: number | null | undefined = undefined;
    if (data.artistName !== undefined && artistRepo) {
      const trimmed = data.artistName.trim();
      artistId = trimmed ? artistRepo.findOrCreate(trimmed) : null;
    }

    let albumId: number | null | undefined = undefined;
    if (data.albumTitle !== undefined && albumRepo) {
      const trimmed = data.albumTitle.trim();
      albumId = trimmed ? albumRepo.findOrCreate(trimmed, artistId !== undefined ? artistId : null) : null;
    }

    const fields: string[] = [];
    const values: any[] = [];
    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title.trim());
    }
    if (artistId !== undefined) {
      fields.push('artist_id = ?');
      values.push(artistId);
    }
    if (albumId !== undefined) {
      fields.push('album_id = ?');
      values.push(albumId);
    }
    if (data.genre !== undefined) {
      fields.push('genre = ?');
      values.push(data.genre.trim() || null);
    }
    if (data.trackNumber !== undefined) {
      fields.push('track_number = ?');
      values.push(data.trackNumber);
    }

    if (fields.length === 0) return false;
    values.push(id);
    const result = this.db.runSync(
      `UPDATE tracks SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.changes > 0;
  }

  updateDuration(id: number, duration: number): boolean {
    if (!id || duration <= 0) return false;
    const rounded = Math.round(duration);
    const result = this.db.runSync(
      'UPDATE tracks SET duration = ? WHERE id = ?',
      [rounded, id]
    );
    return result.changes > 0;
  }

  updateFileUri(
    id: number,
    fileUri: string,
    format?: string,
    fileSize?: number,
    artworkUri?: string
  ): boolean {
    const fields = ['file_uri = ?'];
    const values: any[] = [fileUri];
    if (format) {
      fields.push('format = ?');
      values.push(format);
    }
    if (fileSize !== undefined) {
      fields.push('file_size = ?');
      values.push(fileSize);
    }
    if (artworkUri) {
      fields.push('artwork_uri = ?');
      values.push(artworkUri);
    }
    values.push(id);
    const result = this.db.runSync(
      `UPDATE tracks SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.changes > 0;
  }

  delete(id: number): boolean {
    try {
      this.db.runSync('DELETE FROM playlist_tracks WHERE track_id = ?', [id]);
      this.db.runSync('DELETE FROM favorites WHERE track_id = ?', [id]);
      this.db.runSync('DELETE FROM play_history WHERE track_id = ?', [id]);
    } catch {
      // Ignored if cascade handled by SQLite
    }
    const result = this.db.runSync('DELETE FROM tracks WHERE id = ?', [id]);
    return result.changes > 0;
  }

  getCount(): number {
    const row = this.db.getFirstSync('SELECT COUNT(*) as count FROM tracks');
    return (row as any)?.count ?? 0;
  }

  existsByFileUri(fileUri: string): boolean {
    const row = this.db.getFirstSync(
      'SELECT 1 FROM tracks WHERE file_uri = ? LIMIT 1',
      [fileUri]
    );
    return row !== null && row !== undefined;
  }

  getRecentlyPlayed(limit: number = 20): MobileTrack[] {
    return this.db.getAllSync(
      `SELECT id, title, album_id as albumId, artist_id as artistId,
              file_uri as fileUri, duration, track_number as trackNumber,
              genre, file_hash as fileHash, artwork_uri as artworkUri,
              file_size as fileSize, format, sample_rate as sampleRate,
              bit_rate as bitRate, channels, imported_at as importedAt,
              last_played_at as lastPlayedAt
       FROM tracks WHERE last_played_at IS NOT NULL
       ORDER BY last_played_at DESC LIMIT ?`,
      [limit]
    ) as MobileTrack[];
  }

  getRecentlyAdded(limit: number = 20): MobileTrack[] {
    return this.db.getAllSync(
      `SELECT id, title, album_id as albumId, artist_id as artistId,
              file_uri as fileUri, duration, track_number as trackNumber,
              genre, file_hash as fileHash, artwork_uri as artworkUri,
              file_size as fileSize, format, sample_rate as sampleRate,
              bit_rate as bitRate, channels, imported_at as importedAt,
              last_played_at as lastPlayedAt
       FROM tracks ORDER BY imported_at DESC LIMIT ?`,
      [limit]
    ) as MobileTrack[];
  }

  getTotalDuration(): number {
    const row = this.db.getFirstSync(
      'SELECT COALESCE(SUM(duration), 0) as total FROM tracks'
    );
    return (row as any)?.total ?? 0;
  }

  getTotalSize(): number {
    const row = this.db.getFirstSync(
      'SELECT COALESCE(SUM(file_size), 0) as total FROM tracks'
    );
    return (row as any)?.total ?? 0;
  }
}

// ── Album Repository ───────────────────────────────────────────────────

export class AlbumRepository {
  constructor(private db: SQLiteDatabase) {}

  getAll(): MobileAlbum[] {
    return this.db.getAllSync(
      `SELECT al.id, al.title, al.artist_id as artistId,
              a.name as artistName, al.year, al.artwork_uri as artworkUri,
              COUNT(t.id) as trackCount
       FROM albums al
       LEFT JOIN artists a ON al.artist_id = a.id
       LEFT JOIN tracks t ON t.album_id = al.id
       GROUP BY al.id
       ORDER BY al.title COLLATE NOCASE ASC`
    ) as MobileAlbum[];
  }

  getById(id: number): MobileAlbum | null {
    const row = this.db.getFirstSync(
      `SELECT al.id, al.title, al.artist_id as artistId,
              a.name as artistName, al.year, al.artwork_uri as artworkUri,
              COUNT(t.id) as trackCount
       FROM albums al
       LEFT JOIN artists a ON al.artist_id = a.id
       LEFT JOIN tracks t ON t.album_id = al.id
       WHERE al.id = ?
       GROUP BY al.id`,
      [id]
    );
    return (row as MobileAlbum) ?? null;
  }

  getByArtist(artistId: number): MobileAlbum[] {
    return this.db.getAllSync(
      `SELECT al.id, al.title, al.artist_id as artistId,
              a.name as artistName, al.year, al.artwork_uri as artworkUri,
              COUNT(t.id) as trackCount
       FROM albums al
       LEFT JOIN artists a ON al.artist_id = a.id
       LEFT JOIN tracks t ON t.album_id = al.id
       WHERE al.artist_id = ?
       GROUP BY al.id
       ORDER BY al.year DESC, al.title COLLATE NOCASE ASC`,
      [artistId]
    ) as MobileAlbum[];
  }

  findOrCreate(title: string, artistId: number | null, year?: number | null): number {
    const existing = this.db.getFirstSync(
      'SELECT id FROM albums WHERE title = ? AND (artist_id = ? OR (artist_id IS NULL AND ? IS NULL))',
      [title, artistId, artistId]
    );
    if (existing) return (existing as any).id;

    const result = this.db.runSync(
      'INSERT INTO albums (title, artist_id, year) VALUES (?, ?, ?)',
      [title, artistId, year ?? null]
    );
    return result.lastInsertRowId;
  }

  updateArtwork(id: number, artworkUri: string): void {
    this.db.runSync('UPDATE albums SET artwork_uri = ? WHERE id = ?', [artworkUri, id]);
  }

  getTitleById(id: number | null): string {
    if (id === null) return 'Unknown Album';
    const row = this.db.getFirstSync('SELECT title FROM albums WHERE id = ?', [id]);
    return (row as any)?.title ?? 'Unknown Album';
  }
}

// ── Artist Repository ──────────────────────────────────────────────────

export class ArtistRepository {
  constructor(private db: SQLiteDatabase) {}

  getAll(): MobileArtist[] {
    return this.db.getAllSync(
      `SELECT a.id, a.name,
              COUNT(DISTINCT al.id) as albumCount,
              COUNT(DISTINCT t.id) as trackCount
       FROM artists a
       LEFT JOIN albums al ON al.artist_id = a.id
       LEFT JOIN tracks t ON t.artist_id = a.id
       GROUP BY a.id
       ORDER BY a.name COLLATE NOCASE ASC`
    ) as MobileArtist[];
  }

  getById(id: number): MobileArtist | null {
    const row = this.db.getFirstSync(
      `SELECT a.id, a.name,
              COUNT(DISTINCT al.id) as albumCount,
              COUNT(DISTINCT t.id) as trackCount
       FROM artists a
       LEFT JOIN albums al ON al.artist_id = a.id
       LEFT JOIN tracks t ON t.artist_id = a.id
       WHERE a.id = ?
       GROUP BY a.id`,
      [id]
    );
    return (row as MobileArtist) ?? null;
  }

  findOrCreate(name: string): number {
    const existing = this.db.getFirstSync(
      'SELECT id FROM artists WHERE name = ?',
      [name]
    );
    if (existing) return (existing as any).id;

    const result = this.db.runSync(
      'INSERT INTO artists (name) VALUES (?)',
      [name]
    );
    return result.lastInsertRowId;
  }

  getNameById(id: number | null): string {
    if (id === null) return 'Unknown Artist';
    const row = this.db.getFirstSync('SELECT name FROM artists WHERE id = ?', [id]);
    return (row as any)?.name ?? 'Unknown Artist';
  }
}

// ── Playlist Repository ────────────────────────────────────────────────

export class PlaylistRepository {
  constructor(private db: SQLiteDatabase) {}

  getAll(): MobilePlaylist[] {
    return this.db.getAllSync(
      `SELECT p.id, p.name, p.created_at as createdAt, p.updated_at as updatedAt,
              p.is_pinned as isPinned, p.source, p.source_device_name as sourceDeviceName,
              COUNT(pt.track_id) as trackCount,
              (
                SELECT t.artwork_uri FROM playlist_tracks pt2
                JOIN tracks t ON pt2.track_id = t.id
                WHERE pt2.playlist_id = p.id AND t.artwork_uri IS NOT NULL
                LIMIT 1
              ) as artworkUri
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
       GROUP BY p.id
       ORDER BY p.is_pinned DESC, p.updated_at DESC`
    ) as MobilePlaylist[];
  }

  getById(id: number): MobilePlaylist | null {
    const row = this.db.getFirstSync(
      `SELECT p.id, p.name, p.created_at as createdAt, p.updated_at as updatedAt,
              p.is_pinned as isPinned, p.source, p.source_device_name as sourceDeviceName,
              COUNT(pt.track_id) as trackCount,
              (
                SELECT t.artwork_uri FROM playlist_tracks pt2
                JOIN tracks t ON pt2.track_id = t.id
                WHERE pt2.playlist_id = p.id AND t.artwork_uri IS NOT NULL
                LIMIT 1
              ) as artworkUri
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
       WHERE p.id = ?
       GROUP BY p.id`,
      [id]
    );
    return (row as MobilePlaylist) ?? null;
  }

  create(name: string, source: 'local' | 'synced' = 'local', sourceDevice?: string): number {
    const now = new Date().toISOString();
    const result = this.db.runSync(
      `INSERT INTO playlists (name, created_at, updated_at, source, source_device_name)
       VALUES (?, ?, ?, ?, ?)`,
      [name, now, now, source, sourceDevice ?? null]
    );
    return result.lastInsertRowId;
  }

  rename(id: number, name: string): void {
    this.db.runSync(
      'UPDATE playlists SET name = ?, updated_at = ? WHERE id = ?',
      [name, new Date().toISOString(), id]
    );
  }

  togglePin(id: number): void {
    this.db.runSync(
      'UPDATE playlists SET is_pinned = NOT is_pinned, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
  }

  delete(id: number): boolean {
    const result = this.db.runSync('DELETE FROM playlists WHERE id = ?', [id]);
    return result.changes > 0;
  }

  getTracks(playlistId: number): MobileTrack[] {
    return this.db.getAllSync(
      `SELECT t.id, t.title, t.album_id as albumId, t.artist_id as artistId,
              t.file_uri as fileUri, t.duration, t.track_number as trackNumber,
              t.genre, t.file_hash as fileHash, t.artwork_uri as artworkUri,
              t.file_size as fileSize, t.format, t.sample_rate as sampleRate,
              t.bit_rate as bitRate, t.channels, t.imported_at as importedAt,
              t.last_played_at as lastPlayedAt
       FROM playlist_tracks pt
       JOIN tracks t ON pt.track_id = t.id
       WHERE pt.playlist_id = ?
       ORDER BY pt.position ASC`,
      [playlistId]
    ) as MobileTrack[];
  }

  hasTrack(playlistId: number, trackId: number): boolean {
    const row = this.db.getFirstSync(
      'SELECT 1 FROM playlist_tracks WHERE playlist_id = ? AND track_id = ? LIMIT 1',
      [playlistId, trackId]
    );
    return Boolean(row);
  }

  addTrack(playlistId: number, trackId: number): boolean {
    if (this.hasTrack(playlistId, trackId)) {
      return false;
    }

    const maxPos = this.db.getFirstSync(
      'SELECT COALESCE(MAX(position), 0) as maxPos FROM playlist_tracks WHERE playlist_id = ?',
      [playlistId]
    );
    const position = ((maxPos as any)?.maxPos ?? 0) + 1;

    this.db.runSync(
      'INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)',
      [playlistId, trackId, position]
    );
    this.db.runSync(
      'UPDATE playlists SET updated_at = ? WHERE id = ?',
      [new Date().toISOString(), playlistId]
    );
    return true;
  }

  removeTrack(playlistId: number, trackId: number): void {
    this.db.runSync(
      'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
      [playlistId, trackId]
    );
    this.db.runSync(
      'UPDATE playlists SET updated_at = ? WHERE id = ?',
      [new Date().toISOString(), playlistId]
    );
  }

  reorderTracks(playlistId: number, trackIds: number[]): void {
    trackIds.forEach((trackId, index) => {
      this.db.runSync(
        'UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?',
        [index + 1, playlistId, trackId]
      );
    });
  }
}

// ── Favorites Repository ───────────────────────────────────────────────

export class FavoritesRepository {
  constructor(private db: SQLiteDatabase) {}

  getAll(): MobileTrack[] {
    return this.db.getAllSync(
      `SELECT t.id, t.title, t.album_id as albumId, t.artist_id as artistId,
              t.file_uri as fileUri, t.duration, t.track_number as trackNumber,
              t.genre, t.file_hash as fileHash, t.artwork_uri as artworkUri,
              t.file_size as fileSize, t.format, t.sample_rate as sampleRate,
              t.bit_rate as bitRate, t.channels, t.imported_at as importedAt,
              t.last_played_at as lastPlayedAt
       FROM favorites f
       JOIN tracks t ON f.track_id = t.id
       ORDER BY f.created_at DESC`
    ) as MobileTrack[];
  }

  isFavorite(trackId: number): boolean {
    const row = this.db.getFirstSync(
      'SELECT 1 FROM favorites WHERE track_id = ? LIMIT 1',
      [trackId]
    );
    return row !== null && row !== undefined;
  }

  toggle(trackId: number): boolean {
    if (this.isFavorite(trackId)) {
      this.db.runSync('DELETE FROM favorites WHERE track_id = ?', [trackId]);
      return false;
    } else {
      this.db.runSync(
        'INSERT OR IGNORE INTO favorites (track_id) VALUES (?)',
        [trackId]
      );
      return true;
    }
  }

  getCount(): number {
    const row = this.db.getFirstSync('SELECT COUNT(*) as count FROM favorites');
    return (row as any)?.count ?? 0;
  }

  getIds(): Set<number> {
    const rows = this.db.getAllSync('SELECT track_id as trackId FROM favorites') as { trackId: number }[];
    return new Set(rows.map((r) => r.trackId));
  }
}

// ── Play History Repository ────────────────────────────────────────────

export class PlayHistoryRepository {
  constructor(private db: SQLiteDatabase) {}

  record(trackId: number, durationPlayed: number): void {
    this.db.runSync(
      'INSERT INTO play_history (track_id, duration_played) VALUES (?, ?)',
      [trackId, durationPlayed]
    );
  }

  getRecent(limit: number = 50): PlayHistoryEntry[] {
    return this.db.getAllSync(
      `SELECT id, track_id as trackId, played_at as playedAt,
              duration_played as durationPlayed
       FROM play_history ORDER BY played_at DESC LIMIT ?`,
      [limit]
    ) as PlayHistoryEntry[];
  }
}

// ── Playback State Repository ──────────────────────────────────────────

export class PlaybackStateRepository {
  constructor(private db: SQLiteDatabase) {}

  get(): PersistedPlaybackState {
    const row = this.db.getFirstSync(
      `SELECT track_id as trackId, current_time as currentTime,
              queue_ids as queueIds, queue_index as queueIndex,
              shuffle_enabled as shuffleEnabled, repeat_mode as repeatMode
       FROM playback_state WHERE id = 1`
    ) as any;

    if (!row) {
      return {
        trackId: null,
        currentTime: 0,
        queueIds: [],
        queueIndex: 0,
        shuffleEnabled: false,
        repeatMode: 'off',
      };
    }

    return {
      trackId: row.trackId,
      currentTime: row.currentTime || 0,
      queueIds: JSON.parse(row.queueIds || '[]'),
      queueIndex: row.queueIndex || 0,
      shuffleEnabled: !!row.shuffleEnabled,
      repeatMode: (row.repeatMode || 'off') as RepeatMode,
    };
  }

  save(state: PersistedPlaybackState): void {
    this.db.runSync(
      `UPDATE playback_state SET
        track_id = ?, current_time = ?, queue_ids = ?,
        queue_index = ?, shuffle_enabled = ?, repeat_mode = ?
       WHERE id = 1`,
      [
        state.trackId,
        state.currentTime,
        JSON.stringify(state.queueIds),
        state.queueIndex,
        state.shuffleEnabled ? 1 : 0,
        state.repeatMode,
      ]
    );
  }
}

// ── Paired Devices Repository ──────────────────────────────────────────

export class PairedDeviceRepository {
  constructor(private db: SQLiteDatabase) {}

  getAll(): PairedDevice[] {
    return this.db.getAllSync(
      `SELECT id, name, ip, port, paired_at as pairedAt,
              last_seen_at as lastSeenAt
       FROM paired_devices ORDER BY paired_at DESC`
    ) as PairedDevice[];
  }

  save(device: PairedDevice, authToken: string): void {
    this.db.runSync(
      `INSERT OR REPLACE INTO paired_devices (id, name, ip, port, paired_at, last_seen_at, auth_token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [device.id, device.name, device.ip, device.port, device.pairedAt, device.lastSeenAt, authToken]
    );
  }

  getAuthToken(deviceId: string): string | null {
    const row = this.db.getFirstSync(
      'SELECT auth_token FROM paired_devices WHERE id = ?',
      [deviceId]
    );
    return (row as any)?.auth_token ?? null;
  }

  updateLastSeen(deviceId: string): void {
    this.db.runSync(
      'UPDATE paired_devices SET last_seen_at = ? WHERE id = ?',
      [new Date().toISOString(), deviceId]
    );
  }

  revoke(deviceId: string): boolean {
    const result = this.db.runSync('DELETE FROM paired_devices WHERE id = ?', [deviceId]);
    return result.changes > 0;
  }
}

// ── Settings Repository ────────────────────────────────────────────────

export class SettingsRepository {
  constructor(private db: SQLiteDatabase) {}

  get(key: string, defaultValue: string = ''): string {
    const row = this.db.getFirstSync(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    );
    return (row as any)?.value ?? defaultValue;
  }

  set(key: string, value: string): void {
    this.db.runSync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value]
    );
  }
}

// ── Search Repository ──────────────────────────────────────────────────

export class SearchRepository {
  constructor(private db: SQLiteDatabase) {}

  search(query: string, limit: number = 20): SearchResults {
    const q = `%${query}%`;

    const tracks = this.db.getAllSync(
      `SELECT id, title, album_id as albumId, artist_id as artistId,
              file_uri as fileUri, duration, track_number as trackNumber,
              genre, file_hash as fileHash, artwork_uri as artworkUri,
              file_size as fileSize, format, sample_rate as sampleRate,
              bit_rate as bitRate, channels, imported_at as importedAt,
              last_played_at as lastPlayedAt
       FROM tracks WHERE title LIKE ? COLLATE NOCASE
       ORDER BY title COLLATE NOCASE ASC LIMIT ?`,
      [q, limit]
    ) as MobileTrack[];

    const albums = this.db.getAllSync(
      `SELECT al.id, al.title, al.artist_id as artistId,
              a.name as artistName, al.year, al.artwork_uri as artworkUri,
              COUNT(t.id) as trackCount
       FROM albums al
       LEFT JOIN artists a ON al.artist_id = a.id
       LEFT JOIN tracks t ON t.album_id = al.id
       WHERE al.title LIKE ? COLLATE NOCASE
       GROUP BY al.id
       ORDER BY al.title COLLATE NOCASE ASC LIMIT ?`,
      [q, limit]
    ) as MobileAlbum[];

    const artists = this.db.getAllSync(
      `SELECT a.id, a.name,
              COUNT(DISTINCT al.id) as albumCount,
              COUNT(DISTINCT t.id) as trackCount
       FROM artists a
       LEFT JOIN albums al ON al.artist_id = a.id
       LEFT JOIN tracks t ON t.artist_id = a.id
       WHERE a.name LIKE ? COLLATE NOCASE
       GROUP BY a.id
       ORDER BY a.name COLLATE NOCASE ASC LIMIT ?`,
      [q, limit]
    ) as MobileArtist[];

    const playlists = this.db.getAllSync(
      `SELECT p.id, p.name, p.created_at as createdAt, p.updated_at as updatedAt,
              p.is_pinned as isPinned, p.source, p.source_device_name as sourceDeviceName,
              COUNT(pt.track_id) as trackCount, NULL as artworkUri
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
       WHERE p.name LIKE ? COLLATE NOCASE
       GROUP BY p.id LIMIT ?`,
      [q, limit]
    ) as MobilePlaylist[];

    return { tracks, albums, artists, playlists };
  }
}

// ── Lyric Offset Repository ───────────────────────────────────────────

export class LyricOffsetRepository {
  constructor(private db: SQLiteDatabase) {}

  getOffset(trackId: number): number {
    const row = this.db.getFirstSync(
      'SELECT offset_ms as offsetMs FROM lyric_offsets WHERE track_id = ?',
      [trackId]
    );
    return (row as any)?.offsetMs ?? 0;
  }

  setOffset(trackId: number, offsetMs: number): void {
    this.db.runSync(
      'INSERT OR REPLACE INTO lyric_offsets (track_id, offset_ms) VALUES (?, ?)',
      [trackId, offsetMs]
    );
  }
}

