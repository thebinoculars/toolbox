<template>
  <div class="flex flex-col h-full">
    <div
      class="border-b px-3 py-2 flex items-center gap-2 shrink-0 bg-[#2a2a2e] border-(--border-color)"
    >
      <span class="text-xs font-medium text-(--icon-color)">Game</span>
      <n-select
        v-model:value="playingId"
        :options="gameOptions"
        :loading="listLoading"
        placeholder="Select a game..."
        class="w-48"
        size="small"
        @update:value="handleSelectGame"
      />
    </div>

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
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    quaternary
                    circle
                    :disabled="!started"
                    @click="handleReset"
                  >
                    <template #icon>
                      <n-icon><RotateClockwise /></n-icon>
                    </template>
                  </n-button>
                </template>
                Reset
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button size="small" quaternary circle :disabled="!started" @click="handleStop">
                    <template #icon>
                      <n-icon><Square /></n-icon>
                    </template>
                  </n-button>
                </template>
                Stop
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    quaternary
                    circle
                    :disabled="!started"
                    @click="handlePauseOrResume"
                  >
                    <template #icon>
                      <n-icon>
                        <component :is="paused ? PlayerPlay : PlayerPause" />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                {{ paused ? 'Resume' : 'Pause' }}
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    quaternary
                    circle
                    :disabled="!started"
                    @click="handleSaveState"
                  >
                    <template #icon>
                      <n-icon><DeviceFloppy /></n-icon>
                    </template>
                  </n-button>
                </template>
                Save state
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    quaternary
                    circle
                    :disabled="!started"
                    @click="handleLoadState"
                  >
                    <template #icon>
                      <n-icon><Folder /></n-icon>
                    </template>
                  </n-button>
                </template>
                Load state
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    quaternary
                    circle
                    :disabled="!started"
                    @click="handleScreenshot"
                  >
                    <template #icon>
                      <n-icon><Camera /></n-icon>
                    </template>
                  </n-button>
                </template>
                Screenshot
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    quaternary
                    circle
                    :disabled="!started"
                    @click="settingsOpen = true"
                  >
                    <template #icon>
                      <n-icon><Settings /></n-icon>
                    </template>
                  </n-button>
                </template>
                Settings
              </n-tooltip>
            </div>
          </div>
        </n-spin>
      </template>
    </div>

    <n-modal
      v-model:show="settingsOpen"
      preset="card"
      title="Emulator settings"
      class="max-w-md w-full"
      closable
    >
      <div class="flex flex-col gap-4">
        <div>
          <div class="text-sm font-medium mb-2">Size</div>
          <div class="flex items-center gap-2">
            <n-button
              size="small"
              quaternary
              circle
              :disabled="size <= scales[0]"
              @click="handleResizeScale(-1)"
            >
              <template #icon>
                <n-icon><Minus /></n-icon>
              </template>
            </n-button>
            <span class="text-sm tabular-nums min-w-12 text-center">{{ size }}×</span>
            <n-button
              size="small"
              quaternary
              circle
              :disabled="size >= scales[scales.length - 1]"
              @click="handleResizeScale(1)"
            >
              <template #icon>
                <n-icon><Plus /></n-icon>
              </template>
            </n-button>
          </div>
        </div>

        <n-divider class="my-0" />

        <div>
          <div class="text-sm font-medium mb-2">Volume</div>
          <n-slider v-model:value="volume" :min="0" :max="100" :step="1" />
        </div>

        <n-divider class="my-0" />

        <div>
          <div class="text-sm font-medium mb-2">Speed</div>
          <n-slider v-model:value="speed" :min="5" :max="20" :step="1" />
        </div>

        <n-divider class="my-0" />

        <div>
          <div class="text-sm font-medium mb-2">Keys</div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th class="text-left py-1 pr-2 w-14 font-medium">Button</th>
                  <th class="text-left py-1 pr-2 font-medium">P1</th>
                  <th class="text-left py-1 font-medium">P2</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="key in padKeys" :key="key">
                  <td class="py-1 pr-2 align-middle">{{ key }}</td>
                  <td class="py-1 pr-1 align-middle">
                    <n-input
                      readonly
                      size="tiny"
                      class="keymap text-xs!"
                      :value="pad1[key]"
                      @keydown.prevent="handleMapPad1($event, key)"
                    />
                  </td>
                  <td class="py-1 align-middle">
                    <n-input
                      readonly
                      size="tiny"
                      class="keymap text-xs!"
                      :value="pad2[key]"
                      @keydown.prevent="handleMapPad2($event, key)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import {
  Camera,
  DeviceFloppy,
  Folder,
  Minus,
  PlayerPause,
  PlayerPlay,
  Plus,
  RotateClockwise,
  Settings,
  Square,
} from '@vicons/tabler'
import { NesVue } from 'nes-vue'

