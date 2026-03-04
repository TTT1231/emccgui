<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

import type { SearchOption } from '@/types'
import optionsData from '@/data/options.json'

const { t } = useI18n()

// 接收已存在的自定义命令列表
const props = defineProps<{
  existingCommands?: string[]
}>()

const emit = defineEmits<{
  handleAdd: [value: string]
  handleRevoke: []
}>()

const searchValue = ref('')
const inputRef = ref<HTMLInputElement>()
const inputWrapperRef = ref<HTMLDivElement>()
const showSuggestions = ref(false)
const activeIndex = ref(0)
const triggerChar = '@'

// 建议列表显示位置（向上或向下）
const dropdownDirection = ref<'up' | 'down'>('down')

// 反馈消息
type FeedbackType = 'error' | 'warn'
const feedbackMsg = ref('')
const feedbackType = ref<FeedbackType>('error')
let feedbackTimer: ReturnType<typeof setTimeout> | null = null

function showFeedback(msg: string, type: FeedbackType = 'error') {
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackMsg.value = msg
  feedbackType.value = type
  feedbackTimer = setTimeout(() => {
    feedbackMsg.value = ''
    feedbackTimer = null
  }, 2800)
}

/**
 * 校验是否为合法 emcc 命令（必须以 - 开头且长度 >= 2）
 * 合法前缀：--xxx / -sXXX / -Ox / -gx / -fxxx / -pthread / -I / -L / -l / -D / -W 等
 */
function isValidEmccCommand(cmd: string): boolean {
  const name = cmd.indexOf('=') > 0 ? cmd.substring(0, cmd.indexOf('=')) : cmd
  return name.length >= 2 && name.startsWith('-')
}

// 从 options.json 加载选项数据
const allOptions = ref<SearchOption[]>(optionsData as SearchOption[])

import { extractCommandName } from '@/utils/commandUtils'

// 检查命令是否已存在
const isCommandDuplicate = (newCommand: string): boolean => {
  if (!props.existingCommands || props.existingCommands.length === 0) {
    return false
  }

  const newCommandName = extractCommandName(newCommand)

  return props.existingCommands.some(existingCmd => {
    const existingCommandName = extractCommandName(existingCmd)
    return existingCommandName === newCommandName
  })
}

// 过滤匹配的选项
const filteredOptions = computed(() => {
  const triggerIndex = searchValue.value.lastIndexOf(triggerChar)

  if (triggerIndex === -1) {
    return []
  }

  const searchTerm = searchValue.value
    .slice(triggerIndex + 1)
    .toLowerCase()
    .trim()

  if (!searchTerm) {
    return allOptions.value
  }

  const regex = new RegExp(searchTerm.split('').join('.*'), 'i')

  return allOptions.value.filter(opt => {
    return regex.test(opt.option) || regex.test(opt.descri)
  })
})

// 检查是否应该显示建议列表
const shouldShowSuggestions = computed(() => {
  return showSuggestions.value && filteredOptions.value.length > 0
})

// 计算下拉列表应该显示的方向
const calculateDropdownDirection = () => {
  nextTick(() => {
    if (!inputWrapperRef.value) return

    const rect = inputWrapperRef.value.getBoundingClientRect()
    const dropdownHeight = 320
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      dropdownDirection.value = 'up'
    } else {
      dropdownDirection.value = 'down'
    }
  })
}

// 添加选项
const handleAdd = () => {
  if (!searchValue.value.trim()) {
    return
  }

  const commandToAdd = searchValue.value.trim()

  // 校验是否为合法 emcc 命令
  if (!isValidEmccCommand(commandToAdd)) {
    showFeedback(t('search.invalidCommand'), 'error')
    return
  }

  if (isCommandDuplicate(commandToAdd)) {
    showFeedback(t('search.duplicateCommand'), 'warn')
    return
  }

  emit('handleAdd', commandToAdd)
  searchValue.value = ''
  showSuggestions.value = false
  feedbackMsg.value = ''
}

// 撤销
const handleUndo = () => {
  emit('handleRevoke')
}

