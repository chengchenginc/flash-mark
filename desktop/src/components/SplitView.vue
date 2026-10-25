<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useSplitter } from '@/composables/useSplitter'
import EditorPane from './EditorPane.vue'
import PreviewPane from './PreviewPane.vue'

const app = useAppStore()
const { viewMode, singleFocus, splitRatio } = storeToRefs(app)
const container = ref<HTMLElement | null>(null)

const ratio = computed<number>({
  get: () => splitRatio.value,
  set: (v) => {
    app.splitRatio = v
  },
})

const { dragging, onMousedown } = useSplitter(
  container,
  ratio,
  (r) => void app.setSplitRatio(r),
)
</script>

<template>
  <div class="split-view" ref="container">
    <template v-if="viewMode === 'single'">
      <div class="pane" style="flex: 1">
        <EditorPane v-if="singleFocus === 'editor'" />
        <PreviewPane v-else />
      </div>
    </template>
    <template v-else>
      <div
        class="pane"
        :style="{ flex: `0 0 ${ratio * 100}%` }"
      >
        <EditorPane />
      </div>
      <div class="divider" :class="{ drag: dragging }" @mousedown="onMousedown"></div>
      <div class="pane" style="flex: 1">
        <PreviewPane />
      </div>
    </template>
  </div>
</template>

<style scoped>
.split-view {
  display: flex;
  height: 100%;
  width: 100%;
}
.pane {
  height: 100%;
  overflow: hidden;
  min-width: 0;
}
.divider {
  width: 6px;
  flex: 0 0 6px;
  cursor: col-resize;
  background: var(--border);
  transition: background 0.15s;
}
.divider:hover,
.divider.drag {
  background: var(--accent);
}
</style>
