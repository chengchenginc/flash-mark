import { ref, type Ref } from 'vue'

/**
 * 分割线拖拽逻辑：监听容器宽度计算左栏比例，限制在 [0.15, 0.85]。
 * containerRef：双屏容器元素；ratio：当前比例（响应式）；onCommit：拖拽结束提交（持久化）。
 */
export function useSplitter(
  containerRef: Ref<HTMLElement | null>,
  ratio: Ref<number>,
  onCommit: (r: number) => void,
) {
  const dragging = ref(false)

  function onMousedown(e: MouseEvent) {
    e.preventDefault()
    dragging.value = true
    const onMove = (ev: MouseEvent) => {
      const el = containerRef.value
      if (!el) return
      const rect = el.getBoundingClientRect()
      let r = (ev.clientX - rect.left) / rect.width
      r = Math.min(0.85, Math.max(0.15, r))
      ratio.value = r
    }
    const onUp = () => {
      dragging.value = false
      onCommit(ratio.value)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return { dragging, onMousedown }
}
