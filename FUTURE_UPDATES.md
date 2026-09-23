# Overtune Future Updates

> Product roadmap draft for releases **0.1.6 through 0.2.0**. Overtune is a local-first desktop music player: the library and playback should remain useful without an account or an internet connection. Release contents are proposals and may change as implementation and user feedback reveal priorities.

## Product direction

Overtune should make a personal music collection feel as polished and easy to explore as a streaming app, while keeping control of the files and data with the listener. The roadmap prioritizes everyday listening, trustworthy library management, privacy, and dependable desktop behavior. Online services should be optional enhancements; core playback, playlists, lyrics already on disk, and settings should work offline.

### Roadmap principles

- **Local-first by default:** scan and play local files without an account. Clearly disclose any optional network lookup and let the listener turn it off.
- **Respect the collection:** never move, rewrite, or delete music files without an explicit action. Keep backups and imports understandable and reversible.
- **Ship a coherent improvement per release:** prioritize a small number of complete features over a long list of partial integrations.
- **Make desktop behavior dependable:** preserve playback, library state, and preferences across restarts and upgrades; support keyboard, accessibility, and common desktop controls.
- **Avoid service lock-in:** favor open formats and portable exports for playlists, lyrics, and backups.

## At a glance

| Version | Theme | Main user outcome |
|---|---|---|
| **0.1.6** | Lyrics & listening focus | Read synchronized or plain local lyrics while a track plays |
| **0.1.7** | Better library care | Fix tags and artwork safely, find duplicates, and understand scan health |
| **0.1.8** | Personal discovery | Build useful mixes, smart playlists, and listening history from the local library |
| **0.1.9** | Desktop polish | Use Overtune comfortably with global controls, shortcuts, accessibility, and reliable resume |
| **0.2.0** | Personal music hub | Deliver a stable, portable library experience with optional device sync and a mature release foundation |

---

## 0.1.6 — Lyrics & Listening Focus

**Goal:** Make lyrics useful in the same offline-first way as music files, with optional online retrieval clearly separated from local playback.

### Planned features

- **Lyrics panel** in Now Playing and the expanded track view, with readable scrolling, current-line emphasis, and a no-lyrics state.
- **Local lyrics support:** read adjacent `.lrc` and `.txt` files; recognize embedded lyric tags where available. Match sidecar names predictably and show which source was used.
- **Synchronized LRC playback:** follow timestamps during playback, jump to a line by clicking it, and keep lyric timing aligned after seeking or track changes.
- **Plain-text mode** for untimed lyrics, with manual scrolling and a clear distinction from synchronized lyrics.
- **Manual correction controls:** adjust lyric offset for the current session and save it as track metadata in Overtune's database without modifying audio files.
- **Optional lookup design:** define a provider boundary for a later online lyrics source. Do not scrape sites or silently transmit listening/library data. Any future lookup must be opt-in, disclose the provider and query fields, and work without an account.
- **Keyboard and accessibility basics:** lyrics panel controls have labels, focus states, and keyboard navigation; reduced-motion settings are respected.

### Completion criteria

- Local LRC and TXT lyrics can be found, displayed, and remain available offline.
- Synchronized highlighting and line seeking stay correct through pause, seek, repeat, and next/previous track.
- Missing, malformed, and mismatched lyric files fail gracefully and never interrupt playback.
- No network request is required to use lyrics shipped with the user's collection.

### Scope guard

Do not make automatic cloud lyric fetching a dependency of playback. Keep lyric editing and writing into audio tags out of this release unless there is a reliable backup/undo flow.

---

## 0.1.7 — Library Care & Metadata Tools

**Goal:** Help listeners maintain large and imperfect libraries without risking their files.

### Planned features

- **Library scan dashboard:** show scan progress, watched folders, last scan time, indexed track count, skipped files, and actionable errors. Support rescan and remove-folder actions with clear consequences.
- **Safe metadata editor:** edit title, artist, album, album artist, track/disc number, year, and genre. Preview changes and choose whether to update Overtune's catalog only or write supported tags into the file.
- **Artwork management:** inspect embedded cover art, choose replacement artwork, and preview the result. Preserve originals or provide undo before writing file tags.
- **Duplicate review:** group likely duplicates using file hashes and metadata; compare paths and file sizes; let the user keep, remove from library, or reveal files in Explorer. Never delete files automatically.
- **Missing-file recovery:** flag unavailable paths and offer a relink flow when a folder is moved or a drive is reconnected.
- **Improved search and filters:** filter by album artist, genre, year, folder, and duration; keep searches responsive on large libraries.
- **Library health report:** identify missing tags, suspicious durations, unreadable files, and albums with inconsistent metadata without changing anything automatically.

### Completion criteria

- Metadata edits are validated, persisted, and reflected consistently across track, album, artist, and playlist views.
- File tag writes are explicit, format-aware, and recoverable; catalog-only edits remain available.
- Duplicate review is explainable and non-destructive by default.
- Scan and recovery errors tell the listener what happened and what they can do next.

### Scope guard

Do not add bulk destructive cleanup. Any file-writing or removal action needs a preview and an explicit user choice.

---

## 0.1.8 — Personal Discovery & Smart Playlists

**Goal:** Make a listener's own collection easier to rediscover, without pretending to know preferences from a cloud profile.

### Planned features

