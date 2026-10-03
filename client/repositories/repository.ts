import type { AxiosRequestConfig } from 'axios'
import axios, { isAxiosError } from 'axios'

import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse } from '~/shared/types'

const http = axios.create()

http.interceptors.response.use(undefined, (error) => {
  if (
    isAxiosError(error) &&
    error.response?.status === 401 &&
    error.config?.headers?.Authorization
  ) {
    useAuthStore().clearAuth()
    if (router.currentRoute.value.path !== '/login') {
      router.push('/login')
    }
  }
  return Promise.reject(error)
})

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

  const response = await http.request<T>({
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
