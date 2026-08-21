import { Request } from 'express'

import type { NesGame } from '../../shared/types'
import { getAllNesGames, getNesGameById } from '../database/NesGame'
import { createNesUrl } from '../storage/NesGameStorage'

export const getAllGamesAction = async (): Promise<{ data: NesGame[] }> => {
  const games = await getAllNesGames()

  return { data: games || [] }
}

export const getGameDetailAction = async (req: Request): Promise<{ data: string }> => {
  const { id } = req.params

  const game = await getNesGameById(+id)

  const data = await createNesUrl(game.path)

  return { data: data || '' }
}
