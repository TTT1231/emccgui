// 主题类型
export type Theme = 'light' | 'dark'

// 输出格式类型
export type OutputFormat = 'js-wasm' | 'wasm-only'

// 优化级别类型
export type OptimizationLevel = 'O0' | 'O1' | 'O2' | 'O3' | 'Os' | 'Oz'

// Tab类型
export type TabName = 'file' | 'compile' | 'reference'

// 文件信息
export interface FileInfo {
  name: string
  path: string
}
