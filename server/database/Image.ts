import type { Image } from '../../shared/types'
import { supabase } from '../services/supabase'
import { handleDatabaseQuery } from './Common'

export const countImagesByAlbumId = async (albumId: number) =>
  supabase.from('images').select('*', { count: 'exact', head: true }).eq('album_id', albumId)

export const getCoverImageByAlbumId = async (albumId: number): Promise<Image | null> => {
  const result = await supabase
    .from('images')
    .select('*')
    .eq('album_id', albumId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return handleDatabaseQuery(result)
}

export const getImagesByAlbumId = async (
  albumId: number,
  options: {
    limit?: number
    page?: number
    sort?: string
  } = {},
) => {
  const { limit = 20, page = 1, sort = 'newest' } = options
  const offset = (page - 1) * limit

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
    case 'largest':
      sortColumn = 'size'
      ascending = false
      break
    case 'smallest':
      sortColumn = 'size'
      ascending = true
      break
    default:
      break
  }

  return supabase
    .from('images')
    .select('*', { count: 'exact' })
    .eq('album_id', albumId)
    .order(sortColumn, { ascending })
    .range(offset, offset + limit - 1)
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

export const getImagesPathsByAlbumId = async (albumId: number): Promise<Image[] | null> => {
  const result = await supabase.from('images').select('*').eq('album_id', albumId)
  return handleDatabaseQuery(result)
}

export const deleteImagesByAlbumId = async (albumId: number): Promise<null> => {
  const result = await supabase.from('images').delete().eq('album_id', albumId)
  return handleDatabaseQuery(result)
}

export const getImageById = async (imageId: number): Promise<Image> => {
  const result = await supabase.from('images').select('*').eq('id', imageId).single()
  return handleDatabaseQuery(result)
}

export const deleteImageById = async (imageId: number): Promise<null> => {
  const result = await supabase.from('images').delete().eq('id', imageId)
  return handleDatabaseQuery(result)
}
