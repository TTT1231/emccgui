import { computed } from 'vue'
import { useCompileStore } from '@/stores/useCompileStore'

/**
 * 搜索高亮 composable
 * 用于在搜索结果中高亮显示匹配的文本
 */
export function useHighlight() {
  const store = useCompileStore()

  /**
   * 转义 HTML 特殊字符，防止 XSS
   */
  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  /**
   * 高亮文本中匹配搜索关键词的部分
   * @param text 原始文本
   * @returns 包含 <mark> 标签的 HTML 字符串
   */
  const highlightText = computed(() => {
    return (text: string): string => {
      const query = store.refSearchQuery.trim()
      if (!query) {
        return escapeHtml(text)
      }

      // 转义搜索词中的正则特殊字符
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escapedQuery})`, 'gi')

      // 分割文本，对匹配部分包裹 <mark> 标签
      return escapeHtml(text).replace(regex, '<mark class="highlight">$1</mark>')
    }
  })

  return {
    highlightText,
  }
}
