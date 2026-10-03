import {
  getNesEmulatorSettings,
  type NesPadKey,
  setNesEmulatorSettings,
} from '@/utils/localStorage'

export const NES_PAD_KEYS: NesPadKey[] = [
  'UP',
  'DOWN',
  'LEFT',
  'RIGHT',
  'A',
  'B',
  'C',
  'D',
  'SELECT',
  'START',
]

export const NES_MIN_SPEED = 5
export const NES_MAX_SPEED = 20

export type NesPad = Record<NesPadKey, string>

const NES_SCREEN_WIDTH = 256
const NES_SCREEN_HEIGHT = 240

const mergePad = (target: NesPad, source: Partial<NesPad> | undefined) => {
  if (!source) return
  for (const key of NES_PAD_KEYS) {
    const code = source[key]
    if (typeof code === 'string') target[key] = code
  }
}

export const useNesSettings = () => {
  const volume = ref(50)
  const size = ref(3)
  const speed = ref(10)
  const pad1 = ref<NesPad>({
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
  const pad2 = ref<NesPad>({
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

  const width = computed(() => Math.round(size.value * NES_SCREEN_WIDTH))
  const height = computed(() => Math.round(size.value * NES_SCREEN_HEIGHT))

  const load = () => {
    const saved = getNesEmulatorSettings()
    if (!saved) return

    if (typeof saved.volume === 'number') volume.value = saved.volume
    if (typeof saved.speed === 'number') {
      speed.value = Math.min(NES_MAX_SPEED, Math.max(NES_MIN_SPEED, saved.speed))
    }
    mergePad(pad1.value, saved.pad1)
    mergePad(pad2.value, saved.pad2)
    if (typeof saved.size === 'number' && saved.size > 0) {
      size.value = saved.size
    }
  }

  const persist = () => {
    setNesEmulatorSettings({
      volume: volume.value,
      size: size.value,
      speed: speed.value,
      pad1: pad1.value,
      pad2: pad2.value,
    })
  }

  watch([volume, size, speed, pad1, pad2], persist, { deep: true })

  onMounted(load)

  return { volume, size, speed, pad1, pad2, width, height }
}
