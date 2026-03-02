import type { RefConfigData } from '@/types'

/**
 * ============================================================================
 * * Reference Configuration Data (refConfigData)
 * * ============================================================================
 *
 * * [Purpose] This is the **Emscripten complete options reference library** for users to browse and learn
 *
 * * [Data Flow] User selects in reference panel → state.refSelectedOptions → (pending implementation) → merge into command
 * *                            ↓
 * *                        Only stores selection state
 *
 * * [Relationship with compileOptionsData]
 * *   ┌─────────────────────────────────────────────────────────────────────┐
 * *   │ compileOptionsData             │ refConfigData                                  │
 *   ├─────────────────────────────────────────────────────────────────────┤
 * *   │ Curated high-frequency options │ Complete Emscripten options documentation      │
 * *   │ About 20-30 options             │ 100+ options, covering all categories         │
 * *   │ Directly generates commands     │ Currently reference only, requires additional processing to generate commands │
 * *   │ Provides complete configuration │ Provides enabledValue template, but not connected to command generation logic │
 * *   └─────────────────────────────────────────────────────────────────────┘
 *
 * * [enabledValue Field Description]
 * *   - Definition: Command fragment template to generate when option is selected
 * *   - Current Status: Defined but not used
 * *   - Example: "-o <file>" → generates "-o myoutput.js" when selected
 *
 * * [TODO]
 * *   Currently selected items in state.refSelectedOptions are **not** automatically added to the compile command.
 *   Need to handle these selections in CompileOptions.vue's commandLines computed property.
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
 * Emscripten Configuration Options Data
 *
 * Default values source: Emscripten 5.0.3 official documentation
 * https://emscripten.org/docs/tools_reference/settings_reference.html
 *
 * Command format description:
 * - Boolean option enabled: -sOPTION or -sOPTION=1
 * - Boolean option disabled: -sOPTION=0
 * - GCC flags (e.g., -pthread, -fexceptions): use directly
 * - Optimization levels (-O0~-Oz): use directly
 * - List values: -sOPTION=val1,val2 (comma-separated recommended)
 * - String/number: -sOPTION=value
 *
 * Data type description:
 * - boolean: default value is "true" or "false" (official documentation format)
 * - number: numeric type, default value is numeric string
 * - string: string type, default value is string
 */
