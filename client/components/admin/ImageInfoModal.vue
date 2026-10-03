<template>
  <n-modal
    v-if="image"
    :show="true"
    preset="card"
    title="Image Information"
    class="max-w-md"
    @update:show="handleUpdateShow"
  >
    <div class="space-y-4">
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500">File name:</span>
        <span class="font-medium max-w-50 truncate" :title="image.filename || 'N/A'">
          {{ truncateText(image.filename || 'N/A', 20) }}
        </span>
      </div>

      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500">File size:</span>
        <span class="font-medium">{{ formatFileSize(image.size) }}</span>
      </div>

      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500">Format:</span>
        <span class="font-medium">{{ image.format?.toUpperCase() || 'N/A' }}</span>
      </div>

      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500">Dimensions:</span>
        <span class="font-medium">{{ image.width || 0 }} × {{ image.height || 0 }}</span>
      </div>

      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500">Uploaded at:</span>
        <span class="font-medium">{{ formatDate(image.created_at) }}</span>
      </div>

      <n-divider class="my-4" />

      <div class="flex space-x-3">
        <n-button
          type="primary"
          block
          class="flex-1 flex items-center"
          @click="downloadImage(image)"
        >
          <template #icon
            ><n-icon class="mr-1"><Download /></n-icon
          ></template>
          Download
        </n-button>
        <n-button block class="flex-1 flex items-center" @click="copyImageUrl(image)">
          <template #icon
            ><n-icon class="mr-1"><Link /></n-icon
          ></template>
          Copy URL
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { Download, Link } from '@vicons/tabler'

import { useImageActions } from '@/composables/admin/useImageActions'
import { formatDate, formatFileSize, truncateText } from '@/utils/format'
import type { Image } from '~/shared/types'

defineProps<{ image: Image | null }>()

const emit = defineEmits<{ close: [] }>()

const { downloadImage, copyImageUrl } = useImageActions()

const handleUpdateShow = (value: boolean) => {
  if (!value) {
    emit('close')
  }
}
</script>
