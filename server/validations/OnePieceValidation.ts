import { z } from 'zod'

export const episodeNumberSchema = z.object({
  ep: z.string().refine((val) => !Number.isNaN(Number(val)), {
    message: 'Episode must be a number',
  }),
})
