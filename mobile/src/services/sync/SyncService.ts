/**
 * Overtone iOS — Sync Service
 *
 * Client-driven sync: iPhone initiates connections to the desktop server.
 * Handles discovery (Bonjour + manual IP), pairing, playlist exchange,
 * and credential management via Keychain-backed SecureStore.
 */

import * as SecureStore from 'expo-secure-store';
import type {
  DiscoveredDevice,
  SyncPlaylistPayload,
  PairedDevice,
  PlaylistPreview,
  SyncPlaylistTrack,
  TrackMatchResult,
} from '../../domain/models';
import { matchPlaylistTracks } from '../../domain/matching';

const DEFAULT_PORT = 47848;
const TIMEOUT_MS = 10000;
const SECURE_STORE_PREFIX = 'overtune_sync_';

function formatConnectionError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const msg = error.message;
    const lower = msg.toLowerCase();
    if (
      lower.includes('aborted') ||
      lower.includes('canceled') ||
      lower.includes('cancelled') ||
      lower.includes('fetchrequestcanceledexception') ||
      error.name === 'AbortError'
    ) {
      return 'Connection timed out. Ensure your computer and iPhone are on the same Wi-Fi and that you entered the Wi-Fi IP address shown on Desktop.';
    }
    if (
      lower.includes('network request failed') ||
      lower.includes('connection refused') ||
      lower.includes('failed to fetch')
    ) {
      return 'Could not connect to desktop server. Verify the IP address and make sure Overtone Desktop has Wi-Fi sync enabled.';
    }
    return msg;
  }
  return fallback;
}

export interface PairResult {
  success: boolean;
  deviceId?: string;
  hostDeviceName?: string;
  authToken?: string;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  pendingId?: string;
  error?: string;
}

export interface DesktopPlaylistInfo {
  id: number;
  name: string;
  trackCount: number;
}

