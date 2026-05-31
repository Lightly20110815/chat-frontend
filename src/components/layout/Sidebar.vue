<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import Button from '@/components/common/Button.vue'
import IconButton from '@/components/common/IconButton.vue'
import { useChatStore } from '@/stores/chatStore'
import { useProviderStore } from '@/stores/providerStore'
import { useSettingsStore } from '@/stores/settingsStore'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  'open-settings': []
  'session-picked': []
}>()

const chatStore = useChatStore()
const providerStore = useProviderStore()
const settingsStore = useSettingsStore()
const { t, themeModeLabel } = useI18n()

const editingSessionId = ref<string | null>(null)
const editingTitle = ref('')

const sessions = computed(() => chatStore.orderedSessions)

function createChat(): void {
  chatStore.createSession()
  emit('session-picked')
}

function selectSession(sessionId: string): void {
  chatStore.selectSession(sessionId)
  emit('session-picked')
}

function startRename(sessionId: string, title: string): void {
  editingSessionId.value = sessionId
  editingTitle.value = title
}

function submitRename(): void {
  if (!editingSessionId.value) {
    return
  }

  chatStore.renameSession(editingSessionId.value, editingTitle.value)
  editingSessionId.value = null
  editingTitle.value = ''
}

function stopRename(): void {
  editingSessionId.value = null
  editingTitle.value = ''
}
</script>

<template>
  <aside class="sidebar" :class="{ 'is-open': open }">
    <div class="sidebar__inner">
      <header class="sidebar__header">
        <div class="brand">
          <div class="brand__mark">A</div>
          <div>
            <p class="brand__eyebrow">{{ t('app.personalTool') }}</p>
            <h1 class="brand__title">{{ t('app.name') }}</h1>
          </div>
        </div>
        <IconButton :label="t('sidebar.close')" class="sidebar__close" @click="emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </IconButton>
      </header>

      <Button variant="primary" block @click="createChat">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {{ t('sidebar.newChat') }}
      </Button>

      <div class="sidebar__section">
        <div class="sidebar__section-title">
          <span>{{ t('sidebar.sessions') }}</span>
          <span>{{ sessions.length }}</span>
        </div>

        <div v-if="sessions.length" class="session-list">
          <article
            v-for="session in sessions"
            :key="session.id"
            class="session-card"
            :class="{ 'is-active': session.id === chatStore.activeSessionId }"
            @click="selectSession(session.id)"
          >
            <template v-if="editingSessionId === session.id">
              <input
                v-model="editingTitle"
                class="text-input session-card__input"
                type="text"
                @click.stop
                @keydown.enter.prevent="submitRename"
                @keydown.esc.prevent="stopRename"
                @blur="submitRename"
              />
            </template>
            <template v-else>
              <div class="session-card__top">
                <strong>{{ session.title }}</strong>
                <div class="session-card__actions">
                  <button type="button" class="ghost-icon" @click.stop="startRename(session.id, session.title)">
                    {{ t('sidebar.rename') }}
                  </button>
                  <button type="button" class="ghost-icon ghost-icon--danger" @click.stop="chatStore.deleteSession(session.id)">
                    {{ t('sidebar.delete') }}
                  </button>
                </div>
              </div>

              <div class="session-card__meta">
                <span>{{ providerStore.getProvider(session.providerId)?.name || t('sidebar.noProvider') }}</span>
                <span>{{ session.model || t('sidebar.noModel') }}</span>
              </div>
            </template>
          </article>
        </div>

        <div v-else class="sidebar__empty">
          <p>{{ t('sidebar.noChatsTitle') }}</p>
          <span>{{ t('sidebar.noChatsCopy') }}</span>
        </div>
      </div>

      <footer class="sidebar__footer">
        <button type="button" class="footer-link" @click="emit('open-settings')">
          <span>{{ t('sidebar.settings') }}</span>
          <small>{{ t('sidebar.activeProviders', { count: providerStore.enabledProviders.length }) }}</small>
        </button>
        <button type="button" class="footer-link" @click="settingsStore.cycleTheme()">
          <span>{{ t('sidebar.theme') }}</span>
          <small>{{ themeModeLabel(settingsStore.settings.theme) }}</small>
        </button>
      </footer>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  border-right: 1px solid var(--sidebar-border);
  background: var(--sidebar-gradient);
}

.sidebar__inner {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  padding: 1.2rem;
}

.sidebar__header,
.brand,
.sidebar__section-title,
.session-card__top,
.session-card__meta,
.sidebar__footer {
  display: flex;
}

.sidebar__header,
.session-card__top,
.sidebar__section-title {
  align-items: center;
  justify-content: space-between;
}

.brand {
  align-items: center;
  gap: 0.85rem;
}

.brand__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 18px;
  background: var(--accent-soft);
  color: var(--accent-hover);
  font-weight: 700;
}

.brand__eyebrow,
.brand__title {
  margin: 0;
}

.brand__eyebrow {
  color: var(--text-soft);
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.brand__title {
  font-size: 1.1rem;
}

.sidebar__close {
  display: none;
}

.sidebar__section {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 0.85rem;
}

.sidebar__section-title {
  color: var(--text-soft);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  padding-right: 0.2rem;
}

.session-card {
  display: grid;
  gap: 0.7rem;
  padding: 0.95rem;
  border: 1px solid transparent;
  border-radius: 18px;
  background: var(--surface-subtle);
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
}

.session-card:hover {
  transform: translateY(-1px);
  border-color: var(--border);
  background: var(--surface-subtle-hover);
}

.session-card.is-active {
  border-color: rgba(155, 140, 255, 0.3);
  background: rgba(155, 140, 255, 0.12);
}

.session-card__top strong {
  font-size: 0.95rem;
  line-height: 1.4;
}

.session-card__actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 160ms ease;
}

.session-card:hover .session-card__actions {
  opacity: 1;
}

.ghost-icon {
  border: 0;
  background: transparent;
  color: var(--text-soft);
  font-size: 0.78rem;
}

.ghost-icon--danger {
  color: var(--danger-text);
}

.session-card__meta {
  gap: 0.65rem;
  flex-wrap: wrap;
  color: var(--text-soft);
  font-size: 0.8rem;
}

.session-card__input {
  min-height: 2.45rem;
}

.sidebar__empty {
  display: grid;
  gap: 0.3rem;
  padding: 1.1rem 0.2rem;
  color: var(--text-muted);
}

.sidebar__empty p {
  margin: 0;
  color: var(--text);
}

.sidebar__footer {
  flex-direction: column;
  gap: 0.7rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--sidebar-border);
}

.footer-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.9rem 0.95rem;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface-subtle);
  color: var(--text);
  text-align: left;
}

.footer-link small {
  color: var(--text-soft);
}

@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(86vw, var(--sidebar-width));
    z-index: 120;
    transform: translateX(-100%);
    transition: transform 220ms ease;
    box-shadow: var(--shadow-card);
  }

  .sidebar.is-open {
    transform: translateX(0);
  }

  .sidebar__close {
    display: inline-flex;
  }
}
</style>
