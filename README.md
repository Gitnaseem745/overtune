<p align="center">
  <img src="public/overtune_logo.png" alt="Overtone Logo" width="120" height="120" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
</p>

<h1 align="center">🎵 Overtone</h1>

<p align="center">
  <strong>A modern, local-first music player with Spotify-grade design, dual themes, dual layouts, synchronized lyrics, personal smart playlists, local Wi-Fi sync, and blazing-fast offline playback.</strong>
</p>

<p align="center">
  <a href="https://github.com/gitnaseem745/overtune/releases"><img src="https://img.shields.io/badge/version-0.2.0-blue.svg?style=flat-square" alt="Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="License"></a>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Electron-32.0.0-47848F.svg?style=flat-square&logo=electron" alt="Electron"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.2.10-000000.svg?style=flat-square&logo=next.js" alt="Next.js"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.2.4-61DAFB.svg?style=flat-square&logo=react" alt="React"></a>
  <a href="https://www.sqlite.org/"><img src="https://img.shields.io/badge/SQLite-WAL%20Mode-003B57.svg?style=flat-square&logo=sqlite" alt="SQLite"></a>
  <a href="#-automated-tests"><img src="https://img.shields.io/badge/tests-90%20passing-brightgreen.svg?style=flat-square" alt="Tests"></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome"></a>
  <a href="CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg?style=flat-square" alt="Code of Conduct"></a>
</p>

---

## 📸 Overview & Hero Preview

Overtone gives you the sleek, fluid visual polish of streaming giants while remaining **100% offline, local-first, and private**. Zero cloud dependencies, zero account requirements, and zero analytics.

<p align="center">
  <img src="public/software_images/spotify-pro-3column-discover-light.png" alt="Overtone Spotify Pro 3-Column Discover View (Light Mode)" width="100%" style="border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.25);">
</p>

<p align="center">
  <img src="public/software_images/spotify-pro-3column-dark.png" alt="Overtone Spotify Pro 3-Column Layout (Dark Mode)" width="100%" style="border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.35);">
</p>

---

## 🖥️ UI Screenshots & Screen Showcase

Explore the complete visual journey across Overtone's interfaces, modes, and utilities:

### 🌟 Desktop Layouts & Pro Experience
Dual customizable desktop architectures with fluid responsive panels and instant layout toggles.

| Spotify Pro 3-Column (Light Mode) | Spotify Pro 3-Column (Dark Mode) |
|:---:|:---:|
| <img src="public/software_images/spotify-pro-3column-playlist-light.png" alt="Spotify Pro 3-Column Playlist View (Light)" width="100%"> | <img src="public/software_images/spotify-pro-3column-dark.png" alt="Spotify Pro 3-Column (Dark)" width="100%"> |
| *3-Column: Your Library + Playlist + Live Queue* | *Deep Spotify Dark Mode with Amber/Green Accents* |

| Classic 2-Column Discover View | Classic Playlist View (Expanded Sidebar) |
|:---:|:---:|
| <img src="public/software_images/discover-classic-light.png" alt="Discover Classic View (Light)" width="100%"> | <img src="public/software_images/playlist-detail-expanded-sidebar-light.png" alt="Playlist View with Expanded Sidebar (Light)" width="100%"> |
| *Streamlined 2-Column Home with Scanned Albums* | *Persistent full sidebar with folder navigation* |

| Classic Playlist Detail (Light Mode) | Classic Playlist Detail (Dark Mode) |
|:---:|:---:|
| <img src="public/software_images/playlist-detail-classic-light.png" alt="Playlist Detail Classic (Light)" width="100%"> | <img src="public/software_images/playlist-detail-classic-dark.png" alt="Playlist Detail Classic (Dark)" width="100%"> |
| *Playlist hero banner & M3U export actions* | *Immersive dark aesthetic with high-contrast text* |

---

### 🎧 Spotify-Grade Fullscreen Player & Immersion Mode
Transform your monitor into a living visual playback stage with synchronized lyrics and distraction-free auto-fade.

