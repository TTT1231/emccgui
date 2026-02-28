<script setup lang="ts">
import { computed } from 'vue'
import { useAppState } from '@/stores'

const { state, toggleRuntimeMethod } = useAppState()

const visibleMethods = computed(() => {
  if (state.outputFormat === 'wasm-only') {
    return state.runtimeMethods
  }
  return state.runtimeMethods
})
</script>

<template>
  <div class="runtime-methods-section">
    <h3 class="section-title">运行时方法</h3>
    <p class="section-hint">点击启用/禁用要导出的运行时方法</p>
    <div class="method-tags">
      <button
        v-for="method in visibleMethods"
        :key="method.key"
        class="method-tag"
        :class="{ active: method.enabled }"
        :title="method.hint"
        @click="toggleRuntimeMethod(method.key)"
      >
        {{ method.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.runtime-methods-section {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.section-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.method-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.method-tag {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 12px;
  font-family: var(--font-mono);
  transition: all 0.2s;
}

.method-tag:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.method-tag.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}
</style>
