import * as path from 'path';
import * as fs from 'fs';
import * as mm from 'music-metadata';
import { getLyricOffset } from './db';

// ── Types ─────────────────────────────────────────────────────────────

export interface LyricLine {
  time: number;  // seconds (-1 for unsynced lines)
  text: string;
}

export interface LyricsData {
  lines: LyricLine[];
  isSynced: boolean;
  source: 'lrc' | 'txt' | 'embedded' | 'none';
  offset: number; // ms offset from DB
}

// ── LRC Parser ────────────────────────────────────────────────────────

/**
 * Parse an LRC file content into timestamped lyric lines.
 * Supports formats: [mm:ss.xx], [mm:ss.xxx], [mm:ss]
 * Also handles multiple timestamps per line: [00:10.00][00:20.00]text
 */
export function parseLrcContent(content: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const timestampRegex = /\[(\d{1,3}):(\d{2})(?:[.:])(\d{2,3})?\]/g;

  const rawLines = content.split(/\r?\n/);

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Skip metadata tags like [ti:], [ar:], [al:], [by:], [offset:], etc.
    if (/^\[[a-zA-Z]{2,}:/.test(trimmed)) continue;

    const timestamps: number[] = [];
    let lastMatchEnd = 0;
    let match: RegExpExecArray | null;

    // Reset lastIndex for the regex
    timestampRegex.lastIndex = 0;

    while ((match = timestampRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      let milliseconds = 0;

      if (match[3]) {
        const msStr = match[3];
        // Normalize: if 2 digits treat as centiseconds, if 3 digits treat as milliseconds
        milliseconds = msStr.length === 2
          ? parseInt(msStr, 10) * 10
          : parseInt(msStr, 10);
      }

      const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
      timestamps.push(timeInSeconds);
      lastMatchEnd = match.index + match[0].length;
    }

    if (timestamps.length === 0) continue;

    // Extract the text portion after all timestamps
    const text = trimmed.substring(lastMatchEnd).trim();

    // Create a line entry for each timestamp (handles multi-timestamp lines)
    for (const time of timestamps) {
      lines.push({ time, text });
    }
  }

  // Sort by time
  lines.sort((a, b) => a.time - b.time);

  return lines;
}

// ── TXT Parser ────────────────────────────────────────────────────────

/**
 * Parse plain text lyrics into unsynced lyric lines.
 */
export function parseTxtContent(content: string): LyricLine[] {
  const rawLines = content.split(/\r?\n/);
  return rawLines.map((line) => ({
    time: -1,
    text: line,
  }));
}

// ── Sidecar File Matching ─────────────────────────────────────────────

/**
 * Find lyrics sidecar files (.lrc, .txt) adjacent to the audio file.
 * Matches by base name (e.g., "song.mp3" -> "song.lrc" or "song.txt").
 */
function findSidecarLyricFile(trackPath: string): { filePath: string; type: 'lrc' | 'txt' } | null {
  const dir = path.dirname(trackPath);
  const baseName = path.basename(trackPath, path.extname(trackPath));

  // Priority: .lrc first (synced), then .txt (unsynced)
  const candidates = [
    { ext: '.lrc', type: 'lrc' as const },
    { ext: '.LRC', type: 'lrc' as const },
    { ext: '.txt', type: 'txt' as const },
    { ext: '.TXT', type: 'txt' as const },
  ];

  for (const candidate of candidates) {
    const candidatePath = path.join(dir, baseName + candidate.ext);
    try {
      if (fs.existsSync(candidatePath)) {
        return { filePath: candidatePath, type: candidate.type };
      }
    } catch {
      // Ignore filesystem errors, continue to next candidate
    }
  }

  return null;
}

// ── Embedded Lyrics Reader ────────────────────────────────────────────

/**
 * Attempt to read embedded lyrics from audio file metadata tags.
 * Supports USLT (ID3), LYRICS (Vorbis/FLAC), and ©lyr (M4A/AAC).
 */
async function readEmbeddedLyrics(trackPath: string): Promise<{ content: string; isSynced: boolean } | null> {
  try {
    const metadata = await mm.parseFile(trackPath);
    const lyrics = metadata.common.lyrics;

    if (lyrics && lyrics.length > 0) {
      // music-metadata returns lyrics as an array of ILyricsTag
      const firstLyric = lyrics[0];
      const text = typeof firstLyric === 'string' ? firstLyric : firstLyric.text || '';

      if (!text.trim()) return null;

      // Check if the embedded lyrics contain LRC timestamps
      const hasTimestamps = /\[\d{1,3}:\d{2}/.test(text);
      return { content: text, isSynced: hasTimestamps };
    }

    return null;
  } catch (err) {
    console.error(`[Lyrics] Error reading embedded lyrics from ${trackPath}:`, err);
    return null;
  }
}

// ── Main Lyrics Finder ────────────────────────────────────────────────

/**
 * Find and parse lyrics for a track. Search order:
 * 1. Adjacent .lrc sidecar file (synced)
 * 2. Adjacent .txt sidecar file (unsynced)
 * 3. Embedded lyrics in audio file metadata
 * 
 * Returns a LyricsData object. Never throws — returns a 'none' source on failure.
 */
export async function findLyricsForTrack(trackPath: string, trackId: number): Promise<LyricsData> {
  const noLyrics: LyricsData = {
    lines: [],
    isSynced: false,
    source: 'none',
    offset: 0,
  };

  if (!trackPath) return noLyrics;

  // Get the stored offset for this track
  let offset = 0;
  try {
    offset = getLyricOffset(trackId);
  } catch {
    // DB might not be ready, use 0
  }

  // 1. Check for sidecar files
  try {
    const sidecar = findSidecarLyricFile(trackPath);
    if (sidecar) {
      const content = await fs.promises.readFile(sidecar.filePath, 'utf-8');

      if (sidecar.type === 'lrc') {
        const lines = parseLrcContent(content);
        if (lines.length > 0) {
          return {
            lines,
            isSynced: true,
            source: 'lrc',
            offset,
          };
        }
      } else {
        const lines = parseTxtContent(content);
        if (lines.some((l) => l.text.trim())) {
          return {
            lines,
            isSynced: false,
            source: 'txt',
            offset,
          };
        }
      }
    }
  } catch (err) {
    console.error(`[Lyrics] Error reading sidecar file for ${trackPath}:`, err);
    // Fall through to embedded lyrics
  }

  // 2. Check embedded lyrics
  try {
    const embedded = await readEmbeddedLyrics(trackPath);
    if (embedded) {
      const lines = embedded.isSynced
        ? parseLrcContent(embedded.content)
        : parseTxtContent(embedded.content);

      if (lines.length > 0) {
        return {
          lines,
          isSynced: embedded.isSynced,
          source: 'embedded',
          offset,
        };
      }
    }
  } catch (err) {
    console.error(`[Lyrics] Error reading embedded lyrics for ${trackPath}:`, err);
  }

  return noLyrics;
}