| Fullscreen Artwork Showcase | Fullscreen Synchronized Lyrics Mode |
|:---:|:---:|
| <img src="public/software_images/fullscreen-player-artwork.png" alt="Fullscreen Player Artwork View" width="100%"> | <img src="public/software_images/fullscreen-player-lyrics.png" alt="Fullscreen Player Lyrics Mode" width="100%"> |
| *High-resolution album art with ambient gradient backdrop* | *Interactive synchronized lyrics with tap-to-seek* |

<p align="center">
  <img src="public/software_images/fullscreen-player-immersion-autohide.png" alt="Fullscreen Player 5-Second Inactivity Immersion Mode" width="100%" style="border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
</p>
<p align="center"><em>5-Second Inactivity Immersion Mode: All controls, bars, and cursor smoothly fade away during uninterrupted listening.</em></p>

---

### 🎛️ Dynamic Floating Miniplayer
Float Overtone above games, code editors, and browsers with hardware window dragging and seamless auto-layout switching.

| Square Card Mode (`height >= 185px`) | Compact Horizontal Pill Bar Mode (`height < 185px`) |
|:---:|:---:|
| <img src="public/software_images/miniplayer-square-card.png" alt="Miniplayer Square Card Mode" width="360px"> | <img src="public/software_images/miniplayer-compact-pill.png" alt="Miniplayer Compact Pill Bar Mode" width="500px"> |
| *Ambient artwork glow, seekbar, and playback controls* | *Ultra-slim floating pill widget hovering over any application* |

---

### 🔮 Personal Discovery, Smart Mixes & Liked Songs
Locally generated offline mixes, 5-star ratings, custom tags, and favorite tracks.

| Personal Mixes & Continue Listening | Spotify-Style Liked Songs Collection |
|:---:|:---:|
| <img src="public/software_images/discover-personal-mixes-light.png" alt="Discover Personal Mixes & Continue Listening" width="100%"> | <img src="public/software_images/liked-songs-light.png" alt="Liked Songs View" width="100%"> |
| *Forgotten Favorites, Recent Additions & Deep Catalog Gems* | *Persistent favorites with dedicated purple gradient banner* |

---

### 📚 Music Library Views & Folder Importer
Manage tens of thousands of tracks with instantaneous search, grouping, and non-destructive folder scanning.

| All Songs Library (Light Mode) | All Songs Library (Dark Mode) |
|:---:|:---:|
| <img src="public/software_images/all-songs-light.png" alt="All Songs View (Light)" width="100%"> | <img src="public/software_images/all-songs-dark.png" alt="All Songs View (Dark)" width="100%"> |
| *Instant sortable tracklist with duration and actions* | *High-contrast dark mode with glowing playback indicators* |

| Scanned Albums Grid | Album Detail View |
|:---:|:---:|
| <img src="public/software_images/albums-grid-light.png" alt="Albums Grid View" width="100%"> | <img src="public/software_images/album-detail-light.png" alt="Album Detail View" width="100%"> |
| *High-res cover art cards extracted from ID3 tags* | *Track listings, total duration, and Play All / Shuffle* |

| Artists Directory Grid | Local Folder Importer (Light & Dark) |
|:---:|:---:|
| <img src="public/software_images/artists-grid-light.png" alt="Artists Grid View" width="100%"> | <img src="public/software_images/import-local-folder-light.png" alt="Import Local Folder View (Light)" width="100%"> |
| *Circular artist badges with album and track counts* | *One-click folder importer with subfolder playlist detection* |

<p align="center">
  <img src="public/software_images/import-local-folder-dark.png" alt="Local Folder Importer (Dark Mode)" width="100%" style="border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.2);">
</p>

---

### ⚙️ Tabbed Preferences & Desktop Reliability
Tailor your listening environment with comprehensive modular settings, global shortcuts, and background operation.

