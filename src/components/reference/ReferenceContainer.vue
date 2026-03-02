<script setup lang="ts">
import { computed } from 'vue'
import { useCompileStore } from '@/stores/useCompileStore'
import { refConfigData } from '@/data'
import ReferenceSearch from './ReferenceSearch.vue'
import CategoryCard from './CategoryCard.vue'
import type { RefCategory, RefOption } from '@/types'

const store = useCompileStore()

// 已选数量：手动选中 + 编译面板贡献的去重合并
const selectedCount = computed(() => store.totalRefActiveCount)

// 搜索匹配函数
function matchesSearch(opt: RefOption, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return opt.option.toLowerCase().includes(q) || opt.description.toLowerCase().includes(q)
}

// 过滤后的分类
const filteredCategories = computed(() => {
  const query = store.refSearchQuery
  const activeCategory = store.refActiveCategory

  // 已选模式：只显示已选中的选项（手动选中 + 编译面板贡献）
  if (activeCategory === '__selected__') {
    const manualKeys = new Set(Object.keys(store.refSelectedOptions))
    // 直接使用 store 提供的 Set，获得 O(1) 查找性能
    const compileKeys = store.compileContributedRefKeysSet

    return refConfigData.categories
      .map((category): RefCategory | null => {
        const filteredOptions = category.options.filter(
          (opt) =>
            (manualKeys.has(opt.option) || compileKeys.has(opt.option)) &&
            matchesSearch(opt, query)
        )
        if (filteredOptions.length === 0) return null
        return { ...category, options: filteredOptions }
      })
      .filter((cat): cat is RefCategory => cat !== null)
  }

  // 正常分类过滤
  return refConfigData.categories
    .map((category): RefCategory | null => {
      if (activeCategory !== 'all' && category.name !== activeCategory) {
        return null
      }

      if (!query) return category

      const filteredOptions = category.options.filter((opt) => matchesSearch(opt, query))

      if (filteredOptions.length === 0) return null

      return { ...category, options: filteredOptions }
    })
    .filter((cat): cat is RefCategory => cat !== null)
})

// 是否有结果
const hasResults = computed(() => filteredCategories.value.length > 0)

// 选择分类
function selectCategory(categoryName: string) {
  store.setRefActiveCategory(categoryName)
}
</script>

<template>
  <div class="reference-container">
    <!-- 搜索 -->
    <ReferenceSearch />

    <!-- 分类导航 -->
    <nav class="ref-category-nav" role="tablist" aria-label="配置分类导航">
      <button
        class="ref-category-chip"
        :class="{ active: store.refActiveCategory === 'all' }"
        role="tab"
        :aria-selected="store.refActiveCategory === 'all'"
        @click="selectCategory('all')"
      >
        All
      </button>
      <button
        v-for="cat in refConfigData.categories"
        :key="cat.name"
        class="ref-category-chip"
        :class="{ active: store.refActiveCategory === cat.name }"
        role="tab"
        :aria-selected="store.refActiveCategory === cat.name"
        @click="selectCategory(cat.name)"
      >
        {{ cat.name }}
      </button>

      <!-- 已选导航 -->
      <button
        class="ref-category-chip ref-selected-chip"
        :class="{ active: store.refActiveCategory === '__selected__' }"
        role="tab"
        :aria-selected="store.refActiveCategory === '__selected__'"
        @click="selectCategory('__selected__')"
      >
        Selected({{ selectedCount }})
      </button>
    </nav>

    <!-- 分类卡片 -->
    <div class="ref-cards-container" role="tabpanel">
      <template v-if="hasResults">
        <CategoryCard
          v-for="category in filteredCategories"
          :key="category.name"
          :category="category"
        />
      </template>

      <div v-else class="ref-no-results">
        <p>No matching options found</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reference-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
  font-family: var(--font-sans);
  max-width: 1200px;
}

.reference-container::-webkit-scrollbar {
  width: 5px;
}

.reference-container::-webkit-scrollbar-track {
  background: transparent;
}

.reference-container::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

.reference-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* 分类导航 */
.ref-category-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  padding: 12px;
  background: var(--ref-bg-card);
  border-radius: 12px;
  border: 1px solid var(--ref-border);
}

.ref-category-chip {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--ref-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.ref-category-chip:hover {
  background: var(--ref-primary-muted, rgba(96, 165, 250, 0.15));
  color: var(--ref-text);
}

.ref-category-chip.active {
  background: var(--ref-primary);
  color: var(--ref-on-primary);
  font-weight: 600;
}

/* 已选导航项特殊样式 */
.ref-selected-chip {
  margin-left: auto;
  background: var(--ref-primary-muted);
  color: var(--ref-primary);
}

.ref-selected-chip:hover {
  background: var(--ref-primary-muted);
  filter: brightness(1.2);
}

.ref-selected-chip.active {
  background: var(--ref-primary);
  color: var(--ref-on-primary);
}

/* 卡片容器 */
.ref-cards-container {
  display: grid;
  gap: 16px;
}

/* 无结果提示 */
.ref-no-results {
  text-align: center;
  padding: 48px 24px;
  color: var(--ref-text-muted);
  background: var(--ref-bg-card);
  border-radius: 12px;
  border: 1px solid var(--ref-border);
}
</style>
