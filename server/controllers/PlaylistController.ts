import type { Request } from 'express'

import { getSongsInPlaylist, getSongUrl, listPlaylists } from '@/storage/MusicStorage'

export const listPlaylistsAction = async (): Promise<{ data: (string | undefined)[] }> => {
  const playlists = await listPlaylists()
  return { data: playlists }
}

export const getSongsInPlaylistAction = async (
  req: Request,
): Promise<{ data: (string | undefined)[] }> => {
  const songs = await getSongsInPlaylist(req.params.id)
  return { data: songs }
}

export const getSongUrlAction = async (req: Request): Promise<{ data: string }> => {
  const url = await getSongUrl(req.params.id)
  return { data: url }
}
