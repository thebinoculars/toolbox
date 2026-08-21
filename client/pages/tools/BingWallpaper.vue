<template>
  <div class="flex flex-col h-full">
    <!-- Main Content -->
    <div class="flex-1 overflow-hidden p-4">
      <div class="h-full overflow-hidden flex flex-col lg:flex-row gap-4">
        <!-- Left: Image Display -->
        <div
          class="flex-1 rounded-2xl border overflow-hidden flex flex-col bg-(--bg-secondary) border-(--border-color) relative"
        >
          <div
            v-if="loading"
            class="absolute inset-0 flex items-center justify-center z-10 bg-black/5 backdrop-blur-sm"
          >
            <n-spin size="large" />
          </div>
          <div
            v-else-if="currentImageUrl"
            class="w-full h-full flex items-center justify-center bg-black"
          >
            <img
              :src="currentImageUrl"
              alt="Bing Wallpaper"
              class="max-w-full max-h-full object-contain"
            />
          </div>
          <n-empty
            v-else
            description="Loading wallpaper..."
            size="small"
            class="absolute inset-0 flex items-center justify-center"
          />
        </div>

        <!-- Right: Configuration Panel -->
        <div
          class="w-full lg:w-80 rounded-2xl border p-4 flex flex-col overflow-y-auto bg-(--bg-secondary) border-(--border-color) shrink-0"
        >
          <h3 class="text-sm font-bold mb-4">Image Configuration</h3>

          <!-- Resolution -->
          <div class="mb-4">
            <label class="text-xs font-medium mb-2 block opacity-80">Resolution</label>
            <n-select
              v-model:value="config.resolution"
              :options="resolutionOptions"
              placeholder="Select resolution"
              class="w-full"
              @update:value="updateImageUrl"
            />
          </div>

          <!-- Width -->
          <div class="mb-4">
            <label class="text-xs font-medium mb-2 block opacity-80"
              >Width (px): {{ config.width || 'Auto' }}</label
            >
            <n-slider
              v-model:value="config.width"
              :min="0"
              :max="4000"
              :step="100"
              class="w-full"
              @update:value="updateImageUrl"
            />
          </div>

          <!-- Height -->
          <div class="mb-4">
            <label class="text-xs font-medium mb-2 block opacity-80"
              >Height (px): {{ config.height || 'Auto' }}</label
            >
            <n-slider
              v-model:value="config.height"
              :min="0"
              :max="4000"
              :step="100"
              class="w-full"
              @update:value="updateImageUrl"
            />
          </div>

          <!-- Quality -->
          <div class="mb-4">
            <label class="text-xs font-medium mb-2 block opacity-80"
              >Quality (0-100): {{ config.quality || 'Auto' }}</label
            >
            <n-slider
              v-model:value="config.quality"
              :min="0"
              :max="100"
              :step="10"
              class="w-full"
              @update:value="updateImageUrl"
            />
          </div>

          <!-- Reset Button -->
          <div class="flex justify-center gap-2 mb-4">
            <n-button size="small" @click="resetConfig">
              <template #icon
                ><n-icon><Refresh /></n-icon
              ></template>
              Reset
            </n-button>
            <n-button v-if="currentImageUrl" size="small" type="primary" @click="copyUrl">
              <template #icon
                ><n-icon><Copy /></n-icon
              ></template>
              Copy
            </n-button>
          </div>

          <!-- Current URL Display -->
          <div v-if="currentImageUrl" class="mt-auto">
            <n-input
              :value="currentImageUrl"
              type="textarea"
              :autosize="{ minRows: 1 }"
              readonly
              size="tiny"
              class="w-full"
              :bordered="false"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Copy, Refresh } from '@vicons/tabler'

import proxyRepository from '@/repositories/proxyRepository'

const message = useMessage()

// Resolution options as specified
const resolutionOptions = [
  { label: '240x320', value: '240x320' },
  { label: '320x240', value: '320x240' },
  { label: '400x240', value: '400x240' },
  { label: '480x800', value: '480x800' },
  { label: '640x480', value: '640x480' },
  { label: '720x1280', value: '720x1280' },
  { label: '768x1280', value: '768x1280' },
  { label: '800x480', value: '800x480' },
  { label: '800x600', value: '800x600' },
  { label: '1024x768', value: '1024x768' },
  { label: '1280x768', value: '1280x768' },
  { label: '1366x768', value: '1366x768' },
  { label: '1920x1080', value: '1920x1080' },
  { label: '1920x1200', value: '1920x1200' },
  { label: 'UHD', value: 'UHD' },
]

// State
const loading = ref(false)
const originalImageUrl = ref('')
const currentImageUrl = ref('')
const config = ref({
  width: 0,
  height: 0,
  resolution: '1920x1080' as string | null,
  quality: 0,
})

// Functions
const modifyImageUrl = (imageUrl: string, params: typeof config.value) => {
  const { width, height, resolution, quality } = params

  let newImageUrl = imageUrl

  if (resolution) {
    const regex = /_\d+x\d+\.jpg/
    const newResolution = `_${resolution}.jpg`
    newImageUrl = newImageUrl.replace(regex, newResolution)
  }

  const url = new URL(newImageUrl)
  const searchParams = url.searchParams

  if (width && width > 0) {
    searchParams.set('w', width.toString())
  }

  if (height && height > 0) {
    searchParams.set('h', height.toString())
  }

  if (quality && quality > 0) {
    searchParams.set('qlt', quality.toString())
  }

  searchParams.delete('rf')
  searchParams.delete('pid')

  return url.toString()
}

const fetchWallpaper = async () => {
  try {
    loading.value = true

    const data = await proxyRepository.getBingWallpaper()

    if (data.images && data.images.length > 0) {
      const { url } = data.images[0]
      originalImageUrl.value = `https://www.bing.com${url}`
      resetConfig()
    } else {
      message.error('No wallpaper found')
    }
  } catch {
    message.error('Failed to fetch wallpaper')
  } finally {
    loading.value = false
  }
}

const updateImageUrl = () => {
  if (originalImageUrl.value) {
    currentImageUrl.value = modifyImageUrl(originalImageUrl.value, config.value)
  }
}

const resetConfig = () => {
  config.value = {
    width: 0,
    height: 0,
    resolution: '1920x1080',
    quality: 0,
  }
  updateImageUrl()
}

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(currentImageUrl.value)
    message.success('URL copied to clipboard')
  } catch {
    message.error('Failed to copy URL')
  }
}

// Lifecycle
onMounted(() => {
  fetchWallpaper()
})
</script>
