<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RefOption } from '@/types'
import { useCompileStore } from '@/stores/useCompileStore'
import { useHighlight } from '@/composables'

const { t } = useI18n()
const { highlightText } = useHighlight()

const props = defineProps<{
  option: RefOption
}>()

const store = useCompileStore()
const isEditing = ref(false)
const editValue = ref('')

/** 用户在参考面板手动选中 */
const isSelected = computed(() => props.option.option in store.refSelectedOptions)

/** 该选项已由编译面板接管（已在编译命令中激活），参考面板应同步显示为激活状态 */
const isCompileContrib = computed(() =>
  store.compileContributedRefKeysSet.has(props.option.option) && !isSelected.value
)

/**
 * 当 isCompileContrib 时，显示编译面板实际生成的命令值
 * 例如 `-g` 选项由 debug 选项激活，currentValue='3' → 显示 `-g3`
 */
const compileContribDisplayValue = computed(() => {
  if (!isCompileContrib.value) return t('reference.enabled')
  // 找到对应的 compileOption（cmdPrefix+cmdName 匹配 option 字段）
  const matchedOpt = store.compileOptions.find(
    o => `${o.cmdPrefix}${o.cmdName}` === props.option.option
  )
  if (!matchedOpt) return t('reference.enabled')
  // 有 {value} 占位符的选项，只显示当前值本身，不展示完整命令行
  if (matchedOpt.enabledValue?.includes('{value}')) {
    const raw = String(matchedOpt.currentValue ?? matchedOpt.defaultValue ?? '')
    return stripOuterQuotes(raw) || 'Enabled'
  }
  return 'Enabled'
})

/** 两者之一激活即为「高亮」状态 */
const isActive = computed(() => isSelected.value || isCompileContrib.value)

/** 去除 '' 或 "" 外层引号，用于 string 类型值的展示和编辑初始化 */
function stripOuterQuotes(val: string): string {
  if ((val.startsWith("'") && val.endsWith("'")) ||
      (val.startsWith('"') && val.endsWith('"'))) {
    return val.slice(1, -1)
  }
  return val
}

const displayValue = computed(() => {
  const selected = store.refSelectedOptions[props.option.option]
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
    return props.option.dynamicDefault(store.optimizationLevel)
  }
  if (props.option.valueType === 'boolean') {
    if (props.option.default === 'false' || props.option.default === '0') return '0'
    if (props.option.default === 'true'  || props.option.default === '1')  return '1'
  }
  return props.option.default
})

function handleClick() {
  if (isEditing.value) return
  // 已由编译面板接管 → 点击则关闭编译面板对应选项（双向可操作）
  if (isCompileContrib.value) {
    store.disableCompileContrib(props.option.option)
    return
  }
  // 非 boolean 类型首次选中时，使用 initialValue（如有）或 default 作为初始值
  // string 类型去除外层引号，避免存入 '' 这样的字面量
  if (!isSelected.value && props.option.valueType !== 'boolean') {
    const raw = props.option.initialValue ?? props.option.default
    const initVal = (props.option.valueType === 'string' || props.option.valueType === 'string-array')
      ? stripOuterQuotes(raw)
      : raw
    store.toggleRefOption(props.option.option, props.option.valueType, initVal, props.option.radioGroup)
  } else {
    store.toggleRefOption(props.option.option, props.option.valueType, undefined, props.option.radioGroup)
  }
}

