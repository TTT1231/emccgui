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
import { compileOptionsData, runtimeMethodsData } from '@/data'

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
}

// Injection Key
export const AppStateKey: InjectionKey<ReturnType<typeof createAppState>> = Symbol('AppState')

// 创建状态
export function createAppState() {
  const state = reactive<AppState>({
    outputFormat: 'js-wasm',
    selectedFile: null,
    optimizationLevel: 'O3',
    theme: 'dark',
    activeTab: 'file',
    compileOptions: compileOptionsData.map((opt): CompileOptionState => ({
      ...opt,
      enabled: opt.valueType === 'boolean' && opt.defaultValue === true,
      currentValue: opt.valueType === 'boolean' ? Boolean(opt.defaultValue) : String(opt.defaultValue || '')
    })),
    runtimeMethods: runtimeMethodsData.map((method): RuntimeMethodState => ({
      ...method,
      enabled: method.key === 'ccall' || method.key === 'cwrap'
    })),
    refSelectedOptions: {},
    refSearchQuery: '',
    refActiveCategory: 'all'
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

  function toggleRefOption(option: string, valueType: 'boolean' | 'string' | 'number', value?: string) {
    // 如果已选中且没有提供新值，则取消选中
    if (option in state.refSelectedOptions && value === undefined) {
      delete state.refSelectedOptions[option]
      return
    }

    // 否则设置选中状态
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
    setOptimizationLevel,
    toggleTheme,
    setActiveTab,
    updateOption,
    updateOptionValue,
    toggleRuntimeMethod,
    toggleRefOption,
    setRefSearchQuery,
    setRefActiveCategory,
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
