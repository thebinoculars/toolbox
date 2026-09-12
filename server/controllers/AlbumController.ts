import { Request } from 'express'

import type { Album, Image, PaginatedResponse, User } from '../../shared/types'
import {
  checkAlbumOwnership,
  createAlbum,
  deleteAlbumById,
  getAlbumById,
  getAlbumsByUserId,
  updateAlbumById,
} from '../database/Album'
import {
  countImagesByAlbumId,
  createImage,
  deleteImageById,
  deleteImagesByAlbumId,
  getCoverImageByAlbumId,
  getImageById,
  getImagesByAlbumId,
} from '../database/Image'
import { BadRequestError } from '../services/http'
import { deleteAlbumImages, deleteImage, getImageUrl, uploadImage } from '../storage/ImageStorage'

export const getAllAlbumsAction = async (req: Request): Promise<{ data: Album[] }> => {
  const user = (req as Request & { user: User }).user

  const search = (req.query.search as string) || ''
  const sort = (req.query.sort as string) || 'newest'

  const albums = await getAlbumsByUserId(user.id, { search, sort })

  const albumsWithCounts = await Promise.all(
    (albums || []).map(async (album) => {
      const total = await countImagesByAlbumId(album.id)
      const coverImage = await getCoverImageByAlbumId(album.id)
      return {
        ...album,
        total: total?.count || 0,
        cover_image: coverImage?.path ? getImageUrl(coverImage.path) : undefined,
      }
    }),
  )

  return { data: albumsWithCounts }
}

export const createAlbumAction = async (req: Request): Promise<{ data: Album }> => {
  const user = (req as Request & { user: User }).user
  const { name, description, is_private } = req.body

  const album: Album = await createAlbum({
    name: name.trim(),
    description: description?.trim() || '',
    is_private: Boolean(is_private),
    user_id: user.id,
  })

  return { data: album }
}

export const getAlbumDetailAction = async (
  req: Request,
): Promise<{ data: Album & { total: number } }> => {
  const user = (req as Request & { user: User }).user
  const { id: albumId } = req.params

  const album = await getAlbumById(+albumId, user.id)

  const { count: total } = await countImagesByAlbumId(album.id)

  return { data: { ...album, total: total || 0 } }
}

export const updateAlbumAction = async (req: Request): Promise<{ data: Album }> => {
  const user = (req as Request & { user: User }).user
  const { id: albumId } = req.params
  const { name, description, is_private: isPrivate } = req.body

  checkAlbumOwnership(+albumId, user.id)

  const updateData: { name: string; description: string; is_private?: boolean } = {
    name: name.trim(),
    description: description?.trim() || '',
  }
  if (isPrivate !== undefined) {
    updateData.is_private = Boolean(isPrivate)
  }

  const album = await updateAlbumById(+albumId, updateData)

  return { data: album }
}

export const deleteAlbumAction = async (req: Request): Promise<null> => {
  const user = (req as Request & { user: User }).user
  const { id: albumId } = req.params

  const album = await checkAlbumOwnership(+albumId, user.id)

  await deleteAlbumImages(album.id)
  await deleteImagesByAlbumId(album.id)
  await deleteAlbumById(album.id)

  return null
}

export const uploadImageAction = async (req: Request): Promise<{ data: Image }> => {
  const user = (req as Request & { user: User }).user
  const { id: albumId } = req.params

  const album = await checkAlbumOwnership(+albumId, user.id)

  const file = (req as Request & { file: Express.Multer.File }).file
  if (!file) {
    throw new BadRequestError('File is required')
  }

  const uploadResult = await uploadImage({
    albumId: album.id,
    fileBuffer: file.buffer,
  })

  const image = await createImage({
    album_id: album.id,
    filename: file.originalname,
    original_name: file.originalname,
    path: uploadResult.path,
    format: uploadResult.format,
    width: uploadResult.width,
    height: uploadResult.height,
    size: uploadResult.bytes,
  })

  return { data: { ...image, url: getImageUrl(image.path) } }
}

export const getAlbumImagesAction = async (req: Request): Promise<PaginatedResponse<Image>> => {
  const user = (req as Request & { user: User }).user
  const { id: albumId } = req.params

  const limit = +(req.query.limit as string) || 20
  const page = +(req.query.page as string) || 1
  const sort = (req.query.sort as string) || 'newest'

  const album = await checkAlbumOwnership(+albumId, user.id)

  const { data: images, count } = await getImagesByAlbumId(album.id, { limit, page, sort })

  const total = count || 0
  const hasMore = (page - 1) * limit + (images?.length || 0) < total

  return {
    data: (images || []).map((image) => ({
      ...image,
      url: getImageUrl(image.path),
    })),
    total,
    has_more: hasMore,
    page,
    limit,
  }
}

export const deleteImageAction = async (req: Request): Promise<null> => {
  const { imageId } = req.params

  const image = await getImageById(+imageId)

  await deleteImage(image.path)
  await deleteImageById(+imageId)

  return null
}