class SyncServiceImpl {
  /**
   * Ping a desktop server to verify it's running Overtone.
   */
  async ping(host: string, port: number = DEFAULT_PORT): Promise<{ ok: boolean; deviceName?: string; error?: string }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`http://${host}:${port}/api/sync/ping`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };

      const data = await response.json();
      if (data.app === 'Overtone' || data.status === 'ok') {
        return { ok: true, deviceName: data.deviceName };
      }
      return { ok: false, error: 'Not an Overtone server' };
    } catch (error) {
      return { ok: false, error: formatConnectionError(error, 'Connection failed') };
    }
  }

  /**
   * Pair with a desktop server using a 6-digit PIN.
   */
  async pair(host: string, pin: string, port: number = DEFAULT_PORT): Promise<PairResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`http://${host}:${port}/api/sync/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: 'iPhone', pin }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await response.json();

      if (response.ok && data.success) {
        // Store auth token securely in Keychain
        if (data.authToken && data.deviceId) {
          await SecureStore.setItemAsync(
            `${SECURE_STORE_PREFIX}${data.deviceId}`,
            data.authToken
          );
        }

        return {
          success: true,
          deviceId: data.deviceId,
          hostDeviceName: data.hostDeviceName,
          authToken: data.authToken,
        };
      }

      return { success: false, error: data.error || 'Pairing rejected' };
    } catch (error) {
      return { success: false, error: formatConnectionError(error, 'Connection failed') };
    }
  }

  /**
   * Send a playlist to a paired desktop device.
   */
  async sendPlaylist(
    device: PairedDevice,
    payload: SyncPlaylistPayload
  ): Promise<SyncResult> {
    try {
      const authToken = await this.getStoredToken(device.id);
      if (!authToken) return { success: false, error: 'No credentials found. Please re-pair.' };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`http://${device.ip}:${device.port}/api/sync/playlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true, pendingId: data.pendingId };
      }

      if (response.status === 403) {
        return { success: false, error: 'Device is no longer paired. Please re-pair.' };
      }

      return { success: false, error: data.error || 'Desktop rejected the playlist' };
    } catch (error) {
      return { success: false, error: formatConnectionError(error, 'Transfer failed') };
    }
  }

  /**
   * Send a single track to a paired desktop device.
   */
  async sendTrack(
    device: PairedDevice,
    track: SyncPlaylistTrack
  ): Promise<SyncResult> {
    try {
      const authToken = await this.getStoredToken(device.id);
      if (!authToken) return { success: false, error: 'No credentials found. Please re-pair.' };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`http://${device.ip}:${device.port}/api/sync/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ track }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, pendingId: data.pendingId };
      }

      if (response.status === 403) {
        return { success: false, error: 'Device is no longer paired. Please re-pair.' };
      }

      return { success: false, error: data.error || 'Desktop rejected the track' };
    } catch (error) {
      return { success: false, error: formatConnectionError(error, 'Transfer failed') };
    }
  }

  /**
   * Fetch playlist list from desktop (requires protocol extension).
   * Falls back gracefully if the endpoint doesn't exist yet.
   */
  async fetchDesktopPlaylists(device: PairedDevice): Promise<{ playlists: DesktopPlaylistInfo[]; error?: string }> {
    try {
      const authToken = await this.getStoredToken(device.id);
      if (!authToken) return { playlists: [], error: 'No credentials found' };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`http://${device.ip}:${device.port}/api/sync/playlists`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.status === 404) {
        return { playlists: [], error: 'Desktop does not support playlist listing yet. Update the desktop app.' };
      }

      if (!response.ok) {
        return { playlists: [], error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { playlists: data.playlists || [] };
    } catch (error) {
      return { playlists: [], error: formatConnectionError(error, 'Failed to fetch playlists') };
    }
  }

  /**
   * Fetch a specific playlist's data from desktop.
   */
  async fetchDesktopPlaylist(
    device: PairedDevice,
    playlistId: number
  ): Promise<{ payload: SyncPlaylistPayload | null; error?: string }> {
    try {
      const authToken = await this.getStoredToken(device.id);
      if (!authToken) return { payload: null, error: 'No credentials found' };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(
        `http://${device.ip}:${device.port}/api/sync/playlist/${playlistId}`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!response.ok) return { payload: null, error: `HTTP ${response.status}` };

      const data = await response.json();
      return { payload: data };
    } catch (error) {
      return { payload: null, error: formatConnectionError(error, 'Failed to fetch playlist') };
    }
  }

  /**
   * Fetch current now-playing state from desktop.
   */
  async fetchNowPlaying(
    device: PairedDevice
  ): Promise<{ state: import('../../domain/models').SyncNowPlayingState | null; error?: string }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`http://${device.ip}:${device.port}/api/sync/now-playing`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return { state: null, error: `HTTP ${response.status}` };
      const data = await response.json();
      return { state: data.nowPlaying || null };
    } catch (error) {
      return { state: null, error: formatConnectionError(error, 'Failed to fetch now playing') };
    }
  }

  /**
   * Send remote control playback action to desktop (play, pause, next, prev, seek, toggle).
   */
  async sendRemoteControl(
    device: PairedDevice,
    action: string,
    extraData: Record<string, unknown> = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`http://${device.ip}:${device.port}/api/sync/now-playing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraData }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true };
    } catch (error) {
      return { success: false, error: formatConnectionError(error, 'Failed to send remote control') };
    }
  }

  /**
   * Fetch pending transfers from desktop inbox for this device.
   */
  async fetchInbox(
    device: PairedDevice
  ): Promise<{ items: any[]; error?: string }> {
    try {
      const authToken = await this.getStoredToken(device.id);
      if (!authToken) return { items: [] };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`http://${device.ip}:${device.port}/api/sync/inbox`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return { items: [] };
      const data = await response.json();
      return { items: data.items || [] };
    } catch {
      return { items: [] };
    }
  }

  /**
   * Fetch/Search desktop library songs over Wi-Fi.
   */
  async fetchDesktopTracks(
    device: PairedDevice,
    query = '',
    limit = 60
  ): Promise<{ tracks: import('../../domain/models').SyncPlaylistTrack[]; error?: string }> {
    try {
      const authToken = await this.getStoredToken(device.id);
      if (!authToken) return { tracks: [], error: 'Not authenticated' };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const url = `http://${device.ip}:${device.port}/api/sync/tracks?q=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return { tracks: [], error: `HTTP ${response.status}` };
      const data = await response.json();
      return { tracks: data.tracks || [] };
    } catch (error) {
      return { tracks: [], error: formatConnectionError(error, 'Failed to fetch tracks') };
    }
  }

  /**
   * Import a playlist and ensure ALL its songs are added to the mobile library & playlist.
   */
  importPlaylistWithTracks(
    device: PairedDevice,
    playlistName: string,
    tracks: import('../../domain/models').SyncPlaylistTrack[],
    db: any
  ): { playlistId: number; totalTracks: number } {
    const playlistId = db.playlists.create(playlistName, 'synced', device.name);

    for (const tr of tracks) {
      const artistId = tr.artist ? db.artists.findOrCreate(tr.artist) : null;
      const albumId = tr.album ? db.albums.findOrCreate(tr.album, artistId) : null;

      const desktopId = tr.desktopTrackId ?? (tr as any).id ?? (tr as any).desktop_track_id;
      const fileUri =
        (tr.fileUri && !tr.fileUri.startsWith('stream://'))
          ? tr.fileUri
          : (desktopId
            ? `http://${device.ip}:${device.port}/api/sync/audio/${desktopId}`
            : `http://${device.ip}:${device.port}/api/sync/audio/by-title/${encodeURIComponent(tr.title)}`);

      const artworkUri =
        tr.artworkUri ||
        (desktopId
          ? `http://${device.ip}:${device.port}/api/sync/artwork/${desktopId}`
          : `http://${device.ip}:${device.port}/api/sync/artwork/by-title/${encodeURIComponent(tr.title)}`);

      // Check if this song already exists locally
      const localTracks = db.tracks.getAll();
      const existing = localTracks.find(
        (t: any) =>
          t.title.toLowerCase() === tr.title.toLowerCase() &&
          (artistId === null || t.artistId === artistId)
      );

      if (existing) {
        // Heal corrupted or stale streaming URI in SQLite
        if (!existing.fileUri || existing.fileUri.startsWith('stream://') || (device.ip && existing.fileUri.startsWith('http://') && !existing.fileUri.includes(device.ip))) {
          if (typeof db.tracks.updateFileUri === 'function') {
            db.tracks.updateFileUri(existing.id, fileUri, 'stream', undefined, artworkUri);
          }
          existing.fileUri = fileUri;
          existing.artworkUri = artworkUri;
        }
        db.playlists.addTrack(playlistId, existing.id);
      } else {
        const newId = db.tracks.insert({
          title: tr.title,
          artistId,
          albumId,
          fileUri,
          artworkUri,
          duration: tr.duration || 0,
          genre: tr.genre || null,
          trackNumber: tr.trackNumber || null,
          fileHash: null,
          fileSize: 0,
          format: 'stream',
          sampleRate: 44100,
          bitRate: 320,
          channels: 2,
          importedAt: new Date().toISOString(),
          lastPlayedAt: null,
        });

        db.playlists.addTrack(playlistId, newId);
      }
    }

    return { playlistId, totalTracks: tracks.length };
  }

  /**
   * Import a single track received from desktop into mobile library.
   */
  importSingleTrack(
    device: PairedDevice,
    tr: import('../../domain/models').SyncPlaylistTrack,
    db: any
  ): number {
    const artistId = tr.artist ? db.artists.findOrCreate(tr.artist) : null;
    const albumId = tr.album ? db.albums.findOrCreate(tr.album, artistId) : null;

    const desktopId = tr.desktopTrackId ?? (tr as any).id ?? (tr as any).desktop_track_id;
    const fileUri =
      (tr.fileUri && !tr.fileUri.startsWith('stream://'))
        ? tr.fileUri
        : (desktopId
          ? `http://${device.ip}:${device.port}/api/sync/audio/${desktopId}`
          : `http://${device.ip}:${device.port}/api/sync/audio/by-title/${encodeURIComponent(tr.title)}`);

    const artworkUri =
      tr.artworkUri ||
      (desktopId
        ? `http://${device.ip}:${device.port}/api/sync/artwork/${desktopId}`
        : `http://${device.ip}:${device.port}/api/sync/artwork/by-title/${encodeURIComponent(tr.title)}`);

    const localTracks = db.tracks.getAll();
    const existing = localTracks.find(
      (t: any) =>
        t.title.toLowerCase() === tr.title.toLowerCase() &&
        (artistId === null || t.artistId === artistId)
    );

    if (existing) {
      // Heal corrupted or stale streaming URI in SQLite
      if (!existing.fileUri || existing.fileUri.startsWith('stream://') || (device.ip && existing.fileUri.startsWith('http://') && !existing.fileUri.includes(device.ip))) {
        if (typeof db.tracks.updateFileUri === 'function') {
          db.tracks.updateFileUri(existing.id, fileUri, 'stream', undefined, artworkUri);
        }
        existing.fileUri = fileUri;
        existing.artworkUri = artworkUri;
      }
      return existing.id;
    }

    return db.tracks.insert({
      title: tr.title,
      artistId,
      albumId,
      fileUri,
      artworkUri,
      duration: tr.duration || 0,
      genre: tr.genre || null,
      trackNumber: tr.trackNumber || null,
      fileHash: null,
      fileSize: 0,
      format: 'stream',
      sampleRate: 44100,
      bitRate: 320,
      channels: 2,
      importedAt: new Date().toISOString(),
      lastPlayedAt: null,
    });
  }

  /**
   * Retrieve stored auth token from Keychain.
   */
  async getStoredToken(deviceId: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(`${SECURE_STORE_PREFIX}${deviceId}`);
    } catch {
      return null;
    }
  }

  /**
   * Revoke a paired device and delete its credentials.
   */
  async revoke(deviceId: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`${SECURE_STORE_PREFIX}${deviceId}`);
    } catch {
      // Best effort
    }
  }

  /**
   * Validate an IP address format.
   */
  isValidIp(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) return false;
    return ip.split('.').every((part) => {
      const n = parseInt(part, 10);
      return n >= 0 && n <= 255;
    });
  }

  /**
   * Validate a hostname:port or IP:port string.
   */
  parseEndpoint(input: string): { host: string; port: number } | null {
    const parts = input.trim().split(':');
    if (parts.length === 2) {
      const port = parseInt(parts[1], 10);
      if (!isNaN(port) && port > 0 && port <= 65535) {
        return { host: parts[0], port };
      }
    }
    if (parts.length === 1 && this.isValidIp(parts[0])) {
      return { host: parts[0], port: DEFAULT_PORT };
    }
    return null;
  }
}

export const SyncService = new SyncServiceImpl();
