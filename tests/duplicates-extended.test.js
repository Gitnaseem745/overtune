/**
 * Extended Duplicate Detection & Stay (Ignore) Suite — Overtune v0.2.0
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const Database = require('better-sqlite3');

describe('Extended Duplicate Detection & Resolution', () => {
  let db;
  let tempDir;

  before(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'overtune-dup-test-'));
    const dbPath = path.join(tempDir, 'test.db');
    db = new Database(dbPath);

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
        genre TEXT,
        path TEXT NOT NULL UNIQUE,
        file_hash TEXT,
        FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE SET NULL,
        FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS ignored_duplicates (
        track_id_1 INTEGER NOT NULL,
        track_id_2 INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (track_id_1, track_id_2),
        FOREIGN KEY(track_id_1) REFERENCES tracks(id) ON DELETE CASCADE,
        FOREIGN KEY(track_id_2) REFERENCES tracks(id) ON DELETE CASCADE
      );
    `);
  });

  after(() => {
    if (db) db.close();
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function findDuplicatesTest(database) {
    const ignoredRows = database.prepare(`SELECT track_id_1, track_id_2 FROM ignored_duplicates`).all();
    const ignoredSet = new Set();
    for (const row of ignoredRows) {
      ignoredSet.add(`${Math.min(row.track_id_1, row.track_id_2)}_${Math.max(row.track_id_1, row.track_id_2)}`);
    }

    const allTracks = database.prepare(`
      SELECT
        t.id, t.title, t.path, t.duration, t.track_number, t.genre, t.file_hash,
        COALESCE(a.name, 'Unknown Artist') AS artist,
        COALESCE(al.title, 'Unknown Album') AS album
      FROM tracks t
      LEFT JOIN artists a ON t.artist_id = a.id
      LEFT JOIN albums al ON t.album_id = al.id
      ORDER BY t.id ASC
    `).all();

    if (allTracks.length < 2) return [];

    const adj = new Map();
    const trackMap = new Map();
    const edgeReason = new Map();

    for (const t of allTracks) {
      adj.set(t.id, new Set());
      trackMap.set(t.id, t);
    }

    function addEdge(id1, id2, reason) {
      if (id1 === id2) return;
      const key = `${Math.min(id1, id2)}_${Math.max(id1, id2)}`;
      if (ignoredSet.has(key)) return;

      adj.get(id1).add(id2);
      adj.get(id2).add(id1);
      if (!edgeReason.has(key)) edgeReason.set(key, reason);
    }

    // Exact hash matches
    const hashBuckets = new Map();
    for (const t of allTracks) {
      if (t.file_hash && t.file_hash.trim()) {
        const h = t.file_hash.trim();
        if (!hashBuckets.has(h)) hashBuckets.set(h, []);
        hashBuckets.get(h).push(t.id);
      }
    }
    for (const [, ids] of hashBuckets.entries()) {
      if (ids.length > 1) {
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            addEdge(ids[i], ids[j], 'Identical File Hash');
          }
        }
      }
    }

    const normalize = (str) => (str || '').toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();

    // Metadata matches (same title + close duration or same album, regardless of artist)
    const titleBuckets = new Map();
    for (const t of allTracks) {
      const normTitle = normalize(t.title);
      if (normTitle.length > 1) {
        if (!titleBuckets.has(normTitle)) titleBuckets.set(normTitle, []);
        titleBuckets.get(normTitle).push(t.id);
      }
    }

    for (const [, ids] of titleBuckets.entries()) {
      if (ids.length > 1) {
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            const t1 = trackMap.get(ids[i]);
            const t2 = trackMap.get(ids[j]);

            const d1 = t1.duration || 0;
            const d2 = t2.duration || 0;
            const durationDiff = Math.abs(d1 - d2);

            const album1 = normalize(t1.album);
            const album2 = normalize(t2.album);
            const sameAlbum = album1.length > 1 && album1 === album2;

            if (d1 > 0 && d2 > 0) {
              if (durationDiff <= 3.0) {
                addEdge(t1.id, t2.id, `Matching Title & Duration (~${Math.round(d1)}s)`);
              } else if (sameAlbum && durationDiff <= 8.0) {
                addEdge(t1.id, t2.id, `Matching Title & Album ("${t1.album}")`);
              }
            } else if (sameAlbum) {
              addEdge(t1.id, t2.id, `Matching Title & Album ("${t1.album}")`);
            }
          }
        }
      }
    }

    const visited = new Set();
    const groups = [];

    for (const t of allTracks) {
      if (visited.has(t.id)) continue;
      const neighbors = adj.get(t.id);
      if (neighbors.size === 0) continue;

      const cluster = [];
      const queue = [t.id];
      visited.add(t.id);

      while (queue.length > 0) {
        const curr = queue.shift();
        cluster.push(curr);
        for (const n of adj.get(curr)) {
          if (!visited.has(n)) {
            visited.add(n);
            queue.push(n);
          }
        }
      }

      if (cluster.length > 1) {
        groups.push({
          count: cluster.length,
          tracks: cluster.map((id) => trackMap.get(id)),
        });
      }
    }

    return groups;
  }

  function ignoreDuplicateTest(database, t1, t2) {
    const minId = Math.min(t1, t2);
    const maxId = Math.max(t1, t2);
    database.prepare(`
      INSERT OR IGNORE INTO ignored_duplicates (track_id_1, track_id_2) VALUES (?, ?)
    `).run(minId, maxId);
  }

  it('detects duplicate songs with same name and duration even if artists are different (e.g. JJ47 vs Umair)', () => {
    const art1 = db.prepare(`INSERT INTO artists (name) VALUES (?) RETURNING id`).get('JJ47').id;
    const art2 = db.prepare(`INSERT INTO artists (name) VALUES (?) RETURNING id`).get('Umair').id;

    const alb1 = db.prepare(`INSERT INTO albums (title, artist_id) VALUES (?, ?) RETURNING id`).get('3AM AT FALLS', art1).id;
    const alb2 = db.prepare(`INSERT INTO albums (title, artist_id) VALUES (?, ?) RETURNING id`).get('3AM AT FALLS', art2).id;

    // Different file_hash because artist was different in old hasher
    const t1 = db.prepare(`
      INSERT INTO tracks (title, artist_id, album_id, duration, path, file_hash)
      VALUES (?, ?, ?, ?, ?, ?) RETURNING id
    `).get('3AM AT FALLS', art1, alb1, 169.2, '/music/3am_jj47.mp3', 'hash_jj47_diff').id;

    const t2 = db.prepare(`
      INSERT INTO tracks (title, artist_id, album_id, duration, path, file_hash)
      VALUES (?, ?, ?, ?, ?, ?) RETURNING id
    `).get('3AM AT FALLS', art2, alb2, 169.4, '/music/3am_umair.mp3', 'hash_umair_diff').id;

    const dupes = findDuplicatesTest(db);
    assert.equal(dupes.length, 1, 'Should find 1 duplicate group despite different artists');
    assert.equal(dupes[0].count, 2, 'Should include both tracks');
    assert.equal(dupes[0].tracks[0].title, '3AM AT FALLS');
    assert.equal(dupes[0].tracks[1].title, '3AM AT FALLS');
  });

  it('allows user to choose "Stay" (ignore duplicate) and removes it from duplicate results', () => {
    const tracks = db.prepare(`SELECT id FROM tracks WHERE title = '3AM AT FALLS'`).all();
    assert.equal(tracks.length, 2);

    // User chooses "Stay"
    ignoreDuplicateTest(db, tracks[0].id, tracks[1].id);

    // Should no longer be returned as duplicate!
    const dupesAfter = findDuplicatesTest(db);
    assert.equal(dupesAfter.length, 0, 'Ignored duplicate pair should not appear in duplicates view');
  });

  it('does not flag songs with same name but completely different durations', () => {
    const art = db.prepare(`INSERT INTO artists (name) VALUES (?) RETURNING id`).get('Various').id;
    const alb = db.prepare(`INSERT INTO albums (title, artist_id) VALUES (?, ?) RETURNING id`).get('Compilation', art).id;

    db.prepare(`
      INSERT INTO tracks (title, artist_id, album_id, duration, path)
      VALUES (?, ?, ?, ?, ?)
    `).run('Intro', art, alb, 45.0, '/music/intro_short.mp3');

    db.prepare(`
      INSERT INTO tracks (title, artist_id, album_id, duration, path)
      VALUES (?, ?, ?, ?, ?)
    `).run('Intro', art, alb, 260.0, '/music/intro_long.mp3');

    const dupes = findDuplicatesTest(db);
    // Intro 45s vs 260s are different tracks, not duplicates
    const introGroups = dupes.filter(g => g.tracks.some(t => t.title === 'Intro'));
    assert.equal(introGroups.length, 0, 'Songs with same generic title but different durations should not be duplicates');
  });
});
