# Master Prompt: Local Music Player (Spotify Clone, Local-First)

## Role
You are building a desktop application: a **local music player with Spotify's exact UI/UX**, but sourcing all content from the user's local filesystem instead of a streaming service. No account, no internet dependency, no DRM. Treat this as a production-grade product, not a prototype.

---

## 1. Tech Stack (fixed — do not deviate without asking)

- **Shell:** Electron. Main process handles filesystem access, SQLite, and native OS integration; renderer process is the UI.
- **Frontend:** Next.js (React, TypeScript) — run in static export mode (`next export` / `output: 'export'`) since there's no server to route to; served as local files inside the Electron renderer.
- **IPC boundary:** All filesystem scanning, DB writes, and audio-file reads happen in the **main process**, exposed to the renderer via a typed `contextBridge`/`preload.ts` API (`window.api.scanFolder()`, `window.api.getTrack()`, etc.). Do not enable `nodeIntegration` in the renderer — keep the security boundary clean.
- **Styling:** Tailwind CSS (utility-first, matches Spotify's flat design system well)
- **State management:** Zustand (lightweight, avoids Redux boilerplate for this scope)
- **Audio engine:** HTML5 `<audio>` element in the renderer for playback (native codec support for mp3/wav/m4a/ogg in Chromium; FLAC support varies by Electron/Chromium version — verify at build time, fall back to a JS decoder like `music-metadata` + a WASM FLAC decoder if native playback fails). Use the Web Audio API only if gapless playback via native `<audio>` proves insufficient — start simple, upgrade only if needed.
- **Local database:** SQLite via `better-sqlite3` (synchronous, fast, runs in the main process) — stores indexed metadata, playlists, play counts, favorites. Never re-scan the full library on every launch.
- **Metadata extraction:** `music-metadata` (Node/JS) for ID3/FLAC/M4A tags + embedded album art, run in the main process.
- **File watching:** `chokidar` for incremental folder watch (add/remove/rename detection) instead of full re-scans.
- **Target OS:** Windows first, structure code so macOS/Linux support is a packaging config change (via `electron-builder`), not a rewrite.

If you (the agent) believe a different library within this stack better satisfies a requirement (e.g. a more reliable FLAC decoder), state the tradeoff explicitly before implementing — do not silently substitute the framework itself.

---

## 2. Core Functional Requirements

### 2.1 Library Ingestion
- User selects one or more root folders (not single files) to watch.
- Recursive scan of subfolders for audio files (mp3, flac, wav, m4a, ogg).
- Extract metadata: title, artist, album, album art, duration, genre, year, track number.
- Fallback logic when tags are missing: derive title from filename, artist/album from folder structure (`Artist/Album/01 - Track.mp3` convention).
- Incremental re-scan: detect added/removed/renamed files on folder change (use filesystem watcher, not full re-scan) and update SQLite index accordingly.
- Deduplicate identical tracks (same file hash or same artist+title+duration) across multiple watched folders.

### 2.2 Playlists
- Two playlist sources, unified in one UI:
  1. **Native app playlists** — created inside the app, stored in SQLite, exportable as `.m3u`.
  2. **Imported folder-based "playlists"** — treat any subfolder as an implicit playlist the user can pin, OR auto-detect existing `.m3u`/`.m3u8` files in watched folders and import them as playlists.
- Standard playlist CRUD: create, rename, delete, reorder tracks, drag-and-drop add.

### 2.3 Playback
- Queue system: play now, play next, add to queue — identical behavior to Spotify's queue model.
- Shuffle (true randomization, not just visual shuffle) and repeat (off / repeat-all / repeat-one).
- Gapless playback where source format supports it.
- Persistent playback state across app restarts (resume last track/position/queue).
- Global media key support (play/pause/next/prev via OS media keys).
- Mini-player / system tray mode.

### 2.4 Library Views
- **Home:** recently played, most played, quick-access pinned playlists — grid of cards, exactly matching Spotify's home layout.
- **Search:** local fuzzy search across track/artist/album/playlist names, instant results as you type.
- **Your Library** (left sidebar): playlists, liked songs, albums, artists — filterable and sortable, matching Spotify's sidebar behavior (collapsible, list/grid toggle).
- **Album view / Artist view:** grouped by metadata, showing all tracks, matching Spotify's detail page layout.
- **Now Playing bar:** persistent bottom bar with album art, track info, transport controls, seek bar, volume, queue toggle — pixel-close to Spotify's bar.

---

## 3. UI/UX Fidelity Requirements

This is the section most agents underspecify — be explicit:

- **Layout:** 3-column structure — left sidebar (nav + library), center (main content, scrollable), right panel (optional: queue/now-playing details, collapsible).
- **Color system:** near-black background (`#121212`), elevated surface grays (`#181818`, `#282828`), Spotify green accent (`#1DB954` or a custom accent — ask user which they prefer, don't assume trademark color usage is required).
- **Typography:** clean sans-serif (Inter or similar), bold weight for headers, consistent 8px spacing grid.
- **Motion:** subtle hover states on cards (scale + shadow), smooth transitions on view changes (150-250ms), no jarring layout shifts.
- **Responsive to window resize:** grid columns reflow, sidebar collapses to icons-only below a width threshold.
- Build this as a **reusable component library** first (Button, Card, Sidebar, TrackRow, NowPlayingBar) — do not hardcode one-off styled divs per screen. This matters for maintainability as you add views.

---

## 4. Explicit Non-Goals (state these to avoid scope creep)

- No streaming, no online catalog, no login/auth.
- No lyrics fetching from external APIs unless explicitly requested later.
- No social features (no "friend activity," no sharing).
- Do not attempt to replicate Spotify's exact trademarked logo/wordmark — build an equivalent visual language, not a literal copy of protected assets.

---

## 5. Build Order (do not skip ahead)

1. Electron + Next.js scaffold (main/preload/renderer split), basic window, native folder picker dialog (`dialog.showOpenDialog` in main process).
2. Filesystem scanner (chokidar) + SQLite schema (tracks, albums, artists, playlists, playlist_tracks) via `better-sqlite3` in main process, exposed through preload IPC bridge.
3. Metadata extraction pipeline (`music-metadata`), populate DB, display raw track list in renderer (no styling yet).
4. Audio playback engine wired to a minimal transport bar — get play/pause/seek/next/prev fully working before touching visual polish.
5. Apply component library + Spotify-style layout across existing functional screens.
6. Playlists (create/edit/import .m3u).
7. Search, Home view, Album/Artist detail views.
8. Persistence (last session state), incremental folder watching, polish/edge cases (missing art, corrupt files, empty folders).

At each step, produce a working build before moving to the next — do not batch all features into one untestable commit.

---

## 6. Deliverable Format

- Full source in a structured repo (not a single file dump), with clear separation of `main/` (Electron main + preload), `renderer/` (Next.js app).
- `README.md` with setup instructions (`npm install`, `npm run dev` for local dev with hot reload, `npm run build` / `electron-builder` for packaged app).
- Note any external npm package licenses that require attribution.
