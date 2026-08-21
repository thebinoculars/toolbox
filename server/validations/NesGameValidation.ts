import { z } from 'zod'

export const nesGameIdSchema = z.object({
  id: z.string().refine((val) => !Number.isNaN(Number(val)), {
    message: 'ID must be a number',
  }),
})
