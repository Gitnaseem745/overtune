# Overtone v0.2.0 — Personal Music Hub

## 🎵 Overtone v0.2.0 — Official Personal Music Hub Launch!

I am thrilled to announce the official milestone release of **Overtone v0.2.0 — Personal Music Hub**! 

This release represents a massive evolution from v0.1.5, consolidating full offline library care, Spotify-grade synchronized lyrics, personalized discovery with smart playlists, comprehensive desktop hotkeys & system tray integration, cross-artist duplicate resolution, a distraction-free Spotify fullscreen player, and 100% private local-network device synchronization.

Everything in Overtone remains **100% offline, private, and local-first** — with zero tracking, zero cloud dependencies, and zero accounts required.

---

## ✨ What's Built in this Milestone Release (v0.1.6 → v0.2.0)

### 🎧 Spotify-Grade Fullscreen Player & Synced Lyrics (v0.1.6 & v0.2.0)
- **Two Visual Fullscreen Modes**: Switch seamlessly between a high-resolution centered **Cover Artwork** showcase and bold, synchronized **Live Lyrics**.
- **5-Second Inactivity Auto-Fade**: Controls, top header, and cursor smoothly fade away after 5 seconds of inactivity for a clean, immersive visual experience. Moving the mouse or pressing any key instantly restores playback controls.
- **Local LRC & Embedded Lyrics**: Automatic detection and display of `.lrc` and `.txt` sidecar files adjacent to audio files, plus fallback extraction of ID3 USLT, Vorbis, and M4A embedded tags.
- **Interactive Click-to-Seek**: Tap any lyric line to jump playback directly to that timestamp with smooth auto-scroll.
- **Per-Track Timing Offset**: Fine-tune lyric synchronization in 100ms increments with changes saved locally in SQLite without modifying audio files.

---

### 🛠️ Safe Library Care, Diagnostics & Deduplication (v0.1.7 & v0.2.0)
- **Scan Dashboard & Diagnostics**: Live overview of indexed directories, total tracks, last scan times, one-click folder rescans, and actionable scan error logging.
- **Cross-Artist Duplicate Detection**: Upgraded deduplication engine identifies identical audio files via SHA-256 cryptographic hashing and clusters songs sharing title and duration/album across different artists.
- **"Stay (Keep Both)" Resolution**: Option to safely dismiss false positives or intentional alternate versions, permanently recorded in an `ignored_duplicates` database table.
- **Safe Metadata Editor & ID3 Writing**: Edit title, artist, album, track number, year, and genre in catalog-only mode, or write tags directly to audio files on disk using integrated `node-id3`.
- **Album Artwork Manager**: Visual album art replacer allowing custom image selection and automatic thumbnail optimization.
- **Missing File Recovery**: Automatic disk verification flags relocated tracks with an interactive relinking workflow.
- **Library Health Report**: Scans for untagged tracks, missing artwork, and zero-duration anomalies with one-click fix recommendations.

---

### ⭐ Personal Discovery, Ratings & Smart Playlists (v0.1.8)
- **5-Star Track Ratings**: Interactive 5-star rating widget in track rows and context menus for effortless library curation.
- **Custom Tags & Mood Labeling**: Assign personal tags (e.g., `#workout`, `#chill`, `#focus`) with real-time tag chips and inline editing.
- **Dynamic Smart Playlist Engine**: Build rules evaluated locally against SQLite matching genre, artist, album, release year, star ratings, play counts, and personal tags with live track preview.
- **Offline Rediscovery Mixes**: Auto-generated local mixes including "Forgotten Favorites" (rediscovering loved tracks unplayed in 30+ days), "Recent Additions", and "Deep Catalog Gems".
- **Listening History Timeline & Play Counts**: Local-only timeline tracking songs played to completion with aggregated play counters and pause/clear privacy toggles.
- **Playlist Organization**: Drag-free track reordering (move up/down), metadata sorting (title, artist, album, duration), multi-select bulk operations, and one-click Queue-to-Playlist export.

