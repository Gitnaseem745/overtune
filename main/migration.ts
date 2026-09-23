import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import Database from 'better-sqlite3';
import { getDb } from './db';

export interface MigrationRecord {
  version: number;
  name: string;
  applied_at: string;
}

export interface MigrationStatus {
  currentVersion: number;
  latestVersion: number;
  appliedMigrations: MigrationRecord[];
  backupAvailable: boolean;
  latestBackupPath: string | null;
}

interface MigrationDef {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}

/**
 * Migration registry defining versioned schema evolution.
 */
const MIGRATIONS: MigrationDef[] = [
  {
    version: 1,
    name: 'initial_core_schema',
    up: (db) => {
      // Core tables are created by initDb(); this marks baseline
      db.prepare(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    },
  },
  {
    version: 2,
    name: 'lyric_offsets',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS lyric_offsets (
          track_id INTEGER PRIMARY KEY,
          offset_ms INTEGER DEFAULT 0,
          FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );
      `);
    },
  },
  {
    version: 3,
    name: 'library_care_and_scan_tracking',
    up: (db) => {
      db.exec(`
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
    },
  },
  {
    version: 4,
    name: 'discovery_ratings_tags_and_smart_playlists',
    up: (db) => {
      db.exec(`
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
      `);
    },
  },
  {
    version: 5,
    name: 'paired_devices_for_sync',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS paired_devices (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          ip TEXT,
          paired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          auth_token TEXT NOT NULL
        );
      `);
    },
  },
];

/**
 * Creates an automatic pre-migration backup of the SQLite database.
 */
export function createPreMigrationBackup(customDbPath?: string): string | null {
  try {
    const dbPath = customDbPath || path.join(app.getPath('userData'), 'overtone.db');
    if (!fs.existsSync(dbPath)) return null;

    const backupDir = path.join(path.dirname(dbPath), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `overtone-pre-migration-${timestamp}.db`);

    fs.copyFileSync(dbPath, backupPath);

    // Prune old backups, keeping only the 5 most recent
    const existing = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('overtone-pre-migration-') && f.endsWith('.db'))
      .sort()
      .reverse();

    if (existing.length > 5) {
      for (const oldFile of existing.slice(5)) {
        try {
          fs.unlinkSync(path.join(backupDir, oldFile));
        } catch {
          // Ignore deletion error for old backup
        }
      }
    }

    return backupPath;
  } catch (err) {
    console.error('[Migration] Failed to create pre-migration backup:', err);
    return null;
  }
}

/**
 * Runs all pending database migrations in sequence inside a transaction.
 * Creates a pre-migration backup before starting.
 */
export function runMigrations(customDb?: Database.Database): { success: boolean; applied: number; error?: string } {
  const db = customDb || getDb();

  // Ensure migrations table exists
  db.prepare(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Create pre-migration backup
  if (!customDb) {
    createPreMigrationBackup();
  }

  const appliedRows = db.prepare('SELECT version FROM schema_migrations').all() as Array<{ version: number }>;
  const appliedSet = new Set(appliedRows.map(r => r.version));

  let appliedCount = 0;

  for (const migration of MIGRATIONS) {
    if (!appliedSet.has(migration.version)) {
      try {
        db.transaction(() => {
          migration.up(db);
          db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(
            migration.version,
            migration.name
          );
        })();
        appliedCount++;
        console.log(`[Migration] Applied version ${migration.version}: ${migration.name}`);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[Migration] Failed on version ${migration.version}:`, err);
        return { success: false, applied: appliedCount, error: errorMsg };
      }
    }
  }

  return { success: true, applied: appliedCount };
}

/**
 * Retrieves the current migration status and applied history.
 */
export function getMigrationStatus(customDb?: Database.Database): MigrationStatus {
  const db = customDb || getDb();

  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const applied = db.prepare('SELECT version, name, applied_at FROM schema_migrations ORDER BY version ASC').all() as MigrationRecord[];
    const currentVersion = applied.length > 0 ? applied[applied.length - 1].version : 0;
    const latestVersion = MIGRATIONS.length > 0 ? MIGRATIONS[MIGRATIONS.length - 1].version : 0;

    let backupAvailable = false;
    let latestBackupPath: string | null = null;

    try {
      const backupDir = path.join(app.getPath('userData'), 'backups');
      if (fs.existsSync(backupDir)) {
        const backups = fs.readdirSync(backupDir)
          .filter(f => f.startsWith('overtone-pre-migration-') && f.endsWith('.db'))
          .sort()
          .reverse();
        if (backups.length > 0) {
          backupAvailable = true;
          latestBackupPath = path.join(backupDir, backups[0]);
        }
      }
    } catch {
      // In test or non-electron environments app.getPath may not exist
    }

    return {
      currentVersion,
      latestVersion,
      appliedMigrations: applied,
      backupAvailable,
      latestBackupPath,
    };
  } catch (err) {
    console.error('[Migration] Failed to get migration status:', err);
    return {
      currentVersion: 0,
      latestVersion: MIGRATIONS.length,
      appliedMigrations: [],
      backupAvailable: false,
      latestBackupPath: null,
    };
  }
}
