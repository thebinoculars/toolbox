import { requestWithResponse } from '@/repositories/repository'
import type { OnePieceEpisode } from '~/shared/types'

export default {
  getEpisodes: async () => {
    return requestWithResponse<OnePieceEpisode[]>({
      method: 'get',
      url: '/one-piece',
    })
  },

  getEpisode: async (episodeNumber: number) => {
    return requestWithResponse<OnePieceEpisode>({
      method: 'get',
      url: `/one-piece/${episodeNumber}`,
    })
  },
}
