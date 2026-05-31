export type ProviderType =
  | 'openai-compatible'
  | 'anthropic'
  | 'gemini'
  | 'custom'

export interface Provider {
  id: string
  name: string
  type: ProviderType
  baseUrl: string
  apiKey: string
  models: string[]
  defaultModel: string
  enabled: boolean
  createdAt: number
  updatedAt: number
}

export interface ProviderDraft {
  name: string
  type: ProviderType
  baseUrl: string
  apiKey: string
  models: string[]
  defaultModel: string
  enabled: boolean
}

export interface ProviderTypeOption {
  value: ProviderType
  baseUrlPlaceholder: string
}

export const PROVIDER_TYPE_OPTIONS: ProviderTypeOption[] = [
  {
    value: 'openai-compatible',
    baseUrlPlaceholder: 'https://api.openai.com/v1',
  },
  {
    value: 'anthropic',
    baseUrlPlaceholder: 'https://api.anthropic.com/v1',
  },
  {
    value: 'gemini',
    baseUrlPlaceholder: 'https://generativelanguage.googleapis.com/v1beta',
  },
  {
    value: 'custom',
    baseUrlPlaceholder: 'https://your-provider.example/v1',
  },
]

export const DEFAULT_PROVIDER_DRAFT: ProviderDraft = {
  name: '',
  type: 'openai-compatible',
  baseUrl: '',
  apiKey: '',
  models: [],
  defaultModel: '',
  enabled: true,
}
