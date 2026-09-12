<template>
  <div class="flex flex-col h-full">
    <!-- Toolbar -->
    <div
      class="border-b px-3 py-2 flex items-center gap-2 shrink-0 bg-[#2a2a2e] border-(--border-color)"
    >
      <span class="text-xs font-medium text-(--icon-color) shrink-0">Playlist</span>
      <n-select
        v-if="playlists.length > 0"
        v-model:value="selectedPlaylistId"
        :options="playlistSelectOptions"
        placeholder="Select playlist..."
        size="small"
        class="flex-1"
        :loading="isLoadingPlaylists"
        :disabled="isLoadingSong"
        @update:value="handlePlaylistSelect"
      />
      <span v-else class="text-xs text-gray-500">No playlists</span>
    </div>

    <!-- Content Section -->
    <div class="flex-1 overflow-y-auto p-5">
      <template v-if="selectedPlaylistId && songs.length > 0">
        <div class="song-list">
          <div
            v-for="(song, index) in songs"
            :key="song"
            class="song-item group flex items-center gap-4 p-4 rounded-xl transition-all duration-200 mb-2"
            :class="{
              'bg-white/10': currentSong === song,
              'hover:bg-white/10 cursor-pointer': !isLoadingSong && currentSong !== song,
              'opacity-50 cursor-not-allowed': isLoadingSong && currentSong !== song,
            }"
            :data-playing="currentSong === song ? 'true' : 'false'"
            @click="!isLoadingSong && currentSong !== song && playSong(song)"
          >
            <!-- Track Number / Playing Indicator -->
            <div class="w-8 text-center shrink-0">
              <span v-if="currentSong !== song" class="text-gray-500 group-hover:text-gray-300">{{
                index + 1
              }}</span>
              <div
                v-else-if="isLoadingSong && currentSong === song"
                class="flex items-center justify-center"
              >
                <n-spin size="small" />
              </div>
              <div v-else class="flex items-center justify-center gap-0.5">
                <div class="w-0.5 h-3 bg-purple-400 animate-pulse"></div>
                <div
                  class="w-0.5 h-4 bg-purple-400 animate-pulse"
                  style="animation-delay: 0.1s"
                ></div>
                <div
                  class="w-0.5 h-2 bg-purple-400 animate-pulse"
                  style="animation-delay: 0.2s"
                ></div>
              </div>
            </div>

            <!-- Song Name -->
            <div class="flex-1 min-w-0">
              <div
                class="font-medium truncate"
                :class="{ 'text-purple-400': currentSong === song }"
              >
                {{ song }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <n-empty
        v-else-if="selectedPlaylistId && !isLoadingSongs"
        description="No songs in this playlist"
        class="mt-16"
      />
      <n-empty
        v-else-if="!selectedPlaylistId"
        description="Select a playlist to see songs"
        class="mt-16"
      />
    </div>

    <!-- Fixed Player Bar -->
    <div v-if="currentSong" class="shrink-0 bg-[#2a2a2e] border-t border-(--border-color)">
      <div class="px-4 py-2">
        <!-- Controls -->
        <div class="flex items-center justify-between">
          <!-- Left: Song Info -->
          <div class="flex items-center gap-3 w-1/3 min-w-0">
            <div
              class="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0"
            >
              <n-icon :size="20"><Music /></n-icon>
            </div>
            <div class="flex-1 min-w-0 overflow-hidden">
              <div
                class="font-medium text-sm whitespace-nowrap"
                :class="{ 'animate-marquee': currentSong && currentSong.length > 30 }"
              >
                <span v-if="currentSong && currentSong.length > 30"
                  >{{ currentSong }}&nbsp;&nbsp;&nbsp;&nbsp;{{ currentSong }}</span
                >
                <span v-else>{{ currentSong }}</span>
              </div>
              <div class="text-xs text-gray-400">
                Track {{ songs.findIndex((s) => s === currentSong) + 1 }} of {{ songs.length }}
              </div>
            </div>
          </div>

          <!-- Center: Playback Controls -->
          <div class="flex flex-col items-center gap-1 flex-1 px-4">
            <!-- Control Buttons -->
            <div class="flex items-center gap-2">
              <n-button
                quaternary
                circle
                :type="repeat ? 'primary' : 'default'"
                size="small"
                title="Repeat"
                :disabled="isLoadingSong"
                @click="toggleRepeat"
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
                :disabled="isLoadingSong"
                @click="playPreviousSong"
              >
                <n-icon :size="18"><PlayerSkipBack /></n-icon>
              </n-button>
              <n-button
                circle
                type="primary"
                size="small"
                class="w-8 h-8"
                title="Play/Pause"
                :disabled="isLoadingSong"
                @click="togglePlayPause"
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
                :disabled="isLoadingSong"
                @click="playNextSong"
              >
                <n-icon :size="18"><PlayerSkipForward /></n-icon>
              </n-button>
              <n-button
                quaternary
                circle
                :type="shuffle ? 'primary' : 'default'"
                size="small"
                title="Shuffle"
                :disabled="isLoadingSong"
                @click="toggleShuffle"
              >
                <template #icon>
                  <n-icon :size="16"><ArrowsShuffle /></n-icon>
                </template>
              </n-button>
            </div>

            <!-- Progress Bar -->
            <div class="flex items-center gap-2 w-full">
              <span class="text-xs text-gray-400 w-8 text-right shrink-0">{{
                formatTime(currentPlayTime)
              }}</span>
              <div
                ref="progressBarRef"
                class="flex-1 relative h-1 bg-white/20 rounded-full cursor-pointer group"
                @mousedown="startProgressDrag"
                @click="handleProgressClick"
              >
                <!-- Buffer -->
                <div
                  class="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                  :style="{ width: buffered + '%' }"
                ></div>
                <!-- Progress -->
                <div
                  class="absolute top-0 left-0 h-full bg-linear-to-r from-purple-500 to-pink-500 rounded-full"
                  :style="{ width: (currentPlayTime / totalPlayTime) * 100 + '%' }"
                ></div>
                <!-- Thumb -->
                <div
                  class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  :style="{ left: (currentPlayTime / totalPlayTime) * 100 + '%' }"
                ></div>
              </div>
              <span class="text-xs text-gray-400 w-8 shrink-0">{{
                formatTime(totalPlayTime)
              }}</span>
            </div>
          </div>

          <!-- Right: Volume -->
          <div class="flex items-center gap-2 w-1/3 justify-end">
            <n-button quaternary circle size="small" title="Mute" @click="toggleMute">
              <n-icon :size="16">
                <Volume3 v-if="isMuted || volume === 0" />
                <Volume v-else />
              </n-icon>
            </n-button>
            <div
              ref="volumeBarRef"
              class="w-24 relative h-1 bg-white/20 rounded-full cursor-pointer group"
              @mousedown="startVolumeDrag"
              @click="handleVolumeClick"
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

import playlistRepository from '@/repositories/playlistRepository'
import { formatTime } from '@/utils/format'
import {
  getMusicPlayerRepeat,
  getMusicPlayerShuffle,
  getMusicPlayerVolume,
  setMusicPlayerRepeat,
  setMusicPlayerShuffle,
  setMusicPlayerVolume,
} from '@/utils/localStorage'

const message = useMessage()

// State
const playlists = ref<string[]>([])
const selectedPlaylistId = ref<string | null>(null)
const songs = ref<string[]>([])
const currentSong = ref<string | null>(null)
const audio = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const isLoadingPlaylists = ref(true)
const isLoadingSongs = ref(false)
const isLoadingSong = ref(false)
const currentPlayTime = ref(0)
const totalPlayTime = ref(0)
const volume = ref(getMusicPlayerVolume())
const isMuted = ref(false)
const shuffle = ref(getMusicPlayerShuffle())
const repeat = ref(getMusicPlayerRepeat())
const played = ref<number[]>([])
const buffered = ref(0)

const progressBarRef = ref<HTMLElement | null>(null)
const volumeBarRef = ref<HTMLElement | null>(null)
const isDraggingProgress = ref(false)
const isDraggingVolume = ref(false)

// Computed
const playlistSelectOptions = computed(() => {
  return playlists.value.map((playlist) => ({
    label: playlist,
    value: playlist,
  }))
})

// Functions
const handlePlaylistSelect = (key: string) => {
  selectedPlaylistId.value = key
}

const playSong = async (songId: string) => {
  if (currentSong.value === songId && !isLoadingSong.value) {
    return
  }

  if (isLoadingSong.value) {
    return
  }

  if (audio.value) {
    isLoadingSong.value = true
    currentSong.value = songId
    try {
      audio.value.src = await playlistRepository.getSongUrl(
        `${selectedPlaylistId.value}/${songId}.mp3`,
      )
      audio.value.play()
      isPlaying.value = true
      document.title = songId
      scrollToPlayingSong()
    } catch {
      message.error('Failed to play song')
      isLoadingSong.value = false
    }
  }
}

const scrollToPlayingSong = () => {
  setTimeout(() => {
    const playingElement = document.querySelector('.song-item[data-playing="true"]')
    if (playingElement) {
      playingElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
}

const togglePlayPause = () => {
  if (audio.value) {
    if (isPlaying.value) {
      audio.value.pause()
    } else {
      audio.value.play()
    }
    isPlaying.value = !isPlaying.value
  }
}

const playNextSong = () => {
  if (!currentSong.value || songs.value.length === 0) return

  let nextIndex: number
  if (shuffle.value) {
    nextIndex = generateRandomIndex()
  } else {
    const currentIndex = songs.value.findIndex((s) => s === currentSong.value)
    if (currentIndex !== -1 && currentIndex < songs.value.length - 1) {
      nextIndex = currentIndex + 1
    } else {
      nextIndex = 0
    }
  }

  playSong(songs.value[nextIndex])
}

const playPreviousSong = () => {
  if (!currentSong.value || songs.value.length === 0) return

  const currentIndex = songs.value.findIndex((s) => s === currentSong.value)
  if (currentIndex > 0) {
    playSong(songs.value[currentIndex - 1])
  } else {
    playSong(songs.value[songs.value.length - 1])
  }
}

const generateRandomIndex = (): number => {
  if (played.value.length === songs.value.length) {
    played.value = []
  }
  const random = Math.floor(Math.random() * songs.value.length)
  return played.value.indexOf(random) === -1 ? random : generateRandomIndex()
}

const toggleShuffle = () => {
  shuffle.value = !shuffle.value
  setMusicPlayerShuffle(shuffle.value)
  if (shuffle.value) {
    played.value = []
  }
}

const toggleRepeat = () => {
  repeat.value = !repeat.value
  setMusicPlayerRepeat(repeat.value)
}

const handleProgressClick = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percentage = x / rect.width
  if (audio.value && totalPlayTime.value) {
    audio.value.currentTime = percentage * totalPlayTime.value
  }
}

const toggleMute = () => {
  if (audio.value) {
    audio.value.muted = !audio.value.muted
    isMuted.value = audio.value.muted
  }
}

const startProgressDrag = (event: MouseEvent) => {
  isDraggingProgress.value = true
  updateProgressFromEvent(event)
}

const startVolumeDrag = (event: MouseEvent) => {
  isDraggingVolume.value = true
  updateVolumeFromEvent(event)
}

const updateProgressFromEvent = (event: MouseEvent) => {
  if (!progressBarRef.value) return
  const rect = progressBarRef.value.getBoundingClientRect()
  let x = event.clientX - rect.left
  if (x < 0) x = 0
  if (x > rect.width) x = rect.width

  const percentage = x / rect.width
  if (audio.value && totalPlayTime.value) {
    audio.value.currentTime = percentage * totalPlayTime.value
  }
}

const updateVolumeFromEvent = (event: MouseEvent) => {
  if (!volumeBarRef.value) return
  const rect = volumeBarRef.value.getBoundingClientRect()
  let x = event.clientX - rect.left
  if (x < 0) x = 0
  if (x > rect.width) x = rect.width

  const newVolume = x / rect.width
  if (audio.value) {
    audio.value.volume = newVolume
    volume.value = newVolume
    setMusicPlayerVolume(newVolume)
    if (newVolume > 0) isMuted.value = false
  }
}

const handleVolumeClick = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const newVolume = Math.max(0, Math.min(1, x / rect.width))
  if (audio.value) {
    audio.value.volume = newVolume
    volume.value = newVolume
    setMusicPlayerVolume(newVolume)
    if (newVolume > 0) isMuted.value = false
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (isDraggingProgress.value) {
    updateProgressFromEvent(event)
  }
  if (isDraggingVolume.value) {
    updateVolumeFromEvent(event)
  }
}

const handleMouseUp = () => {
  isDraggingProgress.value = false
  isDraggingVolume.value = false
}

// Watchers
watch(selectedPlaylistId, async (newId) => {
  if (newId) {
    isLoadingSongs.value = true
    songs.value = []
    currentSong.value = null
    if (audio.value) {
      audio.value.pause()
      audio.value.src = ''
    }

    try {
      songs.value = await playlistRepository.getSongsInPlaylist(newId)
      if (songs.value.length > 0) {
        playSong(songs.value[0])
      }
    } catch {
      message.error('Failed to load songs')
    } finally {
      isLoadingSongs.value = false
    }
  }
})

// Lifecycle
onMounted(async () => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)

  audio.value = new Audio()
  audio.value.volume = volume.value
  audio.value.addEventListener('timeupdate', () => {
    currentPlayTime.value = audio.value?.currentTime || 0
    if (audio.value && audio.value.buffered.length > 0) {
      buffered.value =
        (audio.value.buffered.end(audio.value.buffered.length - 1) / (audio.value.duration || 1)) *
        100
    }
  })
  audio.value.addEventListener('ended', () => {
    if (repeat.value) {
      playSong(currentSong.value!)
    } else {
      playNextSong()
    }
  })
  audio.value.addEventListener('durationchange', () => {
    totalPlayTime.value = audio.value?.duration || 0
  })
  audio.value.addEventListener('canplay', () => {
    isLoadingSong.value = false
  })
  audio.value.addEventListener('error', () => {
    isLoadingSong.value = false
  })

  try {
    playlists.value = await playlistRepository.getPlaylists()
    if (playlists.value.length > 0 && !selectedPlaylistId.value) {
      selectedPlaylistId.value = playlists.value[0]
    }
  } catch {
    message.error('Failed to load playlists')
  } finally {
    isLoadingPlaylists.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  if (audio.value) {
    audio.value.pause()
    audio.value.src = ''
  }
})
</script>
