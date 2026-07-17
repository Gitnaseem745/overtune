import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  scanFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
  getTracks: () => ipcRenderer.invoke('db:getTracks'),
});
