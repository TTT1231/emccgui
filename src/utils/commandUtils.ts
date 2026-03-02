/**
 * 命令行相关工具函数
 */
import type { CompileOptionState } from '@/types'

/**
 * 检查选项是否真正启用（考虑依赖关系）
 * - 选项本身的 enabled 必须为 true
 * - 如果有 dependsOn，依赖项也必须启用
 */
export function isOptionReallyEnabled(
  opt: CompileOptionState,
  allOptions: readonly CompileOptionState[]
): boolean {
  if (!opt.enabled) return false
  if (opt.dependsOn) {
    const depOpt = allOptions.find(o => o.key === opt.dependsOn)
    if (!depOpt?.enabled) return false
  }
  return true
}

/**
 * 解析命令模板，将 {value} 替换为实际值
 * @example
 * resolveEnabledValue('-g{value}', '3') // => '-g3'
 * resolveEnabledValue('-sFLAG={value}', 'foo') // => '-sFLAG=foo'
 * resolveEnabledValue('-O2', '') // => '-O2'
 */
export function resolveEnabledValue(template: string, value: string): string {
  if (template.includes('{value}')) {
    return template.replace('{value}', value)
  }
  return template
}

/**
 * 格式化命令行为字符串
 */
export function formatCommandLine(cmd: string | { name: string; value?: string }): string {
  if (typeof cmd === 'string') {
    const eqIndex = cmd.indexOf('=')
    if (eqIndex > 0) {
      return cmd
    }
    return cmd
  }
  // CommandLine 对象
  if (cmd.value !== undefined) {
    return `${cmd.name}=${cmd.value}`
  }
  return cmd.name
}

/**
 * 从选项数组中根据 key 查找选项
 */
export function getOptionByKey<T extends { key: string }>(
  key: string,
  options: readonly T[]
): T | undefined {
  return options.find(opt => opt.key === key)
}

/**
 * 从命令字符串中提取命令名称（去除等号及后面的值）
 * @example
 * extractCommandName('-sEXPORTED_FUNCTIONS="foo,bar"') // => '-sEXPORTED_FUNCTIONS'
 * extractCommandName('-O2') // => '-O2'
 */
export function extractCommandName(command: string): string {
  const eqIndex = command.indexOf('=')
  return eqIndex > 0 ? command.substring(0, eqIndex) : command
}

/**
 * 检查两个命令是否同名（忽略值部分）
 */
export function isSameCommand(cmd1: string, cmd2: string): boolean{
  return extractCommandName(cmd1) === extractCommandName(cmd2)
}

/**
 * 解析命令行参数，分离命令名和值
 * @example
 * parseCommand('-sFLAG=value') // => { name: '-sFLAG', value: 'value' }
 * parseCommand('-O2') // => { name: '-O2', value: undefined }
 */
export function parseCommand(command: string): { name: string; value: string | undefined }{
  const eqIndex = command.indexOf('=')
  if (eqIndex > 0){
    return {
      name: command.substring(0, eqIndex),
      value: command.substring(eqIndex + 1),
    }
  }
  return { name: command, value: undefined }
}

/**
 * 将命令名和值组合成完整命令字符串
 */
export function buildCommand(name: string, value?: string): string{
  if (value === undefined){
    return name
  }
  return `${name}=${value}`
}
