import type { CompileOptionState, CommandLine, OptionConflict, OutputFormat } from '@/types'

// 根据输出格式和当前选项状态获取应禁用的选项 keys
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
export function formatCommandLine(line: CommandLine): string {
  // 如果有 rawCommand（使用 enabledValue 模板生成的），直接返回
  if (line.rawCommand) return line.rawCommand

  if (!line.value) return line.name
  // -o 和 emcc 后面用空格
  if (line.type === 'command' || line.type === 'output') {
    return `${line.name} ${line.value}`
  }
  // 所有 flag 类型都用等号连接
  return `${line.name}=${line.value}`
}

// 辅助函数：根据 key 获取编译选项（导出供其他模块使用）
export function getOptionByKey(options: readonly CompileOptionState[], key: string): CompileOptionState | undefined {
  return options.find(opt => opt.key === key)
}

/**
 * 将 enabledValue 模板中的 {value} 占位符替换为用户实际输入的值。
 *
 * 规则：
 * - 含 {value} → 替换为 userValue（若 userValue 为空则保留占位符原样）
 * - 不含 {value} → 直接返回 enabledValue（boolean 开关类，如 -sMODULARIZE）
 *
 * @example
 * resolveEnabledValue("-o {value}", "qwe.out.js")  // → "-o qwe.out.js"
 * resolveEnabledValue("-sEXPORT_NAME={value}", "MyModule")  // → "-sEXPORT_NAME=MyModule"
 * resolveEnabledValue("-sMODULARIZE", "")  // → "-sMODULARIZE"
 * resolveEnabledValue("-g{value}", "2")  // → "-g2"
 */
export function resolveEnabledValue(enabledValue: string, userValue: string): string {
  if (!enabledValue.includes('{value}')) return enabledValue
  const v = userValue.trim()
  return v ? enabledValue.replace('{value}', v) : enabledValue
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
