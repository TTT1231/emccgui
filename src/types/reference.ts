// 配置参考选项值类型
export type RefOptionValueType = 'boolean' | 'string' | 'number'

// 配置参考选项
export interface RefOption {
  option: string
  default: string
  description: string
  valueType: RefOptionValueType
  editable: boolean
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

