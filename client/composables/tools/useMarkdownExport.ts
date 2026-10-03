import type { Ref } from 'vue'

import { downloadBlob } from '@/utils/download'
import { escapeHtml } from '@/utils/format'

const PRINT_STYLES = `
    body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:2rem;line-height:1.6}
    pre{background:#f5f5f5;padding:1rem;border-radius:4px;overflow-x:auto}
    code{background:#f5f5f5;padding:.2rem .4rem;border-radius:3px}
    blockquote{border-left:4px solid #6366f1;padding-left:1rem;color:#666}
    table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:.5rem}
  `

const htmlDocument = (title: string, body: string, styles?: string) =>
  `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>${
    styles === undefined ? '' : `<style>${styles}</style>`
  }</head><body>${body}</body></html>`

export const useMarkdownExport = (
  content: Ref<string>,
  fileName: Ref<string>,
  renderedHtml: Ref<string>,
) => {
  const message = useMessage()

  const downloadMarkdown = () => {
    downloadBlob(content.value, fileName.value)
  }

  const exportHtml = () => {
    downloadBlob(
      htmlDocument(fileName.value, renderedHtml.value),
      fileName.value.replace('.md', '.html'),
    )
  }

  const exportPdf = () => {
    const win = window.open('', '_blank')
    if (!win) {
      message.error('Failed to open print window')
      return
    }
    win.document.write(htmlDocument(fileName.value, renderedHtml.value, PRINT_STYLES))
    win.document.close()
    win.onload = () => {
      win.print()
    }
  }

  return { downloadMarkdown, exportHtml, exportPdf }
}
