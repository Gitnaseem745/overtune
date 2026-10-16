# Changelog

All notable changes to **Overtone** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1-mobile] - 2026-10-16 — Patch: Cross-Device Audio Streaming & Safe Area Enhancements

### Fixed
- **iOS AVPlayer Streaming Compatibility**: Eliminated unsupported `stream://` scheme fallbacks that caused `Playback error: unsupported URL`.
- **SQLite Database Self-Healer**: Automatically fixes corrupted stream URLs and outdated desktop IP addresses on app startup.
- **Dynamic Pre-Flight IP Resolution**: Auto-corrects streaming endpoints before passing to player when desktop IP changes on Wi-Fi.
- **Responsive Playlist Actions**: Converted playlist action buttons into a smooth horizontally scrollable action bar.
- **SafeAreaView Deprecation**: Migrated from `react-native` to `react-native-safe-area-context`.
- **Render Hook Stability**: Resolved conditional hook rendering in playlist detail views.

---

## [0.2.2] - 2026-10-16 — Patch: Streaming Routes, Playlist Deletion & Hover Fixes

### Added
- **By-Title Audio & Artwork Streaming**: Added `/api/sync/audio/by-title/:encodedTitle` and `/api/sync/artwork/by-title/:encodedTitle` server endpoints.
- **Desktop Playlist Deletion**: Added dedicated delete playlist action with confirmation dialog.
- **Desktop Track Metadata Editor**: Added `EditTrackModal.tsx` for quick desktop editing of track titles, artists, albums, and genres.
- **Accurate Duration Counting**: Fixed cumulative duration calculations across all playlist views.

### Fixed
- **Track Row Menu Hover**: Prevented three-dots context menu button from disappearing on row hover.
- **Now-Playing Sync Payload**: Explicitly included `desktopTrackId` in now-playing broadcasts.

---

## [1.0.0-mobile] - 2026-10-16 — Milestone: iOS Companion App (Sleek UI Edition)

### Added
- **Major Milestone: Overtone for iOS**: Built from the ground up as a native-grade, offline-first iOS music player with the signature Sleek UI (Night Star Theme), native iOS system integrations, and local-network Wi-Fi pairing with desktop Overtone.
- **Fluid 3D Perspective Drawer Navigation**: Gesture-driven slide-in navigation drawer with 3D perspective rotation (`rotateY: -15deg`), spring physics, depth scaling, and corner rounding (`SleekDrawer.tsx`, `SleekDrawerLayout.tsx`).
- **Ambient Animated Amber Wave Header**: Flowing organic amber wave dynamics (`#f59e0b` / `#d97706`), avatar greeting ("Welcome back"), and search integration (`SleekHeader.tsx`).
- **Frosted Now Playing Capsule with Live Equalizer**: Centered frosted glass capsule featuring real-time multi-bar audio frequency bars (`SleekLiveEqualizer.tsx`) with randomized micro-fluctuations during playback.
- **Fullscreen Sleek Player Screen**: Fullscreen listening stage featuring a tactile circular radial volume arc around the artwork, rotating turntable vinyl record, waveform scrubbable seekbar, playback speed switcher (0.5x - 2.0x), and 100ms lyric offset adjustment (`SleekPlayerScreen.tsx`).
- **Dynamic MiniPlayer Card & Moving Equalizer**: Docked translucent card hovering above the navigation bar featuring live animated equalizer bars in place of static music notes on the miniplayer card and on currently playing track rows across all song lists (`SleekMiniPlayer.tsx`, `SleekTrackRow.tsx`).
- **Playlist Duplicate Protection Shield**: Real-time duplicate check when adding songs to playlists with an informative warning dialog displaying track artwork, title, artist, and playlist name to prevent accidental double-adds (`SleekTrackActionSheet.tsx`).
- **Inline Playlist Detail Editor**: Dedicated pencil edit action on the playlist card header for in-place title and description editing, with single-song quick swipe removal and bulk track management (`app/playlist/[id].tsx`, `SleekPlaylistCard.tsx`).
- **Background Audio Playback**: Configured via `AVAudioSessionCategoryPlayback` for uninterrupted listening during app multitasking, screen locks, and route changes (`AudioService.ts`).
- **Live Activities & Dynamic Island**: Native Swift `ActivityKit` integration (`OvertoneLiveActivity.swift`, `MusicActivityAttributes.swift`) displaying compact leading artwork, trailing animated soundwave, expanded Dynamic Island controls, and lock-screen live activity banner.
- **Lock Screen & Control Center Media Controls**: Native `MPNowPlayingInfoCenter` and `MPRemoteCommandCenter` integration with high-resolution artwork and scrubbing timeline.
- **Interactive Home Screen Widgets**: Native Swift `WidgetKit` bundle (`OvertoneWidgetBundle.swift`, `OvertoneNowPlayingWidget.swift`) supporting Small, Medium, and Large widgets powered by `SharedPlaybackData.swift` and App Group `group.com.overtone.music`.
- **100% Cloud-Free Local Wi-Fi Cross-Sync**: Peer-to-peer sync with desktop Overtone over LAN using secure expiring 6-digit PINs, track title/artist fuzzy matching (`matching.ts`), sidecar preview, and recipient import confirmation (`SyncService.ts`, `app/sync/`).
- **Local-First SQLite Database Engine**: Embedded `expo-sqlite` database running in WAL mode with transactional schema migrations (`001_initial.ts`) and repositories (`repositories/index.ts`).
- **Apple Files Document Picker Import**: Sandboxed audio importing via `expo-document-picker` with automatic ID3/metadata extraction (`FileImportService.ts`, `MetadataExtractor.ts`).
- **Synchronized LRC Lyrics Engine**: Real-time parsing of `.lrc` and `.txt` files with line-by-line auto-scroll, current line emphasis, and tap-to-seek (`LyricsService.ts`).
- **Automated Test Suite**: 43/43 tests passing across 7 suites covering player controls, 3D drawer, duplicate protection, track matching, widget bridges, lyrics, and backups.

