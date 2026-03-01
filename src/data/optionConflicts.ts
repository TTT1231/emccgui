import type { OptionConflict } from '@/types'

export const optionConflicts: OptionConflict[] = [
  {
    triggerKey: 'SIDE_MODULE',
    type: 'side-module',
    conflictsWith: [
      'emitTsd',
      'exportES6',
      'modularize',
      'exportName',
      'singleFile',
      'bind'
    ],
    reason: 'SIDE_MODULE 模式只生成纯 WASM 文件，不包含 JavaScript glue 代码'
  }
]
