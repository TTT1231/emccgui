export default {
  // Navigation
  nav: {
    file: '文件',
    compile: '编译',
    reference: '参考',
  },

  // Header
  header: {
    resetTooltip: '重置所有状态',
    resetBtn: '重置',
    themeTooltip: '切换主题',
  },

  // File Selector
  fileSelector: {
    dropReplace: '释放以替换文件',
    dropOpen: '释放以打开文件',
    dropHint: '支持常用 WebAssembly 语言',
    dragOrClick: '拖拽文件到此处，或 {click}',
    clickToSelect: '点击选择',
    supportedLangs: '支持常用 WebAssembly 语言 · C/C++/Rust/Go/Java/Python/C#, etc.',
    step1: '选择 WebAssembly 源文件',
    step2: '在"编译"标签页配置选项',
    step3: '复制并执行 emcc 命令',
    unsavedChanges: '未保存更改',
    lines: '行',
    save: '保存',
    saved: '已保存',
    saveTooltip: '保存文件 (Ctrl+S)',
    reselectTooltip: '重新选择文件',
    removeTooltip: '移除文件',
    outputLabel: '输出文件名',
    outputPlaceholder: 'hello',
  },

  // Compile Options
  compile: {
    cardTitle: '常用编译选项',
    optionsCount: '{enabled}/{total}',
    optimizationLevel: '优化级别',
    copyTooltip: '复制命令',
    copySuccess: '✓ 命令已复制到剪贴板',
    copyFailed: '✕ 复制失败，请手动复制',
    addCommand: '添加命令',
    undoTooltip: '撤销上一步 (Ctrl+Z)',
    runtimeMethods: '导出运行时方法',
    methodPlaceholder: '输入方法名，如 UTF8ToString',
    removeMethod: '移除',
    copyCommand: '复制命令',
    pureWasmWarning: '纯 WASM 模式不会生成 JS 胶水代码，此方法无效',
  },

  // Search Button
  search: {
    placeholder: '输入 @ 搜索选项，或直接输入命令',
    optionsCount: '个选项',
    selectHint: '↑↓ 选择 Enter 确认',
    none: '无',
    addBtn: '添加',
    invalidCommand: '无效命令：emcc 命令必须以 - 开头（如 -sFLAG, --option）',
    duplicateCommand: '该命令已存在于当前编译命令中，无需重复添加',
  },

  // Reference
  reference: {
    all: '全部',
    selected: '已选 ({count})',
    searchPlaceholder: '搜索选项...',
    noResults: '未找到匹配的选项',
    optionsCount: '{count} 个选项',
    // Table headers
    command: '命令',
    description: '描述',
    type: '类型',
    default: '默认值',
    current: '当前值',
    // Option row
    enabled: '已启用',
    doubleClickToInput: '双击输入',
    doubleClickToEdit: '双击编辑',
    clickToDisable: '点击禁用此选项',
    enabledInCompile: '编译面板已启用',
  },

  // Categories (used in reference panel and compile options)
  categories: {
    modular: '模块化',
    memory: '内存',
    runtime: '运行时',
    output: '输出',
    optimization: '优化',
    debug: '调试',
    environment: '环境',
    filesystem: '文件系统',
    networking: '网络',
    web: 'Web',
    advanced: '高级',
    wasm: 'WebAssembly',
    typeDefinition: '类型定义',
    export: '导出',
    binding: '绑定',
  },

  // Hints (used in compile options)
  hints: {
    exportES6: '生成 ES6 模块格式（需要 MODULARIZE）',
    modularize: '将 JS 代码转换为工厂函数（变为异步）',
    exportName: '指定导出的模块名称（工厂函数名称）',
    singleFile: '将 WASM 作为 Base64 嵌入到 JS 文件中，生成单文件输出',
    wasm: '输出 WebAssembly',
    allowMemoryGrowth: '（默认 16MB）允许 WASM 内存运行时动态增长',
    exportAll: '导出所有符号（函数和全局变量）',
    standaloneWasm: '生成独立的 WASM，具有最少的外部依赖（与 wasm-only 冲突）',
    emitTsd: '生成 TypeScript 定义文件（.d.ts）',
    sideModule: '编译纯 WASM 模块，无 main 函数',
    exportedFunctions: '指定要导出的 C/C++ 函数（逗号分隔，函数名前加下划线）',
    bind: '启用 Embind 支持 C++ 和 JavaScript 绑定',
    debug: '生成调试信息：-g1 保留空白，-g2 保留函数名，-g3 保留 DWARF，-g4 包含源代码',
    sourceMap: '生成 Source Map 文件用于浏览器调试',
    assertions: '启用运行时断言检查：=1 基本，=2 详细（会增加体积）',
    pthread: '启用多线程支持（需要 SharedArrayBuffer）',
    fexceptions: '启用 C++ 异常处理支持',
  },

  // Optimization levels
  optimization: {
    O0: '-O0（默认，无优化）',
    O1: '-O1（基础优化）',
    O2: '-O2（标准优化）',
    O3: '-O3（最大优化）',
    Os: '-Os（体积优化）',
    Oz: '-Oz（极限体积优化）',
  },
}
