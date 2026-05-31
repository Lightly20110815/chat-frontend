import { computed } from 'vue'
import { PROVIDER_TYPE_OPTIONS, type ProviderType } from '@/types/provider'
import type { LocaleMode, ThemeMode } from '@/types/settings'
import {
  localeModeKey,
  providerTypeDescriptionKey,
  providerTypeLabelKey,
  themeModeKey,
  translate,
} from '@/i18n/messages'
import { useSettingsStore } from '@/stores/settingsStore'

export function useI18n() {
  const settingsStore = useSettingsStore()

  const locale = computed(() => settingsStore.effectiveLocale)

  function t(key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]): string {
    return translate(locale.value, key, params)
  }

  function providerTypeLabel(type: ProviderType): string {
    return t(providerTypeLabelKey(type))
  }

  function providerTypeDescription(type: ProviderType): string {
    return t(providerTypeDescriptionKey(type))
  }

  function themeModeLabel(mode: ThemeMode): string {
    return t(themeModeKey(mode))
  }

  function localeModeLabel(mode: LocaleMode): string {
    return t(localeModeKey(mode))
  }

  const providerTypeOptions = computed(() =>
    PROVIDER_TYPE_OPTIONS.map((option) => ({
      ...option,
      label: providerTypeLabel(option.value),
      description: providerTypeDescription(option.value),
    })),
  )

  const localeOptions = computed(() => [
    { value: 'system' as const, label: localeModeLabel('system') },
    { value: 'en' as const, label: localeModeLabel('en') },
    { value: 'zh-CN' as const, label: localeModeLabel('zh-CN') },
  ])

  return {
    locale,
    t,
    providerTypeLabel,
    providerTypeDescription,
    providerTypeOptions,
    themeModeLabel,
    localeModeLabel,
    localeOptions,
  }
}
