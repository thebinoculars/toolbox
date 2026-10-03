<template>
  <n-modal
    v-model:show="show"
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
            :disabled="size <= SCALES[0]"
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
            :disabled="size >= SCALES[SCALES.length - 1]"
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
        <n-slider v-model:value="speed" :min="NES_MIN_SPEED" :max="NES_MAX_SPEED" :step="1" />
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
              <tr v-for="key in NES_PAD_KEYS" :key="key">
                <td class="py-1 pr-2 align-middle">{{ key }}</td>
                <td class="py-1 pr-1 align-middle">
                  <n-input
                    readonly
                    size="tiny"
                    class="keymap text-xs!"
                    :value="pad1[key]"
                    @keydown.prevent="pad1 = withKey(pad1, key, $event)"
                  />
                </td>
                <td class="py-1 align-middle">
                  <n-input
                    readonly
                    size="tiny"
                    class="keymap text-xs!"
                    :value="pad2[key]"
                    @keydown.prevent="pad2 = withKey(pad2, key, $event)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { Minus, Plus } from '@vicons/tabler'

import {
  NES_MAX_SPEED,
  NES_MIN_SPEED,
  NES_PAD_KEYS,
  type NesPad,
} from '@/composables/tools/useNesSettings'
import type { NesPadKey } from '@/utils/localStorage'

const SCALES: number[] = []
for (let i = 1; i <= 5; i += 0.5) {
  SCALES.push(Number(i.toFixed(1)))
}

const show = defineModel<boolean>('show', { required: true })
const size = defineModel<number>('size', { required: true })
const volume = defineModel<number>('volume', { required: true })
const speed = defineModel<number>('speed', { required: true })
const pad1 = defineModel<NesPad>('pad1', { required: true })
const pad2 = defineModel<NesPad>('pad2', { required: true })

const withKey = (pad: NesPad, key: NesPadKey, e: KeyboardEvent): NesPad => ({
  ...pad,
  [key]: e.code,
})

const handleResizeScale = (delta: number) => {
  const idx = SCALES.findIndex((s) => s === size.value)
  const next = SCALES[idx + delta]
  if (idx !== -1 && next !== undefined) {
    size.value = next
  }
}
</script>
