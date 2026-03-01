import type { CompileOptionDef, OptimizationLevelOption } from '@/types'

// 配置参考地址
export const optionsReferenceURL =
  'https://ttt1231.github.io/Turw-docs/WebAssembly.html#%E9%85%8D%E7%BD%AE%E9%80%9F%E6%9F%A5'

export const compileOptionsData: CompileOptionDef[] = [
  // === 模块化相关 ===
  {
    key: 'exportES6',
    name: 'EXPORT_ES6',
    cmdPrefix: '-s',
    cmdName: 'EXPORT_ES6',
    valueType: 'boolean',
    defaultValue: 1,
    formatType: 'flag',
    jsWasmOnly: true,
    defaultEnabled: true,
    hint: '生成 ES6 模块格式(需配合MODULARIZE)',
    category: '模块化'
  },
  {
    key: 'modularize',
    name: 'MODULARIZE',
    cmdPrefix: '-s',
    cmdName: 'MODULARIZE',
    valueType: 'boolean',
    defaultValue: 1,
    formatType: 'flag',
    jsWasmOnly: true,
    defaultEnabled: true,
    hint: '将 JS 代码转化工厂函数(转化为异步)',
    category: '模块化'
  },
  {
    key: 'exportName',
    name: 'EXPORT_NAME',
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
    defaultEnabled: true,
    hint: '指定导出的模块名称（工厂函数名）',
    category: '模块化'
  },
  {
    key: 'singleFile',
    name: 'SINGLE_FILE',
    cmdPrefix: '-s',
    cmdName: 'SINGLE_FILE',
    valueType: 'boolean',
    defaultValue: 1,
    formatType: 'flag',
    jsWasmOnly: true,
    hint: '将 WASM 以 Base64 嵌入到 JS 文件中，生成单文件输出',
    category: '模块化'
  },

  // === WASM 相关 ===
  {
    key: 'wasm',
    name: 'WASM',
    cmdPrefix: '-s',
    cmdName: 'WASM',
    valueType: 'boolean',
    defaultValue: 1,
    formatType: 'flag',
    defaultEnabled: true,
    hint: '输出 WebAssembly',
    category: 'WASM'
  },
  {
    key: 'allowMemoryGrowth',
    name: 'ALLOW_MEMORY_GROWTH',
    cmdPrefix: '-s',
    cmdName: 'ALLOW_MEMORY_GROWTH',
    valueType: 'boolean',
    defaultValue: 1,
    formatType: 'flag',
    defaultEnabled: true,
    hint: '(默认16MB)允许 WASM 内存在运行时动态增长扩容',
    category: 'WASM'
  },
  {
    key: 'exportAll',
    name: 'EXPORT_ALL',
    cmdPrefix: '-s',
    cmdName: 'EXPORT_ALL',
    valueType: 'boolean',
    defaultValue: 1,
    formatType: 'flag',
    hint: '导出所有符号（函数和全局变量）',
    category: 'WASM'
  },
  {
    key: 'standaloneWasm',
    name: 'STANDALONE_WASM',
    cmdPrefix: '-s',
    cmdName: 'STANDALONE_WASM',
    valueType: 'boolean',
    defaultValue: 1,
    formatType: 'flag',
    jsWasmOnly: true,
    hint: '生成一个尽量独立的 WASM，减少对外部依赖（与 wasm-only 冲突）',
    category: 'WASM'
  },

  // === 类型定义 ===
  {
    key: 'emitTsd',
    name: 'emit-tsd',
    cmdPrefix: '--',
    cmdName: 'emit-tsd',
    valueType: 'string',
    defaultValue: 'test',
    formatType: 'flag',
    jsWasmOnly: true,
    hasInput: true,
    inputLabel: 'TypeScript 定义文件名',
    inputPlaceholder: '[文件名].d.ts',
    defaultEnabled: true,
    hint: '生成类型定义文件 (.d.ts)',
    category: '类型定义'
  },
  {
    key: 'SIDE_MODULE',
    name: 'SIDE_MODULE',
    cmdPrefix: '-s',
    cmdName: 'SIDE_MODULE',
    valueType: 'boolean',
    defaultValue: 1,
    formatType: 'flag',
    // 注意：SIDE_MODULE 默认不启用，因为它会与其他选项冲突
    hint: '编译纯wasm模块没有main函数',
    category: '类型定义'
  },

  // === 导出函数 ===
  {
    key: 'exportedFunctions',
    name: 'EXPORTED_FUNCTIONS',
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
    category: '导出'
  },

  // === bind相关 ===
  {
    key: 'bind',
    name: '--bind',
    cmdPrefix: '--',
    cmdName: 'bind',
    valueType: 'boolean',
    formatType: 'arg',
    hint: '启用 Embind，用于 C++ 和 JavaScript 之间的绑定',
    category: '绑定'
  },

  // === 调试相关 ===
  {
    key: 'debug',
    name: '调试级别',
    cmdPrefix: '-',
    cmdName: 'g',
    valueType: 'select',
    defaultValue: 'g',
    currentValue: 'g',
    formatType: 'arg',
    selectOptions: [
      { value: 'g', label: '-g (基础调试)' },
      { value: 'g3', label: '-g3 (更详细)' },
      { value: 'g4', label: '-g4 (包含源码)' }
    ],
    hint: '生成调试信息：-g 基础、-g3 更详细、-g4 包含源码',
    category: '调试'
  },
  {
    key: 'sourceMap',
    name: '-gsource-map',
    cmdPrefix: '-',
    cmdName: 'gsource-map',
    valueType: 'boolean',
    formatType: 'arg',
    hint: '生成 Source Map 文件，便于浏览器调试',
    category: '调试'
  },
  {
    key: 'assertions',
    name: 'ASSERTIONS',
    cmdPrefix: '-s',
    cmdName: 'ASSERTIONS',
    valueType: 'select',
    defaultValue: 1,
    currentValue: '1',
    formatType: 'flag',
    selectOptions: [
      { value: '1', label: '=1 (基础断言)' },
      { value: '2', label: '=2 (详细断言)' }
    ],
    hint: '启用运行时断言检查：=1 基础、=2 详细（会增加体积）',
    category: '调试'
  },

  // === 高级特性 ===
  {
    key: 'pthread',
    name: '-pthread',
    cmdPrefix: '-',
    cmdName: 'pthread',
    valueType: 'boolean',
    formatType: 'arg',
    hint: '启用多线程支持（需要 SharedArrayBuffer）',
    category: '高级'
  },
  {
    key: 'fexceptions',
    name: '-fexceptions',
    cmdPrefix: '-',
    cmdName: 'fexceptions',
    valueType: 'boolean',
    formatType: 'arg',
    hint: '启用 C++ 异常处理支持',
    category: '高级'
  }
]

// 优化级别选项
export const optimizationLevels: OptimizationLevelOption[] = [
  { value: 'O0', label: '-O0 (默认值，无优化)' },
  { value: 'O1', label: '-O1 (基础优化)' },
  { value: 'O2', label: '-O2 (标准优化)' },
  { value: 'O3', label: '-O3 (最大优化)' },
  { value: 'Os', label: '-Os (体积优化)' },
  { value: 'Oz', label: '-Oz (极限体积优化)' }
]
