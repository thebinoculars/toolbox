import albumRepository from '@/repositories/albumRepository'
import type { Image } from '~/shared/types'

const ITEMS_PER_PAGE = 20

export const useAlbumImages = (albumId: MaybeRefOrGetter<number>, sortBy: Ref<string>) => {
  const message = useMessage()

  const images = ref<Image[]>([])
  const totalImages = ref(0)
  const hasMore = ref(true)
  const isLoadingImages = ref(true)
  const isLoadingMore = ref(false)
  const loadMoreTrigger = useTemplateRef<HTMLElement>('loadMoreTrigger')

  let requestId = 0

  const loadImages = async (reset = false) => {
    const currentRequestId = ++requestId
    if (reset) {
      isLoadingImages.value = true
      isLoadingMore.value = false
      images.value = []
    } else {
      isLoadingMore.value = true
    }

    // The API only paginates by page, so derive the page from what is already loaded and
    // drop overlapping items; this keeps the offset correct after images are deleted.
    const page = Math.floor(images.value.length / ITEMS_PER_PAGE) + 1

    try {
      const data = await albumRepository.getAlbumImages(
        toValue(albumId),
        page,
        ITEMS_PER_PAGE,
        sortBy.value,
      )
      if (currentRequestId !== requestId) {
        return
      }

      const loadedIds = new Set(images.value.map((image) => image.id))
      images.value.push(...(data.data || []).filter((image) => !loadedIds.has(image.id)))
      totalImages.value = data.total || 0
      hasMore.value = data.has_more || false

      await nextTick()
      recheckLoadMoreTrigger()
    } catch {
      if (currentRequestId === requestId) {
        message.error('Failed to load images!')
      }
    } finally {
      if (currentRequestId === requestId) {
        isLoadingImages.value = false
        isLoadingMore.value = false
      }
    }
  }

  const loadMore = async () => {
    if (!hasMore.value || isLoadingMore.value || isLoadingImages.value) {
      return
    }

    await loadImages(false)
  }

  const removeImage = (imageId: number) => {
    images.value = images.value.filter((image) => image.id !== imageId)
    totalImages.value--
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loadMore()
      }
    },
    { rootMargin: '200px' },
  )

  watch(loadMoreTrigger, (el, oldEl) => {
    if (oldEl) {
      observer.unobserve(oldEl)
    }
    if (el) {
      observer.observe(el)
    }
  })

  // observe() reports the current intersection state, so re-observing loads the next page
  // when the trigger is still on screen after a load.
  const recheckLoadMoreTrigger = () => {
    if (loadMoreTrigger.value) {
      observer.unobserve(loadMoreTrigger.value)
      observer.observe(loadMoreTrigger.value)
    }
  }

  onUnmounted(() => {
    requestId++
    observer.disconnect()
  })

  return {
    images,
    totalImages,
    hasMore,
    isLoadingImages,
    isLoadingMore,
    loadImages,
    loadMore,
    removeImage,
  }
}
