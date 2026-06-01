<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'
import Button from '@/components/common/Button.vue'
import type { Provider } from '@/types/provider'

defineProps<{
  providers: Provider[]
  defaultProviderId: string | null
  selectedProviderId: string | null
}>()

const emit = defineEmits<{
  create: []
  select: [providerId: string]
  edit: [providerId: string]
  setDefault: [providerId: string]
  remove: [providerId: string]
}>()

const { t, providerTypeLabel } = useI18n()
</script>

<template>
  <section class="provider-list">
    <div v-if="providers.length" class="provider-list__scroll">
      <article
        v-for="provider in providers"
        :key="provider.id"
        class="provider-card"
        :class="{
          'is-selected': provider.id === selectedProviderId,
          'is-default': provider.id === defaultProviderId,
        }"
        @click="emit('select', provider.id)"
      >
        <header class="provider-card__header">
          <div class="provider-card__title-wrap">
            <div class="provider-card__title-row">
              <strong>{{ provider.name }}</strong>
              <span v-if="provider.id === defaultProviderId" class="provider-badge provider-badge--accent">
                {{ t('provider.list.default') }}
              </span>
            </div>
            <p class="provider-card__type">{{ providerTypeLabel(provider.type) }}</p>
          </div>
          <span class="provider-badge" :class="provider.enabled ? 'provider-badge--success' : 'provider-badge--muted'">
            {{ provider.enabled ? t('common.enabled') : t('common.disabled') }}
          </span>
        </header>

        <dl class="provider-card__details">
          <div>
            <dt>{{ t('provider.list.baseUrl') }}</dt>
            <dd :title="provider.baseUrl">{{ provider.baseUrl || '--' }}</dd>
          </div>
          <div>
            <dt>{{ t('provider.list.defaultModel') }}</dt>
            <dd>{{ provider.defaultModel || provider.models[0] || '--' }}</dd>
          </div>
        </dl>

        <footer class="provider-card__footer">
          <span class="provider-count">{{ t('provider.list.modelsCount', { count: provider.models.length }) }}</span>
          <div class="provider-card__actions">
            <button type="button" class="provider-action" @click.stop="emit('edit', provider.id)">
              {{ t('common.edit') }}
            </button>
            <button
              type="button"
              class="provider-action"
              :disabled="provider.id === defaultProviderId || !provider.enabled"
              @click.stop="emit('setDefault', provider.id)"
            >
              {{ t('provider.list.setDefault') }}
            </button>
            <button type="button" class="provider-action provider-action--danger" @click.stop="emit('remove', provider.id)">
              {{ t('common.delete') }}
            </button>
          </div>
        </footer>
      </article>
    </div>

    <div v-else class="provider-empty">
      <p class="provider-empty__title">{{ t('provider.list.noProvidersTitle') }}</p>
      <p class="provider-empty__copy">{{ t('provider.list.noProvidersCopy') }}</p>
      <Button variant="primary" @click="emit('create')">{{ t('provider.list.noProvidersAction') }}</Button>
    </div>
  </section>
</template>

<style scoped>
.provider-list {
  min-height: 0;
}

.provider-list__scroll {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  padding-right: 0.15rem;
}

.provider-card {
  display: grid;
  gap: 0.9rem;
  padding: 0.95rem 1rem;
  border: 1px solid var(--settings-border);
  border-radius: 18px;
  background: var(--settings-panel-soft);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  text-align: left;
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
}

.provider-card:hover {
  transform: translateY(-1px);
  border-color: rgba(155, 140, 255, 0.3);
}

.provider-card.is-selected {
  border-color: rgba(155, 140, 255, 0.34);
  background: color-mix(in srgb, var(--settings-panel-soft) 78%, var(--settings-accent) 22%);
}

.provider-card.is-default {
  box-shadow: inset 0 0 0 1px rgba(155, 140, 255, 0.12);
}

.provider-card__header,
.provider-card__title-row,
.provider-card__footer,
.provider-card__actions {
  display: flex;
}

.provider-card__header,
.provider-card__footer {
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.provider-card__title-wrap {
  min-width: 0;
}

.provider-card__title-row {
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.provider-card__title-row strong {
  font-size: 0.96rem;
  color: var(--settings-text);
}

.provider-card__type {
  margin: 0.22rem 0 0;
  color: var(--settings-muted);
  font-size: 0.8rem;
}

.provider-card__details {
  display: grid;
  gap: 0.65rem;
  margin: 0;
}

.provider-card__details div {
  min-width: 0;
}

.provider-card__details dt {
  color: var(--settings-muted);
  font-size: 0.74rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.provider-card__details dd {
  margin: 0.18rem 0 0;
  color: var(--settings-text);
  font-size: 0.85rem;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider-count {
  color: var(--settings-muted);
  font-size: 0.82rem;
}

.provider-card__actions {
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.provider-action {
  min-height: 2rem;
  padding: 0.36rem 0.62rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--settings-muted);
  font-size: 0.78rem;
  transition: background 160ms ease, color 160ms ease;
}

.provider-action:hover:not(:disabled) {
  background: rgba(155, 140, 255, 0.12);
  color: var(--settings-text);
}

.provider-action:disabled {
  opacity: 0.45;
}

.provider-action--danger:hover:not(:disabled) {
  background: rgba(255, 139, 154, 0.14);
  color: var(--settings-danger);
}

.provider-badge {
  display: inline-flex;
  align-items: center;
  min-height: 1.65rem;
  padding: 0.22rem 0.6rem;
  border: 1px solid var(--settings-border);
  border-radius: 999px;
  font-size: 0.74rem;
}

.provider-badge--accent {
  border-color: rgba(155, 140, 255, 0.3);
  background: rgba(155, 140, 255, 0.16);
  color: var(--settings-accent);
}

.provider-badge--success {
  background: rgba(127, 221, 193, 0.12);
  color: var(--success);
}

.provider-badge--muted {
  background: rgba(255, 255, 255, 0.05);
  color: var(--settings-muted);
}

.provider-empty {
  display: grid;
  gap: 0.75rem;
  padding: 1.2rem;
  border: 1px dashed var(--settings-border);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.02);
}

.provider-empty__title,
.provider-empty__copy {
  margin: 0;
}

.provider-empty__title {
  color: var(--settings-text);
  font-weight: 600;
}

.provider-empty__copy {
  color: var(--settings-muted);
  line-height: 1.6;
}
</style>
