import type { Album, Image, PaginatedResponse } from '~/shared/types'

import { request, requestWithResponse } from './repository'

export default {
  getAlbums: async (search?: string, sort?: string) => {
    return requestWithResponse<Album[]>(
      {
        method: 'get',
        url: '/albums',
        params: { search, sort },
      },
      { requireAuth: true },
    )
  },

  getAlbum: async (id: number) => {
    return requestWithResponse<Album>(
      {
        method: 'get',
        url: `/albums/${id}`,
      },
      { requireAuth: true },
    )
  },

  createAlbum: async (data: { name: string; description?: string; is_private: boolean }) => {
    return requestWithResponse<Album>(
      {
        method: 'post',
        url: '/albums',
        data,
      },
      { requireAuth: true },
    )
  },

  updateAlbum: async (
    id: number,
    data: {
      name: string
      description?: string
      is_private: boolean
    },
  ) => {
    return requestWithResponse<Album>(
      {
        method: 'put',
        url: `/albums/${id}`,
        data,
      },
      { requireAuth: true },
    )
  },

  deleteAlbum: async (id: number) => {
    return requestWithResponse<void>(
      {
        method: 'delete',
        url: `/albums/${id}`,
      },
      { requireAuth: true },
    )
  },

  getAlbumImages: async (albumId: number, page: number, limit: number, sort: string) => {
    return request<PaginatedResponse<Image>>(
      {
        method: 'get',
        url: `/albums/${albumId}/images`,
        params: { page, limit, sort },
      },
      { requireAuth: true },
    )
  },

  uploadImage: async (albumId: number, formData: FormData) => {
    return requestWithResponse<void>(
      {
        method: 'post',
        url: `/albums/${albumId}/images`,
        data: formData,
      },
      { requireAuth: true },
    )
  },

  deleteImage: async (albumId: number, imageId: number) => {
    return requestWithResponse<void>(
      {
        method: 'delete',
        url: `/albums/${albumId}/images/${imageId}`,
      },
      { requireAuth: true },
    )
  },
}