| 13 Curated Themes & Accent Palettes | Global Keyboard Shortcuts & Library Stats |
|:---:|:---:|
| <img src="public/software_images/preferences-appearance-themes.png" alt="Preferences Appearance Tab" width="100%"> | <img src="public/software_images/preferences-global-hotkeys.png" alt="Preferences Hotkeys Tab" width="100%"> |
| *Warm Amber, Spotify Green, Violet Purple & 10 more* | *System-wide media keys, volume stepping & hotkey config* |

| Playback State & History Settings | Desktop, System Tray & Focus Mode |
|:---:|:---:|
| <img src="public/software_images/preferences-playback-history.png" alt="Preferences Playback & History Tab" width="100%"> | <img src="public/software_images/preferences-desktop-tray.png" alt="Preferences Desktop & Tray Tab" width="100%"> |
| *Continue Listening on launch & offline play counter* | *Minimize-to-tray, OS notifications & Do Not Disturb mode* |

---

## ✨ Features Breakdown

### 🌐 Personal Music Hub & Portability (v0.2.0 Milestone)
- **Library Backup & Portable JSON Archive:** Export full library state (playlists, smart playlists, 5-star ratings, custom tags, listening history, lyric offsets, preferences) into a documented, open `overtone-backup v1.0` JSON archive. Excludes machine-specific runtime bounds for true cross-device portability.
- **Archive Preview & Safe Conflict Policies:** Inspect backup contents and track matches prior to applying changes. Choose between `Skip Existing` (preserves current data), `Merge` (merges tracks without duplicates), or `Overwrite` (replaces with archive data).
- **Automatic Pre-Restore Rollback Backups:** Creates instant timestamped database snapshots (`overtone-pre-migration-<timestamp>.db`) before any restore or migration to guarantee zero data loss.
- **Music Library Relocation Wizard:** Batch-update base file path prefixes across the database when moving music collections between external drives, new partitions, or different computers while preserving all ratings, playlists, and history.
- **100% Cloud-Free Local Wi-Fi Device Sync:** Private peer-to-peer playlist sharing over local Wi-Fi / LAN with 6-digit expiring numeric PIN pairing, authorized paired device management with instant revocation, and recipient confirmation prompts.
- **Versioned SQLite Migration Engine:** Production-grade `schema_migrations` tracking table executing transactional schema upgrades with rollback safeguards.
- **Cross-Artist Duplicate Detection & "Stay" Resolution:** Detects duplicate audio tracks sharing identical titles and duration/album across different artist tags with "Stay (Keep Both)" ignore persistence in `ignored_duplicates`.
- **Spotify-Grade Fullscreen Player & 5s Auto-Fade:** Immersive full-screen playback with toggleable large artwork view, bold synchronized lyrics view with interactive seek, full transport controls, and intelligent 5-second inactivity auto-hide.
- **In-App Release Quality Baseline & Community Feedback:** Integrated About view with runtime specs (Electron 32, Node 20, Next.js 16, React 19, SQLite WAL) and direct, privacy-respecting GitHub feedback link (`<FeedbackLink />`).

### 🎛️ Dynamic Spotify-Style Miniplayer
- **Seamless Auto-Layout Switching:** Automatically transitions between **Square Card Mode** (`height >= 185px`) with ambient glow, hover playback controls, and scrubbable seekbar, and **Compact Horizontal Bar / Pill Mode** (`height < 185px`) with small thumbnail, quick actions, and discrete progress fill.
- **Floating Always-on-Top:** Floats above all other windows, browsers, and applications while working or gaming (`alwaysOnTop: true`).
- **Frameless Window & Hardware Drag:** Completely frameless window with zero OS titlebars in Miniplayer, featuring full multi-monitor `-webkit-app-region: drag` support.
- **Uninterrupted Audio Playback:** Zero latency or audio pauses when switching between Main and Miniplayer modes.

