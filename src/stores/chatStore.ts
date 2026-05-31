import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { translate } from '@/i18n/messages'
import { sendChatRequest } from '@/api/chat'
import type { ChatError, ChatMessage, ChatRequestMessage, ChatSession } from '@/types/chat'
import { createId } from '@/utils/id'
import { loadActiveSessionId, loadSessions, saveActiveSessionId, saveSessions } from '@/utils/storage'
import { deriveSessionTitle } from '@/utils/title'
import { useProviderStore } from './providerStore'
import { useSettingsStore } from './settingsStore'

export const useChatStore = defineStore('chat', () => {
  const providerStore = useProviderStore()
  const settingsStore = useSettingsStore()

  const sessions = ref<ChatSession[]>(loadSessions())
  const activeSessionId = ref<string | null>(loadActiveSessionId())
  const isStreaming = ref(false)
  const streamingSessionId = ref<string | null>(null)
  const lastError = ref<string | null>(null)
  const abortController = ref<AbortController | null>(null)

  const orderedSessions = computed(() =>
    [...sessions.value].sort((left, right) => right.updatedAt - left.updatedAt),
  )

  const activeSession = computed(() =>
    sessions.value.find((session) => session.id === activeSessionId.value) ?? null,
  )

  if (activeSessionId.value && !activeSession.value) {
    activeSessionId.value = sessions.value[0]?.id ?? null
  }

  function persist(): void {
    saveSessions(sessions.value)
    saveActiveSessionId(activeSessionId.value)
  }

  function t(key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]): string {
    return translate(settingsStore.effectiveLocale, key, params)
  }

  function getEmptyTitle(): string {
    return t('chat.newTitle')
  }

  function createSession(): ChatSession {
    const defaultProvider = providerStore.defaultProvider
    const timestamp = Date.now()
    const session: ChatSession = {
      id: createId(),
      title: getEmptyTitle(),
      providerId: defaultProvider?.id ?? '',
      model: defaultProvider?.defaultModel || defaultProvider?.models[0] || '',
      messages: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    sessions.value = [session, ...sessions.value]
    activeSessionId.value = session.id
    persist()

    return session
  }

  function selectSession(sessionId: string | null): void {
    activeSessionId.value = sessionId
    persist()
  }

  function getSession(sessionId: string): ChatSession | null {
    return sessions.value.find((session) => session.id === sessionId) ?? null
  }

  function renameSession(sessionId: string, title: string): void {
    const nextTitle = title.trim() || getEmptyTitle()
    updateSession(sessionId, (session) => {
      session.title = nextTitle
    })
  }

  function deleteSession(sessionId: string): void {
    sessions.value = sessions.value.filter((session) => session.id !== sessionId)

    if (activeSessionId.value === sessionId) {
      activeSessionId.value = sessions.value[0]?.id ?? null
    }

    persist()
  }

  function clearSession(sessionId: string): void {
    updateSession(sessionId, (session) => {
      session.messages = []
      session.title = getEmptyTitle()
    })
  }

  function updateSessionContext(sessionId: string, providerId: string, model: string): void {
    updateSession(sessionId, (session) => {
      session.providerId = providerId
      session.model = model
    })
  }

  async function sendMessage(content: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const trimmed = content.trim()

    if (!trimmed) {
      return { ok: false, error: t('errors.enterMessage') }
    }

    if (isStreaming.value) {
      return { ok: false, error: t('errors.waitCurrentResponse') }
    }

    let session = activeSession.value

    if (!session) {
      session = createSession()
    }

    const context = ensureSessionContext(session.id)

    if (!context.ok) {
      return context
    }

    lastError.value = null

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: trimmed,
      status: 'normal',
      createdAt: Date.now(),
    }

    const assistantMessage: ChatMessage = {
      id: createId(),
      role: 'assistant',
      content: '',
      status: 'streaming',
      createdAt: Date.now(),
    }

    updateSession(session.id, (draft) => {
      if (draft.messages.length === 0) {
        draft.title = deriveSessionTitle(trimmed, getEmptyTitle())
      }

      draft.messages.push(userMessage, assistantMessage)
    })

    await runAssistantReply(session.id, assistantMessage.id)
    return { ok: true }
  }

  async function regenerateLastReply(sessionId = activeSessionId.value): Promise<{ ok: boolean; error?: string }> {
    if (!sessionId) {
      return { ok: false, error: t('errors.noActiveChat') }
    }

    if (isStreaming.value) {
      return { ok: false, error: t('errors.stopBeforeRegenerate') }
    }

    const session = getSession(sessionId)

    if (!session) {
      return { ok: false, error: t('errors.chatSessionNotFound') }
    }

    const context = ensureSessionContext(session.id)

    if (!context.ok) {
      return context
    }

    const lastAssistantIndex = [...session.messages]
      .reverse()
      .findIndex((message) => message.role === 'assistant')

    if (lastAssistantIndex === -1) {
      return { ok: false, error: t('errors.noAssistantMessage') }
    }

    const targetIndex = session.messages.length - 1 - lastAssistantIndex
    const targetMessage = session.messages[targetIndex]

    updateSession(session.id, (draft) => {
      draft.messages.splice(targetIndex, 1)
      draft.messages.push({
        id: createId(),
        role: 'assistant',
        content: '',
        status: 'streaming',
        createdAt: Date.now(),
      })
    })

    const nextAssistant = getSession(session.id)?.messages.at(-1)

    if (!nextAssistant) {
      return { ok: false, error: t('errors.prepareAssistantFailed') }
    }

    if (targetMessage.role !== 'assistant') {
      return { ok: false, error: t('errors.notAssistantReply') }
    }

    await runAssistantReply(session.id, nextAssistant.id)
    return { ok: true }
  }

  function stopStreaming(): void {
    abortController.value?.abort()
  }

  function setMessageError(sessionId: string, messageId: string, errorMessage: string): void {
    updateSession(sessionId, (session) => {
      const message = session.messages.find((entry) => entry.id === messageId)

      if (!message) {
        return
      }

      message.status = 'error'
      message.errorMessage = errorMessage

      if (!message.content) {
        message.content = errorMessage
      }
    })
  }

  function ensureSessionContext(
    sessionId: string,
  ): { ok: true } | { ok: false; error: string } {
    const session = getSession(sessionId)

    if (!session) {
      return { ok: false, error: t('errors.chatSessionNotFound') }
    }

    let providerId = session.providerId
    let model = session.model

    if (!providerId) {
      providerId = providerStore.defaultProvider?.id ?? ''
    }

    const provider = providerId ? providerStore.getProvider(providerId) : null

    if (!provider || !provider.enabled) {
      return { ok: false, error: t('errors.configureProvider') }
    }

    if (!model) {
      model = provider.defaultModel || provider.models[0] || ''
    }

    if (!model) {
      return { ok: false, error: t('errors.chooseModel') }
    }

    if (!provider.baseUrl.trim()) {
      return { ok: false, error: t('errors.missingBaseUrl') }
    }

    if (!provider.apiKey.trim()) {
      return { ok: false, error: t('errors.missingApiKey') }
    }

    if (providerId !== session.providerId || model !== session.model) {
      updateSession(sessionId, (draft) => {
        draft.providerId = providerId
        draft.model = model
      })
    }

    return { ok: true }
  }

  async function runAssistantReply(sessionId: string, assistantMessageId: string): Promise<void> {
    const session = getSession(sessionId)

    if (!session) {
      return
    }

    const provider = providerStore.getProvider(session.providerId)

    if (!provider) {
      setMessageError(sessionId, assistantMessageId, t('errors.providerNotFound'))
      return
    }

    const requestMessages: ChatRequestMessage[] = session.messages
      .filter((message) => message.id !== assistantMessageId)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }))

    const controller = new AbortController()
    abortController.value = controller
    isStreaming.value = true
    streamingSessionId.value = sessionId

    try {
      await sendChatRequest(
        {
          provider,
          model: session.model,
          messages: requestMessages,
          stream: settingsStore.settings.streamEnabled,
          advancedParams:
            Object.keys(settingsStore.settings.advancedParams).length > 0
              ? settingsStore.settings.advancedParams
              : undefined,
        },
        {
          signal: controller.signal,
          locale: settingsStore.effectiveLocale,
          onChunk: (chunk) => {
            updateSession(sessionId, (draft) => {
              const message = draft.messages.find((entry) => entry.id === assistantMessageId)

              if (!message) {
                return
              }

              message.status = 'streaming'
              message.content += chunk
              message.errorMessage = undefined
            })
          },
        },
      )

      updateSession(sessionId, (draft) => {
        const message = draft.messages.find((entry) => entry.id === assistantMessageId)

        if (!message) {
          return
        }

        message.status = 'normal'
        message.errorMessage = undefined
      })
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        updateSession(sessionId, (draft) => {
          const message = draft.messages.find((entry) => entry.id === assistantMessageId)

          if (!message) {
            return
          }

          if (message.content.trim()) {
            message.status = 'normal'
            message.errorMessage = undefined
          } else {
            message.status = 'error'
            message.content = t('chat.stopMessage')
            message.errorMessage = t('chat.stopMessage')
          }
        })
      } else {
        const chatError = normalizeChatError(error, t('errors.generationFailed'))
        lastError.value = chatError.message
        setMessageError(sessionId, assistantMessageId, chatError.message)
      }
    } finally {
      isStreaming.value = false
      streamingSessionId.value = null
      abortController.value = null
    }
  }

  function updateSession(sessionId: string, updater: (session: ChatSession) => void): void {
    const nextSessions = sessions.value.map((session) => {
      if (session.id !== sessionId) {
        return session
      }

      const draft: ChatSession = {
        ...session,
        messages: session.messages.map((message) => ({ ...message })),
      }

      updater(draft)
      draft.updatedAt = Date.now()
      return draft
    })

    sessions.value = nextSessions
    persist()
  }

  return {
    sessions,
    orderedSessions,
    activeSessionId,
    activeSession,
    isStreaming,
    streamingSessionId,
    lastError,
    getSession,
    createSession,
    selectSession,
    renameSession,
    deleteSession,
    clearSession,
    updateSessionContext,
    sendMessage,
    regenerateLastReply,
    stopStreaming,
  }
})

function normalizeChatError(error: unknown, fallbackMessage: string): ChatError {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    const source = error as Partial<ChatError>
    return {
      type: source.type ?? 'unknown',
      message: source.message ?? fallbackMessage,
      statusCode: source.statusCode,
    }
  }

  if (error instanceof Error) {
    return {
      type: 'unknown',
      message: error.message,
    }
  }

  return {
    type: 'unknown',
    message: fallbackMessage,
  }
}
