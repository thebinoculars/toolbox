import { handleDatabaseQuery, type SortOrder } from '@/repositories/CommonRepository'
import { supabase } from '@/services/SupabaseService'
import type { Album } from '~/shared/types'

const ALBUM_SORT_ORDERS = {
  newest: { column: 'created_at', ascending: false },
  oldest: { column: 'created_at', ascending: true },
  name: { column: 'name', ascending: true },
} satisfies Record<string, SortOrder>

export type AlbumSort = keyof typeof ALBUM_SORT_ORDERS

export const getAlbums = async (
  options: { search?: string; sort?: AlbumSort } = {},
): Promise<Album[]> => {
  const { search = '', sort = 'newest' } = options
  const { column, ascending } = ALBUM_SORT_ORDERS[sort]

  let query = supabase.from('albums').select('*')

  if (search.trim()) {
    query = query.ilike('name', `%${search.trim()}%`)
  }

  const result = await query.order(column, { ascending })
  return handleDatabaseQuery(result)
}

export const createAlbum = async (data: { name: string }): Promise<Album> => {
  const result = await supabase.from('albums').insert(data).select().single()
  return handleDatabaseQuery(result)
}

export const getAlbumById = async (albumId: number): Promise<Album> => {
  const result = await supabase.from('albums').select('*').eq('id', albumId).single()
  return handleDatabaseQuery(result)
}

export const updateAlbumById = async (albumId: number, data: { name: string }): Promise<Album> => {
  const result = await supabase.from('albums').update(data).eq('id', albumId).select().single()
  return handleDatabaseQuery(result)
}

export const deleteAlbumById = async (albumId: number): Promise<null> => {
  const result = await supabase.from('albums').delete().eq('id', albumId)
  return handleDatabaseQuery(result)
}
