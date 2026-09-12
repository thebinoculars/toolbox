<template>
  <div>
    <div v-if="isLoading" class="flex justify-center py-20">
      <n-spin size="large" />
    </div>

    <div v-else-if="album">
      <div class="space-y-6">
        <div class="flex items-center gap-4 mb-4">
          <n-button circle class="shrink-0" @click="goBack">
            <template #icon
              ><n-icon><ArrowLeft /></n-icon
            ></template>
          </n-button>
          <div class="flex-1">
            <div class="flex items-center">
              <n-h1 class="mb-0! mt-0!">{{ album.name }}</n-h1>
              <n-tag v-if="album.is_private" type="warning" size="small" class="ml-3"
                >Private</n-tag
              >
              <span class="text-gray-500 ml-3 self-center">({{ totalImages }} images)</span>
            </div>
            <p v-if="album.description" class="text-gray-500 mt-1">{{ album.description }}</p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <n-button type="primary" @click="handleUploadClick">
              <template #icon
                ><n-icon><Upload /></n-icon
              ></template>
              Upload
            </n-button>
            <n-select
              v-model:value="sortBy"
              :options="sortOptions"
              :consistent-menu-width="false"
              @update:value="handleSortChange"
            />
            <n-button secondary round class="flex items-center" @click="refreshGallery">
              <template #icon
                ><n-icon class="mr-1"><Refresh /></n-icon
              ></template>
              Refresh
            </n-button>
          </div>
        </div>

        <!-- Hidden file input -->
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*"
          class="hidden"
          @change="handleFileSelect"
        />

        <!-- Upload Loading Overlay -->
        <n-spin :show="isUploading">
          <template #description>
            <span>Uploading {{ uploadingCount }} images...</span>
          </template>

          <!-- Loading State -->
          <div
            v-if="isLoading && images.length === 0"
            class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 py-8"
          >
            <n-skeleton v-for="n in 12" :key="n" height="150px" width="100%" class="rounded-lg" />
          </div>

          <!-- Masonry Gallery -->
          <div
            v-if="images.length > 0"
            class="flex gap-4 min-h-50 w-full"
            :class="{
              'bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-xl p-4': isDragOver,
            }"
            @drop="handleDrop"
            @dragover.prevent="isDragOver = true"
            @dragenter.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
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
                <img :src="image.url" :alt="image.filename" class="w-full h-auto object-cover" />

                <!-- Overlay with actions -->
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

          <!-- Load More Trigger -->
          <div
            v-if="hasMore && images.length > 0"
            ref="loadMoreTrigger"
            class="flex justify-center py-6"
          >
            <n-button :loading="isLoadingMore" type="primary" ghost round @click="loadMore">
              Load more
            </n-button>
          </div>

          <!-- Empty State -->
          <div
            v-if="images.length === 0 && !isLoading"
            class="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-inner mt-8 transition-colors border-2 border-transparent"
            :class="{
              'border-blue-500! bg-blue-500/10!': isDragOver,
              'border-dashed border-gray-300 dark:border-gray-700': !isDragOver,
            }"
            @drop="handleDrop"
            @dragover.prevent="isDragOver = true"
            @dragenter.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
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
          @close="closeSlider"
          @next="nextImage"
          @prev="prevImage"
          @go-to="goToImage"
        />

        <!-- Image Info Modal -->
        <n-modal
          v-if="selectedImageInfo"
          :show="true"
          preset="card"
          title="Image Information"
          class="max-w-md"
          @update:show="closeImageInfoModal"
        >
          <div class="space-y-4">
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-500">File name:</span>
              <span
                class="font-medium max-w-50 truncate"
                :title="selectedImageInfo.filename || 'N/A'"
              >
                {{ truncateText(selectedImageInfo.filename || 'N/A', 20) }}
              </span>
            </div>

            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-500">File size:</span>
              <span class="font-medium">{{ formatFileSize(selectedImageInfo.size) }}</span>
            </div>

            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-500">Format:</span>
              <span class="font-medium">{{
                selectedImageInfo.format?.toUpperCase() || 'N/A'
              }}</span>
            </div>

            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-500">Dimensions:</span>
              <span class="font-medium"
                >{{ selectedImageInfo.width || 0 }} × {{ selectedImageInfo.height || 0 }}</span
              >
            </div>

            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-500">Uploaded at:</span>
              <span class="font-medium">{{ formatDate(selectedImageInfo.created_at) }}</span>
            </div>

            <n-divider class="my-4" />

            <div class="flex space-x-3">
              <n-button
                type="primary"
                block
                class="flex-1 flex items-center"
                @click="downloadImageInfo"
              >
                <template #icon
                  ><n-icon class="mr-1"><Download /></n-icon
                ></template>
                Download
              </n-button>
              <n-button block class="flex-1 flex items-center" @click="copyImageUrl">
                <template #icon
                  ><n-icon class="mr-1"><Link /></n-icon
                ></template>
                Copy URL
              </n-button>
            </div>
          </div>
        </n-modal>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="text-center py-12">
      <div class="mb-4 text-gray-400 flex justify-center">
        <n-icon size="64"><AlertTriangle /></n-icon>
      </div>
      <n-h3>Album not found</n-h3>
      <p class="text-gray-500 mb-6">This album might have been deleted or you don't have access.</p>
      <n-button type="primary" @click="goToAlbums">Back to Albums</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  InfoCircle,
  Link,
  PhotoOff,
  Refresh,
  Trash,
  Upload,
} from '@vicons/tabler'

