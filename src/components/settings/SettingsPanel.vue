<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import Button from '@/components/common/Button.vue'
import IconButton from '@/components/common/IconButton.vue'
import Modal from '@/components/common/Modal.vue'
import AdvancedParams from './AdvancedParams.vue'
import ProviderEditor from './ProviderEditor.vue'
import ProviderList from './ProviderList.vue'
import { useChatStore } from '@/stores/chatStore'
import { useProviderStore } from '@/stores/providerStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { ProviderDraft } from '@/types/provider'

type SettingsSection = 'providers' | 'preferences' | 'advanced' | 'data'

type EditorSavePayload = {
  draft: ProviderDraft
  setAsDefault: boolean
}

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const providerStore = useProviderStore()
const settingsStore = useSettingsStore()
const chatStore = useChatStore()
const { t, themeModeLabel, localeOptions } = useI18n()

const activeSection = ref<SettingsSection>('providers')
const selectedProviderId = ref<string | null>(providerStore.providers[0]?.id ?? null)
const editorMode = ref<'create' | 'edit'>(providerStore.providers.length ? 'edit' : 'create')
const editorDirty = ref(false)
const editorRevision = ref(0)
const savingProvider = ref(false)
const toastMessage = ref('')
const toastVisible = ref(false)
const lastSelectedProviderId = ref<string | null>(selectedProviderId.value)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const selectedProvider = computed(() =>
  selectedProviderId.value ? providerStore.getProvider(selectedProviderId.value) : null,
)

const providerEditorKey = computed(
  () => `${editorMode.value}:${selectedProviderId.value ?? 'new'}:${editorRevision.value}`,
)

const navItems = computed(() => [
  {
    id: 'providers' as const,
    title: t('settings.nav.providersTitle'),
    copy: t('settings.nav.providersCopy'),
  },
  {
    id: 'preferences' as const,
    title: t('settings.nav.preferencesTitle'),
    copy: t('settings.nav.preferencesCopy'),
  },
  {
    id: 'advanced' as const,
    title: t('settings.nav.advancedTitle'),
    copy: t('settings.nav.advancedCopy'),
  },
  {
    id: 'data' as const,
    title: t('settings.nav.dataTitle'),
    copy: t('settings.nav.dataCopy'),
  },
])

const providerSummary = computed(() => ({
  count: providerStore.providers.length,
  defaultName:
    providerStore.defaultProvider?.name || t('settings.defaultProvider.none'),
}))

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return
    }

    ensureSelection()
  },
  { immediate: true },
)

watch(
  () => providerStore.providers,
  () => {
    ensureSelection()
  },
  { deep: true },
)

function ensureSelection(): void {
  if (!providerStore.providers.length) {
    selectedProviderId.value = null
    editorMode.value = 'create'
    return
  }

  if (!selectedProviderId.value || !providerStore.getProvider(selectedProviderId.value)) {
    selectedProviderId.value = providerStore.providers[0].id
  }

  if (editorMode.value !== 'create') {
    editorMode.value = 'edit'
  }

  lastSelectedProviderId.value = selectedProviderId.value
}

function requestClose(): void {
  if (!canDiscardEditor()) {
    return
  }

  emit('close')
}

function canDiscardEditor(): boolean {
  if (!editorDirty.value) {
    return true
  }

  return window.confirm(t('settings.unsavedConfirm'))
}

function changeSection(next: SettingsSection): void {
  if (activeSection.value === next) {
    return
  }

  if (!canDiscardEditor()) {
    return
  }

  activeSection.value = next
}

function editProvider(providerId: string): void {
  if (selectedProviderId.value === providerId && editorMode.value === 'edit') {
    return
  }

  if (!canDiscardEditor()) {
    return
  }

  selectedProviderId.value = providerId
  editorMode.value = 'edit'
  lastSelectedProviderId.value = providerId
}

function startCreate(): void {
  if (!canDiscardEditor()) {
    return
  }

  lastSelectedProviderId.value = selectedProviderId.value
  selectedProviderId.value = null
  editorMode.value = 'create'
  editorRevision.value += 1
}

