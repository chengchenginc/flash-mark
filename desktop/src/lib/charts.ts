import mermaid from 'mermaid'
import * as echarts from 'echarts'

mermaid.initialize({ startOnLoad: false, theme: 'default' })

let mermaidSeq = 0

/**
 * 后置扫描渲染图表：
 * - ```mermaid 代码块 → SVG 替换
 * - ```echarts 代码块 → ECharts 实例替换
 * 失败则保留原始文本并标记 chart-error，不影响其余渲染。
 */
export async function renderCharts(container: HTMLElement): Promise<void> {
  const mermaidEls = Array.from(
    container.querySelectorAll<HTMLElement>('pre code.language-mermaid'),
  )
  for (const el of mermaidEls) {
    const pre = el.parentElement
    if (!pre) continue
    const code = el.textContent || ''
    try {
      const id = 'mermaid-' + mermaidSeq++
      const { svg } = await mermaid.render(id, code)
      const div = document.createElement('div')
      div.className = 'chart-box chart-mermaid'
      div.innerHTML = svg
      pre.replaceWith(div)
    } catch {
      pre.classList.add('chart-error')
    }
  }

  const echartsEls = Array.from(
    container.querySelectorAll<HTMLElement>('pre code.language-echarts'),
  )
  for (const el of echartsEls) {
    const pre = el.parentElement
    if (!pre) continue
    const code = el.textContent || ''
    try {
      const option = JSON.parse(code)
      const div = document.createElement('div')
      div.className = 'chart-box chart-echarts'
      div.style.width = '100%'
      div.style.height = '360px'
      pre.replaceWith(div)
      const chart = echarts.init(div)
      chart.setOption(option)
    } catch {
      pre.classList.add('chart-error')
    }
  }
}
