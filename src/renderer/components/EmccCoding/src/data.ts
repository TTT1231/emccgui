import type { CompileOption, RuntimeMethodOption, OptionConflict } from './type';

//配置参考地址
export const optionsReferenceURL =
   'https://ttt1231.github.io/Turw-docs/WebAssembly.html#%E9%85%8D%E7%BD%AE%E9%80%9F%E6%9F%A5';

// 编译选项配置 - 集中管理所有选项
export const compileOptionOptions: CompileOption[] = [
   // === 模块化相关 ===
   {
      key: 'exportES6',
      name: 'EXPORT_ES6',
      enabled: true,
      cmdPrefix: '-s',
      cmdName: 'EXPORT_ES6',
      valueType: 'boolean',
      defaultValue: 1,
      formatType: 'flag',
      jsWasmOnly: true,
      hint: '生成 ES6 模块格式(需配合MODULARIZE)',
   },
   {
      key: 'modularize',
      name: 'MODULARIZE',
      enabled: true,
      cmdPrefix: '-s',
      cmdName: 'MODULARIZE',
      valueType: 'boolean',
      defaultValue: 1,
      formatType: 'flag',
      jsWasmOnly: true,
      hint: '将 JS 代码转化工厂函数(转化为异步)',
   },
   {
      key: 'exportName',
      name: 'EXPORT_NAME',
      enabled: true,
      cmdPrefix: '-s',
      cmdName: 'EXPORT_NAME',
      valueType: 'string',
      defaultValue: 'createModule',
      currentValue: 'createModule',
      formatType: 'flag',
      jsWasmOnly: true,
      dependsOn: 'modularize',
      hasInput: true,
      inputLabel: 'EXPORT_NAME',
      inputPlaceholder: 'createModule',
      hint: '指定导出的模块名称（工厂函数名）',
   },
   {
      key: 'singleFile',
      name: 'SINGLE_FILE',
      enabled: false,
      cmdPrefix: '-s',
      cmdName: 'SINGLE_FILE',
      valueType: 'boolean',
      defaultValue: 1,
      formatType: 'flag',
      jsWasmOnly: true,
      hint: '将 WASM 以 Base64 嵌入到 JS 文件中，生成单文件输出',
   },

   // === WASM 相关 ===
   {
      key: 'wasm',
      name: 'WASM',
      enabled: true,
      cmdPrefix: '-s',
      cmdName: 'WASM',
      valueType: 'boolean',
      defaultValue: 1,
      formatType: 'flag',
      hint: '输出 WebAssembly',
   },
   {
      key: 'allowMemoryGrowth',
      name: 'ALLOW_MEMORY_GROWTH',
      enabled: true,
      cmdPrefix: '-s',
      cmdName: 'ALLOW_MEMORY_GROWTH',
      valueType: 'boolean',
      defaultValue: 1,
      formatType: 'flag',
      hint: '(默认16MB)允许 WASM 内存在运行时动态增长扩容',
   },
   {
      key: 'exportAll',
      name: 'EXPORT_ALL',
      enabled: false,
      cmdPrefix: '-s',
      cmdName: 'EXPORT_ALL',
      valueType: 'boolean',
      defaultValue: 1,
      formatType: 'flag',
      hint: '导出所有符号（函数和全局变量）',
   },
   {
      key: 'standaloneWasm',
      name: 'STANDALONE_WASM',
      enabled: false,
      cmdPrefix: '-s',
      cmdName: 'STANDALONE_WASM',
      valueType: 'boolean',
      defaultValue: 1,
      formatType: 'flag',
      jsWasmOnly: true,
      hint: '生成一个尽量独立的 WASM，减少对外部依赖（与 wasm-only 冲突）',
   },

   // === 类型定义 ===
   {
      key: 'emitTsd',
      name: 'emit-tsd',
      enabled: true,
      cmdPrefix: '--',
      cmdName: 'emit-tsd',
      valueType: 'string',
      defaultValue: 'test',
      formatType: 'flag', // 改为 flag 使用等号连接
      jsWasmOnly: true,
      hasInput: true,
      inputLabel: 'TypeScript 定义文件名',
      inputPlaceholder: '[文件名].d.ts',
      hint: '生成类型定义文件 (.d.ts)',
   },
   {
      key: 'SIDE_MODULE',
      name: 'SIDE_MODULE',
      enabled: false,
      cmdPrefix: '-s',
      cmdName: 'SIDE_MODULE',
      valueType: 'boolean',
      defaultValue: 1,
      formatType: 'flag',
      hint: '编译纯wasm模块没有main函数',
   },

   // === 导出函数 ===
   {
      key: 'exportedFunctions',
      name: 'EXPORTED_FUNCTIONS',
      enabled: false,
      cmdPrefix: '-s',
      cmdName: 'EXPORTED_FUNCTIONS',
      valueType: 'string',
      defaultValue: "['_main']",
      currentValue: "['_main']",
      formatType: 'flag',
      hasInput: true,
      inputLabel: '导出函数列表',
      inputPlaceholder: "['_main','_myFunc']",
      hint: '指定要导出的 C/C++ 函数，函数名需加下划线前缀（纯 WASM 模式下也有效）',
   },

   // === bind相关 ===
   {
      key: 'bind',
      name: '--bind',
      enabled: false,
      cmdPrefix: '--',
      cmdName: 'bind',
      valueType: 'boolean',
      formatType: 'arg',
      hint: '启用 Embind，用于 C++ 和 JavaScript 之间的绑定',
   },

   // === 调试相关 ===
   {
      key: 'debug',
      name: '调试级别',
      enabled: false,
      cmdPrefix: '-',
      cmdName: 'g',
      valueType: 'select',
      defaultValue: 'g',
      currentValue: 'g',
      formatType: 'arg',
      selectOptions: [
         { value: 'g', label: '-g (基础调试)' },
         { value: 'g3', label: '-g3 (更详细)' },
         { value: 'g4', label: '-g4 (包含源码)' },
      ],
      hint: '生成调试信息：-g 基础、-g3 更详细、-g4 包含源码',
   },
   {
      key: 'sourceMap',
      name: '-gsource-map',
      enabled: false,
      cmdPrefix: '-',
      cmdName: 'gsource-map',
      valueType: 'boolean',
      formatType: 'arg',
      hint: '生成 Source Map 文件，便于浏览器调试',
   },
   {
      key: 'assertions',
      name: 'ASSERTIONS',
      enabled: false,
      cmdPrefix: '-s',
      cmdName: 'ASSERTIONS',
      valueType: 'select',
      defaultValue: 1,
      currentValue: '1',
      formatType: 'flag',
      selectOptions: [
         { value: '1', label: '=1 (基础断言)' },
         { value: '2', label: '=2 (详细断言)' },
      ],
      hint: '启用运行时断言检查：=1 基础、=2 详细（会增加体积）',
   },

   // === 高级特性 ===
   {
      key: 'pthread',
      name: '-pthread',
      enabled: false,
      cmdPrefix: '-',
      cmdName: 'pthread',
      valueType: 'boolean',
      formatType: 'arg',
      hint: '启用多线程支持（需要 SharedArrayBuffer）',
   },
   {
      key: 'fexceptions',
      name: '-fexceptions',
      enabled: false,
      cmdPrefix: '-',
      cmdName: 'fexceptions',
      valueType: 'boolean',
      formatType: 'arg',
      hint: '启用 C++ 异常处理支持',
   },
];

