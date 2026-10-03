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

// Must not exceed Supabase's API max_rows (default 1000), or a short page ends the loop early
const PAGE_SIZE = 1000

export const getAllOnePieceEpisodes = async (): Promise<OnePieceEpisodeSummary[]> => {
  const episodes: OnePieceEpisodeSummary[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const result = await supabase
      .from('one_piece_tracks')
      .select('id, episode, title_en, release_date')
      .order('episode', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    const page = handleDatabaseQuery(result)

    episodes.push(...page)
    if (page.length < PAGE_SIZE) break
  }

  return episodes
}

export const getOnePieceEpisodeByNumber = async (episode: number): Promise<OnePieceEpisode> => {
  const result = await supabase.from('one_piece_tracks').select('*').eq('episode', episode).single()
  return handleDatabaseQuery(result)
}

export const upsertOnePieceTracks = async (tracks: OnePieceTrackInput[]): Promise<void> => {
  const updatedAt = new Date().toISOString()
  const result = await supabase.from('one_piece_tracks').upsert(
    tracks.map((track) => ({ ...track, updated_at: updatedAt })),
    { onConflict: 'episode' },
  )
  handleDatabaseQuery(result)
}
