import { z } from 'zod'

import { idParam } from '@/validations/CommonValidation'

export const episodeNumberSchema = z.object({
  ep: idParam('Episode'),
})

export type EpisodeNumberParams = z.infer<typeof episodeNumberSchema>
