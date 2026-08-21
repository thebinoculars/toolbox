import type { User } from '~/shared/types'

import { requestWithResponse } from './repository'

export default {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    return requestWithResponse<{ token: string; user: User }>(
      {
        method: 'post',
        url: '/login',
        data: { email, password },
      },
      {},
    )
  },

  fetchMe: async (): Promise<User> => {
    return requestWithResponse<User>(
      {
        method: 'get',
        url: '/me',
      },
      { requireAuth: true },
    )
  },

  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    return requestWithResponse<void>(
      {
        method: 'put',
        url: '/me',
        data: { currentPassword, newPassword },
      },
      { requireAuth: true },
    )
  },
}
