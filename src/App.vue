<script setup lang="ts">
import { provideAppState } from '@/stores'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import FileSelector from '@/components/file/FileSelector.vue'
import CompileOptions from '@/components/compile/CompileOptions.vue'
import ReferenceContainer from '@/components/reference/ReferenceContainer.vue'
import Toast from '@/components/common/Toast.vue'
import { computed } from 'vue'

const appState = provideAppState()
appState.initTheme()

const tabComponents = {
  file: FileSelector,
  compile: CompileOptions,
  reference: ReferenceContainer
} as const

const currentTab = computed(() => appState.state.activeTab)
</script>

<template>
  <div class="app-container">
    <AppHeader />

    <main class="main-content">
      <AppSidebar />

      <div class="content-area">
        <component :is="tabComponents[currentTab]" />
      </div>
    </main>

    <Toast />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-primary);
}

.main-content {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.content-area {
  flex: 1;
  padding: 24px;
  min-height: 0;
  overflow-y: auto;
  background: var(--bg-primary);
}
</style>
