import { getAllNesGames, getNesGameById } from '@/repositories/NesGameRepository'
import type { ValidatedRequest } from '@/services/HttpService'
import { createNesUrl } from '@/storage/NesGameStorage'
import type { NesGameIdParams } from '@/validations/NesGameValidation'
import type { NesGame } from '~/shared/types'

export const getAllGamesAction = async (): Promise<{ data: NesGame[] }> => {
  const games = await getAllNesGames()

  return { data: games }
}

export const getGameDetailAction = async (
  req: ValidatedRequest<{ params: NesGameIdParams }>,
): Promise<{ data: string }> => {
  const game = await getNesGameById(+req.params.id)

  const data = await createNesUrl(game.path)

  return { data: data || '' }
}
