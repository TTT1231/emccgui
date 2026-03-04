export default {
  // Navigation
  nav: {
    file: 'File',
    compile: 'Compile',
    reference: 'Reference',
  },

  // Header
  header: {
    resetTooltip: 'Reset all states',
    resetBtn: 'Reset',
    themeTooltip: 'Toggle theme',
  },

  // File Selector
  fileSelector: {
    dropReplace: 'Release to replace file',
    dropOpen: 'Release to open file',
    dropHint: 'Supports common WebAssembly languages',
    dragOrClick: 'Drag files here, or {click}',
    clickToSelect: 'click to select',
    supportedLangs: 'Supports common WebAssembly languages · C/C++/Rust/Go/Java/Python/C#, etc.',
    step1: 'Select WebAssembly source file',
    step2: 'Configure options in "Compile" tab',
    step3: 'Copy and execute emcc command',
    unsavedChanges: 'Unsaved changes',
    lines: 'lines',
    save: 'Save',
    saved: 'Saved',
    saveTooltip: 'Save file (Ctrl+S)',
    reselectTooltip: 'Reselect file',
    removeTooltip: 'Remove file',
    outputLabel: 'Output filename',
    outputPlaceholder: 'hello',
  },

  // Compile Options
  compile: {
    cardTitle: 'Common Compile Configuration',
    optionsCount: '{enabled}/{total}',
    optimizationLevel: 'Optimization Level',
    copyTooltip: 'Copy command',
    copySuccess: '✓ Command copied to clipboard',
    copyFailed: '✕ Copy failed, please copy manually',
    addCommand: 'Add command',
    undoTooltip: 'Undo last (Ctrl+Z)',
    runtimeMethods: 'Export Runtime Methods',
    methodPlaceholder: 'Enter method name, e.g., UTF8ToString',
    removeMethod: 'Remove',
    copyCommand: 'Copy Command',
    pureWasmWarning: 'Pure WASM mode does not generate JS glue code, this method is invalid',
  },

  // Search Button
  search: {
    placeholder: 'Type @ to search options, or enter command directly',
    optionsCount: 'options',
    selectHint: '↑↓ Select Enter Confirm',
    none: 'None',
    addBtn: 'Add',
    invalidCommand: 'Invalid command: emcc commands must start with - (e.g., -sFLAG, --option)',
    duplicateCommand: 'This command already exists in current compile command, no need to add again',
  },

  // Reference
  reference: {
    all: 'All',
    selected: 'Selected ({count})',
    searchPlaceholder: 'Search options...',
    noResults: 'No matching options found',
    optionsCount: '{count} options',
    // Table headers
    command: 'Command',
    description: 'Description',
    type: 'Type',
    default: 'Default',
    current: 'Current',
    // Option row
    enabled: 'Enabled',
    doubleClickToInput: 'Double-click to input',
    doubleClickToEdit: 'Double-click to edit',
    clickToDisable: 'Click to disable this option',
    enabledInCompile: 'Enabled in compile panel',
  },

  // Categories (used in reference panel and compile options)
  categories: {
    modular: 'Modularization',
    memory: 'Memory',
    runtime: 'Runtime',
    output: 'Output',
    optimization: 'Optimization',
    debug: 'Debug',
    environment: 'Environment',
    filesystem: 'Filesystem',
    networking: 'Networking',
    web: 'Web',
    advanced: 'Advanced',
    wasm: 'WebAssembly',
    typeDefinition: 'Type Definition',
    export: 'Export',
    binding: 'Binding',
  },

  // Hints for compile options
  hints: {
    exportES6: 'Generate ES6 module format (requires MODULARIZE)',
    modularize: 'Convert JS code to factory function (becomes async)',
    exportName: 'Specify exported module name (factory function name)',
    singleFile: 'Embed WASM as Base64 into JS file for single-file output',
    wasm: 'Output WebAssembly',
    allowMemoryGrowth: '(Default 16MB) Allow WASM memory to grow dynamically at runtime',
    exportAll: 'Export all symbols (functions and global variables)',
    standaloneWasm: 'Generate standalone WASM with minimal external dependencies (conflicts with wasm-only)',
    emitTsd: 'Generate TypeScript definition file (.d.ts)',
    sideModule: 'Compile pure WASM module without main function',
    exportedFunctions: 'Specify C/C++ functions to export (comma-separated, prefix function names with underscore)',
    bind: 'Enable Embind for C++ and JavaScript bindings',
    debug: 'Generate debug info: -g1 preserve whitespace, -g2 preserve function names, -g3 preserve DWARF, -g4 include source code',
    sourceMap: 'Generate Source Map file for browser debugging',
    assertions: 'Enable runtime assertion checks: =1 basic, =2 detailed (increases size)',
    pthread: 'Enable multi-threading support (requires SharedArrayBuffer)',
    fexceptions: 'Enable C++ exception handling support',
  },

  // Optimization levels
  optimization: {
    O0: '-O0 (Default, no optimization)',
    O1: '-O1 (Basic optimization)',
    O2: '-O2 (Standard optimization)',
    O3: '-O3 (Maximum optimization)',
    Os: '-Os (Size optimization)',
    Oz: '-Oz (Extreme size optimization)',
  },
}
