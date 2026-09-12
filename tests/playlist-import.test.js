/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const supportedExtensions = ['.mp3', '.flac', '.wav', '.m4a', '.ogg', '.aac', '.wma'];

function isAudioFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return supportedExtensions.includes(ext);
}

function findAudioFilesRecursively(dirPath) {
  const results = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        results.push(...findAudioFilesRecursively(fullPath));
      } else if (entry.isFile() && isAudioFile(fullPath)) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err);
  }
  return results;
}

function initTestDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist_id INTEGER,
      year INTEGER,
      cover_art_path TEXT,
      FOREIGN KEY(artist_id) REFERENCES artists(id),
      UNIQUE(title, artist_id)
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      album_id INTEGER,
      artist_id INTEGER,
      path TEXT NOT NULL UNIQUE,
      duration REAL,
      track_number INTEGER,
      genre TEXT,
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
  `);
  return db;
}

function insertMockTrack(db, filePath, title, artistName, albumName) {
  const existing = db.prepare('SELECT id FROM tracks WHERE path = ?').get(filePath);
  if (existing) return existing.id;

  const insertArtist = db.prepare('INSERT INTO artists (name) VALUES (?) ON CONFLICT(name) DO UPDATE SET name=excluded.name RETURNING id');
  const artistRow = insertArtist.get(artistName);

  const insertAlbum = db.prepare('INSERT INTO albums (title, artist_id) VALUES (?, ?) ON CONFLICT(title, artist_id) DO UPDATE SET title=excluded.title RETURNING id');
  const albumRow = insertAlbum.get(albumName, artistRow.id);

  const insertTrack = db.prepare(`
    INSERT INTO tracks (title, album_id, artist_id, path, duration)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(path) DO NOTHING
  `);
  insertTrack.run(title, albumRow.id, artistRow.id, filePath, 180.0);

  const trackRow = db.prepare('SELECT id FROM tracks WHERE path = ?').get(filePath);
  return trackRow ? trackRow.id : null;
}

function importDirectoryAsPlaylistsTest(db, rootDir) {
  if (!fs.existsSync(rootDir)) {
    return { success: false, playlistsCreated: 0, tracksImported: 0, playlists: [] };
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const subDirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.'));
  const rootAudioFiles = entries
    .filter((e) => e.isFile() && isAudioFile(path.join(rootDir, e.name)))
    .map((e) => path.join(rootDir, e.name));

  const playlistMap = new Map();

  if (subDirs.length > 0) {
    for (const subDir of subDirs) {
      const subDirPath = path.join(rootDir, subDir.name);
      const audioFiles = findAudioFilesRecursively(subDirPath);
      if (audioFiles.length > 0) {
        playlistMap.set(subDir.name, audioFiles);
      }
    }
    if (rootAudioFiles.length > 0) {
      const rootName = path.basename(rootDir) || 'Library';
      playlistMap.set(rootName, rootAudioFiles);
    }
  } else {
    const audioFiles = findAudioFilesRecursively(rootDir);
    if (audioFiles.length > 0) {
      const folderName = path.basename(rootDir) || 'Imported Playlist';
      playlistMap.set(folderName, audioFiles);
    }
  }

  let totalPlaylistsCreated = 0;
  let totalTracksImported = 0;
  const resultPlaylists = [];

  for (const [playlistName, filePaths] of playlistMap.entries()) {
    let playlistRow = db.prepare('SELECT id, name FROM playlists WHERE name = ?').get(playlistName);
    if (!playlistRow) {
      const info = db.prepare('INSERT INTO playlists (name) VALUES (?)').run(playlistName);
      playlistRow = { id: Number(info.lastInsertRowid), name: playlistName };
      totalPlaylistsCreated++;
    }

    const playlistId = playlistRow.id;
    let addedCount = 0;

    for (const filePath of filePaths) {
      const trackName = path.basename(filePath, path.extname(filePath));
      const trackId = insertMockTrack(db, filePath, trackName, 'Test Artist', 'Test Album');
      if (trackId) {
        const posRow = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM playlist_tracks WHERE playlist_id = ?').get(playlistId);
        const nextPos = posRow ? posRow.next_pos : 0;

        const res = db.prepare('INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)').run(playlistId, trackId, nextPos);
        if (res.changes > 0) {
          addedCount++;
        }
        totalTracksImported++;
      }
    }

    resultPlaylists.push({ name: playlistName, trackCount: addedCount });
  }

  return {
    success: true,
    playlistsCreated: totalPlaylistsCreated,
    tracksImported: totalTracksImported,
    playlists: resultPlaylists,
  };
}

function getPlaylistTracksTest(db, playlistId) {
  const stmt = db.prepare(`
    SELECT t.id, t.title, t.path, a.name AS artist, al.title AS album
    FROM playlist_tracks pt
    JOIN tracks t ON pt.track_id = t.id
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE pt.playlist_id = ?
    ORDER BY pt.position ASC
  `);
  return stmt.all(playlistId);
}

function getAllTracksTest(db) {
  return db.prepare('SELECT t.id, t.title, t.path FROM tracks t ORDER BY t.title ASC').all();
}

function searchTracksTest(db, query) {
  const q = `%${query}%`;
  return db.prepare(`
    SELECT t.id, t.title, t.path, a.name AS artist, al.title AS album
    FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE t.title LIKE ? OR a.name LIKE ? OR al.title LIKE ?
  `).all(q, q, q);
}

test('Directory Playlist Imports & Scoped Views Suite', async (t) => {
  const tempDir = path.join(__dirname, 'temp_music_fixture');

  t.before(() => {
    // Create test directory tree
    const rockDir = path.join(tempDir, '80s Rock');
    const chillDir = path.join(tempDir, 'Chill Lofi');

    fs.mkdirSync(rockDir, { recursive: true });
    fs.mkdirSync(chillDir, { recursive: true });

    // Populate mock audio files
    fs.writeFileSync(path.join(rockDir, 'rock_anthem_1.mp3'), 'audio-content-1');
    fs.writeFileSync(path.join(rockDir, 'rock_anthem_2.mp3'), 'audio-content-2');
    fs.writeFileSync(path.join(chillDir, 'chill_beat_1.flac'), 'audio-content-3');
    fs.writeFileSync(path.join(chillDir, 'chill_beat_2.wav'), 'audio-content-4');
    fs.writeFileSync(path.join(tempDir, 'root_bonus_track.mp3'), 'audio-content-5');
  });

  t.after(() => {
    // Cleanup temporary files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  await t.test('imports subdirectories as distinct playlists with scoped tracks', () => {
    const db = initTestDb();
    const result = importDirectoryAsPlaylistsTest(db, tempDir);

    assert.equal(result.success, true);
    assert.equal(result.playlistsCreated, 3, 'Should create playlists for 80s Rock, Chill Lofi, and temp_music_fixture');

    const playlists = db.prepare('SELECT id, name FROM playlists ORDER BY name ASC').all();
    const playlistNames = playlists.map((p) => p.name);
    assert.ok(playlistNames.includes('80s Rock'), '80s Rock playlist exists');
    assert.ok(playlistNames.includes('Chill Lofi'), 'Chill Lofi playlist exists');
    assert.ok(playlistNames.includes('temp_music_fixture'), 'Root playlist exists');

    // Check scoped songs in 80s Rock
    const rockPlaylist = playlists.find((p) => p.name === '80s Rock');
    const rockTracks = getPlaylistTracksTest(db, rockPlaylist.id);
    assert.equal(rockTracks.length, 2, '80s Rock should contain exactly 2 songs');
    const rockTitles = rockTracks.map((tr) => tr.title);
    assert.ok(rockTitles.includes('rock_anthem_1'));
    assert.ok(rockTitles.includes('rock_anthem_2'));
    assert.ok(!rockTitles.includes('chill_beat_1'), '80s Rock must NOT leak Chill Lofi songs');

    // Check scoped songs in Chill Lofi
    const chillPlaylist = playlists.find((p) => p.name === 'Chill Lofi');
    const chillTracks = getPlaylistTracksTest(db, chillPlaylist.id);
    assert.equal(chillTracks.length, 2, 'Chill Lofi should contain exactly 2 songs');
    const chillTitles = chillTracks.map((tr) => tr.title);
    assert.ok(chillTitles.includes('chill_beat_1'));
    assert.ok(chillTitles.includes('chill_beat_2'));
    assert.ok(!chillTitles.includes('rock_anthem_1'), 'Chill Lofi must NOT leak Rock songs');
  });

  await t.test('All Songs query contains all tracks across all playlists', () => {
    const db = initTestDb();
    importDirectoryAsPlaylistsTest(db, tempDir);

    const allTracks = getAllTracksTest(db);
    assert.equal(allTracks.length, 5, 'All Songs must display all 5 indexed tracks');
    const titles = allTracks.map((t) => t.title);
    assert.ok(titles.includes('rock_anthem_1'));
    assert.ok(titles.includes('rock_anthem_2'));
    assert.ok(titles.includes('chill_beat_1'));
    assert.ok(titles.includes('chill_beat_2'));
    assert.ok(titles.includes('root_bonus_track'));
  });

  await t.test('Search queries find songs across all playlists globally', () => {
    const db = initTestDb();
    importDirectoryAsPlaylistsTest(db, tempDir);

    const searchRock = searchTracksTest(db, 'rock_anthem');
    assert.equal(searchRock.length, 2);

    const searchChill = searchTracksTest(db, 'chill_beat');
    assert.equal(searchChill.length, 2);

    const searchBonus = searchTracksTest(db, 'root_bonus');
    assert.equal(searchBonus.length, 1);
  });

  await t.test('Opening a single folder without subdirectories creates that single playlist', () => {
    const db = initTestDb();
    const rockSubDir = path.join(tempDir, '80s Rock');
    const result = importDirectoryAsPlaylistsTest(db, rockSubDir);

    assert.equal(result.success, true);
    assert.equal(result.playlistsCreated, 1);

    const playlists = db.prepare('SELECT id, name FROM playlists').all();
    assert.equal(playlists.length, 1);
    assert.equal(playlists[0].name, '80s Rock');

    const tracks = getPlaylistTracksTest(db, playlists[0].id);
    assert.equal(tracks.length, 2);
  });

  await t.test('Re-importing the same directory is idempotent and does not create duplicate entries', () => {
    const db = initTestDb();
    importDirectoryAsPlaylistsTest(db, tempDir);
    const secondResult = importDirectoryAsPlaylistsTest(db, tempDir);

    assert.equal(secondResult.playlistsCreated, 0, 'No new duplicate playlists should be created');
    const playlists = db.prepare('SELECT * FROM playlists').all();
    assert.equal(playlists.length, 3);

    const allTracks = getAllTracksTest(db);
    assert.equal(allTracks.length, 5, 'No duplicate tracks created');
  });
});
