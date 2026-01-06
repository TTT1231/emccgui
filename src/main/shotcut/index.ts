import { globalShortcut, type BrowserWindow } from 'electron/main';

//注册全局键盘快捷键
function registerGlobalShortcuts(mainWindow: BrowserWindow) {
   globalShortcut.register('CommandOrControl+Shift+I', () => {
      // 先获取开发者工具的当前状态
      const devToolsIsOpen = mainWindow.webContents.isDevToolsOpened();

      if (devToolsIsOpen) {
         // 如果已打开，就关闭
         mainWindow.webContents.closeDevTools();
      } else {
         // 如果未打开，就打开
         mainWindow.webContents.openDevTools();
      }
   });
}

export function registerShortcuts(mainWindow: BrowserWindow) {
   //注册全局快捷键
   registerGlobalShortcuts(mainWindow);
}
