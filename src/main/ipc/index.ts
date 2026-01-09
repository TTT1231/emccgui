import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'node:path';
import os from 'node:os';

import { shell } from 'electron';
import { app, BrowserWindow, dialog } from 'electron/main';

import { createIpcMain } from './utils/ipcFactoryMainTypeUtil';

const execAsync = promisify(exec);

export function registerIpcHandlers() {
   const ipcMain = createIpcMain<'IElectronApi', IElectronApi>();

   //========================================== WindowControl ==========================================//
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
   //========================================== BrowserControl ==========================================//
   ipcMain.on('IElectronApi-BrowserControl-openBrowser', (_, url) => {
      shell.openExternal(url);
   });

   //========================================== EmccControl ==========================================//
   ipcMain.handle(
      'IElectronApi-EmccControl-executeCommand',
      async (_, command: string, workDir?: string) => {
         try {
            const options = workDir
               ? { cwd: workDir, maxBuffer: 10 * 1024 * 1024 }
               : { maxBuffer: 10 * 1024 * 1024 };
            const { stdout, stderr } = await execAsync(command, options);
            return {
               success: true,
               stdout: stdout || '',
               stderr: stderr || '',
            } as EmccExecuteResult;
         } catch (error: unknown) {
            return {
               success: false,

               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               stdout: (error as unknown as any).stdout || '',
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               stderr: (error as unknown as any).stderr || '',
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               error: (error as unknown as any).message || '命令执行失败',
            } as EmccExecuteResult;
         }
      },
   );

   ipcMain.handle('IElectronApi-EmccControl-selectFile', async () => {
      const result = await dialog.showOpenDialog({
         properties: ['openFile'],
         filters: [
            { name: 'C/C++ Files', extensions: ['cpp', 'c', 'cc'] },
            { name: 'All Files', extensions: ['*'] },
         ],
      });

      if (result.canceled || result.filePaths.length === 0) {
         return null;
      }

      const filePath = result.filePaths[0]!;
      const fileName = path.basename(filePath);

      return { filePath, fileName };
   });

   //========================================== InternalShow ==========================================//
   ipcMain.on('IElectronApi-InternalShow-showVersionInfo', () => {
      const versionInfo = [
         `应用版本: ${app.getVersion()}`,
         `Electron 版本: ${process.versions.electron}`,
         `Chrome 版本: ${process.versions.chrome}`,
         `Node.js 版本: ${process.versions.node}`,
         `V8 版本: ${process.versions.v8}`,
         `操作系统: ${os.type()} ${os.release()} (${os.arch()})`,
      ].join('\n\n');

      dialog.showMessageBox({
         type: 'info',
         title: '版本信息',
         message: '软件版本详情',
         detail: versionInfo,
         buttons: ['确定'],
         noLink: true,
      });
   });
}
