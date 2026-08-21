import { User } from '../../shared/types'
import { supabase } from '../services/supabase'
import { handleDatabaseQuery } from './Common'

export const getUserByEmail = async (email: string): Promise<User> => {
  const result = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single()
  return handleDatabaseQuery(result)
}

export const getUserById = async (id: number): Promise<User> => {
  const result = await supabase.from('users').select('*').eq('id', id).single()
  return handleDatabaseQuery(result)
}

export const updateUserPassword = async (id: number, passwordHash: string): Promise<User> => {
  const result = await supabase
    .from('users')
    .update({ password: passwordHash })
    .eq('id', id)
    .select()
    .single()
  return handleDatabaseQuery(result)
}
