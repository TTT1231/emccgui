import type { CompileOptionState, CommandLine, OptionConflict } from '@/types'

// 根据输出格式和当前选项状态获取应禁用的选项 keys
export function getConflictedOptions(
  outputFormat: 'js-wasm' | 'wasm-only',
  options: readonly CompileOptionState[],
  optionConflicts: OptionConflict[]
): Set<string> {
  const conflictedKeys = new Set<string>()

  // 1. 纯 WASM 输出模式下，所有 jsWasmOnly 选项都无效
  if (outputFormat === 'wasm-only') {
    for (const opt of options) {
      if (opt.jsWasmOnly && isOptionReallyEnabled(opt, options)) {
        conflictedKeys.add(opt.key)
      }
    }
  }

  // 2. 检查启用的选项是否触发冲突规则
  for (const conflict of optionConflicts) {
    const triggerOpt = options.find(opt => opt.key === conflict.triggerKey)
    if (triggerOpt?.enabled) {
      for (const conflictKey of conflict.conflictsWith) {
        const conflictOpt = options.find(opt => opt.key === conflictKey)
        if (conflictOpt && isOptionReallyEnabled(conflictOpt, options)) {
          conflictedKeys.add(conflictKey)
        }
      }
    }
  }

  return conflictedKeys
}

// 获取冲突描述信息
export function getConflictReason(
  optionKey: string,
  outputFormat: 'js-wasm' | 'wasm-only',
  options: readonly CompileOptionState[],
  optionConflicts: OptionConflict[]
): string | null {
  const opt = options.find(o => o.key === optionKey)
  if (!opt) return null

  // 检查纯 WASM 模式冲突
  if (outputFormat === 'wasm-only') {
    if (opt?.jsWasmOnly && isOptionReallyEnabled(opt, options)) {
      return '此选项需要 JavaScript glue 代码，纯 WASM 模式下不生成 JS 文件'
    }
  }

  // 检查选项间冲突规则
  for (const conflict of optionConflicts) {
    const triggerOpt = options.find(opt => opt.key === conflict.triggerKey)
    if (triggerOpt?.enabled && conflict.conflictsWith.includes(optionKey)) {
      return conflict.reason
    }
  }

  return null
}

// 生成完整命令字符串辅助函数
export function formatCommandLine(line: CommandLine): string {
  if (!line.value) return line.name
  // -o 和 emcc 后面用空格
  if (line.type === 'command' || line.type === 'output') {
    return `${line.name} ${line.value}`
  }
  // 所有 flag 类型都用等号连接
  return `${line.name}=${line.value}`
}

// 辅助函数：根据 key 获取编译选项
function getOptionByKey(options: readonly CompileOptionState[], key: string): CompileOptionState | undefined {
  return options.find(opt => opt.key === key)
}

// 辅助函数：检查选项是否真正启用（包括依赖检查）
export function isOptionReallyEnabled(option: CompileOptionState, allOptions: readonly CompileOptionState[]): boolean {
  if (!option.enabled) return false
  if (option.dependsOn) {
    const dep = getOptionByKey(allOptions, option.dependsOn)
    if (!dep?.enabled) return false
  }
  return true
}
