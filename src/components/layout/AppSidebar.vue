<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useCompileStore } from '@/stores/useCompileStore'

const { t } = useI18n()
const store = useCompileStore()

const navItems = [
  { tab: 'file' as const, icon: '📁', labelKey: 'nav.file' },
  { tab: 'compile' as const, icon: '⚙️', labelKey: 'nav.compile' },
  { tab: 'reference' as const, icon: '📖', labelKey: 'nav.reference' }
]

function handleTabClick(tab: 'file' | 'compile' | 'reference') {
  store.setActiveTab(tab)
}
</script>

<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <button
        v-for="item in navItems"
        :key="item.tab"
        class="nav-item"
        :class="{ active: store.activeTab === item.tab }"
        @click="handleTabClick(item.tab)"
      >
        <span class="icon">{{ item.icon }}</span>
        <span class="label">{{ t(item.labelKey) }}</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  padding: 16px 0;
  position: sticky;
  top: var(--header-height);
  height: calc(100vh - var(--header-height));
  overflow-y: auto;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  font-size: 14px;
}

.nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-light);
  color: var(--accent);
}

.nav-item .icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}
</style>
