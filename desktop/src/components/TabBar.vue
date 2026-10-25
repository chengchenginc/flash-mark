<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useTabsStore } from '@/stores/tabs'

const app = useAppStore()
const tabs = useTabsStore()

function toggleView() {
  void app.setViewMode(app.viewMode === 'single' ? 'dual' : 'single')
}
function toggleTheme() {
  void app.setTheme(app.theme === 'light' ? 'dark' : 'light')
}
</script>

<template>
  <div class="tabbar">
    <div
      v-for="t in tabs.tabs"
      :key="t.id"
      class="tab"
      :class="{ active: t.id === tabs.activeId }"
      @click="tabs.setActive(t.id)"
    >
      <span class="tab-name">
        {{ t.name }}
        <span v-if="t.dirty" class="dot" title="未保存">●</span>
      </span>
      <span class="tab-close" @click.stop="tabs.close(t.id)">×</span>
    </div>

    <!-- 标签栏右侧工具区：双屏 / 主题切换 -->
    <div class="actions">
      <button class="icon-btn" :class="{ on: app.viewMode === 'dual' }" @click="toggleView"
        :title="app.viewMode === 'single' ? '切换双屏' : '切换单屏'">
        <!-- 双屏图标 -->
        <svg v-if="app.viewMode === 'single'" width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="7" height="16" rx="1" />
          <rect x="14" y="4" width="7" height="16" rx="1" />
        </svg>
        <!-- 单屏图标 -->
        <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      </button>
      <button class="icon-btn" @click="toggleTheme"
        :title="app.theme === 'light' ? '切换暗色主题' : '切换亮色主题'">
        <!-- 月亮（当前亮色，点击切暗） -->
        <svg v-if="app.theme === 'light'" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <!-- 太阳（当前暗色，点击切亮） -->
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tabbar {
  display: flex;
  align-items: stretch;
  background: var(--panel-alt);
  border-bottom: 1px solid var(--border);
  height: 36px;
  overflow-x: auto;
  -webkit-user-select: none;
  user-select: none;
}
.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-right: 1px solid var(--border);
  cursor: pointer;
  color: var(--muted);
  font-size: 13px;
  white-space: nowrap;
  max-width: 220px;
  box-shadow: inset 0 2px 0 transparent;
  transition: background 0.12s, color 0.12s;
}
.tab:hover {
  color: var(--fg);
  background: var(--hover);
}
.tab.active {
  background: var(--panel);
  color: var(--fg);
  font-weight: 600;
  box-shadow: inset 0 2px 0 var(--accent);
}
.tab-name {
  overflow: hidden;
  text-overflow: ellipsis;
}
.dot {
  color: #f59e0b;
  font-size: 8px;
  margin-left: 2px;
}
.tab-close {
  color: #9ca3af;
  border-radius: 4px;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.tab-close:hover {
  background: var(--hover);
  color: var(--fg);
}

/* 右侧工具区：贴右固定，不随标签滚动 */
.actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  flex: 0 0 auto;
}
.icon-btn {
  display: inline-flex;
  align-items: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  padding: 5px;
  cursor: pointer;
  color: var(--muted);
  transition: background 0.12s, color 0.12s;
}
.icon-btn:hover {
  background: var(--hover);
  color: var(--fg);
}
.icon-btn.on {
  background: var(--accent-soft);
  color: var(--accent);
}
</style>