// 编译运行时方法选项
export const runtimeMethodOptions: RuntimeMethodOption[] = [
   {
      key: 'ccall',
      name: 'ccall',
      enabled: true,
      hint: '直接调用 C 函数，自动处理参数和返回值类型转换',
   },
   {
      key: 'cwrap',
      name: 'cwrap',
      enabled: true,
      hint: '包装 C 函数为可复用的 JavaScript 函数',
   },
   {
      key: 'getValue',
      name: 'getValue',
      enabled: false,
      hint: '从 WASM 内存中读取指定地址的值',
   },
   {
      key: 'setValue',
      name: 'setValue',
      enabled: false,
      hint: '向 WASM 内存中写入值到指定地址',
   },
   {
      key: 'UTF8ToString',
      name: 'UTF8ToString',
      enabled: false,
      hint: 'C字符串指针转JS字符串',
   },
   {
      key: 'stringToUTF8',
      name: 'stringToUTF8',
      enabled: false,
      hint: 'JS字符串转C字符串指针',
   },
];

// 选项冲突规则配置
export const optionConflicts: OptionConflict[] = [
   // SIDE_MODULE 模式下的冲突选项
   {
      triggerKey: 'SIDE_MODULE',
      type: 'side-module',
      conflictsWith: [
         'emitTsd', // TypeScript 定义需要 JS glue
         'exportES6', // ES6 模块需要 JS glue
         'modularize', // 工厂函数需要 JS glue
         'exportName', // 导出名需要 JS glue
         'singleFile', // 单文件需要 JS glue
         'bind', // Embind 需要 JS glue
      ],
      reason: 'SIDE_MODULE 模式只生成纯 WASM 文件，不包含 JavaScript glue 代码',
   },
];

// 优化级别选项
export const optimizationLevels = [
   { value: 'O0', label: '-O0 (默认值，无优化)' },
   { value: 'O1', label: '-O1 (基础优化)' },
   { value: 'O2', label: '-O2 (标准优化)' },
   { value: 'O3', label: '-O3 (最大优化)' },
   { value: 'Os', label: '-Os (体积优化)' },
   { value: 'Oz', label: '-Oz (极限体积优化)' },
];
