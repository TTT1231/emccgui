<script setup lang="ts">
import { computed } from 'vue'
import { setLocale, getCurrentLocale } from '@/i18n'

const currentLocale = computed(() => getCurrentLocale())

function toggleLocale() {
  const newLocale = currentLocale.value === 'en' ? 'zh-CN' : 'en'
  setLocale(newLocale)
}

const localeLabel = computed(() => currentLocale.value === 'en' ? 'EN' : '中文')
</script>

<template>
  <button
    class="lang-toggle"
    :title="currentLocale === 'en' ? 'Switch to Chinese' : '切换到英文'"
    @click="toggleLocale"
  >
    <span class="lang-icon">🌐</span>
    <span class="lang-label">{{ localeLabel }}</span>
  </button>
</template>

<style scoped>
.lang-toggle {
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
  font-weight: 500;
  transition: all 0.2s;
}

.lang-toggle:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-light);
}

.lang-icon {
  font-size: 16px;
}

.lang-label {
  min-width: 32px;
  text-align: center;
}
</style>
