import { randomUUID } from 'crypto'
import imageSize from 'image-size'

import { BadRequestError } from '@/services/HttpService'
import { supabase } from '@/services/SupabaseService'
import { deleteFile, handleStorageOperation, uploadFile } from '@/storage/CommonStorage'

const IMAGES_BUCKET = 'images'
const SIGNED_URL_TTL = 24 * 60 * 60
const DELETE_BATCH_SIZE = 100

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  avif: 'image/avif',
  heif: 'image/heif',
}

const readDimensions = (fileBuffer: Buffer) => {
  try {
    return imageSize(fileBuffer)
  } catch {
    throw new BadRequestError('Only image files are allowed')
  }
}

export const uploadImage = async ({
  albumId,
  fileBuffer,
}: {
  albumId: number
  fileBuffer: Buffer
}): Promise<{ path: string; format: string; width: number; height: number; bytes: number }> => {
  const dimensions = readDimensions(fileBuffer)

  const extension = dimensions.type || ''
  const contentType = CONTENT_TYPES[extension]
  if (!contentType) {
    throw new BadRequestError(`Unsupported image format: ${extension || 'unknown'}`)
  }

  const storagePath = `${albumId}/${randomUUID()}.${extension}`
  const result = await uploadFile(storagePath, fileBuffer, contentType, IMAGES_BUCKET)

  return {
    path: result.path,
    format: extension,
    width: dimensions.width,
    height: dimensions.height,
    bytes: fileBuffer.length,
  }
}

export const deleteImage = async (path: string): Promise<void> => deleteFile(path, IMAGES_BUCKET)

export const deleteImages = async (paths: string[]): Promise<void> => {
  for (let i = 0; i < paths.length; i += DELETE_BATCH_SIZE) {
    const result = await supabase.storage
      .from(IMAGES_BUCKET)
      .remove(paths.slice(i, i + DELETE_BATCH_SIZE))
    handleStorageOperation(result)
  }
}

export const getImageUrls = async (paths: string[]): Promise<Map<string, string>> => {
  if (paths.length === 0) {
    return new Map()
  }

  const result = await supabase.storage.from(IMAGES_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
  const signed = handleStorageOperation(result)

  const urls = new Map<string, string>()
  signed.forEach((item) => {
    if (item.path && item.signedUrl) {
      urls.set(item.path, item.signedUrl)
    }
  })
  return urls
}
