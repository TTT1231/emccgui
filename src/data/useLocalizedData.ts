import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RefCategory, RefConfigData, RefOption, SearchOption } from '@/types'
import { compileOptionsData as rawCompileOptionsData, optimizationLevels as rawOptimizationLevels } from './compileOptions'
import { refConfigData as rawRefConfigData } from './refConfigData'
import rawSearchOptions from './options.json'
import { runtimeMethodsData } from './runtimeMethods'

/**
 * Localized compile options with translated categories and hints
 * MUST be called from within a component setup function
 */
export function useLocalizedCompileOptions() {
  const { t } = useI18n()
  return computed(() => {
    return rawCompileOptionsData.map(opt => ({
      ...opt,
      category: opt.categoryKey ? t(`categories.${opt.categoryKey}`) : opt.category,
      hint: opt.hintKey ? t(`hints.${opt.hintKey}`) : opt.hint,
    }))
  })
}

/**
 * Localized optimization levels with translated labels
 * MUST be called from within a component setup function
 */
export function useLocalizedOptimizationLevels() {
  const { t } = useI18n()
  return computed(() => {
    return rawOptimizationLevels.map(level => ({
      ...level,
      label: level.labelKey ? t(`optimization.${level.labelKey}`) : level.label,
    }))
  })
}

/**
 * Localized reference data with translated categories and descriptions
 * Uses nameZh/descriptionZh fields when locale is zh-CN
 * MUST be called from within a component setup function
 *
 * Note: Each category gets an `id` field (stable English name) for consistent
 * identification across language switches, while `name` becomes the display name.
 */
export function useRefConfigData() {
  const { locale } = useI18n()
  return computed((): RefConfigData => {
    const isZhCN = locale.value === 'zh-CN'
    const localizedCategories: RefCategory[] = rawRefConfigData.categories.map(cat => ({
      ...cat,
      id: cat.name, // Stable identifier (always English)
      name: isZhCN && cat.nameZh ? cat.nameZh : cat.name, // Localized display name
      options: cat.options.map((opt: RefOption) => ({
        ...opt,
        description: isZhCN && opt.descriptionZh ? opt.descriptionZh : opt.description,
      }))
    }))
    return { categories: localizedCategories }
  })
}

/**
 * Localized search options for SearchBtn autocomplete
 * Uses descriZh/defaultValDescriZh fields when locale is zh-CN
 * MUST be called from within a component setup function
 */
export function useSearchOptions() {
  const { locale } = useI18n()
  return computed(() => {
    const isZhCN = locale.value === 'zh-CN'
    return (rawSearchOptions as SearchOption[]).map(opt => ({
      ...opt,
      descri: isZhCN && opt.descriZh ? opt.descriZh : opt.descri,
      defaultValDescri: isZhCN && opt.defaultValDescriZh ? opt.defaultValDescriZh : opt.defaultValDescri,
    }))
  })
}

/**
 * Localized runtime methods with translated hints
 * Uses hintZh field when locale is zh-CN
 * MUST be called from within a component setup function
 */
export function useRuntimeMethods() {
  const { locale } = useI18n()
  return computed(() => {
    const isZhCN = locale.value === 'zh-CN'
    return runtimeMethodsData.map(method => ({
      ...method,
      hint: isZhCN && method.hintZh ? method.hintZh : method.hint,
    }))
  })
}
