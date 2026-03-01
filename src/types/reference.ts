// 配置参考选项值类型
export type RefOptionValueType = 'boolean' | 'string' | 'number'

// 配置参考选项
export interface RefOption {
  option: string
  default: string
  description: string
  valueType: RefOptionValueType
  editable: boolean
  /** 选中后生成的命令片段 */
  enabledValue: string
  /**
   * number / string 类型首次点击选中时使用的初始值（缺省则用 default）
   *
   * 适用范围：
   *   ✅ valueType === 'number'  — 例：default=0 但启用时应填 2（-sUSE_SDL）
   *   ✅ valueType === 'string'  — 例：default 为占位符，启用时需要有意义的初始值
   *   ❌ valueType === 'boolean' — boolean 选中永远存 true(→1)，此字段无效
   *
   * 典型场景：
   *   default 与「用户期望的启用值」不同时使用，例如默认 1 但选中应填 0
   */
  initialValue?: string
  /**
   * 单选组名称，同组内只允许同时选中一项（Radio 行为）
   * 例：优化级别 -O0/-O1/-O2/-O3/-Os/-Oz 同属 'optimization' 组
   */
  radioGroup?: string
}

// 配置参考分类
export interface RefCategory {
  name: string
  icon: string
  options: RefOption[]
}

// 配置参考数据
export interface RefConfigData {
  categories: RefCategory[]
}