function resetEditor(): void {
  editorDirty.value = false

  if (editorMode.value === 'create') {
    const fallbackId =
      (lastSelectedProviderId.value && providerStore.getProvider(lastSelectedProviderId.value)
        ? lastSelectedProviderId.value
        : providerStore.providers[0]?.id) ?? null

    if (fallbackId) {
      selectedProviderId.value = fallbackId
      editorMode.value = 'edit'
    }
  }

  editorRevision.value += 1
}

async function saveProvider(payload: EditorSavePayload): Promise<void> {
  savingProvider.value = true

  try {
    if (editorMode.value === 'create') {
      const provider = providerStore.createProvider(payload.draft)
      selectedProviderId.value = provider.id
      editorMode.value = 'edit'
      lastSelectedProviderId.value = provider.id

      if (payload.setAsDefault && provider.enabled) {
        providerStore.setDefaultProvider(provider.id)
      }

      showToast(t('provider.editor.created'))
    } else if (selectedProviderId.value) {
      const providerId = selectedProviderId.value
      const wasDefault = settingsStore.settings.defaultProviderId === providerId
      const shouldSetAsDefault = payload.setAsDefault && payload.draft.enabled

      providerStore.updateProvider(providerId, payload.draft)

      if (shouldSetAsDefault) {
        providerStore.setDefaultProvider(providerId)
      } else if (wasDefault && settingsStore.settings.defaultProviderId === providerId) {
        const fallbackId = providerStore.enabledProviders.find((provider) => provider.id !== providerId)?.id ?? null
        providerStore.setDefaultProvider(fallbackId)
      }

      showToast(t('provider.editor.saved'))
    }

    editorDirty.value = false
    editorRevision.value += 1
    await delay(180)
  } finally {
    savingProvider.value = false
  }
}

function removeProvider(providerId: string): void {
  const provider = providerStore.getProvider(providerId)

  if (!provider) {
    return
  }

  if (!window.confirm(t('provider.deleteConfirm', { name: provider.name }))) {
    return
  }

  providerStore.removeProvider(providerId)
  editorDirty.value = false

  if (!providerStore.providers.length) {
    selectedProviderId.value = null
    editorMode.value = 'create'
    editorRevision.value += 1
    return
  }

  if (selectedProviderId.value === providerId) {
    selectedProviderId.value = providerStore.providers[0].id
    editorMode.value = 'edit'
    editorRevision.value += 1
  }
}

function showToast(message: string): void {
  toastMessage.value = message
  toastVisible.value = true

  if (toastTimer) {
    clearTimeout(toastTimer)
  }

  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 2200)
}

