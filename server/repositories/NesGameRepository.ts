import { handleDatabaseQuery } from '@/repositories/CommonRepository'
import { supabase } from '@/services/SupabaseService'
import type { NesGame } from '~/shared/types'

export const getAllNesGames = async (): Promise<NesGame[]> => {
  const result = await supabase.from('nes_games').select('*').order('name', { ascending: true })
  return handleDatabaseQuery(result)
}

export const getNesGameById = async (id: number): Promise<NesGame> => {
  const result = await supabase.from('nes_games').select('*').eq('id', id).single()
  return handleDatabaseQuery(result)
}
