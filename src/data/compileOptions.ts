import type { CompileOptionDef } from '@/types'

export const compileOptionsData: CompileOptionDef[] = [
  // 模块化
  {
    key: 'EXPORT_ES6',
    name: 'Export ES6',
    cmdPrefix: '-s ',
    cmdName: 'EXPORT_ES6',
    valueType: 'boolean',
    defaultValue: false,
    formatType: 'setting',
    jsWasmOnly: true,
    hint: '生成 ES6 模块格式',
    category: '模块化'
  },
  {
    key: 'MODULARIZE',
    name: 'Modularize',
    cmdPrefix: '-s ',
    cmdName: 'MODULARIZE',
    valueType: 'boolean',
    defaultValue: false,
    formatType: 'setting',
    jsWasmOnly: true,
    hint: '将输出包装为可调用函数',
    category: '模块化'
  },
  {
    key: 'EXPORT_NAME',
    name: 'Export Name',
    cmdPrefix: '-s ',
    cmdName: 'EXPORT_NAME',
    valueType: 'string',
    defaultValue: 'Module',
    formatType: 'setting',
    jsWasmOnly: true,
    hasInput: true,
    inputPlaceholder: 'Module',
    hint: '导出的模块名称',
    category: '模块化'
  },
  {
    key: 'SINGLE_FILE',
    name: 'Single File',
    cmdPrefix: '-s ',
    cmdName: 'SINGLE_FILE',
    valueType: 'boolean',
    defaultValue: false,
    formatType: 'setting',
    jsWasmOnly: true,
    hint: '将 WASM 嵌入 JS 文件',
    category: '模块化'
  },

  // WASM 基础
  {
    key: 'WASM',
    name: 'WASM',
    cmdPrefix: '-s ',
    cmdName: 'WASM',
    valueType: 'boolean',
    defaultValue: true,
    formatType: 'setting',
    hint: '生成 WebAssembly 输出',
    category: 'WASM基础'
  },
  {
    key: 'ALLOW_MEMORY_GROWTH',
    name: 'Memory Growth',
    cmdPrefix: '-s ',
    cmdName: 'ALLOW_MEMORY_GROWTH',
    valueType: 'boolean',
    defaultValue: false,
    formatType: 'setting',
    hint: '允许运行时内存增长',
    category: 'WASM基础'
  },
  {
    key: 'EXPORT_ALL',
    name: 'Export All',
    cmdPrefix: '-s ',
    cmdName: 'EXPORT_ALL',
    valueType: 'boolean',
    defaultValue: false,
    formatType: 'setting',
    hint: '导出所有符号',
    category: 'WASM基础'
  },
  {
    key: 'STANDALONE_WASM',
    name: 'Standalone WASM',
    cmdPrefix: '-s ',
    cmdName: 'STANDALONE_WASM',
    valueType: 'boolean',
    defaultValue: false,
    formatType: 'setting',
    hint: '生成独立的 WASM 文件（无 JS）',
    category: 'WASM基础'
  },

  // 纯 WASM
  {
    key: 'SIDE_MODULE',
    name: 'Side Module',
    cmdPrefix: '-s ',
    cmdName: 'SIDE_MODULE',
    valueType: 'boolean',
    defaultValue: false,
    formatType: 'setting',
    hint: '生成可动态加载的侧模块',
    category: '纯WASM'
  },

  // 导出
  {
    key: 'EXPORTED_FUNCTIONS',
    name: 'Exported Functions',
    cmdPrefix: '-s ',
    cmdName: 'EXPORTED_FUNCTIONS',
    valueType: 'string',
    defaultValue: '',
    formatType: 'setting',
    hasInput: true,
    inputPlaceholder: '["_main","_myFunc"]',
    hint: '指定导出的函数列表',
    category: '导出'
  },
  {
    key: 'EXPORTED_RUNTIME_METHODS',
    name: 'Exported Runtime Methods',
    cmdPrefix: '-s ',
    cmdName: 'EXPORTED_RUNTIME_METHODS',
    valueType: 'string',
    defaultValue: '',
    formatType: 'setting',
    hasInput: true,
    inputPlaceholder: '["ccall","cwrap"]',
    hint: '指定导出的运行时方法',
    category: '导出'
  },

  // Embind
  {
    key: 'BIND',
    name: 'Embind (--bind)',
    cmdPrefix: '--',
    cmdName: 'bind',
    valueType: 'boolean',
    defaultValue: false,
    formatType: 'arg',
    jsWasmOnly: true,
    hint: '启用 Embind 绑定支持',
    category: 'Embind'
  },

  // 调试
  {
    key: 'ASSERTIONS',
    name: 'Assertions',
    cmdPrefix: '-s ',
    cmdName: 'ASSERTIONS',
    valueType: 'boolean',
    defaultValue: false,
    formatType: 'setting',
    jsWasmOnly: true,
    hint: '启用运行时断言检查',
    category: '调试'
  },
  {
    key: 'SAFE_HEAP',
    name: 'Safe Heap',
    cmdPrefix: '-s ',
    cmdName: 'SAFE_HEAP',
    valueType: 'boolean',
    defaultValue: false,
    formatType: 'setting',
    hint: '启用堆安全检查',
    category: '调试'
  },
  {
    key: 'STACK_OVERFLOW_CHECK',
    name: 'Stack Overflow Check',
    cmdPrefix: '-s ',
    cmdName: 'STACK_OVERFLOW_CHECK',
    valueType: 'select',
    defaultValue: '0',
    formatType: 'setting',
    selectOptions: [
      { value: '0', label: '禁用' },
      { value: '1', label: '快速检查' },
      { value: '2', label: '完整检查' }
    ],
    hint: '栈溢出检测级别',
    category: '调试'
  },
  {
    key: 'G_SOURCE_MAP',
    name: 'Source Map (-gsource-map)',
    cmdPrefix: '-',
    cmdName: 'gsource-map',
    valueType: 'boolean',
    defaultValue: false,
    formatType: 'arg',
    jsWasmOnly: true,
    hint: '生成 Source Map 调试信息',
    category: '调试'
  },

  // 高级
  {
    key: 'PTHREAD',
    name: 'Pthread (-pthread)',
    cmdPrefix: '-',
    cmdName: 'pthread',
    valueType: 'boolean',
    defaultValue: false,
    formatType: 'arg',
    hint: '启用 pthread 线程支持',
    category: '高级'
  },
  {
    key: 'EXCEPTIONS',
    name: 'Exceptions (-fexceptions)',
    cmdPrefix: '-f',
    cmdName: 'exceptions',
    valueType: 'boolean',
    defaultValue: false,
    formatType: 'arg',
    hint: '启用 C++ 异常处理',
    category: '高级'
  },
  {
    key: 'INITIAL_MEMORY',
    name: 'Initial Memory',
    cmdPrefix: '-s ',
    cmdName: 'INITIAL_MEMORY',
    valueType: 'string',
    defaultValue: '16777216',
    formatType: 'setting',
    hasInput: true,
    inputPlaceholder: '16777216',
    hint: '初始内存大小（字节）',
    category: '高级'
  },
  {
    key: 'MAXIMUM_MEMORY',
    name: 'Maximum Memory',
    cmdPrefix: '-s ',
    cmdName: 'MAXIMUM_MEMORY',
    valueType: 'string',
    defaultValue: '2147483648',
    formatType: 'setting',
    hasInput: true,
    inputPlaceholder: '2147483648',
    hint: '最大内存大小（字节）',
    category: '高级'
  },
  {
    key: 'ENVIRONMENT',
    name: 'Environment',
    cmdPrefix: '-s ',
    cmdName: 'ENVIRONMENT',
    valueType: 'select',
    defaultValue: '',
    formatType: 'setting',
    jsWasmOnly: true,
    selectOptions: [
      { value: '', label: '自动检测' },
      { value: 'web', label: 'Web 浏览器' },
      { value: 'node', label: 'Node.js' },
      { value: 'worker', label: 'Web Worker' }
    ],
    hint: '目标运行环境',
    category: '高级'
  },

  // 输出
  {
    key: 'EMIT_TSD',
    name: 'Emit TSD',
    cmdPrefix: '-s ',
    cmdName: 'EMIT_TSD',
    valueType: 'boolean',
    defaultValue: false,
    formatType: 'setting',
    jsWasmOnly: true,
    hint: '生成 TypeScript 声明文件',
    category: '输出'
  }
]
