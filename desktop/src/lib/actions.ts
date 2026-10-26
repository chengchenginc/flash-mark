/**
 * 应用级动作（新建 / 打开 / 保存 / 导出）。
 *
 * 从 Toolbar.vue 抽离，供原生菜单事件桥（App.vue）与工具栏共用，
 * 保证菜单与界面操作走同一份实现。
 */
import { open, save } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore } from '@/stores/app'
import { useTabsStore } from '@/stores/tabs'
import { useRecentsStore } from '@/stores/recents'
import { exportPng, exportHtml, exportPdf, buildStandaloneHtml } from '@/lib/exporter'
import { isSupportedFile } from '@/lib/fileKind'

/** 新建空白文档标签 */
export async function newFile(): Promise<void> {
  const tabs = useTabsStore()
  tabs.open({ name: '未命名.md', content: '# 未命名\n\n开始写作…' })
}

/** 系统对话框选择并打开单个文件（Markdown 或 html/csv/txt/js/css 等文本文件） */
export async function openFile(): Promise<void> {
  const selected = await open({
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown'] },
      { name: 'Text / Web', extensions: ['html', 'htm', 'csv', 'txt', 'js', 'css'] },
    ],
  })
  if (typeof selected === 'string') await loadFile(selected)
}

/** 系统对话框选择文件夹并展示目录树 */
export async function openFolder(): Promise<void> {
  const app = useAppStore()
  const selected = await open({ directory: true })
  if (typeof selected === 'string') {
    app.setFolderPath(selected)
    app.setSidebarTab('files')
    app.setSidebarOpen(true)
  }
}

/** 通过后端命令读取文件并打开为新标签，写入最近文件；失败或不支持的类型时给出 toast 提示 */
export async function loadFile(path: string): Promise<void> {
  const app = useAppStore()
  const name = path.split(/[\\/]/).pop() || path
  if (!isSupportedFile(name)) {
    app.showToast('暂不支持打开该类型文件')
    return
  }
  const tabs = useTabsStore()
  const recents = useRecentsStore()
  const fc = await invoke<{ path: string; name: string; content: string; size: number }>(
    'open_file',
    { path },
  ).catch((e) => {
    app.showToast(`打开失败：${e}`)
    return null
  })
  if (!fc) return
  tabs.open({ path: fc.path, name: fc.name, content: fc.content })
  await recents.add(fc.path, fc.name, fc.size)
}

/** 保存当前活动标签（无路径时先弹保存对话框） */
export async function saveActive(): Promise<void> {
  const tabs = useTabsStore()
  const recents = useRecentsStore()
  const t = tabs.active
  if (!t) return
  let path = t.path
  if (!path) {
    const p = await save({
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'Text / Web', extensions: ['html', 'htm', 'csv', 'txt', 'js', 'css'] },
      ],
    })
    if (typeof p !== 'string') return
    path = p
  }
  await invoke('save_file', { path, content: t.content }).catch(() => {})
  tabs.markSaved(t.id, t.content)
  await recents.add(path, t.name, new Blob([t.content]).size)
}

/** 导出当前预览渲染结果（PNG 图文卡片 / 自包含 HTML / PDF） */
export async function doExport(kind: 'png' | 'html' | 'pdf'): Promise<void> {
  const tabs = useTabsStore()
  const el = document.querySelector('.markdown-body') as HTMLElement | null
  if (!el) return
  const name = (tabs.active?.name || 'flashmark').replace(/\.md$/i, '')
  if (kind === 'png') await exportPng(el, name)
  else if (kind === 'html') await exportHtml(buildStandaloneHtml(el.innerHTML), name)
  else await exportPdf(el, name)
}
