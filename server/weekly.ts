import { Handler } from '@netlify/functions'
import axios from 'axios'

import {
  batchInsertOnePieceTracks,
  batchUpdateOnePieceTracks,
  getOnePieceTracksByEpisodes,
  type OnePieceTrackInput,
} from '@/repositories/OnePieceRepository'

type OnePieceEpisodeResponse = {
  episode_id: number
  episode: number
  titles: {
    en: string
    ja?: string
  }
  release_date: string
  stamps: unknown[]
}

type OnePieceEpisodesPage = {
  pages: number
  episodes: OnePieceEpisodeResponse[]
}

const EPISODES_URL = 'http://onepiecetracklist.com/server/getstamps.php'

const fetchAllEpisodes = async (): Promise<OnePieceEpisodeResponse[]> => {
  const episodes: OnePieceEpisodeResponse[] = []
  let page = 1
  let totalPages: number

  do {
    const { data } = await axios.get<OnePieceEpisodesPage>(`${EPISODES_URL}?page=${page}`)

    episodes.push(...data.episodes)
    totalPages = data.pages || 1

    page++
  } while (page <= totalPages)

  return episodes
}

const syncOnePieceTracks = async () => {
  const allEpisodes = await fetchAllEpisodes()

  const existingTracks = await getOnePieceTracksByEpisodes(allEpisodes.map((ep) => ep.episode))
  const existingEpisodes = new Set(existingTracks.map((track) => track.episode))

  const toInsert: OnePieceTrackInput[] = []
  const toUpdate: OnePieceTrackInput[] = []

  for (const episode of allEpisodes) {
    const trackData: OnePieceTrackInput = {
      episode: episode.episode,
      title_en: episode.titles.en,
      title_ja: episode.titles.ja || null,
      release_date: episode.release_date,
      stamps: episode.stamps,
    }

    if (existingEpisodes.has(episode.episode)) {
      toUpdate.push(trackData)
    } else {
      toInsert.push(trackData)
    }
  }

  if (toInsert.length > 0) {
    await batchInsertOnePieceTracks(toInsert)
  }

  if (toUpdate.length > 0) {
    await batchUpdateOnePieceTracks(toUpdate)
  }
}

export const handler: Handler = async () => {
  try {
    await syncOnePieceTracks()
    console.log('Weekly schedule completed')

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Weekly schedule completed' }),
    }
  } catch (error) {
    console.error('Weekly schedule failed:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Weekly schedule failed' }),
    }
  }
}
