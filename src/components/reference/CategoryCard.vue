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
  <div class="ref-category-card" :class="{ collapsed: isCollapsed }">
    <div
      class="ref-category-header"
      role="button"
      tabindex="0"
      :aria-expanded="!isCollapsed"
      @click="toggleCollapse"
      @keydown.enter="toggleCollapse"
    >
      <div class="ref-category-icon" v-html="category.icon"></div>
      <div class="ref-category-info">
        <div class="ref-category-name">{{ category.name }}</div>
        <div class="ref-category-count">{{ category.options.length }} 个选项</div>
      </div>
      <div class="ref-category-toggle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>

    <div class="ref-category-content">
      <div class="ref-category-inner">
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
.ref-category-card {
  background: var(--ref-bg-card);
  border: 1px solid var(--ref-border);
  border-radius: var(--radius-xl, 24px);
  overflow: hidden;
  will-change: border-color;
  transition: border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.ref-category-card:hover {
  border-color: var(--ref-primary);
}

.ref-category-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--ref-border);
  cursor: pointer;
  will-change: background-color;
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.ref-category-header:hover {
  background: var(--ref-bg-card-hover);
}

.ref-category-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%);
  border-radius: var(--radius-md, 12px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ref-category-icon :deep(svg) {
  width: 18px;
  height: 18px;
  color: var(--ref-primary);
}

.ref-category-info {
  flex: 1;
}

.ref-category-name {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--ref-text);
}

.ref-category-count {
  font-size: 11px;
  color: var(--ref-text-muted);
  margin-top: 2px;
}

.ref-category-toggle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ref-text-muted);
  will-change: transform;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center center;
}

.ref-category-toggle svg {
  width: 16px;
  height: 16px;
}

.ref-category-card.collapsed .ref-category-toggle {
  transform: rotate(-90deg);
}

.ref-category-content {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.25s ease;
}

.ref-category-card.collapsed .ref-category-content {
  grid-template-rows: 0fr;
}

.ref-category-inner {
  overflow: hidden;
}
</style>
