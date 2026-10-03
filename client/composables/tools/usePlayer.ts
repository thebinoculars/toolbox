import type { Ref } from 'vue'

import { useLatestRequest } from '@/composables/tools/useLatestRequest'
import {
  getMusicPlayerRepeat,
  getMusicPlayerShuffle,
  getMusicPlayerVolume,
  setMusicPlayerRepeat,
  setMusicPlayerShuffle,
  setMusicPlayerVolume,
} from '@/utils/localStorage'

interface PlayerOptions {
  resolveUrl: (song: string) => Promise<string>
  onTrackStart?: (song: string) => void
}

export const usePlayer = (songs: Ref<string[]>, { resolveUrl, onTrackStart }: PlayerOptions) => {
  const message = useMessage()
  const songRequest = useLatestRequest()

  const audio = shallowRef<HTMLAudioElement | null>(null)
  const currentSong = ref<string | null>(null)
  const isPlaying = ref(false)
  const isLoadingSong = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const buffered = ref(0)
  const volume = ref(getMusicPlayerVolume())
  const isMuted = ref(false)
  const shuffle = ref(getMusicPlayerShuffle())
  const repeat = ref(getMusicPlayerRepeat())
  const played = ref<number[]>([])

  const currentIndex = () => songs.value.findIndex((s) => s === currentSong.value)

  const startPlayback = async () => {
    if (!audio.value) return
    try {
      await audio.value.play()
    } catch (error) {
      // AbortError just means a newer src/pause interrupted this play() call.
      if (error instanceof DOMException && error.name === 'AbortError') return
      message.warning('Playback was blocked by the browser. Press play to start.')
    }
  }

  const markPlayed = (song: string) => {
    const index = songs.value.indexOf(song)
    if (index !== -1 && !played.value.includes(index)) {
      played.value.push(index)
    }
  }

  const playSong = async (song: string) => {
    if (isLoadingSong.value || currentSong.value === song || !audio.value) {
      return
    }

    const isStale = songRequest.start()
    isLoadingSong.value = true
    currentSong.value = song
    try {
      const url = await resolveUrl(song)
      if (isStale() || !audio.value) return
      audio.value.src = url
      markPlayed(song)
      onTrackStart?.(song)
      await startPlayback()
    } catch {
      if (isStale()) return
      message.error('Failed to play song')
      isLoadingSong.value = false
    }
  }

  const unloadAudio = () => {
    if (audio.value) {
      audio.value.pause()
      audio.value.removeAttribute('src')
      audio.value.load()
    }
  }

  const stop = () => {
    songRequest.invalidate()
    isLoadingSong.value = false
    played.value = []
    currentSong.value = null
    unloadAudio()
  }

  const togglePlayPause = () => {
    if (!audio.value) return
    if (audio.value.paused) {
      startPlayback()
    } else {
      audio.value.pause()
    }
  }

  const generateRandomIndex = (): number => {
    const index = currentIndex()
    const allIndexes = songs.value.map((_, i) => i).filter((i) => i !== index)
    if (allIndexes.length === 0) {
      return Math.max(index, 0)
    }

    let candidates = allIndexes.filter((i) => !played.value.includes(i))
    if (candidates.length === 0) {
      played.value = index === -1 ? [] : [index]
      candidates = allIndexes
    }
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  const playNextSong = () => {
    if (!currentSong.value || songs.value.length === 0) return

    let nextIndex: number
    if (shuffle.value) {
      nextIndex = generateRandomIndex()
    } else {
      const index = currentIndex()
      nextIndex = index !== -1 && index < songs.value.length - 1 ? index + 1 : 0
    }

    playSong(songs.value[nextIndex])
  }

  const playPreviousSong = () => {
    if (!currentSong.value || songs.value.length === 0) return

    const index = currentIndex()
    playSong(songs.value[index > 0 ? index - 1 : songs.value.length - 1])
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

  const toggleMute = () => {
    if (audio.value) {
      audio.value.muted = !audio.value.muted
      isMuted.value = audio.value.muted
    }
  }

  const seek = (fraction: number) => {
    if (audio.value && duration.value) {
      audio.value.currentTime = fraction * duration.value
    }
  }

  const setVolume = (newVolume: number) => {
    if (audio.value) {
      audio.value.volume = newVolume
      volume.value = newVolume
      setMusicPlayerVolume(newVolume)
      if (newVolume > 0) isMuted.value = false
    }
  }

  onMounted(() => {
    const el = new Audio()
    audio.value = el
    el.volume = volume.value
    el.addEventListener('timeupdate', () => {
      currentTime.value = el.currentTime || 0
      if (el.buffered.length > 0) {
        buffered.value = (el.buffered.end(el.buffered.length - 1) / (el.duration || 1)) * 100
      }
    })
    el.addEventListener('play', () => {
      isPlaying.value = true
    })
    el.addEventListener('pause', () => {
      isPlaying.value = false
    })
    el.addEventListener('ended', () => {
      if (repeat.value) {
        el.currentTime = 0
        startPlayback()
      } else {
        playNextSong()
      }
    })
    el.addEventListener('durationchange', () => {
      duration.value = el.duration || 0
    })
    el.addEventListener('canplay', () => {
      isLoadingSong.value = false
    })
    el.addEventListener('error', () => {
      isLoadingSong.value = false
    })
  })

  onUnmounted(() => {
    songRequest.invalidate()
    unloadAudio()
  })

  return {
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
  }
}
