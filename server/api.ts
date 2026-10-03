import express, { Router } from 'express'
import serverless from 'serverless-http'

import {
  createAlbumAction,
  deleteAlbumAction,
  deleteImageAction,
  getAlbumDetailAction,
  getAlbumImagesAction,
  getAllAlbumsAction,
  updateAlbumAction,
  uploadImageAction,
} from '@/controllers/AlbumController'
import { getProfileAction, loginAction, updateProfileAction } from '@/controllers/AuthController'
import { getAllGamesAction, getGameDetailAction } from '@/controllers/NesGameController'
import { getAllEpisodesAction, getEpisodeDetailAction } from '@/controllers/OnePieceController'
import {
  getSongsInPlaylistAction,
  getSongUrlAction,
  listPlaylistsAction,
} from '@/controllers/PlaylistController'
import { proxyAction } from '@/controllers/ProxyController'
import { auth, sameOriginOnly, uploadSingle, validate, wrapAction } from '@/services/HttpService'
import {
  albumIdSchema,
  albumImagesQuerySchema,
  albumsQuerySchema,
  createAlbumSchema,
  imageParamsSchema,
  updateAlbumSchema,
} from '@/validations/AlbumValidation'
import { loginSchema, updatePasswordSchema } from '@/validations/AuthValidation'
import { nesGameIdSchema } from '@/validations/NesGameValidation'
import { episodeNumberSchema } from '@/validations/OnePieceValidation'

const api = express()

api.use(sameOriginOnly)
api.use(express.json())
api.use(express.urlencoded({ extended: true }))

const router = Router()

const validateAlbumId = validate(albumIdSchema, 'params')

router.post('/login', wrapAction(loginAction, [validate(loginSchema, 'body')]))
router.get('/me', wrapAction(getProfileAction, [auth]))
router.post('/me', wrapAction(updateProfileAction, [auth, validate(updatePasswordSchema, 'body')]))

router.get('/albums', wrapAction(getAllAlbumsAction, [auth, validate(albumsQuerySchema, 'query')]))
router.post('/albums', wrapAction(createAlbumAction, [auth, validate(createAlbumSchema, 'body')]))
router.get('/albums/:id', wrapAction(getAlbumDetailAction, [auth, validateAlbumId]))
router.put(
  '/albums/:id',
  wrapAction(updateAlbumAction, [auth, validateAlbumId, validate(updateAlbumSchema, 'body')]),
)
router.delete('/albums/:id', wrapAction(deleteAlbumAction, [auth, validateAlbumId]))
router.post(
  '/albums/:id/images',
  wrapAction(uploadImageAction, [auth, validateAlbumId, uploadSingle('file')]),
)
router.get(
  '/albums/:id/images',
  wrapAction(getAlbumImagesAction, [
    auth,
    validateAlbumId,
    validate(albumImagesQuerySchema, 'query'),
  ]),
)
router.delete(
  '/albums/:id/images/:imageId',
  wrapAction(deleteImageAction, [auth, validate(imageParamsSchema, 'params')]),
)

router.get('/nes-games', wrapAction(getAllGamesAction))
router.get('/nes-games/:id', wrapAction(getGameDetailAction, [validate(nesGameIdSchema, 'params')]))

router.get('/one-piece', wrapAction(getAllEpisodesAction))
router.get(
  '/one-piece/:ep',
  wrapAction(getEpisodeDetailAction, [validate(episodeNumberSchema, 'params')]),
)

router.all('/proxy/:target', proxyAction)

router.get('/playlists', wrapAction(listPlaylistsAction))
router.get('/playlists/:id/songs', wrapAction(getSongsInPlaylistAction))
router.get('/songs/:id/url', wrapAction(getSongUrlAction))

api.use('/api', router)

export const handler = serverless(api)
