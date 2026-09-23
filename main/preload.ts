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
});
