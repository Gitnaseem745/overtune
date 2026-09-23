import { app } from 'electron';
import * as os from 'os';
import * as fs from 'fs';
import { getDb, getScanErrors, getWatchedFolders } from './db';

export interface DiagnosticBundle {
  generatedAt: string;
  app: {
    name: string;
    version: string;
    electronVersion: string;
    nodeVersion: string;
    chromeVersion: string;
    isPackaged: boolean;
  };
  system: {
    platform: string;
    release: string;
    arch: string;
    totalMemoryMB: number;
    freeMemoryMB: number;
    cpus: number;
  };
  library: {
    tracksCount: number;
    albumsCount: number;
    artistsCount: number;
    playlistsCount: number;
    watchedFoldersCount: number;
  };
  sanitizedErrors: Array<{
    file: string;
    error: string;
    time: string;
  }>;
}

/**
 * Sanitize path to remove personal user account directories (e.g. C:\Users\Alice\... -> [USER_HOME]\...)
 */
export function sanitizePath(inputPath: string): string {
  if (!inputPath) return '';
  const homeDir = os.homedir();
  if (homeDir && inputPath.startsWith(homeDir)) {
    return inputPath.replace(homeDir, '[USER_HOME]');
  }
  // Generic username strip pattern for Windows/Linux/Mac (including optional drive letter C:)
  return inputPath.replace(/^(?:[a-zA-Z]:)?[/\\](?:Users|home)[/\\][^/\\]+/i, '[USER_HOME]');
}

/**
 * Generate a privacy-sanitized diagnostic bundle for support and issue reporting.
 */
export function generateDiagnosticReport(): DiagnosticBundle {
  let tracksCount = 0;
  let albumsCount = 0;
  let artistsCount = 0;
  let playlistsCount = 0;
  let watchedFoldersCount = 0;
  let recentErrors: Array<{ file_path?: string; error_message?: string; created_at?: string }> = [];

  try {
    const db = getDb();
    tracksCount = (db.prepare('SELECT COUNT(*) as count FROM tracks').get() as { count: number } | undefined)?.count || 0;
    albumsCount = (db.prepare('SELECT COUNT(*) as count FROM albums').get() as { count: number } | undefined)?.count || 0;
    artistsCount = (db.prepare('SELECT COUNT(*) as count FROM artists').get() as { count: number } | undefined)?.count || 0;
    playlistsCount = (db.prepare('SELECT COUNT(*) as count FROM playlists').get() as { count: number } | undefined)?.count || 0;
    const folders = getWatchedFolders();
    watchedFoldersCount = folders.length;
    recentErrors = getScanErrors() as Array<{ file_path?: string; error_message?: string; created_at?: string }>;
  } catch (err) {
    console.error('[Diagnostics] Error collecting DB stats:', err);
  }

  const sanitizedErrors = recentErrors.slice(0, 25).map((err) => ({
    file: sanitizePath(err.file_path || ''),
    error: String(err.error_message || ''),
    time: String(err.created_at || ''),
  }));

  return {
    generatedAt: new Date().toISOString(),
    app: {
      name: app.getName(),
      version: app.getVersion(),
      electronVersion: process.versions.electron || '',
      nodeVersion: process.versions.node || '',
      chromeVersion: process.versions.chrome || '',
      isPackaged: app.isPackaged,
    },
    system: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
      freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
      cpus: os.cpus().length,
    },
    library: {
      tracksCount,
      albumsCount,
      artistsCount,
      playlistsCount,
      watchedFoldersCount,
    },
    sanitizedErrors,
  };
}

/**
 * Export diagnostic report to file.
 */
export async function exportDiagnosticReport(targetFilePath: string): Promise<boolean> {
  const report = generateDiagnosticReport();
  const jsonContent = JSON.stringify(report, null, 2);
  await fs.promises.writeFile(targetFilePath, jsonContent, 'utf-8');
  return true;
}
