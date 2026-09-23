# Changelog

All notable changes to **Overtone** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
