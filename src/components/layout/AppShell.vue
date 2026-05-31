<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import Sidebar from './Sidebar.vue'
import MainPanel from './MainPanel.vue'
import SettingsPanel from '@/components/settings/SettingsPanel.vue'
import { useSettingsStore } from '@/stores/settingsStore'

const settingsStore = useSettingsStore()

const settingsOpen = ref(false)
const sidebarOpen = ref(false)

function closeSidebar(): void {
  sidebarOpen.value = false
}

onMounted(() => {
  settingsStore.initializeTheme()
  settingsStore.initializeLocale()
})

onUnmounted(() => {
  settingsStore.disposeTheme()
  settingsStore.disposeLocale()
})
</script>

<template>
  <div class="shell-root">
    <div v-if="sidebarOpen" class="mobile-overlay" @click="closeSidebar" />

    <div class="app-shell">
      <Sidebar
        :open="sidebarOpen"
        @close="closeSidebar"
        @open-settings="settingsOpen = true"
        @session-picked="closeSidebar"
      />
      <MainPanel
        @open-settings="settingsOpen = true"
        @open-sidebar="sidebarOpen = true"
      />
    </div>

    <SettingsPanel :open="settingsOpen" @close="settingsOpen = false" />
  </div>
</template>

<style scoped>
.shell-root {
  position: relative;
  min-height: 100vh;
}

.mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 110;
  background: var(--overlay);
}

@media (min-width: 901px) {
  .mobile-overlay {
    display: none;
  }
}
</style>
