import { Handler } from '@netlify/functions'
import axios from 'axios'

import { type OnePieceTrackInput, upsertOnePieceTracks } from '@/repositories/OnePieceRepository'

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

  // Upsert fails if the same episode appears twice in one statement, e.g. when pages shift mid-fetch
  const tracks = new Map<number, OnePieceTrackInput>()
  for (const episode of allEpisodes) {
    tracks.set(episode.episode, {
      episode: episode.episode,
      title_en: episode.titles.en,
      title_ja: episode.titles.ja || null,
      release_date: episode.release_date,
      stamps: episode.stamps,
    })
  }

  if (tracks.size > 0) {
    await upsertOnePieceTracks([...tracks.values()])
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
