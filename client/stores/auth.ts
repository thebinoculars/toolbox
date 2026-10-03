import { defineStore } from 'pinia'

import { getAuthToken, removeAuthToken, setAuthToken } from '@/utils/localStorage'
import type { User } from '~/shared/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(getAuthToken())

  const setUser = (userData: User) => {
    user.value = userData
  }

  const setToken = (tokenValue: string) => {
    token.value = tokenValue
    setAuthToken(tokenValue)
  }

  const clearAuth = () => {
    user.value = null
    token.value = null
    removeAuthToken()
  }

  return {
    user,
    token,
    setUser,
    setToken,
    clearAuth,
  }
})
