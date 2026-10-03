<template>
  <div class="flex flex-col h-full bg-transparent">
    <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
      <div class="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-(--border-color)">
        <ToolPanelHeader>
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
        </ToolPanelHeader>

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
        <ToolPanelHeader>
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
            @click="copy(translatedText)"
          >
            <template #icon
              ><n-icon><Copy /></n-icon
            ></template>
            {{ copied ? 'Copied!' : 'Copy' }}
          </n-button>
        </ToolPanelHeader>

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

import ToolPanelHeader from '@/components/tools/ToolPanelHeader.vue'
import { useCopyFeedback } from '@/composables/tools/useCopyFeedback'
import { useLatestRequest } from '@/composables/tools/useLatestRequest'
import proxyRepository from '@/repositories/proxyRepository'
import { pasteFromClipboard } from '@/utils/clipboard'

const message = useMessage()

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

const sourceText = ref('')
const translatedText = ref('')
const loading = ref(false)
const sourceLang = ref('auto')
const targetLang = ref('vi')
const detectedLang = ref('')
const translateRequest = useLatestRequest()
const { copied, copy } = useCopyFeedback()

const sourceOptions = computed(() => {
  return LANGUAGES.map((l) => {
    if (l.value === 'auto' && detectedLang.value) {
      return { ...l, label: `Auto Detect (${getLangName(detectedLang.value)})` }
    }
    return l
  })
})

const targetOptions = LANGUAGES.filter((l) => l.value !== 'auto')

watch([sourceLang, targetLang], () => {
  if (sourceText.value) {
    handleTranslate()
  }
})

const getLangName = (code: string) => {
  return LANGUAGES.find((l) => l.value === code)?.label || code
}

const handleTranslate = async () => {
  const isStale = translateRequest.start()
  if (!sourceText.value.trim()) {
    translatedText.value = ''
    detectedLang.value = ''
    loading.value = false
    return
  }

  loading.value = true
  try {
    const { data } = await proxyRepository.translate(
      sourceText.value,
      targetLang.value,
      sourceLang.value === 'auto' ? undefined : sourceLang.value,
    )
    if (isStale()) {
      return
    }

    if (data?.translations?.length > 0) {
      translatedText.value = data.translations[0].translatedText
      if (data.translations[0].detectedSourceLanguage) {
        detectedLang.value = data.translations[0].detectedSourceLanguage
      }
    }
  } catch {
    if (!isStale()) {
      message.error('Translation failed.')
    }
  } finally {
    if (!isStale()) {
      loading.value = false
    }
  }
}

const debouncedTranslate = debounce(handleTranslate, 800)

const handleInput = () => {
  debouncedTranslate()
}

const handleClear = () => {
  debouncedTranslate.cancel()
  translateRequest.invalidate()
  loading.value = false
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

onUnmounted(() => {
  debouncedTranslate.cancel()
  translateRequest.invalidate()
})
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