export const refConfigData: RefConfigData = {
  categories: [
    {
      name: "Output & Modularization",
      icon: icons.modular,
      options: [
        {
          option: "-o",
          default: "-",
          description: "Specify output file name",
          valueType: "string",
          editable: true,
          enabledValue: "-o=\"{value}\""
        },
        {
          option: "-sMODULARIZE",
          default: "false",
          description: "Convert JS code to factory function, returns Promise",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sMODULARIZE"
        },
        {
          option: "-sEXPORT_ES6",
          default: "false",
          description: "Generate ES6 module format (requires MODULARIZE)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sEXPORT_ES6"
        },
        {
          option: "-sEXPORT_NAME",
          default: "Module",
          description: "Specify exported module name",
          valueType: "string",
          editable: true,
          enabledValue: "-sEXPORT_NAME=\"{value}\""
        },
        {
          option: "-sSINGLE_FILE",
          default: "false",
          description: "Embed wasm as base64 into JS file",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sSINGLE_FILE"
        },
        {
          option: "--emit-tsd",
          default: "''",
          description: "Generate TypeScript declaration file, parameter is output DTS file name",
          valueType: "string",
          editable: true,
          enabledValue: "--emit-tsd=\"{value}\""
        },
        {
          option: "-sENVIRONMENT",
          default: "web,webview,worker,node",
          description: "Target runtime environment (comma-separated for multiple)",
          valueType: "string",
          editable: true,
          enabledValue: "-sENVIRONMENT=\"{value}\""
        },
        {
          option: "-sEXPORTED_FUNCTIONS",
          default: "_main",
          description: "Specify exported C/C++ functions (comma-separated, requires _ prefix, e.g., _main,_hello)",
          valueType: "string-array",
          editable: true,
          enabledValue: "-sEXPORTED_FUNCTIONS=\"{value}\""
        },
        {
          option: "-sEXPORTED_RUNTIME_METHODS",
          default: "ccall,cwrap",
          description: "Export runtime helper methods (comma-separated, e.g., ccall,cwrap)",
          valueType: "string-array",
          editable: true,
          enabledValue: "-sEXPORTED_RUNTIME_METHODS=\"{value}\""
        }
      ]
    },
    {
      name: "Debug Options",
      icon: icons.debug,
      options: [
        {
          option: "-g",
          default: "disabled",
          description: "Preserve debug information (-g1 preserves whitespace, -g2 preserves function names, -g3 preserves DWARF, -g4 includes source code)",
          valueType: "string",
          editable: true,
          enabledValue: "-g{value}",
          initialValue: "3"
        },
        {
          option: "-gsource-map",
          default: "false",
          description: "Generate source map",
          valueType: "boolean",
          editable: false,
          enabledValue: "-gsource-map"
        },
        {
          option: "-sASSERTIONS",
          default: "1",
          description: "Enable runtime assertion checks (0 disabled, 1 basic, 2 detailed, default adjusts based on optimization level, -O0 defaults to 1, others default to 0)",
          valueType: "number",
          editable: true,
          enabledValue: "-sASSERTIONS={value}",
          dynamicDefault: (optimizationLevel: string) => optimizationLevel === 'O0' ? '1' : '0'
        },
        {
          option: "-sSAFE_HEAP",
          default: "0",
          description: "Detect memory access errors (0 disabled, 1 enabled, 2 more detailed, high performance overhead)",
          valueType: "number",
          editable: true,
          enabledValue: "-sSAFE_HEAP={value}",
          initialValue: "1"

        },
        {
          option: "-sSTACK_OVERFLOW_CHECK",
          default: "0",
          description: "Stack overflow detection (0 disabled, 1 enabled, 2 stricter, defaults to 1 when ASSERTIONS=1)",
          valueType: "number",
          editable: true,
          enabledValue: "-sSTACK_OVERFLOW_CHECK={value}",
          initialValue:"1"

        }
      ]
    },
    {
      name: "Memory Configuration",
      icon: icons.memory,
      options: [
        {
          option: "-sINITIAL_MEMORY",
          default: "-1",
          description: "Initial memory size (-1 auto-calculates, otherwise must be a multiple of 64KB)",
          valueType: "number",
          editable: true,
          enabledValue: "-sINITIAL_MEMORY={value}"
        },
        {
          option: "-sMAXIMUM_MEMORY",
          default: "2147483648",
          description: "Maximum memory limit (requires ALLOW_MEMORY_GROWTH), defaults to 2GB, in bytes",
          valueType: "number",
          editable: true,
          enabledValue: "-sMAXIMUM_MEMORY={value}"
        },
        {
          option: "-sALLOW_MEMORY_GROWTH",
          default: "false",
          description: "Allow dynamic memory growth",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sALLOW_MEMORY_GROWTH"
        },
        {
          option: "-sSTACK_SIZE",
          default: "65536",
          description: "Set stack size (64KB)",
          valueType: "number",
          editable: true,
          enabledValue: "-sSTACK_SIZE={value}"
        }
      ]
    },
    {
      name: "Filesystem Configuration",
      icon: icons.filesystem,
      options: [
        {
          option: "-sFILESYSTEM",
          default: "1",
          description: "Filesystem support (0 disabled, 1 enabled. Without this command, the compiler automatically optimizes based on code, so the default value may change unless explicitly specified.)",
          valueType: "number",
          editable: true,
          enabledValue: "-sFILESYSTEM={value}",
        },
        {
          option: "-sFORCE_FILESYSTEM",
          default: "0",
          description: "Force include filesystem (0 disabled, 1 force include)",
          valueType: "number",
          editable: true,
          enabledValue: "-sFORCE_FILESYSTEM={value}",
          initialValue:"1"

        },
        {
          option: "--preload-file",
          default: "''",
          description: "Preload files into virtual filesystem (generates .data file)",
          valueType: "string",
          editable: true,
          enabledValue: "--preload-file=\"{value}\""
        },
        {
          option: "--embed-file",
          default: "''",
          description: "Embed files into JS/wasm (no additional files generated)",
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
          description: "Link Embind library (C++ to JS binding)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-lembind"
        },
        {
          option: "-sWASM_BIGINT",
          default: "1",
          description: "Support JS BigInt and i64 interoperability (0 disabled, 1 enabled)",
          valueType: "number",
          editable: true,
          enabledValue: "-sWASM_BIGINT={value}",

        }
      ]
    },
    {
      name: "WebAssembly Features",
      icon: icons.wasm,
      options: [
        {
          option: "-sWASM",
          default: "1",
          description: "Output WebAssembly (0 outputs asm.js, 1 outputs wasm)",
          valueType: "number",
          editable: true,
          enabledValue: "-sWASM={value}"
        },
        {
          option: "-sWASM_ASYNC_COMPILATION",
          default: "1",
          description: "Asynchronous wasm compilation (0 synchronous, 1 asynchronous)",
          valueType: "number",
          editable: true,
          enabledValue: "-sWASM_ASYNC_COMPILATION={value}"
        },
        {
          option: "-sSTANDALONE_WASM",
          default: "false",
          description: "Generate standalone WASM file (minimize JS dependencies)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sSTANDALONE_WASM"
        },
        {
          option: "-sIMPORT_MEMORY",
          default: "false",
          description: "Import memory from external source",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sIMPORT_MEMORY"
        },
        {
          option: "-sEXPORT_ALL",
          default: "false",
          description: "Export all symbols to Module object (for debugging)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sEXPORT_ALL"
        }
      ]
    },
    {
      name: "Multithreading Support",
      icon: icons.advanced,
      options: [
        {
          option: "-pthread",
          default: "false",
          description: "Enable Pthreads multithreading (GCC standard flag)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-pthread"
        },
        {
          option: "-sPTHREAD_POOL_SIZE",
          default: "0",
          description: "Thread pool size (0 means create on demand)",
          valueType: "number",
          editable: true,
          enabledValue: "-sPTHREAD_POOL_SIZE={value}"
        },
        {
          option: "-sPROXY_TO_PTHREAD",
          default: "false",
          description: "Run main() in pthread",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sPROXY_TO_PTHREAD"
        }
      ]
    },
    {
      name: "Exception Handling",
      icon: icons.exception,
      options: [
        {
          option: "-fexceptions",
          default: "false",
          description: "Enable C++ exceptions (Wasm native exception handling)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-fexceptions"
        },
        {
          option: "-sDISABLE_EXCEPTION_CATCHING",
          default: "1",
          description: "Disable exception catching control (0 enables JS simulation, 1 disables, defaults to 1)",
          valueType: "number",
          editable: true,
          enabledValue: "-sDISABLE_EXCEPTION_CATCHING={value}",
          initialValue:"1"
        },
        {
          option: "-sEXCEPTION_STACK_TRACES",
          default: "false",
          description: "Show stack trace on exceptions (defaults to true when ASSERTIONS=1)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sEXCEPTION_STACK_TRACES"
        }
      ]
    },
    {
      name: "Code Size Optimization",
      icon: icons.codeSize,
      options: [
        {
          option: "--closure",
          default: "0",
          description: "Use Closure Compiler to minify JS (0 disabled, 1 minify support code, 2 minify all)",
          valueType: "number",
          editable: true,
          enabledValue: "--closure {value}"
        },
        {
          option: "--closure-args",
          default: "''",
          description: "Pass arguments to Closure Compiler",
          valueType: "string",
          editable: true,
          enabledValue: "--closure-args=\"{value}\""
        },
        {
          option: "-sIGNORE_MISSING_MAIN",
          default: "1",
          description: "No error when main function is missing (defaults to 1, pass 0 to explicitly disable)",
          valueType: "number",
          editable: true,
          enabledValue: "-sIGNORE_MISSING_MAIN={value}",
          initialValue: "1"
        },
        {
          option: "-sMALLOC",
          default: "dlmalloc",
          description: "Memory allocator (dlmalloc default, emmalloc smaller but slower, mimalloc better for multithreading)",
          valueType: "string",
          editable: true,
          enabledValue: "-sMALLOC=\"{value}\""
        },
        {
          option: "-sEVAL_CTORS",
          default: "false",
          description: "Evaluate constructors at compile time (reduces runtime overhead)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sEVAL_CTORS"
        },
        {
          option: "-sAGGRESSIVE_VARIABLE_ELIMINATION",
          default: "false",
          description: "Aggressive variable elimination",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sAGGRESSIVE_VARIABLE_ELIMINATION"
        }
      ]
    },
    {
      name: "Optimization Level",
      icon: icons.optimization,
      options: [
        {
          option: "-O0",
          default: "true",
          description: "No optimization, fastest compilation, includes assertions (enabled by default)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-O0",
          radioGroup: "optimization"
        },
        {
          option: "-O1",
          default: "false",
          description: "Basic optimization",
          valueType: "boolean",
          editable: false,
          enabledValue: "-O1",
          radioGroup: "optimization"
        },
        {
          option: "-O2",
          default: "false",
          description: "Standard optimization (recommended for release)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-O2",
          radioGroup: "optimization"
        },
        {
          option: "-O3",
          default: "false",
          description: "Aggressive optimization (may increase code size)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-O3",
          radioGroup: "optimization"
        },
        {
          option: "-Os",
          default: "false",
          description: "Optimize for code size",
          valueType: "boolean",
          editable: false,
          enabledValue: "-Os",
          radioGroup: "optimization"
        },
        {
          option: "-Oz",
          default: "false",
          description: "Extreme code size compression",
          valueType: "boolean",
          editable: false,
          enabledValue: "-Oz",
          radioGroup: "optimization"
        }
      ]
    },
    {
      name: "Network & Web API",
      icon: icons.network,
      options: [
        {
          option: "-sFETCH",
          default: "false",
          description: "Enable Fetch API support",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sFETCH"
        },
        {
          option: "-sWEBSOCKET_URL",
          default: "ws://",
          description: "WebSocket connection URL",
          valueType: "string",
          editable: true,
          enabledValue: "-sWEBSOCKET_URL=\"{value}\""
        },
        {
          option: "-sPROXY_POSIX_SOCKETS",
          default: "false",
          description: "Proxy POSIX sockets through WebSocket",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sPROXY_POSIX_SOCKETS"
        }
      ]
    },
    {
      name: "Library Support",
      icon: icons.library,
      options: [
        {
          option: "-sUSE_SDL",
          default: "0",
          description: "Use SDL (2 for SDL2)",
          valueType: "number",
          editable: true,
          enabledValue: "-sUSE_SDL={value}",
          initialValue: "2"
        },
        {
          option: "-sUSE_ZLIB",
          default: "false",
          description: "Use zlib",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sUSE_ZLIB"
        },
        {
          option: "-sUSE_LIBPNG",
          default: "false",
          description: "Use libpng",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sUSE_LIBPNG"
        },
        {
          option: "-sUSE_FREETYPE",
          default: "false",
          description: "Use FreeType",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sUSE_FREETYPE"
        },
        {
          option: "-sUSE_BOOST_HEADERS",
          default: "false",
          description: "Use Boost headers",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sUSE_BOOST_HEADERS"
        }
      ]
    },
    {
      name: "Runtime Behavior",
      icon: icons.runtime,
      options: [
        {
          option: "-sINVOKE_RUN",
          default: "true",
          description: "Automatically run main()",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sINVOKE_RUN"
        },
        {
          option: "-sEXIT_RUNTIME",
          default: "false",
          description: "Clean up runtime after main ends (calls atexit, etc.)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sEXIT_RUNTIME"
        },
        {
          option: "-sNO_EXIT_RUNTIME",
          default: "false",
          description: "Prevent runtime exit (keep runtime alive)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sNO_EXIT_RUNTIME"
        },
        {
          option: "-sMODULARIZE_INSTANCE",
          default: "false",
          description: "Export instance instead of factory function (use with MODULARIZE)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sMODULARIZE_INSTANCE"
        }
      ]
    },
    {
      name: "Other Advanced Options",
      icon: icons.other,
      options: [
        {
          option: "-sSTRICT",
          default: "false",
          description: "Strict mode (check deprecated options, forward compatible)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sSTRICT"
        },
        {
          option: "-sVERBOSE",
          default: "false",
          description: "Verbose output of compilation process",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sVERBOSE"
        },
        {
          option: "-sMIN_CHROME_VERSION",
          default: "85",
          description: "Minimum Chrome version (85 = released 2020-08)",
          valueType: "number",
          editable: true,
          enabledValue: "-sMIN_CHROME_VERSION={value}"
        },
        {
          option: "-sMIN_FIREFOX_VERSION",
          default: "79",
          description: "Minimum Firefox version (79 = released 2020-07)",
          valueType: "number",
          editable: true,
          enabledValue: "-sMIN_FIREFOX_VERSION={value}"
        },
        {
          option: "-sINCOMING_MODULE_JS_API",
          default: "[]",
          description: "Specify imported Module properties (empty means no Module properties used)",
          valueType: "string-array",
          editable: true,
enabledValue: "-sINCOMING_MODULE_JS_API=\"{value}\""
        },
        {
          option: "-sAUTO_JS_LIBRARIES",
          default: "true",
          description: "Automatically link JS libraries",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sAUTO_JS_LIBRARIES"
        },
        {
          option: "-sLEGACY_VM_SUPPORT",
          default: "false",
          description: "Support legacy VMs (before iOS 11.2)",
          valueType: "boolean",
          editable: false,
          enabledValue: "-sLEGACY_VM_SUPPORT"
        }
      ]
    }
  ]
}
