<template>
  <div class="flex flex-col h-full">
    <ToolToolbar label="Game">
      <n-select
        v-model:value="playingId"
        :options="gameOptions"
        placeholder="Select a game..."
        class="w-48"
        size="small"
        @update:value="handleSelectGame"
      />
    </ToolToolbar>

    <div class="flex-1 overflow-y-auto p-5">
      <div v-if="listLoading" class="min-h-100 flex justify-center items-center">
        <n-spin size="large" />
      </div>

      <template v-else>
        <n-spin :show="gameLoading" class="min-h-50 flex justify-center items-center">
          <div v-if="romUrl" class="w-full flex flex-col items-center gap-3">
            <NesVue
              ref="nesRef"
              :key="playingId || romUrl"
              :url="romUrl"
              :turbo="speed"
              :gain="volume"
              :width="width"
              :height="height"
              :p1="pad1"
              :p2="pad2"
              @success="onStarted"
            />
            <div class="flex flex-wrap justify-center gap-1">
              <TooltipButton
                v-for="control in controls"
                :key="control.id"
                :icon="control.icon"
                :label="control.label"
                size="small"
                quaternary
                circle
                :disabled="!started"
                @click="control.action"
              />
            </div>
          </div>
        </n-spin>
      </template>
    </div>

    <NesSettingsModal
      v-model:show="settingsOpen"
      v-model:size="size"
      v-model:volume="volume"
      v-model:speed="speed"
      v-model:pad1="pad1"
      v-model:pad2="pad2"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Camera,
  DeviceFloppy,
  Folder,
  PlayerPause,
  PlayerPlay,
  RotateClockwise,
  Settings,
  Square,
} from '@vicons/tabler'
import { nes, NesVue } from 'nes-vue'

import NesSettingsModal from '@/components/tools/NesEmulator/NesSettingsModal.vue'
import TooltipButton from '@/components/tools/TooltipButton.vue'
import ToolToolbar from '@/components/tools/ToolToolbar.vue'
import { useNesSettings } from '@/composables/tools/useNesSettings'
import nesRepository from '@/repositories/nesRepository'
import type { NesGame } from '~/shared/types'

const message = useMessage()

const SCROLL_KEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

const { volume, size, speed, pad1, pad2, width, height } = useNesSettings()

const games = ref<NesGame[]>([])
const listLoading = ref(true)
const playingId = ref<number | null>(null)
const activeName = ref('')
const romUrl = ref<string | null>(null)
const gameLoading = ref(false)
const settingsOpen = ref(false)
const nesRef = ref<InstanceType<typeof NesVue> | null>(null)
const started = ref(false)
const paused = ref(false)

const gameOptions = computed(() => games.value.map((g) => ({ label: g.name, value: g.id })))

const runSafely = (action: () => void) => {
  try {
    action()
  } catch {
    /* ignore */
  }
}

const handleReset = () =>
  runSafely(() => {
    nesRef.value?.reset()
    started.value = true
    paused.value = false
  })

const handleStop = () =>
  runSafely(() => {
    nesRef.value?.stop()
    started.value = false
    paused.value = false
  })

const handlePauseOrResume = () =>
  runSafely(() => {
    if (paused.value) {
      nesRef.value?.play()
    } else {
      nesRef.value?.pause()
    }
    paused.value = !paused.value
  })

const controls = computed(() => [
  { id: 'reset', label: 'Reset', icon: RotateClockwise, action: handleReset },
  { id: 'stop', label: 'Stop', icon: Square, action: handleStop },
  {
    id: 'pause',
    label: paused.value ? 'Resume' : 'Pause',
    icon: paused.value ? PlayerPlay : PlayerPause,
    action: handlePauseOrResume,
  },
  {
    id: 'save',
    label: 'Save state',
    icon: DeviceFloppy,
    action: () => runSafely(() => nesRef.value?.save(activeName.value)),
  },
  {
    id: 'load',
    label: 'Load state',
    icon: Folder,
    action: () => runSafely(() => nesRef.value?.load(activeName.value)),
  },
  {
    id: 'screenshot',
    label: 'Screenshot',
    icon: Camera,
    action: () => runSafely(() => nesRef.value?.screenshot(true)),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    action: () => {
      settingsOpen.value = true
    },
  },
])

const loadList = async () => {
  listLoading.value = true
  try {
    const data = await nesRepository.getGames()
    if (!Array.isArray(data)) {
      throw new Error('Invalid response')
    }
    games.value = data
    if (games.value.length > 0) {
      handleSelectGame(games.value[0].id)
    }
  } catch {
    message.error('Failed to load games')
  } finally {
    listLoading.value = false
  }
}

const handleSelectGame = async (id: number) => {
  const game = games.value.find((g) => g.id === id)
  if (!game) {
    message.error('Selected game not found')
    return
  }
  romUrl.value = null
  playingId.value = id
  gameLoading.value = true
  started.value = false
  paused.value = false

  await nextTick()

  // nes-vue keeps a singleton NES that only parses a ROM when none is cached,
  // so clear it to force the next game's ROM to be loaded
  const nesCore = nes as unknown as { rom: unknown; romData: unknown }
  nesCore.rom = null
  nesCore.romData = null

  try {
    const data = await nesRepository.getGameUrl(id)
    if (data) {
      romUrl.value = data
      activeName.value = game.name
    }
  } catch {
    message.error('Failed to load game or ROM')
  } finally {
    gameLoading.value = false
  }
}

const onStarted = () => {
  started.value = true
  paused.value = false
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (SCROLL_KEYS.includes(e.code)) {
    e.preventDefault()
    const el = document.activeElement
    if (el?.classList.contains('keymap')) {
      el.dispatchEvent(new KeyboardEvent('keypress', { code: e.code }))
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown, true)
  loadList()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown, true)
})
</script>
