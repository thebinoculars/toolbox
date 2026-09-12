import type { NesGame } from '~/shared/types'

import { requestWithResponse } from './repository'

export default {
  getGames: async () => {
    return requestWithResponse<NesGame[]>({
      method: 'get',
      url: '/nes-games',
    })
  },

  getGameUrl: async (id: number) => {
    return requestWithResponse<string>({
      method: 'get',
      url: `/nes-games/${id}`,
    })
  },
}
