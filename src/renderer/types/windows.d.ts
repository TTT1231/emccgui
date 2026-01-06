declare global {
   interface Window {
      /**
       * @description 渲染进程调用主线程提供的api
       */
      electronApi: IElectronApi;
   }
}

// global默认是模块作用域,需要显式导出才能成为全局声明文件
export {};
