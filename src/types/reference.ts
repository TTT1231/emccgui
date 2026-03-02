// 配置参考选项值类型
// string-array: 值为数组格式，允许逗号分隔字符串或 JS 数组语法 (e.g. _func1,_func2 or ['_func1','_func2'])
export type RefOptionValueType = 'boolean' | 'string' | 'number' | 'string-array'

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
  /**
   * 动态默认值函数，当默认值依赖外部状态时使用（优先级高于 default）
   * 参数为当前优化级别，返回对应的默认值字符串
   * 例：-sASSERTIONS 在 -O0 时默认为 1，其他优化级别默认为 0
   */
  dynamicDefault?: (optimizationLevel: string) => string
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

