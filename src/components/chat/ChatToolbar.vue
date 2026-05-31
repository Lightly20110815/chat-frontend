<script setup lang="ts">
import type { ChatSession } from '@/types/chat'
import { useI18n } from '@/composables/useI18n'
import type { Provider } from '@/types/provider'
import Button from '@/components/common/Button.vue'
import IconButton from '@/components/common/IconButton.vue'

const { t } = useI18n()

defineProps<{
  session: ChatSession | null
  provider: Provider | null
  providers: Provider[]
  selectedModel: string
  availableModels: string[]
  canClear: boolean
  canRegenerate: boolean
  isStreaming: boolean
}>()

const emit = defineEmits<{
  'open-sidebar': []
  'open-settings': []
  'clear-chat': []
  regenerate: []
  'change-provider': [providerId: string]
  'change-model': [model: string]
}>()
</script>

<template>
  <header class="chat-toolbar">
    <div class="chat-toolbar__lead">
      <IconButton :label="t('chat.openSessions')" class="chat-toolbar__menu" @click="emit('open-sidebar')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </IconButton>

      <div class="chat-toolbar__title-wrap">
        <p class="chat-toolbar__eyebrow">{{ session ? t('chat.conversation') : t('chat.workspace') }}</p>
        <h2 class="chat-toolbar__title">{{ session?.title || t('app.name') }}</h2>
      </div>
    </div>

    <div class="chat-toolbar__controls">
      <div class="meta-group">
        <template v-if="session && provider">
          <label class="sr-only" for="provider-select">{{ t('chat.provider') }}</label>
          <select
            id="provider-select"
            class="select-input toolbar-select"
            :value="provider.id"
            @change="emit('change-provider', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="item in providers" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>

          <label class="sr-only" for="model-select">{{ t('chat.model') }}</label>
          <select
            id="model-select"
            class="select-input toolbar-select"
            :value="selectedModel"
            @change="emit('change-model', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="model in availableModels" :key="model" :value="model">
              {{ model }}
            </option>
          </select>
        </template>

        <template v-else>
          <span class="meta-badge" :class="{ 'is-accent': provider }">
            {{ provider ? provider.name : t('chat.providerNotConfigured') }}
          </span>
          <span v-if="selectedModel" class="meta-badge">{{ selectedModel }}</span>
        </template>
      </div>

      <div class="chat-toolbar__actions">
        <Button variant="ghost" size="sm" @click="emit('open-settings')">{{ t('chat.settings') }}</Button>
        <Button variant="ghost" size="sm" :disabled="!canRegenerate || isStreaming" @click="emit('regenerate')">
          {{ t('chat.regenerate') }}
        </Button>
        <Button variant="ghost" size="sm" :disabled="!canClear || isStreaming" @click="emit('clear-chat')">
          {{ t('chat.clear') }}
        </Button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.chat-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--border);
  background: var(--toolbar-bg);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.chat-toolbar__lead,
.chat-toolbar__controls,
.meta-group,
.chat-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chat-toolbar__lead {
  min-width: 0;
}

.chat-toolbar__menu {
  display: none;
}

.chat-toolbar__title-wrap {
  min-width: 0;
}

.chat-toolbar__eyebrow,
.chat-toolbar__title {
  margin: 0;
}

.chat-toolbar__eyebrow {
  color: var(--text-soft);
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.chat-toolbar__title {
  max-width: 24rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1rem;
}

.toolbar-select {
  width: auto;
  min-width: 9rem;
}

@media (max-width: 900px) {
  .chat-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .chat-toolbar__controls {
    width: 100%;
    align-items: stretch;
    flex-direction: column;
  }

  .meta-group,
  .chat-toolbar__actions {
    flex-wrap: wrap;
  }

  .chat-toolbar__menu {
    display: inline-flex;
  }

  .toolbar-select {
    width: 100%;
  }
}
</style>
