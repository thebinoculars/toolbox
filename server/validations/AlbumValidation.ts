import { z } from 'zod'

export const createAlbumSchema = z.object({
  name: z.string().min(1, 'Album name is required'),
  description: z.string().optional(),
  is_private: z.boolean().optional(),
})

export const updateAlbumSchema = z.object({
  name: z.string().min(1, 'Album name is required'),
  description: z.string().optional(),
  is_private: z.boolean().optional(),
})

export const albumIdSchema = z.object({
  id: z.string().refine((val) => !Number.isNaN(Number(val)), {
    message: 'Album ID must be a number',
  }),
})

export const imageIdSchema = z.object({
  imageId: z.string().refine((val) => !Number.isNaN(Number(val)), {
    message: 'Image ID must be a number',
  }),
})
