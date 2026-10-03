import {
  getAllOnePieceEpisodes,
  getOnePieceEpisodeByNumber,
  type OnePieceEpisodeSummary,
} from '@/repositories/OnePieceRepository'
import type { ValidatedRequest } from '@/services/HttpService'
import type { EpisodeNumberParams } from '@/validations/OnePieceValidation'
import type { OnePieceEpisode } from '~/shared/types'

export const getAllEpisodesAction = async (): Promise<{ data: OnePieceEpisodeSummary[] }> => {
  const episodes = await getAllOnePieceEpisodes()

  return { data: episodes }
}

export const getEpisodeDetailAction = async (
  req: ValidatedRequest<{ params: EpisodeNumberParams }>,
): Promise<{ data: OnePieceEpisode }> => {
  const episode = await getOnePieceEpisodeByNumber(+req.params.ep)

  return { data: episode }
}
