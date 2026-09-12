<template>
  <div class="flex flex-col h-full">
    <!-- Toolbar -->
    <div
      class="border-b px-3 py-2 flex items-center gap-2 shrink-0 overflow-x-auto flex-wrap bg-[#2a2a2e] border-(--border-color)"
    >
      <div class="flex items-center gap-1 shrink-0">
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button size="tiny" @click="handleNewFile">
              <template #icon
                ><n-icon><FilePlus /></n-icon
              ></template>
            </n-button>
          </template>
          New file
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button size="tiny" @click="handleOpenFile">
              <template #icon
                ><n-icon><Folder /></n-icon
              ></template>
            </n-button>
          </template>
          Open file
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button size="tiny" :disabled="undoStack.length <= 1" @click="handleUndo">
              <template #icon
                ><n-icon><CornerUpLeft /></n-icon
              ></template>
            </n-button>
          </template>
          Undo (Ctrl+Z)
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button size="tiny" :disabled="redoStack.length === 0" @click="handleRedo">
              <template #icon
                ><n-icon><CornerUpRight /></n-icon
              ></template>
            </n-button>
          </template>
          Redo (Ctrl+Y)
        </n-tooltip>
        <n-tooltip v-for="btn in toolbarButtons" :key="btn.label" placement="bottom">
          <template #trigger>
            <n-button size="tiny" @click="btn.action">
              <template #icon
                ><n-icon><component :is="btn.icon" /></n-icon
              ></template>
            </n-button>
          </template>
          {{ btn.label }}
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button size="tiny" @click="handleDownloadMd">
              <template #icon
                ><n-icon><Download /></n-icon
              ></template>
            </n-button>
          </template>
          Download .md
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button size="tiny" @click="handleExportHtml">
              <template #icon
                ><n-icon><FileCode /></n-icon
              ></template>
            </n-button>
          </template>
          Export HTML
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button size="tiny" @click="handleExportPdf">
              <template #icon
                ><n-icon><Printer /></n-icon
              ></template>
            </n-button>
          </template>
          Export PDF
        </n-tooltip>
      </div>

      <div class="flex-1" />

      <div class="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        <span class="text-xs shrink-0 text-(--text-muted)"
          >{{ wordCount }} words · {{ content.length }} chars</span
        >

        <input
          v-model="fileName"
          class="text-xs px-2 py-1 rounded border shrink-0 w-32 text-center outline-none bg-(--bg-primary) border-(--border-color) text-(--text-secondary)"
        />

        <n-radio-group v-model:value="viewMode" size="small" class="shrink-0">
          <n-radio-button value="split">Split</n-radio-button>
          <n-radio-button value="editor">Editor</n-radio-button>
          <n-radio-button value="preview">Preview</n-radio-button>
        </n-radio-group>
      </div>
    </div>

    <!-- Editor + Preview -->
    <div class="flex flex-1 overflow-hidden">
      <div
        v-if="viewMode !== 'preview'"
        class="flex flex-col flex-1 overflow-hidden"
        :class="viewMode === 'split' ? 'border-r border-(--border-color)' : ''"
      >
        <textarea
          ref="editorRef"
          v-model="content"
          spellcheck="false"
          placeholder="# Start writing markdown here..."
          class="flex-1 resize-none p-4 font-mono text-sm outline-none w-full leading-relaxed bg-(--bg-primary) text-[#e5e5e5]"
          @input="handleInput"
          @keydown="handleKeydown"
          @scroll="handleEditorScroll"
        />
      </div>

      <div
        v-if="viewMode !== 'editor'"
        ref="previewRef"
        class="flex-1 overflow-y-auto p-6 prose-content bg-[#1c1c20] text-[#e5e5e5]"
        v-html="renderedHtml"
      />
    </div>

    <!-- Link/Image modal -->
    <n-modal
      v-model:show="showLinkModal"
      preset="card"
      :title="linkModalMode === 'link' ? 'Insert Link' : 'Insert Image'"
      class="max-w-100"
    >
      <div class="space-y-3">
        <n-form-item :label="linkModalMode === 'link' ? 'Display Text' : 'Alt Text'">
          <n-input
            v-model:value="linkText"
            :placeholder="linkModalMode === 'link' ? 'Link text' : 'Image alt text'"
          />
        </n-form-item>
        <n-form-item label="URL">
          <n-input
            v-model:value="linkUrl"
            placeholder="https://..."
            @keydown.enter="handleConfirmLink"
          />
        </n-form-item>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showLinkModal = false">Cancel</n-button>
          <n-button type="primary" @click="handleConfirmLink">Insert</n-button>
        </div>
      </template>
    </n-modal>

    <input
      ref="fileInputRef"
      type="file"
      accept=".md,.txt"
      class="hidden"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Bold,
  Code,
  CornerUpLeft,
  CornerUpRight,
  Download,
  FileCode,
  FilePlus,
  Folder,
  H1,
  H2,
  H3,
  Italic,
  Link,
  List,
  ListNumbers,
  Photo,
  Printer,
  Quote,
  Strikethrough,
  Table,
} from '@vicons/tabler'
import { marked } from 'marked'

