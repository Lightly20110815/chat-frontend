<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md'
    block?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'secondary',
    size: 'md',
    block: false,
    disabled: false,
    type: 'button',
  },
)

const className = computed(() => [
  'button',
  `button--${props.variant}`,
  `button--${props.size}`,
  { 'button--block': props.block },
])
</script>

<template>
  <button :type="type" :disabled="disabled" :class="className">
    <slot />
  </button>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease;
}

.button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: var(--border-strong);
}

.button:disabled {
  opacity: 0.52;
}

.button--sm {
  min-height: 2.25rem;
  padding: 0.5rem 0.9rem;
  font-size: 0.88rem;
}

.button--md {
  min-height: 2.75rem;
  padding: 0.72rem 1.1rem;
  font-size: 0.94rem;
}

.button--block {
  width: 100%;
}

.button--primary {
  border-color: rgba(155, 140, 255, 0.36);
  background: linear-gradient(180deg, #a799ff 0%, #8e81eb 100%);
  color: var(--button-primary-text);
}

.button--primary:hover:not(:disabled) {
  background: linear-gradient(180deg, #b2a6ff 0%, #988cf0 100%);
}

.button--secondary {
  background: var(--button-secondary-bg);
  color: var(--text);
}

.button--secondary:hover:not(:disabled) {
  background: var(--panel-hover);
}

.button--ghost {
  border-color: transparent;
  background: transparent;
  color: var(--text-muted);
}

.button--ghost:hover:not(:disabled) {
  background: var(--button-ghost-hover);
  color: var(--text);
}

.button--danger {
  border-color: rgba(255, 139, 154, 0.3);
  background: var(--danger-soft);
  color: #ffb8c1;
}

.button--danger:hover:not(:disabled) {
  background: rgba(255, 139, 154, 0.2);
}
</style>
