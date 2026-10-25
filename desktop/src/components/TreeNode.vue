<script setup lang="ts">
import type { DirNode } from '@/types'

defineProps<{
  node: DirNode
  depth: number
  visible: (n: DirNode) => boolean
  expanded: Set<string>
}>()

const emit = defineEmits<{
  (e: 'toggle', p: string): void
  (e: 'open', n: DirNode): void
}>()

function isMd(n: string): boolean {
  return /\.md$/i.test(n)
}
</script>

<template>
  <div v-if="visible(node)" class="tree-node" :style="{ paddingLeft: depth * 14 + 'px' }">
    <div
      class="node-row"
      :class="node.is_dir ? 'dir' : 'file'"
      @click="node.is_dir ? emit('toggle', node.path) : emit('open', node)"
    >
      <span class="icon">{{ node.is_dir ? (expanded.has(node.path) ? '▾' : '▸') : '📄' }}</span>
      <span class="label">{{ node.name }}</span>
    </div>
    <div v-if="node.is_dir && expanded.has(node.path)" class="children">
      <TreeNode
        v-for="(c, i) in node.children"
        :key="i"
        :node="c"
        :depth="depth + 1"
        :visible="visible"
        :expanded="expanded"
        @toggle="emit('toggle', $event)"
        @open="emit('open', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.node-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: var(--fg);
}
.node-row:hover {
  background: var(--accent-soft);
}
.node-row.file {
  color: var(--fg);
}
.icon {
  width: 14px;
  text-align: center;
}
.label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
