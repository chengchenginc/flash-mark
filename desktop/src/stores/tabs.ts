import { defineStore } from 'pinia'

export interface Tab {
  id: string
  path: string | null
  name: string
  content: string
  baseContent: string
  dirty: boolean
}

let seq = 0
function newId(): string {
  return 'tab-' + ++seq + '-' + Date.now()
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: [] as Tab[],
    activeId: null as string | null,
  }),
  getters: {
    active(state): Tab | null {
      return state.tabs.find((t) => t.id === state.activeId) || null
    },
  },
  actions: {
    open(input: { path?: string | null; name: string; content: string }) {
      if (input.path) {
        const existing = this.tabs.find((t) => t.path === input.path)
        if (existing) {
          this.activeId = existing.id
          return existing.id
        }
      }
      const id = newId()
      this.tabs.push({
        id,
        path: input.path ?? null,
        name: input.name,
        content: input.content,
        baseContent: input.content,
        dirty: false,
      })
      this.activeId = id
      return id
    },
    setContent(id: string, content: string) {
      const t = this.tabs.find((x) => x.id === id)
      if (!t) return
      t.content = content
      t.dirty = content !== t.baseContent
    },
    async close(id: string): Promise<boolean> {
      const t = this.tabs.find((x) => x.id === id)
      if (t && t.dirty) {
        const ok = window.confirm(`文件「${t.name}」未保存，确定关闭？`)
        if (!ok) return false
      }
      this.tabs = this.tabs.filter((x) => x.id !== id)
      if (this.activeId === id) {
        this.activeId = this.tabs.length ? this.tabs[this.tabs.length - 1].id : null
      }
      return true
    },
    setActive(id: string) {
      this.activeId = id
    },
    markSaved(id: string, content: string) {
      const t = this.tabs.find((x) => x.id === id)
      if (!t) return
      t.baseContent = content
      t.content = content
      t.dirty = false
    },
  },
})
