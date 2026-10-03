import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'

import { getJwtSecret } from '~/shared/utils'

export type AuthUser = { id: number; email: string }

export const hashPassword = (password: string, saltRounds = 12) => bcrypt.hash(password, saltRounds)

export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash)

export const generateToken = (
  payload: AuthUser,
  expiresIn: SignOptions['expiresIn'] = '30d',
): string => jwt.sign(payload, getJwtSecret(), { expiresIn })

export const verifyToken = (token: string) => jwt.verify(token, getJwtSecret()) as AuthUser
