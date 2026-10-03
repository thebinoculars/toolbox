<template>
  <div class="shrink-0 bg-[#2a2a2e] border-t border-(--border-color)">
    <div class="px-4 py-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3 w-1/3 min-w-0">
          <div
            class="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0"
          >
            <n-icon :size="20"><Music /></n-icon>
          </div>
          <div class="flex-1 min-w-0 overflow-hidden">
            <div
              class="font-medium text-sm whitespace-nowrap"
              :class="{ 'animate-marquee': isLongTitle }"
            >
              <span v-if="isLongTitle">{{ song }}&nbsp;&nbsp;&nbsp;&nbsp;{{ song }}</span>
              <span v-else>{{ song }}</span>
            </div>
            <div class="text-xs text-gray-400">Track {{ trackNumber }} of {{ trackCount }}</div>
          </div>
        </div>

        <div class="flex flex-col items-center gap-1 flex-1 px-4">
          <div class="flex items-center gap-2">
            <n-button
              quaternary
              circle
              :type="repeat ? 'primary' : 'default'"
              size="small"
              title="Repeat"
              :disabled="isLoading"
              @click="emit('toggleRepeat')"
            >
              <template #icon>
                <n-icon :size="16"><Repeat /></n-icon>
              </template>
            </n-button>
            <n-button
              quaternary
              circle
              size="small"
              title="Previous"
              :disabled="isLoading"
              @click="emit('previous')"
            >
              <n-icon :size="18"><PlayerSkipBack /></n-icon>
            </n-button>
            <n-button
              circle
              type="primary"
              size="small"
              class="w-8 h-8"
              title="Play/Pause"
              :disabled="isLoading"
              @click="emit('togglePlay')"
            >
              <n-icon :size="16">
                <PlayerPause v-if="isPlaying" />
                <PlayerPlay v-else />
              </n-icon>
            </n-button>
            <n-button
              quaternary
              circle
              size="small"
              title="Next"
              :disabled="isLoading"
              @click="emit('next')"
            >
              <n-icon :size="18"><PlayerSkipForward /></n-icon>
            </n-button>
            <n-button
              quaternary
              circle
              :type="shuffle ? 'primary' : 'default'"
              size="small"
              title="Shuffle"
              :disabled="isLoading"
              @click="emit('toggleShuffle')"
            >
              <template #icon>
                <n-icon :size="16"><ArrowsShuffle /></n-icon>
              </template>
            </n-button>
          </div>

          <div class="flex items-center gap-2 w-full">
            <span class="text-xs text-gray-400 w-8 text-right shrink-0">{{
              formatTime(currentTime)
            }}</span>
            <div
              ref="progressBarRef"
              class="flex-1 relative h-1 bg-white/20 rounded-full cursor-pointer group"
              @mousedown="startProgressDrag"
              @click="emit('seek', fractionFromEvent($event, progressBarRef))"
            >
              <div
                class="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                :style="{ width: buffered + '%' }"
              ></div>
              <div
                class="absolute top-0 left-0 h-full bg-linear-to-r from-purple-500 to-pink-500 rounded-full"
                :style="{ width: progressPercent + '%' }"
              ></div>
              <div
                class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                :style="{ left: progressPercent + '%' }"
              ></div>
            </div>
            <span class="text-xs text-gray-400 w-8 shrink-0">{{ formatTime(duration) }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 w-1/3 justify-end">
          <n-button quaternary circle size="small" title="Mute" @click="emit('toggleMute')">
            <n-icon :size="16">
              <Volume3 v-if="isMuted || volume === 0" />
              <Volume v-else />
            </n-icon>
          </n-button>
          <div
            ref="volumeBarRef"
            class="w-24 relative h-1 bg-white/20 rounded-full cursor-pointer group"
            @mousedown="startVolumeDrag"
            @click="emit('volume', fractionFromEvent($event, volumeBarRef))"
          >
            <div
              class="absolute top-0 left-0 h-full bg-white/60 rounded-full"
              :style="{ width: volume * 100 + '%' }"
            ></div>
            <div
              class="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              :style="{ left: volume * 100 + '%' }"
            ></div>
          </div>
          <span class="text-xs text-gray-400 w-8 text-right shrink-0"
            >{{ Math.round(volume * 100) }}%</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowsShuffle,
  Music,
  PlayerPause,
  PlayerPlay,
  PlayerSkipBack,
  PlayerSkipForward,
  Repeat,
  Volume,
  Volume3,
} from '@vicons/tabler'

import { formatTime } from '@/utils/format'

const props = defineProps<{
  song: string
  trackNumber: number
  trackCount: number
  isPlaying: boolean
  isLoading: boolean
  repeat: boolean
  shuffle: boolean
  currentTime: number
  duration: number
  buffered: number
  volume: number
  isMuted: boolean
}>()

const emit = defineEmits<{
  toggleRepeat: []
  previous: []
  togglePlay: []
  next: []
  toggleShuffle: []
  toggleMute: []
  seek: [fraction: number]
  volume: [value: number]
}>()

const progressBarRef = ref<HTMLElement | null>(null)
const volumeBarRef = ref<HTMLElement | null>(null)
let dragTarget: 'progress' | 'volume' | null = null

const isLongTitle = computed(() => props.song.length > 30)
const progressPercent = computed(() => (props.currentTime / props.duration) * 100)

const fractionFromEvent = (event: MouseEvent, bar: HTMLElement | null) => {
  if (!bar) return 0
  const rect = bar.getBoundingClientRect()
  return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
}

const emitDragValue = (event: MouseEvent) => {
  if (dragTarget === 'progress' && progressBarRef.value) {
    emit('seek', fractionFromEvent(event, progressBarRef.value))
  }
  if (dragTarget === 'volume' && volumeBarRef.value) {
    emit('volume', fractionFromEvent(event, volumeBarRef.value))
  }
}

const startProgressDrag = (event: MouseEvent) => {
  dragTarget = 'progress'
  emitDragValue(event)
}

const startVolumeDrag = (event: MouseEvent) => {
  dragTarget = 'volume'
  emitDragValue(event)
}

const stopDrag = () => {
  dragTarget = null
}

onMounted(() => {
  window.addEventListener('mousemove', emitDragValue)
  window.addEventListener('mouseup', stopDrag)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', emitDragValue)
  window.removeEventListener('mouseup', stopDrag)
})
</script>
