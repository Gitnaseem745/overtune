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

  // Favorites
  getFavorites: () => ipcRenderer.invoke('db:getFavorites'),
  toggleFavorite: (trackId: number) => ipcRenderer.invoke('db:toggleFavorite', trackId),
  updateTrackDuration: (trackId: number, duration: number) => ipcRenderer.invoke('db:updateTrackDuration', trackId, duration),

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
