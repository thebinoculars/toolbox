<template>
  <div class="flex flex-col h-full">
    <!-- Toolbar -->
    <div
      class="border-b px-3 py-2 flex items-center gap-2 shrink-0 bg-[#2a2a2e] border-(--border-color)"
    >
      <span class="text-xs font-medium text-(--icon-color)">Episode</span>
      <n-select
        v-model:value="selected"
        :options="episodeOptions"
        placeholder="Select episode..."
        class="w-48"
        size="small"
        :loading="loadingOptions"
        @update:value="handleEpisodeChange"
      />
    </div>

    <!-- Content Section -->
    <div class="flex-1 overflow-y-auto p-5 mt-4">
      <n-spin :show="loading">
        <template v-if="!loading && !stamps.length">
          <n-empty
            description="No track data available for this episode"
            class="mt-16"
            size="large"
          >
          </n-empty>
        </template>

        <template v-else>
          <div class="md:px-4">
            <n-timeline size="large" :icon-size="28">
              <n-timeline-item
                v-for="(item, index) in stamps"
                :key="item.time || index"
                type="info"
                :time="item.time"
              >
                <template #icon>
                  <n-icon size="24" class="text-(--accent-primary)">
                    <Music />
                  </n-icon>
                </template>
                <template #header>
                  <div class="flex items-center justify-between pb-1">
                    <div
                      class="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 flex-1 min-w-0 pr-4"
                    >
                      <div
                        class="text-base font-bold truncate"
                        :class="currentTrackId === item.song?.id ? 'text-(--accent-primary)' : ''"
                        :title="item.song?.titles?.en || 'Unknown Title'"
                      >
                        {{ item.song?.titles?.en || 'Unknown Title' }}
                      </div>

                      <div
                        class="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"
                      ></div>

                      <n-text
                        depth="3"
                        class="flex items-center gap-1.5 text-sm truncate"
                        :title="item.album?.titles?.en || 'Unknown Album'"
                      >
                        <n-icon size="14" class="shrink-0"><Disc /></n-icon>
                        <span class="truncate">{{
                          item.album?.titles?.en || 'Unknown Album'
                        }}</span>
                      </n-text>
                    </div>

                    <div v-if="item.song?.id" class="shrink-0">
                      <n-tooltip trigger="hover" placement="left">
                        <template #trigger>
                          <n-button
                            circle
                            :type="
                              currentTrackId === item.song.id && isPlaying ? 'warning' : 'primary'
                            "
                            :secondary="currentTrackId !== item.song.id"
                            size="small"
                            class="shadow-sm"
                            @click="handleTogglePlay(item.song.id)"
                          >
                            <template #icon>
                              <n-icon v-if="currentTrackId === item.song.id && isPlaying"
                                ><PlayerPause
                              /></n-icon>
                              <n-icon v-else><PlayerPlay /></n-icon>
                            </template>
                          </n-button>
                        </template>
                        {{ currentTrackId === item.song.id && isPlaying ? 'Pause' : 'Play' }}
                      </n-tooltip>
                    </div>
                  </div>
                </template>
              </n-timeline-item>
            </n-timeline>
          </div>
        </template>
      </n-spin>
    </div>

    <!-- Hidden audio element -->
    <audio
      ref="audioRef"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @ended="isPlaying = false"
    ></audio>
  </div>
</template>

<script setup lang="ts">
import { Disc, Music, PlayerPause, PlayerPlay } from '@vicons/tabler'

import onePieceRepository from '@/repositories/onePieceRepository'
import type { OnePieceEpisode, OnePieceStamp } from '~/shared/types'

const message = useMessage()

// Constants
const AUDIO_SRC = 'http://onepiecetracklist.com/Music'

// State
const episodes = ref<OnePieceEpisode[]>([])
const stamps = ref<OnePieceStamp[]>([])
const title = ref('')
const release = ref('')
const selected = ref<number | null>(null)
const loading = ref(true)
const loadingOptions = ref(false)
const audioRef = ref<HTMLAudioElement | null>(null)
const currentTrackId = ref<number | null>(null)
const isPlaying = ref(false)

// Computed
const episodeOptions = computed(() => {
  const uniqueKeys = new Set()
  const options: Array<{ label: string; value: number }> = []

  for (const ep of episodes.value) {
    if (!uniqueKeys.has(ep.episode)) {
      uniqueKeys.add(ep.episode)
      options.push({
        label: `Episode ${ep.episode}`,
        value: ep.episode,
      })
    }
  }

  return options
})

// Functions
const getList = async () => {
  try {
    loadingOptions.value = true
    const data = await onePieceRepository.getEpisodes()

    if (data) {
      episodes.value = data
      if (data.length > 0) {
        selected.value = data[0].episode
        await handleEpisodeChange()
      }
    } else {
      throw new Error('Invalid response format')
    }
  } catch {
    message.error('Failed to fetch episode list')
  } finally {
    loadingOptions.value = false
  }
}

const handleEpisodeChange = async () => {
  if (!selected.value) {
    return
  }

  stopPlayback()

  loading.value = true
  stamps.value = []
  title.value = ''
  release.value = ''

  try {
    const data = await onePieceRepository.getEpisode(selected.value)

    if (data) {
      stamps.value = data.stamps || []
      title.value = data.title_en || ''
      release.value = data.release_date || ''
    } else {
      throw new Error('Episode details not found')
    }
  } catch {
    message.error('Failed to fetch episode details')
  } finally {
    loading.value = false
  }
}

const handleTogglePlay = (id: number) => {
  if (!audioRef.value) {
    return
  }

  if (currentTrackId.value === id) {
    if (isPlaying.value) {
      audioRef.value.pause()
    } else {
      audioRef.value.play().catch(() => {
        message.error('Failed to resume audio playback.')
      })
    }
    return
  }

  currentTrackId.value = id
  audioRef.value.src = `${AUDIO_SRC}/${id}.mp3`
  audioRef.value.play().catch(() => {
    message.error(
      'Failed to play audio. Autoplay might be blocked or the track source is unavailable.',
    )
    currentTrackId.value = null
  })
}

const stopPlayback = () => {
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
  }
  currentTrackId.value = null
  isPlaying.value = false
}

// Lifecycle
onMounted(() => {
  getList()
})

onBeforeUnmount(() => {
  stopPlayback()
})
</script>
