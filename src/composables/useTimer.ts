import { onUnmounted } from 'vue'

/**
 * 可复用的 Timer 管理 composable
 * 统一处理 setTimeout 的创建、清除和组件卸载时的自动清理
 */
export function useTimer() {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  function setTimer(
    key: string,
    callback: () => void,
    delay: number
  ): void {
    clearTimer(key)
    timers.set(key, setTimeout(callback, delay))
  }

  function clearTimer(key: string): void {
    const timer = timers.get(key)
    if (timer) {
      clearTimeout(timer)
      timers.delete(key)
    }
  }

  function clearAllTimers(): void {
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()
  }

  // 组件卸载时自动清理所有 timer
  onUnmounted(() => clearAllTimers())

  return {
    setTimer,
    clearTimer,
    clearAllTimers,
  }
}
