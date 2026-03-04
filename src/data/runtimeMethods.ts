import type { RuntimeMethodDef } from '@/types'

export const runtimeMethodsData: RuntimeMethodDef[] = [
  {
    key: 'ccall',
    name: 'ccall',
    hint: 'Directly call C functions with automatic parameter and return value type conversion',
    hintZh: '直接调用 C 函数，自动处理参数和返回值类型转换'
  },
  {
    key: 'cwrap',
    name: 'cwrap',
    hint: 'Wrap C functions as reusable JavaScript functions',
    hintZh: '将 C 函数包装为可复用的 JavaScript 函数'
  },
  {
    key: 'getValue',
    name: 'getValue',
    hint: 'Read value from specified address in WASM memory',
    hintZh: '从 WASM 内存指定地址读取值'
  },
  {
    key: 'setValue',
    name: 'setValue',
    hint: 'Write value to specified address in WASM memory',
    hintZh: '向 WASM 内存指定地址写入值'
  }
]
