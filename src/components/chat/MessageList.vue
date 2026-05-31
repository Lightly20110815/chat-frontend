<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import type { ChatMessage } from '@/types/chat'
import MessageItem from './MessageItem.vue'

const props = defineProps<{
  messages: ChatMessage[]
}>()

const scroller = ref<HTMLElement | null>(null)

async function scrollToBottom(smooth = false): Promise<void> {
  await nextTick()

  const node = scroller.value

  if (!node) {
    return
  }

  node.scrollTo({
    top: node.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  })
}

watch(
  () => props.messages.map((message) => `${message.id}:${message.content.length}:${message.status}`).join('|'),
  () => {
    scrollToBottom(true)
  },
)

onMounted(() => {
  scrollToBottom(false)
})
</script>

<template>
  <section ref="scroller" class="message-list">
    <div class="message-list__inner">
      <MessageItem v-for="message in messages" :key="message.id" :message="message" />
    </div>
  </section>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.message-list__inner {
  width: min(100%, var(--chat-max-width));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem 1.2rem 4rem;
}

@media (max-width: 700px) {
  .message-list__inner {
    padding-inline: 0.85rem;
    padding-bottom: 2rem;
  }
}
</style>
