import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'node:path';
import os from 'node:os';

import { shell } from 'electron';
import { app, BrowserWindow, dialog } from 'electron/main';
import { autoUpdater } from 'electron-updater';

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
   ipcMain.on('IElectronApi-InternalControl-showVersionInfo', () => {
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
   ipcMain.on('IElectronApi-InternalControl-checkUpdate', async () => {
      //配置 autoUpdater
      autoUpdater.autoDownload = false;
      autoUpdater.autoInstallOnAppQuit = true;

      // 使用 generic provider，手动指定更新文件的 URL
      // 注意：electron-forge 不会自动生成 latest.yml，需要手动创建或使用其他方式
      autoUpdater.setFeedURL({
         provider: 'generic',
         url: 'https://github.com/TTT1231/emccgui/releases/latest/download',
      });

      try {
         const result = await autoUpdater.checkForUpdates();

         if (!result || !result.updateInfo) {
            dialog.showMessageBox({
               type: 'info',
               title: app.name,
               message: '当前没有可用的更新。',
            });
            return;
         }

         const { version } = result.updateInfo;
         const currentVersion = app.getVersion();

         //比较版本号
         if (version === currentVersion) {
            dialog.showMessageBox({
               type: 'info',
               title: app.name,
               message: '当前已经是最新版本。',
            });
            return;
         }

         //发现新版本，询问用户是否更新
         // 发现新版本，询问用户是否更新
         const response = await dialog.showMessageBox({
            type: 'question',
            title: app.name,
            message: `发现新版本 ${version}，是否立即下载更新？`,
            detail: `当前版本: ${currentVersion}\n最新版本: ${version}`,
            buttons: ['立即更新', '稍后再说'],
            defaultId: 0,
            cancelId: 1,
         });

         if (response.response === 0) {
            //用户选择更新，开始下载
            dialog.showMessageBox({
               type: 'info',
               title: app.name,
               message: '正在后台下载更新，完成后会通知您...',
            });

            autoUpdater.on('download-progress', (progress: { percent: number }) => {
               console.log(`下载进度: ${progress.percent.toFixed(1)}%`);
            });

            autoUpdater.on('update-downloaded', async () => {
               const installResponse = await dialog.showMessageBox({
                  type: 'info',
                  title: app.name,
                  message: '更新下载完成，是否立即重启应用？',
                  buttons: ['立即重启', '稍后重启'],
                  defaultId: 0,
               });

               if (installResponse.response === 0) {
                  autoUpdater.quitAndInstall();
               }
            });

            autoUpdater.on('error', error => {
               dialog.showMessageBox({
                  type: 'error',
                  title: app.name,
                  message: `下载更新时出错: ${error.message}`,
               });
            });

            await autoUpdater.downloadUpdate();
         }
      } catch (error) {
         dialog.showMessageBox({
            type: 'error',
            title: app.name,
            message: `检查更新失败: ${error instanceof Error ? error.message : '未知错误'}`,
         });
      }
   });
}
