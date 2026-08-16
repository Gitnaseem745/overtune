# 🎵 Overtone

<p align="center">
  <strong>A modern, local-first music player with Spotify-grade design, dual themes, dual layouts, and blazing-fast offline playback.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.1-blue.svg?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/Electron-32.0.0-47848F.svg?style=flat-square&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/Next.js-16.2.10-000000.svg?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19.2.4-61DAFB.svg?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/SQLite-WAL%20Mode-003B57.svg?style=flat-square&logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="License">
</p>

---

## ✨ Features

### 🎨 Dual-Theme Architecture
- **☀️ Overtone Light (Default):** Clean, warm off-white interface with energetic amber accents (`#f9a826`).
- **🌙 Spotify Dark:** True deep black dark mode (`#121212` / `#181818`) with authentic Spotify Green accents (`#1db954`).
- **Quick Switching:** Toggle anytime from the top header or the full Preferences modal. Preferences are persisted across app reboots via `localStorage`.

### 📐 Dual Desktop Layouts
- **Classic 2-Column (Default):** Minimalist layout with Left Navigation Sidebar, Center Main View, and Bottom Transport Player.
- **Spotify Pro 3-Column:**
  - **Left Panel:** Navigation + Collapsible "Your Library" with quick filter pills (Albums/Artists), Liked Songs shortcut, and native playlists.
  - **Center Panel:** Sticky translucent top bar with history navigation (Back/Forward), live instant search, and dynamic view routers.
  - **Right Panel:** Collapsible **Now Playing Showcase** (high-res cover art, track details) and an **Interactive Live Queue Drawer** with reordering and removal controls.
  - **Bottom Player:** Full transport bar with animated playing equalizer, seek scrubber, volume control, and shuffle/repeat modes.

### 📁 Local-First Music Indexer
- **Instant Metadata Extraction:** Uses `music-metadata` to extract high-resolution embedded ID3 cover art, artist names, album titles, track numbers, and genres.
- **Background File Watcher:** Powered by `chokidar` to detect added, modified, or deleted audio files in real time.
- **High-Performance Database:** Stores library cache in SQLite (`better-sqlite3`) in WAL mode for sub-millisecond querying across tens of thousands of tracks.
- **Arbitrary Timeline Seeking:** Custom `local://` Electron streaming protocol supporting HTTP 206 Partial Content Range headers for instant, gapless scrubbing.

### 🎶 Playlists & Favorites System
- **Native Playlist CRUD:** Create, rename, delete, and manage playlists directly in the app.
- **Context Menus:** Add any song to playlists, play next, or append to queue via the `...` track menu.
- **M3U Import & Export:** Export playlists as standard Extended `.m3u` files or import existing `.m3u`/`.m3u8` files.
- **Liked Songs:** Persistent SQLite-backed favorites with dedicated Spotify-style purple gradient hero view.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Desktop Runtime** | [Electron 32](https://www.electronjs.org/) |
| **Frontend Framework** | [Next.js 16 (Turbopack static export)](https://nextjs.org/) & [React 19](https://react.dev/) |
| **State Management** | [Zustand 5](https://github.com/pmndrs/zustand) |
| **Styling & Icons** | [Tailwind CSS 4](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/) |
| **Database** | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (WAL mode) |
| **Audio Metadata** | [music-metadata](https://github.com/Borewit/music-metadata) |
| **Directory Watching**| [chokidar 3](https://github.com/paulmillr/chokidar) |
| **Packaging & Installer** | [electron-builder](https://www.electron.build/) & NSIS Setup Wizard |

---

## 📂 Project Structure

```
overtune/
├── main/                       # Electron Main Process
│   ├── db.ts                   # SQLite schema, queries, favorites, playlist CRUD & M3U
│   ├── scanner.ts              # ID3 scanner, folder watcher & artwork cache
│   ├── preload.ts              # Secure IPC ContextBridge API
│   └── main.ts                 # Window management, single instance lock & IPC handlers
│
├── src/                        # Next.js Frontend
│   ├── app/
│   │   ├── layout.tsx          # Root Next.js layout & metadata
│   │   └── page.tsx            # Master orchestrator for layouts & views
│   ├── components/             # Modular UI Components
│   │   ├── AudioEngine.tsx     # Headless HTML5 audio engine synced with Zustand
│   │   ├── TopHeader.tsx       # Search bar, history back/forward & quick toggles
│   │   ├── Sidebar.tsx         # Dual-mode sidebar (Classic & Spotify 3-column)
│   │   ├── RightPanel.tsx      # Spotify right drawer (Now Playing + Live Queue)
│   │   ├── NowPlayingBar.tsx   # Persistent bottom transport player
│   │   ├── SettingsModal.tsx   # Visual theme & layout preferences dialog
│   │   ├── CreatePlaylistModal.tsx # Playlist creator & M3U file importer
│   │   ├── TrackRow.tsx        # Song item with animated equalizer & context menu
│   │   ├── DiscoverView.tsx    # Home view with featured albums & top tracks
│   │   ├── SongsView.tsx       # All songs table with Play All / Shuffle
│   │   ├── AlbumsView.tsx      # Albums grid
│   │   ├── ArtistsView.tsx     # Artists grid
│   │   ├── DetailView.tsx      # Album & Artist detail pages with hero banner
│   │   ├── PlaylistDetailView.tsx # Playlist detail page with rename & export
│   │   ├── LikedSongsView.tsx  # Liked songs view with purple gradient banner
│   │   └── LocalFilesView.tsx  # Music folder importer & indexing stats
│   ├── store/
│   │   └── usePlayerStore.ts   # Zustand central store for playback & UI state
│   ├── types/
│   │   ├── music.ts            # TypeScript interfaces & enums
│   │   └── global.d.ts         # Window.api IPC type definitions
│   └── lib/
│       └── utils.ts            # Helper functions (time formatting, local:// URLs)
│
├── scripts/
│   └── build-installer.js      # Automated 6-step .exe installer build pipeline
├── release/                    # Output directory for packaged .exe installers
└── build-installer.bat         # 1-Click Windows batch runner
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v24.x`
- **npm**: `v10.x` or higher
- **Windows OS** (for packaging `.exe` NSIS installer)

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/gitnaseem745/overtune.git
cd overtone
npm install
```

### 2. Running in Development Mode
Launch Next.js dev server and Electron simultaneously:
```bash
npm run dev
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
- `release/Overtone-Setup-0.1.1.exe`

---

## 👨‍💻 Author

**Naseem Ansari**
- GitHub: [@gitnaseem745](https://github.com/gitnaseem745)
- Project: [Overtone](https://github.com/gitnaseem745/overtune)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
