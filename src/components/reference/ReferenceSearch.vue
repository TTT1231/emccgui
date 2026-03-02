<script setup lang="ts">
import { useCompileStore } from '@/stores/useCompileStore'

const store = useCompileStore()

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  store.setRefSearchQuery(target.value)
}

function clearSearch() {
  store.setRefSearchQuery('')
}
</script>

<template>
  <div class="ref-search">
    <div class="ref-search-wrapper">
      <svg class="ref-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        class="ref-search-input"
        :value="store.refSearchQuery"
        placeholder="搜索配置选项..."
        @input="handleInput"
      />
      <button
        v-if="store.refSearchQuery"
        class="ref-search-clear"
        @click="clearSearch"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<style scoped>
.ref-search {
  margin-bottom: 24px;
}

.ref-search-wrapper {
  position: relative;
}

.ref-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--ref-text-muted);
  pointer-events: none;
}

.ref-search-input {
  width: 100%;
  padding: 12px 40px 12px 44px;
  font-family: var(--font-sans);
  font-size: 14px;
  background: var(--ref-bg-card);
  border: 1px solid var(--ref-border);
  border-radius: var(--radius-lg, 16px);
  color: var(--ref-text);
  transition: all 0.15s ease;
}

.ref-search-input:focus {
  outline: none;
  border-color: var(--ref-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.ref-search-input::placeholder {
  color: var(--ref-text-muted);
}

.ref-search-clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--ref-text-muted);
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  transition: color 0.15s ease;
}

.ref-search-clear:hover {
  color: var(--ref-text);
}
</style>
