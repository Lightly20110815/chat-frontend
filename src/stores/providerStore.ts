import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { translate } from '@/i18n/messages'
import type { Provider, ProviderDraft } from '@/types/provider'
import { createId } from '@/utils/id'
import { loadProviders, saveProviders } from '@/utils/storage'
import { useSettingsStore } from './settingsStore'

export const useProviderStore = defineStore('provider', () => {
  const settingsStore = useSettingsStore()
  const providers = ref<Provider[]>(loadProviders())

  const enabledProviders = computed(() => providers.value.filter((provider) => provider.enabled))
  const defaultProvider = computed(() => {
    const configuredDefault = providers.value.find(
      (provider) => provider.id === settingsStore.settings.defaultProviderId && provider.enabled,
    )

    return configuredDefault ?? enabledProviders.value[0] ?? null
  })

  function persist(): void {
    saveProviders(providers.value, settingsStore.settings.saveApiKeyLocally)
  }

  function getProvider(providerId: string): Provider | null {
    return providers.value.find((provider) => provider.id === providerId) ?? null
  }

  function createProvider(draft: ProviderDraft): Provider {
    const timestamp = Date.now()
    const provider: Provider = {
      id: createId(),
      name: draft.name.trim() || translate(settingsStore.effectiveLocale, 'provider.untitled'),
      type: draft.type,
      baseUrl: draft.baseUrl.trim(),
      apiKey: draft.apiKey.trim(),
      models: normalizeModels(draft.models),
      defaultModel: draft.defaultModel.trim(),
      enabled: draft.enabled,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    if (!provider.defaultModel) {
      provider.defaultModel = provider.models[0] ?? ''
    }

    providers.value = [provider, ...providers.value]

    if (!settingsStore.settings.defaultProviderId && provider.enabled) {
      settingsStore.setDefaultProviderId(provider.id)
    }

    persist()

    return provider
  }

  function updateProvider(providerId: string, draft: ProviderDraft): void {
    providers.value = providers.value.map((provider) => {
      if (provider.id !== providerId) {
        return provider
      }

      const models = normalizeModels(draft.models)
      const defaultModel = draft.defaultModel.trim() || models[0] || ''

      return {
        ...provider,
        name: draft.name.trim() || provider.name,
        type: draft.type,
        baseUrl: draft.baseUrl.trim(),
        apiKey: draft.apiKey.trim(),
        models,
        defaultModel,
        enabled: draft.enabled,
        updatedAt: Date.now(),
      }
    })

    if (settingsStore.settings.defaultProviderId) {
      const currentDefault = getProvider(settingsStore.settings.defaultProviderId)

      if (!currentDefault || !currentDefault.enabled) {
        setDefaultProvider(enabledProviders.value[0]?.id ?? null)
        return
      }
    }

    persist()
  }

  function removeProvider(providerId: string): void {
    const isDefault = settingsStore.settings.defaultProviderId === providerId
    providers.value = providers.value.filter((provider) => provider.id !== providerId)

    if (isDefault) {
      setDefaultProvider(enabledProviders.value[0]?.id ?? null)
      return
    }

    persist()
  }

  function setDefaultProvider(providerId: string | null): void {
    settingsStore.setDefaultProviderId(providerId)
    persist()
  }

  return {
    providers,
    enabledProviders,
    defaultProvider,
    getProvider,
    createProvider,
    updateProvider,
    removeProvider,
    setDefaultProvider,
    persist,
  }
})

function normalizeModels(models: string[]): string[] {
  return Array.from(
    new Set(
      models
        .map((model) => model.trim())
        .filter((model) => model.length > 0),
    ),
  )
}
