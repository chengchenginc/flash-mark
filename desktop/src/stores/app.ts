import { defineStore } from 'pinia'
import { load } from '@tauri-apps/plugin-store'

const STORE_FILE = 'app_config.json'

export const useAppStore = defineStore('app', {
  state: () => ({
    // 默认双屏模式（编辑 | 预览，需求：默认双屏即预览打开）
    viewMode: 'dual' as 'single' | 'dual',
    singleFocus: 'editor' as 'editor' | 'preview',
    splitRatio: 0.5,
    theme: 'light' as 'light' | 'dark',
    showAllFiles: false,
    sidebarTab: 'outline' as 'outline' | 'files' | 'recents',
    sidebarOpen: true,
    folderPath: null as string | null,
    toast: null as string | null,
    _toastTimer: 0 as ReturnType<typeof setTimeout>,
    _store: null as any,
  }),
  actions: {
    async init() {
      const store = await load(STORE_FILE, { autoSave: true })
      this._store = store
      const keys = [
        'viewMode',
        'singleFocus',
        'splitRatio',
        'theme',
        'showAllFiles',
        'sidebarTab',
        'sidebarOpen',
      ] as const
      for (const k of keys) {
        const v = await store.get(k)
        if (v !== null && v !== undefined) (this as any)[k] = v
      }
      if (this.viewMode !== 'single' && this.viewMode !== 'dual') this.viewMode = 'dual'
    },
    async persist(key: string) {
      if (this._store) {
        await this._store.set(key, (this as any)[key])
        await this._store.save()
      }
    },
    async setViewMode(m: 'single' | 'dual') {
      this.viewMode = m
      await this.persist('viewMode')
    },
    async setSingleFocus(f: 'editor' | 'preview') {
      this.singleFocus = f
      await this.persist('singleFocus')
    },
    async setSplitRatio(r: number) {
      this.splitRatio = r
      await this.persist('splitRatio')
    },
    async setTheme(t: 'light' | 'dark') {
      this.theme = t
      await this.persist('theme')
    },
    async setShowAllFiles(v: boolean) {
      this.showAllFiles = v
      await this.persist('showAllFiles')
    },
    async setSidebarTab(t: 'outline' | 'files' | 'recents') {
      this.sidebarTab = t
      await this.persist('sidebarTab')
    },
    async setSidebarOpen(v: boolean) {
      this.sidebarOpen = v
      await this.persist('sidebarOpen')
    },
    setFolderPath(p: string | null) {
      this.folderPath = p
    },
    /** 显示全局 toast 提示（重复调用刷新文案并重置计时） */
    showToast(msg: string, ms = 2400) {
      this.toast = msg
      if (this._toastTimer) clearTimeout(this._toastTimer)
      this._toastTimer = setTimeout(() => {
        this.toast = null
        this._toastTimer = 0
      }, ms)
    },
  },
})
