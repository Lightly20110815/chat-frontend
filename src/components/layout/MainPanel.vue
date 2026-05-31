<script setup lang="ts">
import ChatView from '@/components/chat/ChatView.vue'

const emit = defineEmits<{
  'open-settings': []
  'open-sidebar': []
}>()
</script>

<template>
  <main class="main-panel">
    <ChatView @open-settings="emit('open-settings')" @open-sidebar="emit('open-sidebar')" />
  </main>
</template>

<style scoped>
.main-panel {
  min-width: 0;
  min-height: 100vh;
}
</style>
