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

/** 去除 '' 或 "" 外层引号，用于 string 类型值的展示和编辑初始化 */
function stripOuterQuotes(val: string): string {
  if ((val.startsWith("'") && val.endsWith("'")) ||
      (val.startsWith('"') && val.endsWith('"'))) {
    return val.slice(1, -1)
  }
  return val
}

const displayValue = computed(() => {
  const selected = state.refSelectedOptions[props.option.option]
  if (selected !== undefined && selected !== true) {
    const raw = String(selected)
    return (props.option.valueType === 'string' || props.option.valueType === 'string-array')
      ? stripOuterQuotes(raw)
      : raw
  }
  if (selected === true && props.option.valueType === 'boolean') {
    return '1'
  }
  return props.option.default
})

// boolean 默认值统一用 0/1 展示（与 emcc -s 惯例保持一致）
// dynamicDefault 优先级高于静态 default，用于依赖外部状态的选项（如 -sASSERTIONS 随优化级别变化）
const displayDefault = computed(() => {
  if (props.option.dynamicDefault) {
    return props.option.dynamicDefault(state.optimizationLevel)
  }
  if (props.option.valueType === 'boolean') {
    if (props.option.default === 'false' || props.option.default === '0') return '0'
    if (props.option.default === 'true'  || props.option.default === '1')  return '1'
  }
  return props.option.default
})

function handleClick() {
  if (isEditing.value) return
  // 非 boolean 类型首次选中时，使用 initialValue（如有）或 default 作为初始值
  // string 类型去除外层引号，避免存入 '' 这样的字面量
  if (!isSelected.value && props.option.valueType !== 'boolean') {
    const raw = props.option.initialValue ?? props.option.default
    const initVal = (props.option.valueType === 'string' || props.option.valueType === 'string-array')
      ? stripOuterQuotes(raw)
      : raw
    toggleRefOption(props.option.option, props.option.valueType, initVal, props.option.radioGroup)
  } else {
    toggleRefOption(props.option.option, props.option.valueType, undefined, props.option.radioGroup)
  }
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

function handleCurrentClick(event: MouseEvent) {
  // 已选中且可编辑时，阻止 click 冒泡到行，避免双击时两次 click 反复 toggle 选中状态
  if (isSelected.value && props.option.editable) {
    event.stopPropagation()
  }
}

function handleCurrentDblClick(event: MouseEvent) {
  // 已选中且可编辑 → 双击进入编辑模式
  if (isSelected.value && props.option.editable) {
    event.stopPropagation()
    isEditing.value = true
    const selected = state.refSelectedOptions[props.option.option]
    const raw = String(selected !== undefined && selected !== true ? selected : props.option.default)
    // string 类型去除外层引号，用户直接看到干净的值
    editValue.value = (props.option.valueType === 'string' || props.option.valueType === 'string-array')
      ? stripOuterQuotes(raw)
      : raw
  }
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
    <!-- 命令 -->
    <div class="option-name">
      <span v-if="isSelected" class="check-icon">✓</span>
      <span class="option-name-text">{{ option.option }}</span>
    </div>

    <!-- 说明 -->
    <div class="option-desc">{{ option.description }}</div>

    <!-- 类型 -->
    <div class="option-type" :class="`type-${option.valueType}`">{{ option.valueType === 'string-array' ? 'string | []' : option.valueType }}</div>

    <!-- 默认值 -->
    <div class="option-default-val" :title="displayDefault">{{ displayDefault }}</div>

    <!-- 当前值 -->
    <div
      class="option-current"
      :class="{
        editable: option.editable && isSelected,
        selected: isSelected,
        editing: isEditing
      }"
      :title="option.editable && isSelected && !isEditing ? '双击编辑值' : undefined"
      @click="handleCurrentClick"
      @dblclick="handleCurrentDblClick"
    >
      <template v-if="isSelected">
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
          <span v-if="displayValue === ''" class="value-placeholder">双击输入</span>
          <span v-else class="value-text">{{ displayValue }}</span>
          <span v-if="option.editable" class="edit-hint">双击编辑</span>
        </template>
      </template>
      <template v-else>
        <span class="empty-dash">—</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.option-row {
  display: grid;
  grid-template-columns: minmax(140px, 1.4fr) minmax(0, 2fr) 80px 90px 110px;
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
  background: color-mix(in srgb, var(--ref-primary) 4%, transparent);
}

.option-row:hover:not(.selected)::before {
  transform: scaleY(0.6);
  background: color-mix(in srgb, var(--ref-primary) 40%, transparent);
}

/* 选中状态 */
.option-row.selected {
  background: color-mix(in srgb, var(--ref-primary) 8%, transparent);
}

.option-row.selected::before {
  transform: scaleY(1);
}

/* 选中 hover 状态 */
.option-row.selected:hover {
  background: color-mix(in srgb, var(--ref-primary) 12%, transparent);
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



/* 类型 badge */
.option-type {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  padding: 3px 8px;
  border-radius: 4px;
  letter-spacing: 0.02em;
}

.option-type.type-boolean {
  color: #52c41a;
  background: color-mix(in srgb, #52c41a 12%, transparent);
}

.option-type.type-string {
  color: #1677ff;
  background: color-mix(in srgb, #1677ff 12%, transparent);
}

.option-type.type-number {
  color: #fa8c16;
  background: color-mix(in srgb, #fa8c16 12%, transparent);
}

.option-type.type-string-array {
  color: #722ed1;
  background: color-mix(in srgb, #722ed1 12%, transparent);
  white-space: nowrap;
}

/* 默认值 */
.option-default-val {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ref-text-muted);
  text-align: center;
  padding: 3px 8px;
  border-radius: 5px;
  background: var(--ref-bg-card-hover);
  border: 1px solid var(--ref-border);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 当前值 */
.option-current {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px dashed var(--ref-border);
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s ease;
  min-width: 70px;
  cursor: default;
}

.option-current .empty-dash {
  color: var(--ref-text-muted);
  opacity: 0.4;
}

.option-current.selected {
  background: var(--ref-primary);
  border-color: var(--ref-primary);
  border-style: solid;
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--ref-primary) 30%, transparent);
}

.option-current.selected:not(.editable):not(.editing):hover {
  background: var(--ref-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--ref-primary) 40%, transparent);
}

.option-current.editable.selected {
  border-style: dashed;
  cursor: default;
  position: relative;
  overflow: hidden;
}

/* hover 时将值文字淮化 */
.option-current.editable.selected:hover .value-text,
.option-current.editable.selected:hover .value-placeholder {
  opacity: 0.25;
}
.option-current .value-text {
  transition: opacity 0.15s ease;
}
/* 空值占位提示 */
.option-current .value-placeholder {
  font-style: italic;
  font-size: 10px;
  opacity: 0.4;
  transition: opacity 0.15s ease;
}
/* 双击编辑提示覆盖层 */
.edit-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-mono);
  color: white;
  letter-spacing: 0.04em;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.option-current.editable.selected:hover .edit-hint {
  opacity: 1;
}

.option-current.editable.selected:hover {
  transform: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ref-primary) 25%, transparent);
  border-style: solid;
}

.option-current.editing {
  background: var(--ref-bg-card);
  border: 2px solid var(--ref-primary);
  border-style: solid;
  color: var(--ref-text);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ref-primary) 15%, transparent);
  cursor: text;
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

/* 亮色主题调整 */
[data-theme="light"] .option-default-val {
  background: rgba(0, 0, 0, 0.03);
}

[data-theme="light"] .option-current:not(.selected) {
  border-color: rgba(0, 0, 0, 0.1);
}
</style>
