import type { AdvancedParams } from './chat'

export type ThemeMode = 'dark' | 'light' | 'system'
export type SupportedLocale = 'en' | 'zh-CN'
export type LocaleMode = 'system' | SupportedLocale

export interface Settings {
  theme: ThemeMode
  locale: LocaleMode
  defaultProviderId: string | null
  streamEnabled: boolean
  saveApiKeyLocally: boolean
  advancedParams: AdvancedParams
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  locale: 'system',
  defaultProviderId: null,
  streamEnabled: true,
  saveApiKeyLocally: true,
  advancedParams: {},
}
