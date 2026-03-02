import type { RefConfigData } from '@/types'

/**
 * ============================================================================
 * * 参考配置数据 (refConfigData)
 * * ============================================================================
 *
 * * 【作用】这是**Emscripten 完整选项的参考文档库**，供用户浏览和学习
 *
 * * 【数据流】用户在参考面板选择 → state.refSelectedOptions → (待实现) → 合并到命令
 * *                            ↓
 * *                        仅存储选中状态
 *
 * * 【与 compileOptionsData 的关系】
 * *   ┌─────────────────────────────────────────────────────────────────────┐
 * *   │ compileOptionsData             │ refConfigData                                  │
 *   ├─────────────────────────────────────────────────────────────────────┤
 * *   │ 精选高频选项               │ 完整的 Emscripten 选项文档                     │
 * *   │ 约 20-30 个        │ 100+ 个选项，涵盖所有分类                      │
 * *   │ 直接生成命令       │ 目前仅作为参考，选中后需额外处理才能生成命令     │
 * *   │ 提供完整配置       │ 提供 enabledValue 模板，但未连接到命令生成逻辑  │
 * *   └─────────────────────────────────────────────────────────────────────┘
 *
 * * 【enabledValue 字段段说明】
 * *   - 定义：选中该选项后应生成的命令片段模板
 * *   - 当前状态：已定义但未使用
 * *   - 示例："-o <file>" → 选中后生成 "-o myoutput.js"
 *
 * * 【TODO】
 * *   当前 state.refSelectedOptions 中的选中项**不会**自动添加到编译命令中。
 *   需要在 CompileOptions.vue 的 commandLines computed 中处理这些选中项。
 *
 * * ============================================================================
 */

// SVG Icons for categories
const icons = {
  modular: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0-2 2v16a2 2 0 0 2 2h12a2 2 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>',
  debug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 12-5 5"/><path d="m12 12 5 5"/><path d="m12 12 5-5"/><path d="m12 12-5-5"/><circle cx="12" cy="12" r="3"/></svg>',
  memory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/><path d="M4 12h4"/><path d="M16 12h4"/></svg>',
  filesystem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 3h9a2 0 0 1 2 2z"/></svg>',
  embind: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/><circle cx="12" cy="12" r="4"/></svg>',
  wasm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  advanced: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M21 12a9 9 1 1 1-6.219-8.56"/><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/></svg>',
  exception: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 7-4 4-4-4"/><path d="M17 11V3"/><path d="M7 21h10"/><path d="M12 17v4"/></svg>',
  codeSize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 1 1-5.8-1.6"/></svg>',
  optimization: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  network: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  library: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  runtime: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  other: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6"/><path d="M12 17v6"/><path d="M21 12h-6"/><path d="M7 12H1"/></svg>'
}

/**
 * Emscripten 配置选项数据
 *
 * 默认值来源: Emscripten 5.0.3 官方文档
 * https://emscripten.org/docs/tools_reference/settings_reference.html
 *
 * 命令格式说明:
 * - 布尔选项启用: -sOPTION 或 -sOPTION=1
 * - 布尔选项禁用: -sOPTION=0
 * - GCC 标志 (如 -pthread, -fexceptions): 直接使用
 * - 优化级别 (-O0~-Oz): 直接使用
 * - 列表值: -sOPTION=val1,val2 (推荐逗号分隔)
 * - 字符串/数值: -sOPTION=value
 *
 * 数据类型说明:
 * - boolean: 默认值为 "true" 或 "false"（官方文档格式）
 * - number: 数值类型，默认值为数字字符串
 * - string: 字符串类型，默认值为字符串
 */
