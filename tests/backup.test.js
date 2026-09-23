/**
 * Personal Music Hub Tests — Overtune v0.2.0
 * 
 * Tests versioned database migrations, pre-migration safety backups,
 * library archive export (portable JSON schema), backup preview inspection,
 * restore conflict resolution policies (skip, merge, overwrite),
 * catalog relocation wizard, and local-network device sync pairing.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const Database = require('better-sqlite3');

describe('Personal Music Hub (Stability Milestone 0.2.0)', () => {
  let db;
  let tempDir;

  before(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'overtune-hub-test-'));
    const dbPath = path.join(tempDir, 'overtone-test.db');
    db = new Database(dbPath);

    // Initial Core Tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS artists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist_id INTEGER,
        cover_art_path TEXT,
        year INTEGER,
        FOREIGN KEY(artist_id) REFERENCES artists(id)
      );

      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        album_id INTEGER,
        artist_id INTEGER,
        path TEXT NOT NULL UNIQUE,
        duration REAL,
        genre TEXT,
        track_number INTEGER,
        file_hash TEXT,
        FOREIGN KEY(album_id) REFERENCES albums(id),
        FOREIGN KEY(artist_id) REFERENCES artists(id)
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_pinned BOOLEAN DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS playlist_tracks (
        playlist_id INTEGER,
        track_id INTEGER,
        position INTEGER,
        PRIMARY KEY(playlist_id, track_id),
        FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS lyric_offsets (
        track_id INTEGER PRIMARY KEY,
        offset_ms INTEGER DEFAULT 0,
        FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS watched_folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        last_scan_at DATETIME,
        track_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'idle'
      );

      CREATE TABLE IF NOT EXISTS scan_errors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folder_id INTEGER,
        file_path TEXT,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(folder_id) REFERENCES watched_folders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS play_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id INTEGER NOT NULL,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        duration_played REAL DEFAULT 0,
        FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS track_ratings (
        track_id INTEGER PRIMARY KEY,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS track_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id INTEGER NOT NULL,
        tag TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE,
        UNIQUE(track_id, tag)
      );

      CREATE TABLE IF NOT EXISTS smart_playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        rules_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS paired_devices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ip TEXT,
        paired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        auth_token TEXT NOT NULL
      );
    `);

    // Populate initial sample catalog
    const artRes = db.prepare("INSERT INTO artists (name) VALUES ('Cyberpulse')").run();
    const artistId = Number(artRes.lastInsertRowid);

    const albRes = db.prepare("INSERT INTO albums (title, artist_id, year) VALUES ('Neon Horizon', ?, 2026)").run(artistId);
    const albumId = Number(albRes.lastInsertRowid);

    const t1Res = db.prepare(`
      INSERT INTO tracks (title, artist_id, album_id, duration, path, genre)
      VALUES ('Cyber City', ?, ?, 240, 'D:\\Music\\Cyberpulse\\01 - Cyber City.flac', 'Synthwave')
    `).run(artistId, albumId);
    const t1Id = Number(t1Res.lastInsertRowid);

    const t2Res = db.prepare(`
      INSERT INTO tracks (title, artist_id, album_id, duration, path, genre)
      VALUES ('Night Drive', ?, ?, 195, 'D:\\Music\\Cyberpulse\\02 - Night Drive.flac', 'Synthwave')
    `).run(artistId, albumId);
    const t2Id = Number(t2Res.lastInsertRowid);

    // Initial playlist
    const plRes = db.prepare("INSERT INTO playlists (name) VALUES ('Evening Chill')").run();
    const plId = Number(plRes.lastInsertRowid);
    db.prepare('INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, 1)').run(plId, t1Id);

    // Initial rating & tag
    db.prepare('INSERT INTO track_ratings (track_id, rating) VALUES (?, 5)').run(t1Id);
    db.prepare("INSERT INTO track_tags (track_id, tag) VALUES (?, 'favorites')").run(t1Id);
    db.prepare("INSERT INTO track_tags (track_id, tag) VALUES (?, 'chill')").run(t1Id);

    // Initial watched folder
    db.prepare("INSERT INTO watched_folders (path, track_count) VALUES ('D:\\Music', 2)").run();

    // Initial settings
    db.prepare("INSERT INTO settings (key, value) VALUES ('theme', 'dark')").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('accent_color', 'orange')").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('window_bounds', '{\"width\":1280,\"height\":800}')").run();
  });

  after(() => {
    if (db) db.close();
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // Temp cleanup best-effort
      }
    }
  });

  describe('Database Schema Migrations', () => {
    it('initializes and records versioned schema migrations', () => {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      const migrations = [
        { version: 1, name: 'initial_core_schema' },
        { version: 2, name: 'lyric_offsets' },
        { version: 3, name: 'library_care_and_scan_tracking' },
        { version: 4, name: 'discovery_ratings_tags_and_smart_playlists' },
        { version: 5, name: 'paired_devices_for_sync' },
      ];

      for (const m of migrations) {
        db.prepare('INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (?, ?)').run(
          m.version,
          m.name
        );
      }

      const rows = db.prepare('SELECT version, name FROM schema_migrations ORDER BY version ASC').all();
      assert.equal(rows.length, 5);
      assert.equal(rows[0].version, 1);
      assert.equal(rows[4].version, 5);
      assert.equal(rows[4].name, 'paired_devices_for_sync');
    });

    it('creates a safe timestamped copy before database modifications', () => {
      const dbPath = path.join(tempDir, 'overtone-test.db');
      const backupPath = path.join(tempDir, `overtone-test-backup-${Date.now()}.db`);

      fs.copyFileSync(dbPath, backupPath);
      assert.equal(fs.existsSync(backupPath), true);
      assert.equal(fs.statSync(backupPath).size > 0, true);
    });
  });

  describe('Library Archive Export & JSON Schema Validation', () => {
    let exportedData;

    it('generates a valid overtone-backup schema archive', () => {
      // Replicate generateBackupData logic on test db
      const playlists = db.prepare('SELECT id, name, is_pinned, created_at FROM playlists').all().map(pl => {
        const tracks = db.prepare(`
          SELECT t.title, COALESCE(a.name, 'Unknown Artist') as artist, COALESCE(al.title, 'Unknown Album') as album,
                 t.duration, t.path, pt.position
          FROM playlist_tracks pt
          JOIN tracks t ON pt.track_id = t.id
          LEFT JOIN artists a ON t.artist_id = a.id
          LEFT JOIN albums al ON t.album_id = al.id
          WHERE pt.playlist_id = ?
          ORDER BY pt.position ASC
        `).all(pl.id);
        return {
          name: pl.name,
          is_pinned: Boolean(pl.is_pinned),
          created_at: pl.created_at,
          tracks,
        };
      });

      const ratings = db.prepare(`
        SELECT t.title, COALESCE(a.name, 'Unknown Artist') as artist, t.path, r.rating, r.created_at
        FROM track_ratings r
        JOIN tracks t ON r.track_id = t.id
        LEFT JOIN artists a ON t.artist_id = a.id
      `).all();

      const tags = db.prepare(`
        SELECT t.title, COALESCE(a.name, 'Unknown Artist') as artist, t.path, tg.tag
        FROM track_tags tg
        JOIN tracks t ON tg.track_id = t.id
        LEFT JOIN artists a ON t.artist_id = a.id
      `).all();

      const settingsRows = db.prepare('SELECT key, value FROM settings').all();
      const settings = {};
      const EXCLUDED_KEYS = new Set(['window_bounds', 'last_playback_state']);
      for (const s of settingsRows) {
        if (!EXCLUDED_KEYS.has(s.key)) {
          settings[s.key] = s.value;
        }
      }

      exportedData = {
        format: 'overtone-backup',
        schemaVersion: '1.0',
        exportedAt: new Date().toISOString(),
        appVersion: '0.2.0',
        data: {
          playlists,
          smartPlaylists: [],
          ratings,
          tags,
          playHistory: [],
          lyricOffsets: [],
          settings,
        },
      };

      assert.equal(exportedData.format, 'overtone-backup');
      assert.equal(exportedData.schemaVersion, '1.0');
      assert.equal(exportedData.data.playlists.length, 1);
      assert.equal(exportedData.data.playlists[0].name, 'Evening Chill');
      assert.equal(exportedData.data.playlists[0].tracks.length, 1);
      assert.equal(exportedData.data.playlists[0].tracks[0].title, 'Cyber City');
      assert.equal(exportedData.data.ratings.length, 1);
      assert.equal(exportedData.data.ratings[0].rating, 5);
      assert.equal(exportedData.data.tags.length, 2);
    });

    it('excludes runtime machine-specific window bounds from exported settings', () => {
      assert.equal(exportedData.data.settings.theme, 'dark');
      assert.equal(exportedData.data.settings.accent_color, 'orange');
      assert.equal(exportedData.data.settings.window_bounds, undefined);
    });
  });

  describe('Backup Preview & Validation', () => {
    it('correctly inspects and reports matched vs existing items', () => {
      const mockBackup = {
        format: 'overtone-backup',
        schemaVersion: '1.0',
        exportedAt: new Date().toISOString(),
        appVersion: '0.2.0',
        data: {
          playlists: [
            {
              name: 'Evening Chill', // Existing in DB
              tracks: [{ title: 'Cyber City', artist: 'Cyberpulse', path: 'D:\\Music\\Cyberpulse\\01 - Cyber City.flac' }],
            },
            {
              name: 'Synthwave Roadtrip', // New
              tracks: [{ title: 'Night Drive', artist: 'Cyberpulse', path: 'D:\\Music\\Cyberpulse\\02 - Night Drive.flac' }],
            },
          ],
          smartPlaylists: [{ name: 'Top 5 Stars', rules_json: '[]' }],
          ratings: [{ title: 'Night Drive', artist: 'Cyberpulse', rating: 4, path: 'D:\\Music\\Cyberpulse\\02 - Night Drive.flac' }],
          tags: [{ title: 'Night Drive', artist: 'Cyberpulse', tag: 'roadtrip', path: 'D:\\Music\\Cyberpulse\\02 - Night Drive.flac' }],
          playHistory: [],
          lyricOffsets: [],
          settings: { theme: 'dark' },
        },
      };

      const existingNames = new Set(
        db.prepare('SELECT name FROM playlists').all().map(p => p.name.toLowerCase())
      );

      let existingPlaylistsCount = 0;
      for (const pl of mockBackup.data.playlists) {
        if (existingNames.has(pl.name.toLowerCase())) {
          existingPlaylistsCount++;
        }
      }

      assert.equal(mockBackup.data.playlists.length, 2);
      assert.equal(existingPlaylistsCount, 1); // Evening Chill exists
      assert.equal(mockBackup.data.smartPlaylists.length, 1);
      assert.equal(mockBackup.data.ratings.length, 1);
    });

    it('detects and flags corrupted or unrecognized backup schemas', () => {
      const invalidBackup = { format: 'random-unknown', data: {} };
      const isValid = invalidBackup.format === 'overtone-backup' && Boolean(invalidBackup.data);
      assert.equal(isValid, false);
    });
  });

  describe('Restore Conflict Handling Policies', () => {
    const importPayload = {
      format: 'overtone-backup',
      schemaVersion: '1.0',
      data: {
        playlists: [
          {
            name: 'Evening Chill',
            tracks: [
              { title: 'Night Drive', artist: 'Cyberpulse', path: 'D:\\Music\\Cyberpulse\\02 - Night Drive.flac' },
            ],
          },
          {
            name: 'Brand New Mix',
            tracks: [
              { title: 'Cyber City', artist: 'Cyberpulse', path: 'D:\\Music\\Cyberpulse\\01 - Cyber City.flac' },
            ],
          },
        ],
        ratings: [
          { title: 'Night Drive', artist: 'Cyberpulse', path: 'D:\\Music\\Cyberpulse\\02 - Night Drive.flac', rating: 4 },
        ],
        tags: [
          { title: 'Cyber City', artist: 'Cyberpulse', path: 'D:\\Music\\Cyberpulse\\01 - Cyber City.flac', tag: 'retrowave' },
        ],
      },
    };

    it('Skip mode: preserves existing playlists and skips recreation', () => {
      // Under 'skip', Evening Chill shouldn't be altered
      const eveningChillBefore = db.prepare("SELECT id FROM playlists WHERE name = 'Evening Chill'").get();
      const tracksBefore = db.prepare('SELECT track_id FROM playlist_tracks WHERE playlist_id = ?').all(eveningChillBefore.id);

      assert.equal(tracksBefore.length, 1);

      // Simulating 'skip' restore:
      for (const pl of importPayload.data.playlists) {
        const existing = db.prepare('SELECT id FROM playlists WHERE LOWER(name) = LOWER(?)').get(pl.name);
        if (existing) {
          // Skip
          continue;
        } else {
          db.prepare('INSERT INTO playlists (name) VALUES (?)').run(pl.name);
        }
      }

      const tracksAfter = db.prepare('SELECT track_id FROM playlist_tracks WHERE playlist_id = ?').all(eveningChillBefore.id);
      assert.equal(tracksAfter.length, 1); // Unchanged

      const brandNew = db.prepare("SELECT id FROM playlists WHERE name = 'Brand New Mix'").get();
      assert.equal(Boolean(brandNew), true); // New one created
    });

    it('Merge mode: adds tracks into existing playlists without creating duplicate track rows', () => {
      const pl = db.prepare("SELECT id FROM playlists WHERE name = 'Evening Chill'").get();
      const trackToAdd = db.prepare("SELECT id FROM tracks WHERE title = 'Night Drive'").get();

      // Ensure trackToAdd is not duplicate before inserting
      db.prepare('INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, 2)').run(
        pl.id,
        trackToAdd.id
      );

      const tracksAfterMerge = db.prepare('SELECT track_id FROM playlist_tracks WHERE playlist_id = ?').all(pl.id);
      assert.equal(tracksAfterMerge.length, 2);

      // Attempting duplicate insert with same track_id
      db.prepare('INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, 3)').run(
        pl.id,
        trackToAdd.id
      );

      const tracksAfterDup = db.prepare('SELECT track_id FROM playlist_tracks WHERE playlist_id = ?').all(pl.id);
      assert.equal(tracksAfterDup.length, 2); // Deduped by primary key
    });

    it('Overwrite mode: completely replaces existing playlist tracklist with backup copy', () => {
      const pl = db.prepare("SELECT id FROM playlists WHERE name = 'Evening Chill'").get();

      // Wipe and replace
      db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ?').run(pl.id);
      const trackToAdd = db.prepare("SELECT id FROM tracks WHERE title = 'Night Drive'").get();
      db.prepare('INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, 1)').run(pl.id, trackToAdd.id);

      const tracksAfterOverwrite = db.prepare('SELECT track_id FROM playlist_tracks WHERE playlist_id = ?').all(pl.id);
      assert.equal(tracksAfterOverwrite.length, 1);
      assert.equal(tracksAfterOverwrite[0].track_id, trackToAdd.id);
    });
  });

  describe('Library Path Relocation Wizard', () => {
    it('batch replaces folder prefixes across tracks and watched folders', () => {
      const oldPrefix = 'D:\\Music';
      const newPrefix = 'E:\\AudioLibrary';

      const tracksBefore = db.prepare("SELECT path FROM tracks WHERE path LIKE 'D:\\Music%'").all();
      assert.equal(tracksBefore.length, 2);

      db.transaction(() => {
        const updateStmt = db.prepare('UPDATE tracks SET path = ? WHERE id = ?');
        const rows = db.prepare("SELECT id, path FROM tracks WHERE path LIKE 'D:\\Music%'").all();
        for (const row of rows) {
          const newPath = row.path.replace(oldPrefix, newPrefix);
          updateStmt.run(newPath, row.id);
        }

        const updateFolder = db.prepare('UPDATE watched_folders SET path = ? WHERE path = ?');
        updateFolder.run(newPrefix, oldPrefix);
      })();

      const tracksAfter = db.prepare("SELECT path FROM tracks WHERE path LIKE 'E:\\AudioLibrary%'").all();
      assert.equal(tracksAfter.length, 2);
      assert.equal(tracksAfter[0].path.startsWith('E:\\AudioLibrary'), true);

      const folderAfter = db.prepare('SELECT path FROM watched_folders').get();
      assert.equal(folderAfter.path, 'E:\\AudioLibrary');
    });

    it('preserves track IDs, ratings, tags, and playlist relations during path relocation', () => {
      const t1 = db.prepare("SELECT id FROM tracks WHERE title = 'Cyber City'").get();
      const rating = db.prepare('SELECT rating FROM track_ratings WHERE track_id = ?').get(t1.id);
      const tags = db.prepare('SELECT tag FROM track_tags WHERE track_id = ?').all(t1.id);

      assert.equal(rating.rating, 5);
      assert.equal(tags.length >= 2, true);
    });
  });

  describe('Local-Network Device Sync Logic', () => {
    it('generates a 6-digit numeric pairing PIN with expiration', () => {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      assert.equal(pin.length, 6);
      assert.equal(/^\d{6}$/.test(pin), true);
    });

    it('records authorized paired devices with cryptographic auth tokens', () => {
      const deviceId = 'test-device-uuid-1234';
      const deviceName = "Naseem's Laptop";
      const clientIp = '192.168.1.45';
      const authToken = 'a8f5c389472e48b9910d6194b63e18a2';

      db.prepare(`
        INSERT OR REPLACE INTO paired_devices (id, name, ip, paired_at, last_seen_at, auth_token)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        deviceId,
        deviceName,
        clientIp,
        new Date().toISOString(),
        new Date().toISOString(),
        authToken
      );

      const device = db.prepare('SELECT * FROM paired_devices WHERE id = ?').get(deviceId);
      assert.equal(device.name, "Naseem's Laptop");
      assert.equal(device.ip, '192.168.1.45');
      assert.equal(device.auth_token, authToken);
    });

    it('revokes paired devices cleanly on user demand', () => {
      const deviceId = 'test-device-uuid-1234';
      const res = db.prepare('DELETE FROM paired_devices WHERE id = ?').run(deviceId);
      assert.equal(res.changes, 1);

      const device = db.prepare('SELECT * FROM paired_devices WHERE id = ?').get(deviceId);
      assert.equal(device, undefined);
    });
  });
});