---

## [0.2.1] - 2026-10-16 — Patch: Cross-Sync LAN Network Multi-Adapter Fix

### Fixed
- **Intelligent Physical Network Adapter Detection**: Automatically filters out virtual network interfaces (`vEthernet`, `docker`, `wsl`, `tailscale`, `virtual`, `loopback`) and advertises reachable physical Wi-Fi/Ethernet IP addresses during local device pairing.
- **Candidate Interface Exposer**: Exposes list of physical network adapter candidates for multi-NIC workstations and laptops.
- **Cryptographic PIN Security**: Swapped insecure pseudo-random pairing PIN generation for cryptographically secure `crypto.randomInt` (6-digit numeric expiring PINs).
- **Server Error Lifecycle Handling**: Added error event listeners to prevent unhandled `EADDRINUSE` exceptions and graceful restart handling for the sync server.
- **TypeScript Error Handling**: Updated error catching to typed `catch (e: unknown)` with error message extraction.

---

## [0.2.0] - 2026-09-24 — Milestone: Personal Music Hub

### Added
- **Major Milestone: Personal Music Hub**: Unifies library care, playback stability, smart organization, portability, and local sync into a cohesive, production-ready desktop experience.
- **Library Backup & Portable JSON Archive**: Export complete library state (playlists, smart playlists, 5-star ratings, custom tags, listening history, lyric offsets, and preferences) into a documented, human-readable `overtone-backup v1.0` JSON archive. Excludes machine-specific runtime data (window bounds) for true portability.
- **Archive Preview & Safe Conflict Resolution**: Interactive archive inspector displaying matched tracks, existing playlists, and total items before applying changes. Supports three conflict resolution policies:
  - `Skip Existing`: Preserves existing playlists and ratings untouched (recommended).
  - `Merge`: Combines playlist tracks without creating duplicate track entries.
  - `Overwrite`: Replaces matching playlists, ratings, and tags with backup versions.
