import { z } from 'zod'

import { idParam } from '@/validations/CommonValidation'

export const nesGameIdSchema = z.object({
  id: idParam('ID'),
})

export type NesGameIdParams = z.infer<typeof nesGameIdSchema>