// 处理键盘事件
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    if (shouldShowSuggestions.value && filteredOptions.value[activeIndex.value]) {
      e.preventDefault()
      const selectedOption = filteredOptions.value[activeIndex.value]
      if (selectedOption) {
        handleSuggestionClick(selectedOption)
      }
    } else {
      handleAdd()
    }
    return
  }

  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault()
    handleUndo()
    return
  }

  if (shouldShowSuggestions.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      activeIndex.value = (activeIndex.value + 1) % filteredOptions.value.length
      scrollToActiveItem()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      activeIndex.value =
        (activeIndex.value - 1 + filteredOptions.value.length) % filteredOptions.value.length
      scrollToActiveItem()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      showSuggestions.value = false
      activeIndex.value = 0
    }
  }
}

// 应用选中的建议
const applySuggestion = (option: string) => {
  const triggerIndex = searchValue.value.lastIndexOf(triggerChar)

  if (triggerIndex !== -1) {
    const before = searchValue.value.slice(0, triggerIndex)
    searchValue.value = before + option
  } else {
    searchValue.value = option
  }

  showSuggestions.value = false
  activeIndex.value = 0

  nextTick(() => {
    inputRef.value?.focus()
    const length = searchValue.value.length
    inputRef.value?.setSelectionRange(length, length)
  })
}

// 点击建议项
const handleSuggestionClick = (option: SearchOption) => {
  // 如果有 enabledVal，直接使用它作为完整命令
  if (option.enabledVal) {
    // 检查是否包含 {value} 占位符（需要用户输入的选项）
    if (option.enabledVal.includes('{value}')) {
      // 对于需要用户输入的选项，使用 option 的默认值替换
      const defaultCmd = option.enabledVal.replace('{value}', option.defaultVal)
      applySuggestion(defaultCmd)
    } else {
      // 布尔选项或固定值选项，直接使用 enabledVal
      applySuggestion(option.enabledVal)
    }
  } else {
    // 没有 enabledVal 的选项，使用 option 本身
    applySuggestion(option.option)
  }
}

