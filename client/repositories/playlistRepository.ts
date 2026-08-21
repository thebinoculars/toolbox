import { requestWithResponse } from './repository'

export default {
  getPlaylists: async () => {
    return requestWithResponse<string[]>({
      method: 'GET',
      url: '/playlists',
    })
  },

  getSongsInPlaylist: async (playlistId: string) => {
    return requestWithResponse<string[]>({
      method: 'GET',
      url: `/playlists/${encodeURIComponent(playlistId)}/songs`,
    })
  },

  getSongUrl: async (songId: string) => {
    return requestWithResponse<string>({
      method: 'GET',
      url: `/songs/${encodeURIComponent(songId)}/url`,
    })
  },
}
