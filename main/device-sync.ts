import * as http from 'http';
import * as os from 'os';
import * as crypto from 'crypto';
import { BrowserWindow } from 'electron';
import Database from 'better-sqlite3';
import { getDb } from './db';

export interface PairedDevice {
  id: string;
  name: string;
  ip: string;
  paired_at: string;
  last_seen_at: string;
}

export interface PendingSharedPlaylist {
  id: string;
  fromDeviceName: string;
  playlistName: string;
  trackCount: number;
  tracks: Array<{
    title: string;
    artist: string;
    album: string;
    duration: number;
    genre?: string;
  }>;
  receivedAt: string;
}

export interface DeviceSyncStatus {
  enabled: boolean;
  deviceName: string;
  localIp: string;
  port: number;
  activePairingPin: string | null;
  pinExpiresInSeconds: number;
  pairedDevices: PairedDevice[];
  pendingPlaylists: PendingSharedPlaylist[];
}

let server: http.Server | null = null;
let activePairingPin: string | null = null;
let pinExpiresAt = 0;
const DEFAULT_PORT = 47848;
const pendingPlaylists: PendingSharedPlaylist[] = [];

/**
 * Get the primary non-internal IPv4 address for local network discovery.
 */
export function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

/**
 * Generate a 6-digit numeric pairing PIN code valid for 5 minutes.
 */
export function generatePairingPin(): { pin: string; expiresInSeconds: number } {
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  activePairingPin = pin;
  pinExpiresAt = Date.now() + 5 * 60 * 1000;
  return { pin, expiresInSeconds: 300 };
}

/**
 * Start the local HTTP synchronization server.
 */
