import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'

import { getJwtSecret } from '../../shared/utils'

export const hashPassword = (password: string, saltRounds = 12) => bcrypt.hash(password, saltRounds)

export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash)

export const generateToken = (
  payload: { id: number; email: string },
  expiresIn: string | number = '30d',
): string => jwt.sign(payload, getJwtSecret(), { expiresIn } as SignOptions)

export const verifyToken = (token: string) => jwt.verify(token, getJwtSecret())
