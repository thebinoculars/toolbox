import { handleDatabaseQuery } from '@/repositories/CommonRepository'
import { supabase } from '@/services/SupabaseService'
import type { User } from '~/shared/types'

export const getUserByEmail = async (email: string): Promise<User> => {
  const result = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single()
  return handleDatabaseQuery(result)
}

export const getUserById = async (id: number): Promise<User> => {
  const result = await supabase.from('users').select('*').eq('id', id).single()
  return handleDatabaseQuery(result)
}

export const getFirstUserId = async (): Promise<{ id: number }> => {
  const result = await supabase.from('users').select('id').order('id').limit(1).single()
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
