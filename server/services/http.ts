import { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { ZodError, ZodSchema } from 'zod'

import { verifyToken } from './auth'

// Extend Express Request type
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number
    email: string
  }
}

// Types for validated request properties
export type ValidatedParams = Record<string, unknown>
export type ValidatedQuery = Record<string, unknown>

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

export const upload = uploadMiddleware

// HTTP Error classes by status code
// These errors are thrown in controllers/database and caught by the error handler
// to return appropriate HTTP responses

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public originalError?: unknown,
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad request', originalError?: unknown) {
    super(message, 400, originalError)
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized', originalError?: unknown) {
    super(message, 401, originalError)
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden', originalError?: unknown) {
    super(message, 403, originalError)
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Resource not found', originalError?: unknown) {
    super(message, 404, originalError)
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = 'Conflict', originalError?: unknown) {
    super(message, 409, originalError)
  }
}

export class ValidationError extends HttpError {
  constructor(message: string = 'Validation failed', originalError?: unknown) {
    super(message, 422, originalError)
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal server error', originalError?: unknown) {
    super(message, 500, originalError)
  }
}

export const responseSuccess = (
  res: Response,
  data: Record<string, unknown> = {},
  statusCode = 200,
) => {
  return res.status(statusCode).json({ success: true, ...data })
}

export const responseError = (
  res: Response,
  message = 'Server error. Please try again later.',
  statusCode = 500,
) => {
  return res.status(statusCode).json({ success: false, message })
}

// Middleware type - supports both custom and Express-style middlewares
export type Middleware = (
  req: Request,
  res: Response,
  next?: NextFunction,
) => void | Response | null

// Auth middleware
export const auth: Middleware = (req, res) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return responseError(res, 'Unauthorized', 401)
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token) as { id: number; email: string }

  if (!decoded) {
    return responseError(res, 'Invalid token', 401)
  }

  ;(req as AuthenticatedRequest).user = { id: decoded.id, email: decoded.email }
  return null
}

// Validation middleware factory
// Supports 'body', 'params', or 'query' as source
export const validate = <T>(
  schema: ZodSchema<T>,
  source: 'body' | 'params' | 'query' = 'body',
): Middleware => {
  return (req) => {
    const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query
    const parsed = schema.parse(data)
    if (source === 'body') {
      req.body = parsed
    } else if (source === 'params') {
      ;(req as any).params = parsed
    } else {
      ;(req as any).query = parsed
    }
    return null
  }
}

// Unified action wrapper
// Signature: wrapAction(handler, { middlewares: [...] })
export const wrapAction = (
  handler: (req: Request) => any | Promise<any>,
  config: { middlewares?: Middleware[] } = {},
) => {
  const { middlewares = [] } = config

  return async (req: Request, res: Response) => {
    try {
      // Run middlewares sequentially
      for (const middleware of middlewares) {
        const promisedResult = new Promise((resolve) => {
          // Create a next function that resolves when called
          const next = () => resolve(null)

          // Call middleware with (req, res, next)
          const result = middleware(req, res, next)

          // If middleware returns something (our custom middlewares), resolve with that
          if (result !== undefined) {
            resolve(result)
          }
          // If middleware doesn't return (Express-style like multer), wait for next() to be called
        })

        const result = await promisedResult
        if (result) return result
      }

      // Execute handler
      const data = await handler(req)
      return responseSuccess(res, data)
    } catch (error) {
      console.error('Error:', error)

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const firstError = error.issues[0]
        const message = firstError
          ? `${firstError.path.join('.')}: ${firstError.message}`
          : 'Validation failed'
        return responseError(res, message, 400)
      }

      // Handle HTTP errors (BadRequest, Unauthorized, NotFound, etc.)
      if (error instanceof HttpError) {
        return responseError(res, error.message, error.statusCode)
      }

      // Handle generic errors
      if (error instanceof Error) {
        return responseError(res, error.message, 500)
      }

      return responseError(res, 'Server error. Please try again later.', 500)
    }
  }
}
