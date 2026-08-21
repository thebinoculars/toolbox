import type { NesGame } from '../../shared/types'
import { supabase } from '../services/supabase'
import { handleDatabaseQuery } from './Common'

export const getAllNesGames = async (): Promise<NesGame[] | null> => {
  const result = await supabase.from('nes_games').select('*').order('name', { ascending: true })
  return handleDatabaseQuery(result)
}

export const getNesGameById = async (id: number): Promise<NesGame> => {
  const result = await supabase.from('nes_games').select('*').eq('id', id).single()
  return handleDatabaseQuery(result)
}
