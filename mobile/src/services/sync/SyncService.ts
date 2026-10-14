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
const TIMEOUT_MS = 8000;
const SECURE_STORE_PREFIX = 'overtune_sync_';

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
      const timeout = setTimeout(() => controller.abort(), 5000);

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
      const msg = error instanceof Error ? error.message : 'Connection failed';
      return { ok: false, error: msg.includes('aborted') ? 'Connection timed out' : msg };
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
      const msg = error instanceof Error ? error.message : 'Connection failed';
      return { success: false, error: msg.includes('aborted') ? 'Connection timed out' : msg };
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
      const msg = error instanceof Error ? error.message : 'Transfer failed';
      return { success: false, error: msg.includes('aborted') ? 'Transfer timed out' : msg };
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
      const msg = error instanceof Error ? error.message : 'Failed to fetch playlists';
      return { playlists: [], error: msg };
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
      const msg = error instanceof Error ? error.message : 'Failed to fetch playlist';
      return { payload: null, error: msg };
    }
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
