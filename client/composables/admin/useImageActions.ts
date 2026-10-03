import { copyToClipboard } from '@/utils/clipboard'
import { downloadFile } from '@/utils/download'
import type { Image } from '~/shared/types'

export const useImageActions = () => {
  const message = useMessage()

  const downloadImage = async (image: Image) => {
    try {
      message.success('Downloading...')
      await downloadFile(image.url, image.filename)
    } catch {
      message.error('Failed to download!')
    }
  }

  const copyImageUrl = async (image: Image) => {
    try {
      await copyToClipboard(image.url)
      message.success('URL copied!')
    } catch {
      message.error('Failed to copy URL!')
    }
  }

  return { downloadImage, copyImageUrl }
}
