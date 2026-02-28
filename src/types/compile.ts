// 选项值类型
export type OptionValueType = 'boolean' | 'string' | 'select'

// 选项格式类型
export type OptionFormatType = 'setting' | 'arg'

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
  defaultValue: boolean | string
  formatType: OptionFormatType
  jsWasmOnly?: boolean
  hint: string
  category: string
  hasInput?: boolean
  inputPlaceholder?: string
  selectOptions?: readonly SelectOption[]
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
  conflictsWith: string[]
  reason: string
}
