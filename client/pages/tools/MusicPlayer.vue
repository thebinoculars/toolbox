<template>
  <div class="flex flex-col h-full">
    <ToolToolbar label="Playlist">
      <n-select
        v-if="playlists.length > 0"
        v-model:value="selectedPlaylistId"
        :options="playlistSelectOptions"
        placeholder="Select playlist..."
        size="small"
        class="flex-1"
        :loading="isLoadingPlaylists"
        :disabled="isLoadingSong"
      />
      <span v-else class="text-xs text-gray-500">No playlists</span>
    </ToolToolbar>

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
            <div class="w-8 text-center shrink-0">
              <span v-if="currentSong !== song" class="text-gray-500 group-hover:text-gray-300">{{
                index + 1
              }}</span>
              <div v-else-if="isLoadingSong" class="flex items-center justify-center">
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

    <MusicPlayerBar
      v-if="currentSong"
      :song="currentSong"
      :track-number="songs.indexOf(currentSong) + 1"
      :track-count="songs.length"
      :is-playing="isPlaying"
      :is-loading="isLoadingSong"
      :repeat="repeat"
      :shuffle="shuffle"
      :current-time="currentTime"
      :duration="duration"
      :buffered="buffered"
      :volume="volume"
      :is-muted="isMuted"
      @toggle-repeat="toggleRepeat"
      @previous="playPreviousSong"
      @toggle-play="togglePlayPause"
      @next="playNextSong"
      @toggle-shuffle="toggleShuffle"
      @toggle-mute="toggleMute"
      @seek="seek"
      @volume="setVolume"
    />
  </div>
</template>

<script setup lang="ts">
import MusicPlayerBar from '@/components/tools/MusicPlayer/MusicPlayerBar.vue'
import ToolToolbar from '@/components/tools/ToolToolbar.vue'
import { useLatestRequest } from '@/composables/tools/useLatestRequest'
import { usePlayer } from '@/composables/tools/usePlayer'
import playlistRepository from '@/repositories/playlistRepository'

const message = useMessage()
const playlistRequest = useLatestRequest()

const playlists = ref<string[]>([])
const selectedPlaylistId = ref<string | null>(null)
const songs = ref<string[]>([])
const isLoadingPlaylists = ref(true)
const isLoadingSongs = ref(false)

const scrollToPlayingSong = () => {
  setTimeout(() => {
    const playingElement = document.querySelector('.song-item[data-playing="true"]')
    if (playingElement) {
      playingElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
}

const {
  currentSong,
  isPlaying,
  isLoadingSong,
  currentTime,
  duration,
  buffered,
  volume,
  isMuted,
  shuffle,
  repeat,
  playSong,
  stop,
  togglePlayPause,
  playNextSong,
  playPreviousSong,
  toggleShuffle,
  toggleRepeat,
  toggleMute,
  seek,
  setVolume,
} = usePlayer(songs, {
  resolveUrl: (song) => playlistRepository.getSongUrl(`${selectedPlaylistId.value}/${song}.mp3`),
  onTrackStart: (song) => {
    document.title = song
    scrollToPlayingSong()
  },
})

const playlistSelectOptions = computed(() =>
  playlists.value.map((playlist) => ({ label: playlist, value: playlist })),
)

watch(selectedPlaylistId, async (newId) => {
  if (!newId) return

  const isStale = playlistRequest.start()
  isLoadingSongs.value = true
  songs.value = []
  stop()

  try {
    const playlistSongs = await playlistRepository.getSongsInPlaylist(newId)
    if (isStale()) return
    songs.value = playlistSongs
    if (songs.value.length > 0) {
      playSong(songs.value[0])
    }
  } catch {
    if (!isStale()) {
      message.error('Failed to load songs')
    }
  } finally {
    if (!isStale()) {
      isLoadingSongs.value = false
    }
  }
})

onMounted(async () => {
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
  playlistRequest.invalidate()
})
</script>
