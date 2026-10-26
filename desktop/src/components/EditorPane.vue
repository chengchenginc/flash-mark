<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { php } from '@codemirror/lang-php'
import { rust } from '@codemirror/lang-rust'
import { cpp } from '@codemirror/lang-cpp'
import { StreamLanguage } from '@codemirror/language'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { powerShell } from '@codemirror/legacy-modes/mode/powershell'
import { useTabsStore } from '@/stores/tabs'
import { extOf } from '@/lib/fileKind'

/**
 * 按文件扩展名选择 CodeMirror 语言扩展。
 * 无对应语法包的扩展名（txt/csv/java 之外的多数文本）返回 [] 走纯文本。
 */
function langFor(name?: string | null) {
  switch (extOf(name ?? '')) {
    case 'md':
    case 'markdown':
      return markdown()
    case 'html':
    case 'htm':
      return html()
    case 'css':
      return css()
    case 'js':
    case 'mjs':
    case 'cjs':
    case 'jsx':
      return javascript({ jsx: extOf(name ?? '') === 'jsx' })
    case 'ts':
      return javascript({ typescript: true })
    case 'tsx':
      return javascript({ typescript: true, jsx: true })
    case 'py':
      return python()
    case 'java':
      return java()
    case 'php':
      return php()
    case 'rs':
      return rust()
    case 'c':
    case 'cc':
    case 'cpp':
    case 'h':
    case 'hpp':
      return cpp()
    case 'sh':
    case 'bash':
    case 'zsh':
      return StreamLanguage.define(shell)
    case 'ps1':
      return StreamLanguage.define(powerShell)
    default:
      return []
  }
}

const tabs = useTabsStore()
const el = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null
// 语言模式走 Compartment，切换标签时按扩展名重新配置
const langComp = new Compartment()

onMounted(() => {
  if (!el.value) return
  const startState = EditorState.create({
    doc: tabs.active?.content ?? '',
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      langComp.of(langFor(tabs.active?.name)),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) {
          const id = tabs.activeId
          if (id) tabs.setContent(id, u.state.doc.toString())
        }
      }),
      // 主题色全部走 CSS 变量：随 .app.dark 自动切换，
      // 覆盖 CM6 默认 &light 硬编码浅色（gutter/选区/光标/activeLine）
      EditorView.theme({
        '&': {
          height: '100%',
          color: 'var(--fg)',
          backgroundColor: 'var(--bg)',
        },
        '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, monospace' },
        '.cm-content': { caretColor: 'var(--fg)' },
        '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--fg)' },
        '.cm-gutters': {
          backgroundColor: 'var(--panel-alt)',
          color: 'var(--muted)',
          border: 'none',
        },
        '.cm-activeLine': { backgroundColor: 'var(--hover)' },
        '.cm-activeLineGutter': { backgroundColor: 'var(--hover)' },
        '.cm-selectionBackground': { backgroundColor: 'var(--accent-soft)' },
        '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
          backgroundColor: 'var(--accent-soft)',
        },
        '.cm-selectionMatch': { backgroundColor: 'var(--hover)' },
      }),
    ],
  })
  view = new EditorView({ state: startState, parent: el.value })
})

watch(
  () => tabs.activeId,
  () => {
    if (!view || !tabs.activeId) return
    const content = tabs.active?.content ?? ''
    // 切换标签：同步内容 + 按扩展名重配语言模式
    view.dispatch({
      changes: view.state.doc.toString() === content
        ? []
        : { from: 0, to: view.state.doc.length, insert: content },
      effects: langComp.reconfigure(langFor(tabs.active?.name)),
    })
  },
)

// 外部内容变化（如打开新文件）且编辑器未聚焦时同步
watch(
  () => tabs.active?.content,
  (content) => {
    if (!view || content === undefined) return
    const focused = document.activeElement === view.contentDOM
    if (!focused && view.state.doc.toString() !== content) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: content } })
    }
  },
)

onBeforeUnmount(() => {
  view?.destroy()
})
</script>

<template>
  <div class="editor-pane" ref="el"></div>
</template>

<style scoped>
.editor-pane {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.editor-pane :deep(.cm-editor) {
  height: 100%;
}
</style>
