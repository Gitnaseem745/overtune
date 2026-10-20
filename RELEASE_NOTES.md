# Overtone Release Notes

---

## 📱 Overtone iOS Companion App v1.0.1 & 🎵 Desktop v0.2.2 — Cross-Device Streaming & Quality Release (2026-10-16)

This major release introduces robust multi-device synchronization, seamless iPhone streaming from desktop players, auto-healing SQLite audio databases, responsive mobile action bars, and essential desktop playlist and track management improvements.

### 🌟 Key Highlights & Fixes

#### 🍏 iOS Companion App v1.0.1
- **Seamless Desktop-to-iPhone Audio Streaming**: Completely eliminated invalid `stream://` fake scheme fallbacks that caused iOS `AVPlayer` to fail with `unsupported URL`. All streams now resolve to fully compliant HTTP streaming endpoints.
- **SQLite Database Self-Healer on Launch**: Embedded `healCorruptedStreamUris` in the SQLite database initialization pipeline, automatically scanning and repairing any existing corrupted streaming records or stale desktop IP addresses on app launch.
- **Dynamic Pre-Flight IP Resolution**: `AudioService` now verifies and updates the target streaming URI against live paired device IPs prior to invoking `createAudioPlayer`, ensuring seamless playback even when Wi-Fi IP addresses change.
- **Scrollable Playlist Action Bar**: Re-engineered playlist detail action buttons (Play, Shuffle, Edit, Download All) into a smooth, horizontal scrollable container with bounce physics, ensuring buttons never overflow off-screen on smaller devices.
- **Accurate Playlist Durations**: Unified total duration calculation across all views, correctly summing track durations without skew or truncation.
- **React Native Safe Area Context**: Fully migrated all screens from deprecated `SafeAreaView` in `react-native` to `react-native-safe-area-context`.
- **Render Hook Stability**: Eliminated hook order inconsistencies across playlist detail rendering cycles.

#### 🖥️ Overtone Desktop v0.2.2
- **By-Title Streaming & Artwork Server**: Expanded the device sync HTTP server in `device-sync.ts` with `/api/sync/audio/by-title/:encodedTitle` and `/api/sync/artwork/by-title/:encodedTitle` endpoints, allowing songs to stream reliably even when client requests lack numeric database IDs.
- **Three-Dots Menu Hover Stability**: Fixed hover behavior on track rows to ensure the three-dots action menu remains visible and interactive without disappearing.
- **Full Playlist Deletion**: Added a comprehensive playlist deletion flow with confirmation dialogs, removing playlists cleanly while keeping underlying library tracks intact.
- **Direct Track Metadata Editor**: Introduced `EditTrackModal.tsx` for quick desktop editing of track titles, artists, albums, and genres with immediate database updates.
- **Library Care & Album Track Integrity Fix**: Resolved an issue where songs were silently excluded from the Songs view and Album tracklists due to aggressive hash deduplication. All scanned library tracks now accurately display across Songs, Albums, and Library Care.
- **Enhanced Sync State Broadcasting**: Explicitly broadcast `desktopTrackId` in both initial and periodic now-playing sync payloads.

---

## 📱 Overtone iOS Companion App v1.0.0 — Sleek UI Edition (2026-10-16)

We are proud to introduce the official milestone release of the **Overtone iOS Companion App (v1.0.0)** — an exquisite, local-first mobile listening experience crafted with the signature **Sleek UI (Night Star Theme)**, native iOS media architecture, and local-network Wi-Fi sync with desktop Overtone!

### 🌟 Key Highlights & Features in iOS v1.0.0

#### 🎨 Sleek UI/UX Design Language
- **Fluid 3D Perspective Drawer Navigation:** Interactive drawer with 3D spatial rotation (`rotateY: -15deg`), spring physics, depth scaling, and corner rounding. Quick-switch between Home, Discover, Playlists, Library, Search, Wi-Fi Sync, and Settings.
- **Ambient Animated Amber Wave Header:** Top header featuring continuous flowing amber wave dynamics (`#f59e0b` / `#d97706`), customized avatar greeting ("Welcome back"), and instant search access.
- **Frosted Now Playing Capsule with Live Equalizer:** Centered frosted glass capsule featuring real-time multi-bar audio frequency bars (`SleekLiveEqualizer`) with randomized micro-fluctuations during playback.
- **Fullscreen Sleek Player Screen:**
  - **Circular Radial Volume Arc:** Rotary volume controller enclosing the album art with tactile haptic ticks.
  - **Rotating Vinyl Disc:** Turntable vinyl record styling with concentric grooves and authentic rotational momentum.
  - **Waveform Seekbar:** Touch-scrubbable timeline with high-precision time markers.
  - **Speed Controller & Lyric Offsets:** Instant audio speed switching (0.5x - 2.0x) and 100ms lyric offset adjustment.