### 🎨 13-Theme Visual Architecture & Dynamic SVG Branding
- **☀️ Overtone Light (Default):** Clean, warm off-white interface with energetic amber accents (`#f9a826`).
- **🌙 Spotify Dark:** True deep black dark mode (`#121212` / `#181818`) with authentic Spotify Green accents (`#1db954`).
- **13 Curated & DaisyUI Themes:** Choose from Warm Amber, Spotify Green, Violet Purple, Ocean Blue, Retro, Valentine, Pastel, Halloween, Synthwave, Cyberpunk, Aqua, Cupcake, and Coffee.
- **Theme-Adaptive Custom Scrollbars:** Sleek, translucent rounded scrollbars tailored for both Dark and Light themes, eliminating default Windows white scrollbars and arrows.
- **Dynamic Theme-Aware SVG Logo:** Scalable vector brand emblem in navbar, sidebars, and preferences modal that automatically updates its gradients with the active theme.

### 📐 Dual Desktop Layouts & Collapsible Navigation
- **Classic 2-Column (Default):** Minimalist layout with Left Navigation Sidebar, Center Main View, and Bottom Transport Player.
- **Spotify Pro 3-Column:**
  - **Left Panel:** Navigation + Collapsible *"Your Library"* with quick filter pills (Albums/Artists), Liked Songs shortcut, and native playlists.
  - **Icon-Only Compact Mode:** Collapse the sidebar into a sleek `w-[72px]` icon column with tooltips and active indicators.
  - **Full Hide / Show Toggle:** One-click toggle button (`<PanelLeft />`) in the top navbar to expand the main view to 100% full width.
  - **Center Panel:** Sticky translucent top bar with history navigation (Back/Forward), live instant search, and dynamic view routers.
  - **Right Panel:** Collapsible **Now Playing Showcase** (high-res cover art, track details) and an **Interactive Live Queue Drawer** with reordering and removal controls.
  - **Bottom Player:** Full transport bar with clean filled seekbar, volume control, Miniplayer toggle, and shuffle/repeat modes.

### 📁 Local-First Music Indexer & Update Persistence
- **Instant Metadata Extraction:** Powered by `music-metadata` to extract high-resolution embedded ID3 cover art, artist names, album titles, track numbers, and genres.
- **Background File Watcher:** Uses `chokidar` to detect added, modified, or deleted audio files in real time.
- **High-Performance Database:** Stores library cache in SQLite (`better-sqlite3`) in **WAL mode** for sub-millisecond querying across tens of thousands of tracks.
- **Automatic Migration Across Updates:** Seamless database migration guarantees your playlists, favorites, and library are preserved permanently when upgrading versions.
- **Taskbar Pinning Persistence:** Registered Windows AppUserModelID (`com.overtone.app`) and static NSIS upgrade GUID to keep your taskbar pin intact across updates.
- **Arbitrary Timeline Seeking:** Custom `local://` Electron streaming protocol supporting **HTTP 206 Partial Content Range** headers for instant, gapless scrubbing.

### 🎶 Playlists & Favorites System
- **Directory Playlist Import (Subdirectory Detection):** Import a directory containing multiple subfolders to automatically generate individual scoped playlists for each subfolder, while grouping root songs into a parent playlist.
- **Strict Playlist Scoping & Global Discovery:** Opening a playlist strictly scopes playback to its specific tracks, while all songs remain globally available across All Songs and responsive to global search queries.
- **Native Playlist CRUD:** Create, rename, delete, and manage playlists directly in the app.
- **Context Menus:** Add any song to playlists, play next, or append to queue via the `...` track menu.
- **M3U Import & Export:** Export playlists as standard Extended `.m3u` files or import existing `.m3u`/`.m3u8` files.
- **Liked Songs:** Persistent SQLite-backed favorites with dedicated Spotify-style purple gradient hero view.

