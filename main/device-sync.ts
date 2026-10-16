import * as http from 'http';
import * as os from 'os';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
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
    desktopTrackId?: number;
    title: string;
    artist: string;
    album: string;
    duration: number;
    genre?: string;
    trackNumber?: number;
  }>;
  receivedAt: string;
}

export interface NowPlayingSyncState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  track: {
    id: number;
    title: string;
    artist: string;
    album: string;
    duration: number;
    coverArt?: string;
  } | null;
  updatedAt: number;
}

export interface PendingDeviceTransfer {
  id: string;
  targetDeviceId: string;
  type: 'track' | 'playlist';
  payload: unknown;
  createdAt: string;
}

export interface DeviceSyncStatus {
  enabled: boolean;
  deviceName: string;
  localIp: string;
  candidateIps?: string[];
  port: number;
  activePairingPin: string | null;
  pinExpiresInSeconds: number;
  pairedDevices: PairedDevice[];
  pendingPlaylists: PendingSharedPlaylist[];
  nowPlaying?: NowPlayingSyncState;
}

let server: http.Server | null = null;
let activePairingPin: string | null = null;
let pinExpiresAt = 0;
const DEFAULT_PORT = 47848;
const pendingPlaylists: PendingSharedPlaylist[] = [];
const pendingDeviceTransfers: PendingDeviceTransfer[] = [];

let activeNowPlayingState: NowPlayingSyncState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  track: null,
  updatedAt: Date.now(),
};

function getAudioMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.flac': 'audio/flac',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.ogg': 'audio/ogg',
    '.aac': 'audio/aac',
    '.wma': 'audio/x-ms-wma',
  };
  return mimeMap[ext] || 'audio/mpeg';
}

function getImageMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  return mimeMap[ext] || 'image/jpeg';
}

export function updateNowPlayingSyncState(state: Partial<NowPlayingSyncState>, win?: BrowserWindow | null): void {
  activeNowPlayingState = {
    ...activeNowPlayingState,
    ...state,
    updatedAt: Date.now(),
  };
  if (win && !win.isDestroyed()) {
    win.webContents.send('sync:nowPlayingUpdated', activeNowPlayingState);
  }
}

export function getNowPlayingSyncState(): NowPlayingSyncState {
  return activeNowPlayingState;
}

/**
 * Get all usable non-internal IPv4 addresses for local network discovery.
 */
export function getAllLocalIpAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const primaryAddresses: string[] = [];
  const secondaryAddresses: string[] = [];
  const virtualRegex = /(vethernet|docker|wsl|virtual|vmware|vbox|tailscale|tap|tun)/i;
  const wifiRegex = /(wi-fi|wifi|wlan|wireless)/i;

  for (const name of Object.keys(interfaces)) {
    const isVirtualName = virtualRegex.test(name);
    const isWifi = wifiRegex.test(name);

    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const addr = iface.address;
        const mac = (iface.mac || '').toLowerCase();
        // Detect VirtualBox / VMware / link-local host-only subnets
        const isVboxMac = mac.startsWith('0a:00:27') || mac.startsWith('08:00:27') || mac.startsWith('00:05:69') || mac.startsWith('00:0c:29');
        const isHostOnlySubnet = addr.startsWith('192.168.56.') || addr.startsWith('169.254.');

        if (isVirtualName || isVboxMac || isHostOnlySubnet) {
          secondaryAddresses.push(addr);
        } else if (isWifi) {
          // Put Wi-Fi first as phones connect over Wi-Fi
          primaryAddresses.unshift(addr);
        } else {
          primaryAddresses.push(addr);
        }
      }
    }
  }

  const combined = [...primaryAddresses, ...secondaryAddresses];
  return combined.length > 0 ? combined : ['127.0.0.1'];
}

/**
 * Get the primary non-internal IPv4 address for local network discovery.
 */
export function getLocalIpAddress(): string {
  const all = getAllLocalIpAddresses();
  return all[0] || '127.0.0.1';
}

/**
 * Generate a 6-digit numeric pairing PIN code valid for 5 minutes using secure random.
 */