- **Automatic Pre-Restore Rollback Backups**: Automatically creates a timestamped copy of the database (`overtone-pre-migration-<timestamp>.db`) before executing any restore or migration, providing an instant recovery pathway.
- **Library Path Relocation Wizard**: Effortlessly relocate track paths when moving music collections across drives, new user profiles, or different computers. Batch updates file paths across `tracks` and `watched_folders` tables while preserving ratings, play history, and playlist linkages.
- **Local-Network Device Sync (100% Cloud-Free)**: Private, local-area network synchronization protocol operating over native Node.js HTTP. Features 6-digit time-limited numeric PIN pairing, authorized paired device management with instant revocation, and peer-to-peer playlist transmission requiring explicit recipient approval before library import.
- **Versioned Database Migration Engine**: Safe schema evolution via `schema_migrations` tracking table. Applies incremental migrations in isolated database transactions with pre-migration backup safeguards.
- **In-App Release Quality Baseline & Community Feedback**: Added About & Feedback tab displaying runtime specifications (Electron 32, Node 20, Next.js 16, React 19, SQLite WAL), schema health, and direct GitHub bug reporting / feature requests via `<FeedbackLink />` with zero telemetry and no account requirements.
- **Cross-Artist Duplicate Detection & Resolution**: Upgraded duplicate detection in Library Care to catch songs sharing matching title and duration/album even when artist tags differ (e.g., collaborative releases or compilations). Provides a "Stay (Keep Both)" option to permanently ignore false positives, persisted in a dedicated `ignored_duplicates` database table.
- **Spotify-Grade Fullscreen Player**: Fullscreen player overlay (`FullscreenPlayer.tsx`) toggleable via the Now Playing bar or hotkey. Supports high-resolution cover artwork mode, bold synchronized lyrics mode with interactive seeking, complete playback transport bar, and an automatic 5-second inactivity timer that smoothly fades out controls during uninterrupted listening.
- **Automated Test Suite**: Added `tests/backup.test.js` and `tests/duplicates-extended.test.js` (90/90 automated tests passing across 20 suites).

---

## [0.1.9] - 2026-09-24

### Added
- **Global Keyboard Shortcuts & Media Keys**: Configurable global shortcuts via Electron's `globalShortcut` API with duplicate conflict detection, case-insensitive accelerator validation, and custom shortcut persistence in the database. Supports Play/Pause, Next/Previous track, Volume Step (+/- 5%), Toggle Lyrics, and Toggle Miniplayer.
- **System Media Integration (`navigator.mediaSession`)**: OS-level playback integration with desktop media overlays, displaying track title, artist, album, and high-resolution album artwork with action handlers for play, pause, next, previous, and seek.
- **System Tray Icon & Quick Controls**: Persistent system tray icon with rich context menu displaying current track status, playback controls (Play/Pause/Next/Prev), quick show/minimize toggle, preferences shortcut, and clean quit option.
- **Minimize-to-Tray**: Optional setting allowing Overtone to keep playing in the background when the main window is closed, accessible via system tray click.
- **Window State & Multi-Monitor Validation**: Persists window dimensions, coordinates, and maximized state across sessions with dynamic validation against all active connected displays (`screen.getAllDisplays()`), ensuring windows never restore off-screen when external monitors are disconnected.
- **Desktop Notifications**: Optional native OS notifications on track changes with song title, artist, and album. Integrated with a "Focus Mode" preference to silence non-essential interruptions.
- **Privacy-Sanitized Diagnostics & Support Bundle**: One-click generation of sanitized support reports containing system metrics, app version, library statistics, and error logs with personal user folder paths masked to `[USER_HOME]`. Includes export to JSON.
- **Accessibility & Customization**: Added user preferences for Reduced Motion and Scalable Text (Small, Normal, Large) with real-time class synchronization on `document.documentElement` and CSS variable rules.
- **Redesigned Tabbed Settings**: Modern tabbed preferences interface organizing options into Appearance, Playback & History, Hotkeys, Desktop & Tray, Accessibility, and Diagnostics.
- **Automated Test Suite**: Added `tests/desktop-polish.test.js` validating shortcut conflict detection, default shortcut completeness, privacy path sanitization, and multi-display bounds fallback logic.

---

## [0.1.8] - 2026-09-24

