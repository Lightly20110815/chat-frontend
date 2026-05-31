<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'
import Textarea from '@/components/common/Textarea.vue'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  modelValue: string
  disabled?: boolean
  isStreaming: boolean
  errorMessage?: string | null
  lockedReason?: string | null
  lockedActionLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
  stop: []
  'locked-action': []
}>()

const { t } = useI18n()

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()

    if (props.isStreaming) {
      emit('stop')
      return
    }

    if (!props.lockedReason && !props.disabled) {
      emit('submit')
    }
  }
}
</script>

<template>
  <footer class="chat-input-wrap">
    <div v-if="lockedReason" class="input-lock surface-card">
      <div>
        <p class="input-lock__title">{{ t('chat.inputWaitingTitle') }}</p>
        <p class="input-lock__copy">{{ lockedReason }}</p>
      </div>
      <Button variant="primary" @click="emit('locked-action')">
        {{ lockedActionLabel || t('chat.openSettings') }}
      </Button>
    </div>

    <div v-else class="chat-input surface-card">
      <Textarea
        :model-value="modelValue"
        :disabled="disabled"
        :placeholder="t('chat.inputPlaceholder')"
        @update:model-value="emit('update:modelValue', $event)"
        @keydown="onKeydown"
      />

      <div class="chat-input__footer">
        <div class="chat-input__meta">
          <p v-if="errorMessage" class="chat-input__error">{{ errorMessage }}</p>
          <p v-else class="chat-input__note">
            {{ t('chat.localNotice') }}
          </p>
        </div>

        <Button
          :variant="isStreaming ? 'danger' : 'primary'"
          :disabled="disabled || (!isStreaming && !modelValue.trim())"
          @click="isStreaming ? emit('stop') : emit('submit')"
        >
          {{ isStreaming ? t('chat.stop') : t('chat.send') }}
        </Button>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.chat-input-wrap {
  width: 100%;
  padding: 0 1.2rem 1.2rem;
}

.chat-input,
.input-lock {
  width: min(100%, var(--chat-max-width));
  margin: 0 auto;
}

.chat-input {
  display: grid;
  gap: 0.9rem;
  padding: 0.95rem;
}

.chat-input__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.chat-input__meta {
  min-width: 0;
}

.chat-input__note,
.chat-input__error {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.6;
}

.chat-input__note {
  color: var(--text-soft);
}

.chat-input__error {
  color: var(--danger-text);
}

.input-lock {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.1rem;
}

.input-lock__title,
.input-lock__copy {
  margin: 0;
}

.input-lock__copy {
  margin-top: 0.22rem;
  color: var(--text-muted);
}

@media (max-width: 700px) {
  .chat-input-wrap {
    padding: 0 0.85rem 0.85rem;
  }

  .chat-input__footer,
  .input-lock {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
