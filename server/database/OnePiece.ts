import type { OnePieceEpisode } from '../../shared/types'
import { supabase } from '../services/supabase'
import { handleDatabaseQuery } from './Common'

export const getAllOnePieceEpisodes = async (): Promise<
  Pick<OnePieceEpisode, 'id' | 'episode' | 'title_en' | 'release_date'>[] | null
> => {
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

export const upsertOnePieceTrack = async (trackData: {
  episode: number
  title_en: string
  title_ja: string | null
  release_date: string
  stamps: unknown[]
}): Promise<OnePieceEpisode> => {
  const { data: existing } = await supabase
    .from('one_piece_tracks')
    .select('id')
    .eq('episode', trackData.episode)
    .single()

  const data = {
    ...trackData,
    updated_at: new Date().toISOString(),
  }

  const result = existing
    ? await supabase.from('one_piece_tracks').update(data).eq('id', existing.id).select().single()
    : await supabase.from('one_piece_tracks').insert(data).select().single()

  return handleDatabaseQuery(result)
}

export const getOnePieceTracksByEpisodes = async (
  episodes: number[],
): Promise<OnePieceEpisode[] | null> => {
  const result = await supabase.from('one_piece_tracks').select('*').in('episode', episodes)
  return handleDatabaseQuery(result)
}

export const batchInsertOnePieceTracks = async (
  tracks: Array<{
    episode: number
    title_en: string
    title_ja: string | null
    release_date: string
    stamps: unknown[]
  }>,
) =>
  supabase.from('one_piece_tracks').insert(
    tracks.map((track) => ({
      ...track,
      updated_at: new Date().toISOString(),
    })),
  )

export const batchUpdateOnePieceTracks = async (
  tracks: Array<{
    episode: number
    title_en: string
    title_ja: string | null
    release_date: string
    stamps: unknown[]
  }>,
) => {
  const updates = tracks.map((track) =>
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
  )

  await Promise.all(updates)
}
