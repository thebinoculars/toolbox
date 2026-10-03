import {
  createAlbum,
  deleteAlbumById,
  getAlbumById,
  getAlbums,
  updateAlbumById,
} from '@/repositories/AlbumRepository'
import {
  countImagesByAlbumId,
  createImage,
  deleteImageById,
  deleteImagesByAlbumId,
  getAlbumImageById,
  getImagePathsByAlbumId,
  getImagesByAlbumId,
} from '@/repositories/ImageRepository'
import { BadRequestError, type ValidatedRequest } from '@/services/HttpService'
import { deleteImage, deleteImages, getImageUrls, uploadImage } from '@/storage/ImageStorage'
import type {
  AlbumIdParams,
  AlbumImagesQuery,
  AlbumsQuery,
  CreateAlbumBody,
  ImageParams,
  UpdateAlbumBody,
} from '@/validations/AlbumValidation'
import type { Album, Image, PaginatedResponse } from '~/shared/types'

export const getAllAlbumsAction = async (
  req: ValidatedRequest<{ query: AlbumsQuery }>,
): Promise<{ data: Album[] }> => {
  const { search, sort } = req.query

  const albums = await getAlbums({ search, sort })

  return { data: albums }
}

export const createAlbumAction = async (
  req: ValidatedRequest<{ body: CreateAlbumBody }>,
): Promise<{ data: Album }> => {
  const album = await createAlbum({ name: req.body.name.trim() })

  return { data: album }
}

export const getAlbumDetailAction = async (
  req: ValidatedRequest<{ params: AlbumIdParams }>,
): Promise<{ data: Album & { total: number } }> => {
  const album = await getAlbumById(+req.params.id)
  const total = await countImagesByAlbumId(album.id)

  return { data: { ...album, total } }
}

export const updateAlbumAction = async (
  req: ValidatedRequest<{ params: AlbumIdParams; body: UpdateAlbumBody }>,
): Promise<{ data: Album }> => {
  const album = await updateAlbumById(+req.params.id, { name: req.body.name.trim() })

  return { data: album }
}

export const deleteAlbumAction = async (
  req: ValidatedRequest<{ params: AlbumIdParams }>,
): Promise<null> => {
  const album = await getAlbumById(+req.params.id)

  await deleteImages(await getImagePathsByAlbumId(album.id))
  await deleteImagesByAlbumId(album.id)
  await deleteAlbumById(album.id)

  return null
}

export const uploadImageAction = async (
  req: ValidatedRequest<{ params: AlbumIdParams }>,
): Promise<{ data: Image }> => {
  const album = await getAlbumById(+req.params.id)

  const { file } = req
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

  const urls = await getImageUrls([image.path])

  return { data: { ...image, url: urls.get(image.path) || '' } }
}

export const getAlbumImagesAction = async (
  req: ValidatedRequest<{ params: AlbumIdParams; query: AlbumImagesQuery }>,
): Promise<PaginatedResponse<Image>> => {
  const { limit, page, sort } = req.query

  const album = await getAlbumById(+req.params.id)

  const { data: images, count } = await getImagesByAlbumId(album.id, { limit, page, sort })

  const total = count || 0
  const urls = await getImageUrls(images.map((image) => image.path))

  return {
    data: images.map((image) => ({ ...image, url: urls.get(image.path) || '' })),
    total,
    has_more: (page - 1) * limit + images.length < total,
    page,
    limit,
  }
}

export const deleteImageAction = async (
  req: ValidatedRequest<{ params: ImageParams }>,
): Promise<null> => {
  const { id: albumId, imageId } = req.params

  const album = await getAlbumById(+albumId)
  const image = await getAlbumImageById(album.id, +imageId)

  await deleteImage(image.path)
  await deleteImageById(image.id)

  return null
}
