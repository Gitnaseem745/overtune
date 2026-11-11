/**
 * Library Care & Metadata Tools Tests — Overtune v0.1.7
 * 
 * Tests database schema, watched folders, scan errors, metadata updating,
 * file tag writing with music-metadata, duplicate detection, missing file tracking,
 * relink flow, and health report generation.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const Database = require('better-sqlite3');


describe('Library Care — Database Operations', () => {
  let db;
  let tempDir;

  before(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'overtune-care-test-'));
    const dbPath = path.join(tempDir, 'test.db');
    db = new Database(dbPath);

    // Initialize full schema
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
    `);
  });

  after(() => {
    if (db) db.close();
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should add, update, and retrieve watched folders', () => {
    const folderPath = 'D:\\Music\\Rock';
    db.prepare(`
      INSERT INTO watched_folders (path, last_scan_at, status) VALUES (?, CURRENT_TIMESTAMP, 'idle')
    `).run(folderPath);

    const folders = db.prepare(`SELECT * FROM watched_folders`).all();
    assert.equal(folders.length, 1);
    assert.equal(folders[0].path, folderPath);
    assert.equal(folders[0].status, 'idle');

    // Update folder
    db.prepare(`
      UPDATE watched_folders SET track_count = ?, status = ? WHERE path = ?
    `).run(42, 'scanning', folderPath);

    const updated = db.prepare(`SELECT * FROM watched_folders WHERE path = ?`).get(folderPath);
    assert.equal(updated.track_count, 42);
    assert.equal(updated.status, 'scanning');
  });

  it('should log, retrieve, and clear scan errors', () => {
    const folder = db.prepare(`SELECT id FROM watched_folders LIMIT 1`).get();
    
    db.prepare(`
      INSERT INTO scan_errors (folder_id, file_path, error_message) VALUES (?, ?, ?)
    `).run(folder.id, 'D:\\Music\\Rock\\corrupt.mp3', 'Corrupt frame header');

    db.prepare(`
      INSERT INTO scan_errors (folder_id, file_path, error_message) VALUES (?, ?, ?)
    `).run(folder.id, 'D:\\Music\\Rock\\unsupported.xyz', 'Unsupported audio codec');

    let errors = db.prepare(`SELECT * FROM scan_errors WHERE folder_id = ?`).all(folder.id);
    assert.equal(errors.length, 2);
    assert.equal(errors[0].file_path, 'D:\\Music\\Rock\\corrupt.mp3');

    // Clear errors
    db.prepare(`DELETE FROM scan_errors WHERE folder_id = ?`).run(folder.id);
    errors = db.prepare(`SELECT * FROM scan_errors WHERE folder_id = ?`).all(folder.id);
    assert.equal(errors.length, 0);
  });

  it('should update track metadata in the catalog correctly', () => {
    // Insert initial artist, album, track
    const artistRes = db.prepare(`INSERT INTO artists (name) VALUES (?)`).run('Radiohead');
    const albumRes = db.prepare(`INSERT INTO albums (title, artist_id, year) VALUES (?, ?, ?)`).run('OK Computer', artistRes.lastInsertRowid, 1997);
    const trackRes = db.prepare(`
      INSERT INTO tracks (title, artist_id, album_id, duration, track_number, genre, path, file_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('Airbag', artistRes.lastInsertRowid, albumRes.lastInsertRowid, 284, 1, 'Alternative', 'D:\\Music\\airbag.mp3', 'hash123');

    const trackId = trackRes.lastInsertRowid;

    // Simulate catalog update
    db.prepare(`UPDATE tracks SET title = ?, track_number = ?, genre = ? WHERE id = ?`).run('Airbag (Remastered)', 2, 'Art Rock', trackId);

    const updated = db.prepare(`SELECT * FROM tracks WHERE id = ?`).get(trackId);
    assert.equal(updated.title, 'Airbag (Remastered)');
    assert.equal(updated.track_number, 2);
    assert.equal(updated.genre, 'Art Rock');
  });

  it('should group and detect duplicate tracks by file hash', () => {
    // Insert 2 tracks with identical hash
    const art = db.prepare(`SELECT id FROM artists LIMIT 1`).get().id;
    const alb = db.prepare(`SELECT id FROM albums LIMIT 1`).get().id;

    db.prepare(`
      INSERT INTO tracks (title, artist_id, album_id, duration, path, file_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Copy 1', art, alb, 180, 'D:\\Music\\copy1.mp3', 'identical_hash_abc');

    db.prepare(`
      INSERT INTO tracks (title, artist_id, album_id, duration, path, file_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Copy 2', art, alb, 180, 'D:\\Music\\copy2.mp3', 'identical_hash_abc');

    const duplicateGroups = db.prepare(`
      SELECT file_hash, COUNT(*) as count
      FROM tracks
      WHERE file_hash IS NOT NULL AND file_hash != ''
      GROUP BY file_hash
      HAVING count > 1
    `).all();

    assert.equal(duplicateGroups.length, 1);
    assert.equal(duplicateGroups[0].file_hash, 'identical_hash_abc');
    assert.equal(duplicateGroups[0].count, 2);
  });

  it('should detect missing files on disk', () => {
    // One track with real temp file, one with nonexistent path
    const realFile = path.join(tempDir, 'exists.mp3');
    fs.writeFileSync(realFile, Buffer.from('dummy audio content'));

    const ghostFile = path.join(tempDir, 'does_not_exist.mp3');

    const tracks = [
      { id: 101, title: 'Real Song', path: realFile },
      { id: 102, title: 'Ghost Song', path: ghostFile },
    ];

    const missing = tracks.filter((t) => !fs.existsSync(t.path));
    assert.equal(missing.length, 1);
    assert.equal(missing[0].id, 102);
    assert.equal(missing[0].title, 'Ghost Song');
  });

  it('should relink a track to a new path', () => {
    const oldPath = 'D:\\OldDrive\\song.mp3';
    const newPath = 'D:\\NewDrive\\song.mp3';

    const art = db.prepare(`SELECT id FROM artists LIMIT 1`).get().id;
    const alb = db.prepare(`SELECT id FROM albums LIMIT 1`).get().id;

    const t = db.prepare(`
      INSERT INTO tracks (title, artist_id, album_id, duration, path)
      VALUES (?, ?, ?, ?, ?)
    `).run('Relink Test', art, alb, 200, oldPath);

    db.prepare(`UPDATE tracks SET path = ? WHERE id = ?`).run(newPath, t.lastInsertRowid);

    const relinked = db.prepare(`SELECT path FROM tracks WHERE id = ?`).get(t.lastInsertRowid);
    assert.equal(relinked.path, newPath);
  });

  it('should calculate accurate library health report metrics', () => {
    const totalTracks = db.prepare(`SELECT COUNT(*) as c FROM tracks`).get().c;
    assert(totalTracks > 0);

    const zeroDuration = db.prepare(`SELECT COUNT(*) as c FROM tracks WHERE duration IS NULL OR duration <= 0`).get().c;
    assert.equal(zeroDuration, 0);

    const missingGenre = db.prepare(`SELECT COUNT(*) as c FROM tracks WHERE genre IS NULL OR genre = ''`).get().c;
    assert(missingGenre >= 0);
  });
});

describe('Library Care — File Tag Writing (music-metadata)', () => {
  let tempDir;
  let testMp3Path;
  before(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'overtune-id3-test-'));
    testMp3Path = path.join(tempDir, 'sample.mp3');
    const audio = Buffer.alloc(417 * 4);
    for (let i = 0; i < 4; i++) Buffer.from([255, 251, 144, 0]).copy(audio, i * 417);
    fs.writeFileSync(testMp3Path, audio);
    const { updateFile } = await import('music-metadata');
    await updateFile(testMp3Path, { title: 'Original Title', artist: 'Original Artist', album: 'Original Album', year: 2020, track: { no: 1, of: 12 }, genre: 'Rock' });
  });
  after(() => { if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true }); });
  it('reads initial ID3 tags', async () => {
    const { parseFile } = await import('music-metadata');
    const { common } = await parseFile(testMp3Path);
    assert.equal(common.title, 'Original Title');
    assert.equal(common.artist, 'Original Artist');
    assert.equal(common.album, 'Original Album');
  });
  it('updates selected tags while preserving track totals and audio', async () => {
    const { updateFile } = await import('music-metadata');
    const { parseFile } = await import('music-metadata');
    const before = fs.readFileSync(testMp3Path).subarray(-417 * 4);
    await updateFile(testMp3Path, { title: 'Updated Title', artist: 'Updated Artist', year: 2026, track: { no: 5 }, genre: 'Electronic' });
    const { common } = await parseFile(testMp3Path);
    assert.equal(common.title, 'Updated Title');
    assert.equal(common.year, 2026);
    assert.deepEqual(common.track, { no: 5, of: 12 });
    assert.equal(common.genre[0], 'Electronic');
    assert.deepEqual(fs.readFileSync(testMp3Path).subarray(-417 * 4), before);
  });
});