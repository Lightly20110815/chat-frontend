<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import Button from '@/components/common/Button.vue'
import ModelEditor from './ModelEditor.vue'
import type { Provider, ProviderDraft } from '@/types/provider'

type EditorPayload = {
  draft: ProviderDraft
  setAsDefault: boolean
}

type EditorField = 'name' | 'baseUrl' | 'apiKey' | 'models'

const props = defineProps<{
  provider: Provider | null
  mode: 'create' | 'edit'
  defaultProviderId: string | null
  saving: boolean
}>()

const emit = defineEmits<{
  save: [payload: EditorPayload]
  cancel: []
  'dirty-change': [dirty: boolean]
}>()

const { t, providerTypeOptions } = useI18n()

const form = reactive({
  name: '',
  type: 'openai-compatible' as ProviderDraft['type'],
  baseUrl: '',
  apiKey: '',
  models: [] as string[],
  defaultModel: '',
  enabled: true,
  setAsDefault: false,
})

const showApiKey = ref(false)
const errors = reactive<Partial<Record<EditorField, string>>>({})
const initialSnapshot = ref('')

const typeMeta = computed(() =>
  providerTypeOptions.value.find((option) => option.value === form.type) ?? providerTypeOptions.value[0],
)

const isDirty = computed(() => JSON.stringify(buildSnapshot()) !== initialSnapshot.value)

watch(
  () => [props.provider, props.mode, props.defaultProviderId] as const,
  () => {
    resetForm()
  },
  { immediate: true },
)

watch(
  isDirty,
  (dirty) => {
    emit('dirty-change', dirty)
  },
  { immediate: true },
)

function resetForm(): void {
  form.name = props.provider?.name ?? ''
  form.type = props.provider?.type ?? 'openai-compatible'
  form.baseUrl = props.provider?.baseUrl ?? ''
  form.apiKey = props.provider?.apiKey ?? ''
  form.models = props.provider ? [...props.provider.models] : []
  form.defaultModel = props.provider?.defaultModel ?? ''
  form.enabled = props.provider?.enabled ?? true
  form.setAsDefault = props.provider ? props.provider.id === props.defaultProviderId : props.defaultProviderId === null
  showApiKey.value = false
  clearErrors()
  initialSnapshot.value = JSON.stringify(buildSnapshot())
}

function buildSnapshot() {
  return {
    name: form.name.trim(),
    type: form.type,
    baseUrl: form.baseUrl.trim(),
    apiKey: form.apiKey.trim(),
    models: [...form.models],
    defaultModel: form.defaultModel.trim(),
    enabled: form.enabled,
    setAsDefault: form.setAsDefault,
  }
}

function clearErrors(): void {
  delete errors.name
  delete errors.baseUrl
  delete errors.apiKey
  delete errors.models
}

function setFieldError(field: EditorField, message: string): void {
  errors[field] = message
}

function validate(): boolean {
  clearErrors()

  if (!form.name.trim()) {
    setFieldError('name', t('provider.editor.validation.name'))
  }

  if (!form.baseUrl.trim()) {
    setFieldError('baseUrl', t('provider.editor.validation.baseUrl'))
  }

  if (!form.apiKey.trim()) {
    setFieldError('apiKey', t('provider.editor.validation.apiKey'))
  }

  const models = form.models
    .map((model) => model.trim())
    .filter((model) => model.length > 0)

  if (!models.length) {
    setFieldError('models', t('provider.editor.validation.models'))
  }

  return Object.keys(errors).length === 0
}

function save(): void {
  if (!validate()) {
    return
  }

  const models = Array.from(new Set(form.models.map((model) => model.trim()).filter(Boolean)))
  const draft: ProviderDraft = {
    name: form.name.trim(),
    type: form.type,
    baseUrl: form.baseUrl.trim(),
    apiKey: form.apiKey.trim(),
    models,
    defaultModel: form.defaultModel.trim() || models[0] || '',
    enabled: form.enabled,
  }

  emit('save', {
    draft,
    setAsDefault: form.setAsDefault,
  })
}
</script>

