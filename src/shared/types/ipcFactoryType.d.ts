/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 提取对象中所有函数类型的键
 */
type FuncKeys<T> = {
   [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T] &
   string;

/**
 * 提取对象中所有非函数对象类型的键（用于嵌套）
 */
type ObjKeys<T> = {
   [K in keyof T]: T[K] extends (...args: any[]) => any ? never : T[K] extends object ? K : never;
}[keyof T] &
   string;

/**
 * @description 生成所有可能的路径（最多3层嵌套，不带命名空间前缀）
 */
type Paths<T> =
   | FuncKeys<T>
   | {
        [K1 in ObjKeys<T>]: `${K1}-${FuncKeys<T[K1]>}`;
     }[ObjKeys<T>]
   | {
        [K1 in ObjKeys<T>]: {
           [K2 in ObjKeys<T[K1]>]: `${K1}-${K2}-${FuncKeys<T[K1][K2]>}`;
        }[ObjKeys<T[K1]>];
     }[ObjKeys<T>];

/**
 * @description 生成带命名空间前缀的路径
 * @example NamespacedPaths<'IElectronApi', IElectronApi> = 'IElectronApi-windowControl-minimize' | ...
 */
type NamespacedPaths<NS extends string, T> =
   | {
        [K in FuncKeys<T>]: `${NS}-${K}`;
     }[FuncKeys<T>]
   | {
        [K1 in ObjKeys<T>]: `${NS}-${K1}-${FuncKeys<T[K1]>}`;
     }[ObjKeys<T>]
   | {
        [K1 in ObjKeys<T>]: {
           [K2 in ObjKeys<T[K1]>]: `${NS}-${K1}-${K2}-${FuncKeys<T[K1][K2]>}`;
        }[ObjKeys<T[K1]>];
     }[ObjKeys<T>];

/**
 * @description 根据带命名空间的路径获取函数类型
 */
type GetFuncFromNamespaced<NS extends string, T, P> = P extends `${NS}-${infer Rest}`
   ? GetFunc<T, Rest>
   : never;

/**
 * @description 根据路径获取函数类型
 */
type GetFunc<T, P> = P extends `${infer First}-${infer Rest}`
   ? First extends keyof T
      ? GetFunc<T[First], Rest>
      : never
   : P extends keyof T
     ? T[P]
     : never;

/**
 * @description 提取函数参数类型
 */
type FuncArgs<F> = F extends (...args: infer Args) => any ? Args : never;

/**
 * @description 提取函数返回值类型
 */
type FuncReturn<F> = F extends (...args: any[]) => infer R ? R : never;

/**
 * @description 辅助类型 - 用于严格检查返回值类型
 */
type StrictReturnType<T> =
   T extends Promise<infer R> ? Promise<R> | R : T extends void ? void | undefined : T;

/**
 * @description 用于构建 preload API 的类型
 * 将接口转换为可用于 contextBridge.exposeInMainWorld 的结构
 */
type BuildExposedApi<NS extends string, T> = {
   [K in keyof T]: T[K] extends (...args: infer Args) => infer R
      ? {
           /** IPC 通道名称 */
           channel: `${NS}-${K & string}`;
           /** 调用方法 */
           invoke: (...args: Args) => Promise<Awaited<R>>;
           send: (...args: Args) => void;
        }
      : T[K] extends object
        ? BuildExposedApiNested<`${NS}-${K & string}`, T[K]>
        : never;
};

type BuildExposedApiNested<Prefix extends string, T> = {
   [K in keyof T]: T[K] extends (...args: infer Args) => infer R
      ? {
           /** IPC 通道名称 */
           channel: `${Prefix}-${K & string}`;
           /** 调用方法 */
           invoke: (...args: Args) => Promise<Awaited<R>>;
           send: (...args: Args) => void;
        }
      : T[K] extends object
        ? BuildExposedApiNested<`${Prefix}-${K & string}`, T[K]>
        : never;
};

/**
 * @description IPC 通道定义类型
 */
type IpcChannelMap<T> = {
   [P in Paths<T>]: {
      channel: P;
      args: FuncArgs<GetFunc<T, P>>;
      return: FuncReturn<GetFunc<T, P>>;
   };
};
