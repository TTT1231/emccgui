import { createI18n } from 'vue-i18n'
import en from './locales/en'
import zhCN from './locales/zh-CN'

// Get saved language from localStorage or use browser language
function getDefaultLocale(): string {
  const saved = localStorage.getItem('emccgui-locale')
  if (saved && (saved === 'en' || saved === 'zh-CN')) {
    return saved
  }
  // Check browser language
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) {
    return 'zh-CN'
  }
  return 'en'
}

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-CN': zhCN,
  },
})

export default i18n

export function setLocale(locale: string): void {
  if (i18n.mode === 'legacy') {
    (i18n.global as any).locale = locale
  } else {
    (i18n.global.locale as any).value = locale
  }
  localStorage.setItem('emccgui-locale', locale)
  document.documentElement.lang = locale
}

export function getCurrentLocale(): string {
  if (i18n.mode === 'legacy') {
    return (i18n.global as any).locale
  }
  return (i18n.global.locale as any).value
}
