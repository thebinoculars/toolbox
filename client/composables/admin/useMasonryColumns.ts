import type { Image } from '~/shared/types'

export const getImageRatio = (image: Image) =>
  image.width && image.height ? image.height / image.width : 1

const getColumnCount = (width: number) => {
  if (width >= 1280) {
    return 6
  }
  if (width >= 1024) {
    return 5
  }
  if (width >= 768) {
    return 4
  }
  if (width >= 640) {
    return 3
  }
  return 2
}

export const useMasonryColumns = (images: Ref<Image[]>) => {
  const columnCount = ref(6)

  // Pinterest-style: put each image into the currently shortest column (heights measured
  // relative to column width) so the columns stay balanced
  const columns = computed(() => {
    const cols: Image[][] = Array.from({ length: columnCount.value }, () => [])
    const heights: number[] = Array(columnCount.value).fill(0)
    images.value.forEach((image) => {
      const shortest = heights.indexOf(Math.min(...heights))
      cols[shortest].push(image)
      heights[shortest] += getImageRatio(image)
    })
    return cols
  })

  const updateColumns = () => (columnCount.value = getColumnCount(window.innerWidth))

  onMounted(() => {
    updateColumns()
    window.addEventListener('resize', updateColumns)
  })

  onUnmounted(() => window.removeEventListener('resize', updateColumns))

  return columns
}
