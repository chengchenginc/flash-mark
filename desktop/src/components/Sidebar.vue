<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import Outline from './Outline.vue'
import FileTree from './FileTree.vue'
import RecentsPanel from './RecentsPanel.vue'

const app = useAppStore()
const { sidebarTab } = storeToRefs(app)

function collapse() {
  void app.setSidebarOpen(false)
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-tabs">
      <button :class="{ active: sidebarTab === 'outline' }" @click="app.setSidebarTab('outline')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        大纲
      </button>
      <button :class="{ active: sidebarTab === 'files' }" @click="app.setSidebarTab('files')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        文件
      </button>
      <button :class="{ active: sidebarTab === 'recents' }" @click="app.setSidebarTab('recents')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        最近
      </button>
      <!-- 折叠按钮：位于 tabs 行末尾，点击向左收起侧栏 -->
      <button class="tab-collapse" title="收起侧栏" @click="collapse">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </div>
    <div class="sidebar-body">
      <Outline v-if="sidebarTab === 'outline'" />
      <FileTree v-else-if="sidebarTab === 'files'" />
      <RecentsPanel v-else />
    </div>

    <!-- 折叠把手：贴侧栏右缘垂直居中，点击收起侧栏 -->
    <button class="sidebar-collapse" title="收起侧栏" @click="collapse">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  </aside>
</template>

<style scoped>
.sidebar {
  position: relative;
  width: 260px;
  flex: 0 0 260px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--panel);
  height: 100%;
  -webkit-user-select: none;
  user-select: none;
}
.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
}
.sidebar-tabs button {
  flex: 1;
  min-width: 60px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: none;
  background: transparent;
  padding: 8px 0;
  cursor: pointer;
  color: var(--muted);
  font-size: 13px;
}
.sidebar-tabs button.active {
  color: var(--accent);
  font-weight: 600;
  box-shadow: inset 0 -2px 0 var(--accent);
}
/* tabs 行末尾的折叠按钮：不参与均分，固定宽度（需高于 .sidebar-tabs button 的特异性） */
.sidebar-tabs button.tab-collapse {
  flex: 0 0 auto;
  min-width: 0;
  width: 35px;
  border-left: 1px solid var(--border);
}
.sidebar-tabs button.tab-collapse:hover {
  color: var(--accent);
  background: var(--hover);
}
.sidebar-body {
  flex: 1;
  overflow: auto;
}

/* 折叠把手：骑在侧栏与主区分界线上 */
.sidebar-collapse {
  position: absolute;
  right: -9px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 18px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
  color: var(--muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.sidebar-collapse:hover {
  color: var(--accent);
  background: var(--hover);
}
</style>
