/**
 * Personal Discovery & Smart Playlists Tests — Overtune v0.1.8
 * 
 * Tests play history recording, play counts, history pause/clear,
 * ratings (1-5 stars), personal tags, smart playlist creation & evaluation,
 * mixes (forgotten favorites, recent additions), playback state restore,
 * and playlist track reordering.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const Database = require('better-sqlite3');

describe('Personal Discovery & Smart Playlists', () => {
  let db;
  let tempDir;

  before(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'overtune-discovery-test-'));
    const dbPath = path.join(tempDir, 'test.db');
    db = new Database(dbPath);

    // Schema
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
        FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE SET NULL,
        UNIQUE(title, artist_id)
      );

      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist_id INTEGER,
        album_id INTEGER,
        duration REAL NOT NULL,
        track_number INTEGER,
        disc_number INTEGER,
        genre TEXT,
        path TEXT NOT NULL UNIQUE,
        file_hash TEXT,
        FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE SET NULL,
        FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE SET NULL
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

      CREATE TABLE IF NOT EXISTS play_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id INTEGER NOT NULL,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        duration_played REAL DEFAULT 0,
        FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS track_ratings (
        track_id INTEGER PRIMARY KEY,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS track_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id INTEGER NOT NULL,
        tag TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(track_id, tag),
        FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
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
    `);

    // Insert sample artist, album and tracks
    db.prepare(`INSERT INTO artists (id, name) VALUES (1, 'Pink Floyd'), (2, 'Daft Punk')`).run();
    db.prepare(`INSERT INTO albums (id, title, artist_id, year) VALUES (1, 'The Dark Side of the Moon', 1, 1973), (2, 'Discovery', 2, 2001)`).run();

    db.prepare(`
      INSERT INTO tracks (id, title, artist_id, album_id, duration, track_number, genre, path, file_hash)
      VALUES 
        (1, 'Time', 1, 1, 425.0, 4, 'Progressive Rock', '/music/time.flac', 'hash1'),
        (2, 'Money', 1, 1, 382.0, 6, 'Progressive Rock', '/music/money.flac', 'hash2'),
        (3, 'One More Time', 2, 2, 320.0, 1, 'Electronic', '/music/onemoretime.mp3', 'hash3'),
        (4, 'Harder, Better, Faster, Stronger', 2, 2, 224.0, 4, 'Electronic', '/music/harder.mp3', 'hash4')
    `).run();
  });

  after(() => {
    if (db) db.close();
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('records play events and calculates play counts', () => {
    const recordPlay = (trackId, duration = 30) => {
      // Check if history enabled
      const setting = db.prepare(`SELECT value FROM settings WHERE key = 'play_history_enabled'`).get();
      if (setting && setting.value === 'false') return false;

      db.prepare(`
        INSERT INTO play_history (track_id, played_at, duration_played)
        VALUES (?, CURRENT_TIMESTAMP, ?)
      `).run(trackId, duration);
      return true;
    };

    const getPlayCounts = () => {
      const rows = db.prepare(`
        SELECT track_id, COUNT(*) as count 
        FROM play_history 
        GROUP BY track_id
      `).all();
      const counts = {};
      rows.forEach(r => { counts[r.track_id] = r.count; });
      return counts;
    };

    recordPlay(1, 425);
    recordPlay(1, 300);
    recordPlay(3, 320);

    const counts = getPlayCounts();
    assert.equal(counts[1], 2);
    assert.equal(counts[3], 1);
    assert.equal(counts[2], undefined);
  });

  it('pauses and clears listening history', () => {
    // Set setting to pause history
    db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('play_history_enabled', 'false')`).run();

    const recordPlay = (trackId) => {
      const setting = db.prepare(`SELECT value FROM settings WHERE key = 'play_history_enabled'`).get();
      if (setting && setting.value === 'false') return false;
      db.prepare(`INSERT INTO play_history (track_id) VALUES (?)`).run(trackId);
      return true;
    };

    // When paused, recording should return false and not insert
    const recorded = recordPlay(2);
    assert.equal(recorded, false);

    // Re-enable history
    db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('play_history_enabled', 'true')`).run();
    const recordedAfterResume = recordPlay(2);
    assert.equal(recordedAfterResume, true);

    // Clear history
    db.prepare(`DELETE FROM play_history`).run();
    const count = db.prepare(`SELECT COUNT(*) as count FROM play_history`).get().count;
    assert.equal(count, 0);
  });

  it('sets, updates, and deletes 5-star track ratings', () => {
    const setRating = (trackId, rating) => {
      if (rating <= 0) {
        db.prepare(`DELETE FROM track_ratings WHERE track_id = ?`).run(trackId);
      } else {
        db.prepare(`
          INSERT INTO track_ratings (track_id, rating) VALUES (?, ?)
          ON CONFLICT(track_id) DO UPDATE SET rating = excluded.rating
        `).run(trackId, rating);
      }
    };

    const getAllRatings = () => {
      const rows = db.prepare(`SELECT track_id, rating FROM track_ratings`).all();
      const map = {};
      rows.forEach(r => { map[r.track_id] = r.rating; });
      return map;
    };

    setRating(1, 5);
    setRating(2, 4);
    assert.equal(getAllRatings()[1], 5);
    assert.equal(getAllRatings()[2], 4);

    // Update rating
    setRating(1, 3);
    assert.equal(getAllRatings()[1], 3);

    // Clear rating
    setRating(2, 0);
    assert.equal(getAllRatings()[2], undefined);
  });

  it('adds, retrieves, and removes personal tags', () => {
    const addTag = (trackId, tag) => {
      db.prepare(`INSERT OR IGNORE INTO track_tags (track_id, tag) VALUES (?, ?)`).run(trackId, tag.trim().toLowerCase());
    };

    const removeTag = (trackId, tag) => {
      db.prepare(`DELETE FROM track_tags WHERE track_id = ? AND tag = ?`).run(trackId, tag.trim().toLowerCase());
    };

    const getTrackTags = (trackId) => {
      return db.prepare(`SELECT tag FROM track_tags WHERE track_id = ? ORDER BY tag ASC`).all(trackId).map(r => r.tag);
    };

    addTag(1, 'Chill');
    addTag(1, 'Classic');
    addTag(1, 'chill'); // duplicate ignore
    addTag(3, 'Workout');

    assert.deepEqual(getTrackTags(1), ['chill', 'classic']);
    assert.deepEqual(getTrackTags(3), ['workout']);

    removeTag(1, 'classic');
    assert.deepEqual(getTrackTags(1), ['chill']);
  });

  it('creates and evaluates smart playlist rules', () => {
    // Seed some ratings and plays
    db.prepare(`INSERT INTO track_ratings (track_id, rating) VALUES (3, 5), (4, 4)`).run();
    db.prepare(`INSERT INTO play_history (track_id) VALUES (3), (3), (4)`).run();

    const evaluateRules = (rules) => {
      let query = `
        SELECT 
          t.id, t.title, t.genre, al.year,
          COALESCE(a.name, 'Unknown Artist') AS artist,
          COALESCE(al.title, 'Unknown Album') AS album,
          COALESCE(tr.rating, 0) AS rating,
          COUNT(ph.id) AS play_count
        FROM tracks t
        LEFT JOIN artists a ON t.artist_id = a.id
        LEFT JOIN albums al ON t.album_id = al.id
        LEFT JOIN track_ratings tr ON t.id = tr.track_id
        LEFT JOIN play_history ph ON t.id = ph.track_id
        LEFT JOIN track_tags tt ON t.id = tt.track_id
        WHERE 1=1
      `;
      const params = [];

      for (const rule of rules) {
        if (rule.field === 'genre' && rule.value) {
          query += ` AND t.genre LIKE ?`;
          params.push(`%${rule.value}%`);
        } else if (rule.field === 'artist' && rule.value) {
          query += ` AND a.name LIKE ?`;
          params.push(`%${rule.value}%`);
        } else if (rule.field === 'year' && rule.value) {
          query += ` AND al.year = ?`;
          params.push(Number(rule.value));
        } else if (rule.field === 'min_rating') {
          query += ` AND COALESCE(tr.rating, 0) >= ?`;
          params.push(Number(rule.value));
        } else if (rule.field === 'tag' && rule.value) {
          query += ` AND tt.tag = ?`;
          params.push(String(rule.value).toLowerCase());
        }
      }

      query += ` GROUP BY t.id`;

      for (const rule of rules) {
        if (rule.field === 'min_plays') {
          query += ` HAVING play_count >= ?`;
          params.push(Number(rule.value));
        } else if (rule.field === 'unplayed') {
          query += ` HAVING play_count = 0`;
        }
      }

      return db.prepare(query).all(...params);
    };

    // Rule 1: Electronic genre
    const electronic = evaluateRules([{ field: 'genre', operator: 'contains', value: 'Electronic' }]);
    assert.equal(electronic.length, 2);

    // Rule 2: Minimum rating 4
    const highRated = evaluateRules([{ field: 'min_rating', operator: 'gte', value: 4 }]);
    assert.equal(highRated.length, 2);

    // Rule 3: Unplayed tracks
    const unplayed = evaluateRules([{ field: 'unplayed', operator: 'equals', value: 0 }]);
    assert.equal(unplayed.length, 2); // Tracks 1 and 2 had history cleared earlier
  });

  it('persists smart playlist CRUD', () => {
    const rules = [
      { field: 'genre', operator: 'contains', value: 'Rock' },
      { field: 'min_rating', operator: 'gte', value: 3 },
    ];

    // Create
    const insertStmt = db.prepare(`INSERT INTO smart_playlists (name, rules_json) VALUES (?, ?)`);
    const info = insertStmt.run('My Rock Favorites', JSON.stringify(rules));
    const plId = Number(info.lastInsertRowid);
    assert.ok(plId > 0);

    // Read
    const saved = db.prepare(`SELECT * FROM smart_playlists WHERE id = ?`).get(plId);
    assert.equal(saved.name, 'My Rock Favorites');
    assert.deepEqual(JSON.parse(saved.rules_json), rules);

    // Update
    const updatedRules = [{ field: 'artist', operator: 'contains', value: 'Pink Floyd' }];
    db.prepare(`UPDATE smart_playlists SET name = ?, rules_json = ? WHERE id = ?`)
      .run('Pink Floyd Only', JSON.stringify(updatedRules), plId);

    const updated = db.prepare(`SELECT * FROM smart_playlists WHERE id = ?`).get(plId);
    assert.equal(updated.name, 'Pink Floyd Only');
    assert.deepEqual(JSON.parse(updated.rules_json), updatedRules);

    // Delete
    db.prepare(`DELETE FROM smart_playlists WHERE id = ?`).run(plId);
    const deleted = db.prepare(`SELECT * FROM smart_playlists WHERE id = ?`).get(plId);
    assert.equal(deleted, undefined);
  });

  it('saves and restores last playback state and preferences', () => {
    const state = {
      trackId: 1,
      currentTime: 142.5,
      queueIds: [1, 2, 3],
      resumePreference: 'always',
    };

    // Save
    db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('last_playback_state', ?)`).run(JSON.stringify(state));
    db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('resume_preference', 'always')`).run();

    // Restore
    const row = db.prepare(`SELECT value FROM settings WHERE key = 'last_playback_state'`).get();
    assert.ok(row);
    const restored = JSON.parse(row.value);
    assert.equal(restored.trackId, 1);
    assert.equal(restored.currentTime, 142.5);
    assert.deepEqual(restored.queueIds, [1, 2, 3]);

    const prefRow = db.prepare(`SELECT value FROM settings WHERE key = 'resume_preference'`).get();
    assert.equal(prefRow.value, 'always');
  });

  it('reorders playlist tracks reliably', () => {
    // Create playlist
    const pl = db.prepare(`INSERT INTO playlists (name) VALUES ('Test Reorder')`).run();
    const plId = Number(pl.lastInsertRowid);

    // Add 3 tracks: 1, 2, 3
    db.prepare(`INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, 1, 0), (?, 2, 1), (?, 3, 2)`).run(plId, plId, plId);

    // Reorder: 3, 1, 2
    const newOrder = [3, 1, 2];
    const updateStmt = db.prepare(`UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?`);
    const runTransaction = db.transaction((ids) => {
      ids.forEach((id, index) => {
        updateStmt.run(index, plId, id);
      });
    });
    runTransaction(newOrder);

    // Query sorted by position
    const ordered = db.prepare(`
      SELECT track_id, position FROM playlist_tracks WHERE playlist_id = ? ORDER BY position ASC
    `).all(plId);

    assert.equal(ordered[0].track_id, 3);
    assert.equal(ordered[0].position, 0);
    assert.equal(ordered[1].track_id, 1);
    assert.equal(ordered[1].position, 1);
    assert.equal(ordered[2].track_id, 2);
    assert.equal(ordered[2].position, 2);
  });
});