function handleBlur() {
  if (editValue.value) {
    store.toggleRefOption(props.option.option, props.option.valueType, editValue.value)
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
  if (isActive.value && props.option.editable && !isCompileContrib.value) {
    event.stopPropagation()
  }
}

function handleCurrentDblClick(event: MouseEvent) {
  // 已选中且可编辑 → 双击进入编辑模式（编译面板接管的不可编辑）
  if (isSelected.value && props.option.editable && !isCompileContrib.value) {
    event.stopPropagation()
    isEditing.value = true
    const selected = store.refSelectedOptions[props.option.option]
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
      selected: isActive,
      'compile-contrib': isCompileContrib,
      'is-editable': option.editable && !isCompileContrib
    }"
    :title="isCompileContrib ? 'Click to disable this option' : undefined"
    @click="handleClick"
  >
    <!-- 命令 -->
    <div class="option-name">
      <span v-if="isCompileContrib" class="check-icon compile-contrib-icon" title="Enabled in compile panel">⊕</span>
      <span v-else-if="isSelected" class="check-icon">✓</span>
      <span class="option-name-text" v-html="highlightText(option.option)"></span>
    </div>

    <!-- 说明 -->
    <div class="option-desc" v-html="highlightText(option.description)"></div>

    <!-- 类型 -->
    <div class="option-type" :class="`type-${option.valueType}`">{{ option.valueType === 'string-array' ? 'string | []' : option.valueType }}</div>

    <!-- 默认值 -->
    <div class="option-default-val" :title="displayDefault">{{ displayDefault }}</div>

    <!-- 当前值 -->
    <div
      class="option-current"
      :class="{
        editable: option.editable && isSelected && !isCompileContrib,
        selected: isActive,
        'compile-contrib': isCompileContrib,
        editing: isEditing
      }"
      :title="option.editable && isSelected && !isCompileContrib && !isEditing ? 'Double-click to edit value' : isCompileContrib ? 'Click to disable this option' : undefined"
      @click="handleCurrentClick"
      @dblclick="handleCurrentDblClick"
    >
      <template v-if="isCompileContrib">
        <span class="value-text">{{ compileContribDisplayValue }}</span>
      </template>
      <template v-else-if="isSelected">
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
          <span v-if="displayValue === ''" class="value-placeholder">{{ t('reference.doubleClickToInput') }}</span>
          <span v-else class="value-text" :title="String(displayValue)">{{ displayValue }}</span>
          <span v-if="option.editable" class="edit-hint">{{ t('reference.doubleClickToEdit') }}</span>
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

/* 选中状态（手动选中） */
.option-row.selected:not(.compile-contrib) {
  background: color-mix(in srgb, var(--ref-primary) 8%, transparent);
}

.option-row.selected::before {
  transform: scaleY(1);
}

/* 选中 hover 状态 */
.option-row.selected:not(.compile-contrib):hover {
  background: color-mix(in srgb, var(--ref-primary) 12%, transparent);
}

/* 由编译面板贡献的高亮状态（绿色调，区分手动选中） */
.option-row.compile-contrib {
  background: color-mix(in srgb, #22c55e 6%, transparent);
  cursor: pointer;
}

.option-row.compile-contrib::before {
  transform: scaleY(1);
  background: #22c55e;
}

.option-row.compile-contrib:hover {
  background: color-mix(in srgb, #22c55e 9%, transparent);
}

.option-row.compile-contrib .option-name-text {
  background: color-mix(in srgb, #22c55e 12%, transparent);
  border-color: color-mix(in srgb, #22c55e 40%, transparent);
  color: #22c55e;
}

.option-row.compile-contrib .option-name {
  transform: translateX(4px);
}

.check-icon.compile-contrib-icon {
  background: #22c55e;
  font-size: 12px;
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
  max-width: 100%;
  overflow: hidden;
  cursor: default;
}

.option-current .empty-dash {
  color: var(--ref-text-muted);
  opacity: 0.4;
}

.option-current.compile-contrib {
  background: #22c55e;
  border-color: #22c55e;
  border-style: solid;
  color: white;
  font-weight: 600;
  cursor: default;
  box-shadow: 0 2px 8px color-mix(in srgb, #22c55e 30%, transparent);
}

.option-current.compile-contrib:hover {
  transform: none;
  box-shadow: 0 2px 8px color-mix(in srgb, #22c55e 30%, transparent);
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
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

/* 搜索高亮 - 暗黑模式（默认） */
:deep(.highlight) {
  background: rgba(251, 191, 36, 0.35);
  color: #fbbf24;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 600;
  box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.3);
}

/* 搜索高亮 - 亮色模式 */
[data-theme="light"] :deep(.highlight) {
  background: rgba(251, 191, 36, 0.5);
  color: #92400e;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 600;
  box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.4);
}
</style>
