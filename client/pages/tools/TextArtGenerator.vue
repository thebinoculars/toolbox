<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-hidden">
      <div class="h-full overflow-hidden p-4 flex flex-col lg:flex-row gap-4">
        <div
          class="flex-1 rounded-2xl border overflow-hidden flex flex-col bg-(--bg-secondary) border-(--border-color)"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileUpload"
          />
          <div
            class="flex-1 flex items-center justify-center cursor-pointer bg-opacity-50 transition-all overflow-auto scrollbar-hide bg-(--bg-primary)"
            @click="!imageSrc && triggerFileInput()"
            @wheel="handlePreviewWheel"
          >
            <div
              v-if="!imageSrc"
              class="flex flex-col items-center justify-center gap-2 text-slate-500"
            >
              <n-icon size="48"><Photo /></n-icon>
              <p class="text-sm">Click to upload image</p>
            </div>
            <canvas
              v-else
              ref="canvasRef"
              class="max-w-full max-h-full transition-transform duration-200"
              :style="canvasStyleWithZoom"
            />
          </div>
        </div>

        <TextArtSettingsPanel
          v-model:settings="settings"
          :has-image="!!imageSrc"
          :is-generating="isGenerating"
          @width-change="handleWidthChange"
          @height-change="handleHeightChange"
          @change-image="triggerFileInput"
          @generate="handleGenerate"
          @download="handleDownload"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Photo } from '@vicons/tabler'

import TextArtSettingsPanel from '@/components/tools/TextArtGenerator/TextArtSettingsPanel.vue'
import { renderTextArt } from '@/utils/canvas'
import { downloadCanvasImage } from '@/utils/download'
import { getTextArtSettings, setTextArtSettings, type TextArtSettings } from '@/utils/localStorage'

const message = useMessage()

const MIN_DIMENSION = 100
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.1

const DEFAULT_SETTINGS: TextArtSettings = {
  width: 4000,
  height: 4000,
  lyrics:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  lineSeparator: '   ',
  bgColor: '#0a0a0a',
  brightness: 100,
  contrast: 100,
  fontFamily: 'Arial',
  fontSize: 26,
  lineHeight: 28,
  maintainAspectRatio: true,
}

const fileInput = ref<HTMLInputElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const imageSrc = ref<string | null>(null)
const isGenerating = ref(false)
const imageSize = reactive({ width: 0, height: 0 })
const settings = ref<TextArtSettings>({ ...DEFAULT_SETTINGS })
const zoomLevel = ref(1)

const imageAspectRatio = computed(() => {
  return imageSize.height > 0 ? imageSize.width / imageSize.height : 1
})

const canvasStyleWithZoom = computed(
  () =>
    `image-rendering: crisp-edges; background-color: ${settings.value.bgColor}; max-width: 100%; max-height: 100%; transform: scale(${zoomLevel.value}); transform-origin: center;`,
)

watch(
  settings,
  (newSettings) => {
    setTextArtSettings(newSettings)
  },
  { deep: true },
)

const handlePreviewWheel = (event: WheelEvent) => {
  if (!imageSrc.value) {
    return
  }

  event.preventDefault()

  const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
  zoomLevel.value = Math.max(MIN_ZOOM, Math.min(zoomLevel.value + delta, MAX_ZOOM))
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = () => {
  const file = fileInput.value?.files?.[0]
  if (!file) {
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      imageSrc.value = reader.result
      loadImageAndGenerate()
    }
  }
  reader.readAsDataURL(file)
}

const loadImageAndGenerate = () => {
  if (!imageSrc.value) {
    return
  }

  const img = new Image()
  img.onload = () => {
    imageSize.width = img.width
    imageSize.height = img.height

    if (settings.value.maintainAspectRatio) {
      settings.value.height = Math.max(
        MIN_DIMENSION,
        Math.round(settings.value.width / imageAspectRatio.value),
      )
    }

    handleGenerate()
  }
  img.onerror = () => {
    isGenerating.value = false
  }
  img.src = imageSrc.value
}

const shouldKeepAspectRatio = () =>
  settings.value.maintainAspectRatio && imageSize.width > 0 && imageSize.height > 0

const handleWidthChange = (value: number | null) => {
  if (value === null) {
    return
  }

  settings.value.width = value

  if (shouldKeepAspectRatio()) {
    settings.value.height = Math.max(MIN_DIMENSION, Math.round(value / imageAspectRatio.value))
  }
}

const handleHeightChange = (value: number | null) => {
  if (value === null) {
    return
  }

  settings.value.height = value

  if (shouldKeepAspectRatio()) {
    settings.value.width = Math.max(MIN_DIMENSION, Math.round(value * imageAspectRatio.value))
  }
}

const handleGenerate = async () => {
  if (!imageSrc.value || !canvasRef.value) {
    return
  }

  isGenerating.value = true
  try {
    await renderTextArt(canvasRef.value, imageSrc.value, settings.value)
  } catch {
    message.error('Error generating text art')
  } finally {
    isGenerating.value = false
  }
}

const handleDownload = () => {
  if (!canvasRef.value) {
    return
  }

  downloadCanvasImage(canvasRef.value.toDataURL('image/png'), `text-art-${Date.now()}.png`)
}

onMounted(() => {
  const saved = getTextArtSettings()
  if (!saved) {
    return
  }

  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof TextArtSettings)[]) {
    const value: unknown = saved[key]
    const isValid =
      typeof value === typeof DEFAULT_SETTINGS[key] &&
      (typeof value !== 'number' || Number.isFinite(value))
    if (isValid) {
      Object.assign(settings.value, { [key]: value })
    }
  }
})
</script>
