import express, { Router } from 'express'
import serverless from 'serverless-http'
import { z } from 'zod'

import {
  createAlbumAction,
  deleteAlbumAction,
  deleteImageAction,
  getAlbumDetailAction,
  getAlbumImagesAction,
  getAllAlbumsAction,
  updateAlbumAction,
  uploadImageAction,
} from './controllers/AlbumController'
import { getProfileAction, loginAction, updateProfileAction } from './controllers/AuthController'
import { getAllGamesAction, getGameDetailAction } from './controllers/NesGameController'
import { getAllEpisodesAction, getEpisodeDetailAction } from './controllers/OnePieceController'
import {
  getSongsInPlaylistAction,
  getSongUrlAction,
  listPlaylistsAction,
} from './controllers/PlaylistController'
import { proxyAction } from './controllers/ProxyController'
import { auth, upload, validate, wrapAction } from './services/http'
import { albumIdSchema, createAlbumSchema, updateAlbumSchema } from './validations/AlbumValidation'
import { loginSchema, updatePasswordSchema } from './validations/AuthValidation'
import { nesGameIdSchema } from './validations/NesGameValidation'
import { episodeNumberSchema } from './validations/OnePieceValidation'

const api = express()

// Middleware
api.use(express.json())
api.use(express.urlencoded({ limit: '10mb', extended: true }))

// Combined schema for delete image route
const deleteImageParamsSchema = z.object({
  id: z.string(),
  imageId: z.string(),
})

// API Routes
const apiRouter = Router()

// Auth routes
apiRouter.post('/login', wrapAction(loginAction, { middlewares: [validate(loginSchema, 'body')] }))
apiRouter.get('/me', wrapAction(getProfileAction, { middlewares: [auth] }))
apiRouter.post(
  '/me',
  wrapAction(updateProfileAction, {
    middlewares: [auth, validate(updatePasswordSchema, 'body')],
  }),
)

// Album routes (protected)
apiRouter.get('/albums', wrapAction(getAllAlbumsAction, { middlewares: [auth] }))
apiRouter.post(
  '/albums',
  wrapAction(createAlbumAction, {
    middlewares: [auth, validate(createAlbumSchema, 'body')],
  }),
)
apiRouter.get(
  '/albums/:id',
  wrapAction(getAlbumDetailAction, {
    middlewares: [auth, validate(albumIdSchema, 'params')],
  }),
)
apiRouter.put(
  '/albums/:id',
  wrapAction(updateAlbumAction, {
    middlewares: [auth, validate(albumIdSchema, 'params'), validate(updateAlbumSchema, 'body')],
  }),
)
apiRouter.delete(
  '/albums/:id',
  wrapAction(deleteAlbumAction, {
    middlewares: [auth, validate(albumIdSchema, 'params')],
  }),
)
apiRouter.post(
  '/albums/:id/images',
  wrapAction(uploadImageAction, {
    middlewares: [auth, validate(albumIdSchema, 'params'), upload.single('file') as any],
  }),
)
apiRouter.get(
  '/albums/:id/images',
  wrapAction(getAlbumImagesAction, {
    middlewares: [auth, validate(albumIdSchema, 'params')],
  }),
)
apiRouter.delete(
  '/albums/:id/images/:imageId',
  wrapAction(deleteImageAction, {
    middlewares: [auth, validate(deleteImageParamsSchema, 'params')],
  }),
)

// NES Games routes
apiRouter.get('/nes-games', wrapAction(getAllGamesAction, { middlewares: [] }))
apiRouter.get(
  '/nes-games/:id',
  wrapAction(getGameDetailAction, { middlewares: [validate(nesGameIdSchema, 'params')] }),
)

// One Piece routes
apiRouter.get('/one-piece', wrapAction(getAllEpisodesAction, { middlewares: [] }))
apiRouter.get(
  '/one-piece/:ep',
  wrapAction(getEpisodeDetailAction, { middlewares: [validate(episodeNumberSchema, 'params')] }),
)

// Proxy routes
apiRouter.all('/proxy/:target', proxyAction)

// Playlist routes // Updated comment
apiRouter.get('/playlists', wrapAction(listPlaylistsAction, { middlewares: [] })) // Updated path
apiRouter.get(
  '/playlists/:id/songs', // Updated path
  wrapAction(getSongsInPlaylistAction, { middlewares: [] }),
)
apiRouter.get('/songs/:id/url', wrapAction(getSongUrlAction, { middlewares: [] })) // Updated path

// Mount API routes
api.use('/api', apiRouter)

export const handler = serverless(api)
