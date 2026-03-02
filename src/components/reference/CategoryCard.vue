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

    <Transition name="collapse">
      <div v-show="!isCollapsed" class="ref-category-content">
        <div class="ref-table-header">
          <span>命令</span>
          <span>说明</span>
          <span>类型</span>
          <span>默认值</span>
          <span>当前值</span>
        </div>
        <div class="ref-category-inner">
          <OptionRow
            v-for="(option, index) in category.options"
            :key="index"
            :option="option"
          />
        </div>
      </div>
    </Transition>
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
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--ref-primary) 20%, transparent) 0%,
    color-mix(in srgb, var(--ref-primary) 10%, transparent) 100%
  );
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

/* Vue Transition 折叠动画 */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 2000px;
}

.ref-category-content {
  overflow: hidden;
}

/* ===== 表头 ===== */
.ref-table-header {
  display: grid;
  grid-template-columns: minmax(140px, 1.4fr) minmax(0, 2fr) 80px 90px 110px;
  gap: 20px;
  padding: 8px 20px;
  border-bottom: 1px solid var(--ref-border);
  background: var(--ref-bg-card-hover);
}

.ref-table-header span {
  font-size: 11px;
  font-weight: 600;
  color: var(--ref-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  user-select: none;
}

.ref-table-header span:nth-child(3),
.ref-table-header span:nth-child(4),
.ref-table-header span:nth-child(5) {
  text-align: center;
}
</style>
