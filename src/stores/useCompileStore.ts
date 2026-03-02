import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { ref, reactive } from 'vue'
import type {
  OutputFormat,
  OptimizationLevel,
  Theme,
  TabName,
  FileInfo,
  CompileOptionState,
  RuntimeMethodState,
  CommandLine,
} from '@/types'
import { compileOptionsData, runtimeMethodsData, refConfigData } from '@/data'
import {
  isOptionReallyEnabled,
  resolveEnabledValue,
  formatCommandLine,
} from '@/utils/compileUtils'

// 预建 option key → radioGroup 映射表（模块级常量，数据是静态的）
const radioGroupMap = new Map<string, string>()
for (const category of refConfigData.categories) {
  for (const opt of category.options) {
    if (opt.radioGroup) {
      radioGroupMap.set(opt.option, opt.radioGroup)
    }
  }
}

// 预建 refOption key → RefOption 映射（加速查找）
const refOptionMap = new Map<string, { enabledValue: string; valueType: string }>()
for (const category of refConfigData.categories) {
  for (const opt of category.options) {
    refOptionMap.set(opt.option, { enabledValue: opt.enabledValue, valueType: opt.valueType })
  }
}

/** 初始化编译选项状态 */
function buildInitialCompileOptions(): CompileOptionState[] {
  return compileOptionsData.map((opt): CompileOptionState => {
    const isBoolean = opt.valueType === 'boolean'

    let shouldEnable = opt.defaultEnabled ?? false
    if (shouldEnable && opt.dependsOn) {
      const depOpt = compileOptionsData.find(o => o.key === opt.dependsOn)
      shouldEnable = depOpt?.defaultEnabled ?? false
    }

    return {
      ...opt,
      enabled: shouldEnable,
      currentValue: isBoolean
        ? Boolean(opt.defaultValue)
        : (opt.currentValue ?? String(opt.defaultValue ?? '')),
    }
  })
}

/** 初始化运行时方法状态 */
function buildInitialRuntimeMethods(): RuntimeMethodState[] {
  return runtimeMethodsData.map((method): RuntimeMethodState => ({
    ...method,
    enabled: method.key === 'ccall' || method.key === 'cwrap',
  }))
}