### Added
- **Local Listening History & Play Counts**: Full local listening timeline tracking tracks played for at least 30 seconds or to completion. Includes aggregated play counts per track, time-stamped history view, and privacy controls to pause tracking or clear history at any time.
- **Continue Listening & State Restoration**: Automatically saves playback state (current track, elapsed playback time, and full active queue) with customizable startup restore preferences (`Always Restore`, `Wait for Input`, or `Disabled`). Audio is never played automatically without explicit listener action.
- **Smart Playlists & Rule Engine**: Create and manage dynamic smart playlists evaluated locally against the SQLite database. Supports flexible criteria matching genre, artist, album, release year, star ratings, minimum play count, unplayed tracks, and personal user tags with live result preview.
- **5-Star Track Ratings**: Clickable 5-star rating system embedded in track rows and context menus, enabling effortless catalog curation and smart filtering.
- **Personal Tags & Labeling**: Assign custom mood, genre, and activity tags to individual tracks with tag chip display, enter-to-add editing, and instant removal.
- **Smart Mixes & Local Rediscovery**: Generated offline mixes including "Forgotten Favorites" (rediscovering loved tracks unplayed in over 30 days), "Recent Additions", and "Deep Catalog Gems". All mixes feature one-click playback, shuffling, and direct conversion into regular playlists.
- **Playlist Reordering & Sorting**: Drag-free track position reordering with move up/down controls, metadata sorting (by title, artist, album, or duration), and persistent position storage in the database.
- **Playlist Multi-Selection & Bulk Actions**: Checkbox selection for playlist tracks with floating bulk action bar supporting "Play Selected", "Add to Queue", and bulk removal.
- **Queue to Playlist Export**: Dedicated one-click action to save the active queue as a new named playlist directly from the Right Panel or Recently Played views.
- **Automated Test Suite**: Comprehensive unit tests in `tests/discovery.test.js` verifying play history, play count aggregation, rating and tag persistence, smart playlist evaluation, playback state restore, and track reordering.

---

## [0.1.7] - 2026-09-24

### Added
- **Library Care & Maintenance View**: Complete dedicated management interface for library health, diagnostics, safe metadata editing, artwork replacement, duplicate review, and missing file recovery.
- **Scan Dashboard**: Real-time status for monitored audio directories, track counts, last scan timestamps, one-click directory rescan, safe directory removal from library, and detailed scan error logs with clearance tools.
- **Safe Metadata Editor**: Full tag editing for title, artist, album, track number, year, and genre with live preview. Supports both safe catalog-only updates and direct file tag writing.
- **Direct ID3v2 File Tag Writing**: Integrated `node-id3` to write tags directly into MP3 files on disk with user consent, while preserving catalog-only mode for non-destructive edits.
- **Album Artwork Manager**: Visual album cover browser and replacer. Allows updating embedded artwork or assigning custom album covers with automatic thumbnail generation.
- **Deduplication & Duplicate Review**: Cryptographic SHA-256 file hash duplicate detection grouping identical copies. Allows inspecting paths, comparing metadata, revealing files in system Explorer, and non-destructive removal from catalog.
- **Missing File Detection & Relinking**: Real-time verification of audio file existence on disk with interactive file picker relink workflow for relocated libraries or renamed files.
- **Library Health Diagnostics**: Comprehensive report tracking untagged titles, missing artists, unassigned genres, zero-duration tracks, and albums without cover artwork with actionable one-click recommendations.
- **Database Schema Expansion**: Added `watched_folders` and `scan_errors` tables for robust folder tracking and error persistence across sessions.
- **Automated Test Suite**: 9 unit tests in `tests/library-care.test.js` validating schema migrations, watched folder operations, scan error handling, metadata catalog updates, hash deduplication, missing file detection, relinking, and `node-id3` tag writes.

### Changed
- Added "Library Care" navigation item to both Spotify and Classic sidebar layouts.
- Enhanced scanner workflow to automatically log directory scan metrics and capture errors into the database.

---

## [0.1.6] - 2026-09-24

### Added
- **Lyrics Panel**: Dedicated lyrics display panel accessible from the Now Playing bar and the Spotify-layout Right Panel with Queue/Lyrics tab switcher.
- **Local LRC Support**: Read and display synchronized `.lrc` sidecar files placed adjacent to audio files, with automatic base-name matching.
- **Synchronized LRC Playback**: Follow timestamps during playback with current-line emphasis, smooth auto-scroll, and click-to-seek on any lyric line.
- **Plain-Text Lyrics**: Display `.txt` sidecar files and embedded lyric tags as unsynced scrollable text with clear visual distinction from synced mode.
- **Embedded Lyrics**: Read lyrics from ID3 USLT, Vorbis, and M4A metadata tags when no sidecar file is found.
- **Manual Offset Controls**: Adjust lyric timing offset per-track in 100ms increments, persisted in Overtune's database without modifying audio files.
- **Keyboard & Accessibility**: Lyrics panel supports keyboard navigation, focus states, ARIA labels, screen-reader names, and respects `prefers-reduced-motion`.
- **Lyric Offsets Database Table**: New `lyric_offsets` table for storing per-track timing adjustments.
- **Lyrics Test Suite**: 28 automated tests covering LRC parsing, TXT parsing, sidecar matching, offset persistence, and graceful failure handling.

