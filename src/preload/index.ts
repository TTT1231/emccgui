import { contextBridge, webUtils } from 'electron/renderer';

import { createPreloadApi, type ExposedApiStructure } from './ipcFactoryPreloadTypeUtil';

const ipcRenderer = createPreloadApi<'IElectronApi', IElectronApi>();

//!ExposedApiStructure类型会将所有方法包装成IPC调用格式（void或Promise类型）
const electronApi: ExposedApiStructure<IElectronApi> = {
   WindowControl: {
      minimize: () => ipcRenderer.send('IElectronApi-WindowControl-minimize'),
      maximize: () => ipcRenderer.send('IElectronApi-WindowControl-maximize'),
      close: () => ipcRenderer.send('IElectronApi-WindowControl-close'),
      openDevTools: () => ipcRenderer.send('IElectronApi-WindowControl-openDevTools'),
   },
   BrowserControl: {
      openBrowser: (url: string) =>
         ipcRenderer.send('IElectronApi-BrowserControl-openBrowser', url),
   },
   EmccControl: {
      executeCommand: (command: string, workDir?: string) =>
         ipcRenderer.invoke('IElectronApi-EmccControl-executeCommand', command, workDir),
      selectFile: () => ipcRenderer.invoke('IElectronApi-EmccControl-selectFile'),
   },
   InternalElectron: {
      showVersionInfo: () => ipcRenderer.send('IElectronApi-InternalElectron-showVersionInfo'),
      checkUpdate: () => ipcRenderer.send('IElectronApi-InternalElectron-checkUpdate'),
   },
};

contextBridge.exposeInMainWorld('electronApi', electronApi);

contextBridge.exposeInMainWorld('getPathForFile', (file: File) => webUtils.getPathForFile(file));
