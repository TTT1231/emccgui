<script setup lang="ts">
import type { CompileOptionState } from '@/types'
import { useAppState } from '@/stores'
import ToggleSwitch from '@/components/common/ToggleSwitch.vue'

const props = defineProps<{
  option: CompileOptionState
  isConflicted: boolean
}>()

const { updateOption, updateOptionValue } = useAppState()

function handleToggle(enabled: boolean) {
  updateOption(props.option.key, enabled)
}

function handleValueChange(event: Event) {
  const target = event.target as HTMLInputElement | HTMLSelectElement
  updateOptionValue(props.option.key, target.value)
}
</script>

<template>
  <div class="option-item" :class="{ conflicted: isConflicted }">
    <div class="option-info">
      <div class="option-name">
        {{ option.name }}
        <span class="cmd">{{ option.cmdPrefix }}{{ option.cmdName }}</span>
        <span v-if="option.jsWasmOnly" class="js-only-badge">JS+WASM</span>
      </div>
      <div class="option-hint">{{ option.hint }}</div>
    </div>

    <div class="option-control">
      <!-- Boolean type -->
      <template v-if="option.valueType === 'boolean'">
        <ToggleSwitch
          :model-value="option.enabled"
          :disabled="isConflicted"
          @update:model-value="handleToggle"
        />
      </template>

      <!-- String type with input -->
      <template v-else-if="option.valueType === 'string' && option.hasInput">
        <input
          type="text"
          class="option-input"
          :value="option.currentValue"
          :placeholder="option.inputPlaceholder"
          :disabled="isConflicted"
          @change="handleValueChange"
        />
        <ToggleSwitch
          :model-value="option.enabled"
          :disabled="isConflicted"
          @update:model-value="handleToggle"
        />
      </template>

      <!-- Select type -->
      <template v-else-if="option.valueType === 'select'">
        <select
          class="option-select"
          :value="option.currentValue"
          :disabled="isConflicted"
          @change="handleValueChange"
        >
          <option
            v-for="opt in option.selectOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
        <ToggleSwitch
          :model-value="option.enabled"
          :disabled="isConflicted"
          @update:model-value="handleToggle"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.option-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  transition: background 0.2s;
}

.option-item:last-child {
  border-bottom: none;
}

.option-item.conflicted {
  background: rgba(239, 68, 68, 0.1);
  margin: 0 -12px;
  padding: 12px;
  border-radius: var(--radius-sm);
  opacity: 0.7;
}

.option-info {
  flex: 1;
  padding-right: 16px;
}

.option-name {
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--text-primary);
}

.option-name .cmd {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent);
  background: var(--accent-light);
  padding: 2px 6px;
  border-radius: 4px;
}

.js-only-badge {
  font-size: 10px;
  background: var(--warning);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
}

.option-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.option-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-input {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 13px;
  width: 150px;
  transition: border-color 0.2s;
}

.option-input:focus {
  outline: none;
  border-color: var(--accent);
}

.option-select {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
}
</style>
