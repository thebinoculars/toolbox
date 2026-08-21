<template>
  <div class="flex flex-col h-full">
    <!-- Input bar -->
    <div
      class="border-b px-3 py-2 flex items-center gap-2 shrink-0 bg-[#2a2a2e] border-(--border-color)"
    >
      <span class="text-xs font-medium text-(--icon-color)">URL</span>
      <n-input
        v-model:value="input"
        placeholder="Enter a URL to parse..."
        size="small"
        clearable
        class="flex-1"
        @update:value="handleParse"
      />
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

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-5">
      <template v-if="parsed">
        <!-- Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          <div v-for="field in overviewFields" :key="field.label">
            <div class="text-xs font-semibold uppercase tracking-wider mb-1 text-(--text-muted)">
              {{ field.label }}
            </div>
            <div class="flex items-center gap-2">
              <code
                class="flex-1 text-sm px-3 py-2 rounded font-mono break-all bg-[#2a2a2e] text-[#e5e5e5]"
              >
                {{ field.value || '—' }}
              </code>
              <n-button v-if="field.value" size="tiny" @click="handleCopy(field.value)">
                <n-icon><Copy /></n-icon>
              </n-button>
            </div>
          </div>
        </div>

        <!-- Query params -->
        <div v-if="parsed.searchParams.size > 0">
          <div class="text-xs font-semibold uppercase tracking-wider mb-2 text-(--text-muted)">
            Query Parameters ({{ parsed.searchParams.size }})
          </div>
          <n-data-table
            :columns="columns"
            :data="queryRows"
            size="small"
            :bordered="false"
            class="bg-(--bg-secondary)"
          />
        </div>
        <n-empty v-else description="No query parameters" size="small" class="mt-4" />
      </template>

      <n-empty v-else description="Enter a URL above to parse it" size="small" class="mt-16" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clipboard, Copy, Trash } from '@vicons/tabler'
import { NText } from 'naive-ui'

import { copyToClipboard, pasteFromClipboard } from '@/utils/clipboard'

const message = useMessage()

type QueryRow = {
  key: string
  value: string
}

// State
const input = ref('')
const parsed = ref<URL | null>(null)

// Computed
const overviewFields = computed(() => {
  if (!parsed.value) {
    return []
  }

  const u = parsed.value
  return [
    { label: 'Protocol', value: u.protocol.replace(':', '') },
    { label: 'Host', value: u.host },
    { label: 'Hostname', value: u.hostname },
    { label: 'Port', value: u.port },
    { label: 'Pathname', value: u.pathname },
    { label: 'Hash', value: u.hash },
    { label: 'Origin', value: u.origin },
    { label: 'Full URL', value: u.href },
  ]
})

const queryRows = computed(() => {
  if (!parsed.value) {
    return []
  }

  return [...parsed.value.searchParams.entries()].map(([key, value]) => ({ key, value }))
})

// Constants
const columns = [
  {
    title: 'Key',
    key: 'key',
    width: 200,
    render: (row: QueryRow) => h(NText, { code: true }, { default: () => row.key }),
  },
  {
    title: 'Value',
    key: 'value',
    render: (row: QueryRow) => h(NText, { code: true }, { default: () => row.value }),
  },
]

// Functions
const handleParse = (val: string) => {
  parsed.value = null

  if (!val.trim()) {
    return
  }

  try {
    parsed.value = new URL(val.trim())
  } catch {
    message.error('Invalid URL. Make sure to include the protocol (e.g. https://)')
  }
}

const handleCopy = async (text: string) => {
  try {
    await copyToClipboard(text)
  } catch {
    message.error('Failed to copy to clipboard')
  }
}

const handlePaste = async () => {
  try {
    input.value = await pasteFromClipboard()
    handleParse(input.value)
  } catch {
    message.error('Failed to read clipboard')
  }
}

const handleClear = () => {
  input.value = ''
  parsed.value = null
}
</script>
