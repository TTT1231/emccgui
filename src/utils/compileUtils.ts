import type { CompileOptionState, OptionConflict, OutputFormat, ConflictInfo } from '@/types'
import { isOptionReallyEnabled } from './commandUtils'

// 注：此函数已被 getActiveConflicts 替代
export function getConflictedOptions(
  outputFormat: OutputFormat,
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
    if (!triggerOpt?.enabled) continue
    for (const conflictKey of conflict.conflictsWith) {
      const conflictOpt = options.find(opt => opt.key === conflictKey)
      if (conflictOpt && isOptionReallyEnabled(conflictOpt, options)) {
        conflictedKeys.add(conflictKey)
      }
    }
  }

  return conflictedKeys
}

/**
 * 获取冲突描述信息
 */
export function getConflictReason(
  optionKey: string,
  outputFormat: OutputFormat,
  options: readonly CompileOptionState[],
  optionConflicts: OptionConflict[]
): string | null {
  const opt = options.find(o => o.key === optionKey)
  if (!opt) return null

  // 检查纯 WASM 模式冲突
  if (outputFormat === 'wasm-only' && opt.jsWasmOnly && isOptionReallyEnabled(opt, options)) {
    return '此选项需要 JavaScript glue 代码，纯 WASM 模式下不生成 JS 文件'
  }

  // 检查选项间冲突规则
  for (const conflict of optionConflicts) {
    const triggerOpt = options.find(o => o.key === conflict.triggerKey)
    if (triggerOpt?.enabled && conflict.conflictsWith.includes(optionKey)) {
      return conflict.reason
    }
  }

  return null
}

// 生成完整命令字符串辅助函数
export { formatCommandLine } from './commandUtils'

// 辅助函数：根据 key 获取编译选项（导出供其他模块使用）
export { getOptionByKey } from './commandUtils'

export { resolveEnabledValue } from './commandUtils'

export { isOptionReallyEnabled } from './commandUtils'

/**
 * 统一冲突检测——返回结构化 ConflictInfo[] 列表。
 *
 * 同时处理两类冲突：
 *  1. 纯 WASM 模式下，已启用的 jsWasmOnly 选项
 *  2. 显式冲突规则（optionConflicts）触发的选项
 *
 * 每个冲突仅报告一次（以 key 去重）。
 */
export function getActiveConflicts(
  outputFormat: OutputFormat,
  options: readonly CompileOptionState[],
  optionConflicts: OptionConflict[]
): ConflictInfo[] {
  const seen = new Set<string>()
  const result: ConflictInfo[] = []

  const add = (opt: CompileOptionState, reason: string) => {
    if (seen.has(opt.key)) return
    seen.add(opt.key)
    result.push({ key: opt.key, name: opt.name, reason })
  }

  // 1. wasm-only 模式下 jsWasmOnly 选项冲突
  if (outputFormat === 'wasm-only') {
    for (const opt of options) {
      if (opt.jsWasmOnly && isOptionReallyEnabled(opt, options)) {
        add(opt, '此选项需要 JavaScript glue 代码,纯 WASM 模式下不生成 JS 文件')
      }
    }
  }

  // 2. 显式冲突规则
  for (const conflict of optionConflicts) {
    const triggerOpt = options.find(o => o.key === conflict.triggerKey)
    if (!triggerOpt?.enabled) continue
    for (const conflictKey of conflict.conflictsWith) {
      const conflictOpt = options.find(o => o.key === conflictKey)
      if (conflictOpt && isOptionReallyEnabled(conflictOpt, options)) {
        add(conflictOpt, conflict.reason)
      }
    }
  }

  return result
}
