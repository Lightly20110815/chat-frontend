<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  hasProviders: boolean
  providerName?: string
  modelName?: string
}>()

const emit = defineEmits<{
  'open-settings': []
  'new-chat': []
}>()

const { t } = useI18n()

const readyCopy = computed(() => {
  const provider = props.providerName || t('sidebar.noProvider')

  return props.modelName
    ? t('empty.readyCopyWithModel', { provider, model: props.modelName })
    : t('empty.readyCopyWithoutModel', { provider })
})
</script>

<template>
  <section class="empty-state surface-card">
    <div class="empty-state__copy">
      <p class="section-kicker">{{ hasProviders ? t('empty.readyKicker') : t('empty.welcomeKicker') }}</p>
      <h1 class="section-title">
        {{ hasProviders ? t('empty.readyTitle') : t('empty.welcomeTitle') }}
      </h1>
      <p class="section-copy">
        <template v-if="hasProviders">
          {{ readyCopy }}
        </template>
        <template v-else>
          {{ t('empty.welcomeCopy') }}
        </template>
      </p>
    </div>

    <div class="empty-state__actions">
      <Button variant="primary" @click="hasProviders ? emit('new-chat') : emit('open-settings')">
        {{ hasProviders ? t('sidebar.newChat') : t('empty.configureProvider') }}
      </Button>
      <Button variant="secondary" @click="emit('open-settings')">{{ t('empty.openSettings') }}</Button>
    </div>

    <ol class="empty-state__steps">
      <li>
        <span>1</span>
        <div>
          <strong>{{ t('empty.step1Title') }}</strong>
          <p>{{ t('empty.step1Copy') }}</p>
        </div>
      </li>
      <li>
        <span>2</span>
        <div>
          <strong>{{ t('empty.step2Title') }}</strong>
          <p>{{ t('empty.step2Copy') }}</p>
        </div>
      </li>
      <li>
        <span>3</span>
        <div>
          <strong>{{ t('empty.step3Title') }}</strong>
          <p>{{ t('empty.step3Copy') }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.empty-state {
  display: grid;
  gap: 1.4rem;
  width: min(100%, 760px);
  margin: 4vh auto 0;
  padding: 2rem;
  animation: rise-in 240ms ease both;
}

.empty-state__copy {
  display: grid;
  gap: 0.9rem;
}

.empty-state__copy strong {
  color: var(--text);
}

.empty-state__actions {
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.empty-state__steps {
  list-style: none;
  display: grid;
  gap: 0.9rem;
  padding: 0;
  margin: 0;
}

.empty-state__steps li {
  display: grid;
  grid-template-columns: 2.1rem 1fr;
  gap: 0.9rem;
  padding: 0.95rem 1rem;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface-subtle);
}

.empty-state__steps span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-hover);
}

.empty-state__steps strong,
.empty-state__steps p {
  margin: 0;
}

.empty-state__steps p {
  margin-top: 0.22rem;
  color: var(--text-muted);
}

@media (max-width: 700px) {
  .empty-state {
    padding: 1.35rem;
  }
}
</style>
