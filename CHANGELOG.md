# Changelog

All notable changes to **Overtone** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
