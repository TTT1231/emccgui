<script setup lang="ts">
import { computed } from 'vue'
import { useAppState } from '@/stores'
import { optionConflicts } from '@/data'

const props = defineProps<{
  conflictedKeys: Set<string>
}>()

const { state } = useAppState()

const messages = computed(() => {
  const msgs: string[] = []

  // Pure WASM mode conflicts
  if (state.outputFormat === 'wasm-only' && props.conflictedKeys.size > 0) {
    msgs.push('纯 WASM 模式下，以下选项不可用: ' + Array.from(props.conflictedKeys).join(', '))
  }

  // Option-to-option conflicts
  for (const conflict of optionConflicts) {
    const trigger = state.compileOptions.find(o => o.key === conflict.triggerKey)
    if (trigger?.enabled && props.conflictedKeys.size > 0) {
      msgs.push(conflict.reason)
    }
  }

  return msgs
})
</script>

<template>
  <div v-if="messages.length > 0" class="conflict-warning">
    <span class="warning-icon">⚠️</span>
    <span class="warning-text">{{ messages.join('; ') }}</span>
  </div>
</template>

<style scoped>
.conflict-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 24px;
}

.warning-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.warning-text {
  font-size: 13px;
  color: var(--error);
  line-height: 1.5;
}
</style>