- **Recently played and play counts**, stored locally, with a setting to pause or clear listening history.
- **Continue listening:** restore the last track and position after restart, with a preference to resume automatically or wait for user input.
- **Smart playlists:** saved rules such as genre, artist, album artist, year, rating/favorite, recently added, play count, and never played. Refresh results from the local catalog.
- **Ratings and personal tags:** optional per-track star rating and user labels for mood, activity, or collection organization.
- **Mix tools:** generate simple local mixes such as “forgotten favorites,” “recent additions,” or “more from this album/artist,” with editable results and transparent rules.
- **Playlist improvements:** reorder tracks, sort by common metadata, multi-select tracks, and export/import portable playlists with path handling clearly reported.
- **Queue improvements:** save and restore a queue as a playlist; make queue order and current position clear.

### Completion criteria

- Listening history and generated playlists are local, transparent, and can be disabled or cleared.
- Smart playlist rules are understandable and update predictably as the library changes.
- Mixes can be edited and saved as ordinary playlists; no recommendation requires uploading listening history.
- Restart behavior does not unexpectedly start audio unless the listener chose that preference.

---

## 0.1.9 — Desktop Polish & Everyday Reliability

**Goal:** Make Overtune feel native and dependable during daily desktop use.

### Planned features

- **Global media controls:** integrate with supported operating-system media keys and the desktop media session so play/pause and track details work outside the app.
- **Configurable keyboard shortcuts:** playback, search, navigation, volume, queue, and lyrics actions; detect shortcut conflicts and provide defaults/reset.
- **System tray behavior:** optional minimize-to-tray, playback controls, and a clear way to quit. Explain tray behavior during setup/settings.
- **Playback reliability:** handle unavailable files and device changes gracefully; improve gapless transitions where supported; remember per-device output preferences if the platform permits it.
- **Accessibility pass:** keyboard-only navigation, visible focus, screen-reader names, scalable text, contrast checks, and reduced motion across core flows.
- **Window and session preferences:** remember window size/position safely, retain layout and view preferences, and avoid restoring invalid off-screen positions.
- **Notifications and focus options:** optional track-change notifications and a configurable focus mode; keep notifications disabled or minimal by default.
- **Support bundle:** export a user-approved diagnostic report with app version, platform, and sanitized error/scan details. Never include audio files or full paths by default.

### Completion criteria

- Core playback is controllable with media keys and keyboard shortcuts where the host OS supports them.
- Tray, close, and restart behavior are understandable and configurable.
- The core listening flow can be completed by keyboard, and the main controls expose accessible names.
- Diagnostic export previews what is included and omits personal library data by default.

---

## 0.2.0 — Personal Music Hub (Stability Milestone)

**Goal:** Establish a dependable 0.2 release that brings the library, playback, organization, and portability features together as a cohesive product.

### Planned features

- **Library backup and restore:** export playlists, ratings, tags, play history, settings, and Overtune-managed metadata to a documented portable archive. Restore with preview, conflict handling, and no overwrite by default.
- **Portable library options:** support moving the Overtune catalog to another computer and relinking music folders. Explain what is portable and what remains tied to the original machine.
- **Optional local-network device access/sync discovery:** investigate a user-controlled, same-network way to discover another Overtune device or send a playlist. Require explicit pairing, show connected devices, and provide a disconnect/revoke control. Keep this feature out if threat modeling and platform behavior are not ready.
- **Cross-platform release readiness:** validate installer, upgrade, data paths, audio formats, and media controls on supported Windows, macOS, and Linux targets; publish known limitations by platform.
- **Upgrade safety:** database migrations are versioned and recoverable, with a backup before migration and a clear recovery path if an upgrade fails.
- **Release quality baseline:** documented supported OS/runtime versions, signed release artifacts where feasible, checksums, concise release notes, and an in-app version/update status that does not require automatic downloads.
- **Performance and scale pass:** profile startup, scanning, search, and UI responsiveness against large libraries; establish practical targets and fix measured bottlenecks.
- **User feedback loop:** in-app link to report an issue or request a feature; any telemetry, if considered, remains separate, opt-in, minimal, and documented. No account requirement.

### Completion criteria

- A user can back up and restore their Overtune-managed data with a preview and documented format.
- Upgrade and migration paths preserve the user's library database and provide a recovery plan.
- Supported platform claims match tested release artifacts and published limitations.
- 0.2.0 feature set has no known data-loss issues in backup, migration, playlist, or library workflows.

### Scope guard

Treat device sync as an experiment gated by explicit pairing, transport security, and a clear conflict model. Do not make cloud accounts, subscriptions, or remote storage prerequisites for the 0.2.0 core experience.

---

## Suggested delivery order

Within each release, build foundational data behavior before UI polish:

1. Define local data models, migration behavior, and failure states.
2. Add main-process/preload APIs with narrow permissions where needed.
3. Build the user flow and settings, including empty, error, and offline states.
4. Verify behavior with representative small and large libraries, restart/upgrade paths, and missing or malformed files.
5. Update help text, release notes, and screenshots only after the feature is complete.

## How to choose what ships

For each candidate feature, weigh user value, implementation size, maintenance cost, privacy implications, data-loss risk, and platform differences. Prefer a complete local workflow over a flashy feature that depends on a fragile third-party service. Before committing to a release, validate the plan against user feedback and any open bugs from the previous version.

## Ideas beyond 0.2.0

These are discovery candidates, not commitments:

- Optional synchronization of playlists and settings across a listener's own devices.
- ReplayGain or other loudness normalization with per-track/per-album modes.
- Audio output and DSP options such as crossfade, equalizer presets, and configurable audio device selection where supported.
- Podcast/audiobook support with bookmarks, playback speed, and resume position.
- Optional scrobbling or integration with personal music services, with granular consent and local-first behavior.
- Plugin or extension API only after a stable permissions and compatibility model exists.

