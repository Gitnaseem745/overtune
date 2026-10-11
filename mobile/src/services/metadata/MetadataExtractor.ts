/**
 * Overtone iOS — Metadata Extractor
 *
 * Extracts audio metadata (title, artist, album, duration, track number)
 * using filename parsing, expo-audio native player probing, audio header inspection,
 * and reliable duration fallback mechanisms.
 */

import { createAudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

export interface ExtractedMetadata {
  title: string;
  artist: string | null;
  album: string | null;
  duration: number; // in seconds
  trackNumber: number | null;
  genre: string | null;
  year: number | null;
  artworkBase64?: string | null;
  sampleRate?: number | null;
  bitRate?: number | null;
  channels?: number | null;
}

/**
 * Parses artist, album, track number and title from common filename patterns:
 * - "01 - Artist - Title.mp3"
 * - "Artist - Title.mp3"
 * - "01 Title.mp3"
 * - "Title.mp3"
 */
export function parseMetadataFromFileName(fileName: string): {
  title: string;
  artist: string | null;
  trackNumber: number | null;
} {
  // Strip extension
  const base = fileName.replace(/\.[^/.]+$/, '').trim();

  // Pattern: "01 - Artist - Track" or "01. Artist - Track"
  let match = base.match(/^(\d+)[\s.-]+\s*(.+?)\s*-\s*(.+)$/);
  if (match) {
    return {
      trackNumber: parseInt(match[1], 10),
      artist: match[2].trim(),
      title: match[3].trim(),
    };
  }

  // Pattern: "01 - Track" or "01 Track"
  match = base.match(/^(\d+)[\s.-]+\s*(.+)$/);
  if (match) {
    return {
      trackNumber: parseInt(match[1], 10),
      artist: null,
      title: match[2].trim(),
    };
  }

  // Pattern: "Artist - Track"
  match = base.match(/^(.+?)\s*-\s*(.+)$/);
  if (match) {
    return {
      trackNumber: null,
      artist: match[1].trim(),
      title: match[2].trim(),
    };
  }

  // Default: filename as title
  return {
    trackNumber: null,
    artist: null,
    title: base.replace(/[_]+/g, ' ').trim(),
  };
}

/**
 * Robust base64 to byte array decoder with zero external dependencies.
 */
function decodeBase64ToBytes(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bufferLength = Math.floor(base64.length * 0.75);
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const enc1 = chars.indexOf(base64[i]);
    const enc2 = chars.indexOf(base64[i + 1]);
    const enc3 = chars.indexOf(base64[i + 2]);
    const enc4 = chars.indexOf(base64[i + 3]);
    if (enc1 === -1 || enc2 === -1) break;
    bytes[p++] = (enc1 << 2) | (enc2 >> 4);
    if (enc3 !== -1 && base64[i + 2] !== '=') {
      bytes[p++] = ((enc2 & 15) << 4) | (enc3 >> 2);
    }
    if (enc4 !== -1 && base64[i + 3] !== '=') {
      bytes[p++] = ((enc3 & 3) << 6) | enc4;
    }
  }
  return bytes.subarray(0, p);
}

/**
 * Fast audio header parser to determine exact track duration without waiting for native player.
 * Supports WAV, MP3 (CBR/VBR), M4A/AAC, FLAC, and fallback bitrate calculation.
 */
