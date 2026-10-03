import { handleDatabaseQuery } from '@/repositories/CommonRepository'
import { supabase } from '@/services/SupabaseService'
import type { OnePieceEpisode } from '~/shared/types'

export type OnePieceEpisodeSummary = Pick<
  OnePieceEpisode,
  'id' | 'episode' | 'title_en' | 'release_date'
>

export type OnePieceTrackInput = {
  episode: number
  title_en: string
  title_ja: string | null
  release_date: string
  stamps: unknown[]
}

export const getAllOnePieceEpisodes = async (): Promise<OnePieceEpisodeSummary[]> => {
  const result = await supabase
    .from('one_piece_tracks')
    .select('id, episode, title_en, release_date')
    .order('episode', { ascending: false })
  return handleDatabaseQuery(result)
}

export const getOnePieceEpisodeByNumber = async (episode: number): Promise<OnePieceEpisode> => {
  const result = await supabase.from('one_piece_tracks').select('*').eq('episode', episode).single()
  return handleDatabaseQuery(result)
}

export const getOnePieceTracksByEpisodes = async (
  episodes: number[],
): Promise<OnePieceEpisode[]> => {
  const result = await supabase.from('one_piece_tracks').select('*').in('episode', episodes)
  return handleDatabaseQuery(result)
}

export const batchInsertOnePieceTracks = async (tracks: OnePieceTrackInput[]): Promise<void> => {
  const result = await supabase.from('one_piece_tracks').insert(
    tracks.map((track) => ({
      ...track,
      updated_at: new Date().toISOString(),
    })),
  )
  handleDatabaseQuery(result)
}

export const batchUpdateOnePieceTracks = async (tracks: OnePieceTrackInput[]): Promise<void> => {
  const results = await Promise.all(
    tracks.map((track) =>
      supabase
        .from('one_piece_tracks')
        .update({
          title_en: track.title_en,
          title_ja: track.title_ja,
          release_date: track.release_date,
          stamps: track.stamps,
          updated_at: new Date().toISOString(),
        })
        .eq('episode', track.episode),
    ),
  )
  results.forEach((result) => handleDatabaseQuery(result))
}
