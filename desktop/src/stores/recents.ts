import { defineStore } from 'pinia'
import { invoke } from '@tauri-apps/api/core'
import type { RecentFile } from '@/types'

export const useRecentsStore = defineStore('recents', {
  state: () => ({
    items: [] as RecentFile[],
  }),
  actions: {
    async load() {
      try {
        this.items = await invoke<RecentFile[]>('list_recents', { limit: 20 })
      } catch {
        this.items = []
      }
    },
    async add(path: string, name: string, size: number) {
      try {
        await invoke('add_recent', { path, name, size })
        await this.load()
      } catch {
        /* 忽略持久化失败 */
      }
    },
    async remove(path: string) {
      try {
        await invoke('remove_recent', { path })
        await this.load()
      } catch {
        /* 忽略 */
      }
    },
  },
})
