/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcMain, type IpcMainInvokeEvent, type IpcMainEvent } from 'electron/main';

/**
 * @description 创建带命名空间的类型安全 IPC 管理器
 * @template NS - 命名空间字符串（通常是接口名称）
 * @template T - IPC 接口定义类型
 * @returns 返回一个包含类型化 IPC 方法的对象
 *
 * @usage @example
 * // 定义接口
 * interface IElectronApi {
 *   windowControl: {
 *     minimize: () => void;
 *     maximize: () => void;
 *     close: () => void;
 *   };
 *   app: {
 *     getVersion: () => Promise<string>;
 *   };
 * }
 *
 * // 创建带命名空间的管理器（不需要传递 namespace 参数）
 * const api = createIpcMain<'IElectronApi', IElectronApi>();
 *
 * // 通道名会自动加上命名空间前缀
 * api.handle('IElectronApi-windowControl-minimize', (event) => {
 *   // 处理最小化
 * });
 *
 * api.handle('IElectronApi-app-getVersion', async (event) => {
 *   return '1.0.0';
 * });
 */
export function createIpcMain<NS extends string, T extends Record<string, any>>() {
   type Channel = NamespacedPaths<NS, T>;

   return {
      /**
       * 注册 handle 处理器（用于 invoke 调用）
       */
      handle<P extends Channel>(
         channel: P,
         handler: (
            event: IpcMainInvokeEvent,
            ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>>
         ) => StrictReturnType<FuncReturn<GetFuncFromNamespaced<NS, T, P>>>,
      ): void {
         ipcMain.handle(channel as string, handler);
      },

      /**
       * 注册一次性 handle 处理器
       */
      handleOnce<P extends Channel>(
         channel: P,
         handler: (
            event: IpcMainInvokeEvent,
            ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>>
         ) => StrictReturnType<FuncReturn<GetFuncFromNamespaced<NS, T, P>>>,
      ): void {
         ipcMain.handleOnce(channel as string, handler);
      },

      /**
       * 移除 handle 处理器
       */
      removeHandler<P extends Channel>(channel: P): void {
         ipcMain.removeHandler(channel as string);
      },

      /**
       * 注册事件监听器（用于 send 调用）
       */
      on<P extends Channel>(
         channel: P,
         listener: (
            event: IpcMainEvent,
            ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>>
         ) => void,
      ): void {
         ipcMain.on(channel as string, listener);
      },

      /**
       * 注册一次性事件监听器
       */
      once<P extends Channel>(
         channel: P,
         listener: (
            event: IpcMainEvent,
            ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>>
         ) => void,
      ): void {
         ipcMain.once(channel as string, listener);
      },

      /**
       * 移除事件监听器
       */
      off<P extends Channel>(
         channel: P,
         listener: (
            event: IpcMainEvent,
            ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>>
         ) => void,
      ): void {
         ipcMain.off(channel as string, listener);
      },

      /**
       * 移除指定通道的所有监听器
       */
      removeAllListeners<P extends Channel>(channel: P): void {
         ipcMain.removeAllListeners(channel as string);
      },
   };
}

export const IpcTypeManager = {
   createIpcMain,
};
