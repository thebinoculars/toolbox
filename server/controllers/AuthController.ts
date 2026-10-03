import type { Request } from 'express'

import { getUserByEmail, getUserById, updateUserPassword } from '@/repositories/UserRepository'
import { comparePassword, generateToken, hashPassword } from '@/services/AuthService'
import {
  BadRequestError,
  ForbiddenError,
  getAuthUser,
  NotFoundError,
  UnauthorizedError,
  type ValidatedRequest,
} from '@/services/HttpService'
import type { LoginBody, UpdatePasswordBody } from '@/validations/AuthValidation'
import type { User } from '~/shared/types'

type UserProfile = Pick<User, 'id' | 'email' | 'is_approved'>

const toProfile = (user: User): UserProfile => ({
  id: user.id,
  email: user.email,
  is_approved: user.is_approved,
})

export const loginAction = async (
  req: ValidatedRequest<{ body: LoginBody }>,
): Promise<{ data: { token: string; user: UserProfile } }> => {
  const { email, password } = req.body

  const user = await getUserByEmail(email).catch((error) => {
    if (error instanceof NotFoundError) return null
    throw error
  })

  const isPasswordMatch = user ? await comparePassword(password, user.password) : false
  if (!user || !isPasswordMatch) {
    throw new UnauthorizedError('Invalid email or password')
  }

  if (!user.is_approved) {
    throw new ForbiddenError('Your account is pending approval')
  }

  const token = generateToken({ id: user.id, email: user.email })

  return { data: { token, user: toProfile(user) } }
}

export const getProfileAction = async (req: Request): Promise<{ data: UserProfile }> => {
  const user = await getUserById(getAuthUser(req).id)

  return { data: toProfile(user) }
}

export const updateProfileAction = async (
  req: ValidatedRequest<{ body: UpdatePasswordBody }>,
): Promise<null> => {
  const { currentPassword, newPassword } = req.body

  const user = await getUserById(getAuthUser(req).id)

  const isPasswordMatch = await comparePassword(currentPassword, user.password)
  if (!isPasswordMatch) {
    throw new BadRequestError('Current password is incorrect')
  }

  const newPasswordHash = await hashPassword(newPassword, 10)

  await updateUserPassword(user.id, newPasswordHash)

  return null
}
