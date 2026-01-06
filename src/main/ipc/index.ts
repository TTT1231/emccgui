import { BrowserWindow } from 'electron/main';

import { createIpcMain } from './utils/ipcFactoryMainTypeUtil';

export function registerIpcHandlers() {
   const ipcMain = createIpcMain<'IElectronApi', IElectronApi>();
   ipcMain.on('IElectronApi-WindowControl-minimize', e => {
      const currentWindow = BrowserWindow.fromWebContents(e.sender);
      currentWindow?.minimize();
   });
   ipcMain.on('IElectronApi-WindowControl-maximize', e => {
      const currentWindow = BrowserWindow.fromWebContents(e.sender);
      if (!currentWindow) return;
      if (currentWindow.isMaximized()) {
         currentWindow.unmaximize();
      } else {
         currentWindow.maximize();
      }
   });
   ipcMain.on('IElectronApi-WindowControl-close', e => {
      const currentWindow = BrowserWindow.fromWebContents(e.sender);
      currentWindow?.close();
   });
   ipcMain.on('IElectronApi-WindowControl-openDevTools', e => {
      const currentWindow =
         BrowserWindow.fromWebContents(e.sender) ??
         BrowserWindow.getFocusedWindow() ??
         BrowserWindow.getAllWindows()[0];

      if (!currentWindow) return;

      const isOpenDevTools = currentWindow.webContents.isDevToolsOpened();

      if (isOpenDevTools) {
         currentWindow.webContents.closeDevTools();
      } else {
         currentWindow.webContents.openDevTools();
      }
   });
}
