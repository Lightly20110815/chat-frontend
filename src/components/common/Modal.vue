<script setup lang="ts">
import { Teleport, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    placement?: 'center' | 'right'
    width?: string
  }>(),
  {
    title: '',
    placement: 'center',
    width: '',
  },
)

const emit = defineEmits<{
  close: []
}>()

watch(
  () => props.open,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="modal-root">
        <div class="modal-overlay" @click="emit('close')" />
        <div class="modal-frame" :class="`modal-frame--${placement}`">
          <section class="modal-panel surface-card" :style="width ? { width } : undefined">
            <header v-if="title || $slots.header" class="modal-header">
              <slot name="header">
                <h2 class="modal-title">{{ title }}</h2>
              </slot>
            </header>
            <div class="modal-content">
              <slot />
            </div>
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-root {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 20, 0.45);
}

.modal-frame {
  position: absolute;
  inset: 0;
  display: flex;
  padding: 1.25rem;
}

.modal-frame--center {
  align-items: center;
  justify-content: center;
}

.modal-frame--right {
  justify-content: flex-end;
}

.modal-panel {
  position: relative;
  width: min(100%, 760px);
  overflow: hidden;
}

.modal-frame--right .modal-panel {
  width: min(100%, var(--settings-width));
  height: 100%;
  border-radius: 28px 0 0 28px;
}

.modal-header {
  padding: 1.25rem 1.5rem 0;
}

.modal-title {
  margin: 0;
  font-size: 1.1rem;
}

.modal-content {
  min-height: 0;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 180ms ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .modal-frame {
    padding: 0;
  }

  .modal-panel,
  .modal-frame--right .modal-panel {
    width: 100%;
    height: 100dvh;
    border-radius: 0;
  }
}
</style>
