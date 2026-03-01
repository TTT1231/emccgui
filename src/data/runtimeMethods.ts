import type { RuntimeMethodDef } from '@/types'

export const runtimeMethodsData: RuntimeMethodDef[] = [
  {
    key: 'ccall',
    name: 'ccall',
    hint: '直接调用 C 函数，自动处理参数和返回值类型转换'
  },
  {
    key: 'cwrap',
    name: 'cwrap',
    hint: '包装 C 函数为可复用的 JavaScript 函数'
  },
  {
    key: 'getValue',
    name: 'getValue',
    hint: '从 WASM 内存中读取指定地址的值'
  },
  {
    key: 'setValue',
    name: 'setValue',
    hint: '向 WASM 内存中写入值到指定地址'
  },
  {
    key: 'UTF8ToString',
    name: 'UTF8ToString',
    hint: 'C字符串指针转JS字符串'
  },
  {
    key: 'stringToUTF8',
    name: 'stringToUTF8',
    hint: 'JS字符串转C字符串指针'
  }
]
