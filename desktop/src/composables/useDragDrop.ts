import { getCurrentWebview } from '@tauri-apps/api/webview'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore } from '@/stores/app'
import { loadFile } from '@/lib/actions'
import type { DirNode } from '@/types'

/**
 * 监听窗口拖放事件：
 * - 拖入目录 → 设置 folderPath 并切到「文件」侧栏
 * - 拖入单文件 → 打开为新标签并写入最近文件
 * 返回取消监听函数。
 */
export async function setupDragDrop(): Promise<() => void> {
  const unlisten = await getCurrentWebview().onDragDropEvent((event) => {
    if (event.payload.type !== 'drop') return
    const paths = event.payload.paths
    if (!paths.length) return
    void handleDrop(paths)
  })
  return unlisten
}

async function handleDrop(paths: string[]): Promise<void> {
  const app = useAppStore()
  const first = paths[0]
  const node = await invoke<DirNode>('read_dir_tree', { path: first }).catch(() => null)
  if (node && node.is_dir) {
    app.setFolderPath(first)
    app.setSidebarTab('files')
    return
  }
  await loadFile(first)
}
