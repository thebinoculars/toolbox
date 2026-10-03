import type { NextFunction, Request, Response } from 'express'
import multer, { MulterError } from 'multer'
import { ZodError, type ZodType } from 'zod'

import { getUserById } from '@/repositories/UserRepository'
import { type AuthUser, verifyToken } from '@/services/AuthService'

type RequestSource = 'body' | 'params' | 'query'

type AuthenticatedRequest = Request & { user: AuthUser }

type AnyRequest = Request<unknown, unknown, unknown, unknown>

export type ValidatedRequest<T extends Partial<Record<RequestSource, unknown>>> = Request<
  T extends { params: infer P } ? P : Request['params'],
  unknown,
  T extends { body: infer B } ? B : Request['body'],
  T extends { query: infer Q } ? Q : Request['query']
>

export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Response | null | Promise<Response | null>

type ActionResult = object | null

const MAX_UPLOAD_SIZE = 6 * 1024 * 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE, files: 1 },
})

// @types/multer resolves its own copy of @types/express, so its RequestHandler type is incompatible with ours
export const uploadSingle = (fieldName: string) => upload.single(fieldName) as unknown as Middleware

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

export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal server error', originalError?: unknown) {
    super(message, 500, originalError)
  }
}

const responseSuccess = (res: Response, data: ActionResult = {}, statusCode = 200) =>
  res.status(statusCode).json({ success: true, ...data })

export const responseError = (
  res: Response,
  message = 'Server error. Please try again later.',
  statusCode = 500,
) => res.status(statusCode).json({ success: false, message })

const hostOf = (url: string | undefined) => {
  if (!url) return null
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

// Same-origin GETs carry no Origin header, so fall back to Sec-Fetch-Site, then Referer
const isSameOriginRequest = (req: Request) => {
  const host = (req.get('x-forwarded-host') || req.get('host'))?.split(',')[0].trim()
  if (!host) return false

  const origin = req.get('origin')
  if (origin) return hostOf(origin) === host

  const fetchSite = req.get('sec-fetch-site')
  if (fetchSite) return fetchSite === 'same-origin'

  return hostOf(req.get('referer')) === host
}

export const sameOriginOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!isSameOriginRequest(req)) {
    responseError(res, 'Forbidden', 403)
    return
  }
  next()
}

export const getAuthUser = (req: AnyRequest): AuthUser => (req as AuthenticatedRequest).user

export const auth: Middleware = async (req, res) => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return responseError(res, 'Unauthorized', 401)
  }

  let decoded: AuthUser
  try {
    decoded = verifyToken(authHeader.substring(7))
  } catch {
    return responseError(res, 'Invalid or expired token', 401)
  }

  const user = await getUserById(decoded.id).catch(() => null)
  if (!user || !user.is_approved) {
    return responseError(res, 'Unauthorized', 401)
  }

  ;(req as AuthenticatedRequest).user = { id: user.id, email: user.email }
  return null
}

export const validate =
  (schema: ZodType, source: RequestSource = 'body'): Middleware =>
  (req) => {
    const target = req as Record<RequestSource, unknown>
    target[source] = schema.parse(target[source])
    return null
  }

const runMiddleware = (middleware: Middleware, req: Request, res: Response) =>
  new Promise<Response | null>((resolve, reject) => {
    const result = middleware(req, res, (err?: unknown) => (err ? reject(err) : resolve(null)))

    // Custom middlewares return a result; Express-style ones (e.g. multer) only call next()
    if (result !== undefined) {
      resolve(result)
    }
  })

const toErrorResponse = (res: Response, error: unknown) => {
  if (error instanceof ZodError) {
    const firstError = error.issues[0]
    const message = firstError
      ? `${firstError.path.join('.')}: ${firstError.message}`
      : 'Validation failed'
    return responseError(res, message, 400)
  }

  if (error instanceof MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? `File is too large (max ${MAX_UPLOAD_SIZE / 1024 / 1024}MB)`
        : error.message
    return responseError(res, message, 400)
  }

  if (error instanceof HttpError && error.statusCode < 500) {
    return responseError(res, error.message, error.statusCode)
  }

  return responseError(res, 'Server error. Please try again later.', 500)
}

export const wrapAction =
  <Req extends AnyRequest>(
    handler: (req: Req) => ActionResult | Promise<ActionResult>,
    middlewares: Middleware[] = [],
  ) =>
  async (req: Request, res: Response) => {
    try {
      for (const middleware of middlewares) {
        const result = await runMiddleware(middleware, req, res)
        if (result) return result
      }

      const data = await handler(req as Req)
      return responseSuccess(res, data)
    } catch (error) {
      console.error('Error:', error)
      return toErrorResponse(res, error)
    }
  }
