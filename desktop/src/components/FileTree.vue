<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useTabsStore } from '@/stores/tabs'
import { useRecentsStore } from '@/stores/recents'
import { invoke } from '@tauri-apps/api/core'
import { isSupportedFile } from '@/lib/fileKind'
import type { DirNode } from '@/types'
import TreeNode from './TreeNode.vue'

const app = useAppStore()
const tabs = useTabsStore()
const recents = useRecentsStore()
const tree = ref<DirNode | null>(null)
const expanded = ref<Set<string>>(new Set())

const folderPath = computed(() => app.folderPath)

async function load() {
  if (!folderPath.value) {
    tree.value = null
    return
  }
  tree.value = await invoke<DirNode>('read_dir_tree', { path: folderPath.value }).catch(() => null)
}
watch(folderPath, () => void load(), { immediate: true })

function visible(node: DirNode): boolean {
  if (app.showAllFiles) return true
  if (node.is_dir) return true
  return isSupportedFile(node.name)
}

function toggle(path: string) {
  const s = new Set(expanded.value)
  if (s.has(path)) s.delete(path)
  else s.add(path)
  expanded.value = s
}

function openFile(node: DirNode) {
  if (node.is_dir) {
    toggle(node.path)
    return
  }
  if (!isSupportedFile(node.name)) return
  invoke<{ path: string; name: string; content: string; size: number }>('open_file', {
    path: node.path,
  })
    .then((fc) => {
      tabs.open({ path: fc.path, name: fc.name, content: fc.content })
      void recents.add(fc.path, fc.name, fc.size)
    })
    .catch(() => {})
}

function openRootInTree() {
  if (tree.value) toggle(tree.value.path)
}
</script>

<template>
  <div class="file-tree">
    <div v-if="!folderPath" class="empty">拖入文件夹查看目录树</div>
    <template v-else>
      <div class="ft-toolbar">
        <label>
          <input
            type="checkbox"
            :checked="app.showAllFiles"
            @change="app.setShowAllFiles(($event.target as HTMLInputElement).checked)"
          />
          显示全部文件
        </label>
      </div>
      <div class="ft-tree">
        <button class="ft-root" @click="openRootInTree">
          <span>{{ expanded.has(folderPath) ? '▾' : '▸' }}</span> {{ folderPath.split(/[\\/]/).pop() }}
        </button>
        <TreeNode
          v-if="tree && expanded.has(tree.path)"
          :node="tree"
          :depth="1"
          :visible="visible"
          :expanded="expanded"
          @toggle="toggle"
          @open="openFile"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.file-tree {
  font-size: 13px;
  padding: 4px;
}
.ft-toolbar {
  padding: 4px 8px 8px;
  color: var(--muted);
}
.ft-toolbar label {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.ft-root {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--fg);
  font-weight: 600;
  text-align: left;
}
.ft-root:hover {
  background: var(--accent-soft);
}
.empty {
  color: var(--muted);
  padding: 8px;
}
</style>
