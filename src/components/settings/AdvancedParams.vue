<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import Button from '@/components/common/Button.vue'
import type { AdvancedParams } from '@/types/chat'

const props = defineProps<{
  modelValue: AdvancedParams
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AdvancedParams]
}>()

const { t } = useI18n()

const hasValues = computed(() => Object.keys(props.modelValue).length > 0)

function updateField(key: keyof AdvancedParams, rawValue: string): void {
  const next: AdvancedParams = { ...props.modelValue }

  if (rawValue.trim() === '') {
    delete next[key]
  } else {
    const parsed = Number(rawValue)

    if (!Number.isNaN(parsed)) {
      next[key] = parsed
    }
  }

  emit('update:modelValue', next)
}

function clearAll(): void {
  emit('update:modelValue', {})
}
</script>

<template>
  <section class="advanced-panel">
    <header class="advanced-panel__header">
      <div>
        <h3>{{ t('settings.advanced.title') }}</h3>
        <p>{{ t('settings.advanced.copy') }}</p>
      </div>
      <Button variant="ghost" size="sm" :disabled="!hasValues" @click="clearAll">
        {{ t('advanced.clear') }}
      </Button>
    </header>

    <div class="advanced-list">
      <label class="advanced-row">
        <div class="advanced-row__copy">
          <strong>{{ t('advanced.temperature') }}</strong>
          <p>{{ t('advanced.temperatureHelp') }}</p>
        </div>
        <input
          class="number-input advanced-row__input"
          type="number"
          step="0.1"
          :value="modelValue.temperature ?? ''"
          @input="updateField('temperature', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="advanced-row">
        <div class="advanced-row__copy">
          <strong>{{ t('advanced.topP') }}</strong>
          <p>{{ t('advanced.topPHelp') }}</p>
        </div>
        <input
          class="number-input advanced-row__input"
          type="number"
          step="0.1"
          :value="modelValue.top_p ?? ''"
          @input="updateField('top_p', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="advanced-row">
        <div class="advanced-row__copy">
          <strong>{{ t('advanced.maxTokens') }}</strong>
          <p>{{ t('advanced.maxTokensHelp') }}</p>
        </div>
        <input
          class="number-input advanced-row__input"
          type="number"
          step="1"
          :value="modelValue.max_tokens ?? ''"
          @input="updateField('max_tokens', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="advanced-row">
        <div class="advanced-row__copy">
          <strong>{{ t('advanced.presencePenalty') }}</strong>
          <p>{{ t('advanced.presencePenaltyHelp') }}</p>
        </div>
        <input
          class="number-input advanced-row__input"
          type="number"
          step="0.1"
          :value="modelValue.presence_penalty ?? ''"
          @input="updateField('presence_penalty', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="advanced-row">
        <div class="advanced-row__copy">
          <strong>{{ t('advanced.frequencyPenalty') }}</strong>
          <p>{{ t('advanced.frequencyPenaltyHelp') }}</p>
        </div>
        <input
          class="number-input advanced-row__input"
          type="number"
          step="0.1"
          :value="modelValue.frequency_penalty ?? ''"
          @input="updateField('frequency_penalty', ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>
  </section>
</template>

<style scoped>
.advanced-panel {
  display: grid;
  gap: 1rem;
}

.advanced-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.advanced-panel__header h3,
.advanced-panel__header p {
  margin: 0;
}

.advanced-panel__header h3 {
  color: var(--settings-text);
  font-size: 1rem;
}

.advanced-panel__header p {
  margin-top: 0.28rem;
  color: var(--settings-muted);
  line-height: 1.6;
}

.advanced-list {
  border: 1px solid var(--settings-border);
  border-radius: 22px;
  background: var(--settings-panel);
  overflow: hidden;
}

.advanced-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 1rem;
  align-items: center;
  padding: 1rem 1.1rem;
}

.advanced-row + .advanced-row {
  border-top: 1px solid var(--settings-border);
}

.advanced-row__copy {
  min-width: 0;
}

.advanced-row__copy strong,
.advanced-row__copy p {
  margin: 0;
}

.advanced-row__copy strong {
  display: block;
  color: var(--settings-text);
  font-size: 0.94rem;
}

.advanced-row__copy p {
  margin-top: 0.18rem;
  color: var(--settings-muted);
  font-size: 0.84rem;
  line-height: 1.55;
}

.advanced-row__input {
  width: 100%;
}

@media (max-width: 900px) {
  .advanced-panel__header,
  .advanced-row {
    grid-template-columns: 1fr;
  }

  .advanced-row {
    align-items: stretch;
  }
}
</style>