### 🎤 Synchronized Lyrics & Listening Focus
- **Lyrics Panel:** Dedicated lyrics panel accessible from the transport bar and the Spotify-layout Right Panel with Queue/Lyrics tab switcher.
- **Local LRC Support:** Read and display synchronized `.lrc` sidecar files with automatic base-name matching to audio files.
- **Synchronized Playback:** Follow timestamps with current-line emphasis, smooth auto-scroll, and click-to-seek on any lyric line.
- **Plain-Text & Embedded Lyrics:** Display `.txt` sidecars and embedded ID3/Vorbis/M4A lyric tags as scrollable text.
- **Manual Offset Controls:** Adjust per-track lyric timing in 100ms increments, persisted in SQLite without modifying audio files.
- **Keyboard & Accessibility:** Full keyboard navigation, ARIA labels, focus states, and `prefers-reduced-motion` support.

### 🛡️ Library Care & Metadata Tools
- **Library Scan Dashboard:** Real-time visibility into monitored folders, tracked audio counts, last scan timestamps, one-click folder rescan, safe folder removal, and structured error logs.
- **Safe Metadata Editor:** Edit track title, artist, album, track number, year, and genre. Choose between 100% risk-free catalog-only updates or direct file tag writes.
- **Direct ID3v2 Tag Writing:** Integrated `node-id3` tag writing for MP3 audio files with explicit confirmation and safety guards.
- **Album Artwork Manager:** Browse album cover art with filters for missing covers, one-click artwork replacement with automatic app cover cache and optional file embedding.
- **Deduplication Review:** SHA-256 cryptographic file hashing detects identical audio tracks. Inspect paths, open directly in Explorer, and cleanly remove duplicates from the library without touching disk files.
- **Missing File Recovery:** Flags tracks whose disk paths are broken (moved or renamed files) with an interactive relink dialog.
- **Library Health Diagnostics:** High-level dashboard highlighting untagged tracks, missing artwork, and broken links with direct jump links to fix issues.

### 🔮 Personal Discovery, Ratings & Smart Playlists
- **Local Listening History & Play Counts:** 100% private, offline timeline of played tracks with play counts. Pause tracking or clear history with a single click.
- **Continue Listening on Startup:** Automatically restores the last active track, elapsed position, and queue. Fully configurable (`Always Restore`, `Wait for Input`, `Disabled`).
- **Smart Playlists with Rule Engine:** Build dynamic playlists matching genres, artists, albums, release years, star ratings, minimum play counts, unplayed tracks, or personal tags with real-time matching preview.
- **5-Star Track Ratings & Personal Tags:** Star rating widget integrated into track rows and menus. Add custom mood/activity labels with instant tag chips.
- **Offline Smart Mixes:** Automatically generates "Forgotten Favorites" (beloved tracks unplayed in over 30 days), "Recent Additions", and "Deep Catalog Gems", playable, shuffleable, and exportable to regular playlists.
- **Playlist Reordering & Multi-Selection:** Move tracks up/down, sort by metadata, and perform bulk actions (play, add to queue, remove) with multi-track selection.
- **Queue to Playlist Export:** Convert your current playing queue into a permanent playlist with one click.

### ⚡ Desktop Polish & Everyday Reliability
- **Configurable Global Keyboard Shortcuts:** Custom global accelerator bindings with conflict validation for playback, volume stepping (+/- 5%), lyrics toggle, and miniplayer toggle.
- **System Media Key & Notification Integration:** Full OS `MediaSession` integration with native desktop controls and optional track change notifications with Focus Mode silencing.
- **System Tray Icon & Minimize-to-Tray:** Background playback support with system tray icon, live tooltip, playback context menu, and one-click show/hide toggle.
- **Multi-Monitor Window State Persistence:** Saves window dimensions, coordinates, and maximized state with multi-monitor geometry bounds validation to prevent off-screen spawns.
- **Privacy-Sanitized Support Diagnostics:** Generate and export privacy-sanitized diagnostic bundles (system specs, library stats, masked error paths) for easy bug reporting without credential leakage.
- **Accessibility & Scalable Text:** Preferences for Reduced Motion animation suppression and customizable text scaling (Small, Normal, Large) with real-time CSS synchronization.
- **Organized Tabbed Preferences:** Categorized into Appearance, Playback & History, Hotkeys, Desktop & Tray, Backup & Relocate, Accessibility, and Diagnostics.