export function startDeviceSyncServer(
  getWin?: () => BrowserWindow | null,
  customPort = DEFAULT_PORT,
  customDb?: Database.Database
): Promise<boolean> {
  if (server) return Promise.resolve(true);

  return new Promise((resolve) => {
    server = http.createServer(async (req, res) => {
      const url = req.url || '';
      const method = req.method || 'GET';

      // 1. Health / ping
      if (url === '/api/sync/ping' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', deviceName: os.hostname(), app: 'Overtone' }));
        return;
      }

      // 2. Pair request
      if (url === '/api/sync/pair' && method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const { deviceName, pin } = data;

            if (!activePairingPin || Date.now() > pinExpiresAt || pin !== activePairingPin) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Invalid or expired pairing PIN' }));
              return;
            }

            const db = customDb || getDb();
            const deviceId = crypto.randomUUID();
            const authToken = crypto.randomBytes(32).toString('hex');
            const clientIp = (req.socket.remoteAddress || '').replace(/^.*:/, '');

            db.prepare(`
              INSERT OR REPLACE INTO paired_devices (id, name, ip, paired_at, last_seen_at, auth_token)
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(
              deviceId,
              deviceName || 'Unknown Device',
              clientIp,
              new Date().toISOString(),
              new Date().toISOString(),
              authToken
            );

            // Invalidate pin after successful pairing
            activePairingPin = null;

            const win = getWin ? getWin() : null;
            if (win && !win.isDestroyed()) {
              win.webContents.send('sync:devicePaired', { id: deviceId, name: deviceName, ip: clientIp });
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              deviceId,
              hostDeviceName: os.hostname(),
              authToken,
            }));
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Malformed request' }));
          }
        });
        return;
      }

      // 3. Receive Shared Playlist
      if (url === '/api/sync/playlist' && method === 'POST') {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.replace(/^Bearer\s+/i, '');

        const db = customDb || getDb();
        const paired = db.prepare('SELECT id, name FROM paired_devices WHERE auth_token = ?').get(token) as { id: string; name: string } | undefined;

        if (!paired) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Unauthorized: device is not paired' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const pendingItem: PendingSharedPlaylist = {
              id: crypto.randomUUID(),
              fromDeviceName: paired.name,
              playlistName: data.playlistName || 'Shared Playlist',
              trackCount: Array.isArray(data.tracks) ? data.tracks.length : 0,
              tracks: Array.isArray(data.tracks) ? data.tracks : [],
              receivedAt: new Date().toISOString(),
            };

            pendingPlaylists.push(pendingItem);

            const win = getWin ? getWin() : null;
            if (win && !win.isDestroyed()) {
              win.webContents.send('sync:playlistReceived', pendingItem);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, pendingId: pendingItem.id }));
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid playlist payload' }));
          }
        });
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    server.listen(customPort, '0.0.0.0', () => {
      console.log(`[DeviceSync] Server running at http://${getLocalIpAddress()}:${customPort}`);
      resolve(true);
    });

    server.on('error', (err) => {
      console.warn('[DeviceSync] Server failed to start on port', customPort, err);
      resolve(false);
    });
  });
}

/**
 * Stop the local synchronization server.
 */
export function stopDeviceSyncServer(): void {
  if (server) {
    server.close();
    server = null;
    activePairingPin = null;
  }
}

/**
 * Connect to a peer device on the local network and pair using PIN.
 */
export async function pairWithPeer(
  targetIp: string,
  pin: string,
  targetPort = DEFAULT_PORT,
  customDb?: Database.Database
): Promise<{ success: boolean; hostDeviceName?: string; error?: string }> {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      deviceName: os.hostname(),
      pin,
    });

    const req = http.request(
      {
        hostname: targetIp,
        port: targetPort,
        path: '/api/sync/pair',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 5000,
      },
      (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          try {
            const resp = JSON.parse(body);
            if (res.statusCode === 200 && resp.success) {
              const db = customDb || getDb();
              db.prepare(`
                INSERT OR REPLACE INTO paired_devices (id, name, ip, paired_at, last_seen_at, auth_token)
                VALUES (?, ?, ?, ?, ?, ?)
              `).run(
                resp.deviceId || crypto.randomUUID(),
                resp.hostDeviceName || 'Remote Device',
                targetIp,
                new Date().toISOString(),
                new Date().toISOString(),
                resp.authToken
              );
              resolve({ success: true, hostDeviceName: resp.hostDeviceName });
            } else {
              resolve({ success: false, error: resp.error || 'Pairing rejected' });
            }
          } catch {
            resolve({ success: false, error: 'Invalid response from peer device' });
          }
        });
      }
    );

    req.on('error', (err) => {
      resolve({ success: false, error: `Connection failed: ${err.message}` });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Connection timed out' });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Send a local playlist to a paired peer device.
 */
export async function sendPlaylistToPeer(
  deviceId: string,
  playlistId: number,
  targetPort = DEFAULT_PORT,
  customDb?: Database.Database
): Promise<{ success: boolean; error?: string }> {
  const db = customDb || getDb();

  const device = db.prepare('SELECT id, name, ip, auth_token FROM paired_devices WHERE id = ?').get(deviceId) as {
    id: string;
    name: string;
    ip: string;
    auth_token: string;
  } | undefined;

  if (!device) {
    return { success: false, error: 'Device is not paired' };
  }

  const playlist = db.prepare('SELECT name FROM playlists WHERE id = ?').get(playlistId) as { name: string } | undefined;
  if (!playlist) {
    return { success: false, error: 'Playlist not found' };
  }

  const tracks = db.prepare(`
    SELECT t.title, COALESCE(a.name, 'Unknown Artist') as artist, COALESCE(al.title, 'Unknown Album') as album,
           t.duration, t.genre
    FROM playlist_tracks pt
    JOIN tracks t ON pt.track_id = t.id
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE pt.playlist_id = ?
    ORDER BY pt.position ASC
  `).all(playlistId);

  const payload = JSON.stringify({
    playlistName: playlist.name,
    tracks,
  });

  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: device.ip,
        port: targetPort,
        path: '/api/sync/playlist',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Authorization': `Bearer ${device.auth_token}`,
        },
        timeout: 8000,
      },
      (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          try {
            const resp = JSON.parse(body);
            if (res.statusCode === 200 && resp.success) {
              resolve({ success: true });
            } else {
              resolve({ success: false, error: resp.error || 'Peer rejected playlist' });
            }
          } catch {
            resolve({ success: false, error: 'Invalid response from peer' });
          }
        });
      }
    );

    req.on('error', (err) => {
      resolve({ success: false, error: `Transfer failed: ${err.message}` });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Transfer timed out' });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Accept an incoming pending playlist and import it into the local database.
 */
export function acceptIncomingPlaylist(
  pendingId: string,
  customDb?: Database.Database
): { success: boolean; playlistId?: number; matchedTracks?: number; error?: string } {
  const index = pendingPlaylists.findIndex(p => p.id === pendingId);
  if (index === -1) {
    return { success: false, error: 'Shared playlist not found or already processed' };
  }

  const [pending] = pendingPlaylists.splice(index, 1);
  const db = customDb || getDb();

  try {
    let playlistId = 0;
    let matchedTracks = 0;

    db.transaction(() => {
      const res = db.prepare('INSERT INTO playlists (name, created_at) VALUES (?, ?)').run(
        pending.playlistName,
        new Date().toISOString()
      );
      playlistId = Number(res.lastInsertRowid);

      let pos = 1;
      for (const tr of pending.tracks) {
        const localTrack = db.prepare(`
          SELECT t.id FROM tracks t
          LEFT JOIN artists a ON t.artist_id = a.id
          WHERE LOWER(t.title) = LOWER(?)
            AND (LOWER(COALESCE(a.name, '')) = LOWER(?) OR ? = '')
          LIMIT 1
        `).get(tr.title, tr.artist || '', tr.artist || '') as { id: number } | undefined;

        if (localTrack) {
          db.prepare('INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)').run(
            playlistId,
            localTrack.id,
            pos++
          );
          matchedTracks++;
        }
      }
    })();

    return { success: true, playlistId, matchedTracks };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Decline and dismiss an incoming pending playlist.
 */
export function declineIncomingPlaylist(pendingId: string): boolean {
  const index = pendingPlaylists.findIndex(p => p.id === pendingId);
  if (index !== -1) {
    pendingPlaylists.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * List all paired devices.
 */
export function getPairedDevices(customDb?: Database.Database): PairedDevice[] {
  const db = customDb || getDb();
  try {
    return db.prepare('SELECT id, name, ip, paired_at, last_seen_at FROM paired_devices ORDER BY paired_at DESC').all() as PairedDevice[];
  } catch {
    return [];
  }
}

/**
 * Revoke and remove a paired device.
 */
export function revokePairedDevice(deviceId: string, customDb?: Database.Database): boolean {
  const db = customDb || getDb();
  try {
    const res = db.prepare('DELETE FROM paired_devices WHERE id = ?').run(deviceId);
    return res.changes > 0;
  } catch {
    return false;
  }
}

/**
 * Get comprehensive device sync status for the UI.
 */
export function getDeviceSyncStatus(customDb?: Database.Database): DeviceSyncStatus {
  const now = Date.now();
  const pinRemaining = activePairingPin && now < pinExpiresAt ? Math.round((pinExpiresAt - now) / 1000) : 0;

  return {
    enabled: server !== null,
    deviceName: os.hostname(),
    localIp: getLocalIpAddress(),
    port: DEFAULT_PORT,
    activePairingPin: pinRemaining > 0 ? activePairingPin : null,
    pinExpiresInSeconds: pinRemaining,
    pairedDevices: getPairedDevices(customDb),
    pendingPlaylists: [...pendingPlaylists],
  };
}
