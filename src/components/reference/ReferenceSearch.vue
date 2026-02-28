<script setup lang="ts">
import { useAppState } from '@/stores'

const { state, setRefSearchQuery } = useAppState()

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  setRefSearchQuery(target.value)
}

function clearSearch() {
  setRefSearchQuery('')
}
</script>

<template>
  <div class="search-container">
    <input
      type="text"
      class="search-input"
      :value="state.refSearchQuery"
      placeholder="搜索选项..."
      @input="handleInput"
    />
    <button
      v-if="state.refSearchQuery"
      class="clear-btn"
      @click="clearSearch"
    >
      ✕
    </button>
  </div>
</template>

<style scoped>
.search-container {
  position: relative;
  margin-bottom: 24px;
}

.search-input {
  width: 100%;
  background: var(--ref-bg-card);
  border: 1px solid var(--ref-border);
  border-radius: var(--radius-md);
  padding: 12px 40px 12px 16px;
  color: var(--ref-text);
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--ref-primary);
}

.search-input::placeholder {
  color: var(--ref-text-muted);
}

.clear-btn {
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
}

.clear-btn:hover {
  color: var(--ref-text);
}
</style>