// 滚动到活动项
const scrollToActiveItem = () => {
  nextTick(() => {
    const activeElement = document.querySelector('.suggestion-item.active') as HTMLElement
    if (activeElement) {
      activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  })
}

// 监听输入变化
watch(searchValue, newValue => {
  const hasTrigger = newValue.includes(triggerChar)

  if (hasTrigger) {
    showSuggestions.value = true
    activeIndex.value = 0
    calculateDropdownDirection()
  } else {
    showSuggestions.value = false
  }
})

// 处理输入框失焦
const handleBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

// 处理输入框聚焦
const handleFocus = () => {
  const hasTrigger = searchValue.value.includes(triggerChar)
  if (hasTrigger) {
    showSuggestions.value = true
    calculateDropdownDirection()
  }
}
</script>

<template>
  <div class="search-btn-container">
    <div ref="inputWrapperRef" class="input-wrapper">
      <span class="input-icon">⚡</span>
      <input
        ref="inputRef"
        v-model="searchValue"
        type="text"
        class="search-input"
        :class="{ 'search-input--error': feedbackType === 'error' && feedbackMsg, 'search-input--warn': feedbackType === 'warn' && feedbackMsg }"
        :placeholder="t('search.placeholder')"
        @keydown="handleKeyDown"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      <!-- 建议列表 -->
      <Transition name="suggestions">
        <div
          v-if="shouldShowSuggestions"
          class="suggestions-dropdown"
          :class="`dropdown-${dropdownDirection}`"
        >
          <div class="suggestions-header">
            <span class="suggestions-count">{{ filteredOptions.length }} {{ t('search.optionsCount') }}</span>
            <span class="suggestions-hint">{{ t('search.selectHint') }}</span>
          </div>
          <div class="suggestions-list">
            <div
              v-for="(option, index) in filteredOptions"
              :key="option.option"
              class="suggestion-item"
              :class="{ active: index === activeIndex }"
              @click="handleSuggestionClick(option)"
              @mouseenter="activeIndex = index"
            >
              <div class="suggestion-content">
                <div class="suggestion-left">
                  <div class="suggestion-option">
                    <span class="option-name">{{ option.option }}</span>
                  </div>
                  <div class="suggestion-desc">{{ option.descri }}</div>
                </div>
                <div class="suggestion-right">
                  <span class="default-value">{{
                    option.defaultValDescri === '-' ? t('search.none') : option.defaultValDescri
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
    <button class="add-btn" @click="handleAdd" :disabled="!searchValue.trim()" :title="t('compile.addCommand')">
      <span class="btn-icon">+</span>
      <span class="btn-text">{{ t('search.addBtn') }}</span>
    </button>
    <button class="undo-btn" @click="handleUndo" :title="t('compile.undoTooltip')">
      <span class="btn-icon">↩</span>
    </button>
    <!-- 反馈消息（绝对定位，不占文档流）-->
    <Transition name="feedback">
      <div
        v-if="feedbackMsg"
        class="feedback-message"
        :class="`feedback-${feedbackType}`"
      >
        <span class="feedback-icon">{{ feedbackType === 'error' ? '✕' : '⚠' }}</span>
        <span>{{ feedbackMsg }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.search-btn-container {
  position: relative;
  display: flex;
  gap: 10px;
  align-items: stretch;
  /* 反馈消息绝对定位的参照 */
}

.input-wrapper {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  overflow: visible;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
}

.input-icon {
  padding: 0 12px;
  font-size: 1em;
  pointer-events: none;
  user-select: none;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  padding: 10px 12px 10px 0;
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--text-primary);
  outline: none;
  background: transparent;
  border: none;
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.search-input:focus {
  border: none;
  box-shadow: none;
}

.suggestions-dropdown {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  max-height: 320px;
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow-color), 0 8px 24px color-mix(in srgb, var(--shadow-color) 50%, transparent);
}

.suggestions-dropdown.dropdown-down {
  top: calc(100% + 8px);
  transform-origin: top center;
}

.suggestions-dropdown.dropdown-up {
  bottom: calc(100% + 8px);
  transform-origin: bottom center;
}

.suggestions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 0.75em;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.suggestions-count {
  font-weight: 600;
  color: var(--text-primary);
}

.suggestions-hint {
  font-size: 0.9em;
  color: var(--text-secondary);
  opacity: 0.8;
}

.suggestions-list {
  max-height: 280px;
  padding: 4px;
  overflow-y: auto;
}

.suggestions-list::-webkit-scrollbar {
  width: 6px;
}

.suggestions-list::-webkit-scrollbar-track {
  background: transparent;
}

.suggestions-list::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

.suggestions-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

.suggestion-item {
  padding: 10px 12px;
  margin-bottom: 2px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.suggestion-item:hover {
  background: color-mix(in srgb, var(--accent) 10%, var(--bg-primary));
}

.suggestion-item.active {
  background: var(--accent);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent);
}

.suggestion-item.active .option-name,
.suggestion-item.active .suggestion-desc {
  color: white;
}

.suggestion-item.active .default-value {
  font-weight: 600;
  color: var(--accent);
  background: white;
  border-color: white;
  opacity: 1;
}

.suggestion-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.suggestion-left {
  flex: 1;
  min-width: 0;
}

.suggestion-right {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}

.suggestion-option {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
}

.option-name {
  font-family: var(--font-mono);
  font-size: 0.85em;
  font-weight: 600;
  color: var(--accent);
  word-break: break-all;
}

.suggestion-desc {
  font-size: 0.8em;
  line-height: 1.4;
  color: var(--text-secondary);
  opacity: 0.9;
}

.default-value {
  padding: 2px 8px;
  font-family: var(--font-mono);
  font-size: 0.75em;
  color: var(--text-secondary);
  white-space: nowrap;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 4px;
  opacity: 0.8;
  transition: all 0.15s ease;
}

/* ===== Action Buttons ===== */
.add-btn {
  position: relative;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 11px 18px;
  font-size: 0.9em;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  cursor: pointer;
  background: linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 85%, black) 100%);
  border: 1px solid transparent;
  border-radius: 10px;
  box-shadow:
    0 1px 2px color-mix(in srgb, black 10%, transparent),
    0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 20%, transparent);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.add-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, color-mix(in srgb, white 15%, transparent) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.add-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--accent-hover) 0%, color-mix(in srgb, var(--accent-hover) 80%, black) 100%);
  box-shadow:
    0 2px 4px color-mix(in srgb, black 15%, transparent),
    0 8px 20px color-mix(in srgb, var(--accent) 35%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 25%, transparent);
  transform: translateY(-2px);
}