export function generatePairingPin(): { pin: string; expiresInSeconds: number } {
  const pin = crypto.randomInt(100000, 1000000).toString();
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

      // Enable CORS for LAN cross-device clients
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

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

      // Helper to authenticate Bearer token or URL token
      const parsedUrl = new URL(url, `http://${req.headers.host || '127.0.0.1'}`);
      const pathname = parsedUrl.pathname;
      const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

      const authenticateToken = (): { id: string; name: string } | null => {
        const authHeader = req.headers['authorization'] || '';
        let token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (!token && parsedUrl.searchParams.has('token')) {
          token = parsedUrl.searchParams.get('token') || '';
        }
        const db = customDb || getDb();
        if (token) {
          const paired = db.prepare('SELECT id, name FROM paired_devices WHERE auth_token = ?').get(token) as { id: string; name: string } | undefined;
          if (paired) return paired;
        }
        // Fallback: check if client IP matches a paired device
        const clientIp = (req.socket.remoteAddress || '').replace(/^.*:/, '');
        if (clientIp) {
          const pairedByIp = db.prepare('SELECT id, name FROM paired_devices WHERE ip = ?').get(clientIp) as { id: string; name: string } | undefined;
          if (pairedByIp) return pairedByIp;
        }
        return null;
      };

      // 3. Audio Streaming / Download with Range Header Support
      if ((normalizedPath.startsWith('/api/sync/audio/') || normalizedPath.startsWith('/api/sync/track/')) && method === 'GET') {
        const match = normalizedPath.match(/\/api\/sync\/(?:audio\/(\d+)|track\/(\d+)(?:\/audio)?)/);
        const db = customDb || getDb();
        let track: { path: string; title: string } | undefined;

        if (match) {
          const trackId = parseInt(match[1] || match[2], 10);
          track = db.prepare('SELECT path, title FROM tracks WHERE id = ?').get(trackId) as { path: string; title: string } | undefined;
        } else if (normalizedPath.startsWith('/api/sync/audio/by-title/')) {
          const rawTitle = normalizedPath.replace('/api/sync/audio/by-title/', '');
          let decodedTitle = rawTitle;
          try {
            decodedTitle = decodeURIComponent(rawTitle);
          } catch {}
          track = db.prepare('SELECT path, title FROM tracks WHERE LOWER(title) = LOWER(?) LIMIT 1').get(decodedTitle) as { path: string; title: string } | undefined;
          if (!track) {
            track = db.prepare('SELECT path, title FROM tracks WHERE LOWER(title) LIKE LOWER(?) LIMIT 1').get(`%${decodedTitle}%`) as { path: string; title: string } | undefined;
          }
        }

        if (track) {
          let cleanPath = track.path ? track.path.replace(/^file:\/\//i, '') : '';
          if (cleanPath && !fs.existsSync(cleanPath)) {
            try {
              const decoded = decodeURIComponent(cleanPath);
              if (fs.existsSync(decoded)) cleanPath = decoded;
            } catch {}
          }

          if (!cleanPath || !fs.existsSync(cleanPath)) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: 'Audio file not found' }));
            return;
          }

          const stat = fs.statSync(cleanPath);
          const fileSize = stat.size;
          const range = req.headers.range;
          const mimeType = getAudioMimeType(cleanPath);

          if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            if (start >= fileSize || end >= fileSize) {
              res.writeHead(416, {
                'Content-Range': `bytes */${fileSize}`,
                'Access-Control-Allow-Origin': '*',
              });
              res.end();
              return;
            }
            const chunksize = end - start + 1;
            const file = fs.createReadStream(cleanPath, { start, end });
            res.writeHead(206, {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize,
              'Content-Type': mimeType,
              'Access-Control-Allow-Origin': '*',
            });
            file.pipe(res);
          } else {
            res.writeHead(200, {
              'Content-Length': fileSize,
              'Content-Type': mimeType,
              'Accept-Ranges': 'bytes',
              'Access-Control-Allow-Origin': '*',
            });
            fs.createReadStream(cleanPath).pipe(res);
          }
          return;
        } else if (match || normalizedPath.startsWith('/api/sync/audio/by-title/')) {
          res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: 'Track not found' }));
          return;
        }
      }

      // 4. Artwork Endpoint
      if ((normalizedPath.startsWith('/api/sync/artwork/') || normalizedPath.startsWith('/api/sync/track/')) && method === 'GET') {
        const match = normalizedPath.match(/\/api\/sync\/(?:artwork\/(\d+)|track\/(\d+)\/artwork)/);
        const db = customDb || getDb();
        let row: { cover_art_path: string | null } | undefined;

        if (match) {
          const trackId = parseInt(match[1] || match[2], 10);
          row = db.prepare(`
            SELECT al.cover_art_path
            FROM tracks t
            LEFT JOIN albums al ON t.album_id = al.id
            WHERE t.id = ?
          `).get(trackId) as { cover_art_path: string | null } | undefined;
        } else if (normalizedPath.startsWith('/api/sync/artwork/by-title/')) {
          const rawTitle = normalizedPath.replace('/api/sync/artwork/by-title/', '');
          let decodedTitle = rawTitle;
          try {
            decodedTitle = decodeURIComponent(rawTitle);
          } catch {}
          row = db.prepare(`
            SELECT al.cover_art_path
            FROM tracks t
            LEFT JOIN albums al ON t.album_id = al.id
            WHERE LOWER(t.title) = LOWER(?)
            LIMIT 1
          `).get(decodedTitle) as { cover_art_path: string | null } | undefined;
          if (!row) {
            row = db.prepare(`
              SELECT al.cover_art_path
              FROM tracks t
              LEFT JOIN albums al ON t.album_id = al.id
              WHERE LOWER(t.title) LIKE LOWER(?)
              LIMIT 1
            `).get(`%${decodedTitle}%`) as { cover_art_path: string | null } | undefined;
          }
        }

        if (row) {
          let coverPath = row.cover_art_path ? row.cover_art_path.replace(/^file:\/\//i, '') : '';
          if (coverPath && !fs.existsSync(coverPath)) {
            try {
              const decoded = decodeURIComponent(coverPath);
              if (fs.existsSync(decoded)) coverPath = decoded;
            } catch {}
          }

          if (coverPath && fs.existsSync(coverPath)) {
            const mime = getImageMimeType(coverPath);
            const stat = fs.statSync(coverPath);
            res.writeHead(200, {
              'Content-Type': mime,
              'Content-Length': stat.size,
              'Cache-Control': 'public, max-age=86400',
              'Access-Control-Allow-Origin': '*',
            });
            fs.createReadStream(coverPath).pipe(res);
            return;
          }
          res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: 'Artwork not found' }));
          return;
        } else if (match || normalizedPath.startsWith('/api/sync/artwork/by-title/')) {
          res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: 'Track not found' }));
          return;
        }
      }

      // 5. Now-Playing State Sync & Remote Playback Control
      if (normalizedPath === '/api/sync/now-playing') {
        if (method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: true, nowPlaying: activeNowPlayingState }));
          return;
        }
        if (method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (data.action) {
                const win = getWin ? getWin() : null;
                if (win && !win.isDestroyed()) {
                  win.webContents.send('sync:remotePlaybackAction', data);
                }
              }
              res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify({ success: true }));
            } catch {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Malformed request' }));
            }
          });
          return;
        }
      }

      // 6. Device Inbox (mobile client polling for sent playlists/tracks)
      if (normalizedPath === '/api/sync/inbox' && method === 'GET') {
        const paired = authenticateToken();
        if (!paired) {
          res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: false, error: 'Unauthorized: device is not paired' }));
          return;
        }

        const items = pendingDeviceTransfers.filter(t => t.targetDeviceId === paired.id);
        // Remove fetched items
        for (const item of items) {
          const idx = pendingDeviceTransfers.indexOf(item);
          if (idx !== -1) pendingDeviceTransfers.splice(idx, 1);
        }

        const formattedItems = items.map(item => ({
          ...item,
          ...(item.payload || {}),
        }));

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: true, items: formattedItems }));
        return;
      }

      // 7. List / Search Desktop Tracks (for mobile browsing)
      if (normalizedPath === '/api/sync/tracks' && method === 'GET') {
        const paired = authenticateToken();
        if (!paired) {
          res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: false, error: 'Unauthorized: device is not paired' }));
          return;
        }

        const q = (parsedUrl.searchParams.get('q') || '').trim();
        const limit = Math.min(200, parseInt(parsedUrl.searchParams.get('limit') || '50', 10));
        const db = customDb || getDb();
        try {
          let tracks;
          if (q) {
            tracks = db.prepare(`
              SELECT t.id as desktopTrackId, t.title, COALESCE(a.name, 'Unknown Artist') as artist,
                     COALESCE(al.title, 'Unknown Album') as album, t.duration, t.genre, t.track_number as trackNumber
              FROM tracks t
              LEFT JOIN artists a ON t.artist_id = a.id
              LEFT JOIN albums al ON t.album_id = al.id
              WHERE LOWER(t.title) LIKE LOWER(?) OR LOWER(a.name) LIKE LOWER(?) OR LOWER(al.title) LIKE LOWER(?)
              ORDER BY t.title ASC
              LIMIT ?
            `).all(`%${q}%`, `%${q}%`, `%${q}%`, limit);
          } else {
            tracks = db.prepare(`
              SELECT t.id as desktopTrackId, t.title, COALESCE(a.name, 'Unknown Artist') as artist,
                     COALESCE(al.title, 'Unknown Album') as album, t.duration, t.genre, t.track_number as trackNumber
              FROM tracks t
              LEFT JOIN artists a ON t.artist_id = a.id
              LEFT JOIN albums al ON t.album_id = al.id
              ORDER BY t.title ASC
              LIMIT ?
            `).all(limit);
          }
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: true, tracks }));
        } catch (e: unknown) {
          const errMsg = e instanceof Error ? e.message : 'Database error';
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: errMsg }));
        }
        return;
      }

      // 8. List Playlists (for mobile client pull)
      if (normalizedPath === '/api/sync/playlists' && method === 'GET') {
        const paired = authenticateToken();
        if (!paired) {
          res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: false, error: 'Unauthorized: device is not paired' }));
          return;
        }

        const db = customDb || getDb();
        try {
          const playlists = db.prepare(`
            SELECT p.id, p.name, COUNT(pt.track_id) as trackCount
            FROM playlists p
            LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
            GROUP BY p.id
            ORDER BY p.name ASC
          `).all();

          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ playlists }));
        } catch (e: unknown) {
          const errMsg = e instanceof Error ? e.message : 'Database error';
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: errMsg }));
        }
        return;
      }

      // 9. Get specific Playlist (for mobile client pull)
      if (normalizedPath.startsWith('/api/sync/playlist/') && method === 'GET') {
        const paired = authenticateToken();
        if (!paired) {
          res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: false, error: 'Unauthorized: device is not paired' }));
          return;
        }

        const playlistId = parseInt(normalizedPath.replace('/api/sync/playlist/', ''), 10);
        const db = customDb || getDb();
        const playlist = db.prepare('SELECT name FROM playlists WHERE id = ?').get(playlistId) as { name: string } | undefined;

        if (!playlist) {
          res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: 'Playlist not found' }));
          return;
        }

        const tracks = db.prepare(`
          SELECT t.id as desktopTrackId, t.title, COALESCE(a.name, 'Unknown Artist') as artist, COALESCE(al.title, 'Unknown Album') as album,
                 t.duration, t.genre, t.track_number as trackNumber
          FROM playlist_tracks pt
          JOIN tracks t ON pt.track_id = t.id
          LEFT JOIN artists a ON t.artist_id = a.id
          LEFT JOIN albums al ON t.album_id = al.id
          WHERE pt.playlist_id = ?
          ORDER BY pt.position ASC
        `).all(playlistId);

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({
          playlistName: playlist.name,
          tracks,
        }));
        return;
      }

      // 10. Receive Shared Single Track (push to desktop)
      if (normalizedPath === '/api/sync/track' && method === 'POST') {
        const paired = authenticateToken();
        if (!paired) {
          res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: false, error: 'Unauthorized: device is not paired' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const track = data.track || data;
            const pendingItem: PendingSharedPlaylist = {
              id: crypto.randomUUID(),
              fromDeviceName: paired.name,
              playlistName: `Shared: ${track.title || 'Song'}`,
              trackCount: 1,
              tracks: [track],
              receivedAt: new Date().toISOString(),
            };

            pendingPlaylists.push(pendingItem);

            const win = getWin ? getWin() : null;
            if (win && !win.isDestroyed()) {
              win.webContents.send('sync:playlistReceived', pendingItem);
            }

            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ success: true, pendingId: pendingItem.id }));
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid track payload' }));
          }
        });
        return;
      }

      // 11. Receive Shared Playlist (push to desktop)
      if (normalizedPath === '/api/sync/playlist' && method === 'POST') {
        const paired = authenticateToken();
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
            const track = data.track || data;
            const pendingItem: PendingSharedPlaylist = {
              id: crypto.randomUUID(),
              fromDeviceName: paired.name,
              playlistName: `Shared: ${track.title || 'Song'}`,
              trackCount: 1,
              tracks: [track],
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
            res.end(JSON.stringify({ success: false, error: 'Invalid track payload' }));
          }
        });
        return;
      }

      // 11. Receive Shared Playlist (push to desktop)
      if (pathname === '/api/sync/playlist' && method === 'POST') {
        const paired = authenticateToken();
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
      // Clean up server reference so it is not falsely reported as active
      if (server) {
        try {
          server.close();
        } catch {}
        server = null;
      }
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
 * Send a single track to a paired peer device (or queue in inbox).
 */
export async function sendTrackToPeer(
  deviceId: string,
  trackId: number,
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

  const track = db.prepare(`
    SELECT t.id as desktopTrackId, t.title, COALESCE(a.name, 'Unknown Artist') as artist, COALESCE(al.title, 'Unknown Album') as album,
           t.duration, t.genre, t.track_number as trackNumber
    FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE t.id = ?
  `).get(trackId) as {
    desktopTrackId: number;
    title: string;
    artist: string;
    album: string;
    duration: number;
    genre: string | null;
    trackNumber: number | null;
  } | undefined;

  if (!track) {
    return { success: false, error: 'Track not found' };
  }

  // Queue in transfer inbox for mobile client pull
  pendingDeviceTransfers.push({
    id: crypto.randomUUID(),
    targetDeviceId: device.id,
    type: 'track',
    payload: { track },
    createdAt: new Date().toISOString(),
  });

  // Also attempt direct HTTP push (best effort)
  const postData = JSON.stringify({ track });
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: device.ip,
        port: targetPort,
        path: '/api/sync/track',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': `Bearer ${device.auth_token}`,
        },
        timeout: 3000,
      },
      () => {
        resolve({ success: true });
      }
    );

    req.on('error', () => {
      // Queued in inbox anyway, so transfer will be fetched
      resolve({ success: true });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: true });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Send a local playlist to a paired peer device (or queue in inbox).
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
    SELECT t.id as desktopTrackId, t.title, COALESCE(a.name, 'Unknown Artist') as artist, COALESCE(al.title, 'Unknown Album') as album,
           t.duration, t.genre, t.track_number as trackNumber
    FROM playlist_tracks pt
    JOIN tracks t ON pt.track_id = t.id
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE pt.playlist_id = ?
    ORDER BY pt.position ASC
  `).all(playlistId);

  // Queue in transfer inbox for mobile client pull
  pendingDeviceTransfers.push({
    id: crypto.randomUUID(),
    targetDeviceId: device.id,
    type: 'playlist',
    payload: {
      playlistName: playlist.name,
      tracks,
    },
    createdAt: new Date().toISOString(),
  });

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
        timeout: 4000,
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          resolve({ success: true });
        });
      }
    );

    req.on('error', () => {
      // Queued in inbox anyway, so transfer will be delivered
      resolve({ success: true });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: true });
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
    candidateIps: getAllLocalIpAddresses(),
    port: DEFAULT_PORT,
    activePairingPin: pinRemaining > 0 ? activePairingPin : null,
    pinExpiresInSeconds: pinRemaining,
    pairedDevices: getPairedDevices(customDb),
    pendingPlaylists: [...pendingPlaylists],
    nowPlaying: activeNowPlayingState,
  };
}
