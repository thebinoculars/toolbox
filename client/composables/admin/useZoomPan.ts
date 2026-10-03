const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25

export const useZoomPan = () => {
  const zoomLevel = ref(1)
  const panX = ref(0)
  const panY = ref(0)
  const isPanning = ref(false)

  let lastPanX = 0
  let lastPanY = 0

  const canZoomIn = computed(() => zoomLevel.value < MAX_ZOOM)
  const canZoomOut = computed(() => zoomLevel.value > MIN_ZOOM)

  const transformStyle = computed(() => ({
    transform: `scale(${zoomLevel.value}) translate(${panX.value}px, ${panY.value}px)`,
    cursor: zoomLevel.value > 1 ? (isPanning.value ? 'grabbing' : 'grab') : 'default',
    transition: isPanning.value ? 'none' : 'transform 0.2s ease',
  }))

  const resetPan = () => {
    panX.value = 0
    panY.value = 0
  }

  const zoomIn = () => {
    if (canZoomIn.value) {
      zoomLevel.value = Math.min(MAX_ZOOM, zoomLevel.value + ZOOM_STEP)
    }
  }

  const zoomOut = () => {
    if (canZoomOut.value) {
      zoomLevel.value = Math.max(MIN_ZOOM, zoomLevel.value - ZOOM_STEP)
      if (zoomLevel.value <= 1) {
        resetPan()
      }
    }
  }

  const resetZoom = () => {
    zoomLevel.value = 1
    resetPan()
  }

  const startPan = (event: MouseEvent) => {
    if (zoomLevel.value > 1) {
      isPanning.value = true
      lastPanX = event.clientX
      lastPanY = event.clientY
    }
  }

  const handlePan = (event: MouseEvent) => {
    if (isPanning.value && zoomLevel.value > 1) {
      panX.value += (event.clientX - lastPanX) / zoomLevel.value
      panY.value += (event.clientY - lastPanY) / zoomLevel.value
      lastPanX = event.clientX
      lastPanY = event.clientY
    }
  }

  const endPan = () => (isPanning.value = false)

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault()
    if (event.deltaY < 0) {
      zoomIn()
    } else {
      zoomOut()
    }
  }

  return {
    zoomLevel,
    canZoomIn,
    canZoomOut,
    transformStyle,
    zoomIn,
    zoomOut,
    resetZoom,
    startPan,
    handlePan,
    endPan,
    handleWheel,
  }
}
