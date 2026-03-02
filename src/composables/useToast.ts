import { ref } from 'vue'
import { useTimer } from './useTimer'

export interface ToastOptions {
  duration?: number
  type?: 'success' | 'error' | 'info' | 'warning'
}

const visible = ref(false)
const message = ref('')
const toastType = ref<ToastOptions['type']>('success')
const defaultDuration = 2000

// 全局 toast 状态（单例模式）
let toastInstance: ReturnType<typeof createToastState> | null = null

function createToastState() {
  const { setTimer, clearTimer } = useTimer()

  function show(msg: string, options?: ToastOptions): void {
    const duration = options?.duration ?? defaultDuration

    message.value = msg
    toastType.value = options?.type ?? 'success'
    visible.value = true

    clearTimer('toast')
    setTimer('toast', () => {
      visible.value = false
    }, duration)
  }

  function hide(): void {
    clearTimer('toast')
    visible.value = false
  }

  function success(msg: string, duration?: number): void {
    show(msg, { type: 'success', duration })
  }

  function error(msg: string, duration?: number): void {
    show(msg, { type: 'error', duration })
  }

  function info(msg: string, duration?: number): void {
    show(msg, { type: 'info', duration })
  }

  function warning(msg: string, duration?: number): void {
    show(msg, { type: 'warning', duration })
  }

  return {
    visible,
    message,
    toastType,
    show,
    hide,
    success,
    error,
    info,
    warning,
  }
}

/**
 * 全局 Toast composable
 * 使用单例模式确保全局只有一个 toast 状态
 */
export function useToast() {
  if (!toastInstance) {
    toastInstance = createToastState()
  }
  return toastInstance
}

/**
 * 创建独立的 Toast 状态（用于需要独立 toast 的场景）
 */
export function createToast() {
  return createToastState()
}
