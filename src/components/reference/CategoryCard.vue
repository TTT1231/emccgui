<script setup lang="ts">
import { ref } from 'vue'
import type { RefCategory } from '@/types'
import OptionRow from './OptionRow.vue'

const props = defineProps<{
  category: RefCategory
}>()

const isCollapsed = ref(false)

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<template>
  <div class="category-card" :class="{ collapsed: isCollapsed }">
    <div class="category-header" @click="toggleCollapse">
      <div class="header-left">
        <span class="category-icon" v-html="category.icon"></span>
        <h3 class="category-name">{{ category.name }}</h3>
        <span class="option-count">{{ category.options.length }} 选项</span>
      </div>
      <span class="collapse-icon">{{ isCollapsed ? '▶' : '▼' }}</span>
    </div>

    <div class="category-content">
      <div class="category-inner">
        <OptionRow
          v-for="(option, index) in category.options"
          :key="index"
          :option="option"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-card {
  background: var(--ref-bg-card);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--ref-border);
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.category-header:hover {
  background: var(--ref-bg-card-hover);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-icon {
  width: 20px;
  height: 20px;
  color: var(--ref-primary);
}

.category-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ref-text);
}

.option-count {
  font-size: 11px;
  color: var(--ref-text-muted);
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.collapse-icon {
  font-size: 10px;
  color: var(--ref-text-muted);
  transition: transform 0.2s;
}

.category-content {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.3s ease;
}

.category-card.collapsed .category-content {
  grid-template-rows: 0fr;
}

.category-inner {
  overflow: hidden;
}
</style>
