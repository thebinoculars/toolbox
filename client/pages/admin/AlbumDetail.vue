<template>
  <div>
    <div v-if="isLoading" class="flex justify-center py-20">
      <n-spin size="large" />
    </div>

    <div v-else-if="album">
      <div class="space-y-6">
        <div class="flex items-center gap-4 mb-4">
          <n-button circle class="shrink-0" aria-label="Go back" @click="router.back()">
            <template #icon
              ><n-icon><ArrowLeft /></n-icon
            ></template>
          </n-button>
          <div class="flex-1">
            <div class="flex items-center">
              <n-h1 class="mb-0! mt-0!">{{ album.name }}</n-h1>
              <span class="text-gray-500 ml-3 self-center">({{ totalImages }} images)</span>
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <n-button type="primary" @click="triggerFileInput">
              <template #icon
                ><n-icon><Upload /></n-icon
              ></template>
              Upload
            </n-button>
            <n-select
              v-model:value="sortBy"
              :options="sortOptions"
              :consistent-menu-width="false"
              @update:value="loadImages(true)"
            />
            <n-button secondary round class="flex items-center" @click="loadImages(true)">
              <template #icon
                ><n-icon class="mr-1"><Refresh /></n-icon
              ></template>
              Refresh
            </n-button>
          </div>
        </div>

        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*"
          class="hidden"
          @change="handleFileSelect"
        />

        <n-spin :show="isUploading">
          <template #description>
            <span>Uploading {{ uploadingCount }} images...</span>
          </template>

          <div
            v-if="isLoadingImages && images.length === 0"
            class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 py-8"
          >
            <n-skeleton v-for="n in 12" :key="n" height="150px" width="100%" class="rounded-lg" />
          </div>

          <div
            v-if="images.length > 0"
            class="flex gap-4 min-h-50 w-full"
            :class="{
              'bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-xl p-4': isDragOver,
            }"
            v-on="dropZoneHandlers"
          >
            <div
              v-for="(column, colIndex) in masonryColumns"
              :key="colIndex"
              class="flex-1 flex flex-col gap-4"
            >
              <div
                v-for="image in column"
                :key="image.id"
                class="block w-full relative group cursor-pointer overflow-hidden rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                @click="openSlider(image)"
              >
                <img
                  :src="image.url"
                  :alt="image.filename"
                  loading="lazy"
                  class="w-full h-auto object-cover bg-gray-200 dark:bg-gray-700"
                  :style="{ aspectRatio: `1 / ${getImageRatio(image)}` }"
                />

                <div
                  class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2"
                >
                  <n-button circle size="small" title="Download" @click.stop="downloadImage(image)">
                    <template #icon
                      ><n-icon><Download /></n-icon
                    ></template>
                  </n-button>
                  <n-button circle size="small" title="Info" @click.stop="showImageInfo(image)">
                    <template #icon
                      ><n-icon><InfoCircle /></n-icon
                    ></template>
                  </n-button>
                  <n-button
                    circle
                    size="small"
                    type="error"
                    title="Delete"
                    @click.stop="handleDeleteImage(image.id)"
                  >
                    <template #icon
                      ><n-icon><Trash /></n-icon
                    ></template>
                  </n-button>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="hasMore && images.length > 0"
            ref="loadMoreTrigger"
            class="flex justify-center py-6"
          >
            <n-button :loading="isLoadingMore" type="primary" ghost round @click="loadMore">
              Load more
            </n-button>
          </div>

          <div
            v-if="images.length === 0 && !isLoadingImages"
            class="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-inner mt-8 transition-colors border-2 border-transparent"
            :class="{
              'border-blue-500! bg-blue-500/10!': isDragOver,
              'border-dashed border-gray-300 dark:border-gray-700': !isDragOver,
            }"
            v-on="dropZoneHandlers"
          >
            <div class="text-gray-400 mb-4 text-center mx-auto w-min flex justify-center">
              <n-icon size="64">
                <Upload v-if="isDragOver" />
                <PhotoOff v-else />
              </n-icon>
            </div>
            <n-h3 class="mb-2">{{ isDragOver ? 'Drop images here' : 'No images yet' }}</n-h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">
              {{ isDragOver ? 'Release to upload' : 'Upload or drag & drop your first images!' }}
            </p>
            <n-button type="primary" size="large" round @click="triggerFileInput">
              Upload Images
            </n-button>
          </div>
        </n-spin>

        <ImageSlider
          v-if="showSlider"
          :images="images"
          :current-index="currentImageIndex"
          @close="showSlider = false"
          @next="nextImage"
          @prev="prevImage"
          @go-to="currentImageIndex = $event"
        />

        <ImageInfoModal :image="selectedImageInfo" @close="selectedImageInfo = null" />
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div class="mb-4 text-gray-400 flex justify-center">
        <n-icon size="64"><AlertTriangle /></n-icon>
      </div>
      <n-h3>Album not found</n-h3>
      <p class="text-gray-500 mb-6">This album might have been deleted or you don't have access.</p>
      <n-button type="primary" @click="router.push('/admin/albums')">Back to Albums</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  InfoCircle,
  PhotoOff,
  Refresh,
  Trash,
  Upload,
} from '@vicons/tabler'

