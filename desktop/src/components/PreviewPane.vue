<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useTabsStore } from '@/stores/tabs'
import { renderMarkdown } from '@/lib/markdown'
import { renderCharts } from '@/lib/charts'
import { doExport } from '@/lib/actions'

const tabs = useTabsStore()
const { active } = storeToRefs(tabs)
const article = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const fabRoot = ref<HTMLElement | null>(null)

async function render() {
  if (!article.value) return
  const src = active.value?.content ?? ''
  article.value.innerHTML = renderMarkdown(src)
  await renderCharts(article.value)
}

/** 导出当前预览并收起菜单 */
async function exportAs(kind: 'png' | 'html' | 'pdf') {
  menuOpen.value = false
  await doExport(kind)
}

/** 点击菜单外部时收起导出菜单 */
function onDocClick(e: MouseEvent) {
  if (menuOpen.value && fabRoot.value && !fabRoot.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}

watch(() => active.value?.content, () => void render(), { flush: 'post' })
onMounted(() => {
  void render()
  document.addEventListener('click', onDocClick)
})
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

defineExpose({ article })
</script>

<template>
  <div class="preview-wrap">
    <!-- 右上角悬浮导出：悬停预览时显现，点击展开格式选项 -->
    <div class="export-fab" ref="fabRoot" :class="{ open: menuOpen }">
      <button class="fab-btn" title="导出" @click.stop="menuOpen = !menuOpen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
      <div v-if="menuOpen" class="fab-menu">
        <button class="fab-item" @click="exportAs('png')">导出 PNG</button>
        <button class="fab-item" @click="exportAs('html')">导出 HTML</button>
        <button class="fab-item" @click="exportAs('pdf')">导出 PDF</button>
      </div>
    </div>
    <div class="preview-pane">
      <article class="markdown-body" ref="article"></article>
    </div>
  </div>
</template>

<style scoped>
.preview-wrap {
  position: relative;
  height: 100%;
  min-height: 0;
}
.preview-pane {
  height: 100%;
  overflow: auto;
  padding: 0;
  background: var(--bg-soft);
}

/* 悬浮导出按钮：默认隐藏，悬停预览区或展开菜单时显现 */
.export-fab {
  position: absolute;
  top: 10px;
  right: 14px;
  z-index: 20;
  opacity: 0;
  transition: opacity 0.15s;
}
.preview-wrap:hover .export-fab,
.export-fab.open {
  opacity: 1;
}
.fab-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
  color: var(--muted);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: background 0.12s, color 0.12s;
}
.fab-btn:hover {
  background: var(--hover);
  color: var(--fg);
}
.fab-menu {
  position: absolute;
  top: 34px;
  right: 0;
  min-width: 120px;
  padding: 4px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
}
.fab-item {
  border: none;
  background: transparent;
  text-align: left;
  padding: 7px 12px;
  font-size: 13px;
  color: var(--fg);
  border-radius: 5px;
  cursor: pointer;
  white-space: nowrap;
}
.fab-item:hover {
  background: var(--hover);
}
</style>
