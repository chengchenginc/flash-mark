<script setup lang="ts">
import { computed } from 'vue'
import { useTabsStore } from '@/stores/tabs'
import { parseOutline } from '@/lib/outline'

const tabs = useTabsStore()
const tree = computed(() => parseOutline(tabs.active?.content ?? ''))

function scrollTo(slug: string) {
  const el = document.getElementById(slug)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="outline">
    <div v-if="!tree.length" class="empty">暂无标题</div>
    <ul v-else class="outline-list">
      <li
        v-for="(item, i) in tree"
        :key="i"
        :style="{ paddingLeft: (item.level - 1) * 12 + 'px' }"
      >
        <a @click="scrollTo(item.slug)">{{ item.text }}</a>
        <ul v-if="item.children.length">
          <li
            v-for="(c, j) in item.children"
            :key="j"
            :style="{ paddingLeft: (c.level - 1) * 12 + 'px' }"
          >
            <a @click="scrollTo(c.slug)">{{ c.text }}</a>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.outline {
  padding: 8px 4px;
  font-size: 13px;
}
.outline-list,
.outline-list ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.outline-list li {
  margin: 2px 0;
}
.outline-list a {
  display: block;
  padding: 3px 8px;
  border-radius: 4px;
  color: var(--fg);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.outline-list a:hover {
  background: var(--accent-soft);
}
.empty {
  color: var(--muted);
  padding: 8px;
  font-size: 13px;
}
</style>
