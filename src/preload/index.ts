import { contextBridge } from 'electron/renderer';

import { createPreloadApi, type ExposedApiStructure } from './ipcFactoryPreloadTypeUtil';

const ipcRenderer = createPreloadApi<'IElectronApi', IElectronApi>();

const electronApi: ExposedApiStructure<IElectronApi> = {
   WindowControl: {
      minimize: () => ipcRenderer.send('IElectronApi-WindowControl-minimize'),
      maximize: () => ipcRenderer.send('IElectronApi-WindowControl-maximize'),
      close: () => ipcRenderer.send('IElectronApi-WindowControl-close'),
      openDevTools: () => ipcRenderer.send('IElectronApi-WindowControl-openDevTools'),
   },
};

contextBridge.exposeInMainWorld('electronApi', electronApi);
