/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcRenderer } from 'electron/renderer';

/**
 * @description 创建类型安全的 Preload API 构建器
 * @template NS - 命名空间字符串（通常是接口名称）
 * @template T - IPC 接口定义类型
 * @returns 返回一个类型安全的 API 构建器，用于 contextBridge.exposeInMainWorld
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
 * // 创建 API 构建器（不需要传递 namespace 参数）
 * const api = createPreloadApi<'IElectronApi', IElectronApi>();
 *
 * // 使用 - 每一层都有类型提示！
 * contextBridge.exposeInMainWorld('electronApi', {
 *   windowControl: {
 *     // 输入时会提示 minimize, maximize, close
 *     minimize: () => api.send('IElectronApi-windowControl-minimize'),
 *     // channel 名称也有自动提示
 *   },
 *   app: {
 *     getVersion: () => api.invoke('IElectronApi-app-getVersion'),
 *   },
 * });
 */
export function createPreloadApi<NS extends string, T extends Record<string, any>>() {
   type Channel = NamespacedPaths<NS, T>;

   return {
      /**
       * 异步调用主进程的 handle 处理器
       */
      invoke<P extends Channel>(
         channel: P,
         ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>> extends any[]
            ? FuncArgs<GetFuncFromNamespaced<NS, T, P>>
            : never
      ): Promise<Awaited<FuncReturn<GetFuncFromNamespaced<NS, T, P>>>> {
         return ipcRenderer.invoke(channel as string, ...args);
      },

      /**
       * 向主进程发送消息（无返回值）
       */
      send<P extends Channel>(
         channel: P,
         ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>> extends any[]
            ? FuncArgs<GetFuncFromNamespaced<NS, T, P>>
            : never
      ): void {
         ipcRenderer.send(channel as string, ...args);
      },

      /**
       * 同步调用主进程（阻塞，谨慎使用）
       */
      sendSync<P extends Channel>(
         channel: P,
         ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>> extends any[]
            ? FuncArgs<GetFuncFromNamespaced<NS, T, P>>
            : never
      ): FuncReturn<GetFuncFromNamespaced<NS, T, P>> {
         return ipcRenderer.sendSync(channel as string, ...args);
      },

      /**
       * 监听主进程消息
       */
      on<P extends Channel>(
         channel: P,
         callback: (
            ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>> extends any[]
               ? FuncArgs<GetFuncFromNamespaced<NS, T, P>>
               : never
         ) => void,
      ): () => void {
         const listener = (_event: any, ...args: any[]) => {
            (callback as (...a: any[]) => void)(...args);
         };
         ipcRenderer.on(channel as string, listener);
         return () => {
            ipcRenderer.off(channel as string, listener);
         };
      },

      /**
       * 监听主进程消息（只触发一次）
       */
      once<P extends Channel>(
         channel: P,
         callback: (
            ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>> extends any[]
               ? FuncArgs<GetFuncFromNamespaced<NS, T, P>>
               : never
         ) => void,
      ): void {
         ipcRenderer.once(channel as string, (_event, ...args) => {
            (callback as (...a: any[]) => void)(...(args as any));
         });
      },

      /**
       * 获取通道名称的辅助方法（用于类型提示）
       */
      channel<P extends Channel>(channel: P): P {
         return channel;
      },
   };
}

/**
 * @description 创建类型安全的 exposeInMainWorld API 结构定义
 * 这个类型用于帮助开发者在手写 contextBridge.exposeInMainWorld 时获得完整的类型提示
 *
 * @usage @example
 * interface IElectronApi {
 *   windowControl: {
 *     minimize: () => void;
 *     maximize: () => void;
 *   };
 * }
 *
 * // 使用类型约束（不需要传递 namespace 参数）
 * const api = createPreloadApi<'IElectronApi', IElectronApi>();
 *
 * // 定义符合接口结构的 API
 * const electronApi: ExposedApiStructure<IElectronApi> = {
 *   windowControl: {
 *     minimize: () => api.send('IElectronApi-windowControl-minimize'),
 *     maximize: () => api.send('IElectronApi-windowControl-maximize'),
 *   },
 * };
 *
 * contextBridge.exposeInMainWorld('electronApi', electronApi);
 */
export type ExposedApiStructure<T> = {
   [K in keyof T]: T[K] extends (...args: infer Args) => infer R
      ? (...args: Args) => R extends Promise<any> ? R : Promise<R> | void
      : T[K] extends object
        ? ExposedApiStructure<T[K]>
        : never;
};

/**
 * @description 获取所有带命名空间的通道名称类型
 * 用于在手写 ipcRenderer.send/invoke 时获得通道名提示
 */
export type GetChannels<NS extends string, T extends Record<string, any>> = NamespacedPaths<NS, T>;

export const IpcRendererManager = {
   createPreloadApi,
};
