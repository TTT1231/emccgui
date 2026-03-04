import type { CompileOptionDef, OptimizationLevelOption } from '@/types'

/**
 * ============================================================================
 * 编译选项数据 (compileOptionsData)
 * ============================================================================
 *
 * 【作用】这是**实际用于生成编译命令**的选项配置
 *
 * 【数据流】compileOptionsData → state.compileOptions → commandLines → 最终命令
 *          ↓                    ↓
 *      用户在这里配置       生成编译命令
 *
 * 【与 refConfigData 的关系】
 *   - compileOptionsData: 精选的、高频使用的编译选项（本应用直接支持的）
 *   - refConfigData: 完整的 Emscripten 选项参考文档（供查阅和学习）
 *
 *   例如：
 *   - compileOptionsData 有 MODULARIZE 的完整配置，可以直接开关并生成命令
 *   - refConfigData 有所有 Emscripten 选项的文档说明，但选中后需要额外处理
 *
 * 【建议】
 *   - 常用选项应添加到 compileOptionsData（提供更好的 UX）
 *   - refConfigData 作为完整文档库，供用户查阅和选择
 *
 * ============================================================================
 */

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
    enabledValue: '-sEXPORT_ES6',
    hint: 'Generate ES6 module format (requires MODULARIZE)',
    hintKey: 'exportES6',
    category: '模块化',
    categoryKey: 'modular'
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
    enabledValue: '-sMODULARIZE',
    hint: 'Convert JS code to factory function (becomes async)',
    hintKey: 'modularize',
    category: '模块化',
    categoryKey: 'modular'
  },
  {
    key: 'exportName',
    name: 'EXPORT_NAME',
    cmdPrefix: '-s',
    cmdName: 'EXPORT_NAME',
    valueType: 'string',
    defaultValue: 'Module',
    currentValue: 'Module',
    formatType: 'flag',
    jsWasmOnly: true,
    dependsOn: 'modularize',
    hasInput: true,
    inputLabel: 'EXPORT_NAME',
    inputLabelZh: '导出名称',
    inputPlaceholder: 'Module',
    defaultEnabled: true,
    enabledValue: '-sEXPORT_NAME="{value}"',
    hint: 'Specify exported module name (factory function name)',
    hintKey: 'exportName',
    category: '模块化',
    categoryKey: 'modular'
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
    enabledValue: '-sSINGLE_FILE',
    hint: 'Embed WASM as Base64 into JS file for single-file output',
    hintKey: 'singleFile',
    category: '模块化',
    categoryKey: 'modular'
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
    enabledValue: '-sWASM',
    hint: 'Output WebAssembly',
    hintKey: 'wasm',
    category: 'WASM',
    categoryKey: 'wasm'
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
    enabledValue: '-sALLOW_MEMORY_GROWTH',
    hint: '(Default 16MB) Allow WASM memory to grow dynamically at runtime',
    hintKey: 'allowMemoryGrowth',
    category: 'WASM',
    categoryKey: 'wasm'
  },
  {
    key: 'exportAll',
    name: 'EXPORT_ALL',
    cmdPrefix: '-s',
    cmdName: 'EXPORT_ALL',
    valueType: 'boolean',
    defaultValue: 1,
    formatType: 'flag',
    enabledValue: '-sEXPORT_ALL',
    hint: 'Export all symbols (functions and global variables)',
    hintKey: 'exportAll',
    category: 'WASM',
    categoryKey: 'wasm'
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
    enabledValue: '-sSTANDALONE_WASM',
    hint: 'Generate standalone WASM with minimal external dependencies (conflicts with wasm-only)',
    hintKey: 'standaloneWasm',
    category: 'WASM',
    categoryKey: 'wasm'
  },

  // === 类型定义 ===
  {
    key: 'emitTsd',
    name: 'emit-tsd',
    cmdPrefix: '--',
    cmdName: 'emit-tsd',
    valueType: 'string',
    defaultValue: 'hello.d.ts',
    formatType: 'flag',
    jsWasmOnly: true,
    hasInput: true,
    inputLabel: 'TypeScript Definition Filename',
    inputLabelZh: 'TypeScript 类型定义文件名',
    inputPlaceholder: '[filename].d.ts',
    defaultEnabled: true,
    enabledValue: '--emit-tsd="{value}"',
    hint: 'Generate TypeScript definition file (.d.ts)',
    hintKey: 'emitTsd',
    category: '类型定义',
    categoryKey: 'typeDefinition'
  },
  {
    key: 'SIDE_MODULE',
    name: 'SIDE_MODULE',
    cmdPrefix: '-s',
    cmdName: 'SIDE_MODULE',
    valueType: 'boolean',
    defaultValue: 1,
    formatType: 'flag',
    enabledValue: '-sSIDE_MODULE',
    hint: 'Compile pure WASM module without main function',
    hintKey: 'sideModule',
    category: '类型定义',
    categoryKey: 'typeDefinition'
  },

  // === 导出函数 ===
  {
    key: 'exportedFunctions',
    name: 'EXPORTED_FUNCTIONS',
    cmdPrefix: '-s',
    cmdName: 'EXPORTED_FUNCTIONS',
    valueType: 'string',
    defaultValue: '_main',
    currentValue: '_main',
    formatType: 'flag',
    hasInput: true,
    inputLabel: 'Exported Functions List',
    inputLabelZh: '导出函数列表',
    inputPlaceholder: '_main,_myFunc,_anotherFunc',
    enabledValue: '-sEXPORTED_FUNCTIONS="{value}"',
    hint: 'Specify C/C++ functions to export (comma-separated, prefix function names with underscore)',
    hintKey: 'exportedFunctions',
    category: '导出',
    categoryKey: 'export'
  },

  // === bind相关 ===
  {
    key: 'bind',
    name: '--bind',
    cmdPrefix: '--',
    cmdName: 'bind',
    valueType: 'boolean',
    formatType: 'arg',
    enabledValue: '--bind',
    hint: 'Enable Embind for C++ and JavaScript bindings',
    hintKey: 'bind',
    category: '绑定',
    categoryKey: 'binding'
  },

  // === 调试相关 ===
  {
    key: 'debug',
    name: 'Debug Level',
    cmdPrefix: '-',
    cmdName: 'g',
    valueType: 'select',
    defaultValue: '3',
    currentValue: '3',
    formatType: 'arg',
    selectOptions: [
      { value: '1', label: '-g1 (Preserve whitespace)' },
      { value: '2', label: '-g2 (Preserve function names)' },
      { value: '3', label: '-g3 (Preserve DWARF)' },
      { value: '4', label: '-g4 (Include source code)' }
    ],
    enabledValue: '-g{value}',
    hint: 'Generate debug info: -g1 preserve whitespace, -g2 preserve function names, -g3 preserve DWARF, -g4 include source code',
    hintKey: 'debug',
    category: '调试',
    categoryKey: 'debug'
  },
  {
    key: 'sourceMap',
    name: '-gsource-map',
    cmdPrefix: '-',
    cmdName: 'gsource-map',
    valueType: 'boolean',
    formatType: 'arg',
    enabledValue: '-gsource-map',
    hint: 'Generate Source Map file for browser debugging',
    hintKey: 'sourceMap',
    category: '调试',
    categoryKey: 'debug'
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
      { value: '1', label: '=1 (Basic assertions)' },
      { value: '2', label: '=2 (Detailed assertions)' }
    ],
    enabledValue: '-sASSERTIONS={value}',
    hint: 'Enable runtime assertion checks: =1 basic, =2 detailed (increases size)',
    hintKey: 'assertions',
    category: '调试',
    categoryKey: 'debug'
  },

  // === 高级特性 ===
  {
    key: 'pthread',
    name: '-pthread',
    cmdPrefix: '-',
    cmdName: 'pthread',
    valueType: 'boolean',
    formatType: 'arg',
    enabledValue: '-pthread',
    hint: 'Enable multi-threading support (requires SharedArrayBuffer)',
    hintKey: 'pthread',
    category: '高级',
    categoryKey: 'advanced'
  },
  {
    key: 'fexceptions',
    name: '-fexceptions',
    cmdPrefix: '-',
    cmdName: 'fexceptions',
    valueType: 'boolean',
    formatType: 'arg',
    enabledValue: '-fexceptions',
    hint: 'Enable C++ exception handling support',
    hintKey: 'fexceptions',
    category: '高级',
    categoryKey: 'advanced'
  }
]

// Optimization level options
export const optimizationLevels: OptimizationLevelOption[] = [
  { value: 'O0', label: '-O0 (Default, no optimization)', labelKey: 'O0' },
  { value: 'O1', label: '-O1 (Basic optimization)', labelKey: 'O1' },
  { value: 'O2', label: '-O2 (Standard optimization)', labelKey: 'O2' },
  { value: 'O3', label: '-O3 (Maximum optimization)', labelKey: 'O3' },
  { value: 'Os', label: '-Os (Size optimization)', labelKey: 'Os' },
  { value: 'Oz', label: '-Oz (Extreme size optimization)', labelKey: 'Oz' }
]
