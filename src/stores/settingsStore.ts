import { defineStore } from 'pinia'
import { ref } from 'vue'
import { detectSystemLocale, resolveLocale } from '@/i18n/messages'
import type { AdvancedParams } from '@/types/chat'
import { DEFAULT_SETTINGS, type LocaleMode, type Settings, type SupportedLocale, type ThemeMode } from '@/types/settings'
import { loadSettings, redactStoredProviderKeys, saveSettings } from '@/utils/storage'

let systemThemeQuery: MediaQueryList | null = null
let systemThemeHandler: ((event: MediaQueryListEvent) => void) | null = null
let systemLanguageHandler: (() => void) | null = null

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>(loadSettings(DEFAULT_SETTINGS))
  const effectiveLocale = ref<SupportedLocale>(resolveLocale(settings.value.locale))

  function persist(): void {
    saveSettings(settings.value)
  }

  function updateSettings(patch: Partial<Settings>): void {
    settings.value = {
      ...settings.value,
      ...patch,
    }
    persist()
    applyTheme()
    applyLocale()
  }

  function setTheme(theme: ThemeMode): void {
    updateSettings({ theme })
  }

  function setLocale(locale: LocaleMode): void {
    updateSettings({ locale })
  }

  function cycleTheme(): void {
    setTheme(resolveEffectiveTheme() === 'dark' ? 'light' : 'dark')
  }

  function setStreamEnabled(value: boolean): void {
    updateSettings({ streamEnabled: value })
  }

  function setDefaultProviderId(providerId: string | null): void {
    updateSettings({ defaultProviderId: providerId })
  }

  function setSaveApiKeyLocally(value: boolean): void {
    updateSettings({ saveApiKeyLocally: value })

    if (!value) {
      redactStoredProviderKeys()
    }
  }

  function setAdvancedParams(params: AdvancedParams): void {
    updateSettings({ advancedParams: sanitizeAdvancedParams(params) })
  }

  function applyTheme(): void {
    if (typeof window === 'undefined') {
      return
    }

    document.documentElement.dataset.theme = resolveEffectiveTheme()
  }

  function initializeTheme(): void {
    applyTheme()

    if (typeof window === 'undefined') {
      return
    }

    if (!systemThemeQuery) {
      systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    }

    if (!systemThemeHandler) {
      systemThemeHandler = () => {
        if (settings.value.theme === 'system') {
          applyTheme()
        }
      }

      systemThemeQuery.addEventListener('change', systemThemeHandler)
    }
  }

  function disposeTheme(): void {
    if (systemThemeQuery && systemThemeHandler) {
      systemThemeQuery.removeEventListener('change', systemThemeHandler)
      systemThemeHandler = null
    }
  }

  function resolveEffectiveTheme(): 'dark' | 'light' {
    if (settings.value.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    return settings.value.theme
  }

  function applyLocale(): void {
    if (typeof window === 'undefined') {
      effectiveLocale.value = settings.value.locale === 'system' ? detectSystemLocale() : settings.value.locale
      return
    }

    effectiveLocale.value = resolveLocale(settings.value.locale)
    document.documentElement.lang = effectiveLocale.value
  }

  function initializeLocale(): void {
    applyLocale()

    if (typeof window === 'undefined' || systemLanguageHandler) {
      return
    }

    systemLanguageHandler = () => {
      if (settings.value.locale === 'system') {
        applyLocale()
      }
    }

    window.addEventListener('languagechange', systemLanguageHandler)
  }

  function disposeLocale(): void {
    if (systemLanguageHandler) {
      window.removeEventListener('languagechange', systemLanguageHandler)
      systemLanguageHandler = null
    }
  }

  return {
    settings,
    effectiveLocale,
    applyTheme,
    initializeTheme,
    disposeTheme,
    applyLocale,
    initializeLocale,
    disposeLocale,
    cycleTheme,
    setTheme,
    setLocale,
    setStreamEnabled,
    setDefaultProviderId,
    setSaveApiKeyLocally,
    setAdvancedParams,
  }
})

function sanitizeAdvancedParams(params: AdvancedParams): AdvancedParams {
  const next: AdvancedParams = {}

  if (typeof params.temperature === 'number') {
    next.temperature = params.temperature
  }

  if (typeof params.top_p === 'number') {
    next.top_p = params.top_p
  }

  if (typeof params.max_tokens === 'number') {
    next.max_tokens = params.max_tokens
  }

  if (typeof params.presence_penalty === 'number') {
    next.presence_penalty = params.presence_penalty
  }

  if (typeof params.frequency_penalty === 'number') {
    next.frequency_penalty = params.frequency_penalty
  }

  return next
}
