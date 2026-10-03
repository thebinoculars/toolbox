import { z } from 'zod'

export const idParam = (label: string) =>
  z.string().regex(/^[1-9]\d*$/, { message: `${label} must be a positive integer` })