function exportSnapshot(): void {
  const snapshot = {
    exportedAt: new Date().toISOString(),
    providers: providerStore.providers,
    settings: settingsStore.settings,
    sessions: chatStore.sessions,
  }

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `ai-chat-local-snapshot-${Date.now()}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function delay(duration: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration)
  })
}
</script>

<template>
  <Modal
    :open="open"
    placement="center"
    width="min(960px, calc(100vw - 32px))"
    @close="requestClose"
  >
    <div class="settings-shell">
      <header class="settings-header">
        <div class="settings-header__copy">
          <p class="settings-header__kicker">{{ t('settings.kicker') }}</p>
          <h2 class="settings-header__title">{{ t('settings.title') }}</h2>
          <p class="settings-header__subtitle">{{ t('settings.subtitle') }}</p>
        </div>

        <IconButton :label="t('common.close')" @click="requestClose">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </IconButton>
      </header>

      <div class="settings-layout">
        <aside class="settings-nav">
          <button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            class="settings-nav__item"
            :class="{ 'is-active': activeSection === item.id }"
            @click="changeSection(item.id)"
          >
            <strong>{{ item.title }}</strong>
            <span>{{ item.copy }}</span>
          </button>
        </aside>

        <main class="settings-content">
          <section v-if="activeSection === 'providers'" class="settings-page settings-page--providers">
            <header class="page-head">
              <div>
                <h3>{{ t('settings.providers.title') }}</h3>
                <p>{{ t('settings.providers.copy') }}</p>
              </div>
              <Button variant="primary" @click="startCreate">{{ t('settings.providers.add') }}</Button>
            </header>

            <div class="page-chips">
              <span class="page-chip">{{ t('settings.providers.summary', { count: providerSummary.count }) }}</span>
              <span class="page-chip page-chip--accent">{{ t('settings.providers.defaultSummary', { name: providerSummary.defaultName }) }}</span>
            </div>

            <div class="providers-workspace">
              <section class="providers-column providers-column--list">
                <ProviderList
                  :providers="providerStore.providers"
                  :default-provider-id="settingsStore.settings.defaultProviderId"
                  :selected-provider-id="selectedProviderId"
                  @create="startCreate"
                  @select="editProvider"
                  @edit="editProvider"
                  @set-default="providerStore.setDefaultProvider"
                  @remove="removeProvider"
                />
              </section>

              <section class="providers-column providers-column--editor">
                <ProviderEditor
                  v-if="editorMode === 'create' || selectedProvider"
                  :key="providerEditorKey"
                  :mode="editorMode"
                  :provider="selectedProvider"
                  :default-provider-id="settingsStore.settings.defaultProviderId"
                  :saving="savingProvider"
                  @save="saveProvider"
                  @cancel="resetEditor"
                  @dirty-change="editorDirty = $event"
                />

                <div v-else class="providers-empty">
                  <h4>{{ t('settings.providers.emptyTitle') }}</h4>
                  <p>{{ t('settings.providers.emptyCopy') }}</p>
                </div>
              </section>
            </div>
          </section>

          <section v-else-if="activeSection === 'preferences'" class="settings-page">
            <header class="page-head">
              <div>
                <h3>{{ t('settings.preferences.title') }}</h3>
                <p>{{ t('settings.preferences.copy') }}</p>
              </div>
            </header>

            <div class="settings-rows">
              <div class="settings-row">
                <div class="settings-row__copy">
                  <strong>{{ t('settings.theme.title') }}</strong>
                  <p>{{ t('settings.theme.copy') }}</p>
                </div>
                <select
                  class="select-input settings-row__control"
                  :value="settingsStore.settings.theme"
                  @change="settingsStore.setTheme(($event.target as HTMLSelectElement).value as 'dark' | 'light' | 'system')"
                >
                  <option value="dark">{{ themeModeLabel('dark') }}</option>
                  <option value="light">{{ themeModeLabel('light') }}</option>
                  <option value="system">{{ themeModeLabel('system') }}</option>
                </select>
              </div>

              <div class="settings-row">
                <div class="settings-row__copy">
                  <strong>{{ t('settings.language.title') }}</strong>
                  <p>{{ t('settings.language.copy') }}</p>
                </div>
                <select
                  class="select-input settings-row__control"
                  :value="settingsStore.settings.locale"
                  @change="settingsStore.setLocale(($event.target as HTMLSelectElement).value as 'system' | 'en' | 'zh-CN')"
                >
                  <option v-for="option in localeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div class="settings-row">
                <div class="settings-row__copy">
                  <strong>{{ t('settings.streaming.title') }}</strong>
                  <p>{{ t('settings.streaming.copy') }}</p>
                </div>
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    :checked="settingsStore.settings.streamEnabled"
                    @change="settingsStore.setStreamEnabled(($event.target as HTMLInputElement).checked)"
                  />
                  <span>{{ settingsStore.settings.streamEnabled ? t('common.on') : t('common.off') }}</span>
                </label>
              </div>

              <div class="settings-row">
                <div class="settings-row__copy">
                  <strong>{{ t('settings.saveApiKey.title') }}</strong>
                  <p>{{ t('settings.saveApiKey.copy') }}</p>
                </div>
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    :checked="settingsStore.settings.saveApiKeyLocally"
                    @change="settingsStore.setSaveApiKeyLocally(($event.target as HTMLInputElement).checked)"
                  />
                  <span>{{ settingsStore.settings.saveApiKeyLocally ? t('common.on') : t('common.off') }}</span>
                </label>
              </div>

              <div class="settings-row">
                <div class="settings-row__copy">
                  <strong>{{ t('settings.defaultProvider.title') }}</strong>
                  <p>{{ t('settings.defaultProvider.copy') }}</p>
                </div>
                <select
                  class="select-input settings-row__control"
                  :value="settingsStore.settings.defaultProviderId ?? ''"
                  @change="providerStore.setDefaultProvider(($event.target as HTMLSelectElement).value || null)"
                >
                  <option value="">{{ t('settings.defaultProvider.none') }}</option>
                  <option
                    v-for="provider in providerStore.enabledProviders"
                    :key="provider.id"
                    :value="provider.id"
                  >
                    {{ provider.name }}
                  </option>
                </select>
              </div>
            </div>
          </section>

          <section v-else-if="activeSection === 'advanced'" class="settings-page">
            <AdvancedParams
              :model-value="settingsStore.settings.advancedParams"
              @update:model-value="settingsStore.setAdvancedParams"
            />
          </section>

          <section v-else class="settings-page">
            <header class="page-head">
              <div>
                <h3>{{ t('settings.data.title') }}</h3>
                <p>{{ t('settings.data.copy') }}</p>
              </div>
            </header>

            <div class="privacy-panel">
              <div class="privacy-panel__block">
                <h4>{{ t('settings.localOnly.title') }}</h4>
                <ul class="privacy-list">
                  <li>{{ t('settings.data.note1') }}</li>
                  <li>{{ t('settings.data.note2') }}</li>
                  <li>{{ t('settings.data.note3') }}</li>
                  <li>{{ t('settings.data.note4') }}</li>
                </ul>
              </div>

              <div class="privacy-panel__block">
                <h4>{{ t('settings.data.title') }}</h4>
                <div class="privacy-actions">
                  <Button variant="secondary" @click="exportSnapshot">{{ t('settings.data.export') }}</Button>
                  <Button variant="ghost" disabled>{{ t('settings.data.clear') }}</Button>
                </div>
                <p class="privacy-todo">{{ t('settings.data.clearTodo') }}</p>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Transition name="settings-toast">
        <div v-if="toastVisible" class="settings-toast">
          {{ toastMessage }}
        </div>
      </Transition>
    </div>
  </Modal>
</template>

<style scoped>
.settings-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: min(82vh, 860px);
  max-height: 82vh;
  background: var(--settings-panel);
  color: var(--settings-text);
}

.settings-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  min-height: 98px;
  padding: 1.2rem 1.25rem 1rem;
  border-bottom: 1px solid var(--settings-border);
  background: linear-gradient(180deg, color-mix(in srgb, var(--settings-panel) 92%, transparent) 0%, var(--settings-panel) 100%);
  backdrop-filter: saturate(120%);
}

.settings-header__copy {
  min-width: 0;
}

.settings-header__kicker,
.settings-header__title,
.settings-header__subtitle,
.page-head h3,
.page-head p,
.providers-empty h4,
.providers-empty p,
.privacy-panel__block h4,
.privacy-todo {
  margin: 0;
}

.settings-header__kicker {
  color: var(--settings-muted);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-header__title {
  margin-top: 0.3rem;
  font-size: 1.55rem;
  line-height: 1.1;
}

.settings-header__subtitle {
  margin-top: 0.32rem;
  color: var(--settings-muted);
  line-height: 1.55;
}

.settings-layout {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 0;
  flex: 1;
  min-height: 0;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 1rem;
  border-right: 1px solid var(--settings-border);
  background: color-mix(in srgb, var(--settings-bg) 18%, transparent);
}

.settings-nav__item {
  display: grid;
  gap: 0.24rem;
  padding: 0.85rem 0.9rem;
  border: 1px solid transparent;
  border-radius: 18px;
  background: transparent;
  text-align: left;
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
}

.settings-nav__item strong {
  color: var(--settings-text);
  font-size: 0.9rem;
}

.settings-nav__item span {
  color: var(--settings-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.settings-nav__item:hover {
  transform: translateY(-1px);
  background: rgba(155, 140, 255, 0.07);
}

.settings-nav__item.is-active {
  border-color: rgba(155, 140, 255, 0.28);
  background: rgba(155, 140, 255, 0.14);
}

.settings-content {
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem 1.1rem 1.1rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.015) 0%, transparent 100%);
}

.settings-page {
  display: grid;
  align-content: start;
  gap: 1rem;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.page-head h3 {
  font-size: 1.05rem;
}

.page-head p {
  margin-top: 0.28rem;
  color: var(--settings-muted);
  line-height: 1.6;
}

.page-chips {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.page-chip {
  display: inline-flex;
  align-items: center;
  min-height: 1.95rem;
  padding: 0.32rem 0.7rem;
  border: 1px solid var(--settings-border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--settings-muted);
  font-size: 0.82rem;
}

.page-chip--accent {
  background: rgba(155, 140, 255, 0.14);
  color: var(--settings-accent);
}

.providers-workspace {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 1rem;
  min-height: 0;
}

.providers-column--list {
  min-height: 0;
  padding: 1rem;
  border: 1px solid var(--settings-border);
  border-radius: 24px;
  background: var(--settings-panel);
}

.providers-column--editor {
  min-height: 0;
}

.providers-empty {
  display: grid;
  gap: 0.5rem;
  min-height: 100%;
  place-content: center;
  padding: 1.6rem;
  border: 1px dashed var(--settings-border);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.02);
  text-align: center;
}

.providers-empty p {
  color: var(--settings-muted);
  line-height: 1.6;
}

.settings-rows {
  border: 1px solid var(--settings-border);
  border-radius: 24px;
  background: var(--settings-panel);
  overflow: hidden;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 72px;
  padding: 1rem 1.1rem;
}

.settings-row + .settings-row {
  border-top: 1px solid var(--settings-border);
}

.settings-row__copy {
  min-width: 0;
}

.settings-row__copy strong,
.settings-row__copy p {
  margin: 0;
}

.settings-row__copy strong {
  display: block;
  color: var(--settings-text);
  font-size: 0.94rem;
}

.settings-row__copy p {
  margin-top: 0.18rem;
  color: var(--settings-muted);
  font-size: 0.84rem;
  line-height: 1.55;
}

.settings-row__control {
  width: min(240px, 100%);
}

.toggle-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--settings-muted);
}

.privacy-panel {
  display: grid;
  gap: 1rem;
}

.privacy-panel__block {
  display: grid;
  gap: 0.85rem;
  padding: 1.1rem;
  border: 1px solid var(--settings-border);
  border-radius: 22px;
  background: var(--settings-panel);
}

.privacy-list {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--settings-muted);
  line-height: 1.7;
}

.privacy-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.privacy-todo {
  color: var(--settings-muted);
  font-size: 0.82rem;
}

.settings-toast {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  min-height: 2.6rem;
  display: inline-flex;
  align-items: center;
  padding: 0.65rem 0.95rem;
  border: 1px solid rgba(155, 140, 255, 0.26);
  border-radius: 999px;
  background: rgba(34, 36, 60, 0.96);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.22);
  color: var(--settings-text);
  font-size: 0.88rem;
}

.settings-toast-enter-active,
.settings-toast-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.settings-toast-enter-from,
.settings-toast-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 900px) {
  .settings-shell {
    height: 100dvh;
    max-height: none;
    border-radius: 0;
  }

  .settings-layout {
    grid-template-columns: 1fr;
  }

  .settings-nav {
    flex-direction: row;
    overflow-x: auto;
    border-right: 0;
    border-bottom: 1px solid var(--settings-border);
  }

  .settings-nav__item {
    min-width: 170px;
  }

  .providers-workspace {
    grid-template-columns: 1fr;
  }

  .page-head,
  .settings-row {
    flex-direction: column;
    align-items: stretch;
  }

  .settings-row__control {
    width: 100%;
  }

  .settings-toast {
    right: 0.85rem;
    left: 0.85rem;
    bottom: 0.85rem;
    justify-content: center;
  }
}
</style>
