<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue'

import type { SearchOption } from '@/types'
import optionsData from '@/data/options.json'

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

// 从 options.json 加载选项数据
const allOptions = ref<SearchOption[]>(optionsData as SearchOption[])

// 提取命令名称（去除等号及后面的值）
const extractCommandName = (command: string): string => {
  const eqIndex = command.indexOf('=')
  return eqIndex > 0 ? command.substring(0, eqIndex) : command
}

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

  if (isCommandDuplicate(commandToAdd)) {
    const commandName = extractCommandName(commandToAdd)
    // TODO: 使用 toast 提示
    console.warn(`命令 "${commandName}" 已存在，请勿重复添加`)
    return
  }

  emit('handleAdd', commandToAdd)
  searchValue.value = ''
  showSuggestions.value = false
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
        if (selectedOption.defaultVal !== '-') {
          applySuggestion(`${selectedOption.option}=${selectedOption.defaultVal}`)
        } else {
          applySuggestion(selectedOption.option)
        }
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
  if (option.defaultVal !== '-') {
    applySuggestion(`${option.option}=${option.defaultVal}`)
  } else {
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
        placeholder="输入 @ 触发选项搜索，或直接输入命令"
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
            <span class="suggestions-count">{{ filteredOptions.length }} 个选项</span>
            <span class="suggestions-hint">↑↓ 选择 Enter 确认</span>
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
                    option.defaultValDescri === '-' ? '无' : option.defaultValDescri
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
    <button class="add-btn" @click="handleAdd" :disabled="!searchValue.trim()" title="添加命令">
      <span class="btn-icon">+</span>
      <span class="btn-text">添加</span>
    </button>
    <button class="undo-btn" @click="handleUndo" title="撤销上一个 (Ctrl+Z)">
      <span class="btn-icon">↩</span>
    </button>
  </div>
</template>

<style scoped>
.search-btn-container {
  position: relative;
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.input-wrapper {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  overflow: visible;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
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
  font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
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
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
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
  border-bottom: 1px solid var(--border-color);
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
  background: var(--border-color);
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
  background: color-mix(in srgb, var(--color-primary) 10%, var(--bg-primary));
}

.suggestion-item.active {
  background: var(--color-primary);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary) 30%, transparent);
}

.suggestion-item.active .option-name,
.suggestion-item.active .suggestion-desc {
  color: white;
}

.suggestion-item.active .default-value {
  font-weight: 600;
  color: var(--color-primary);
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
  font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
  font-size: 0.85em;
  font-weight: 600;
  color: var(--color-primary);
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
  font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
  font-size: 0.75em;
  color: var(--text-secondary);
  white-space: nowrap;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  opacity: 0.8;
  transition: all 0.15s ease;
}

.add-btn {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  font-size: 0.9em;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  cursor: pointer;
  background: var(--color-primary);
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary) 30%, transparent);
  transition: all 0.2s ease;
}

.add-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 40%, transparent);
  transform: translateY(-1px);
}

.add-btn:active:not(:disabled) {
  transform: translateY(0);
}

.add-btn:disabled {
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.5;
}

.add-btn .btn-icon {
  font-size: 1.1em;
  line-height: 1;
}

.add-btn .btn-text {
  line-height: 1;
}

.undo-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  font-size: 0.9em;
  color: var(--text-primary);
  cursor: pointer;
  background: var(--bg-button);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.undo-btn:hover {
  background: var(--bg-button-hover);
  border-color: var(--color-primary);
}

.undo-btn:active {
  transform: scale(0.95);
}

.undo-btn .btn-icon {
  font-size: 1.1em;
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
</style>
