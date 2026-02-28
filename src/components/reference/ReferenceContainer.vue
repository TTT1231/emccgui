<script setup lang="ts">
import { computed } from 'vue'
import { useAppState } from '@/stores'
import { refConfigData } from '@/data'
import ReferenceSearch from './ReferenceSearch.vue'
import CategoryCard from './CategoryCard.vue'
import type { RefCategory } from '@/types'

const { state, setRefActiveCategory } = useAppState()

// 分类列表
const categories = computed(() => refConfigData.categories)

// 统计信息
const stats = computed(() => {
  const totalCategories = refConfigData.categories.length
  const totalOptions = refConfigData.categories.reduce(
    (sum, cat) => sum + cat.options.length,
    0
  )
  const selectedCount = Object.keys(state.refSelectedOptions).length
  return { totalCategories, totalOptions, selectedCount }
})

// 过滤后的分类
const filteredCategories = computed(() => {
  const query = state.refSearchQuery.toLowerCase()
  const activeCategory = state.refActiveCategory

  // 已选模式：只显示已选中的选项
  if (activeCategory === '__selected__') {
    const selectedOptions = Object.keys(state.refSelectedOptions)
    if (selectedOptions.length === 0) return []

    // 找出所有已选选项并按原分类分组
    return refConfigData.categories
      .map((category): RefCategory | null => {
        const filteredOptions = category.options.filter(
          (opt) =>
            selectedOptions.includes(opt.option) &&
            (query === '' ||
              opt.option.toLowerCase().includes(query) ||
              opt.description.toLowerCase().includes(query))
        )
        if (filteredOptions.length === 0) return null
        return { ...category, options: filteredOptions }
      })
      .filter((cat): cat is RefCategory => cat !== null)
  }

  // 正常分类过滤
  return refConfigData.categories
    .map((category): RefCategory | null => {
      // 分类过滤
      if (activeCategory !== 'all' && category.name !== activeCategory) {
        return null
      }

      // 搜索过滤
      if (!query) return category

      const filteredOptions = category.options.filter(
        (opt) =>
          opt.option.toLowerCase().includes(query) ||
          opt.description.toLowerCase().includes(query)
      )

      if (filteredOptions.length === 0) return null

      return {
        ...category,
        options: filteredOptions
      }
    })
    .filter((cat): cat is RefCategory => cat !== null)
})

// 是否有结果
const hasResults = computed(() => filteredCategories.value.length > 0)

// 选择分类
function selectCategory(categoryName: string) {
  setRefActiveCategory(categoryName)
}
</script>

<template>
  <div class="reference-container">
    <!-- 搜索 -->
    <ReferenceSearch />

    <!-- 分类导航 -->
    <nav class="ref-category-nav">
      <button
        class="ref-category-chip"
        :class="{ active: state.refActiveCategory === 'all' }"
        @click="selectCategory('all')"
      >
        全部
      </button>
      <button
        v-for="cat in categories"
        :key="cat.name"
        class="ref-category-chip"
        :class="{ active: state.refActiveCategory === cat.name }"
        @click="selectCategory(cat.name)"
      >
        {{ cat.name }}
      </button>

      <!-- 已选导航 -->
      <button
        class="ref-category-chip ref-selected-chip"
        :class="{ active: state.refActiveCategory === '__selected__' }"
        @click="selectCategory('__selected__')"
      >
        已选({{ stats.selectedCount }})
      </button>
    </nav>

    <!-- 分类卡片 -->
    <div class="ref-cards-container">
      <template v-if="hasResults">
        <CategoryCard
          v-for="(category, index) in filteredCategories"
          :key="index"
          :category="category"
        />
      </template>
  
      <div v-else class="ref-no-results">
        <p>没有找到匹配的选项</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reference-container {
  font-family: var(--font-sans);
  max-width: 1200px;
}

/* Hero 区域 */
.ref-hero {
  text-align: center;
  padding: 24px 0 32px;
}

.ref-hero-title {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--ref-text);
}

.ref-hero-subtitle {
  font-size: 14px;
  color: var(--ref-text-muted);
}

/* 分类导航 */
.ref-category-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.ref-category-chip {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  background: var(--ref-bg-card);
  border: 1px solid var(--ref-border);
  border-radius: 999px;
  color: var(--ref-text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.ref-category-chip:hover {
  border-color: var(--ref-primary);
  color: var(--ref-primary);
}

.ref-category-chip.active {
  background: var(--ref-primary);
  border-color: var(--ref-primary);
  color: white;
}

/* 已选导航项特殊样式 */
.ref-selected-chip {
  margin-left: 8px;
  border-left: 3px solid var(--ref-primary);
  padding-left: 11px;
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
}
</style>
