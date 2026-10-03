import { handleDatabaseQuery, type SortOrder } from '@/repositories/CommonRepository'
import { supabase } from '@/services/SupabaseService'
import type { Image } from '~/shared/types'

const IMAGE_SORT_ORDERS = {
  newest: { column: 'created_at', ascending: false },
  oldest: { column: 'created_at', ascending: true },
  largest: { column: 'size', ascending: false },
  smallest: { column: 'size', ascending: true },
} satisfies Record<string, SortOrder>

export type ImageSort = keyof typeof IMAGE_SORT_ORDERS

export const countImagesByAlbumId = async (albumId: number): Promise<number> => {
  const { count } = await supabase
    .from('images')
    .select('*', { count: 'exact', head: true })
    .eq('album_id', albumId)
  return count || 0
}

export const getImagesByAlbumId = async (
  albumId: number,
  options: { limit?: number; page?: number; sort?: ImageSort } = {},
): Promise<{ data: Image[]; count: number | null }> => {
  const { limit = 20, page = 1, sort = 'newest' } = options
  const { column, ascending } = IMAGE_SORT_ORDERS[sort]
  const offset = (page - 1) * limit

  const result = await supabase
    .from('images')
    .select('*', { count: 'exact' })
    .eq('album_id', albumId)
    .order(column, { ascending })
    .range(offset, offset + limit - 1)

  return { data: handleDatabaseQuery(result), count: result.count }
}

export const createImage = async (data: {
  album_id: number
  filename: string
  original_name: string
  path: string
  format: string
  width: number
  height: number
  size: number
}): Promise<Image> => {
  const result = await supabase.from('images').insert(data).select().single()
  return handleDatabaseQuery(result)
}

export const getImagePathsByAlbumId = async (albumId: number): Promise<string[]> => {
  const result = await supabase.from('images').select('path').eq('album_id', albumId)
  return handleDatabaseQuery(result).map((image) => image.path)
}

export const deleteImagesByAlbumId = async (albumId: number): Promise<null> => {
  const result = await supabase.from('images').delete().eq('album_id', albumId)
  return handleDatabaseQuery(result)
}

export const getAlbumImageById = async (albumId: number, imageId: number): Promise<Image> => {
  const result = await supabase
    .from('images')
    .select('*')
    .eq('id', imageId)
    .eq('album_id', albumId)
    .single()
  return handleDatabaseQuery(result)
}

export const deleteImageById = async (imageId: number): Promise<null> => {
  const result = await supabase.from('images').delete().eq('id', imageId)
  return handleDatabaseQuery(result)
}
