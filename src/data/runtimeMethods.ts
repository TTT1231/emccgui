import type { RuntimeMethodDef } from '@/types'

export const runtimeMethodsData: RuntimeMethodDef[] = [
  {
    key: 'ccall',
    name: 'ccall',
    hint: 'Directly call C functions with automatic parameter and return value type conversion'
  },
  {
    key: 'cwrap',
    name: 'cwrap',
    hint: 'Wrap C functions as reusable JavaScript functions'
  },
  {
    key: 'getValue',
    name: 'getValue',
    hint: 'Read value from specified address in WASM memory'
  },
  {
    key: 'setValue',
    name: 'setValue',
    hint: 'Write value to specified address in WASM memory'
  }
]
