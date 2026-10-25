<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { listen } from '@tauri-apps/api/event'
import { useAppStore } from '@/stores/app'
import { useTabsStore } from '@/stores/tabs'
import { useRecentsStore } from '@/stores/recents'
import { setupDragDrop } from '@/composables/useDragDrop'
import { newFile, openFile, openFolder, saveActive } from '@/lib/actions'
import TabBar from '@/components/TabBar.vue'
import Sidebar from '@/components/Sidebar.vue'
import SplitView from '@/components/SplitView.vue'

const app = useAppStore()
const tabs = useTabsStore()
const recents = useRecentsStore()
let unlisten: (() => void) | null = null
let unlistenMenu: (() => void) | null = null

/** 原生菜单事件分发（Rust 侧 emit "menu://action"，payload 为 action id） */
async function handleMenuAction(action: string) {
  switch (action) {
    case 'new_file':
      return newFile()
    case 'open_file':
      return openFile()
    case 'open_folder':
      return openFolder()
    case 'save':
      return saveActive()
  }
}

onMounted(async () => {
  await app.init()
  await recents.load()
  unlisten = await setupDragDrop()
  unlistenMenu = await listen<string>('menu://action', (e) => void handleMenuAction(e.payload))
})
onBeforeUnmount(() => {
  unlisten?.()
  unlistenMenu?.()
})
</script>

<template>
  <div class="app" :class="app.theme">
    <div class="main">
      <Sidebar v-if="app.sidebarOpen" />
      <!-- 侧栏收起时的展开把手（与侧栏折叠把手同位置） -->
      <button v-else class="sidebar-expand" title="展开侧栏" @click="app.setSidebarOpen(true)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <!-- 右侧内容列：TabBar 在上、工作区在下，与左侧 Sidebar 左右结构 -->
      <div class="content">
        <TabBar />
        <div class="workspace">
          <div v-if="!tabs.tabs.length" class="empty-state">
            <div class="empty-card">
              <svg class="empty-icon" width="44" height="44" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <polyline points="9 15 12 12 15 15" />
              </svg>
              <p class="empty-title">未打开文件</p>
              <p class="empty-hint">请拖入想要预览的文件或者文件夹</p>
            </div>
          </div>
          <SplitView v-else />
        </div>
      </div>
    </div>
    <!-- 全局 toast 提示（导出完成等操作反馈） -->
    <Transition name="toast">
      <div v-if="app.toast" class="toast" role="status">{{ app.toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.main {
  flex: 1;
  display: flex;
  min-height: 0;
}
/* 右侧内容列：TabBar 在上、workspace 在下 */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.workspace {
  flex: 1;
  min-height: 0;
  position: relative;
}

/* 侧栏收起时的展开把手：fixed 浮在上层，不占用布局宽度 */
.sidebar-expand {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 18px;
  height: 40px;
  border: none;
  border-radius: 0 8px 8px 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.sidebar-expand:hover {
  color: var(--accent);
  background: var(--hover);
}

/* 空态：覆盖整个内容区，支持直接拖入 */
.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}
.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 48px 72px;
  border: 1.5px dashed var(--border);
  border-radius: 16px;
  color: var(--muted);
  pointer-events: none;
}
.empty-icon {
  color: var(--accent);
  opacity: 0.55;
  margin-bottom: 6px;
}
.empty-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--fg);
}
.empty-hint {
  margin: 0;
  font-size: 13px;
}

/* 全局 toast：底部居中浮层，不挡操作 */
.toast {
  position: fixed;
  left: 50%;
  bottom: 36px;
  transform: translateX(-50%);
  z-index: 9999;
  max-width: 60vw;
  padding: 10px 18px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--panel);
  color: var(--fg);
  font-size: 13px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.16);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
