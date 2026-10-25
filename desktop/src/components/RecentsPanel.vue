<script setup lang="ts">
import { onMounted } from 'vue'
import { useRecentsStore } from '@/stores/recents'
import { useTabsStore } from '@/stores/tabs'
import { invoke } from '@tauri-apps/api/core'

const recents = useRecentsStore()
const tabs = useTabsStore()

onMounted(() => {
  void recents.load()
})

function open(path: string) {
  invoke<{ path: string; name: string; content: string; size: number }>('open_file', { path })
    .then((fc) => tabs.open({ path: fc.path, name: fc.name, content: fc.content }))
    .catch(() => {})
}

function fmt(ts: number): string {
  if (!ts) return ''
  try {
    return new Date(ts * 1000).toLocaleString()
  } catch {
    return ''
  }
}
</script>

<template>
  <div class="recents">
    <div v-if="!recents.items.length" class="empty">暂无最近文件</div>
    <ul v-else>
      <li v-for="r in recents.items" :key="r.path">
        <div class="r-main" @click="open(r.path)">
          <div class="r-name">{{ r.name }}</div>
          <div class="r-path">{{ r.path }}</div>
          <div class="r-time">{{ fmt(r.last_opened) }}</div>
        </div>
        <button class="r-del" @click="recents.remove(r.path)" title="移除">×</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.recents {
  font-size: 13px;
}
.recents ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.recents li {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid var(--border);
}
.r-main {
  flex: 1;
  padding: 8px;
  cursor: pointer;
  min-width: 0;
}
.r-main:hover {
  background: var(--hover);
}
.r-name {
  font-weight: 600;
  color: var(--fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.r-path {
  color: var(--muted);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.r-time {
  color: var(--muted);
  font-size: 11px;
}
.r-del {
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  padding: 0 10px;
  font-size: 16px;
}
.r-del:hover {
  color: #ef4444;
}
.empty {
  color: var(--muted);
  padding: 8px;
}
</style>
