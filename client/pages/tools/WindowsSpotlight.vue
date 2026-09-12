<template>
  <div class="w-full h-full relative overflow-hidden bg-black spotlight-container">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white z-10"
    >
      <div
        class="w-10 h-10 border-3 border-white/30 border-t-white rounded-full mx-auto mb-4 animate-spin"
      ></div>
      <p class="text-base opacity-80 m-0">Loading beautiful images...</p>
    </div>

    <!-- Main Content -->
    <div
      v-else
      class="relative w-full h-full flex flex-col justify-between main-container bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${currentImageUrl})` }"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <!-- Image Overlay -->
      <div
        class="absolute inset-0 bg-linear-to-b from-black/30 to-black/60 z-10 pointer-events-none"
      ></div>

      <!-- Title Section -->
      <div class="absolute top-6 left-6 right-6 z-30 md:top-4 md:left-4 md:right-4 title-section">
        <h2
          v-show="controlsVisible"
          class="text-white text-2xl font-semibold text-shadow-lg md:text-xl line-clamp-3"
        >
          {{ imageData?.ad?.title || 'Beautiful Image' }}
        </h2>
      </div>

      <!-- Fullscreen Button (Top Right) -->
      <button
        v-show="controlsVisible"
        class="absolute top-6 right-6 z-40 w-11 h-11 rounded-full border border-white/18 bg-white/14 text-white flex items-center justify-center cursor-pointer hover:bg-white/22 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'"
        @click="handleToggleFullscreen"
      >
        <div class="pointer-events-none">
          <Maximize v-if="!isFullscreen" class="w-5 h-5" />
          <Minimize v-else class="w-5 h-5" />
        </div>
      </button>

      <!-- Play Button (Bottom Left) -->
      <button
        v-show="controlsVisible"
        class="absolute bottom-6 left-6 z-40 w-11 h-11 rounded-full border border-white/18 bg-white/14 text-white flex items-center justify-center cursor-pointer hover:bg-white/22 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        :class="{ 'bg-white/22': autoplayEnabled }"
        :title="autoplayEnabled ? 'Stop Autoplay' : 'Start Autoplay'"
        @click="handleToggleAutoplay"
      >
        <div class="pointer-events-none">
          <PlayerPlay v-if="!autoplayEnabled" class="w-5 h-5" />
          <PlayerPause v-else class="w-5 h-5" />
        </div>
      </button>

      <!-- New Image Button (Bottom Right) -->
      <button
        v-show="controlsVisible"
        class="absolute bottom-6 right-6 z-40 w-11 h-11 rounded-full border border-white/18 bg-white/14 text-white flex items-center justify-center cursor-pointer hover:bg-white/22 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="loading"
        title="New Image"
        @click="handleFetchNewImage"
      >
        <div class="pointer-events-none">
          <Refresh class="w-5 h-5" />
        </div>
      </button>

      <!-- Progress Bar for Autoplay -->
      <div
        v-if="autoplayEnabled && controlsVisible"
        class="h-0.5 bg-linear-to-r from-blue-600 to-cyan-400 rounded-sm transition-all duration-100 ease-linear"
        :style="{ width: progressWidth + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Maximize, Minimize, PlayerPause, PlayerPlay, Refresh } from '@vicons/tabler'

import proxyRepository from '@/repositories/proxyRepository'
import type { IntervalId, SpotlightImage, TimerId } from '~/shared/types'

const message = useMessage()

// Constants
const AUTOPLAY_INTERVAL = 10000
const PROGRESS_UPDATE_INTERVAL = 100
const CONTROLS_HIDE_DELAY = 3000

// State
const imageData = ref<SpotlightImage | null>(null)
const loading = ref(true)
const autoplayEnabled = ref(false)
const autoplayTimer = ref<TimerId | null>(null)
const progressTimer = ref<IntervalId | null>(null)
const progressWidth = ref(0)
const isFullscreen = ref(false)
const isMobile = ref(false)
const controlsVisible = ref(true)
const hideControlsTimer = ref<TimerId | null>(null)