import nesRepository from '@/repositories/nesRepository'
import { getNesEmulatorSettings, setNesEmulatorSettings } from '@/utils/localStorage'
import type { NesGame } from '~/shared/types'

const message = useMessage()

type NesPadKey = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'A' | 'B' | 'C' | 'D' | 'SELECT' | 'START'

const padKeys: NesPadKey[] = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'A', 'B', 'C', 'D', 'SELECT', 'START']

const scales: number[] = []
for (let i = 1; i <= 5; i += 0.5) {
  scales.push(Number(i.toFixed(1)))
}

// State
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
const volume = ref(50)
const size = ref(3)
const speed = ref(10)
const pad1 = ref<Record<NesPadKey, string>>({
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  A: 'Numpad2',
  B: 'Numpad1',
  C: 'Numpad5',
  D: 'Numpad4',
  SELECT: 'Space',
  START: 'Enter',
})
const pad2 = ref<Record<NesPadKey, string>>({
  UP: 'KeyW',
  DOWN: 'KeyS',
  LEFT: 'KeyA',
  RIGHT: 'KeyD',
  A: 'KeyK',
  B: 'KeyJ',
  C: 'KeyI',
  D: 'KeyU',
  SELECT: 'KeyO',
  START: 'KeyP',
})

// Computed
const gameOptions = computed(() => {
  return games.value.map((g) => ({
    label: g.name,
    value: g.id,
  }))
})

const width = computed(() => Math.round(size.value * 256))
const height = computed(() => Math.round(size.value * 240))

// Watch
watch([volume, size, speed, pad1, pad2], persistSettings, { deep: true })

// Functions
function loadPersistedSettings() {
  try {
    const parsed = getNesEmulatorSettings()
    if (!parsed) {
      return
    }
    if (typeof parsed.volume === 'number') volume.value = parsed.volume
    if (typeof parsed.speed === 'number') speed.value = Math.min(20, Math.max(5, parsed.speed))
    if (parsed.pad1) {
      for (const k of padKeys) {
        if (typeof parsed.pad1[k] === 'string') pad1.value[k] = parsed.pad1[k]!
      }
    }
    if (parsed.pad2) {
      for (const k of padKeys) {
        if (typeof parsed.pad2[k] === 'string') pad2.value[k] = parsed.pad2[k]!
      }
    }
    if (parsed.size) {
      size.value = parsed.size
    }
  } catch {
    /* ignore */
  }
}

function persistSettings() {
  try {
    setNesEmulatorSettings({
      volume: volume.value,
      size: size.value,
      speed: speed.value,
      pad1: pad1.value,
      pad2: pad2.value,
    })
  } catch {
    /* ignore */
  }
}

const handleResizeScale = (delta: number) => {
  const idx = scales.findIndex((s) => s === size.value)
  const next = idx + delta
  if (idx !== -1 && scales[next] !== undefined) {
    size.value = scales[next]!
  }
}

const handleMapPad1 = (e: KeyboardEvent, key: NesPadKey) => {
  pad1.value = { ...pad1.value, [key]: e.code }
}

const handleMapPad2 = (e: KeyboardEvent, key: NesPadKey) => {
  pad2.value = { ...pad2.value, [key]: e.code }
}

const loadList = async () => {
  listLoading.value = true
  try {
    const data = await nesRepository.getGames()
    if (Array.isArray(data)) {
      games.value = data
      if (games.value.length > 0) {
        handleSelectGame(games.value[0].id)
      }
    } else {
      throw new Error('Invalid response')
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

const handleReset = () => {
  try {
    nesRef.value?.reset()
    started.value = true
    paused.value = false
  } catch {
    /* ignore */
  }
}

const handleStop = () => {
  try {
    nesRef.value?.stop()
    started.value = false
    paused.value = false
  } catch {
    /* ignore */
  }
}

const handlePauseOrResume = () => {
  try {
    if (paused.value) {
      nesRef.value?.play()
    } else {
      nesRef.value?.pause()
    }
    paused.value = !paused.value
  } catch {
    /* ignore */
  }
}

const handleSaveState = () => {
  try {
    nesRef.value?.save(activeName.value)
  } catch {
    /* ignore */
  }
}

const handleLoadState = () => {
  try {
    nesRef.value?.load(activeName.value)
  } catch {
    /* ignore */
  }
}

const handleScreenshot = () => {
  try {
    nesRef.value?.screenshot(true)
  } catch {
    /* ignore */
  }
}

const handleKeyDown = (e: Event) => {
  if (!(e instanceof KeyboardEvent)) {
    return
  }
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault()
    const el = document.activeElement
    if (el?.classList.contains('keymap')) {
      el.dispatchEvent(new KeyboardEvent('keypress', { code: e.code }))
    }
  }
}

// Lifecycle
onMounted(() => {
  loadPersistedSettings()
  window.addEventListener('keydown', handleKeyDown, true)
  loadList()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown, true)
})
</script>
