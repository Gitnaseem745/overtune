/**
 * Overtone iOS — SQLite Database Migrations
 *
 * Explicit migration table with versioned, non-destructive migrations.
 * Never erases imported file data.
 */

export interface Migration {
  version: number;
  name: string;
  up: (db: any) => void;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: (db) => {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS artists (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS albums (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          artist_id INTEGER,
          year INTEGER,
          artwork_uri TEXT,
          FOREIGN KEY(artist_id) REFERENCES artists(id),
          UNIQUE(title, artist_id)
        );

        CREATE TABLE IF NOT EXISTS tracks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          album_id INTEGER,
          artist_id INTEGER,
          file_uri TEXT NOT NULL UNIQUE,
          duration REAL DEFAULT 0,
          track_number INTEGER,
          genre TEXT,
          file_hash TEXT,
          artwork_uri TEXT,
          file_size INTEGER DEFAULT 0,
          format TEXT,
          sample_rate INTEGER,
          bit_rate INTEGER,
          channels INTEGER,
          imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_played_at DATETIME,
          FOREIGN KEY(album_id) REFERENCES albums(id),
          FOREIGN KEY(artist_id) REFERENCES artists(id)
        );

        CREATE TABLE IF NOT EXISTS playlists (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_pinned BOOLEAN DEFAULT 0,
          source TEXT DEFAULT 'local',
          source_device_name TEXT
        );

        CREATE TABLE IF NOT EXISTS playlist_tracks (
          playlist_id INTEGER,
          track_id INTEGER,
          position INTEGER,
          added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY(playlist_id, track_id),
          FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
          FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS favorites (
          track_id INTEGER PRIMARY KEY,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS play_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          track_id INTEGER NOT NULL,
          played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          duration_played REAL DEFAULT 0,
          FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS paired_devices (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          ip TEXT,
          port INTEGER DEFAULT 47848,
          paired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          auth_token TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS playback_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          track_id INTEGER,
          current_time REAL DEFAULT 0,
          queue_ids TEXT DEFAULT '[]',
          queue_index INTEGER DEFAULT 0,
          shuffle_enabled BOOLEAN DEFAULT 0,
          repeat_mode TEXT DEFAULT 'off'
        );

        CREATE TABLE IF NOT EXISTS lyric_offsets (
          track_id INTEGER PRIMARY KEY,
          offset_ms INTEGER DEFAULT 0,
          FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes for fast lookups
        CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks(title COLLATE NOCASE);
        CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);
        CREATE INDEX IF NOT EXISTS idx_tracks_album_id ON tracks(album_id);
        CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
        CREATE INDEX IF NOT EXISTS idx_play_history_track ON play_history(track_id);
        CREATE INDEX IF NOT EXISTS idx_play_history_date ON play_history(played_at DESC);

        -- Insert initial playback state row
        INSERT OR IGNORE INTO playback_state (id) VALUES (1);
      `);
    },
  },
];

/**
 * Run all pending migrations.
 */
export function runMigrations(db: any): void {
  // Ensure migrations table exists
  db.execSync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Find applied versions
  const applied = new Set<number>();
  const rows = db.getAllSync('SELECT version FROM schema_migrations');
  for (const row of rows) {
    applied.add((row as any).version);
  }

  // Run pending migrations in order
  for (const migration of migrations) {
    if (!applied.has(migration.version)) {
      console.log(`[DB] Running migration v${migration.version}: ${migration.name}`);
      migration.up(db);
      db.runSync(
        'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
        [migration.version, migration.name]
      );
      console.log(`[DB] Migration v${migration.version} complete`);
    }
  }
}