export const refConfigData: RefConfigData = {
  categories: [
    {
      name: "输出与模块化",
      icon: icons.modular,
      options: [
        {
          option: "-o",
          default: "-",
          description: "指定输出文件名",
          valueType: "string",
          editable: true,
          enabledValue: "-o=\"{value}\""
        },
        {
          option: "-sMODULARIZE",
          default: "false",
          description: "将 JS 代码转化为工厂函数，返回 Promise",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sMODULARIZE"
        },
        {
          option: "-sEXPORT_ES6",
          default: "false",
          description: "生成 ES6 模块格式（需配合 MODULARIZE）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sEXPORT_ES6"
        },
        {
          option: "-sEXPORT_NAME",
          default: "Module",
          description: "指定导出的模块名称",
          valueType: "string",
          editable: true,
          enabledValue: "-sEXPORT_NAME=\"{value}\""
        },
        {
          option: "-sSINGLE_FILE",
          default: "false",
          description: "将 wasm 以 base64 内嵌到 JS 文件中",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sSINGLE_FILE"
        },
        {
          option: "--emit-tsd",
          default: "''",
          description: "生成 TypeScript 类型声明文件，参数为输出DTS文件名",
          valueType: "string",
          editable: true,
          enabledValue: "--emit-tsd=\"{value}\""
        },
        {
          option: "-sENVIRONMENT",
          default: "web,webview,worker,node",
          description: "目标运行环境（多个用逗号分隔）",
          valueType: "string",
          editable: true,
          enabledValue: "-sENVIRONMENT=\"{value}\""
        },
        {
          option: "-sEXPORTED_FUNCTIONS",
          default: "[]",
          description: "指定导出的 C/C++ 函数（需加 _ 前缀，如 _main）",
          valueType: "string-array",
          editable: true,
          enabledValue: "-sEXPORTED_FUNCTIONS=\"{value}\""
        },
        {
          option: "-sEXPORTED_RUNTIME_METHODS",
          default: "[]",
          description: "导出运行时辅助方法（如 ccall, cwrap）",
          valueType: "string-array",
          editable: true,
          enabledValue: "-sEXPORTED_RUNTIME_METHODS=\"{value}\""
        }
      ]
    },
    {
      name: "调试选项",
      icon: icons.debug,
      options: [
        {
          option: "-g",
          default: "关闭",
          description: "保留调试信息（-g1 保留空白，-g2 保留函数名，-g3 保留 DWARF，-g4 包含源码）",
          valueType: "string",
          editable: true,
          enabledValue: "-g{value}",
          initialValue: "3"
        },
        {
          option: "-gsource-map",
          default: "false",
          description: "生成 source map",
          valueType: "boolean",
          editable: false,
          enabledValue: "-gsource-map"
        },
        {
          option: "-sASSERTIONS",
          default: "1",
          description: "启用运行时断言检查（0 关闭，1 基础，2 详细，默认值根据优化级别自动调整，-O0默认为1，其他默认为0）",
          valueType: "number",
          editable: true,
          enabledValue: "-sASSERTIONS={value}",
          dynamicDefault: (optimizationLevel: string) => optimizationLevel === 'O0' ? '1' : '0'
        },
        {
          option: "-sSAFE_HEAP",
          default: "0",
          description: "检测内存访问错误（0 关闭，1 启用，2 更详细，性能开销大）",
          valueType: "number",
          editable: true,
          enabledValue: "-sSAFE_HEAP={value}",
          initialValue: "1"

        },
        {
          option: "-sSTACK_OVERFLOW_CHECK",
          default: "0",
          description: "栈溢出检测（0 关闭，1 启用，2 更严格，ASSERTIONS=1 时默认为 1）",
          valueType: "number",
          editable: true,
          enabledValue: "-sSTACK_OVERFLOW_CHECK={value}",
          initialValue:"1"

        }
      ]
    },
    {
      name: "内存配置",
      icon: icons.memory,
      options: [
        {
          option: "-sINITIAL_MEMORY",
          default: "-1",
          description: "初始内存大小（-1 自动计算，否则必须是 64KB 的倍数）",
          valueType: "number",
          editable: true,
          enabledValue: "-sINITIAL_MEMORY={value}"
        },
        {
          option: "-sMAXIMUM_MEMORY",
          default: "2147483648",
          description: "最大内存限制（需配合 ALLOW_MEMORY_GROWTH），默认2GB，单位字节",
          valueType: "number",
          editable: true,
          enabledValue: "-sMAXIMUM_MEMORY={value}"
        },
        {
          option: "-sALLOW_MEMORY_GROWTH",
          default: "false",
          description: "允许内存动态增长",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sALLOW_MEMORY_GROWTH"
        },
        {
          option: "-sSTACK_SIZE",
          default: "65536",
          description: "设置栈大小（64KB）",
          valueType: "number",
          editable: true,
          enabledValue: "-sSTACK_SIZE={value}"
        }
      ]
    },
    {
      name: "文件系统配置",
      icon: icons.filesystem,
      options: [
        {
          option: "-sFILESYSTEM",
          default: "1",
          description: "文件系统支持（0 禁用，1 启用。不加该命令时，编译器自动根据代码进行优化因此默认值会发生变化除非显示指定。）",
          valueType: "number",
          editable: true,
          enabledValue: "-sFILESYSTEM={value}",
        },
        {
          option: "-sFORCE_FILESYSTEM",
          default: "0",
          description: "强制包含文件系统（0 关闭，1 强制包含）",
          valueType: "number",
          editable: true,
          enabledValue: "-sFORCE_FILESYSTEM={value}",
          initialValue:"1"

        },
        {
          option: "--preload-file",
          default: "''",
          description: "预加载文件到虚拟文件系统（生成 .data 文件）",
          valueType: "string",
          editable: true,
          enabledValue: "--preload-file=\"{value}\""
        },
        {
          option: "--embed-file",
          default: "''",
          description: "嵌入文件到 JS/wasm 中（不生成额外文件）",
          valueType: "string",
          editable: true,
          enabledValue: "--embed-file=\"{value}\""
        }
      ]
    },
    {
      name: "Embind",
      icon: icons.embind,
      options: [
        {
          option: "-lembind",
          default: "false",
          description: "链接 Embind 库（C++ 与 JS 绑定）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-lembind"
        },
        {
          option: "-sWASM_BIGINT",
          default: "1",
          description: "支持 JS BigInt 与 i64 互操作（0 禁用，1 启用）",
          valueType: "number",
          editable: true,
          enabledValue: "-sWASM_BIGINT={value}",

        }
      ]
    },
    {
      name: "WebAssembly 特性",
      icon: icons.wasm,
      options: [
        {
          option: "-sWASM",
          default: "1",
          description: "输出 WebAssembly（0 输出 asm.js，1 输出 wasm）",
          valueType: "number",
          editable: true,
          enabledValue: "-sWASM={value}"
        },
        {
          option: "-sWASM_ASYNC_COMPILATION",
          default: "1",
          description: "异步编译 wasm（0 同步，1 异步）",
          valueType: "number",
          editable: true,
          enabledValue: "-sWASM_ASYNC_COMPILATION={value}"
        },
        {
          option: "-sSTANDALONE_WASM",
          default: "false",
          description: "生成独立的 WASM 文件（最小化 JS 依赖）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sSTANDALONE_WASM"
        },
        {
          option: "-sIMPORT_MEMORY",
          default: "false",
          description: "从外部导入内存",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sIMPORT_MEMORY"
        },
        {
          option: "-sEXPORT_ALL",
          default: "false",
          description: "导出所有符号到 Module 对象（调试用）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sEXPORT_ALL"
        }
      ]
    },
    {
      name: "多线程支持",
      icon: icons.advanced,
      options: [
        {
          option: "-pthread",
          default: "false",
          description: "启用 Pthreads 多线程（GCC 标准标志）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-pthread"
        },
        {
          option: "-sPTHREAD_POOL_SIZE",
          default: "0",
          description: "线程池大小（0 表示按需创建）",
          valueType: "number",
          editable: true,
          enabledValue: "-sPTHREAD_POOL_SIZE={value}"
        },
        {
          option: "-sPROXY_TO_PTHREAD",
          default: "false",
          description: "在 pthread 中运行 main()",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sPROXY_TO_PTHREAD"
        }
      ]
    },
    {
      name: "异常处理",
      icon: icons.exception,
      options: [
        {
          option: "-fexceptions",
          default: "false",
          description: "启用 C++ 异常（Wasm 原生异常处理）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-fexceptions"
        },
        {
          option: "-sDISABLE_EXCEPTION_CATCHING",
          default: "1",
          description: "禁用异常捕获控制（0 启用 JS 模拟，1 禁用，默认 1）",
          valueType: "number",
          editable: true,
          enabledValue: "-sDISABLE_EXCEPTION_CATCHING={value}",
          initialValue:"1"
        },
        {
          option: "-sEXCEPTION_STACK_TRACES",
          default: "false",
          description: "异常时显示堆栈跟踪（ASSERTIONS=1 时默认为 true）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sEXCEPTION_STACK_TRACES"
        }
      ]
    },
    {
      name: "代码体积优化",
      icon: icons.codeSize,
      options: [
        {
          option: "--closure",
          default: "0",
          description: "使用 Closure Compiler 压缩 JS（0 关闭，1 压缩支持代码，2 压缩全部）",
          valueType: "number",
          editable: true,
          enabledValue: "--closure {value}"
        },
        {
          option: "--closure-args",
          default: "''",
          description: "传递参数给 Closure Compiler",
          valueType: "string",
          editable: true,
          enabledValue: "--closure-args=\"{value}\""
        },
        {
          option: "-sIGNORE_MISSING_MAIN",
          default: "1",
          description: "无 main 函数时不报错（默认 1，显式禁用传 0）",
          valueType: "number",
          editable: true,
          enabledValue: "-sIGNORE_MISSING_MAIN={value}",
          initialValue: "1"
        },
        {
          option: "-sMALLOC",
          default: "dlmalloc",
          description: "内存分配器（dlmalloc 默认，emmalloc 更小但慢，mimalloc 多线程更好）",
          valueType: "string",
          editable: true,
          enabledValue: "-sMALLOC=\"{value}\""
        },
        {
          option: "-sEVAL_CTORS",
          default: "false",
          description: "编译时执行构造函数（减少运行时开销）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sEVAL_CTORS"
        },
        {
          option: "-sAGGRESSIVE_VARIABLE_ELIMINATION",
          default: "false",
          description: "激进的变量消除",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sAGGRESSIVE_VARIABLE_ELIMINATION"
        }
      ]
    },
    {
      name: "优化级别",
      icon: icons.optimization,
      options: [
        {
          option: "-O0",
          default: "true",
          description: "无优化，编译最快，包含断言（默认启用）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-O0",
          radioGroup: "optimization"
        },
        {
          option: "-O1",
          default: "false",
          description: "基础优化",
          valueType: "boolean",
          editable: false,
          enabledValue: "-O1",
          radioGroup: "optimization"
        },
        {
          option: "-O2",
          default: "false",
          description: "标准优化（推荐用于发布）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-O2",
          radioGroup: "optimization"
        },
        {
          option: "-O3",
          default: "false",
          description: "激进优化（可能增加代码体积）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-O3",
          radioGroup: "optimization"
        },
        {
          option: "-Os",
          default: "false",
          description: "优化代码体积",
          valueType: "boolean",
          editable: false,
          enabledValue: "-Os",
          radioGroup: "optimization"
        },
        {
          option: "-Oz",
          default: "false",
          description: "极限压缩代码体积",
          valueType: "boolean",
          editable: false,
          enabledValue: "-Oz",
          radioGroup: "optimization"
        }
      ]
    },
    {
      name: "网络与 Web API",
      icon: icons.network,
      options: [
        {
          option: "-sFETCH",
          default: "false",
          description: "启用 Fetch API 支持",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sFETCH"
        },
        {
          option: "-sWEBSOCKET_URL",
          default: "ws://",
          description: "WebSocket 连接 URL",
          valueType: "string",
          editable: true,
          enabledValue: "-sWEBSOCKET_URL=\"{value}\""
        },
        {
          option: "-sPROXY_POSIX_SOCKETS",
          default: "false",
          description: "通过 WebSocket 代理 POSIX socket",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sPROXY_POSIX_SOCKETS"
        }
      ]
    },
    {
      name: "库支持",
      icon: icons.library,
      options: [
        {
          option: "-sUSE_SDL",
          default: "0",
          description: "使用 SDL（2 表示 SDL2）",
          valueType: "number",
          editable: true,
          enabledValue: "-sUSE_SDL={value}",
          initialValue: "2"
        },
        {
          option: "-sUSE_ZLIB",
          default: "false",
          description: "使用 zlib",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sUSE_ZLIB"
        },
        {
          option: "-sUSE_LIBPNG",
          default: "false",
          description: "使用 libpng",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sUSE_LIBPNG"
        },
        {
          option: "-sUSE_FREETYPE",
          default: "false",
          description: "使用 FreeType",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sUSE_FREETYPE"
        },
        {
          option: "-sUSE_BOOST_HEADERS",
          default: "false",
          description: "使用 Boost 头文件",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sUSE_BOOST_HEADERS"
        }
      ]
    },
    {
      name: "运行时行为",
      icon: icons.runtime,
      options: [
        {
          option: "-sINVOKE_RUN",
          default: "true",
          description: "自动运行 main()",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sINVOKE_RUN"
        },
        {
          option: "-sEXIT_RUNTIME",
          default: "false",
          description: "main 结束后清理运行时（调用 atexit 等）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sEXIT_RUNTIME"
        },
        {
          option: "-sNO_EXIT_RUNTIME",
          default: "false",
          description: "禁止运行时退出（保持运行时活跃）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sNO_EXIT_RUNTIME"
        },
        {
          option: "-sMODULARIZE_INSTANCE",
          default: "false",
          description: "导出实例而非工厂函数（配合 MODULARIZE）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sMODULARIZE_INSTANCE"
        }
      ]
    },
    {
      name: "其他高级选项",
      icon: icons.other,
      options: [
        {
          option: "-sSTRICT",
          default: "false",
          description: "严格模式（检查废弃选项，向前兼容）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sSTRICT"
        },
        {
          option: "-sVERBOSE",
          default: "false",
          description: "详细输出编译过程",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sVERBOSE"
        },
        {
          option: "-sMIN_CHROME_VERSION",
          default: "85",
          description: "最低 Chrome 版本（85 = 2020-08 发布）",
          valueType: "number",
          editable: true,
          enabledValue: "-sMIN_CHROME_VERSION={value}"
        },
        {
          option: "-sMIN_FIREFOX_VERSION",
          default: "79",
          description: "最低 Firefox 版本（79 = 2020-07 发布）",
          valueType: "number",
          editable: true,
          enabledValue: "-sMIN_FIREFOX_VERSION={value}"
        },
        {
          option: "-sINCOMING_MODULE_JS_API",
          default: "[]",
          description: "指定导入的 Module 属性（空表示不使用任何Module属性）",
          valueType: "string-array",
          editable: true,
enabledValue: "-sINCOMING_MODULE_JS_API=\"{value}\""
        },
        {
          option: "-sAUTO_JS_LIBRARIES",
          default: "true",
          description: "自动链接 JS 库",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sAUTO_JS_LIBRARIES"
        },
        {
          option: "-sLEGACY_VM_SUPPORT",
          default: "false",
          description: "支持旧版 VM（iOS 11.2 之前）",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sLEGACY_VM_SUPPORT"
        }
      ]
    }
  ]
}
