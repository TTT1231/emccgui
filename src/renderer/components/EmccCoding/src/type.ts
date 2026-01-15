import { optimizationLevels } from './data';

// 编译选项值类型
type CompileOptionValueType = 'boolean' | 'string' | 'number' | 'select';

// 编译选项格式类型
type CommandFormatType = 'flag' | 'setting' | 'arg';

// 选项冲突类型
type ConflictType = 'wasm-only' | 'side-module';

// 选项冲突规则
export interface OptionConflict {
   // 触发冲突的选项 key
   triggerKey: string;
   // 冲突类型
   type: ConflictType;
   // 与触发选项冲突的选项 keys
   conflictsWith: string[];
   // 冲突描述（用于提示用户）
   reason: string;
}
// 下拉选项类型
export interface SelectOption {
   value: string;
   label: string;
}
// 编译选项类型
export interface CompileOption {
   key: string; // 唯一标识符
   name: string; // 显示名称
   enabled: boolean; // 是否启用
   // 命令行相关
   cmdPrefix: string; // 命令行前缀，如 '-s', '--', '-'
   cmdName: string; // 命令行名称，如 'EXPORT_ES6', 'emit-tsd'
   // 值相关
   valueType: CompileOptionValueType; // 值类型
   defaultValue?: string | number | boolean; // 默认值
   currentValue?: string; // 当前值（用于可编辑的选项）
   selectOptions?: SelectOption[]; // 下拉选项（用于 select 类型）
   // 格式相关
   formatType: CommandFormatType; // 格式类型: flag(=连接), setting(空格连接), arg(无值)
   // 条件限制
   jsWasmOnly?: boolean; // 是否仅在 js-wasm 输出模式下可用
   dependsOn?: string; // 依赖的其他选项 key
   // UI 相关
   hasInput?: boolean; // 是否需要用户输入
   inputPlaceholder?: string; // 输入框占位符
   inputLabel?: string; // 输入框标签
   // 提示信息
   hint: string;
}

// 运行时方法选项
export interface RuntimeMethodOption {
   key: string;
   name: string;
   enabled: boolean;
   hint: string;
}

// 命令行生成相关类型
export interface CommandLine {
   name: string;
   value?: string;
   type: 'command' | 'output' | 'flag';
   isRuntimeMethods?: boolean;
   methods?: string[];
   customMethods?: string[]; // 自定义运行时方法
   isCustom?: boolean; // 用户手动添加的自定义命令
}

export type OptimizationLevelsType = (typeof optimizationLevels)[number]['value'];
