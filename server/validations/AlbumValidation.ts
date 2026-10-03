import { z } from 'zod'

import { idParam } from '@/validations/CommonValidation'

export const createAlbumSchema = z.object({
  name: z.string().trim().min(1, 'Album name is required').max(255),
})

export const updateAlbumSchema = createAlbumSchema

export const albumIdSchema = z.object({
  id: idParam('Album ID'),
})

export const imageParamsSchema = z.object({
  id: idParam('Album ID'),
  imageId: idParam('Image ID'),
})

export const albumImagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['newest', 'oldest', 'largest', 'smallest']).default('newest'),
})

export const albumsQuerySchema = z.object({
  search: z.string().max(255).default(''),
  sort: z.enum(['newest', 'oldest', 'name']).default('newest'),
})

export type CreateAlbumBody = z.infer<typeof createAlbumSchema>
export type UpdateAlbumBody = z.infer<typeof updateAlbumSchema>
export type AlbumIdParams = z.infer<typeof albumIdSchema>
export type ImageParams = z.infer<typeof imageParamsSchema>
export type AlbumImagesQuery = z.infer<typeof albumImagesQuerySchema>
export type AlbumsQuery = z.infer<typeof albumsQuerySchema>
