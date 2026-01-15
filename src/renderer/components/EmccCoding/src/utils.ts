import type { CompileOption, CommandLine } from './type';
import { optionConflicts } from './data';

// 根据输出格式和当前选项状态获取应禁用的选项 keys
export function getConflictedOptions(
   outputFormat: 'js-wasm' | 'wasm-only',
   options: CompileOption[],
): Set<string> {
   const conflictedKeys = new Set<string>();

   // 1. 纯 WASM 输出模式下，所有 jsWasmOnly 选项都无效
   if (outputFormat === 'wasm-only') {
      for (const opt of options) {
         // 使用 isOptionReallyEnabled 来检查选项是否真正启用（包括依赖检查）
         if (opt.jsWasmOnly && isOptionReallyEnabled(opt, options)) {
            conflictedKeys.add(opt.key);
         }
      }
   }

   // 2. 检查启用的选项是否触发冲突规则
   for (const conflict of optionConflicts) {
      const triggerOpt = options.find(opt => opt.key === conflict.triggerKey);
      if (triggerOpt?.enabled) {
         // 如果触发选项已启用，则所有冲突选项应该被禁用
         for (const conflictKey of conflict.conflictsWith) {
            const conflictOpt = options.find(opt => opt.key === conflictKey);
            // 使用 isOptionReallyEnabled 来检查选项是否真正启用
            if (conflictOpt && isOptionReallyEnabled(conflictOpt, options)) {
               conflictedKeys.add(conflictKey);
            }
         }
      }
   }

   return conflictedKeys;
}

// 获取冲突描述信息
export function getConflictReason(
   optionKey: string,
   outputFormat: 'js-wasm' | 'wasm-only',
   options: CompileOption[],
): string | null {
   const opt = options.find(o => o.key === optionKey);
   if (!opt) return null;

   // 检查纯 WASM 模式冲突
   if (outputFormat === 'wasm-only') {
      if (opt?.jsWasmOnly && isOptionReallyEnabled(opt, options)) {
         return '此选项需要 JavaScript glue 代码，纯 WASM 模式下不生成 JS 文件';
      }
   }

   // 检查选项间冲突规则
   for (const conflict of optionConflicts) {
      const triggerOpt = options.find(opt => opt.key === conflict.triggerKey);
      if (triggerOpt?.enabled && conflict.conflictsWith.includes(optionKey)) {
         return conflict.reason;
      }
   }

   return null;
}

// 生成完整命令字符串辅助函数
export function formatCommandLine(line: CommandLine): string {
   if (!line.value) return line.name;
   // -o 和 emcc 后面用空格
   if (line.type === 'command' || line.type === 'output') {
      return `${line.name} ${line.value}`;
   }
   // 所有 flag 类型都用等号连接
   return `${line.name}=${line.value}`;
}

// 根据编译选项生成命令行参数
export function generateCommandFromOption(option: CompileOption): CommandLine | null {
   if (!option.enabled) return null;

   // 如果有依赖项，需要外部检查依赖是否启用
   const cmdName =
      option.cmdPrefix === '-s'
         ? `${option.cmdPrefix}${option.cmdName}`
         : `${option.cmdPrefix}${option.cmdName}`;

   switch (option.formatType) {
      case 'arg':
         // 无值参数，如 -g, -pthread
         return { name: cmdName, type: 'flag' };
      case 'setting':
         // 空格连接，如 --emit-tsd module.d.ts
         return {
            name: cmdName,
            value: String(option.defaultValue),
            type: 'flag',
         };
      case 'flag':
         // 等号连接，如 -sEXPORT_ES6=1
         return {
            name: cmdName,
            value: String(option.defaultValue),
            type: 'flag',
         };
      default:
         return null;
   }
}

// 辅助函数：根据 key 获取编译选项
function getOptionByKey(options: CompileOption[], key: string): CompileOption | undefined {
   return options.find(opt => opt.key === key);
}

// 辅助函数：检查选项是否真正启用（包括依赖检查）
export function isOptionReallyEnabled(option: CompileOption, allOptions: CompileOption[]): boolean {
   if (!option.enabled) return false;
   if (option.dependsOn) {
      const dep = getOptionByKey(allOptions, option.dependsOn);
      if (!dep?.enabled) return false;
   }
   return true;
}
