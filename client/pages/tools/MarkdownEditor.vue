<template>
  <div class="flex flex-col h-full">
    <ToolToolbar class="overflow-x-auto flex-wrap">
      <div class="flex items-center gap-1 shrink-0">
        <TooltipButton
          v-for="btn in toolbarButtons"
          :key="btn.label"
          :icon="btn.icon"
          :label="btn.label"
          placement="bottom"
          size="tiny"
          :disabled="btn.disabled"
          @click="btn.action"
        />
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
    </ToolToolbar>

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

    <MarkdownLinkModal ref="linkModalRef" @insert="insertAtCursor" />
    <MarkdownTableModal ref="tableModalRef" @insert="insertAtCursor" />

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
import DOMPurify from 'dompurify'
import { marked } from 'marked'

import MarkdownLinkModal from '@/components/tools/MarkdownEditor/MarkdownLinkModal.vue'
import MarkdownTableModal from '@/components/tools/MarkdownEditor/MarkdownTableModal.vue'
import TooltipButton from '@/components/tools/TooltipButton.vue'
import ToolToolbar from '@/components/tools/ToolToolbar.vue'
import { useMarkdownExport } from '@/composables/tools/useMarkdownExport'
import { getMarkdownEditorContent, setMarkdownEditorContent } from '@/utils/localStorage'

const message = useMessage()

const MAX_UNDO_HISTORY = 100

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
const editorRef = ref<HTMLTextAreaElement>()
const previewRef = ref<HTMLDivElement>()
const fileInputRef = ref<HTMLInputElement>()
const linkModalRef = ref<InstanceType<typeof MarkdownLinkModal>>()
const tableModalRef = ref<InstanceType<typeof MarkdownTableModal>>()
const isSyncingScroll = ref(false)
const undoStack = ref<string[]>([content.value])
const redoStack = ref<string[]>([])

const wordCount = computed(() => {
  const text = content.value.trim()
  return text ? text.split(/\s+/).length : 0
})

const renderedHtml = computed(() => {
  try {
    return DOMPurify.sanitize(marked.parse(content.value, { async: false }))
  } catch {
    return ''
  }
})

const { downloadMarkdown, exportHtml, exportPdf } = useMarkdownExport(
  content,
  fileName,
  renderedHtml,
)

const resetHistory = (initial: string) => {
  undoStack.value = [initial]
  redoStack.value = []
}

const autoSave = () => {
  try {
    setMarkdownEditorContent(content.value)
  } catch {
    message.error('Failed to save to localStorage')
  }
}

const handleInput = () => {
  redoStack.value = []
  undoStack.value.push(content.value)

  if (undoStack.value.length > MAX_UNDO_HISTORY) {
    undoStack.value.shift()
  }

  autoSave()
}

const handleUndo = () => {
  const current = undoStack.value.length > 1 ? undoStack.value.pop() : undefined
  if (current === undefined) {
    return
  }

  redoStack.value.push(current)
  content.value = undoStack.value[undoStack.value.length - 1]
}

const handleRedo = () => {
  const next = redoStack.value.pop()
  if (next === undefined) {
    return
  }

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
  linkModalRef.value?.open(mode, el ? el.value.slice(el.selectionStart, el.selectionEnd) : '')
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

const handleNewFile = () => {
  content.value = ''
  fileName.value = 'untitled.md'
  resetHistory('')
}

const handleOpenFile = () => fileInputRef.value?.click()

const handleFileSelect = () => {
  const file = fileInputRef.value?.files?.[0]
  if (!file) {
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      return
    }
    content.value = reader.result
    fileName.value = file.name
    resetHistory(content.value)
  }
  reader.readAsText(file)
}

const toolbarButtons = computed(() => [
  { label: 'New file', icon: FilePlus, action: handleNewFile },
  { label: 'Open file', icon: Folder, action: handleOpenFile },
  {
    label: 'Undo (Ctrl+Z)',
    icon: CornerUpLeft,
    action: handleUndo,
    disabled: undoStack.value.length <= 1,
  },
  {
    label: 'Redo (Ctrl+Y)',
    icon: CornerUpRight,
    action: handleRedo,
    disabled: redoStack.value.length === 0,
  },
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
  { label: 'Insert table', icon: Table, action: () => tableModalRef.value?.open() },
  { label: 'Download .md', icon: Download, action: downloadMarkdown },
  { label: 'Export HTML', icon: FileCode, action: exportHtml },
  { label: 'Export PDF', icon: Printer, action: exportPdf },
])

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
