// 选项值类型
export type OptionValueType = 'boolean' | 'string' | 'number' | 'select'

// 选项格式类型
export type OptionFormatType = 'flag' | 'setting' | 'arg'

// 选项冲突类型
export type ConflictType = 'wasm-only' | 'side-module'

// 下拉选项
export interface SelectOption {
  value: string
  label: string
}

// 编译选项定义（静态数据）
export interface CompileOptionDef {
  key: string
  name: string
  cmdPrefix: string
  cmdName: string
  valueType: OptionValueType
  defaultValue?: string | number | boolean
  currentValue?: string | boolean
  selectOptions?: readonly SelectOption[]
  formatType: OptionFormatType
  jsWasmOnly?: boolean
  dependsOn?: string
  hasInput?: boolean
  inputPlaceholder?: string
  inputLabel?: string
  hint: string
  hintKey?: string // i18n key for hint
  category: string
  categoryKey?: string // i18n key for category
  defaultEnabled?: boolean // 是否默认启用
  enabledValue?: string // 命令行模板（遵循 refConfigData 格式标准）
}

// 编译选项状态（运行时）
export interface CompileOptionState extends CompileOptionDef {
  enabled: boolean
  currentValue: string | boolean
}

// 运行时方法定义
export interface RuntimeMethodDef {
  key: string
  name: string
  hint: string
}

// 运行时方法状态
export interface RuntimeMethodState extends RuntimeMethodDef {
  enabled: boolean
}

// 选项冲突规则
export interface OptionConflict {
  triggerKey: string
  type: ConflictType
  conflictsWith: string[]
  reason: string
}

// 运行时活跃冲突信息（用于 UI 展示）
export interface ConflictInfo {
  /** 冲突选项的 key */
  key: string
  /** 冲突选项的显示名称 */
  name: string
  /** 冲突原因说明 */
  reason: string
}

// 命令行类型
export interface CommandLine {
  name: string
  value?: string
  type: 'command' | 'output' | 'flag'
  isRuntimeMethods?: boolean
  methods?: string[]
  isCustom?: boolean
  /** 来自参考面板选中项的贡献 */
  isRefContrib?: boolean
  rawCommand?: string // 原始命令字符串（用于显示完整的启用值模板格式）
}

// 搜索选项（用于 SearchBtn）
export interface SearchOption {
  option: string
  descri: string
  defaultVal: string
  defaultValDescri: string
  // 用户选择时应该使用的值（如果为空则使用 defaultVal）
  enabledVal?: string
}

// 优化级别选项
export interface OptimizationLevelOption {
  value: 'O0' | 'O1' | 'O2' | 'O3' | 'Os' | 'Oz'
  label: string
  labelKey?: string // i18n key for label
}
