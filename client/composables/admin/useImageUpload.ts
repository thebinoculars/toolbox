import albumRepository from '@/repositories/albumRepository'

const MAX_FILE_SIZE = 6 * 1024 * 1024

export const useImageUpload = (
  albumId: MaybeRefOrGetter<number>,
  onUploaded: () => Promise<void>,
) => {
  const message = useMessage()

  const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
  const isUploading = ref(false)
  const uploadingCount = ref(0)
  const isDragOver = ref(false)

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) {
      return
    }

    const validFiles = files.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
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
          const id = toValue(albumId)
          const formData = new FormData()
          formData.append('file', file)
          formData.append('albumId', id.toString())
          await albumRepository.uploadImage(id, formData)
          successCount++
        } catch {
          message.error(`Failed to upload ${file.name}`)
        }
      }
    } finally {
      isUploading.value = false
      uploadingCount.value = 0
    }

    if (successCount > 0) {
      message.success(`Successfully uploaded ${successCount} images!`)
      await onUploaded()
    }
  }

  const triggerFileInput = () => {
    if (!isUploading.value) {
      fileInput.value?.click()
    }
  }

  const handleFileSelect = (event: Event) => {
    if (!(event.target instanceof HTMLInputElement)) {
      return
    }

    const input = event.target
    if (input.files) {
      uploadFiles(Array.from(input.files))
    }

    input.value = ''
  }

  const showDragOver = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = true
  }

  const dropZoneHandlers = {
    dragover: showDragOver,
    dragenter: showDragOver,
    dragleave: (event: DragEvent) => {
      event.preventDefault()
      isDragOver.value = false
    },
    drop: (event: DragEvent) => {
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
    },
  }

  return {
    isUploading,
    uploadingCount,
    isDragOver,
    triggerFileInput,
    handleFileSelect,
    dropZoneHandlers,
  }
}
