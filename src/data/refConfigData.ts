import type { RefConfigData } from '@/types'

// SVG Icons for categories
const icons = {
  modular: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>',
  debug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 12-5 5"/><path d="m12 12 5 5"/><path d="m12 12 5-5"/><path d="m12 12-5-5"/><circle cx="12" cy="12" r="3"/></svg>',
  memory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/><path d="M4 12h4"/><path d="M16 12h4"/></svg>',
  filesystem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  embind: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/><circle cx="12" cy="12" r="4"/></svg>',
  wasm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  advanced: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/></svg>',
  exception: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 7-4 4-4-4"/><path d="M17 11V3"/><path d="M7 21h10"/><path d="M12 17v4"/></svg>',
  codeSize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
  optimization: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  network: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  library: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  runtime: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  other: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6"/><path d="M12 17v6"/><path d="M21 12h-6"/><path d="M7 12H1"/></svg>'
}

export const refConfigData: RefConfigData = {
  categories: [
    {
      name: "输出与模块化",
      icon: icons.modular,
      options: [
        { option: "-o <file>", default: "a.out.js", description: "指定输出文件名", valueType: "string", editable: true },
        { option: "-sMODULARIZE", default: "0", description: "将 JS 代码转化工厂函数(转化为异步)", valueType: "boolean", editable: false },
        { option: "-sEXPORT_ES6", default: "0", description: "生成 ES6 模块格式（需配合MODULARIZE）", valueType: "boolean", editable: false },
        { option: "-sEXPORT_NAME", default: "'Module'", description: "指定导出的模块名称", valueType: "string", editable: true },
        { option: "-sSINGLE_FILE", default: "0", description: "将 wasm 以 base64 内嵌到 JS 文件中", valueType: "boolean", editable: false },
        { option: "--emit-tsd <file>", default: "不生成", description: "生成 TypeScript 类型声明文件，JS生效", valueType: "string", editable: true },
        { option: "-sENVIRONMENT", default: "'web,worker,node'", description: "运行环境(会增加体积)", valueType: "string", editable: true },
        { option: "-sEXPORTED_FUNCTIONS", default: "['_main']", description: "指定导出的 C/C++ 函数（需加 _ 前缀）", valueType: "string", editable: true },
        { option: "-sEXPORTED_RUNTIME_METHODS", default: "[]", description: "导出运行时辅助方法如 ccall, cwrap", valueType: "string", editable: true }
      ]
    },
    {
      name: "调试选项",
      icon: icons.debug,
      options: [
        { option: "-g", default: "关闭", description: "保留调试信息（-g3 更详细，-g4 包含源码）", valueType: "string", editable: true },
        { option: "-gsource-map", default: "关闭", description: "生成 source map", valueType: "boolean", editable: false },
        { option: "-sASSERTIONS", default: "0", description: "启用运行时断言检查（1 基础，2 详细）", valueType: "boolean", editable: false },
        { option: "-sSAFE_HEAP", default: "0", description: "检测内存访问错误（性能开销大）", valueType: "boolean", editable: false },
        { option: "-sSTACK_OVERFLOW_CHECK", default: "0", description: "栈溢出检测", valueType: "boolean", editable: false }
      ]
    },
    {
      name: "内存配置",
      icon: icons.memory,
      options: [
        { option: "-sINITIAL_MEMORY", default: "16777216", description: "初始内存大小（必须是 64KB 的倍数）", valueType: "number", editable: true },
        { option: "-sMAXIMUM_MEMORY", default: "2147483648", description: "最大内存限制", valueType: "number", editable: true },
        { option: "-sALLOW_MEMORY_GROWTH", default: "0", description: "允许内存动态增长", valueType: "boolean", editable: false },
        { option: "-sSTACK_SIZE", default: "65536", description: "设置栈大小", valueType: "number", editable: true },
        { option: "-sTOTAL_STACK", default: "65536", description: "旧版本大小设置", valueType: "number", editable: true }
      ]
    },
    {
      name: "文件系统配置",
      icon: icons.filesystem,
      options: [
        { option: "-sFILESYSTEM", default: "1", description: "启用文件系统支持", valueType: "boolean", editable: false },
        { option: "-sNO_FILESYSTEM", default: "0", description: "禁用文件系统（减小～120KB）", valueType: "boolean", editable: false },
        { option: "-sFORCE_FILESYSTEM", default: "0", description: "强制包含文件系统", valueType: "boolean", editable: false },
        { option: "--preload-file", default: "<path>", description: "预加载文件到虚拟文件系统", valueType: "string", editable: true },
        { option: "--embed-file", default: "<path>", description: "嵌入文件到JS/wasm中", valueType: "string", editable: true }
      ]
    },
    {
      name: "Bind",
      icon: icons.embind,
      options: [
        { option: "--bind", default: "关闭", description: "启用 Embind（C++ 与 JS 绑定）", valueType: "boolean", editable: false },
        { option: "-lembind", default: "关闭", description: "同上，链接 Embind 库", valueType: "boolean", editable: false },
        { option: "-sWASM_BIGINT", default: "0", description: "支持 JS BigInt 与 i64 互操作（需 Node 10.4+）", valueType: "boolean", editable: false }
      ]
    },
    {
      name: "WebAssembly特性",
      icon: icons.wasm,
      options: [
        { option: "-sWASM", default: "1", description: "输出 WebAssembly", valueType: "boolean", editable: false },
        { option: "-sWASM_ASYNC_COMPILATION", default: "1", description: "异步编译 wasm", valueType: "boolean", editable: false },
        { option: "-sSTANDALONE_WASM", default: "0", description: "生成一个尽量独立的 WASM，减少对外部依赖(最小imports)", valueType: "boolean", editable: false },
        { option: "-sIMPORT_MEMORY", default: "0", description: "从外部导入内存", valueType: "boolean", editable: false },
        { option: "-sEXPORT_ALL", default: "0", description: "导出所有函数（调试用）", valueType: "boolean", editable: false }
      ]
    },
    {
      name: "多线程支持",
      icon: icons.advanced,
      options: [
        { option: "-pthread", default: "关闭", description: "启用 Pthreads 多线程", valueType: "boolean", editable: false },
        { option: "-sPTHREAD_POOL_SIZE", default: "0", description: "线程池大小（0 表示按需创建）", valueType: "number", editable: true },
        { option: "-sPROXY_TO_PTHREAD", default: "0", description: "主线程执行在 pthread 中运行", valueType: "boolean", editable: false },
        { option: "-sUSE_PTHREADS", default: "0", description: "同 -pthread", valueType: "boolean", editable: false }
      ]
    },
    {
      name: "异常处理",
      icon: icons.exception,
      options: [
        { option: "-fexceptions", default: "关闭", description: "启用 C++ 异常（Wasm 原生）", valueType: "boolean", editable: false },
        { option: "-sDISABLE_EXCEPTION_CATCHING", default: "1", description: "禁用异常捕获（0 启用 JS 实现）", valueType: "boolean", editable: false },
        { option: "-sEXCEPTION_STACK_TRACES", default: "0", description: "异常时显示栈上跟踪", valueType: "boolean", editable: false }
      ]
    },
    {
      name: "代码体积优化",
      icon: icons.codeSize,
      options: [
        { option: "--closure 1", default: "0", description: "使用 Closure Compiler 压缩 JS（需安装 Java）", valueType: "boolean", editable: false },
        { option: "--closure-args", default: "<args>", description: "传递参数给 Closure", valueType: "string", editable: true },
        { option: "-sIGNORE_MISSING_MAIN", default: "0", description: "无 main 函数也不报错", valueType: "boolean", editable: false },
        { option: "-sMALLOC", default: "dlmalloc", description: "内存分配器（'emmalloc'更小但慢）", valueType: "string", editable: true },
        { option: "-sEVAL_CTORS", default: "0", description: "编译时执行构造函数", valueType: "boolean", editable: false },
        { option: "-sAGGRESSIVE_VARIABLE_ELIMINATION", default: "0", description: "激进的变量消除", valueType: "boolean", editable: false }
      ]
    },
    {
      name: "优化级别",
      icon: icons.optimization,
      options: [
        { option: "-O0", default: "启用", description: "无优化，编译最快", valueType: "boolean", editable: false },
        { option: "-O1", default: "-", description: "基础优化", valueType: "boolean", editable: false },
        { option: "-O2", default: "-", description: "标准优化", valueType: "boolean", editable: false },
        { option: "-O3", default: "-", description: "激进优化", valueType: "boolean", editable: false },
        { option: "-Os", default: "-", description: "优化代码体积", valueType: "boolean", editable: false },
        { option: "-Oz", default: "-", description: "极限压缩代码体积", valueType: "boolean", editable: false }
      ]
    },
    {
      name: "网络与Web API",
      icon: icons.network,
      options: [
        { option: "-sFETCH", default: "0", description: "启用 Fetch API 支持", valueType: "boolean", editable: false },
        { option: "-sWEBSOCKET_URL", default: "<url>", description: "WebSocket 配置", valueType: "string", editable: true },
        { option: "-sPROXY_POSIX_SOCKETS", default: "0", description: "通过 WebSocket 代理 POSIX socket", valueType: "boolean", editable: false },
        { option: "-sWEBGL_VERSION", default: "0", description: "WebGL 版本（1 或 2）", valueType: "number", editable: true }
      ]
    },
    {
      name: "库支持",
      icon: icons.library,
      options: [
        { option: "-sUSE_SDL", default: "0", description: "使用 SDL（2 表示 SDL2）", valueType: "number", editable: true },
        { option: "-sUSE_ZLIB", default: "0", description: "使用 zlib", valueType: "boolean", editable: false },
        { option: "-sUSE_LIBPNG", default: "0", description: "使用 libpng", valueType: "boolean", editable: false },
        { option: "-sUSE_FREETYPE", default: "0", description: "使用 FreeType", valueType: "boolean", editable: false },
        { option: "-sUSE_BOOST_HEADERS", default: "0", description: "使用 Boost 头文件", valueType: "boolean", editable: false }
      ]
    },
    {
      name: "运行时行为",
      icon: icons.runtime,
      options: [
        { option: "-sINVOKE_RUN", default: "1", description: "自动运行 main()", valueType: "boolean", editable: false },
        { option: "-sEXIT_RUNTIME", default: "0", description: "main 结束后清理运行时", valueType: "boolean", editable: false },
        { option: "-sNO_EXIT_RUNTIME", default: "0", description: "禁止运行时退出", valueType: "boolean", editable: false },
        { option: "-sMODULARIZE_INSTANCE", default: "0", description: "导出实例而非工厂函数", valueType: "boolean", editable: false }
      ]
    },
    {
      name: "其他高级选项",
      icon: icons.other,
      options: [
        { option: "-sSTRICT", default: "0", description: "严格模式（检查废弃选项）", valueType: "boolean", editable: false },
        { option: "-sVERBOSE", default: "0", description: "详细输出", valueType: "boolean", editable: false },
        { option: "-sMIN_CHROME_VERSION", default: "0", description: "最低 Chrome 版本", valueType: "number", editable: true },
        { option: "-sMIN_FIREFOX_VERSION", default: "0", description: "最低 Firefox 版本", valueType: "number", editable: true },
        { option: "-sINCOMING_MODULE_JS_API", default: "[]", description: "指定导出的 Module 属性（空=全部）", valueType: "string", editable: true },
        { option: "-sAUTO_JS_LIBRARIES", default: "1", description: "自动链接 JS 库", valueType: "boolean", editable: false },
        { option: "-sLEGACY_VM_SUPPORT", default: "0", description: "支持旧版 VM（iOS 11.2 前）", valueType: "boolean", editable: false }
      ]
    }
  ]
}
