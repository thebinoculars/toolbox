<template>
  <div class="flex flex-col h-full">
    <!-- Mode selector toolbar -->
    <div
      class="border-b px-3 py-2 flex items-center gap-2 shrink-0 bg-[#2a2a2e] border-(--border-color)"
    >
      <span class="text-xs font-medium text-(--icon-color)">Mode</span>
      <n-radio-group v-model:value="mode" size="small">
        <n-radio-button value="encode">Encode</n-radio-button>
        <n-radio-button value="decode">Decode</n-radio-button>
      </n-radio-group>
    </div>

    <!-- Two-panel editor -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Input panel -->
      <div class="flex flex-col flex-1 border-r border-(--border-color)">
        <div
          class="flex items-center gap-2 px-3 py-1.5 border-b bg-[#2a2a2e] border-(--border-color)"
        >
          <span class="text-xs font-medium flex-1 text-(--icon-color)">
            {{ mode === 'encode' ? 'INPUT — Plain Text' : 'INPUT — Encoded String' }}
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
        </div>
        <textarea
          v-model="input"
          :placeholder="
            mode === 'encode'
              ? 'Enter or paste text to encode...'
              : 'Enter or paste encoded string to decode...'
          "
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

      <!-- Output panel -->
      <div class="flex flex-col flex-1">
        <div
          class="flex items-center gap-2 px-3 py-1.5 border-b bg-[#2a2a2e] border-(--border-color)"
        >
          <span class="text-xs font-medium flex-1 text-(--icon-color)">
            {{ mode === 'encode' ? 'OUTPUT — Encoded String' : 'OUTPUT — Plain Text' }}
          </span>
          <n-button size="tiny" type="primary" :disabled="!output" @click="handleCopy">
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
        </div>
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

import { copyToClipboard, pasteFromClipboard } from '@/utils/clipboard'
import { downloadBlob } from '@/utils/download'

const message = useMessage()

type Utf8Mode = 'encode' | 'decode'

// State
const mode = ref<Utf8Mode>('encode')
const input = ref('')
const output = ref('')
const copied = ref(false)

// Watch
watch(mode, () => {
  ;[input.value, output.value] = [output.value, input.value]
  handleConvert()
})

// Functions
const handleConvert = () => {
  if (!input.value) {
    output.value = ''
    return
  }
  try {
    if (mode.value === 'encode') {
      const encoder = new TextEncoder()
      const bytes = encoder.encode(input.value)
      const hexArray = Array.from(bytes).map((byte) => `\\x${byte.toString(16).padStart(2, '0')}`)
      output.value = hexArray.join('')
    } else {
      const hexString = input.value.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      )
      const bytes = hexString.split('').map((c) => c.charCodeAt(0))
      const decoder = new TextDecoder()
      output.value = decoder.decode(new Uint8Array(bytes))
    }
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

const handleCopy = async () => {
  try {
    await copyToClipboard(output.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    message.error('Failed to copy to clipboard')
  }
}

const handleDownload = () => downloadBlob(output.value, `utf8-${mode.value}.txt`)
</script>
