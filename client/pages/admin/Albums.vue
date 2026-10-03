<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <n-h1 class="flex-1 mb-0! mt-0!">Albums</n-h1>
      <div class="flex items-center gap-3 shrink-0">
        <n-input
          v-model:value="searchQuery"
          placeholder="Search albums..."
          class="w-64!"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <n-icon><Search /></n-icon>
          </template>
        </n-input>
        <n-select
          v-model:value="sortBy"
          :options="sortOptions"
          class="w-36!"
          @update:value="loadAlbums()"
        />
        <n-button type="primary" @click="showCreateModal = true">
          <template #icon
            ><n-icon><Plus /></n-icon
          ></template>
          Create Album
        </n-button>
      </div>
    </div>

    <div v-if="isLoading" class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <n-card v-for="n in 8" :key="n">
        <n-skeleton text :repeat="3" />
      </n-card>
    </div>

    <div
      v-else-if="albums.length > 0"
      class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <n-card
        v-for="album in albums"
        :key="album.id"
        hoverable
        class="cursor-pointer group"
        @click="goToAlbum(album.id)"
      >
        <div class="flex items-center gap-3">
          <n-icon size="28" class="text-gray-400 shrink-0"><Folder /></n-icon>
          <div class="flex-1 min-w-0">
            <div class="font-semibold truncate group-hover:text-blue-500 transition-colors">
              {{ album.name }}
            </div>
            <div class="text-xs text-gray-500 mt-0.5">{{ formatDate(album.created_at) }}</div>
          </div>
          <div class="flex gap-2 shrink-0" @click.stop>
            <n-button circle size="small" aria-label="Edit album" @click="editAlbum(album)">
              <template #icon
                ><n-icon><Edit /></n-icon
              ></template>
            </n-button>
            <n-button
              circle
              size="small"
              type="error"
              aria-label="Delete album"
              @click="deleteAlbum(album.id)"
            >
              <template #icon
                ><n-icon><Trash /></n-icon
              ></template>
            </n-button>
          </div>
        </div>
      </n-card>
    </div>

    <div
      v-else
      class="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 mt-8"
    >
      <div class="text-gray-400 mb-4 flex justify-center">
        <n-icon size="64"><PhotoOff /></n-icon>
      </div>
      <n-h3 class="mb-2">{{ searchQuery ? 'No albums found' : 'No albums yet' }}</n-h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        {{
          searchQuery
            ? 'Try testing different keywords.'
            : 'Create your first album to get started!'
        }}
      </p>
      <n-button
        v-if="!searchQuery"
        type="primary"
        size="large"
        round
        @click="showCreateModal = true"
      >
        Create Your First Album
      </n-button>
    </div>

    <AlbumFormModal
      v-model:show="showCreateModal"
      v-model:form="createForm"
      mode="create"
      title="Create New Album"
      submit-text="Create Album"
      :loading="isCreating"
      @submit="handleCreateAlbum"
    />

    <AlbumFormModal
      v-model:show="showEditModal"
      v-model:form="editForm"
      mode="edit"
      title="Edit Album"
      submit-text="Update"
      :loading="isUpdating"
      @submit="handleUpdateAlbum"
    />
  </div>
</template>

<script setup lang="ts">
import { Edit, Folder, PhotoOff, Plus, Search, Trash } from '@vicons/tabler'

import AlbumFormModal from '@/components/admin/AlbumFormModal.vue'
import albumRepository, { type AlbumInput } from '@/repositories/albumRepository'
import { formatDate } from '@/utils/format'
import type { Album } from '~/shared/types'

const emptyForm = (): AlbumInput => ({ name: '' })

const router = useRouter()
const message = useMessage()
const dialog = useDialog()

const albums = ref<Album[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const sortBy = ref('newest')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const isCreating = ref(false)
const isUpdating = ref(false)
const currentAlbum = ref<Album | null>(null)
const createForm = ref(emptyForm())
const editForm = ref(emptyForm())

let searchTimeout: ReturnType<typeof setTimeout> | null = null
let albumsRequestId = 0

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Name A-Z', value: 'name' },
]

const loadAlbums = async () => {
  const requestId = ++albumsRequestId
  isLoading.value = true
  try {
    const data = await albumRepository.getAlbums(searchQuery.value, sortBy.value)
    if (requestId === albumsRequestId) {
      albums.value = data || []
    }
  } catch {
    if (requestId === albumsRequestId) {
      message.error('Failed to load albums')
    }
  } finally {
    if (requestId === albumsRequestId) {
      isLoading.value = false
    }
  }
}

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(loadAlbums, 500)
}

const goToAlbum = (id: number) => router.push(`/admin/albums/${id}`)

const handleCreateAlbum = async () => {
  isCreating.value = true
  try {
    const data = await albumRepository.createAlbum(createForm.value)
    showCreateModal.value = false
    createForm.value = emptyForm()
    message.success('Album created!')
    router.push(`/admin/albums/${data.id}`)
  } catch {
    message.error('Failed to create album')
  } finally {
    isCreating.value = false
  }
}

const editAlbum = (album: Album) => {
  currentAlbum.value = album
  editForm.value = { name: album.name }
  showEditModal.value = true
}

const handleUpdateAlbum = async () => {
  const albumId = currentAlbum.value?.id
  if (!albumId) {
    return
  }

  isUpdating.value = true
  try {
    const data = await albumRepository.updateAlbum(albumId, editForm.value)
    const index = albums.value.findIndex((album) => album.id === albumId)

    if (index !== -1) {
      albums.value[index] = { ...albums.value[index], ...data }
    }
    showEditModal.value = false
    message.success('Album updated!')
  } catch {
    message.error('Failed to update album')
  } finally {
    isUpdating.value = false
  }
}

const deleteAlbum = (albumId: number) => {
  const dialogInstance = dialog.warning({
    title: 'Delete Album',
    content: 'Are you sure you want to delete this album? All photos inside will be deleted!',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      dialogInstance.loading = true
      return albumRepository
        .deleteAlbum(albumId)
        .then(() => {
          albums.value = albums.value.filter((album) => album.id !== albumId)
          message.success('Album deleted!')
        })
        .catch(() => {
          message.error('Failed to delete album')
          return false
        })
    },
  })
}

onMounted(() => {
  loadAlbums()
})

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  albumsRequestId++
})
</script>
