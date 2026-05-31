<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    minRows?: number
    maxRows?: number
    disabled?: boolean
  }>(),
  {
    placeholder: '',
    minRows: 1,
    maxRows: 8,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const attrs = useAttrs()
const element = ref<HTMLTextAreaElement | null>(null)

const minHeight = computed(() => props.minRows * 24 + 24)
const maxHeight = computed(() => props.maxRows * 24 + 24)

function resize(): void {
  const node = element.value

  if (!node) {
    return
  }

  node.style.height = 'auto'
  const nextHeight = Math.min(Math.max(node.scrollHeight, minHeight.value), maxHeight.value)
  node.style.height = `${nextHeight}px`
}

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
  nextTick(resize)
}

watch(
  () => props.modelValue,
  () => nextTick(resize),
)

onMounted(resize)

defineExpose({
  focus: () => element.value?.focus(),
})
</script>

<template>
  <textarea
    ref="element"
    class="textarea"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    rows="1"
    v-bind="attrs"
    @input="onInput"
  />
</template>

<style scoped>
.textarea {
  width: 100%;
  min-height: 3rem;
  resize: none;
  padding: 0.9rem 1rem;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--input);
  color: var(--text);
  line-height: 1.6;
  transition: border-color 160ms ease, background 160ms ease;
}

.textarea:hover {
  border-color: var(--border-strong);
}

.textarea:focus {
  border-color: var(--accent);
  background: var(--input-focus);
}

.textarea::placeholder {
  color: var(--text-soft);
}

.textarea:disabled {
  opacity: 0.74;
}
</style>
