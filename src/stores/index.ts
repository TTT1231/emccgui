import { reactive, readonly, provide, inject, type InjectionKey, watch } from 'vue'
import type {
  OutputFormat,
  OptimizationLevel,
  Theme,
  TabName,
  FileInfo,
  CompileOptionState,
  RuntimeMethodState
} from '@/types'
import { compileOptionsData, runtimeMethodsData, refConfigData } from '@/data'

// 预建 option key → radioGroup 映射表（仅包含有 radioGroup 的选项）
const radioGroupMap = new Map<string, string>()
for (const category of refConfigData.categories) {
  for (const opt of category.options) {
    if (opt.radioGroup) {
      radioGroupMap.set(opt.option, opt.radioGroup)
    }
  }
}

// 状态接口
export interface AppState {
  outputFormat: OutputFormat
  selectedFile: FileInfo | null
  optimizationLevel: OptimizationLevel
  theme: Theme
  activeTab: TabName
  compileOptions: CompileOptionState[]
  runtimeMethods: RuntimeMethodState[]
  refSelectedOptions: Record<string, string | boolean>
  refSearchQuery: string
  refActiveCategory: string
  outputFileName: string
  dtsFileName: string
  addOptionsStack: string[]
  customRuntimeMethods: string[]
}

// Injection Key
export const AppStateKey: InjectionKey<ReturnType<typeof createAppState>> = Symbol('AppState')

// 创建状态
export function createAppState() {
  const state = reactive<AppState>({
    outputFormat: 'js-wasm',
    selectedFile: null,
    optimizationLevel: 'O0',
    theme: 'dark',
    activeTab: 'file',
    compileOptions: compileOptionsData.map((opt): CompileOptionState => {
      const defaultValue = opt.defaultValue
      const isBoolean = opt.valueType === 'boolean'

      // 检查依赖项：如果有 dependsOn，则需要依赖项也默认启用
      let shouldEnable = opt.defaultEnabled ?? false
      if (shouldEnable && opt.dependsOn) {
        const depOpt = compileOptionsData.find(o => o.key === opt.dependsOn)
        shouldEnable = depOpt?.defaultEnabled ?? false
      }

      return {
        ...opt,
        enabled: shouldEnable,
        currentValue: isBoolean
          ? Boolean(defaultValue)
          : (opt.currentValue ?? String(defaultValue ?? ''))
      }
    }),
    runtimeMethods: runtimeMethodsData.map((method): RuntimeMethodState => ({
      ...method,
      enabled: method.key === 'ccall' || method.key === 'cwrap'
    })),
    refSelectedOptions: {},
    refSearchQuery: '',
    refActiveCategory: 'all',
    outputFileName: 'hello',
    dtsFileName: '',
    addOptionsStack: [],
    customRuntimeMethods: []
  })

  // Actions
  function setOutputFormat(format: OutputFormat) {
    state.outputFormat = format
  }

  function setSelectedFile(file: FileInfo | null) {
    state.selectedFile = file
  }

  function setOptimizationLevel(level: OptimizationLevel) {
    state.optimizationLevel = level
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('emccgui-theme', state.theme)
  }

  function setActiveTab(tab: TabName) {
    state.activeTab = tab
  }

  function setOutputFileName(name: string) {
    state.outputFileName = name || 'hello'
  }

  function setDtsFileName(name: string) {
    state.dtsFileName = name
  }

  function addCustomOption(option: string) {
    state.addOptionsStack.push(option)
  }

  function revokeCustomOption() {
    state.addOptionsStack.pop()
  }

  function addCustomRuntimeMethod(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const allNames = [
      ...state.runtimeMethods.map(m => m.name),
      ...state.customRuntimeMethods
    ]
    if (allNames.includes(trimmed)) return
    state.customRuntimeMethods.push(trimmed)
  }

  function removeCustomRuntimeMethod(name: string) {
    const idx = state.customRuntimeMethods.indexOf(name)
    if (idx !== -1) state.customRuntimeMethods.splice(idx, 1)
  }

  function updateOption(key: string, enabled: boolean) {
    const option = state.compileOptions.find(o => o.key === key)
    if (option) {
      option.enabled = enabled
    }
  }

  function updateOptionValue(key: string, value: string) {
    const option = state.compileOptions.find(o => o.key === key)
    if (option) {
      option.currentValue = value
    }
  }

  function toggleRuntimeMethod(key: string) {
    const method = state.runtimeMethods.find(m => m.key === key)
    if (method) {
      method.enabled = !method.enabled
    }
  }

  function toggleRefOption(
    option: string,
    valueType: 'boolean' | 'string' | 'number' | 'string-array',
    value?: string,
    radioGroup?: string
  ) {
    // 如果已选中且没有提供新值，则取消选中（单选组不允许取消，直接返回）
    if (option in state.refSelectedOptions && value === undefined) {
      if (radioGroup) return
      delete state.refSelectedOptions[option]
      return
    }

    // 单选组：先清除同组内其他已选中的选项
    if (radioGroup) {
      for (const key of Object.keys(state.refSelectedOptions)) {
        if (key !== option && radioGroupMap.get(key) === radioGroup) {
          delete state.refSelectedOptions[key]
        }
      }
    }

    // 设置选中状态
    if (valueType === 'boolean') {
      state.refSelectedOptions[option] = true
    } else {
      state.refSelectedOptions[option] = value ?? true
    }
  }

  function setRefSearchQuery(query: string) {
    state.refSearchQuery = query
  }

  function setRefActiveCategory(category: string) {
    state.refActiveCategory = category
  }

  // 初始化主题
  function initTheme() {
    const saved = localStorage.getItem('emccgui-theme') as Theme | null
    if (saved) {
      state.theme = saved
    }
  }

  // 监听主题变化
  watch(
    () => state.theme,
    (theme) => {
      document.documentElement.setAttribute('data-theme', theme)
    },
    { immediate: true }
  )

  return {
    state: readonly(state),
    setOutputFormat,
    setSelectedFile,
    setOutputFileName,
    setDtsFileName,
    setOptimizationLevel,
    toggleTheme,
    setActiveTab,
    updateOption,
    updateOptionValue,
    toggleRuntimeMethod,
    toggleRefOption,
    setRefSearchQuery,
    setRefActiveCategory,
    addCustomOption,
    revokeCustomOption,
    addCustomRuntimeMethod,
    removeCustomRuntimeMethod,
    initTheme
  }
}

// Provider
export function provideAppState() {
  const appState = createAppState()
  provide(AppStateKey, appState)
  return appState
}

// Injector
export function useAppState() {
  const appState = inject(AppStateKey)
  if (!appState) {
    throw new Error('AppState not provided')
  }
  return appState
}