import ImageInfoModal from '@/components/admin/ImageInfoModal.vue'
import ImageSlider from '@/components/admin/ImageSlider.vue'
import { useAlbumImages } from '@/composables/admin/useAlbumImages'
import { useImageActions } from '@/composables/admin/useImageActions'
import { useImageUpload } from '@/composables/admin/useImageUpload'
import { getImageRatio, useMasonryColumns } from '@/composables/admin/useMasonryColumns'
import albumRepository from '@/repositories/albumRepository'
import type { Album, Image } from '~/shared/types'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()

const albumId = computed(() => +route.params.id)
const album = ref<Album | null>(null)
const isLoading = ref(true)
const sortBy = ref('newest')
const showSlider = ref(false)
const currentImageIndex = ref(0)
const selectedImageInfo = ref<Image | null>(null)

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Largest', value: 'largest' },
  { label: 'Smallest', value: 'smallest' },
]

const {
  images,
  totalImages,
  hasMore,
  isLoadingImages,
  isLoadingMore,
  loadImages,
  loadMore,
  removeImage,
} = useAlbumImages(albumId, sortBy)

const {
  isUploading,
  uploadingCount,
  isDragOver,
  triggerFileInput,
  handleFileSelect,
  dropZoneHandlers,
} = useImageUpload(albumId, () => loadImages(true))

const masonryColumns = useMasonryColumns(images)

const { downloadImage } = useImageActions()

const loadAlbum = async () => {
  try {
    album.value = await albumRepository.getAlbum(albumId.value)
  } catch {
    message.error('Failed to load album!')
  } finally {
    isLoading.value = false
  }
}

const handleDeleteImage = (imageId: number) => {
  const dialogInstance = dialog.warning({
    title: 'Delete Image',
    content: 'Are you sure you want to delete this image?',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      dialogInstance.loading = true
      try {
        await albumRepository.deleteImage(albumId.value, imageId)
        removeImage(imageId)
        message.success('Image deleted!')
      } catch {
        message.error('Failed to delete image!')
        return false
      }
    },
  })
}

const showImageInfo = (image: Image) => (selectedImageInfo.value = image)

const openSlider = (image: Image) => {
  currentImageIndex.value = images.value.findIndex((img) => img.id === image.id)
  showSlider.value = true
}

const nextImage = () => {
  if (currentImageIndex.value < images.value.length - 1) {
    currentImageIndex.value++
  }
}

const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

onMounted(async () => {
  await loadAlbum()
  loadImages(true)
})
</script>