---

## 🎼 Supported Audio Formats

| Format | Extension | Embedded Artwork | Gapless Seeking |
|---|---|:---:|:---:|
| **MP3** | `.mp3` | ✅ ID3v1 / ID3v2 | ✅ HTTP 206 Streaming |
| **FLAC** | `.flac` | ✅ Vorbis Comments | ✅ HTTP 206 Streaming |
| **WAV** | `.wav` | ✅ RIFF Info | ✅ HTTP 206 Streaming |
| **M4A / AAC** | `.m4a`, `.aac` | ✅ iTunes / MP4 Tags | ✅ HTTP 206 Streaming |
| **OGG** | `.ogg` | ✅ Vorbis Comments | ✅ HTTP 206 Streaming |
| **WMA** | `.wma` | ✅ ASF Metadata | ✅ HTTP 206 Streaming |

---

## 🏗️ Architecture & Data Flow

```mermaid
graph TD
    subgraph Electron Main Process [Electron 32 Main Process]
        Scanner[Folder Scanner & Chokidar Watcher]
        Metadata[music-metadata & node-id3 Parser]
        SQLite[(better-sqlite3 WAL Database)]
        Protocol[Custom local:// Protocol HTTP 206 Streaming]
        BackupEngine[Backup & Migration Engine]
        SyncEngine[P2P Wi-Fi Sync HTTP Server]
        
        Scanner --> Metadata --> SQLite
        BackupEngine <--> SQLite
        SyncEngine <--> SQLite
        Protocol --> LocalStorage[(Local Audio Files)]
    end

    subgraph IPC Security Layer [Preload contextBridge API]
        Bridge[window.api Exposed Bridge]
    end

    subgraph Next.js Renderer [Next.js 16 + React 19 UI]
        ZustandStore[Zustand usePlayerStore]
        AudioEngine[HTML5 Audio Engine]
        UIComponents[Views: Discover, Songs, Albums, Playlists, Care]
        Fullscreen[Fullscreen Player & Lyrics Focus]
        Mini[Floating Miniplayer]
        ThemeEngine[13 Themes & Layout Manager]
        
        Bridge <--> ZustandStore
        Bridge <--> AudioEngine
        ZustandStore --> UIComponents
        ZustandStore --> Fullscreen
        ZustandStore --> Mini
        ThemeEngine --> UIComponents
    end

    SQLite <--> Bridge
    Protocol <--> AudioEngine
```

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Desktop Runtime** | [Electron 32](https://www.electronjs.org/) | Cross-platform desktop shell with secure IPC |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) & [React 19](https://react.dev/) | React frontend exported as static local bundle |
| **State Management** | [Zustand 5](https://github.com/pmndrs/zustand) | Lightweight, reactive centralized state store |
| **Styling & Icons** | [Tailwind CSS 4](https://tailwindcss.com/) & [Lucide](https://lucide.dev/) | Utility-first responsive design & crisp iconography |
| **Database** | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | Synchronous, ultra-fast local SQLite storage in WAL mode |
| **Metadata & Tagging** | [music-metadata](https://github.com/Borewit/music-metadata) & [node-id3](https://github.com/Zazama/node-id3) | Audio metadata parsing & direct ID3v2 tag writing |
| **Directory Watching**| [chokidar 3](https://github.com/paulmillr/chokidar) | Incremental filesystem change monitoring |
| **Packaging** | [electron-builder](https://www.electron.build/) | NSIS Windows installer generation & bundling |
| **Test Runner** | Node.js Test Runner | Native unit test suite with 90/90 passing tests |

---

## 📂 Project Structure

```
overtune/
├── .github/                    # GitHub CI/CD workflows and issue/PR templates
│   ├── workflows/              # GitHub Actions (CI & automated release builder)
│   ├── ISSUE_TEMPLATE/         # Bug report & feature request issue forms
│   └── PULL_REQUEST_TEMPLATE.md# Pull request checklist
│
├── main/                       # Electron Main Process
│   ├── db.ts                   # SQLite schema, queries, favorites, playlist CRUD & M3U
│   ├── scanner.ts              # ID3 scanner, folder watcher & artwork cache
│   ├── lyrics.ts               # LRC/TXT parser, sidecar matching & embedded lyrics reader
│   ├── metadata-editor.ts      # Tag editing & node-id3 writing
│   ├── backup.ts               # overtone-backup v1.0 JSON export/import & rollback snapshots
│   ├── device-sync.ts          # Local-network Wi-Fi P2P device synchronization
│   ├── migration.ts            # Versioned schema migrations & library relocation wizard
│   ├── diagnostics.ts          # Privacy-sanitized diagnostics report generator
│   ├── shortcuts.ts            # Global keyboard shortcuts with conflict detection
│   ├── tray.ts                 # System tray icon & playback menu
│   ├── preload.ts              # Secure IPC ContextBridge API
│   └── main.ts                 # Window management, custom protocol & IPC handlers
│
├── src/                        # Next.js Frontend
│   ├── app/
│   │   ├── layout.tsx          # Root Next.js layout & metadata
│   │   └── page.tsx            # Master orchestrator for layouts & views
│   ├── components/             # Modular UI Components
│   │   ├── AudioEngine.tsx     # Headless HTML5 audio engine synced with Zustand
│   │   ├── TopHeader.tsx       # Search bar, history navigation & quick toggles
│   │   ├── Sidebar.tsx         # Dual-mode sidebar (Classic & Spotify 3-column)
│   │   ├── RightPanel.tsx      # Spotify right drawer (Now Playing + Live Queue)
│   │   ├── NowPlayingBar.tsx   # Persistent bottom transport player
│   │   ├── FullscreenPlayer.tsx# Spotify-grade fullscreen player with 5s auto-fade
│   │   ├── MiniPlayer.tsx      # Dynamic miniplayer (Card & Pill modes)
│   │   ├── SettingsModal.tsx   # Modular 7-tab preferences dialog
│   │   ├── BackupRestoreModal.tsx # Backup export, conflict resolver & Wi-Fi sync modal
│   │   ├── LibraryCareView.tsx # Diagnostics, tags, duplicates & file relinker
│   │   ├── DiscoverView.tsx    # Home view with personal mixes & recent history
│   │   ├── RecentlyPlayedView.tsx # Local playback timeline & play count manager
│   │   ├── SmartPlaylistView.tsx  # Dynamic smart playlist rule builder & preview
│   │   ├── SongsView.tsx       # All songs table with Play All / Shuffle
│   │   ├── AlbumsView.tsx      # Albums grid
│   │   ├── ArtistsView.tsx     # Artists grid
│   │   ├── DetailView.tsx      # Album & Artist detail pages with hero banner
│   │   ├── PlaylistDetailView.tsx # Playlist detail page with rename & export
│   │   ├── LikedSongsView.tsx  # Liked songs view with purple gradient banner
│   │   ├── LyricsPanel.tsx     # Synced LRC & plain-text lyrics with offset controls
│   │   ├── LocalFilesView.tsx  # Music folder importer & indexing stats
│   │   ├── FeedbackLink.tsx    # Privacy-respecting GitHub feedback component
│   │   └── OvertoneLogo.tsx    # Dynamic theme-aware SVG brand mark
│   ├── store/
│   │   └── usePlayerStore.ts   # Zustand central store for playback & UI state
│   ├── types/
│   │   ├── music.ts            # TypeScript interfaces & enums
│   │   └── global.d.ts         # Window.api IPC type definitions
│   └── lib/
│       └── utils.ts            # Helper functions (time formatting, local:// URLs)
│
├── public/                     # Static Assets & Documentation Visuals
│   ├── software_images/        # 25 High-Resolution Renamed UI Screen Captures
│   ├── overtune_logo.png       # High-resolution brand logo
│   ├── icon.png & favicon.ico  # Desktop and browser icons
│
├── tests/                      # Comprehensive Automated Test Suites
│   ├── backup.test.js          # Backup archive integrity & conflict policies
│   ├── desktop-polish.test.js  # Global hotkeys, display geometry & sanitization
│   ├── discovery.test.js       # Play history, 5-star ratings & smart playlists
│   ├── duplicates-extended.test.js # Cross-artist duplicates & Stay resolution
│   ├── library-care.test.js    # Folder watching, ID3 tag editing & hash deduplication
│   ├── lyrics.test.js          # LRC parsing, TXT fallbacks & timing offsets
│   └── playlist-import.test.js # Subdirectory playlist generation & scoping
│
├── scripts/
│   ├── build-installer.js      # Automated 6-step .exe installer build pipeline
│   └── generate-icons.js       # Multi-resolution ICO and asset generator
├── release/                    # Output directory for packaged .exe installers
└── build-installer.bat         # 1-Click Windows batch runner
```

---

## 🧪 Automated Tests

Overtone maintains a comprehensive automated test suite with **90/90 tests passing** across 20 suites covering all core systems:

```bash
npm test
```

```
# tests 90
# suites 20
# pass 90
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

- **Backup & Migration**: JSON archive format, pre-restore database rollback snapshots, path relocation, and conflict policies (`tests/backup.test.js`).
- **Duplicates & Deduplication**: Cryptographic SHA-256 hash deduplication, cross-artist duplicate grouping, and "Stay" persistence (`tests/duplicates-extended.test.js`).
- **Discovery & Smart Playlists**: Play count aggregation, 5-star ratings, custom tags, smart mix generation, and queue exports (`tests/discovery.test.js`).
- **Library Care**: Watched folders, scan error recovery, and safe on-disk ID3 writes (`tests/library-care.test.js`).
- **Synchronized Lyrics**: LRC parsing, sidecar file matching, offset adjustments, and graceful malformed line handling (`tests/lyrics.test.js`).
- **Desktop Polish**: Hotkey accelerator conflicts, display geometry safety bounds, and path masking (`tests/desktop-polish.test.js`).
- **Playlist Imports**: Subdirectory scanning and strict playlist scoping (`tests/playlist-import.test.js`).

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Windows / macOS / Linux** (Windows recommended for `.exe` NSIS installer)

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/gitnaseem745/overtune.git
cd overtune
npm install
```

### 2. Running in Development Mode
Launch Next.js dev server and Electron concurrently:
```bash
npm run dev
```

### 3. Running Linters, Type Checking & Tests
```bash
npm run lint
npm run typecheck
npm test
```

---

## 📦 Building the `.EXE` Installer

Overtone includes an automated build pipeline that handles Next.js static compilation, Electron bundling, native module rebuilding, and NSIS setup creation:

### Option A: Via NPM Script
```bash
npm run build:installer
```

### Option B: 1-Click Windows Batch Script
Double-click `build-installer.bat` in the root folder, or run:
```cmd
build-installer.bat
```

The generated installer will be placed in the `release/` directory:
- `release/Overtone-Setup-0.2.0.exe`

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed instructions on getting started, coding guidelines, and submitting pull requests.

Please also read our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 🔒 Security

For security vulnerabilities and responsible disclosure guidelines, please refer to our [Security Policy](SECURITY.md).

---

## 👨‍💻 Author

**Naseem Ansari**
- GitHub: [@gitnaseem745](https://github.com/gitnaseem745)
- Repository: [gitnaseem745/overtune](https://github.com/gitnaseem745/overtune)

---

## 📄 License

This project is open-sourced under the [MIT License](LICENSE).
