<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useTabsStore } from '@/stores/tabs'
import { renderMarkdown } from '@/lib/markdown'
import { renderCharts } from '@/lib/charts'
import { doExport } from '@/lib/actions'
import { fileKindOf, extOf, parseCsv } from '@/lib/fileKind'
import hljs from 'highlight.js'

const tabs = useTabsStore()
const { active } = storeToRefs(tabs)
const article = ref<HTMLElement | null>(null)
const codeEl = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const fabRoot = ref<HTMLElement | null>(null)

/** 当前活动标签的文件种类，决定预览渲染分支 */
const kind = computed(() => fileKindOf(active.value?.name ?? ''))

/** csv 预览数据：解析为二维数组后以表格展示 */
const csvRows = computed(() => (kind.value === 'csv' ? parseCsv(active.value?.content ?? '') : []))

/**
 * plain 类型的 highlight.js 语言映射（txt/log 等纯文本不高亮）。
 * 表中未覆盖的扩展名由 hljs.getLanguage 判断兜底为纯文本。
 */
const HLJS_LANG: Record<string, string> = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  jsx: 'javascript',
  java: 'java', py: 'python', php: 'php', rs: 'rust', go: 'go',
  c: 'cpp', cc: 'cpp', cpp: 'cpp', h: 'cpp', hpp: 'cpp',
  cs: 'cs', rb: 'ruby', kt: 'kotlin', swift: 'swift', sql: 'sql',
  json: 'json', xml: 'xml', yml: 'yaml', yaml: 'yaml',
  toml: 'ini', ini: 'ini', conf: 'ini',
  bat: 'dos', cmd: 'dos', sh: 'bash', bash: 'bash', zsh: 'bash',
  ps1: 'powershell', lua: 'lua', pl: 'perl',
}

async function render() {
  // markdown：沿用现有渲染管线；plain：代码高亮展示
  // html 走 iframe :srcdoc、csv 走 computed 表格，均为声明式绑定无需手动渲染
  if (kind.value === 'markdown') {
    if (!article.value) return
    article.value.innerHTML = renderMarkdown(active.value?.content ?? '')
    await renderCharts(article.value)
  } else if (kind.value === 'plain') {
    if (!codeEl.value) return
    const lang = HLJS_LANG[extOf(active.value?.name ?? '')]
    const src = active.value?.content ?? ''
    if (lang && hljs.getLanguage(lang)) {
      codeEl.value.innerHTML = hljs.highlight(src, { language: lang, ignoreIllegals: true }).value
    } else {
      codeEl.value.textContent = src
    }
  }
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
// 切换标签时即使内容字符串相同也要重渲染（plain 分支的 code 是新挂载的节点）
watch(() => active.value?.id, () => void render(), { flush: 'post' })
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
    <!-- 导出仅对 Markdown 有意义，其余类型隐藏悬浮按钮 -->
    <div v-if="kind === 'markdown'" class="export-fab" ref="fabRoot" :class="{ open: menuOpen }">
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
      <!-- html：沙箱 iframe 实时预览（不授予 allow-same-origin，脚本无法访问父窗口） -->
      <iframe
        v-if="kind === 'html'"
        class="html-frame"
        :srcdoc="active?.content ?? ''"
        sandbox="allow-scripts allow-modals allow-forms"
      ></iframe>
      <!-- csv：解析为表格展示 -->
      <div v-else-if="kind === 'csv'" class="csv-wrap">
        <table class="csv-table">
          <tbody>
            <tr v-for="(row, ri) in csvRows" :key="ri">
              <td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- txt / js / css：代码高亮只读展示 -->
      <div v-else-if="kind === 'plain'" class="plain-wrap">
        <pre class="plain-pre"><code ref="codeEl" class="hljs"></code></pre>
      </div>
      <article v-else class="markdown-body" ref="article"></article>
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

/* html 沙箱预览：铺满预览区，白底隔离主题样式 */
.html-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

/* csv 表格：细边框 + 等宽字体，首列不特殊处理 */
.csv-wrap {
  padding: 16px;
}
.csv-table {
  border-collapse: collapse;
  font-size: 13px;
  font-family: ui-monospace, monospace;
}
.csv-table td {
  border: 1px solid var(--border);
  padding: 4px 10px;
  white-space: nowrap;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--fg);
}

/* plain 代码展示：等宽 + hljs 主题配色（github.css 全局已引入） */
.plain-wrap {
  min-height: 100%;
}
.plain-pre {
  margin: 0;
  padding: 16px;
  font-family: ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.6;
}
.plain-pre code.hljs {
  padding: 0;
  background: transparent;
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
