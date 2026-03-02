<script setup lang="ts">
import { useCompileStore } from '@/stores/useCompileStore'

const store = useCompileStore()

function handleOutputModeChange(mode: 'js-wasm' | 'wasm-only') {
  store.setOutputFormat(mode)
}

function handleThemeToggle() {
  store.toggleTheme()
}

function handleReset() {
  store.resetAll()
}
</script>

<template>
  <header class="header">
    <div class="header-title">
      <h1>emccgui-mini</h1>
      <span class="badge">v1.0</span>
    </div>

    <div class="header-controls">
      <!-- Output Mode Toggle -->
      <div class="output-mode-toggle">
        <!-- 重置 -->
        <button
          :class="{ active: store.outputFormat === 'js-wasm' }"
          @click="handleOutputModeChange('js-wasm')"
        >
          JS + WASM
        </button>
        <button
          :class="{ active: store.outputFormat === 'wasm-only' }"
          @click="handleOutputModeChange('wasm-only')"
        >
          WASM
        </button>
      </div>

      <!-- 重置按鈕 -->
      <button class="reset-btn" title="重置所有状态" @click="handleReset">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
        <span class="reset-btn__text">重置</span>
      </button>

      <!-- Theme Toggle -->
      <button class="theme-toggle" @click="handleThemeToggle" title="切换主题">
        <span v-if="store.theme === 'dark'">🌙</span>
        <span v-else>☀️</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  height: var(--header-height);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h1 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-title .badge {
  background: var(--accent);
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.output-mode-toggle {
  display: flex;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: 4px;
}

.output-mode-toggle button {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.output-mode-toggle button.active {
  background: var(--accent);
  color: white;
}

.output-mode-toggle button:hover:not(.active) {
  color: var(--text-primary);
}

.theme-toggle {
  background: var(--bg-tertiary);
  border: none;
  color: var(--text-primary);
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.theme-toggle:hover {
  background: var(--accent-light);
}

/* 重置按鈕 */
.reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.reset-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: color-mix(in srgb, #ef4444 10%, var(--bg-tertiary));
}

.reset-btn__text {
  line-height: 1;
}
</style>
