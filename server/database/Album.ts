import type { Album } from '../../shared/types'
import { supabase } from '../services/supabase'
import { handleDatabaseQuery } from './Common'

export const getAlbumsByUserId = async (
  userId: number,
  options: {
    limit?: number
    page?: number
    search?: string
    sort?: string
  } = {},
): Promise<Album[] | null> => {
  const { search = '', sort = 'newest' } = options

  let query = supabase.from('albums').select('*', { count: 'exact' }).eq('user_id', userId)

  if (search.trim()) {
    query = query.ilike('name', `%${search.trim()}%`)
  }

  let sortColumn = 'created_at'
  let ascending = false

  switch (sort) {
    case 'newest':
      sortColumn = 'created_at'
      ascending = false
      break
    case 'oldest':
      sortColumn = 'created_at'
      ascending = true
      break
    case 'name':
      sortColumn = 'name'
      ascending = true
      break
    default:
      break
  }

  const result = await query.order(sortColumn, { ascending })

  return handleDatabaseQuery(result)
}

export const createAlbum = async (data: {
  name: string
  description: string
  is_private: boolean
  user_id: number
}): Promise<Album> => {
  const result = await supabase.from('albums').insert(data).select().single()
  return handleDatabaseQuery(result)
}

export const getAlbumById = async (albumId: number, userId: number): Promise<Album> => {
  const result = await supabase
    .from('albums')
    .select('*')
    .eq('id', albumId)
    .eq('user_id', userId)
    .single()
  return handleDatabaseQuery(result)
}

export const checkAlbumOwnership = async (albumId: number, userId: number): Promise<Album> => {
  const result = await supabase
    .from('albums')
    .select('*')
    .eq('id', albumId)
    .eq('user_id', userId)
    .single()
  return handleDatabaseQuery(result)
}

export const updateAlbumById = async (
  albumId: number,
  data: {
    name?: string
    description?: string
    is_private?: boolean
  },
): Promise<Album> => {
  const result = await supabase.from('albums').update(data).eq('id', albumId).select().single()
  return handleDatabaseQuery(result)
}

export const deleteAlbumById = async (albumId: number): Promise<null> => {
  const result = await supabase.from('albums').delete().eq('id', albumId)
  return handleDatabaseQuery(result)
}
