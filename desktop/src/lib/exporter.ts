import { toPng } from 'html-to-image'
import html2pdf from 'html2pdf.js'
import { invoke } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'
import { useAppStore } from '@/stores/app'
import katexCss from 'katex/dist/katex.min.css?inline'
import hljsCss from 'highlight.js/styles/github.css?inline'
import appCss from '@/styles/main.css?inline'

async function pickPath(defaultName: string, ext: string): Promise<string | null> {
  return (await save({
    defaultPath: defaultName + ext,
    filters: [{ name: ext.replace('.', '').toUpperCase(), extensions: [ext.replace('.', '')] }],
  })) as string | null
}

async function writeFile(path: string, base64: string): Promise<void> {
  await invoke('save_export', { path, dataBase64: base64 })
}

/** 写文件成功后的统一提示（文件名截尾取最后一段，避免长路径撑爆 toast） */
function notifyExported(path: string): void {
  const fileName = path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || path
  useAppStore().showToast(`导出完成：${fileName}`)
}

/** 组装自包含 HTML（内联样式，可脱离本应用打开） */
export function buildStandaloneHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>FlashMark Export</title>
<style>
${appCss}
${katexCss}
${hljsCss}
body { background: #f5f5f5; padding: 24px; }
.markdown-body {
  background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,.08);
  padding: 32px 40px; max-width: 900px; margin: 0 auto;
}
</style>
</head>
<body>
<article class="markdown-body">${bodyHtml}</article>
</body>
</html>`
}

/** 导出 PNG 图文卡片（html-to-image 截图） */
export async function exportPng(el: HTMLElement, name: string): Promise<void> {
  const path = await pickPath(name, '.png')
  if (!path) return
  const dataUrl = await toPng(el, {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    cacheBust: true,
  })
  await writeFile(path, dataUrl.split(',')[1])
  notifyExported(path)
}

/** 导出 HTML（DOM 序列化 + 内联样式） */
export async function exportHtml(html: string, name: string): Promise<void> {
  const path = await pickPath(name, '.html')
  if (!path) return
  const dataUrl = 'data:text/html;base64,' + btoa(unescape(encodeURIComponent(html)))
  await writeFile(path, dataUrl.split(',')[1])
  notifyExported(path)
}

/** 导出 PDF：HTML 转 PDF（不使用 window.print） */
export async function exportPdf(el: HTMLElement, name: string): Promise<void> {
  const path = await pickPath(name, '.pdf')
  if (!path) return
  const worker = html2pdf()
    .set({
      margin: 10,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(el)
  const datauri: string = await worker.outputPdf('datauristring')
  await writeFile(path, datauri.split(',')[1])
  notifyExported(path)
}
