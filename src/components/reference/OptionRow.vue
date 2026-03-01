<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RefOption } from '@/types'
import { useAppState } from '@/stores'

const props = defineProps<{
  option: RefOption
}>()

const { state, toggleRefOption } = useAppState()
const isEditing = ref(false)
const editValue = ref('')

const isSelected = computed(() => {
  return props.option.option in state.refSelectedOptions
})

const displayValue = computed(() => {
  const selected = state.refSelectedOptions[props.option.option]
  if (selected !== undefined && selected !== true) {
    return String(selected)
  }
  if (selected === true && props.option.valueType === 'boolean') {
    return '1'
  }
  return props.option.default
})

function handleClick() {
  if (isEditing.value) return
  // 点击选项行切换选中状态（不传自定义值）
  toggleRefOption(props.option.option, props.option.valueType)
}

function handleBlur() {
  if (editValue.value) {
    toggleRefOption(props.option.option, props.option.valueType, editValue.value)
  }
  isEditing.value = false
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleBlur()
  } else if (event.key === 'Escape') {
    isEditing.value = false
  }
}

function handleDefaultValueClick(event: MouseEvent) {
  // 已选中且可编辑 → 进入编辑模式，阻止冒泡避免取消选中
  if (isSelected.value && props.option.editable) {
    event.stopPropagation()
    isEditing.value = true
    const selected = state.refSelectedOptions[props.option.option]
    editValue.value = String(selected !== undefined && selected !== true ? selected : props.option.default)
    return
  }
  // 其他情况：让事件冒泡到父元素处理选中/取消
}
</script>

<template>
  <div
    class="option-row"
    :class="{
      selected: isSelected,
      'is-editable': option.editable
    }"
    @click="handleClick"
  >
    <div class="option-name">
      <span v-if="isSelected" class="check-icon">✓</span>
      <span class="option-name-text">{{ option.option }}</span>
    </div>

    <div
      class="option-default"
      :class="{
        editable: option.editable && isSelected,
        readonly: !option.editable || !isSelected,
        editing: isEditing,
        selected: isSelected
      }"
      @click="handleDefaultValueClick"
    >
      <template v-if="isEditing">
        <input
          v-model="editValue"
          type="text"
          class="edit-input"
          @blur="handleBlur"
          @keydown="handleKeydown"
          @click.stop
        />
      </template>
      <template v-else>
        <span class="value-text">{{ displayValue }}</span>
        <span v-if="option.editable && isSelected" class="edit-indicator">✎</span>
      </template>
    </div>

    <div class="option-desc">
      {{ option.description }}
    </div>
  </div>
</template>

<style scoped>
.option-row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr) minmax(0, 1.5fr);
  gap: 20px;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--ref-border);
  cursor: pointer;
  position: relative;
  background: transparent;
  transition: background 0.2s ease;
}

.option-row:last-child {
  border-bottom: none;
}

/* 左侧选中指示条 */
.option-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--ref-primary);
  transform: scaleY(0);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0 2px 2px 0;
}

/* 未选中 hover 状态 */
.option-row:hover:not(.selected) {
  background: rgba(59, 130, 246, 0.04);
}

.option-row:hover:not(.selected)::before {
  transform: scaleY(0.6);
  background: rgba(59, 130, 246, 0.4);
}

/* 选中状态 */
.option-row.selected {
  background: rgba(59, 130, 246, 0.08);
}

.option-row.selected::before {
  transform: scaleY(1);
}

/* 选中 hover 状态 */
.option-row.selected:hover {
  background: rgba(59, 130, 246, 0.12);
}

/* 选项名称 */
.option-name {
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--ref-text);
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.02em;
  transition: transform 0.15s ease;
}

.option-name-text {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  background: var(--ref-bg-card-hover);
  border: 1px solid var(--ref-border);
  border-radius: 5px;
  transition: all 0.2s ease;
}

.option-row.selected .option-name {
  transform: translateX(4px);
}

.option-row.selected .option-name-text {
  background: color-mix(in srgb, var(--ref-primary) 12%, transparent);
  border-color: color-mix(in srgb, var(--ref-primary) 40%, transparent);
  color: var(--ref-primary);
}

.check-icon {
  display: inline-flex;
  width: 16px;
  height: 16px;
  background: var(--ref-primary);
  border-radius: 50%;
  color: white;
  font-size: 10px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 默认值徽章 - 基础样式 */
.option-default {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--ref-text);
  text-align: center;
  background: var(--ref-bg-card-hover);
  padding: 6px 12px;
  border-radius: 6px;
  white-space: nowrap;
  min-width: 70px;
  border: 1px solid var(--ref-border);
  position: relative;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* ========== 可编辑选项（已选中） ========== */
.option-default.editable.selected {
  border-style: dashed;
  border-color: var(--ref-primary);
  background: var(--ref-bg-card);
  color: var(--ref-text);
  cursor: text;
  box-shadow: none;
}

.option-default.editable.selected:hover {
  border-style: solid;
  border-color: var(--ref-primary);
  background: var(--ref-bg-card-hover);
  transform: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.option-default.editable.selected .edit-indicator {
  opacity: 0;
  transition: opacity 0.15s ease;
  font-size: 10px;
  color: var(--ref-primary);
}

.option-default.editable.selected:hover .edit-indicator {
  opacity: 0.8;
}

/* ========== 不可编辑（未选中或不可编辑选项） ========== */
.option-default.readonly {
  border-style: solid;
  border-color: var(--ref-border);
  cursor: not-allowed;
  opacity: 0.85;
}

.option-default.readonly:hover {
  opacity: 1;
  background: var(--ref-bg-card-hover);
  border-color: rgba(148, 163, 184, 0.4);
}

/* ========== 选中状态 ========== */
.option-default.selected {
  background: var(--ref-primary);
  color: white;
  border-color: var(--ref-primary);
  border-style: solid;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.option-default.selected:hover {
  background: var(--ref-primary-hover, #2563EB);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* 选中的可编辑选项 */
.option-default.selected.editable {
  cursor: text;
}

/* 选中的不可编辑选项 */
.option-default.selected.readonly {
  cursor: not-allowed;
}

/* ========== 编辑中状态 ========== */
.option-default.editing {
  background: var(--ref-bg-card);
  border: 2px solid var(--ref-primary);
  color: var(--ref-text);
  padding: 5px 10px;
  cursor: text;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.edit-input {
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  text-align: center;
  width: 100%;
  outline: none;
}

/* 描述文字 */
.option-desc {
  font-size: 12px;
  color: var(--ref-text-muted);
  line-height: 1.5;
}

.option-row:hover .option-desc {
  color: var(--ref-text);
}

/* 亮色主题调整 */
[data-theme="light"] .option-default.readonly:not(.selected) {
  background: rgba(0, 0, 0, 0.02);
}

[data-theme="light"] .option-default.readonly:not(.selected):hover {
  background: rgba(0, 0, 0, 0.05);
}
</style>