---

### 🖥️ Desktop Polish, Hotkeys & System Tray (v0.1.9)
- **Global Keyboard Shortcuts**: Control playback globally even when Overtone is minimized with configurable shortcuts, conflict detection, and custom accelerator persistence.
- **System Media Integration (`MediaSession`)**: Full OS desktop overlay integration displaying track metadata and artwork with native media key support.
- **System Tray Icon**: Background tray icon with quick playback menu (Play/Pause/Next/Prev) and preferences launcher.
- **Minimize-to-Tray**: Optional background mode keeping playback alive when the window is closed or minimized.
- **Multi-Monitor Safe Window State**: Window bounds, position, and maximized state are validated against active connected displays on launch, preventing off-screen window restoration.
- **Desktop Notifications & Focus Mode**: Native notifications on song change with an optional "Focus Mode" to silence notifications during deep work.
- **Visual Ergonomics**: System-wide settings for Reduced Motion and Scalable Interface Text (Compact 90%, Default 100%, Large 110%).

---

### 📦 Portability, Backup/Restore & Local Device Sync (v0.2.0)
- **Portable JSON Archive Backup**: Export all playlists, smart playlists, 5-star ratings, custom tags, play history, lyric offsets, and preferences into a standardized `overtone-backup v1.0` JSON archive. Audio files are never moved or modified.
- **Safe Conflict Policy Resolution**: Interactive archive inspector displaying matched tracks and existing playlists with three restore policies:
  - `Skip Existing`: Preserves current library untouched (recommended).
  - `Merge`: Combines playlist tracks without duplicate entries.
  - `Overwrite`: Replaces matching playlists and ratings with backup data.
- **Automatic Pre-Restore Rollback Safeguard**: Automatically creates a timestamped database backup (`overtone-pre-migration-<timestamp>.db`) before executing any restore or migration for instantaneous recovery.
- **Library Path Relocation Wizard**: Batch-updates file paths across library and watched folders when moving audio files to a new drive, directory, or machine.
- **100% Cloud-Free Local Wi-Fi Device Sync**: Peer-to-peer sync operating over local network HTTP. Features 6-digit expiring security PIN pairing, paired device management with instant revocation, and recipient-approved playlist sharing.
- **Versioned SQLite Migration Engine**: Production-grade `schema_migrations` tracking table applying transactional migrations with rollback support.

---

### 🎨 Light & Dark Mode Perfection & Widescreen Scaling (v0.2.0)
- **Flawless Light Theme Contrast**: Fully redesigned cards, inputs, pills, and conflict buttons across all Settings tabs for high-contrast, clean aesthetics in light mode.
- **32-Inch & Ultrawide Display Optimization**: Removed restrictive layout bounds; Recently Played, Smart Playlists, and Library Care now fluidly fill widescreen displays.
- **Zero Broken Images**: Fully migrated all artwork views to the native `local://` protocol with base64 path encoding.

---

## ⚡ Technical Architecture & Quality Baseline

| Component | Technology | Role |
|---|---|---|
| **Runtime** | Electron 32.0.0 | High-performance multi-process desktop container |
| **Frontend Framework** | Next.js 16.2.10 (Turbopack) | React 19 static client-side UI export |
| **Database** | better-sqlite3 with WAL Mode | Sub-millisecond local queries, zero-lag library indexing |
| **Audio Engine** | Web Audio API + HTML5 Audio | Gapless timeline seeking via HTTP 206 Partial Content |
| **Metadata & ID3** | music-metadata + node-id3 | Fast tag extraction and safe on-disk ID3 editing |
| **Automated Tests** | Node.js Test Runner | **90/90 tests passing** across 20 suites |
| **Code Quality** | TypeScript 5 + ESLint | 0 type errors, 0 lint warnings |

---

## 📥 Installation

Download the official Windows installer below:
- **`Overtone-Setup-0.2.0.exe`**: Double-click to run the setup wizard, select your music folders, and start listening!
