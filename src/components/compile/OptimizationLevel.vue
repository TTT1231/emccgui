<script setup lang="ts">
import { useAppState } from '@/stores'

const { state, setOptimizationLevel } = useAppState()

const levels = [
  { key: 'O0', label: '-O0' },
  { key: 'O1', label: '-O1' },
  { key: 'O2', label: '-O2' },
  { key: 'O3', label: '-O3' },
  { key: 'Os', label: '-Os' },
  { key: 'Oz', label: '-Oz' }
]
</script>

<template>
  <div class="optimization-section">
    <h3 class="section-title">优化级别</h3>
    <div class="opt-buttons">
      <button
        v-for="level in levels"
        :key="level.key"
        class="opt-level-btn"
        :class="{ active: state.optimizationLevel === level.key }"
        @click="setOptimizationLevel(level.key as any)"
      >
        {{ level.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.optimization-section {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.opt-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.opt-level-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  font-family: var(--font-mono);
  transition: all 0.2s;
}

.opt-level-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.opt-level-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}
</style>