import { downloadBlob } from '@/utils/download'
import { getMarkdownEditorContent, setMarkdownEditorContent } from '@/utils/localStorage'

const message = useMessage()

// Constants
const toolbarButtons = [
  { label: 'Bold', icon: Bold, action: () => insertFormat('**', '**') },
  { label: 'Italic', icon: Italic, action: () => insertFormat('*', '*') },
  { label: 'Strikethrough', icon: Strikethrough, action: () => insertFormat('~~', '~~') },
  { label: 'H1', icon: H1, action: () => insertLine('# ') },
  { label: 'H2', icon: H2, action: () => insertLine('## ') },
  { label: 'H3', icon: H3, action: () => insertLine('### ') },
  { label: 'Bullet list', icon: List, action: () => insertLine('- ') },
  { label: 'Numbered list', icon: ListNumbers, action: () => insertLine('1. ') },
  { label: 'Quote', icon: Quote, action: () => insertLine('> ') },
  { label: 'Code', icon: Code, action: () => insertFormat('`', '`') },
  { label: 'Insert link', icon: Link, action: () => openLinkModal('link') },
  { label: 'Insert image', icon: Photo, action: () => openLinkModal('image') },
  {
    label: 'Insert table',
    icon: Table,
    action: () => insertAtCursor('\n| Col 1 | Col 2 |\n|-------|-------|\n| Cell  | Cell  |\n'),
  },
]

// State
const content = ref(`# Welcome to Markdown Editor

## Features
- **Live preview** — Real-time rendering
- **Toolbar** — Quick format buttons
- **Export** — Download as .md, PDF or HTML

### Code Example
\`\`\`javascript
function hello() {
  console.log("Hello World!")
}
\`\`\`

**Happy writing!** 🚀`)
const fileName = ref('untitled.md')
const viewMode = ref<'split' | 'editor' | 'preview'>('split')
const showLinkModal = ref(false)
const linkModalMode = ref<'link' | 'image'>('link')
const linkText = ref('')
const linkUrl = ref('')
const editorRef = ref<HTMLTextAreaElement>()
const previewRef = ref<HTMLDivElement>()
const fileInputRef = ref<HTMLInputElement>()
const isSyncingScroll = ref(false)
const undoStack = ref<string[]>([content.value])
const redoStack = ref<string[]>([])

// Computed
const wordCount = computed(() => {
  const text = content.value.trim()
  return text ? text.split(/\s+/).length : 0
})

const renderedHtml = computed(() => {
  try {
    return marked.parse(content.value) as string
  } catch {
    return ''
  }
})

// Functions
const handleInput = () => {
  redoStack.value = []
  undoStack.value.push(content.value)

  if (undoStack.value.length > 100) {
    undoStack.value.shift()
  }

  autoSave()
}

const handleUndo = () => {
  if (undoStack.value.length <= 1) {
    return
  }

  redoStack.value.push(undoStack.value.pop()!)
  content.value = undoStack.value[undoStack.value.length - 1]
}

const handleRedo = () => {
  if (!redoStack.value.length) {
    return
  }

  const next = redoStack.value.pop()!
  undoStack.value.push(next)
  content.value = next
}

const handleEditorScroll = () => {
  if (isSyncingScroll.value || !previewRef.value || !editorRef.value) {
    return
  }

  isSyncingScroll.value = true
  const pct =
    editorRef.value.scrollTop / (editorRef.value.scrollHeight - editorRef.value.clientHeight || 1)
  previewRef.value.scrollTop = pct * (previewRef.value.scrollHeight - previewRef.value.clientHeight)
  requestAnimationFrame(() => {
    isSyncingScroll.value = false
  })
}

const insertFormat = (before: string, after: string) => {
  const el = editorRef.value
  if (!el) {
    return
  }
  const { selectionStart: s, selectionEnd: e, value } = el
  const selected = value.slice(s, e)
  const beforeStart = s - before.length
  const afterEnd = e + after.length
  if (
    beforeStart >= 0 &&
    value.slice(beforeStart, s) === before &&
    value.slice(e, afterEnd) === after
  ) {
    content.value = value.slice(0, beforeStart) + selected + value.slice(afterEnd)
    setTimeout(() => el.setSelectionRange(beforeStart, beforeStart + selected.length), 0)
  } else {
    content.value = value.slice(0, s) + before + selected + after + value.slice(e)
    setTimeout(
      () => el.setSelectionRange(s + before.length, s + before.length + selected.length),
      0,
    )
  }
  el.focus()
  handleInput()
}

const insertLine = (prefix: string) => {
  const el = editorRef.value
  if (!el) {
    return
  }
  const { selectionStart: s, value } = el
  const lineStart = value.lastIndexOf('\n', s - 1) + 1
  const lineEnd = value.indexOf('\n', s)
  const end = lineEnd === -1 ? value.length : lineEnd
  const line = value.slice(lineStart, end)
  if (line.startsWith(prefix)) {
    content.value = value.slice(0, lineStart) + line.slice(prefix.length) + value.slice(end)
  } else {
    content.value = value.slice(0, lineStart) + prefix + line + value.slice(end)
  }
  el.focus()
  handleInput()
}