import ImageSlider from '@/components/admin/ImageSlider.vue'
import albumsRepository from '@/repositories/albumsRepository'
import { copyToClipboard } from '@/utils/clipboard'
import { downloadFile } from '@/utils/download'
import { formatDate, formatFileSize, truncateText } from '@/utils/format'
import { Album, Image } from '~/shared/types'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()

// State
const album = ref<Album | null>(null)
const isLoading = ref(true)
const images = ref<Image[]>([])
const isLoadingMore = ref(false)
const isUploading = ref(false)
const uploadingCount = ref(0)
const isDragOver = ref(false)
const sortBy = ref('newest')
const currentPage = ref(1)
const hasMore = ref(true)
const totalImages = ref(0)
const showSlider = ref(false)
const currentImageIndex = ref(0)
const selectedImageInfo = ref<Image | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const loadMoreTrigger = ref<HTMLElement | null>(null)
const columnCount = ref(6)

let observer: IntersectionObserver | null = null

// Constants
const itemsPerPage = 20
const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Largest', value: 'largest' },
  { label: 'Smallest', value: 'smallest' },
]

// Computed
const masonryColumns = computed(() => {
  const cols: Image[][] = Array.from({ length: columnCount.value }, () => [])
  images.value.forEach((image, index) => {
    cols[index % columnCount.value].push(image)
  })
  return cols
})

// Functions
const loadAlbum = async () => {
  try {
    const data = await albumsRepository.getAlbum(+route.params.id)
    album.value = data
  } catch {
    message.error('Failed to load album!')
  } finally {
    isLoading.value = false
  }
}

const updateColumns = () => {
  const width = window.innerWidth
  if (width >= 1280) {
    columnCount.value = 6
  } else if (width >= 1024) {
    columnCount.value = 5
  } else if (width >= 768) {
    columnCount.value = 4
  } else if (width >= 640) {
    columnCount.value = 3
  } else {
    columnCount.value = 2
  }
}

