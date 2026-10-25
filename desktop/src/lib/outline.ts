import { slugify } from './slug'

export interface OutlineItem {
  level: number
  text: string
  slug: string
  children: OutlineItem[]
}

/** 解析 Markdown 源中的标题（跳过代码围栏），生成层级大纲 */
export function parseOutline(md: string): OutlineItem[] {
  const lines = md.split('\n')
  const root: OutlineItem[] = []
  const stack: OutlineItem[] = []
  let inFence = false
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!m) continue
    const level = m[1].length
    const text = m[2].trim()
    const item: OutlineItem = { level, text, slug: slugify(text), children: [] }
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop()
    if (stack.length === 0) root.push(item)
    else stack[stack.length - 1].children.push(item)
    stack.push(item)
  }
  return root
}