const insertAtCursor = (text: string) => {
  const el = editorRef.value
  if (!el) {
    return
  }
  const s = el.selectionStart
  content.value = content.value.slice(0, s) + text + content.value.slice(el.selectionEnd)
  el.focus()
  setTimeout(() => el.setSelectionRange(s + text.length, s + text.length), 0)
  handleInput()
}

const openLinkModal = (mode: 'link' | 'image') => {
  const el = editorRef.value
  linkModalMode.value = mode
  linkText.value = el ? el.value.slice(el.selectionStart, el.selectionEnd) : ''
  linkUrl.value = ''
  showLinkModal.value = true
}

const handleConfirmLink = () => {
  if (!linkUrl.value) {
    return
  }
  const text = linkText.value || (linkModalMode.value === 'link' ? 'link' : 'image')
  const md =
    linkModalMode.value === 'link' ? `[${text}](${linkUrl.value})` : `![${text}](${linkUrl.value})`
  insertAtCursor(md)
  showLinkModal.value = false
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!e.ctrlKey && !e.metaKey) {
    return
  }
  if (e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) {
      handleRedo()
    } else {
      handleUndo()
    }
  }
  if (e.key.toLowerCase() === 'y') {
    e.preventDefault()
    handleRedo()
  }
}

const autoSave = () => {
  try {
    setMarkdownEditorContent(content.value)
  } catch {
    message.error('Failed to save to localStorage')
  }
}

const handleNewFile = () => {
  content.value = ''
  fileName.value = 'untitled.md'
  undoStack.value = ['']
  redoStack.value = []
}

const handleDownloadMd = () => {
  downloadBlob(content.value, fileName.value)
}

const handleExportHtml = () => {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${fileName.value}</title></head><body>${renderedHtml.value}</body></html>`
  downloadBlob(html, fileName.value.replace('.md', '.html'))
}

const handleExportPdf = () => {
  const win = window.open('', '_blank')
  if (!win) {
    message.error('Failed to open print window')
    return
  }
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:2rem;line-height:1.6}
    pre{background:#f5f5f5;padding:1rem;border-radius:4px;overflow-x:auto}
    code{background:#f5f5f5;padding:.2rem .4rem;border-radius:3px}
    blockquote{border-left:4px solid #6366f1;padding-left:1rem;color:#666}
    table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:.5rem}
  </style></head><body>${renderedHtml.value}</body></html>`)
  win.document.close()
  win.onload = () => {
    win.print()
  }
}

const handleOpenFile = () => fileInputRef.value?.click()

const handleFileSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) {
    return
  }
  const reader = new FileReader()
  reader.onload = (ev) => {
    content.value = ev.target?.result as string
    fileName.value = file.name
    undoStack.value = [content.value]
    redoStack.value = []
  }
  reader.readAsText(file)
}

// Lifecycle
onMounted(() => {
  const saved = getMarkdownEditorContent()
  if (saved) {
    content.value = saved
    undoStack.value = [saved]
  }
})
</script>

<style scoped lang="scss">
.prose-content {
  :deep(h1) {
    font-size: 1.875rem;
    font-weight: 700;
    margin: 1.5rem 0 0.75rem;
  }
  :deep(h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 1.25rem 0 0.5rem;
  }
  :deep(h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 1rem 0 0.5rem;
  }
  :deep(p) {
    margin: 0.75rem 0;
    line-height: 1.7;
  }
  :deep(ul),
  :deep(ol) {
    padding-left: 1.5rem;
    margin: 0.75rem 0;
  }
  :deep(li) {
    margin: 0.25rem 0;
  }
  :deep(code) {
    font-family: monospace;
    font-size: 0.875rem;
    padding: 0.15rem 0.35rem;
    border-radius: 3px;
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
  }
  :deep(pre) {
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1rem 0;
    background: rgba(0, 0, 0, 0.05);
    code {
      background: none;
      color: inherit;
      padding: 0;
    }
  }
  :deep(blockquote) {
    border-left: 3px solid #6366f1;
    padding-left: 1rem;
    margin: 1rem 0;
    opacity: 0.75;
    font-style: italic;
  }
  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
  }
  :deep(th),
  :deep(td) {
    border: 1px solid #e5e5e5;
    padding: 0.5rem 0.75rem;
  }
  :deep(th) {
    font-weight: 600;
    background: rgba(0, 0, 0, 0.03);
  }
  :deep(a) {
    color: #6366f1;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
  :deep(img) {
    max-width: 100%;
    border-radius: 6px;
  }
  :deep(hr) {
    border: none;
    border-top: 1px solid #e5e5e5;
    margin: 1.5rem 0;
  }
  :deep(del) {
    opacity: 0.6;
  }
}
</style>
