import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RefCategory } from '@/types'
import { compileOptionsData as rawCompileOptionsData, optimizationLevels as rawOptimizationLevels } from './compileOptions'
import { refConfigData as rawRefConfigData } from './refConfigData'

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
 * Localized reference data with translated categories
 * MUST be called from within a component setup function
 */
export function useRefConfigData() {
  const { t } = useI18n()
  return computed(() => {
    const localizedCategories: RefCategory[] = rawRefConfigData.categories.map(cat => ({
      ...cat,
      name: cat.nameKey ? t(`categories.${cat.nameKey}`) : cat.name,
      options: cat.options.map(opt => ({
        ...opt,
        // Note: description and hint translations would need a separate translation system
        // For now, keep them as-is since they're extensive
      }))
    }))
    return { categories: localizedCategories }
  })
}