- **Dynamic MiniPlayer Card & Moving Equalizer:**
  - Docked translucent card hovering above the navigation bar.
  - Replaced static musical note icon with animated live equalizer bars on the miniplayer card and on currently playing track rows across all song lists.
  - Swipe gestures for track skipping and tap-to-expand transitions.
- **Playlist Duplicate Protection Shield:** Real-time duplicate inspection when adding songs to playlists with an informative warning dialog displaying track artwork, title, artist, and playlist name to prevent accidental double-adds.
- **Inline Playlist Detail Editor:** Dedicated pencil icon on the playlist card header for in-place title and description editing, with single-song quick swipe removal and bulk track management.

#### 🍏 Native iOS System Integrations
- **Background Audio Playback:** Configured via `AVAudioSessionCategoryPlayback` for uninterrupted listening during app multitasking, screen locks, and route changes.
- **Live Activities & Dynamic Island:** Native Swift `ActivityKit` integration (`OvertoneLiveActivity.swift`) displaying compact leading artwork, trailing animated soundwave, expanded Dynamic Island controls, and lock-screen live activity banner.
- **Lock Screen & Control Center Media Controls:** Native `MPNowPlayingInfoCenter` and `MPRemoteCommandCenter` integration with high-resolution artwork and scrubbing timeline.
- **Interactive Home Screen Widgets:** Native Swift `WidgetKit` bundle (`OvertoneWidgetBundle.swift`, `OvertoneNowPlayingWidget.swift`) supporting Small, Medium, and Large widgets powered by `SharedPlaybackData.swift` and App Group `group.com.overtone.music`.
- **100% Cloud-Free Local Wi-Fi Cross-Sync:** Peer-to-peer sync with desktop Overtone over LAN using secure expiring 6-digit PINs, track title/artist fuzzy matching (`matching.ts`), sidecar preview, and recipient import confirmation.
- **Local-First SQLite Database Engine:** Embedded `expo-sqlite` database running in WAL mode with transactional schema migrations (`001_initial.ts`).
- **Apple Files Document Picker Import:** Sandboxed audio importing via `expo-document-picker` with automatic ID3/metadata extraction (`music-metadata-browser`).
- **Synchronized LRC Lyrics Engine:** Real-time parsing of `.lrc` and `.txt` files with line-by-line auto-scroll, current line emphasis, and tap-to-seek.
- **Automated Test Suite:** 43/43 tests passing across 7 suites covering player controls, 3D drawer, duplicate protection, track matching, widget bridges, lyrics, and backups.

---

## 🎵 Overtone Desktop v0.2.1 — Cross-Sync & Multi-Adapter Network Patch (2026-10-16)

This maintenance and quality release delivers critical local-network fixes for desktop-to-mobile Wi-Fi synchronization, intelligent multi-adapter detection, and robust server lifecycle handling.

### 🛠️ What's Fixed & Enhanced in v0.2.1
- **Intelligent Physical Network Adapter Detection**: Automatically filters out virtual host-only adapters (`vEthernet`, `docker`, `wsl`, `tailscale`, `virtual`, `loopback`) and prioritizes actual physical Wi-Fi/Ethernet adapters. Prevents unroutable internal IP addresses from being advertised to mobile clients during Wi-Fi pairing.
- **Multi-Adapter Fallback Support**: Inspects all active network interfaces and exposes candidate physical IPs so multi-NIC machines can select their active LAN interface.
- **Cryptographically Secure PIN Generation**: Upgraded numeric 6-digit pairing PIN generation using `crypto.randomInt` for cryptographic randomness and timing safety.
- **Resilient Sync Server Binding**: Enhanced server error listeners to gracefully handle occupied ports (`EADDRINUSE`) and socket teardowns during app reload without crashing the main Electron process.
- **Strict TypeScript & Linter Compliance**: Resolved `catch (e: unknown)` type safety in the sync layer, ensuring 0 lint warnings and 0 type errors.
- **In-App Versioning**: Updated About & Settings modal to reflect Desktop `v0.2.1`.

---

## 🎵 Overtone Desktop v0.2.0 — Personal Music Hub Launch! (2026-09-24)

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
