/**
 * Overtone iOS — Lyrics Service
 *
 * Local-first lyrics loader and parser.
 * Supports synchronized LRC format ([mm:ss.xx]), plain-text TXT lyrics,
 * sidecar file discovery adjacent to audio tracks, and per-track timing offsets.
 */

import * as FileSystem from 'expo-file-system/legacy';
import type { LyricLine, LyricsData, MobileTrack } from '../../domain/models';

export function parseLrcContent(content: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const timestampRegex = /\[(\d{1,3}):(\d{2})(?:[.:])(\d{2,3})?\]/g;
  const rawLines = content.split(/\r?\n/);

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Skip metadata tags like [ti:], [ar:], [al:], [offset:], etc.
    if (/^\[[a-zA-Z]{2,}:/.test(trimmed)) continue;

    const timestamps: number[] = [];
    let lastMatchEnd = 0;
    let match: RegExpExecArray | null;

    timestampRegex.lastIndex = 0;
    while ((match = timestampRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      let milliseconds = 0;

      if (match[3]) {
        const msStr = match[3];
        milliseconds = msStr.length === 2
          ? parseInt(msStr, 10) * 10
          : parseInt(msStr, 10);
      }

      const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
      timestamps.push(timeInSeconds);
      lastMatchEnd = match.index + match[0].length;
    }

    if (timestamps.length === 0) continue;

    const text = trimmed.substring(lastMatchEnd).trim();
    for (const time of timestamps) {
      lines.push({ time, text });
    }
  }

  lines.sort((a, b) => a.time - b.time);
  return lines;
}

export function parseTxtContent(content: string): LyricLine[] {
  const rawLines = content.split(/\r?\n/);
  return rawLines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((text) => ({
      time: -1,
      text,
    }));
}

class LyricsServiceImpl {
  private lyricsCache = new Map<number, LyricsData>();

  parseLRC(content: string): LyricLine[] {
    return parseLrcContent(content);
  }

  parsePlainText(content: string): LyricLine[] {
    return parseTxtContent(content);
  }

  getActiveLineIndex(lines: LyricLine[], currentTime: number, offsetMs: number = 0): number {
    if (!lines || lines.length === 0) return -1;
    const effectiveTime = currentTime + offsetMs / 1000;
    let activeIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= effectiveTime && lines[i].time >= 0) {
        activeIdx = i;
      } else if (lines[i].time > effectiveTime) {
        break;
      }
    }
    return activeIdx;
  }

  /**
   * Load lyrics for a track, checking sidecar files and stored cache.
   */
  async loadLyricsForTrack(track: MobileTrack, db?: any): Promise<LyricsData> {
    if (this.lyricsCache.has(track.id)) {
      const cached = this.lyricsCache.get(track.id)!;
      if (db?.lyricOffsets) {
        cached.offset = db.lyricOffsets.getOffset(track.id);
      }
      return cached;
    }

    let offset = 0;
    if (db?.lyricOffsets) {
      try {
        offset = db.lyricOffsets.getOffset(track.id);
      } catch {}
    }

    // 1. Try sidecar .lrc file adjacent to audio
    const lrcUri = track.fileUri.replace(/\.[^/.]+$/, '.lrc');
    try {
      const lrcInfo = await FileSystem.getInfoAsync(lrcUri);
      if (lrcInfo.exists) {
        const content = await FileSystem.readAsStringAsync(lrcUri);
        const lines = parseLrcContent(content);
        if (lines.length > 0) {
          const result: LyricsData = {
            lines,
            isSynced: true,
            source: 'lrc',
            offset,
          };
          this.lyricsCache.set(track.id, result);
          return result;
        }
      }
    } catch {}

    // 2. Try sidecar .txt file adjacent to audio
    const txtUri = track.fileUri.replace(/\.[^/.]+$/, '.txt');
    try {
      const txtInfo = await FileSystem.getInfoAsync(txtUri);
      if (txtInfo.exists) {
        const content = await FileSystem.readAsStringAsync(txtUri);
        const lines = parseTxtContent(content);
        if (lines.length > 0) {
          const result: LyricsData = {
            lines,
            isSynced: false,
            source: 'txt',
            offset,
          };
          this.lyricsCache.set(track.id, result);
          return result;
        }
      }
    } catch {}

    // 3. Try dedicated app lyrics directory
    const appLyricsUri = `${FileSystem.documentDirectory}lyrics/${track.id}.lrc`;
    try {
      const appLrcInfo = await FileSystem.getInfoAsync(appLyricsUri);
      if (appLrcInfo.exists) {
        const content = await FileSystem.readAsStringAsync(appLyricsUri);
        const lines = parseLrcContent(content);
        if (lines.length > 0) {
          const result: LyricsData = {
            lines,
            isSynced: true,
            source: 'lrc',
            offset,
          };
          this.lyricsCache.set(track.id, result);
          return result;
        }
      }
    } catch {}

    const emptyResult: LyricsData = {
      lines: [],
      isSynced: false,
      source: 'none',
      offset,
    };
    return emptyResult;
  }

  /**
   * Adjust and persist lyric timing offset in milliseconds (positive = delay lyrics, negative = advance lyrics).
   */
  setLyricOffset(trackId: number, offsetMs: number, db?: any): void {
    if (db?.lyricOffsets) {
      try {
        db.lyricOffsets.setOffset(trackId, offsetMs);
      } catch {}
    }
    const cached = this.lyricsCache.get(trackId);
    if (cached) {
      cached.offset = offsetMs;
    }
  }

  /**
   * Manually store/import lyrics text or LRC for a track.
   */
  async saveLyricsForTrack(trackId: number, rawContent: string): Promise<LyricsData> {
    const dir = `${FileSystem.documentDirectory}lyrics/`;
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }

    const path = `${dir}${trackId}.lrc`;
    await FileSystem.writeAsStringAsync(path, rawContent);

    const isLrc = rawContent.includes('[') && rawContent.includes(']');
    const lines = isLrc ? parseLrcContent(rawContent) : parseTxtContent(rawContent);

    const result: LyricsData = {
      lines,
      isSynced: isLrc,
      source: isLrc ? 'lrc' : 'txt',
      offset: 0,
    };
    this.lyricsCache.set(trackId, result);
    return result;
  }
}

export const LyricsService = new LyricsServiceImpl();