<template>
  <section class="provider-editor">
    <header class="provider-editor__header">
      <div>
        <p class="provider-editor__kicker">
          {{ mode === 'create' ? t('provider.editor.newKicker') : t('provider.editor.editKicker') }}
        </p>
        <div class="provider-editor__title-row">
          <h3 class="provider-editor__title">
            {{ mode === 'create' ? t('provider.editor.createTitle') : provider?.name || t('provider.editor.detailsTitle') }}
          </h3>
          <span v-if="isDirty" class="provider-editor__dirty">{{ t('provider.editor.unsaved') }}</span>
        </div>
        <p class="provider-editor__copy">{{ typeMeta.description }}</p>
      </div>
    </header>

    <div class="provider-editor__body">
      <section class="editor-group">
        <div class="editor-group__head">
          <h4>{{ t('provider.editor.basicSection') }}</h4>
        </div>
        <div class="editor-grid">
          <label class="editor-field">
            <span class="field-label">{{ t('provider.editor.name') }}</span>
            <input
              v-model="form.name"
              class="text-input"
              type="text"
              :placeholder="t('provider.editor.namePlaceholder')"
              @input="delete errors.name"
            />
            <small v-if="errors.name" class="field-error">{{ errors.name }}</small>
          </label>

          <label class="editor-field">
            <span class="field-label">{{ t('provider.editor.type') }}</span>
            <select v-model="form.type" class="select-input">
              <option v-for="option in providerTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group__head">
          <h4>{{ t('provider.editor.connectionSection') }}</h4>
        </div>
        <div class="editor-grid editor-grid--single">
          <label class="editor-field">
            <span class="field-label">{{ t('provider.editor.baseUrl') }}</span>
            <input
              v-model="form.baseUrl"
              class="text-input"
              type="text"
              :placeholder="typeMeta.baseUrlPlaceholder"
              @input="delete errors.baseUrl"
            />
            <small v-if="errors.baseUrl" class="field-error">{{ errors.baseUrl }}</small>
          </label>

          <label class="editor-field">
            <span class="field-label">{{ t('provider.editor.apiKey') }}</span>
            <div class="secret-field">
              <input
                v-model="form.apiKey"
                class="text-input secret-field__input"
                :type="showApiKey ? 'text' : 'password'"
                :placeholder="t('provider.editor.apiKeyPlaceholder')"
                @input="delete errors.apiKey"
              />
              <button type="button" class="secret-field__toggle" @click="showApiKey = !showApiKey">
                {{ showApiKey ? t('provider.editor.hideKey') : t('provider.editor.showKey') }}
              </button>
            </div>
            <small v-if="errors.apiKey" class="field-error">{{ errors.apiKey }}</small>
          </label>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group__head">
          <h4>{{ t('provider.editor.modelsSection') }}</h4>
        </div>
        <ModelEditor
          v-model="form.models"
          :default-model="form.defaultModel"
          @update:default-model="form.defaultModel = $event"
        />
        <small v-if="errors.models" class="field-error">{{ errors.models }}</small>
      </section>

      <section class="editor-group">
        <div class="editor-group__head">
          <h4>{{ t('provider.editor.optionsSection') }}</h4>
        </div>

        <label class="option-row">
          <input v-model="form.enabled" type="checkbox" />
          <div>
            <strong>{{ t('provider.editor.enabledTitle') }}</strong>
            <p>{{ t('provider.editor.enabledCopy') }}</p>
          </div>
        </label>

        <label class="option-row">
          <input v-model="form.setAsDefault" type="checkbox" />
          <div>
            <strong>{{ t('provider.editor.defaultProviderTitle') }}</strong>
            <p>{{ t('provider.editor.defaultProviderCopy') }}</p>
          </div>
        </label>
      </section>
    </div>

    <footer class="provider-editor__footer">
      <Button variant="ghost" :disabled="saving" @click="emit('cancel')">{{ t('common.cancel') }}</Button>
      <Button variant="primary" :disabled="saving" @click="save">
        {{ saving ? t('common.saving') : t('provider.editor.save') }}
      </Button>
    </footer>
  </section>
</template>

<style scoped>
.provider-editor {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--settings-border);
  border-radius: 24px;
  background: var(--settings-panel);
}

.provider-editor__header,
.provider-editor__footer {
  padding: 1.2rem 1.25rem;
}

.provider-editor__header {
  border-bottom: 1px solid var(--settings-border);
}

.provider-editor__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem 1.25rem 1.25rem;
}

.provider-editor__kicker,
.provider-editor__copy,
.editor-group__head h4,
.option-row p {
  margin: 0;
}

.provider-editor__kicker {
  color: var(--settings-muted);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.provider-editor__title-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-top: 0.32rem;
}

.provider-editor__title {
  margin: 0;
  color: var(--settings-text);
  font-size: 1.15rem;
}

.provider-editor__copy {
  margin-top: 0.38rem;
  color: var(--settings-muted);
  line-height: 1.6;
}

.provider-editor__dirty {
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  padding: 0.2rem 0.58rem;
  border-radius: 999px;
  background: rgba(155, 140, 255, 0.14);
  color: var(--settings-accent);
  font-size: 0.75rem;
}

.editor-group {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  border: 1px solid var(--settings-border);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.025);
}

.editor-group__head h4 {
  color: var(--settings-text);
  font-size: 0.95rem;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.editor-grid--single {
  grid-template-columns: 1fr;
}

.editor-field {
  min-width: 0;
}

.field-error {
  display: block;
  margin-top: 0.42rem;
  color: var(--settings-danger);
  font-size: 0.8rem;
}

.secret-field {
  position: relative;
}

.secret-field__input {
  padding-right: 5rem;
}

.secret-field__toggle {
  position: absolute;
  top: 50%;
  right: 0.45rem;
  transform: translateY(-50%);
  min-height: 2rem;
  padding: 0.25rem 0.65rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--settings-muted);
  font-size: 0.78rem;
}

.secret-field__toggle:hover {
  background: rgba(155, 140, 255, 0.1);
  color: var(--settings-text);
}

.option-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.8rem;
  align-items: flex-start;
  padding: 0.9rem 0.95rem;
  border: 1px solid var(--settings-border);
  border-radius: 18px;
  background: var(--settings-panel-soft);
}

.option-row strong {
  display: block;
  color: var(--settings-text);
  font-size: 0.92rem;
}

.option-row p {
  margin-top: 0.22rem;
  color: var(--settings-muted);
  font-size: 0.84rem;
  line-height: 1.55;
}

.provider-editor__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid var(--settings-border);
}

@media (max-width: 900px) {
  .provider-editor {
    border-radius: 20px;
  }

  .editor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
