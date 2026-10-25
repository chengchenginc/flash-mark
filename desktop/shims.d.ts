declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module '*.css?inline' {
  const content: string
  export default content
}

declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[]
    filename?: string
    image?: { type?: string; quality?: number }
    html2canvas?: Record<string, unknown>
    jsPDF?: Record<string, unknown>
    pagebreak?: Record<string, unknown>
  }
  interface Html2PdfWorker {
    set(opt: Html2PdfOptions): Html2PdfWorker
    from(el: HTMLElement | string): Html2PdfWorker
    outputPdf(type: 'datauristring'): Promise<string>
    save(): Promise<void>
  }
  function html2pdf(): Html2PdfWorker
  function html2pdf(element: HTMLElement | string, options?: Html2PdfOptions): Html2PdfWorker
  export default html2pdf
}
