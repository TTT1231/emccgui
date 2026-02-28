import type { OptionConflict } from '@/types'

export const optionConflicts: OptionConflict[] = [
  {
    triggerKey: 'SIDE_MODULE',
    conflictsWith: ['EXPORT_ES6', 'MODULARIZE', 'EXPORT_NAME', 'SINGLE_FILE', 'BIND', 'EMIT_TSD'],
    reason: 'SIDE_MODULE 模式只生成纯 WASM 文件，不包含 JavaScript glue 代码'
  }
]
