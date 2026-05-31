import type { ChatMessage, ChatSession } from '@/types/chat'
import type { Provider, ProviderType } from '@/types/provider'
import type { LocaleMode, Settings } from '@/types/settings'

const STORAGE_PREFIX = 'aiweb_'

export const STORAGE_KEYS = {
  providers: 'providers',
  sessions: 'sessions',
  activeSessionId: 'activeSessionId',
  settings: 'settings',
} as const

function getKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(getKey(key))

    if (!raw) {
      return fallback
    }

    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStorage(key: string, value: unknown): void {
  window.localStorage.setItem(getKey(key), JSON.stringify(value))
}

export function removeStorage(key: string): void {
  window.localStorage.removeItem(getKey(key))
}

export function loadProviders(): Provider[] {
  const raw = readStorage<unknown[]>(STORAGE_KEYS.providers, [])

  return raw
    .map(normalizeProvider)
    .filter((provider): provider is Provider => provider !== null)
}

export function saveProviders(providers: Provider[], includeApiKey: boolean): void {
  const persisted = providers.map((provider) => ({
    ...provider,
    apiKey: includeApiKey ? provider.apiKey : '',
  }))

  writeStorage(STORAGE_KEYS.providers, persisted)
}

export function redactStoredProviderKeys(): void {
  const providers = loadProviders().map((provider) => ({
    ...provider,
    apiKey: '',
  }))

  writeStorage(STORAGE_KEYS.providers, providers)
}

export function loadSessions(): ChatSession[] {
  const raw = readStorage<unknown[]>(STORAGE_KEYS.sessions, [])

  return raw
    .map(normalizeSession)
    .filter((session): session is ChatSession => session !== null)
}

export function saveSessions(sessions: ChatSession[]): void {
  writeStorage(STORAGE_KEYS.sessions, sessions)
}

export function loadActiveSessionId(): string | null {
  const value = readStorage<string | null>(STORAGE_KEYS.activeSessionId, null)
  return typeof value === 'string' ? value : null
}

export function saveActiveSessionId(sessionId: string | null): void {
  if (!sessionId) {
    removeStorage(STORAGE_KEYS.activeSessionId)
    return
  }

  writeStorage(STORAGE_KEYS.activeSessionId, sessionId)
}

export function loadSettings(fallback: Settings): Settings {
  const raw = readStorage<Record<string, unknown>>(STORAGE_KEYS.settings, {})

  return {
    theme:
      raw.theme === 'light' || raw.theme === 'system' || raw.theme === 'dark'
        ? raw.theme
        : fallback.theme,
    locale: normalizeLocale(raw.locale, fallback.locale),
    defaultProviderId:
      typeof raw.defaultProviderId === 'string' ? raw.defaultProviderId : fallback.defaultProviderId,
    streamEnabled:
      typeof raw.streamEnabled === 'boolean' ? raw.streamEnabled : fallback.streamEnabled,
    saveApiKeyLocally:
      typeof raw.saveApiKeyLocally === 'boolean'
        ? raw.saveApiKeyLocally
        : typeof raw.saveApiKeys === 'boolean'
          ? raw.saveApiKeys
          : fallback.saveApiKeyLocally,
    advancedParams: normalizeAdvancedParams(
      raw.advancedParams ??
        (raw.advancedEnabled !== false && typeof raw.advanced === 'object' ? raw.advanced : {}),
    ),
  }
}

export function saveSettings(settings: Settings): void {
  writeStorage(STORAGE_KEYS.settings, settings)
}

function normalizeProvider(raw: unknown): Provider | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const source = raw as Record<string, unknown>
  const now = Date.now()
  const type = normalizeProviderType(source.type ?? source.requestFormat)
  const models = Array.isArray(source.models)
    ? source.models.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    : []

  if (typeof source.id !== 'string' || typeof source.name !== 'string') {
    return null
  }

  return {
    id: source.id,
    name: source.name,
    type,
    baseUrl: typeof source.baseUrl === 'string' ? source.baseUrl : '',
    apiKey: typeof source.apiKey === 'string' ? source.apiKey : '',
    models,
    defaultModel:
      typeof source.defaultModel === 'string'
        ? source.defaultModel
        : models[0] ?? '',
    enabled: typeof source.enabled === 'boolean' ? source.enabled : true,
    createdAt: typeof source.createdAt === 'number' ? source.createdAt : now,
    updatedAt:
      typeof source.updatedAt === 'number'
        ? source.updatedAt
        : typeof source.createdAt === 'number'
          ? source.createdAt
          : now,
  }
}

function normalizeProviderType(value: unknown): ProviderType {
  if (
    value === 'openai-compatible' ||
    value === 'anthropic' ||
    value === 'gemini' ||
    value === 'custom'
  ) {
    return value
  }

  return 'openai-compatible'
}

function normalizeSession(raw: unknown): ChatSession | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const source = raw as Record<string, unknown>
  const messages = Array.isArray(source.messages)
    ? source.messages
        .map(normalizeMessage)
        .filter((message): message is ChatMessage => message !== null)
    : []

  if (
    typeof source.id !== 'string' ||
    typeof source.title !== 'string' ||
    typeof source.providerId !== 'string' ||
    typeof source.model !== 'string'
  ) {
    return null
  }

  const now = Date.now()

  return {
    id: source.id,
    title: source.title,
    providerId: source.providerId,
    model: source.model,
    messages,
    createdAt: typeof source.createdAt === 'number' ? source.createdAt : now,
    updatedAt: typeof source.updatedAt === 'number' ? source.updatedAt : now,
  }
}

function normalizeMessage(raw: unknown): ChatMessage | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const source = raw as Record<string, unknown>

  if (
    typeof source.id !== 'string' ||
    (source.role !== 'system' && source.role !== 'user' && source.role !== 'assistant') ||
    typeof source.content !== 'string'
  ) {
    return null
  }

  return {
    id: source.id,
    role: source.role,
    content: source.content,
    status:
      source.status === 'streaming' || source.status === 'error' || source.status === 'normal'
        ? source.status
        : 'normal',
    createdAt: typeof source.createdAt === 'number' ? source.createdAt : Date.now(),
    errorMessage: typeof source.errorMessage === 'string' ? source.errorMessage : undefined,
  }
}

function normalizeAdvancedParams(raw: unknown): Settings['advancedParams'] {
  if (!raw || typeof raw !== 'object') {
    return {}
  }

  const source = raw as Record<string, unknown>
  const result: Settings['advancedParams'] = {}

  if (typeof source.temperature === 'number') {
    result.temperature = source.temperature
  }

  if (typeof source.top_p === 'number') {
    result.top_p = source.top_p
  } else if (typeof source.topP === 'number') {
    result.top_p = source.topP
  }

  if (typeof source.max_tokens === 'number') {
    result.max_tokens = source.max_tokens
  } else if (typeof source.maxTokens === 'number') {
    result.max_tokens = source.maxTokens
  }

  if (typeof source.presence_penalty === 'number') {
    result.presence_penalty = source.presence_penalty
  } else if (typeof source.presencePenalty === 'number') {
    result.presence_penalty = source.presencePenalty
  }

  if (typeof source.frequency_penalty === 'number') {
    result.frequency_penalty = source.frequency_penalty
  } else if (typeof source.frequencyPenalty === 'number') {
    result.frequency_penalty = source.frequencyPenalty
  }

  return result
}

function normalizeLocale(raw: unknown, fallback: LocaleMode): LocaleMode {
  return raw === 'system' || raw === 'en' || raw === 'zh-CN' ? raw : fallback
}
