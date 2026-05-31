<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import type { ChatMessage } from '@/types/chat'
import { renderMarkdown } from '@/utils/markdown'
import IconButton from '@/components/common/IconButton.vue'

const props = defineProps<{
  message: ChatMessage
}>()

const copied = ref(false)
const { t } = useI18n()

const renderedContent = computed(() => renderMarkdown(props.message.content))

async function copyContent(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.message.content)
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1200)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <article class="message-row" :class="`message-row--${message.role}`">
    <div class="message-bubble" :class="[`message-bubble--${message.role}`, `is-${message.status}`]">
      <header class="message-meta">
        <span>{{ message.role === 'user' ? t('chat.you') : message.role === 'assistant' ? t('chat.assistant') : t('chat.system') }}</span>
        <div class="message-actions">
          <span v-if="message.status === 'streaming'" class="streaming">
            <i />
            <i />
            <i />
          </span>
          <span v-if="message.status === 'error' && message.errorMessage" class="error-text">
            {{ message.errorMessage }}
          </span>
          <IconButton :label="copied ? t('chat.copied') : t('chat.copy')" size="sm" @click="copyContent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </IconButton>
        </div>
      </header>

      <div v-if="message.role === 'assistant' || message.role === 'system'" class="markdown-body" v-html="renderedContent" />
      <p v-else class="plain-text">{{ message.content }}</p>
    </div>
  </article>
</template>

<style scoped>
.message-row {
  display: flex;
  animation: rise-in 180ms ease both;
}

.message-row--user {
  justify-content: flex-end;
}

.message-row--assistant,
.message-row--system {
  justify-content: flex-start;
}

.message-bubble {
  width: min(100%, 100%);
  display: grid;
  gap: 0.85rem;
  padding: 1rem 1rem 1rem 1.05rem;
  border: 1px solid var(--border);
  border-radius: 22px;
}

.message-bubble--assistant,
.message-bubble--system {
  max-width: min(100%, 760px);
  background: var(--assistant-bubble);
}

.message-bubble--user {
  max-width: min(100%, 620px);
  background: linear-gradient(180deg, rgba(155, 140, 255, 0.2) 0%, rgba(112, 103, 206, 0.18) 100%);
  border-color: rgba(155, 140, 255, 0.28);
}

.message-bubble.is-error {
  border-color: rgba(255, 139, 154, 0.3);
  background: rgba(255, 139, 154, 0.08);
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: var(--text-soft);
  font-size: 0.82rem;
}

.message-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.plain-text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.75;
  font-size: 0.98rem;
}

.error-text {
  color: var(--danger-text);
}

.streaming {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
}

.streaming i {
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--accent-hover);
  animation: breathe 1000ms ease-in-out infinite;
}

.streaming i:nth-child(2) {
  animation-delay: 120ms;
}

.streaming i:nth-child(3) {
  animation-delay: 240ms;
}
</style>