### Changed
- Added `focus-visible` outline styles and `prefers-reduced-motion` support to global CSS for improved accessibility across the entire app.
- Right Panel (Spotify layout) now features a Queue/Lyrics tab switcher for seamless toggling between the queue view and lyrics.
- Classic layout gains a collapsible lyrics side panel (320px) alongside the main content area.

---

## [0.1.5] - 2026-09-23

### Fixed
- **Album Splitting Bug (Issue [#2](https://github.com/gitnaseem745/overtune/issues/2))**: Albums containing tracks by multiple artists were incorrectly split into separate album entries. The scanner now uses `albumartist` metadata (standard ID3/Vorbis/MP4 tag) for album grouping, falling back to the track-level artist when `albumartist` is not set. This ensures multi-artist albums (compilations, features, VA releases) remain unified under a single album entry.
- **Duplicate Songs in Library**: Tracks with identical content (same title, artist, duration) located at different file paths were appearing multiple times in the All Songs view. The `getTracks` query now deduplicates by `file_hash`, returning only the first occurrence of each unique song.
- **Empty Album Shells**: Albums with zero associated tracks (orphaned rows from deleted files) no longer appear in the Albums view.
- **Album Track Count Accuracy**: Changed album track count to use `COUNT(DISTINCT t.id)` for precise counting.

### Changed
- Expanded automated test suite with 6 new tests covering multi-artist album grouping (3 tests) and duplicate song deduplication (3 tests), bringing the total to 11 tests across 3 suites.

---

## [0.1.4] - 2026-09-12

### Added
- **Directory Playlist Imports with Subdirectory Detection**:
  - Importing a music directory containing multiple subdirectories automatically creates each subdirectory as an independent, scoped playlist named after the respective folder.
  - Songs residing directly in the imported root folder are neatly grouped into a parent root playlist.
  - Directories without subfolders seamlessly import as a single playlist named after the folder.
- **Strict Playlist Scoping & Global Discovery**:
  - Opening any playlist view strictly displays its scoped tracks (`playlist_tracks`), preventing leakage of songs from other playlists or directories.
  - All imported tracks across all directories and playlists remain globally indexed in the SQLite `tracks` catalog, appearing under **All Songs** and responsive to global search queries.
  - Entering a search query in the top navbar instantly routes to the All Songs search view so users can search across the entire library at any time.
- **Enhanced Playlist Import Controls in UI**:
  - Added **"Import Folder as Playlists"** button in `CreatePlaylistModal`.
  - Added quick folder import buttons (`<FolderDown />`) in both Spotify Pro and Classic sidebar playlist headers.
  - Added dedicated **"Import as Playlists"** action button in `LocalFilesView`.
- **Automated Test Suite Integration**:
  - Added `tests/playlist-import.test.js` covering directory tree import, playlist scoping, all songs catalog, global search, and idempotency.
  - Configured `npm test` script using Electron's Node runtime.

---

## [0.1.3] - 2026-08-18

### Added
- **Dynamic Spotify-Style Miniplayer**: Floating, resizable always-on-top window (`alwaysOnTop: true`) with auto-layout switching between **Square Card Mode** (large artwork, ambient background, hover playback controls, and scrubbable seekbar) and **Compact Horizontal Bar Mode** (small thumbnail, quick transport controls, and discrete progress fill).
- **Frameless Modern Window & Hardware Drag**: Configured a sleek frameless window (`frame: false`) eliminating default OS titlebars from the Miniplayer, while providing native multi-monitor hardware dragging (`-webkit-app-region: drag`) and custom dashboard window controls (Minimize, Maximize/Restore, Close).
- **Collapsible & Hideable Left Sidebar**:
  - Added Spotify-style **Icon-Only Mini Mode** (`w-[72px]`) with centered navigation icons, tooltips, active badges, Liked Songs gradient square, and playlist avatars.
  - Added a dedicated Left Sidebar Toggle button (`<PanelLeft />`) in the sticky top header navbar to easily hide the sidebar and expand the main view to 100% full width.
- **Theme-Adaptive Custom Scrollbars**: Replaced default Windows OS white scrollbars and arrow buttons with modern, translucent, rounded custom scrollbars (`8px`) tailored for both Dark and Light themes with full Webkit and Firefox standards support.
- **Custom Theme-Aware SVG Logo (`OvertoneLogo`)**: Scalable vector brand emblem in Navbar Header, Sidebars (Classic & Spotify layouts), and Preferences Modal that dynamically reacts to active theme colors.
- **DaisyUI-Inspired Color Theme Collection**: Added 9 DaisyUI-curated theme palettes (`Retro`, `Valentine`, `Pastel`, `Halloween`, `Synthwave`, `Cyberpunk`, `Aqua`, `Cupcake`, and `Coffee`) alongside Overtone Signature themes (`Warm Amber`, `Spotify Green`, `Violet Purple`, `Ocean Blue`).

### Fixed
- **Taskbar Pinning Persistence**: Registered Windows `AppUserModelID` (`com.overtone.app`) and static NSIS GUID to prevent Windows from dropping pinned taskbar icons across version updates.
- **Database & Playlist Migration**: Implemented automatic SQLite database discovery and migration in `main/db.ts`, guaranteeing that existing playlists, songs, and favorites are preserved across all updates and installer upgrades.
- **Timeline Seekbar UI**: Removed glitchy snake wave overlay animation on the now playing seek bar, standardizing it with the clean, smooth progress track fill identical to the volume slider.
- **Violet & Ocean Theme Application**: Resolved hardcoded color issues across all views (`Sidebar`, `TrackRow`, `SongsView`, `PlaylistDetailView`, `LocalFilesView`, `LikedSongsView`, `DiscoverView`, `DetailView`, `CreatePlaylistModal`, and `RightPanel`), ensuring full palette application across the app.
- **Theme Palette Cleanup**: Streamlined theme stack by removing the experimental `lofi` theme in favor of vibrant curated colorways.

---

## [0.1.2] - 2026-08-17

### Added
- **M3U Playlist Import & Export**: Full support for exporting and importing `.m3u` / `.m3u8` playlist files with relative and absolute file paths.
- **Dynamic Track Timeline Seeking**: Custom `local://` Electron streaming protocol supporting HTTP 206 Partial Content Range headers for instant, gapless seeking.
- **Dual-Theme Visual Engine**: Instant toggle between *Overtone Light* and *Spotify Dark* modes with persisted settings.
- **Dual Desktop Layout Architecture**: Seamless switching between Classic 2-Column and Spotify Pro 3-Column desktop layouts.
- **Automated 6-Step Windows Installer Build Pipeline**: `scripts/build-installer.js` and `build-installer.bat` for one-click NSIS packaging.
- **Open Source Community Guidelines**: Added `LICENSE` (MIT), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and issue/PR templates.
- **GitHub Actions Workflows**: Added CI pipeline for automated linting, typechecking, and build verification.

### Changed
- Refactored `Sidebar` navigation items into dedicated components adhering to React 19 / ESLint static component rules.
- Upgraded Electron IPC handlers with strict TypeScript types in `src/types/global.d.ts`.
- Cleaned up unused starter SVG assets and temporary configuration files.

### Fixed
- Fixed audio duration detection and seeking across non-indexed local tracks.
- Fixed single-instance application lock to prevent orphan background processes on multi-launch.

---

## [0.1.1] - 2026-08-10

### Added
- Real-time directory watching powered by `chokidar` for automatic library synchronization.
- High-resolution embedded ID3/FLAC/M4A cover art extraction via `music-metadata`.
- Liked Songs favorite mechanism backed by SQLite with dedicated purple gradient hero banner.
- Custom interactive queue drawer with drag-free reordering and song removal controls.

### Changed
- Optimized SQLite query performance with WAL mode enabled by default.

---

## [0.1.0] - 2026-08-01

### Added
- Initial release of Overtone desktop music player.
- Next.js 16 + React 19 renderer combined with Electron 32 desktop runtime.
- Core audio playback engine with volume controls, seek bar, shuffle, and repeat modes.
- SQLite database schema for tracks, artists, albums, and playlists.
- Discover, Songs, Albums, Artists, and Local Storage library views.
