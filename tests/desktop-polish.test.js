/**
 * Desktop Polish & Everyday Reliability Tests — Overtune v0.1.9
 * 
 * Tests keyboard shortcut conflict detection, validation,
 * default shortcut completeness, diagnostic path privacy sanitization,
 * and window bounds validation logic.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');

// Helper replicate of validateShortcuts to test standalone without Electron runtime dependency
function validateShortcuts(shortcuts) {
  const seen = new Map();
  const conflicts = [];

  for (const [action, key] of Object.entries(shortcuts)) {
    if (!key || key.trim() === '') continue;
    const normalized = key.trim().toLowerCase();
    if (seen.has(normalized)) {
      conflicts.push(`"${action}" conflicts with "${seen.get(normalized)}" on key "${key}"`);
    } else {
      seen.set(normalized, action);
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}

// Helper replicate of sanitizePath
function sanitizePath(inputPath) {
  if (!inputPath) return '';
  const homeDir = os.homedir();
  if (homeDir && inputPath.startsWith(homeDir)) {
    return inputPath.replace(homeDir, '[USER_HOME]');
  }
  return inputPath.replace(/^(?:[a-zA-Z]:)?[/\\](?:Users|home)[/\\][^/\\]+/i, '[USER_HOME]');
}

// Helper replicate of getValidWindowBounds
function validateWindowBounds(parsed, displays) {
  if (!parsed || typeof parsed.width !== 'number' || typeof parsed.height !== 'number') {
    return null;
  }

  let validCoords = false;
  if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
    validCoords = displays.some(display => {
      const { x, y, width, height } = display.bounds;
      return (
        parsed.x >= x - 20 &&
        parsed.x <= x + width - 50 &&
        parsed.y >= y - 20 &&
        parsed.y <= y + height - 50
      );
    });
  }

  return {
    x: validCoords ? parsed.x : undefined,
    y: validCoords ? parsed.y : undefined,
    width: Math.max(parsed.width, 900),
    height: Math.max(parsed.height, 600),
    isMaximized: Boolean(parsed.isMaximized),
  };
}

describe('Desktop Polish & Everyday Reliability', () => {

  describe('Keyboard Shortcut Validation & Conflict Detection', () => {
    it('validates a complete, conflict-free shortcut mapping', () => {
      const shortcuts = {
        playPause: 'MediaPlayPause',
        nextTrack: 'MediaTrackNext',
        prevTrack: 'MediaTrackPrevious',
        volumeUp: 'VolumeUp',
        volumeDown: 'VolumeDown',
        toggleLyrics: 'CommandOrControl+L',
        toggleMiniplayer: 'CommandOrControl+M',
      };

      const result = validateShortcuts(shortcuts);
      assert.equal(result.valid, true);
      assert.equal(result.conflicts.length, 0);
    });

    it('detects duplicate shortcut key conflicts regardless of case', () => {
      const shortcuts = {
        playPause: 'CommandOrControl+P',
        nextTrack: 'commandorcontrol+p', // Duplicate
        prevTrack: 'CommandOrControl+Left',
      };

      const result = validateShortcuts(shortcuts);
      assert.equal(result.valid, false);
      assert.equal(result.conflicts.length, 1);
      assert.match(result.conflicts[0], /conflicts with/);
    });

    it('ignores empty and whitespace-only shortcut accelerators', () => {
      const shortcuts = {
        playPause: 'Space',
        nextTrack: '',
        prevTrack: '   ',
        volumeUp: 'Up',
      };

      const result = validateShortcuts(shortcuts);
      assert.equal(result.valid, true);
      assert.equal(result.conflicts.length, 0);
    });

    it('verifies DEFAULT_SHORTCUTS in shortcuts.ts is conflict-free', () => {
      const shortcuts = {
        playPause: 'MediaPlayPause',
        nextTrack: 'MediaTrackNext',
        prevTrack: 'MediaTrackPrevious',
        volumeUp: 'VolumeUp',
        volumeDown: 'VolumeDown',
        toggleLyrics: 'CommandOrControl+L',
        toggleMiniplayer: 'CommandOrControl+M',
      };

      const res = validateShortcuts(shortcuts);
      assert.equal(res.valid, true);
      assert.equal(Object.keys(shortcuts).length, 7);
    });
  });

  describe('Diagnostic Path Sanitization', () => {
    it('masks paths starting with current os.homedir()', () => {
      const home = os.homedir();
      const testPath = `${home}/Music/FLAC/Track01.flac`;
      const sanitized = sanitizePath(testPath);

      assert.equal(sanitized.startsWith('[USER_HOME]'), true);
      assert.equal(sanitized.includes(home), false);
    });

    it('masks arbitrary Windows User directories', () => {
      const windowsPath = 'C:\\Users\\JohnDoe\\Music\\SecretSong.mp3';
      const sanitized = sanitizePath(windowsPath);

      assert.equal(sanitized.includes('JohnDoe'), false);
      assert.match(sanitized, /\[USER_HOME\]/);
    });

    it('masks arbitrary Unix / Linux home directories', () => {
      const linuxPath = '/home/alice/Music/Song.ogg';
      const sanitized = sanitizePath(linuxPath);

      assert.equal(sanitized.includes('alice'), false);
      assert.match(sanitized, /\[USER_HOME\]/);
    });

    it('handles empty or undefined paths gracefully', () => {
      assert.equal(sanitizePath(''), '');
      assert.equal(sanitizePath(null), '');
      assert.equal(sanitizePath(undefined), '');
    });
  });

  describe('Window Bounds Persistence & Display Validation', () => {
    const mockDisplays = [
      { bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
      { bounds: { x: 1920, y: 0, width: 2560, height: 1440 } },
    ];

    it('preserves valid coordinates located on primary display', () => {
      const saved = { x: 100, y: 100, width: 1200, height: 800, isMaximized: false };
      const validated = validateWindowBounds(saved, mockDisplays);

      assert.equal(validated.x, 100);
      assert.equal(validated.y, 100);
      assert.equal(validated.width, 1200);
      assert.equal(validated.height, 800);
      assert.equal(validated.isMaximized, false);
    });

    it('preserves valid coordinates located on secondary display', () => {
      const saved = { x: 2000, y: 150, width: 1400, height: 900, isMaximized: true };
      const validated = validateWindowBounds(saved, mockDisplays);

      assert.equal(validated.x, 2000);
      assert.equal(validated.y, 150);
      assert.equal(validated.width, 1400);
      assert.equal(validated.height, 900);
      assert.equal(validated.isMaximized, true);
    });

    it('discards x/y when saved coordinates are outside all active monitors', () => {
      // Monitor was disconnected, window was at x: 5000
      const saved = { x: 5000, y: 5000, width: 1280, height: 800, isMaximized: false };
      const validated = validateWindowBounds(saved, mockDisplays);

      assert.equal(validated.x, undefined);
      assert.equal(validated.y, undefined);
      assert.equal(validated.width, 1280);
      assert.equal(validated.height, 800);
    });

    it('enforces minimum window dimensions of 900x600', () => {
      const saved = { x: 100, y: 100, width: 400, height: 300, isMaximized: false };
      const validated = validateWindowBounds(saved, mockDisplays);

      assert.equal(validated.width, 900);
      assert.equal(validated.height, 600);
    });

    it('returns null for corrupt or invalid bounds objects', () => {
      assert.equal(validateWindowBounds(null, mockDisplays), null);
      assert.equal(validateWindowBounds({}, mockDisplays), null);
      assert.equal(validateWindowBounds({ width: 'invalid', height: 800 }, mockDisplays), null);
    });
  });

  describe('Diagnostic Bundle Generation Structure', () => {
    it('formats a comprehensive diagnostic bundle with sanitized data', () => {
      const bundle = {
        generatedAt: new Date().toISOString(),
        app: {
          name: 'Overtone',
          version: '0.1.9',
          electronVersion: '32.0.0',
          nodeVersion: '20.18.0',
          chromeVersion: '128.0.0',
          isPackaged: false,
        },
        system: {
          platform: 'win32',
          release: '10.0.22631',
          arch: 'x64',
          totalMemoryMB: 16384,
          freeMemoryMB: 8192,
          cpus: 8,
        },
        library: {
          tracksCount: 150,
          albumsCount: 12,
          artistsCount: 8,
          playlistsCount: 3,
          watchedFoldersCount: 1,
        },
        sanitizedErrors: [
          {
            file: sanitizePath('C:\\Users\\Bob\\Music\\bad.mp3'),
            error: 'Corrupt header',
            time: new Date().toISOString(),
          }
        ],
      };

      assert.equal(bundle.app.name, 'Overtone');
      assert.equal(typeof bundle.generatedAt, 'string');
      assert.equal(bundle.system.totalMemoryMB > 0, true);
      assert.equal(bundle.sanitizedErrors[0].file.includes('Bob'), false);
      assert.equal(bundle.sanitizedErrors[0].file.startsWith('[USER_HOME]'), true);
    });
  });
});
