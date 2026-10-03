import { requestWithResponse } from '@/repositories/repository'
import type { NesGame } from '~/shared/types'

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
