import imageSize from 'image-size'

import { supabase } from '../services/supabase'
import { handleStorageOperation } from './Common'
import { deleteFile, getPublicUrl, uploadFile } from './Common'

const IMAGES_BUCKET = 'images'

export const uploadImage = async ({
  albumId,
  fileBuffer,
}: {
  albumId: number
  fileBuffer: Buffer
}): Promise<{ path: string; format: string; width: number; height: number; bytes: number }> => {
  const dimensions = imageSize(fileBuffer)

  const extension = dimensions.type || 'jpg'
  const filename = `${Date.now()}.${extension}`
  const storagePath = `${albumId}/${filename}`

  const result = await uploadFile(storagePath, fileBuffer, `image/${extension}`, IMAGES_BUCKET)

  return {
    path: result.path,
    format: extension,
    width: dimensions.width,
    height: dimensions.height,
    bytes: fileBuffer.length,
  }
}

export const deleteImage = async (path: string): Promise<void> => deleteFile(path, IMAGES_BUCKET)

export const deleteAlbumImages = async (albumId: number): Promise<void> => {
  const listResult = await supabase.storage.from(IMAGES_BUCKET).list(albumId.toString())
  const files = handleStorageOperation(listResult)

  if (!files || files.length === 0) {
    return
  }

  const filePaths = files.map((file) => `${albumId}/${file.name}`)

  const deleteResult = await supabase.storage.from(IMAGES_BUCKET).remove(filePaths)
  handleStorageOperation(deleteResult)
}

export const getImageUrl = (path: string): string => getPublicUrl(path, IMAGES_BUCKET)
