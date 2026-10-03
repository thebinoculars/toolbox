<template>
  <div
    class="w-full lg:w-96 rounded-2xl border p-4 flex flex-col overflow-y-auto bg-(--bg-secondary) border-(--border-color)"
  >
    <div class="space-y-4">
      <div class="space-y-3">
        <label class="text-sm font-medium">Text Content</label>
        <textarea
          v-model="settings.lyrics"
          rows="10"
          class="w-full rounded-xl border p-3 text-sm font-mono resize-none outline-none bg-(--bg-primary) text-[#e5e5e5] border-(--border-color)"
          placeholder="Paste your text here..."
        />
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium mb-2">Width (px)</label>
          <n-input-number
            v-model:value="settings.width"
            :min="100"
            :max="4000"
            :step="100"
            @update:value="emit('widthChange', $event)"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Height (px)</label>
          <n-input-number
            v-model:value="settings.height"
            :min="100"
            :max="4000"
            :step="100"
            @update:value="emit('heightChange', $event)"
          />
        </div>
      </div>

      <n-checkbox v-model:checked="settings.maintainAspectRatio">
        Maintain aspect ratio
      </n-checkbox>

      <div>
        <label class="block text-sm font-medium mb-2">Font</label>
        <n-select v-model:value="settings.fontFamily" :options="fontOptions" />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium mb-2">Font size</label>
          <n-slider v-model:value="settings.fontSize" :min="4" :max="100" :step="1" show-input />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Line height</label>
          <n-slider v-model:value="settings.lineHeight" :min="4" :max="100" :step="1" show-input />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium mb-2">Brightness</label>
          <n-slider v-model:value="settings.brightness" :min="0" :max="200" :step="5" show-input />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Contrast</label>
          <n-slider v-model:value="settings.contrast" :min="0" :max="200" :step="5" show-input />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Background color</label>
        <n-color-picker v-model:value="settings.bgColor" :show-alpha="false" />
      </div>

      <div class="flex gap-2 pt-2 justify-center">
        <n-button size="small" :disabled="!hasImage" @click="emit('changeImage')">
          <template #icon
            ><n-icon><Upload /></n-icon
          ></template>
          Change
        </n-button>
        <n-button
          size="small"
          type="warning"
          :loading="isGenerating"
          :disabled="!hasImage"
          @click="emit('generate')"
        >
          <template #icon
            ><n-icon><PlayerPlay /></n-icon
          ></template>
          Generate
        </n-button>
        <n-button size="small" type="success" :disabled="!hasImage" @click="emit('download')">
          <template #icon
            ><n-icon><Download /></n-icon
          ></template>
          Download
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Download, PlayerPlay, Upload } from '@vicons/tabler'

import type { TextArtSettings } from '@/utils/localStorage'

defineProps<{ hasImage: boolean; isGenerating: boolean }>()

const emit = defineEmits<{
  widthChange: [value: number | null]
  heightChange: [value: number | null]
  changeImage: []
  generate: []
  download: []
}>()

const settings = defineModel<TextArtSettings>('settings', { required: true })

const fontOptions = [
  'Arial',
  'Helvetica',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Times New Roman',
  'Georgia',
  'Garamond',
  'Courier New',
  'Courier',
  'Lucida Console',
  'Monaco',
  'Impact',
  'Comic Sans MS',
].map((font) => ({ label: font, value: font }))
</script>
