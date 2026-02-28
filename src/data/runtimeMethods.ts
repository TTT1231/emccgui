import type { RuntimeMethodDef } from '@/types'

export const runtimeMethodsData: RuntimeMethodDef[] = [
  { key: 'ccall', name: 'ccall', hint: '调用 C 函数' },
  { key: 'cwrap', name: 'cwrap', hint: '包装 C 函数' },
  { key: 'getValue', name: 'getValue', hint: '读取内存值' },
  { key: 'setValue', name: 'setValue', hint: '写入内存值' },
  { key: 'UTF8ToString', name: 'UTF8ToString', hint: 'UTF8 字符串转换' },
  { key: 'stringToUTF8', name: 'stringToUTF8', hint: '字符串转 UTF8' },
  { key: 'lengthBytesUTF8', name: 'lengthBytesUTF8', hint: '计算 UTF8 长度' },
  { key: 'HEAP8', name: 'HEAP8', hint: '8位堆视图' },
  { key: 'HEAP16', name: 'HEAP16', hint: '16位堆视图' },
  { key: 'HEAP32', name: 'HEAP32', hint: '32位堆视图' },
  { key: 'HEAPF32', name: 'HEAPF32', hint: '32位浮点堆视图' },
  { key: 'HEAPF64', name: 'HEAPF64', hint: '64位浮点堆视图' }
]
