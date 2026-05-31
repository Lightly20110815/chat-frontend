<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useChatStore } from '@/stores/chatStore'
import { useProviderStore } from '@/stores/providerStore'
import ChatInput from './ChatInput.vue'
import ChatToolbar from './ChatToolbar.vue'
import EmptyState from './EmptyState.vue'
import MessageList from './MessageList.vue'

const emit = defineEmits<{
  'open-settings': []
  'open-sidebar': []
}>()

const chatStore = useChatStore()
const providerStore = useProviderStore()
const { t } = useI18n()

const draftMessage = ref('')
const composerError = ref<string | null>(null)

const activeSession = computed(() => chatStore.activeSession)
const enabledProviders = computed(() => providerStore.enabledProviders)

const resolvedProvider = computed(() => {
  if (activeSession.value?.providerId) {
    return providerStore.getProvider(activeSession.value.providerId)
  }

  return providerStore.defaultProvider
})

const resolvedModel = computed(() => {
  if (activeSession.value?.model) {
    return activeSession.value.model
  }

  return resolvedProvider.value?.defaultModel || resolvedProvider.value?.models[0] || ''
})

const availableModels = computed(() => {
  const provider = resolvedProvider.value
  return provider ? provider.models : []
})

const lockedReason = computed(() => {
  if (!enabledProviders.value.length) {
    return t('errors.configureProvider')
  }

  if (!resolvedModel.value) {
    return t('errors.chooseModel')
  }

  return null
})

watch(
  () => chatStore.lastError,
  (value) => {
    if (value) {
      composerError.value = value
    }
  },
)

async function submit(): Promise<void> {
  composerError.value = null
  const result = await chatStore.sendMessage(draftMessage.value)

  if (!result.ok) {
    composerError.value = result.error
    return
  }

  draftMessage.value = ''
}

async function regenerate(): Promise<void> {
  const result = await chatStore.regenerateLastReply()

  if (!result.ok) {
    composerError.value = result.error ?? t('errors.unableToRegenerate')
  }
}

function startNewChat(): void {
  chatStore.createSession()
}

function updateProvider(providerId: string): void {
  const session = activeSession.value
  const provider = providerStore.getProvider(providerId)

  if (!session || !provider) {
    return
  }

  const model = provider.defaultModel || provider.models[0] || ''
  chatStore.updateSessionContext(session.id, provider.id, model)
}

function updateModel(model: string): void {
  const session = activeSession.value
  const provider = resolvedProvider.value

  if (!session || !provider) {
    return
  }

  chatStore.updateSessionContext(session.id, provider.id, model)
}
</script>

<template>
  <section class="chat-view">
    <ChatToolbar
      :session="activeSession"
      :provider="resolvedProvider"
      :providers="enabledProviders"
      :selected-model="resolvedModel"
      :available-models="availableModels"
      :can-clear="Boolean(activeSession?.messages.length)"
      :can-regenerate="Boolean(activeSession?.messages.length)"
      :is-streaming="chatStore.isStreaming"
      @open-settings="emit('open-settings')"
      @open-sidebar="emit('open-sidebar')"
      @clear-chat="activeSession && chatStore.clearSession(activeSession.id)"
      @regenerate="regenerate"
      @change-provider="updateProvider"
      @change-model="updateModel"
    />

    <div v-if="activeSession?.messages.length" class="chat-view__content">
      <MessageList :messages="activeSession.messages" />
    </div>
    <div v-else class="chat-view__content chat-view__content--empty">
      <EmptyState
        :has-providers="enabledProviders.length > 0"
        :provider-name="resolvedProvider?.name"
        :model-name="resolvedModel"
        @new-chat="startNewChat"
        @open-settings="emit('open-settings')"
      />
    </div>

    <ChatInput
      v-model="draftMessage"
      :is-streaming="chatStore.isStreaming"
      :error-message="composerError"
      :locked-reason="lockedReason"
      :locked-action-label="t('chat.openSettings')"
      @submit="submit"
      @stop="chatStore.stopStreaming"
      @locked-action="emit('open-settings')"
    />
  </section>
</template>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.chat-view__content {
  flex: 1;
  min-height: 0;
}

.chat-view__content--empty {
  padding: 1.2rem;
}

@media (max-width: 700px) {
  .chat-view__content--empty {
    padding: 0.85rem;
  }
}
</style>
