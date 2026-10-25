<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { useTabsStore } from '@/stores/tabs'

const tabs = useTabsStore()
const el = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null

onMounted(() => {
  if (!el.value) return
  const startState = EditorState.create({
    doc: tabs.active?.content ?? '',
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      markdown(),
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
    if (view.state.doc.toString() !== content) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: content } })
    }
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