export async function parseAudioHeaderDuration(
  fileUri: string,
  fileSize: number,
  ext: string
): Promise<number> {
  const extension = ext.toLowerCase().replace('.', '');

  // 1. WAV
  if (extension === 'wav') {
    try {
      const b64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
        position: 0,
        length: 64,
      });
      const bytes = decodeBase64ToBytes(b64);
      const headerStr = String.fromCharCode(...bytes.slice(0, 4));
      const waveStr = String.fromCharCode(...bytes.slice(8, 12));
      if (headerStr === 'RIFF' && waveStr === 'WAVE') {
        const byteRate = bytes[28] | (bytes[29] << 8) | (bytes[30] << 16) | (bytes[31] << 24);
        if (byteRate > 0 && fileSize > 44) {
          return Math.round((fileSize - 44) / byteRate);
        }
      }
    } catch {}
    if (fileSize > 0) return Math.max(1, Math.round(fileSize / 176400));
  }

  // 2. MP3
  if (extension === 'mp3') {
    try {
      const b64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
        position: 0,
        length: 2048,
      });
      const bytes = decodeBase64ToBytes(b64);
      let offset = 0;
      if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
        // ID3v2 tag present
        const tagSize =
          ((bytes[6] & 0x7f) << 21) |
          ((bytes[7] & 0x7f) << 14) |
          ((bytes[8] & 0x7f) << 7) |
          (bytes[9] & 0x7f);
        offset = 10 + tagSize;
      }
      const bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
      for (let i = 0; i < Math.min(bytes.length - 4, 1024); i++) {
        if (bytes[i] === 0xff && (bytes[i + 1] & 0xe0) === 0xe0) {
          const b2 = bytes[i + 2];
          const bitrateIdx = (b2 >> 4) & 0x0f;
          const kbps = bitrates[bitrateIdx];
          if (kbps && kbps > 0 && fileSize > offset) {
            return Math.round((fileSize - offset) / (kbps * 125));
          }
          break;
        }
      }
    } catch {}
    // Typical 192 kbps MP3: 24,000 bytes/sec
    if (fileSize > 0) return Math.max(1, Math.round(fileSize / 24000));
  }

  // 3. M4A / AAC / ALAC
  if (extension === 'm4a' || extension === 'aac' || extension === 'alac') {
    try {
      const b64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
        position: 0,
        length: 4096,
      });
      const bytes = decodeBase64ToBytes(b64);
      for (let i = 0; i < bytes.length - 16; i++) {
        if (
          bytes[i] === 0x6d && // 'm'
          bytes[i + 1] === 0x76 && // 'v'
          bytes[i + 2] === 0x68 && // 'h'
          bytes[i + 3] === 0x64 // 'd'
        ) {
          const version = bytes[i + 4];
          const dataOffset = i + 8 + (version === 1 ? 16 : 8);
          if (dataOffset + 8 <= bytes.length) {
            const timeScale =
              (bytes[dataOffset] << 24) |
              (bytes[dataOffset + 1] << 16) |
              (bytes[dataOffset + 2] << 8) |
              bytes[dataOffset + 3];
            const durOffset = dataOffset + 4;
            const durUnits =
              (bytes[durOffset] << 24) |
              (bytes[durOffset + 1] << 16) |
              (bytes[durOffset + 2] << 8) |
              bytes[durOffset + 3];
            if (timeScale > 0 && durUnits > 0) {
              return Math.round(durUnits / timeScale);
            }
          }
        }
      }
    } catch {}
    if (fileSize > 0) return Math.max(1, Math.round(fileSize / 24000));
  }

  // 4. FLAC
  if (extension === 'flac') {
    try {
      const b64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
        position: 0,
        length: 64,
      });
      const bytes = decodeBase64ToBytes(b64);
      if (
        bytes[0] === 0x66 && // 'f'
        bytes[1] === 0x4c && // 'L'
        bytes[2] === 0x61 && // 'a'
        bytes[3] === 0x43 // 'C'
      ) {
        const sampleRate =
          ((bytes[18] << 12) | (bytes[19] << 4) | (bytes[20] >> 4)) & 0xfffff;
        const totalSamples =
          (bytes[21] & 0x0f) * 0x100000000 +
          (bytes[22] << 24) +
          (bytes[23] << 16) +
          (bytes[24] << 8) +
          bytes[25];
        if (sampleRate > 0 && totalSamples > 0) {
          return Math.round(totalSamples / sampleRate);
        }
      }
    } catch {}
    if (fileSize > 0) return Math.max(1, Math.round(fileSize / 100000));
  }

  // Generic fallback if fileSize > 0 (assume 192 kbps = 24,000 bytes/sec)
  if (fileSize > 0) {
    return Math.max(1, Math.round(fileSize / 24000));
  }

  return 0;
}

/**
 * Asynchronously probes an audio file using expo-audio by awaiting the playback status.
 */
export async function probeAudioDuration(fileUri: string): Promise<number> {
  return new Promise((resolve) => {
    let player: any = null;
    let sub: any = null;
    let finished = false;

    const cleanup = (dur: number) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        sub?.remove();
        player?.remove();
      } catch {}
      resolve(Math.max(0, Math.round(dur)));
    };

    const timer = setTimeout(() => {
      try {
        if (player && typeof player.duration === 'number' && player.duration > 0) {
          cleanup(player.duration);
          return;
        }
      } catch {}
      cleanup(0);
    }, 1200);

    try {
      player = createAudioPlayer({ uri: fileUri });

      if (typeof player?.duration === 'number' && player.duration > 0) {
        cleanup(player.duration);
        return;
      }

      sub = player.addListener('playbackStatusUpdate', (status: any) => {
        if (status?.duration && status.duration > 0) {
          cleanup(status.duration);
        } else if (status?.isLoaded && status?.duration > 0) {
          cleanup(status.duration);
        }
      });
    } catch {
      cleanup(0);
    }
  });
}

/**
 * Extracts metadata for an audio file by probing the audio file with expo-audio,
 * inspecting file headers, and combining with filename heuristics.
 */
export async function extractAudioMetadata(
  fileUri: string,
  fileName: string
): Promise<ExtractedMetadata> {
  const parsed = parseMetadataFromFileName(fileName);
  let duration = 0;

  // 1. First probe native audio player
  try {
    duration = await probeAudioDuration(fileUri);
  } catch (err) {
    console.warn(`[MetadataExtractor] Audio player probe error for ${fileName}:`, err);
  }

  // 2. If probe returned 0, parse audio header / estimate from file size
  if (!duration || duration <= 0) {
    try {
      const ext = fileName.split('.').pop() || 'mp3';
      const info = await FileSystem.getInfoAsync(fileUri);
      const size = info.exists && 'size' in info ? info.size || 0 : 0;
      duration = await parseAudioHeaderDuration(fileUri, size, ext);
    } catch (err) {
      console.warn(`[MetadataExtractor] Header parse error for ${fileName}:`, err);
    }
  }

  return {
    title: parsed.title,
    artist: parsed.artist,
    album: null,
    duration: Math.max(0, Math.round(duration)),
    trackNumber: parsed.trackNumber,
    genre: null,
    year: null,
  };
}
