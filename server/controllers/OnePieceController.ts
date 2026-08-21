import { Request } from 'express'

import type { OnePieceEpisode } from '../../shared/types'
import { getAllOnePieceEpisodes, getOnePieceEpisodeByNumber } from '../database/OnePiece'

export const getAllEpisodesAction = async (): Promise<{
  data: Pick<OnePieceEpisode, 'id' | 'episode' | 'title_en' | 'release_date'>[]
}> => {
  const episodes = await getAllOnePieceEpisodes()

  return { data: episodes || [] }
}

export const getEpisodeDetailAction = async (
  req: Request,
): Promise<{ data: OnePieceEpisode | null }> => {
  const { ep } = req.params

  const episode = await getOnePieceEpisodeByNumber(+ep)

  return { data: episode }
}
