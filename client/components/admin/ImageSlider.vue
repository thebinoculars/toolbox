<template>
  <div
    ref="sliderRoot"
    class="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
    @click="handleBackgroundClick"
  >
    <div class="relative w-full h-full flex flex-col">
      <div
        class="absolute top-0 left-0 right-0 z-20 bg-linear-to-b from-black/50 to-transparent p-4"
      >
        <div class="flex items-center justify-between">
          <div class="text-white">
            <span class="text-sm opacity-75">{{ currentIndex + 1 }} / {{ images.length }}</span>
            <h3 class="font-medium">{{ currentImage?.filename || 'Untitled' }}</h3>
          </div>

          <div class="flex items-center space-x-2">
            <button
              :disabled="!canZoomOut"
              class="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-50 cursor-pointer aspect-square w-10 h-10 flex items-center justify-center"
              title="Zoom out"
              @click="zoomOut"
            >
              <n-icon size="20"><ZoomOut /></n-icon>
            </button>
            <span class="text-white text-sm px-2">{{ Math.round(zoomLevel * 100) }}%</span>
            <button
              :disabled="!canZoomIn"
              class="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-50 cursor-pointer aspect-square w-10 h-10 flex items-center justify-center"
              title="Zoom in"
              @click="zoomIn"
            >
              <n-icon size="20"><ZoomIn /></n-icon>
            </button>
            <button
              class="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors cursor-pointer aspect-square w-10 h-10 flex items-center justify-center"
              title="Reset zoom"
              @click="resetZoom"
            >
              <n-icon size="20"><ZoomCancel /></n-icon>
            </button>
            <button
              class="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors cursor-pointer aspect-square w-10 h-10 flex items-center justify-center"
              :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
              @click="toggleFullscreen"
            >
              <n-icon size="20">
                <component :is="isFullscreen ? Minimize : Maximize" />
              </n-icon>
            </button>
            <button
              class="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors cursor-pointer aspect-square w-10 h-10 flex items-center justify-center"
              title="Close"
              @click="$emit('close')"
            >
              <n-icon size="20"><X /></n-icon>
            </button>
          </div>
        </div>
      </div>

      <button
        v-if="currentIndex > 0"
        class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2 bg-black/30 rounded-full hover:bg-black/50 transition-colors cursor-pointer"
        @click="$emit('prev')"
      >
        <n-icon size="32"><ChevronLeft /></n-icon>
      </button>

      <button
        v-if="currentIndex < images.length - 1"
        class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2 bg-black/30 rounded-full hover:bg-black/50 transition-colors cursor-pointer"
        @click="$emit('next')"
      >
        <n-icon size="32"><ChevronRight /></n-icon>
      </button>

      <div
        class="flex-1 min-h-0 flex items-center justify-center p-4 pt-20 pb-24 overflow-hidden"
        @wheel="handleWheel"
        @mousedown="startPan"
        @mousemove="handlePan"
        @mouseup="endPan"
        @mouseleave="endPan"
      >
        <div
          class="relative w-full h-full flex items-center justify-center"
          :style="transformStyle"
        >
          <img
            v-if="currentImage?.url"
            :src="currentImage.url"
            :alt="currentImage.original_name"
            class="max-w-full max-h-full object-contain select-none"
            draggable="false"
            @click.stop
          />
        </div>
      </div>

      <div
        class="absolute bottom-0 left-0 right-0 z-20 bg-linear-to-t from-black/50 to-transparent p-4"
      >
        <div ref="thumbnailContainer" class="flex space-x-2 overflow-x-auto scrollbar-hide">
          <button
            v-for="(image, index) in images"
            :key="image.id"
            :class="[
              'shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all duration-200 cursor-pointer',
              index === currentIndex
                ? 'border-white scale-110'
                : 'border-transparent opacity-60 hover:opacity-80 hover:scale-105',
            ]"
            @click="goToImage(index)"
          >
            <img
              :src="image.url"
              :alt="image.original_name"
              loading="lazy"
              class="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  X,
  ZoomCancel,
  ZoomIn,
  ZoomOut,
} from '@vicons/tabler'

import { useZoomPan } from '@/composables/admin/useZoomPan'
import type { Image } from '~/shared/types'

const props = defineProps<{
  images: Image[]
  currentIndex: number
}>()

const emit = defineEmits<{
  close: []
  prev: []
  next: []
  'go-to': [index: number]
}>()

const {
  zoomLevel,
  canZoomIn,
  canZoomOut,
  transformStyle,
  zoomIn,
  zoomOut,
  resetZoom,
  startPan,
  handlePan,
  endPan,
  handleWheel,
} = useZoomPan()

const thumbnailContainer = ref<HTMLElement | null>(null)
const sliderRoot = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)

const currentImage = computed(() => props.images[props.currentIndex])

const handleBackgroundClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

const toggleFullscreen = async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await sliderRoot.value?.requestFullscreen()
    }
  } catch {
    /* ignore */
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = document.fullscreenElement === sliderRoot.value
}

const goToImage = (index: number) => {
  emit('go-to', index)
  resetZoom()
  nextTick(() => scrollThumbnailIntoView(index))
}

const scrollThumbnailIntoView = (index: number) => {
  if (!thumbnailContainer.value) {
    return
  }

  const container = thumbnailContainer.value
  const thumbnail = container.children[index]

  if (thumbnail instanceof HTMLElement) {
    const containerRect = container.getBoundingClientRect()
    const thumbnailRect = thumbnail.getBoundingClientRect()
    const scrollLeft = thumbnail.offsetLeft - containerRect.width / 2 + thumbnailRect.width / 2
    container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
  }
}

watch(
  () => props.currentIndex,
  (newIndex) => {
    resetZoom()
    nextTick(() => scrollThumbnailIntoView(newIndex))
  },
)

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  nextTick(() => scrollThumbnailIntoView(props.currentIndex))
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
})
</script>
