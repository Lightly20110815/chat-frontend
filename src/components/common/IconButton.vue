<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    active?: boolean
    disabled?: boolean
    size?: 'sm' | 'md'
  }>(),
  {
    active: false,
    disabled: false,
    size: 'md',
  },
)
</script>

<template>
  <button
    type="button"
    class="icon-button"
    :class="[`icon-button--${size}`, { 'is-active': active }]"
    :aria-label="label"
    :title="label"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--icon-button-bg);
  color: var(--text-muted);
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease;
}

.icon-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: var(--border-strong);
  background: var(--icon-button-hover);
  color: var(--text);
}

.icon-button.is-active {
  border-color: rgba(155, 140, 255, 0.32);
  background: var(--accent-soft);
  color: var(--accent-hover);
}

.icon-button:disabled {
  opacity: 0.48;
}

.icon-button--sm {
  width: 2rem;
  height: 2rem;
}

.icon-button--md {
  width: 2.5rem;
  height: 2.5rem;
}
</style>