export const useCompileStore = defineStore('compile', () => {
  // =========================================================================
  // State
  // =========================================================================

  /** 环境状态 */
  const outputFormat = ref<OutputFormat>('js-wasm')
  const theme = ref<Theme>('dark')
  const activeTab = ref<TabName>('file')

  /** 文件状态 */
  const selectedFile = ref<FileInfo | null>(null)
  const outputFileName = ref<string>('hello')

  /** 编译状态 */
  const compileOptions = reactive<CompileOptionState[]>(buildInitialCompileOptions())
  const optimizationLevel = ref<OptimizationLevel>('O0')
  const addOptionsStack = reactive<string[]>([])
  const runtimeMethods = reactive<RuntimeMethodState[]>(buildInitialRuntimeMethods())
  const customRuntimeMethods = reactive<string[]>([])

  /** 参考面板状态 */
  const refSelectedOptions = reactive<Record<string, string | boolean>>({})
  const refSearchQuery = ref<string>('')
  const refActiveCategory = ref<string>('all')

  // =========================================================================
  // Getters
  // =========================================================================

  /** 根据当前输出格式过滤的可用编译选项 */
  const availableOptions = computed(() => {
    const isJsWasm = outputFormat.value === 'js-wasm'
    return compileOptions.filter(opt => {
      if (opt.key === 'SIDE_MODULE') return !isJsWasm
      return !opt.jsWasmOnly || isJsWasm
    })
  })

  /**
   * 编译面板当前已激活的完整命令 key 集合（如 `-g3`, `-sEXPORT_ES6`）
   * 用于参考面板实时同步：只要该命令在编译面板启用，参考面板对应行就高亮
   * 使用完整解析命令（如 `-g3`），避免 `-g` vs `-g3` 无法匹配的问题
   */
  const compileContributedRefKeys = computed<Set<string>>(() => {
    const keys = new Set<string>()
    const isJsWasm = outputFormat.value === 'js-wasm'

    for (const opt of compileOptions) {
      if (!isOptionReallyEnabled(opt, compileOptions)) continue
      if (opt.jsWasmOnly && !isJsWasm) continue
      if (!opt.enabledValue) continue

      let currentVal = String(opt.currentValue ?? opt.defaultValue ?? '')
      if (opt.key === 'emitTsd') currentVal = `${outputFileName.value}.d.ts`

      const resolvedCmd = resolveEnabledValue(opt.enabledValue, currentVal)
      keys.add(resolvedCmd) // 完整命令，如 `-g3`
      const eqIdx = resolvedCmd.indexOf('=')
      if (eqIdx > 0) keys.add(resolvedCmd.substring(0, eqIdx)) // 无值部分，如 `-sEXPORT_NAME`
      // 同时加入 cmdPrefix+cmdName 基础 key（如 `-g`），以匹配 refConfigData 中的完整 option 字段
      keys.add(`${opt.cmdPrefix}${opt.cmdName}`)
    }

    // 输出文件 -o 始终激活
    keys.add('-o')
    // 优化级别（如 -O2）
    keys.add(`-${optimizationLevel.value}`)
    // 运行时方法
    const enabledMethods = [
      ...runtimeMethods.filter(m => m.enabled).map(m => m.name),
      ...customRuntimeMethods,
    ]
    if (enabledMethods.length > 0 && isJsWasm) {
      keys.add('-sEXPORTED_RUNTIME_METHODS')
    }

    return keys
  })

  /** 参考面板贡献的命令行 CommandLine[]（去重后） */
  const refContribLines = computed<CommandLine[]>(() => {
    const isJsWasm = outputFormat.value === 'js-wasm'
    const lines: CommandLine[] = []

    // 收集已由 compileOptions 生成的命令名，用于去重
    // 使用完整解析命令（如 `-g3`），避免 `-g` 无法去重 `-g3` 的问题
    const existingNames = new Set<string>()
    for (const opt of compileOptions) {
      if (!isOptionReallyEnabled(opt, compileOptions)) continue
      if (opt.jsWasmOnly && !isJsWasm) continue
      if (!opt.enabledValue) continue

      let currentVal = String(opt.currentValue ?? opt.defaultValue ?? '')
      if (opt.key === 'emitTsd') currentVal = `${outputFileName.value}.d.ts`

      const resolvedCmd = resolveEnabledValue(opt.enabledValue, currentVal)
      existingNames.add(resolvedCmd)
      const eqIdx = resolvedCmd.indexOf('=')
      if (eqIdx > 0) existingNames.add(resolvedCmd.substring(0, eqIdx))
    }
    // 优化级别
    existingNames.add(`-${optimizationLevel.value}`)
    // 自定义参数
    for (const customCmd of addOptionsStack) {
      const eqIdx = customCmd.indexOf('=')
      existingNames.add(eqIdx > 0 ? customCmd.substring(0, eqIdx) : customCmd)
    }
    // runtimeMethods
    const enabledMethods = [
      ...runtimeMethods.filter(m => m.enabled).map(m => m.name),
      ...customRuntimeMethods,
    ]
    if (enabledMethods.length > 0 && isJsWasm) {
      existingNames.add('-sEXPORTED_RUNTIME_METHODS')
    }

    for (const [optionKey, storedValue] of Object.entries(refSelectedOptions)) {
      const refOpt = refOptionMap.get(optionKey)
      if (!refOpt) continue

      const rawValue = typeof storedValue === 'string' ? storedValue : ''
      const resolvedCmd = resolveEnabledValue(refOpt.enabledValue, rawValue)

      const eqIndex = resolvedCmd.indexOf('=')
      const cmdName = eqIndex > 0 ? resolvedCmd.substring(0, eqIndex) : resolvedCmd

      // 跳过已由 compileOptions 覆盖的命令
      if (existingNames.has(cmdName)) continue

      if (eqIndex > 0) {
        lines.push({
          name: cmdName,
          value: resolvedCmd.substring(eqIndex + 1),
          type: 'flag',
          isRefContrib: true,
          rawCommand: resolvedCmd,
        })
      } else {
        lines.push({
          name: resolvedCmd,
          type: 'flag',
          isRefContrib: true,
          rawCommand: resolvedCmd,
        })
      }
    }

    return lines
  })

  /** 完整命令行数组（供命令预览渲染） */
  const commandLines = computed<CommandLine[]>(() => {
    const lines: CommandLine[] = []
    const isJsWasm = outputFormat.value === 'js-wasm'

    // emcc + 输入文件
    const inputFile = selectedFile.value?.name || 'input.cpp'
    lines.push({ name: 'emcc', value: inputFile, type: 'command' })

    // 输出文件
    const outputExt = isJsWasm ? '.js' : '.wasm'
    lines.push({ name: '-o', value: `${outputFileName.value}${outputExt}`, type: 'output' })

    // 编译选项
    for (const option of compileOptions) {
      if (!isOptionReallyEnabled(option, compileOptions)) continue
      if (option.jsWasmOnly && !isJsWasm) continue

      const template = option.enabledValue
      if (!template) continue

      let currentValue = String(option.currentValue ?? option.defaultValue)
      if (option.key === 'emitTsd') {
        currentValue = `${outputFileName.value}.d.ts`
      }

      const resolvedCmd = resolveEnabledValue(template, currentValue)
      const eqIndex = resolvedCmd.indexOf('=')

      if (eqIndex > 0) {
        lines.push({
          name: resolvedCmd.substring(0, eqIndex),
          value: resolvedCmd.substring(eqIndex + 1),
          type: 'flag',
          rawCommand: resolvedCmd,
        })
      } else {
        lines.push({ name: resolvedCmd, type: 'flag', rawCommand: resolvedCmd })
      }
    }

    // 优化级别
    lines.push({ name: `-${optimizationLevel.value}`, type: 'flag' })

    // 自定义参数
    for (const customCmd of addOptionsStack) {
      const eqIndex = customCmd.indexOf('=')
      if (eqIndex > 0) {
        lines.push({
          name: customCmd.substring(0, eqIndex),
          value: customCmd.substring(eqIndex + 1),
          type: 'flag',
          isCustom: true,
        })
      } else {
        lines.push({ name: customCmd, type: 'flag', isCustom: true })
      }
    }

    // 运行时方法
    const enabledMethods = [
      ...runtimeMethods.filter(m => m.enabled).map(m => m.name),
      ...customRuntimeMethods,
    ]
    if (enabledMethods.length > 0 && isJsWasm) {
      const methodsValue = enabledMethods.join(',')
      lines.push({
        name: '-sEXPORTED_RUNTIME_METHODS',
        value: methodsValue,
        type: 'flag',
        isRuntimeMethods: true,
        methods: enabledMethods,
        rawCommand: `-sEXPORTED_RUNTIME_METHODS="${methodsValue}"`,
      })
    }

    // 参考面板贡献
    lines.push(...refContribLines.value)

    return lines
  })

  /** 完整命令字符串（用于复制） */
  const fullCommand = computed<string>(() =>
    commandLines.value.map(line => formatCommandLine(line)).join(' ')
  )

  /** 所有当前已生成的命令名列表（供 SearchBtn 去重） */
  const existingCommandNames = computed<string[]>(() => {
    const names: string[] = []
    const isJsWasm = outputFormat.value === 'js-wasm'

    for (const opt of compileOptions) {
      if (!isOptionReallyEnabled(opt, compileOptions)) continue
      if (opt.jsWasmOnly && !isJsWasm) continue

      if (opt.valueType === 'select') {
        const selectValue = opt.currentValue || opt.defaultValue
        names.push(opt.formatType === 'arg' ? `-${selectValue}` : `${opt.cmdPrefix}${opt.cmdName}`)
        continue
      }
      names.push(`${opt.cmdPrefix}${opt.cmdName}`)
    }

    names.push(`-${optimizationLevel.value}`)

    const enabledMethods = [
      ...runtimeMethods.filter(m => m.enabled).map(m => m.name),
      ...customRuntimeMethods,
    ]
    if (enabledMethods.length > 0 && isJsWasm) {
      names.push('-sEXPORTED_RUNTIME_METHODS')
    }

    for (const customCmd of addOptionsStack) {
      const eqIndex = customCmd.indexOf('=')
      names.push(eqIndex > 0 ? customCmd.substring(0, eqIndex) : customCmd)
    }

    for (const line of refContribLines.value) {
      names.push(line.name)
    }

    return names
  })

  /** 可用且已启用的编译选项数量 */
  const enabledAvailableCount = computed(() =>
    availableOptions.value.filter(opt => opt.enabled).length
  )

  /** 有输入框的已启用编译选项 */
  const optionsWithInput = computed(() =>
    compileOptions.filter(
      opt => opt.hasInput && opt.key !== 'emitTsd' && isOptionReallyEnabled(opt, compileOptions)
    )
  )

  /** 有下拉框的已启用编译选项 */
  const optionsWithSelect = computed(() =>
    compileOptions.filter(
      opt => opt.valueType === 'select' && opt.selectOptions && opt.enabled
    )
  )

  // =========================================================================
  // Actions
  // =========================================================================

  /** 切换到纯 WASM 时保存的 jsWasmOnly 选项启用快照 */
  const jsWasmOnlySnapshot = new Map<string, boolean>()

  function setOutputFormat(format: OutputFormat) {
    const current = outputFormat.value
    if (current === format) return

    if (format === 'wasm-only') {
      // 保存并禁用所有 jsWasmOnly 选项
      jsWasmOnlySnapshot.clear()
      for (const opt of compileOptions) {
        if (opt.jsWasmOnly) {
          jsWasmOnlySnapshot.set(opt.key, opt.enabled)
          opt.enabled = false
        }
      }
    } else {
      // 恢复之前保存的 jsWasmOnly 选项状态
      for (const opt of compileOptions) {
        if (opt.jsWasmOnly && jsWasmOnlySnapshot.has(opt.key)) {
          opt.enabled = jsWasmOnlySnapshot.get(opt.key)!
        }
      }
      // 恢复 dependsOn 级联（如 exportName 依赖 modularize）
      for (const opt of compileOptions) {
        if (opt.jsWasmOnly && opt.dependsOn) {
          const parent = compileOptions.find(o => o.key === opt.dependsOn)
          if (parent && !parent.enabled) opt.enabled = false
        }
      }
      jsWasmOnlySnapshot.clear()
    }

    outputFormat.value = format
  }

  function setSelectedFile(file: FileInfo | null) {
    selectedFile.value = file
  }

  function setOptimizationLevel(level: OptimizationLevel) {
    optimizationLevel.value = level
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem('emccgui-theme', theme.value)
  }

  function setActiveTab(tab: TabName) {
    activeTab.value = tab
  }

  function setOutputFileName(name: string) {
    outputFileName.value = name || 'hello'
    // 同步更新 emitTsd 的 currentValue，使参考面板当前值列实时反映
    const emitTsdOpt = compileOptions.find(o => o.key === 'emitTsd')
    if (emitTsdOpt) emitTsdOpt.currentValue = `${outputFileName.value}.d.ts`
  }

  function addCustomOption(option: string) {
    addOptionsStack.push(option)
  }

  function revokeCustomOption() {
    addOptionsStack.pop()
  }

  function addCustomRuntimeMethod(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const allNames = [
      ...runtimeMethods.map(m => m.name),
      ...customRuntimeMethods,
    ]
    if (allNames.includes(trimmed)) return
    customRuntimeMethods.push(trimmed)
  }

  function removeCustomRuntimeMethod(name: string) {
    const idx = customRuntimeMethods.indexOf(name)
    if (idx !== -1) customRuntimeMethods.splice(idx, 1)
  }

  /**
   * 级联处理依赖关系：
   * - 禁用某选项时，同时禁用所有 dependsOn 它的子选项
   * - 启用某选项时，将 defaultEnabled=true 的子选项一起恢复
   */
  function cascadeOptionChange(key: string, enabled: boolean) {
    for (const opt of compileOptions) {
      if (opt.dependsOn === key) {
        if (!enabled) {
          opt.enabled = false
        } else if (opt.defaultEnabled) {
          opt.enabled = true
        }
      }
    }
  }

  function updateOption(key: string, enabled: boolean) {
    const option = compileOptions.find(o => o.key === key)
    if (option) {
      option.enabled = enabled
      cascadeOptionChange(key, enabled)
    }
  }

  function updateOptionValue(key: string, value: string) {
    const option = compileOptions.find(o => o.key === key)
    if (option) option.currentValue = value
  }

  function toggleRuntimeMethod(key: string) {
    const method = runtimeMethods.find(m => m.key === key)
    if (method) method.enabled = !method.enabled
  }

  function toggleRefOption(
    option: string,
    valueType: 'boolean' | 'string' | 'number' | 'string-array',
    value?: string,
    radioGroup?: string
  ) {
    // 单选组不允许取消；其他类型若已选中且无新值则取消
    if (option in refSelectedOptions && value === undefined) {
      if (radioGroup) return
      delete refSelectedOptions[option]
      return
    }

    // 单选组：先清除同组其他选项
    if (radioGroup) {
      for (const key of Object.keys(refSelectedOptions)) {
        if (key !== option && radioGroupMap.get(key) === radioGroup) {
          delete refSelectedOptions[key]
        }
      }
    }

    refSelectedOptions[option] = valueType === 'boolean' ? true : (value ?? true)
  }

  function setRefSearchQuery(query: string) {
    refSearchQuery.value = query
  }

  function setRefActiveCategory(category: string) {
    refActiveCategory.value = category
  }

  /** 初始化主题（从 localStorage 读取） */
  function initTheme() {
    const saved = localStorage.getItem('emccgui-theme') as Theme | null
    if (saved) theme.value = saved
  }

  // 监听主题变化，同步到 document attribute
  watch(
    theme,
    (t) => { document.documentElement.setAttribute('data-theme', t) },
    { immediate: true }
  )

  /**
   * 参考面板 → 编译面板双向同步映射表
   * 当参考面板选中某个 ref key 时，自动更新对应的 compileOption
   * key: refConfigData 中的 option 字段，value: { compileKey, value? }
   */
  const refToCompileMap: Record<string, { key: string; value?: string }> = {
    // `-g` 在参考面板是带 string 值的单个选项（如用户输入 3 → 生成 -g3）
    // 无固定 value，同步时从 refSelectedOptions 中读取实际值
    '-g': { key: 'debug' },
    '-sMODULARIZE': { key: 'modularize' },
    '-sEXPORT_NAME': { key: 'exportName' },
    '-sEXPORT_ES6': { key: 'exportES6' },
    '-sSINGLE_FILE': { key: 'singleFile' },
    '-sWASM': { key: 'wasm' },
    '-sALLOW_MEMORY_GROWTH': { key: 'allowMemoryGrowth' },
    '-sEXPORT_ALL': { key: 'exportAll' },
    '-sSTANDALONE_WASM': { key: 'standaloneWasm' },
    '-sEXPORTED_FUNCTIONS': { key: 'exportedFunctions' },
    '--bind': { key: 'bind' },
    '-pthread': { key: 'pthread' },
    '-fexceptions': { key: 'fexceptions' },
    '-gsource-map': { key: 'sourceMap' },
    '--emit-tsd': { key: 'emitTsd' },
  }

  // 监听参考面板选中状态，同步到编译面板对应选项
  watch(
    refSelectedOptions,
    (val) => {
      for (const refKey of Object.keys(val)) {
        const syncTarget = refToCompileMap[refKey]
        if (!syncTarget) continue
        // 找到对应编译选项 → 启用并设值
        const opt = compileOptions.find(o => o.key === syncTarget.key)
        if (opt) {
          opt.enabled = true
          cascadeOptionChange(syncTarget.key, true)
          // 优先用 map 中的固定值；否则用参考面板实际存储的值（适用于 -g 这类 string 选项）
          const storedVal = val[refKey]
          const applyValue = syncTarget.value ?? (typeof storedVal === 'string' ? storedVal : undefined)
          if (applyValue !== undefined) opt.currentValue = applyValue
        }
        // 移除，避免命令行重复
        delete refSelectedOptions[refKey]
      }
    },
    { deep: true }
  )

  /**
   * 从参考面板点击关闭一个由编译面板贡献的选项
   * 查找 refToCompileMap 中对应的 compileOption 并将其 enabled 设为 false
   */
  function disableCompileContrib(refOptionKey: string) {
    const syncTarget = refToCompileMap[refOptionKey]
    if (!syncTarget) return
    const opt = compileOptions.find(o => o.key === syncTarget.key)
    if (opt) {
      opt.enabled = false
      cascadeOptionChange(syncTarget.key, false)
    }
  }

  /**
   * 参考面板「已选」总数：用户手动选中 + 编译面板贡献的去重合并
   */
  const totalRefActiveCount = computed<number>(() => {
    let count = 0
    for (const category of refConfigData.categories) {
      for (const opt of category.options) {
        if (
          opt.option in refSelectedOptions ||
          compileContributedRefKeys.value.has(opt.option)
        ) {
          count++
        }
      }
    }
    return count
  })

  /**
   * 重置所有状态（保留主题 & 输出格式）
   */
  function resetAll() {
    // 编译选项重置
    const freshOptions = buildInitialCompileOptions()
    compileOptions.splice(0, compileOptions.length, ...freshOptions)
    // 若当前处于 wasm-only 模式，重置后立即禁用 jsWasmOnly 选项并清空快照
    jsWasmOnlySnapshot.clear()
    if (outputFormat.value === 'wasm-only') {
      for (const opt of compileOptions) {
        if (opt.jsWasmOnly) opt.enabled = false
      }
    }
    // 运行时方法重置
    const freshMethods = buildInitialRuntimeMethods()
    runtimeMethods.splice(0, runtimeMethods.length, ...freshMethods)
    // 优化级别
    optimizationLevel.value = 'O0'
    // 自定义参数栏
    addOptionsStack.splice(0)
    customRuntimeMethods.splice(0)
    // 参考面板
    for (const key of Object.keys(refSelectedOptions)) delete refSelectedOptions[key]
    refSearchQuery.value = ''
    refActiveCategory.value = 'all'
    // 文件
    selectedFile.value = null
    outputFileName.value = 'hello'
  }

  return {
    // state
    outputFormat,
    theme,
    activeTab,
    selectedFile,
    outputFileName,
    compileOptions,
    optimizationLevel,
    addOptionsStack,
    runtimeMethods,
    customRuntimeMethods,
    refSelectedOptions,
    refSearchQuery,
    refActiveCategory,
    // getters
    availableOptions,
    compileContributedRefKeys,
    commandLines,
    fullCommand,
    existingCommandNames,
    enabledAvailableCount,
    optionsWithInput,
    optionsWithSelect,
    refContribLines,
    totalRefActiveCount,
    // actions
    setOutputFormat,
    setSelectedFile,
    setOptimizationLevel,
    toggleTheme,
    setActiveTab,
    setOutputFileName,
    addCustomOption,
    revokeCustomOption,
    addCustomRuntimeMethod,
    removeCustomRuntimeMethod,
    updateOption,
    updateOptionValue,
    toggleRuntimeMethod,
    toggleRefOption,
    disableCompileContrib,
    setRefSearchQuery,
    setRefActiveCategory,
    initTheme,
    resetAll,
  }
})
