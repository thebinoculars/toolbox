import type { AxiosRequestConfig } from 'axios'
import axios from 'axios'

import { useAuthStore } from '@/stores/auth'
import type { ApiResponse } from '~/shared/types'

interface RequestOptions {
  requireAuth?: boolean
}

export async function request<T>(
  axiosConfig: Omit<AxiosRequestConfig, 'baseURL'>,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {}

  if (options.requireAuth) {
    const authStore = useAuthStore()
    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`
    }
  }

  const response = await axios.request<T>({
    ...axiosConfig,
    url: `/api${axiosConfig.url}`,
    headers: {
      ...headers,
      ...(axiosConfig.headers || {}),
    },
  })
  return response.data
}

export async function requestWithResponse<T>(
  axiosConfig: Omit<AxiosRequestConfig, 'baseURL'>,
  options: RequestOptions = {},
): Promise<T> {
  const response = await request<ApiResponse<T>>(axiosConfig, options)
  return response.data as T
}
