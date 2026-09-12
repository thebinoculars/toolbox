import type { OnePieceEpisode } from '~/shared/types'

import { requestWithResponse } from './repository'

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
