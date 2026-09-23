import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  scanFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
  getTracks: () => ipcRenderer.invoke('db:getTracks'),
  getAlbums: () => ipcRenderer.invoke('db:getAlbums'),
  getArtists: () => ipcRenderer.invoke('db:getArtists'),
  
  // Playlists
  getPlaylists: () => ipcRenderer.invoke('db:getPlaylists'),
  getPlaylistTracks: (playlistId: number) => ipcRenderer.invoke('db:getPlaylistTracks', playlistId),
  createPlaylist: (name: string) => ipcRenderer.invoke('db:createPlaylist', name),
  renamePlaylist: (id: number, name: string) => ipcRenderer.invoke('db:renamePlaylist', id, name),
  deletePlaylist: (id: number) => ipcRenderer.invoke('db:deletePlaylist', id),
  addTrackToPlaylist: (playlistId: number, trackId: number) => ipcRenderer.invoke('db:addTrackToPlaylist', playlistId, trackId),
  removeTrackFromPlaylist: (playlistId: number, trackId: number) => ipcRenderer.invoke('db:removeTrackFromPlaylist', playlistId, trackId),
  reorderPlaylistTracks: (playlistId: number, trackIds: number[]) => ipcRenderer.invoke('db:reorderPlaylistTracks', playlistId, trackIds),
  exportPlaylistM3U: (playlistId: number) => ipcRenderer.invoke('dialog:exportPlaylistM3U', playlistId),
  importPlaylistM3U: () => ipcRenderer.invoke('dialog:importPlaylistM3U'),
  importDirectoryPlaylists: (folderPath?: string) => ipcRenderer.invoke('dialog:importDirectoryPlaylists', folderPath),

  // Favorites
  getFavorites: () => ipcRenderer.invoke('db:getFavorites'),
  toggleFavorite: (trackId: number) => ipcRenderer.invoke('db:toggleFavorite', trackId),
  updateTrackDuration: (trackId: number, duration: number) => ipcRenderer.invoke('db:updateTrackDuration', trackId, duration),

  // Lyrics
  getLyricsForTrack: (trackPath: string, trackId: number) => ipcRenderer.invoke('lyrics:getForTrack', trackPath, trackId),
  getLyricOffset: (trackId: number) => ipcRenderer.invoke('lyrics:getOffset', trackId),
  setLyricOffset: (trackId: number, offsetMs: number) => ipcRenderer.invoke('lyrics:setOffset', trackId, offsetMs),

  // Library Care & Metadata
  getWatchedFolders: () => ipcRenderer.invoke('db:getWatchedFolders'),
  addWatchedFolder: (folderPath: string) => ipcRenderer.invoke('db:addWatchedFolder', folderPath),
  removeWatchedFolder: (folderId: number) => ipcRenderer.invoke('db:removeWatchedFolder', folderId),
  getScanErrors: (folderId?: number) => ipcRenderer.invoke('db:getScanErrors', folderId),
  clearScanErrors: (folderId?: number) => ipcRenderer.invoke('db:clearScanErrors', folderId),
  rescanFolder: (folderPath: string) => ipcRenderer.invoke('scanner:rescanFolder', folderPath),
  removeFolderFromLibrary: (folderPath: string) => ipcRenderer.invoke('scanner:removeFolder', folderPath),
  getTrackDetails: (trackId: number) => ipcRenderer.invoke('metadata:getTrackDetails', trackId),
  updateTrackMetadata: (trackId: number, fields: unknown, writeToFile?: boolean) =>
    ipcRenderer.invoke('metadata:updateTrack', trackId, fields, writeToFile),
  findDuplicates: () => ipcRenderer.invoke('metadata:findDuplicates'),
  findMissingFiles: () => ipcRenderer.invoke('metadata:findMissingFiles'),
  relinkTrackDialog: (trackId: number) => ipcRenderer.invoke('metadata:relinkTrackDialog', trackId),
  relinkTrack: (trackId: number, newPath: string) => ipcRenderer.invoke('metadata:relinkTrack', trackId, newPath),
  replaceAlbumArtwork: (albumId: number, writeToFile?: boolean) =>
    ipcRenderer.invoke('metadata:replaceAlbumArtwork', albumId, writeToFile),
  removeTrackFromLibrary: (trackId: number) => ipcRenderer.invoke('metadata:removeTrackFromLibrary', trackId),
  revealInExplorer: (filePath: string) => ipcRenderer.invoke('metadata:revealInExplorer', filePath),
  getLibraryHealthReport: () => ipcRenderer.invoke('library:getHealthReport'),
  getScanDashboard: () => ipcRenderer.invoke('library:getScanDashboard'),

  // Personal Discovery, Ratings, Tags, Smart Playlists & Settings
  recordPlayEvent: (trackId: number, durationPlayed?: number) => ipcRenderer.invoke('db:recordPlayEvent', trackId, durationPlayed),
  getPlayHistory: (limit?: number) => ipcRenderer.invoke('db:getPlayHistory', limit),
  getPlayCounts: () => ipcRenderer.invoke('db:getPlayCounts'),
  clearPlayHistory: () => ipcRenderer.invoke('db:clearPlayHistory'),
  setPlayHistoryEnabled: (enabled: boolean) => ipcRenderer.invoke('db:setPlayHistoryEnabled', enabled),
  isPlayHistoryEnabled: () => ipcRenderer.invoke('db:isPlayHistoryEnabled'),
  setTrackRating: (trackId: number, rating: number) => ipcRenderer.invoke('db:setTrackRating', trackId, rating),
  getTrackRating: (trackId: number) => ipcRenderer.invoke('db:getTrackRating', trackId),
  getAllTrackRatings: () => ipcRenderer.invoke('db:getAllTrackRatings'),
  addTrackTag: (trackId: number, tag: string) => ipcRenderer.invoke('db:addTrackTag', trackId, tag),
  removeTrackTag: (trackId: number, tag: string) => ipcRenderer.invoke('db:removeTrackTag', trackId, tag),
  getTrackTags: (trackId: number) => ipcRenderer.invoke('db:getTrackTags', trackId),
  getAllTrackTagsMap: () => ipcRenderer.invoke('db:getAllTrackTagsMap'),
  createSmartPlaylist: (name: string, rules: unknown[]) => ipcRenderer.invoke('db:createSmartPlaylist', name, rules),
  getSmartPlaylists: () => ipcRenderer.invoke('db:getSmartPlaylists'),
  updateSmartPlaylist: (id: number, name: string, rules: unknown[]) => ipcRenderer.invoke('db:updateSmartPlaylist', id, name, rules),
  deleteSmartPlaylist: (id: number) => ipcRenderer.invoke('db:deleteSmartPlaylist', id),
  evaluateSmartPlaylist: (rules: unknown[]) => ipcRenderer.invoke('db:evaluateSmartPlaylist', rules),
  getForgottenFavorites: (limit?: number) => ipcRenderer.invoke('db:getForgottenFavorites', limit),
  getRecentAdditions: (limit?: number) => ipcRenderer.invoke('db:getRecentAdditions', limit),
  getMoreFromArtist: (artistId: number, limit?: number) => ipcRenderer.invoke('db:getMoreFromArtist', artistId, limit),
  getSetting: (key: string, defaultValue?: string) => ipcRenderer.invoke('db:getSetting', key, defaultValue),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('db:setSetting', key, value),
  savePlaybackState: (state: unknown) => ipcRenderer.invoke('db:savePlaybackState', state),
  getPlaybackState: () => ipcRenderer.invoke('db:getPlaybackState'),

  // Miniplayer
  toggleMiniplayer: () => ipcRenderer.invoke('window:toggleMiniplayer'),
  setMiniplayer: (enable: boolean) => ipcRenderer.invoke('window:setMiniplayer', enable),
  getMiniplayerState: () => ipcRenderer.invoke('window:getMiniplayerState'),
  onMiniplayerStateChanged: (callback: (isMini: boolean) => void) => {
    const handler = (_event: unknown, isMini: boolean) => callback(isMini);
    ipcRenderer.on('window:miniplayerStateChanged', handler);
    return () => {
      ipcRenderer.removeListener('window:miniplayerStateChanged', handler);
    };
  },

  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  onLibraryUpdated: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('library-updated', handler);
    return () => {
      ipcRenderer.removeListener('library-updated', handler);
    };
  },

  // Desktop Polish: Shortcuts, Tray, Notifications & Diagnostics
  getShortcuts: () => ipcRenderer.invoke('shortcuts:get'),
  saveShortcuts: (shortcuts: unknown) => ipcRenderer.invoke('shortcuts:save', shortcuts),
  resetShortcuts: () => ipcRenderer.invoke('shortcuts:reset'),
  updateTrayTrack: (title: string, artist: string, isPlaying: boolean) =>
    ipcRenderer.invoke('tray:updateTrack', title, artist, isPlaying),
  notifyTrackChanged: (title: string, artist: string, album: string) =>
    ipcRenderer.invoke('notification:trackChanged', title, artist, album),
  getDiagnosticReport: () => ipcRenderer.invoke('diagnostics:getReport'),
  exportDiagnosticReport: () => ipcRenderer.invoke('diagnostics:export'),

  // Desktop Shortcut Listeners (from Global Shortcuts / OS Media Keys / Tray)
  onShortcutTogglePlay: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('playback:togglePlay', handler);
    return () => { ipcRenderer.removeListener('playback:togglePlay', handler); };
  },
  onShortcutNext: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('playback:next', handler);
    return () => { ipcRenderer.removeListener('playback:next', handler); };
  },
  onShortcutPrev: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('playback:prev', handler);
    return () => { ipcRenderer.removeListener('playback:prev', handler); };
  },
  onShortcutVolumeStep: (callback: (delta: number) => void) => {
    const handler = (_event: unknown, delta: number) => callback(delta);
    ipcRenderer.on('playback:volumeStep', handler);
    return () => { ipcRenderer.removeListener('playback:volumeStep', handler); };
  },
  onShortcutToggleLyrics: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('ui:toggleLyrics', handler);
    return () => { ipcRenderer.removeListener('ui:toggleLyrics', handler); };
  },
  onShortcutToggleMiniplayer: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('ui:toggleMiniplayer', handler);
    return () => { ipcRenderer.removeListener('ui:toggleMiniplayer', handler); };
  },
  onOpenSettings: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('ui:openSettings', handler);
    return () => { ipcRenderer.removeListener('ui:openSettings', handler); };
  },

  // ── 0.2.0: Migration, Backup, Device Sync & App Info ──
  getMigrationStatus: () => ipcRenderer.invoke('migration:getStatus'),
  runMigrations: () => ipcRenderer.invoke('migration:run'),

  exportBackup: () => ipcRenderer.invoke('backup:export'),
  selectBackupForPreview: () => ipcRenderer.invoke('backup:selectFileForPreview'),
  previewBackup: (filePath: string) => ipcRenderer.invoke('backup:preview', filePath),
  restoreBackup: (filePath: string, mode: 'skip' | 'overwrite' | 'merge', restoreSettings: boolean) =>
    ipcRenderer.invoke('backup:restore', filePath, mode, restoreSettings),
  relocateLibrary: (oldPrefix: string, newPrefix: string) =>
    ipcRenderer.invoke('backup:relocate', oldPrefix, newPrefix),

  getDeviceSyncStatus: () => ipcRenderer.invoke('sync:getStatus'),
  toggleDeviceSyncServer: (enabled: boolean) => ipcRenderer.invoke('sync:toggleServer', enabled),
  generatePairingPin: () => ipcRenderer.invoke('sync:generatePin'),
  pairWithPeer: (targetIp: string, pin: string, targetPort?: number) =>
    ipcRenderer.invoke('sync:pairWithPeer', targetIp, pin, targetPort),
  sendPlaylistToPeer: (deviceId: string, playlistId: number, targetPort?: number) =>
    ipcRenderer.invoke('sync:sendPlaylist', deviceId, playlistId, targetPort),
  acceptIncomingPlaylist: (pendingId: string) =>
    ipcRenderer.invoke('sync:acceptPlaylist', pendingId),
  declineIncomingPlaylist: (pendingId: string) =>
    ipcRenderer.invoke('sync:declinePlaylist', pendingId),
  revokePairedDevice: (deviceId: string) =>
    ipcRenderer.invoke('sync:revokeDevice', deviceId),

  onDevicePaired: (callback: (device: { id: string; name: string; ip: string }) => void) => {
    const handler = (_event: unknown, device: { id: string; name: string; ip: string }) => callback(device);
    ipcRenderer.on('sync:devicePaired', handler);
    return () => { ipcRenderer.removeListener('sync:devicePaired', handler); };
  },
  onPlaylistReceived: (callback: (playlist: unknown) => void) => {
    const handler = (_event: unknown, playlist: unknown) => callback(playlist);
    ipcRenderer.on('sync:playlistReceived', handler);
    return () => { ipcRenderer.removeListener('sync:playlistReceived', handler); };
  },

  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
});
