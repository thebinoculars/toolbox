<template>
  <div class="flex flex-col h-full bg-transparent">
    <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
      <div class="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-(--border-color)">
        <div
          class="flex items-center gap-2 px-3 py-1.5 border-b bg-[#2a2a2e] border-(--border-color)"
        >
          <n-select
            v-model:value="sourceLang"
            :options="sourceOptions"
            size="small"
            class="w-56"
            filterable
          />
          <div class="flex-1"></div>
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

        <n-input
          v-model:value="sourceText"
          type="textarea"
          placeholder="Enter text to translate..."
          class="h-full bg-transparent"
          :bordered="false"
          @input="handleInput"
        />
      </div>

      <div class="flex-1 flex flex-col bg-black/5">
        <div
          class="flex items-center gap-2 px-3 py-1.5 border-b bg-[#2a2a2e] border-(--border-color)"
        >
          <n-select
            v-model:value="targetLang"
            :options="targetOptions"
            size="small"
            class="w-56"
            filterable
          />
          <div class="flex-1"></div>
          <n-button
            type="primary"
            size="tiny"
            :disabled="!translatedText || loading"
            @click="handleCopy"
          >
            <template #icon
              ><n-icon><Copy /></n-icon
            ></template>
            {{ copied ? 'Copied!' : 'Copy' }}
          </n-button>
        </div>

        <n-input
          v-model:value="translatedText"
          type="textarea"
          readonly
          placeholder="Translation will appear here..."
          :loading="loading"
          class="h-full bg-transparent"
          :bordered="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clipboard, Copy, Trash } from '@vicons/tabler'
import { debounce } from 'lodash-es'

import proxyRepository from '@/repositories/proxyRepository'
import { copyToClipboard, pasteFromClipboard } from '@/utils/clipboard'

const message = useMessage()

// Constants
const LANGUAGES = [
  { label: 'Auto Detect', value: 'auto' },
  { label: 'English', value: 'en' },
  { label: 'Vietnamese', value: 'vi' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese (Simplified)', value: 'zh-CN' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Spanish', value: 'es' },
  { label: 'Russian', value: 'ru' },
  { label: 'Italian', value: 'it' },
  { label: 'Thai', value: 'th' },
]

// State
const sourceText = ref('')
const translatedText = ref('')
const loading = ref(false)
const sourceLang = ref('auto')
const targetLang = ref('vi')
const detectedLang = ref('')
const copied = ref(false)

// Computed
const sourceOptions = computed(() => {
  return LANGUAGES.map((l) => {
    if (l.value === 'auto' && detectedLang.value) {
      return { ...l, label: `Auto Detect (${getLangName(detectedLang.value)})` }
    }
    return l
  })
})

const targetOptions = LANGUAGES.filter((l) => l.value !== 'auto')

// Watch
watch([sourceLang, targetLang], () => {
  if (sourceText.value) {
    handleTranslate()
  }
})

// Functions
const getLangName = (code: string) => {
  return LANGUAGES.find((l) => l.value === code)?.label || code
}

const handleTranslate = async () => {
  if (!sourceText.value.trim()) {
    translatedText.value = ''
    detectedLang.value = ''
    return
  }

  loading.value = true
  try {
    const { data } = await proxyRepository.translate(
      sourceText.value,
      targetLang.value,
      sourceLang.value === 'auto' ? undefined : sourceLang.value,
    )

    if (data?.translations?.length > 0) {
      translatedText.value = data.translations[0].translatedText
      if (data.translations[0].detectedSourceLanguage) {
        detectedLang.value = data.translations[0].detectedSourceLanguage
      }
    }
  } catch {
    message.error('Translation failed.')
  } finally {
    loading.value = false
  }
}

const debouncedTranslate = debounce(handleTranslate, 800)

const handleInput = () => {
  debouncedTranslate()
}

const handleClear = () => {
  sourceText.value = ''
  translatedText.value = ''
  detectedLang.value = ''
}

const handlePaste = async () => {
  try {
    sourceText.value = await pasteFromClipboard()
    handleTranslate()
  } catch {
    message.error('Failed to read clipboard')
  }
}

const handleCopy = async () => {
  try {
    await copyToClipboard(translatedText.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    message.error('Failed to copy to clipboard')
  }
}
</script>

<style scoped lang="scss">
:deep(.n-input-wrapper) {
  height: 100%;
  padding: 20px;
}
:deep(textarea) {
  height: 100% !important;
  font-size: 16px;
  line-height: 1.6;
  background: transparent !important;
}
</style>
