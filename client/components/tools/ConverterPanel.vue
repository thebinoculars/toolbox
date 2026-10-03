<template>
  <div class="flex flex-col h-full">
    <ToolToolbar label="Mode">
      <n-radio-group v-model:value="mode" size="small">
        <n-radio-button value="encode">Encode</n-radio-button>
        <n-radio-button value="decode">Decode</n-radio-button>
      </n-radio-group>
    </ToolToolbar>

    <div class="flex flex-1 overflow-hidden">
      <div class="flex flex-col flex-1 border-r border-(--border-color)">
        <ToolPanelHeader>
          <span class="text-xs font-medium flex-1 text-(--icon-color)">
            {{ mode === 'encode' ? 'INPUT — Plain Text' : `INPUT — ${encodedLabel}` }}
          </span>
          <n-button size="tiny" @click="handlePaste">
            <template #icon
              ><n-icon><Clipboard /></n-icon
            ></template>
            Paste
          </n-button>
          <n-button size="tiny" @click="handleClear">
            <template #icon
              ><n-icon><Trash /></n-icon
            ></template>
            Clear
          </n-button>
        </ToolPanelHeader>
        <textarea
          v-model="input"
          :placeholder="mode === 'encode' ? 'Enter or paste text to encode...' : decodePlaceholder"
          class="flex-1 resize-none p-4 font-mono text-sm outline-none w-full bg-(--bg-primary) text-[#e5e5e5]"
          spellcheck="false"
          @input="handleConvert"
        />
        <div
          class="px-3 py-1 border-t text-xs bg-[#2a2a2e] border-(--border-color) text-(--text-muted)"
        >
          {{ input.length }} characters
        </div>
      </div>

      <div class="flex flex-col flex-1">
        <ToolPanelHeader>
          <span class="text-xs font-medium flex-1 text-(--icon-color)">
            {{ mode === 'encode' ? `OUTPUT — ${encodedLabel}` : 'OUTPUT — Plain Text' }}
          </span>
          <n-button size="tiny" type="primary" :disabled="!output" @click="copy(output)">
            <template #icon
              ><n-icon><Copy /></n-icon
            ></template>
            {{ copied ? 'Copied!' : 'Copy' }}
          </n-button>
          <n-button size="tiny" :disabled="!output" @click="handleDownload">
            <template #icon
              ><n-icon><Download /></n-icon
            ></template>
            Download
          </n-button>
        </ToolPanelHeader>
        <textarea
          v-model="output"
          readonly
          placeholder="Output will appear here..."
          class="flex-1 resize-none p-4 font-mono text-sm outline-none w-full cursor-default bg-[#1c1c20] text-[#e5e5e5]"
          spellcheck="false"
        />
        <div
          class="px-3 py-1 border-t text-xs bg-[#2a2a2e] border-(--border-color) text-(--text-muted)"
        >
          {{ output.length }} characters
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clipboard, Copy, Download, Trash } from '@vicons/tabler'

import ToolPanelHeader from '@/components/tools/ToolPanelHeader.vue'
import ToolToolbar from '@/components/tools/ToolToolbar.vue'
import { useCopyFeedback } from '@/composables/tools/useCopyFeedback'
import { pasteFromClipboard } from '@/utils/clipboard'
import { downloadBlob } from '@/utils/download'

const props = defineProps<{
  encodedLabel: string
  decodePlaceholder: string
  downloadPrefix: string
  encode: (text: string) => string
  decode: (text: string) => string
}>()

const message = useMessage()

type ConverterMode = 'encode' | 'decode'

const mode = ref<ConverterMode>('encode')
const input = ref('')
const output = ref('')
const { copied, copy } = useCopyFeedback()

watch(mode, () => {
  ;[input.value, output.value] = [output.value, input.value]
  handleConvert()
})

const handleConvert = () => {
  if (!input.value) {
    output.value = ''
    return
  }
  try {
    output.value = mode.value === 'encode' ? props.encode(input.value) : props.decode(input.value)
  } catch {
    output.value = ''
  }
}

const handleClear = () => {
  input.value = ''
  output.value = ''
}

const handlePaste = async () => {
  try {
    input.value = await pasteFromClipboard()
    handleConvert()
  } catch {
    message.error('Failed to read clipboard')
  }
}

const handleDownload = () => downloadBlob(output.value, `${props.downloadPrefix}-${mode.value}.txt`)
</script>