const loadImages = async (reset = false) => {
  if (reset) {
    isLoading.value = true
    currentPage.value = 1
    images.value = []
  } else {
    isLoadingMore.value = true
  }

  try {
    const data = await albumsRepository.getAlbumImages(
      +route.params.id,
      currentPage.value,
      itemsPerPage,
      sortBy.value,
    )
    if (reset) {
      images.value = data.data || []
    } else {
      images.value.push(...(data.data || []))
    }

    totalImages.value = data.total || 0
    hasMore.value = data.has_more || false
  } catch {
    message.error('Failed to load images!')
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

const loadMore = async () => {
  if (!hasMore.value || isLoadingMore.value) {
    return
  }

  currentPage.value++
  await loadImages(false)
}

const handleSortChange = () => loadImages(true)

const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value?.click()
  }
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement

  if (input.files) {
    uploadFiles(Array.from(input.files))
  }

  input.value = ''
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  if (event.dataTransfer?.files) {
    const imageFiles = Array.from(event.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/'),
    )
    if (imageFiles.length > 0) {
      uploadFiles(imageFiles)
    } else {
      message.error('Please only drag and drop image files!')
    }
  }
}

const uploadFiles = async (files: File[]) => {
  if (files.length === 0) {
    return
  }

  const maxSize = 6 * 1024 * 1024
  const validFiles = files.filter((f) => {
    if (f.size > maxSize) {
      message.error(`File ${f.name} is too large (max 6MB)`)
      return false
    }
    return true
  })

  if (validFiles.length === 0) {
    return
  }

  isUploading.value = true
  uploadingCount.value = validFiles.length
  let successCount = 0

  try {
    for (const file of validFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('albumId', (+route.params.id).toString())
        await albumsRepository.uploadImage(+route.params.id, formData)
        successCount++
      } catch {
        message.error(`Failed to upload ${file.name}`)
      }
    }

    if (successCount > 0) {
      message.success(`Successfully uploaded ${successCount} images!`)
      await loadImages(true)
    }
  } finally {
    isUploading.value = false
    uploadingCount.value = 0
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
        await albumsRepository.deleteImage(+route.params.id, imageId)
        images.value = images.value.filter((image) => image.id !== imageId)
        totalImages.value--
        message.success('Image deleted!')
      } catch {
        message.error('Failed to delete image!')
        return false
      }
    },
  })
}

const downloadImage = async (image: Image) => {
  try {
    message.success('Downloading...')
    await downloadFile(image.url, image.filename)
  } catch {
    message.error('Failed to download!')
  }
}

const showImageInfo = (image: Image) => (selectedImageInfo.value = image)

const closeImageInfoModal = (value: boolean) => {
  if (!value) {
    selectedImageInfo.value = null
  }
}

const downloadImageInfo = async () => {
  if (!selectedImageInfo.value) return
  try {
    message.success('Downloading...')
    await downloadFile(selectedImageInfo.value.url, selectedImageInfo.value.filename)
  } catch {
    message.error('Failed to download!')
  }
}

const copyImageUrl = async () => {
  if (!selectedImageInfo.value) return
  try {
    await copyToClipboard(selectedImageInfo.value.url)
    message.success('URL copied!')
  } catch {
    message.error('Failed to copy URL!')
  }
}

const openSlider = (image: Image) => {
  const index = images.value.findIndex((img) => img.id === image.id)
  currentImageIndex.value = index
  showSlider.value = true
}

const closeSlider = () => (showSlider.value = false)

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

const goToImage = (index: number) => (currentImageIndex.value = index)

const refreshGallery = () => loadImages(true)

const handleUploadClick = () => triggerFileInput()

const goToAlbums = () => router.push('/admin/albums')

const goBack = () => router.back()

// Lifecycle
onMounted(async () => {
  await loadAlbum()
  updateColumns()
  window.addEventListener('resize', updateColumns)

  loadImages(true)

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !isLoadingMore.value) {
        loadMore()
      }
    },
    { rootMargin: '200px' },
  )

  setTimeout(() => {
    if (loadMoreTrigger.value) {
      observer?.observe(loadMoreTrigger.value)
    }
  }, 1000)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateColumns)

  if (observer) {
    observer.disconnect()
  }
})
</script>
