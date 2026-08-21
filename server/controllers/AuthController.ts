import { Request } from 'express'

import type { User } from '../../shared/types'
import { getUserByEmail, getUserById, updateUserPassword } from '../database/User'
import { comparePassword, generateToken, hashPassword } from '../services/auth'
import { BadRequestError, ForbiddenError, UnauthorizedError } from '../services/http'

export const loginAction = async (
  req: Request,
): Promise<{
  data: { token: string; user: Pick<User, 'id' | 'email' | 'is_approved'> }
}> => {
  const { email, password } = req.body

  const user = await getUserByEmail(email)

  const isPasswordMatch = await comparePassword(password, user.password)
  if (!isPasswordMatch) {
    throw new UnauthorizedError('Invalid email or password')
  }

  if (!user.is_approved) {
    throw new ForbiddenError('Your account is pending approval')
  }

  const token = generateToken({ id: user.id, email: user.email })

  return {
    data: { token, user: { id: user.id, email: user.email, is_approved: user.is_approved } },
  }
}

export const getProfileAction = async (
  req: Request,
): Promise<{ data: { id: number; email: string; is_approved: boolean } }> => {
  const authUser = (req as Request & { user: User }).user

  const user = await getUserById(authUser.id)

  return {
    data: { id: user.id, email: user.email, is_approved: user.is_approved },
  }
}

export const updateProfileAction = async (req: Request): Promise<null> => {
  const authUser = (req as Request & { user: User }).user
  const { currentPassword, newPassword } = req.body

  const user = await getUserById(authUser.id)

  const isPasswordMatch = await comparePassword(currentPassword, user.password)
  if (!isPasswordMatch) {
    throw new BadRequestError('Current password is incorrect')
  }

  const newPasswordHash = await hashPassword(newPassword, 10)

  await updateUserPassword(user.id, newPasswordHash)

  return null
}
