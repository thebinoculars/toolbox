import { Request } from 'express'

import { getSongsInPlaylist, getSongUrl, listPlaylists } from '../storage/MusicStorage'

export const listPlaylistsAction = async (
  _req: Request,
): Promise<{ data: (string | undefined)[] }> => {
  const playlists = await listPlaylists()
  return { data: playlists }
}

export const getSongsInPlaylistAction = async (
  req: Request,
): Promise<{ data: (string | undefined)[] }> => {
  const { id } = req.params
  const songs = await getSongsInPlaylist(id)
  return { data: songs }
}

export const getSongUrlAction = async (req: Request): Promise<{ data: string }> => {
  const { id } = req.params
  const url = await getSongUrl(id)
  return { data: url }
}