// Computed
const currentImageUrl = computed(() => {
  if (!imageData.value) {
    return ''
  }
  return isMobile.value
    ? imageData.value.ad?.portraitImage?.asset || ''
    : imageData.value.ad?.landscapeImage?.asset || ''
})

// Functions
const fetchSpotlightData = async () => {
  try {
    loading.value = true

    const data = await proxyRepository.getSpotlightData()

    imageData.value = data
  } catch {
    message.error('Failed to fetch spotlight data')
  } finally {
    loading.value = false
  }
}

const handleFetchNewImage = () => {
  resetProgress()
  fetchSpotlightData()
}

const handleToggleAutoplay = () => {
  autoplayEnabled.value = !autoplayEnabled.value

  if (autoplayEnabled.value) {
    startAutoplay()
  } else {
    stopAutoplay()
  }
}

const startAutoplay = () => {
  stopAutoplay()

  progressWidth.value = 0
  const startTime = Date.now()

  progressTimer.value = setInterval(() => {
    const elapsed = Date.now() - startTime
    const progress = (elapsed / AUTOPLAY_INTERVAL) * 100

    if (progress >= 100) {
      progressWidth.value = 100
      if (progressTimer.value) {
        clearInterval(progressTimer.value)
      }
      progressTimer.value = null
    } else {
      progressWidth.value = progress
    }
  }, PROGRESS_UPDATE_INTERVAL)

  autoplayTimer.value = setTimeout(() => {
    if (autoplayEnabled.value) {
      handleFetchNewImage()
      startAutoplay()
    }
  }, AUTOPLAY_INTERVAL)
}

const stopAutoplay = () => {
  if (autoplayTimer.value) {
    clearTimeout(autoplayTimer.value)
    autoplayTimer.value = null
  }

  if (progressTimer.value) {
    clearInterval(progressTimer.value)
    progressTimer.value = null
  }

  progressWidth.value = 0
}

const resetProgress = () => {
  if (autoplayEnabled.value) {
    stopAutoplay()
    startAutoplay()
  }
}

const handleToggleFullscreen = async () => {
  const container = document.querySelector('.spotlight-container')
  if (container && !document.fullscreenElement) {
    await container.requestFullscreen()
    isFullscreen.value = true
  } else if (document.fullscreenElement) {
    await document.exitFullscreen()
    isFullscreen.value = false
  }
}

const showControls = () => {
  controlsVisible.value = true
  if (isFullscreen.value) {
    startHideControlsTimer()
  }
}

const hideControls = () => {
  if (isFullscreen.value) {
    controlsVisible.value = false
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
  controlsVisible.value = true

  if (isFullscreen.value) {
    startHideControlsTimer()
  } else {
    clearHideControlsTimer()
  }
}

const handleMouseMove = () => {
  if (isFullscreen.value) {
    showControls()
  }
}

const handleMouseLeave = () => {
  if (isFullscreen.value) {
    hideControls()
  }
}

const startHideControlsTimer = (delay = CONTROLS_HIDE_DELAY) => {
  clearHideControlsTimer()

  hideControlsTimer.value = setTimeout(() => {
    if (isFullscreen.value) {
      controlsVisible.value = false
    }
  }, delay)
}

const clearHideControlsTimer = () => {
  if (hideControlsTimer.value) {
    clearTimeout(hideControlsTimer.value)
    hideControlsTimer.value = null
  }
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

// Lifecycle
onMounted(() => {
  handleResize()
  fetchSpotlightData()

  window.addEventListener('resize', handleResize)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  stopAutoplay()
  clearHideControlsTimer()
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style scoped lang="scss">
.spotlight-container {
  &:fullscreen {
    width: 100vw;
    height: 100vh;
    cursor: none;
    &:hover {
      cursor: default;
    }
  }
}

button {
  > * {
    pointer-events: none;
  }
}
</style>
