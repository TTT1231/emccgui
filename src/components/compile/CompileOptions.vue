<script setup lang="ts">
import { computed } from 'vue'
import { useAppState } from '@/stores'
import { optionConflicts } from '@/data'
import OptimizationLevel from './OptimizationLevel.vue'
import OptionItem from './OptionItem.vue'
import RuntimeMethodSelector from './RuntimeMethodSelector.vue'
import ConflictWarning from './ConflictWarning.vue'
import CommandOutput from './CommandOutput.vue'
const { state } = useAppState()

// Get conflicted options
const conflictedKeys = computed(() => {
  const keys = new Set<string>()

  // Pure WASM mode conflicts
  if (state.outputFormat === 'wasm-only') {
    for (const opt of state.compileOptions) {
      if (opt.jsWasmOnly && opt.enabled) {
        keys.add(opt.key)
      }
    }
  }

  // Option-to-option conflicts
  for (const conflict of optionConflicts) {
    const trigger = state.compileOptions.find(o => o.key === conflict.triggerKey)
    if (trigger?.enabled) {
      for (const key of conflict.conflictsWith) {
        const opt = state.compileOptions.find(o => o.key === key)
        if (opt?.enabled) {
          keys.add(key)
        }
      }
    }
  }

  return keys
})

// Group options by category
const groupedOptions = computed(() => {
  const categories: Record<string, typeof state.compileOptions[number][]> = {}
  const isWasmOnly = state.outputFormat === 'wasm-only'

  for (const opt of state.compileOptions) {
    if (isWasmOnly && opt.jsWasmOnly) continue
    const cat = opt.category
    if (!categories[cat]) {
      categories[cat] = []
    }
    categories[cat]!.push(opt)
  }

  return categories
})
</script>

<template>
  <div class="compile-tab">
    <ConflictWarning :conflicted-keys="conflictedKeys" />

    <OptimizationLevel />

    <div class="compile-options">
      <div
        v-for="(options, category) in groupedOptions"
        :key="category"
        class="option-group"
      >
        <h3 class="option-group-title">{{ category }}</h3>
        <OptionItem
          v-for="opt in options"
          :key="opt.key"
          :option="opt"
          :is-conflicted="conflictedKeys.has(opt.key)"
        />
      </div>
    </div>

    <RuntimeMethodSelector />

    <CommandOutput />
  </div>
</template>

<style scoped>
.compile-tab {
  max-width: 900px;
}

.compile-options {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.option-group {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.option-group-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