.add-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.add-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow:
    0 1px 2px color-mix(in srgb, black 10%, transparent),
    0 2px 8px color-mix(in srgb, var(--accent) 20%, transparent),
    inset 0 1px 2px color-mix(in srgb, black 10%, transparent);
}

.add-btn:disabled {
  cursor: not-allowed;
  background: var(--bg-tertiary);
  border-color: var(--border);
  box-shadow:
    0 1px 2px color-mix(in srgb, black 5%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 5%, transparent);
  opacity: 0.6;
}

[data-theme='light'] .add-btn:disabled {
  background: color-mix(in srgb, var(--accent) 15%, color-mix(in srgb, var(--border) 50%, white));
  border-color: color-mix(in srgb, var(--accent) 30%, var(--border));
  color: color-mix(in srgb, var(--accent) 50%, var(--text-secondary));
  opacity: 0.9;
}

[data-theme='light'] .add-btn:disabled .btn-text,
[data-theme='light'] .add-btn:disabled .btn-icon {
  color: color-mix(in srgb, var(--accent) 50%, var(--text-secondary));
}

.add-btn .btn-icon {
  font-size: 1.15em;
  line-height: 1;
  font-weight: 300;
}

.add-btn .btn-text {
  line-height: 1;
}

.undo-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  padding: 0;
  font-size: 1.1em;
  color: var(--text-secondary);
  cursor: pointer;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow:
    0 1px 2px color-mix(in srgb, black 5%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 5%, transparent);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme='light'] .undo-btn {
  background: white;
  box-shadow:
    0 1px 3px color-mix(in srgb, black 8%, transparent),
    inset 0 1px 0 white;
}

.undo-btn:hover {
  color: var(--accent);
  background: var(--bg-tertiary);
  border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
  box-shadow:
    0 2px 6px color-mix(in srgb, black 8%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 8%, transparent);
  transform: translateY(-1px);
}

[data-theme='light'] .undo-btn:hover {
  background: color-mix(in srgb, var(--accent) 8%, white);
  border-color: var(--accent);
}

.undo-btn:active {
  transform: translateY(0) scale(0.95);
}

.undo-btn .btn-icon {
  line-height: 1;
}

.suggestions-enter-active,
.suggestions-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.suggestions-enter-from,
.suggestions-leave-to {
  opacity: 0;
}

.dropdown-down .suggestions-enter-from,
.dropdown-down .suggestions-leave-to {
  transform: scaleY(0.95) translateY(-8px);
}

.dropdown-up .suggestions-enter-from,
.dropdown-up .suggestions-leave-to {
  transform: scaleY(0.95) translateY(8px);
}

/* ===== 反馈消息 ===== */
.search-input--error {
  color: #ef4444;
}

.search-input--warn {
  color: #f59e0b;
}

.input-wrapper:has(.search-input--error) {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px color-mix(in srgb, #ef4444 20%, transparent) !important;
}

.input-wrapper:has(.search-input--warn) {
  border-color: #f59e0b !important;
  box-shadow: 0 0 0 3px color-mix(in srgb, #f59e0b 20%, transparent) !important;
}

.feedback-message {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 900;
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 7px 12px;
  font-size: 0.8em;
  border-radius: 6px;
  pointer-events: none;
}

.feedback-error {
  color: #ef4444;
  background: color-mix(in srgb, #ef4444 12%, var(--bg-secondary));
  border: 1px solid color-mix(in srgb, #ef4444 40%, transparent);
}

.feedback-warn {
  color: #d97706;
  background: color-mix(in srgb, #f59e0b 12%, var(--bg-secondary));
  border: 1px solid color-mix(in srgb, #f59e0b 40%, transparent);
}

[data-theme='light'] .feedback-error {
  background: color-mix(in srgb, #ef4444 8%, #fff);
}

[data-theme='light'] .feedback-warn {
  background: color-mix(in srgb, #f59e0b 8%, #fff);
  color: #b45309;
}

.feedback-icon {
  flex-shrink: 0;
  font-weight: 700;
}

.feedback-enter-active,
.feedback-leave-active {
  transition: all 0.25s ease;
}

.feedback-enter-from,
.feedback-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
