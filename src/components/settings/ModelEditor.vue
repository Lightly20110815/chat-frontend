<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  modelValue: string[]
  defaultModel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'update:defaultModel': [value: string]
}>()

const nextModel = ref('')
const { t } = useI18n()

const normalizedModels = computed(() => props.modelValue)

function addModel(): void {
  const value = nextModel.value.trim()

  if (!value || normalizedModels.value.includes(value)) {
    nextModel.value = ''
    return
  }

  const models = [...normalizedModels.value, value]
  emit('update:modelValue', models)

  if (!props.defaultModel) {
    emit('update:defaultModel', value)
  }

  nextModel.value = ''
}

function removeModel(model: string): void {
  const models = normalizedModels.value.filter((entry) => entry !== model)
  emit('update:modelValue', models)

  if (props.defaultModel === model) {
    emit('update:defaultModel', models[0] ?? '')
  }
}

function onInputKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    addModel()
  }
}
</script>

<template>
  <section class="model-editor">
    <label class="field-label">{{ t('modelEditor.models') }}</label>
    <div class="model-adder soft-panel">
      <input
        v-model="nextModel"
        class="text-input"
        type="text"
        :placeholder="t('modelEditor.addPlaceholder')"
        @keydown="onInputKeydown"
      />
      <Button variant="secondary" @click="addModel">{{ t('common.add') }}</Button>
    </div>

    <div v-if="normalizedModels.length" class="model-tags">
      <button
        v-for="model in normalizedModels"
        :key="model"
        type="button"
        class="model-tag"
        :class="{ 'is-default': model === defaultModel }"
        @click="emit('update:defaultModel', model)"
      >
        <span>{{ model }}</span>
        <span class="tag-meta">{{ model === defaultModel ? t('modelEditor.default') : t('modelEditor.setDefault') }}</span>
        <span class="tag-remove" @click.stop="removeModel(model)">x</span>
      </button>
    </div>
    <p v-else class="helper">{{ t('modelEditor.helper') }}</p>

    <div v-if="normalizedModels.length" class="default-model">
      <label class="field-label" for="default-model">{{ t('modelEditor.defaultModel') }}</label>
      <select
        id="default-model"
        class="select-input"
        :value="defaultModel"
        @change="emit('update:defaultModel', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="model in normalizedModels" :key="model" :value="model">
          {{ model }}
        </option>
      </select>
    </div>
  </section>
</template>

<style scoped>
.model-editor {
  display: grid;
  gap: 0.9rem;
}

.model-adder {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  padding: 0.75rem;
}

.text-input {
  min-width: 0;
}

.model-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.model-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface-soft);
  color: var(--text);
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
}

.model-tag:hover {
  transform: translateY(-1px);
  border-color: var(--border-strong);
}

.model-tag.is-default {
  border-color: rgba(155, 140, 255, 0.34);
  background: var(--accent-soft);
}

.tag-meta {
  color: var(--text-soft);
  font-size: 0.78rem;
}

.tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 999px;
  background: var(--surface-subtle-hover);
  color: var(--text-soft);
}

.helper {
  margin: 0;
  color: var(--text-soft);
  font-size: 0.88rem;
}
</style>
