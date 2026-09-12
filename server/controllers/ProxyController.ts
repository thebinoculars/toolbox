import axios, { AxiosRequestConfig } from 'axios'
import { Request, Response } from 'express'
import { URLSearchParams } from 'url'

import { getGoogleTranslateApiKey, getWeatherApiKey } from '../../shared/utils'
import { responseError } from '../services/http'

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
}

const SERVICES = {
  weather: {
    baseURL: 'https://api.openweathermap.org',
    params: {
      units: 'metric',
      lang: 'en',
      appid: getWeatherApiKey(),
    },
  },
  spotlight: {
    baseURL: 'https://fd.api.iris.microsoft.com/v4/api',
    url: '/selection',
    params: {
      placement: '88000820',
      fmt: 'json',
      locale: 'en-US',
      country: 'us',
    },
  },
  translate: {
    baseURL: 'https://translation.googleapis.com',
    url: '/language/translate/v2',
    params: {
      key: getGoogleTranslateApiKey(),
    },
    transformResponse: (response: Record<string, unknown>) => ({
      ...response,
      headers: DEFAULT_HEADERS,
    }),
  },
  'bing-wallpaper': {
    baseURL: 'https://www.bing.com',
    url: '/HPImageArchive.aspx',
    params: {
      format: 'js',
      idx: -1,
      n: 1,
      mkt: 'en-US',
    },
  },
}

export const proxyAction = async (req: Request, res: Response) => {
  const { target } = req.params
  const incomingHeaders = req.headers || {}
  const rawQuery = req.query || {}

  const config = SERVICES[target as keyof typeof SERVICES] as
    | (AxiosRequestConfig & {
        transformRequest?: (config: AxiosRequestConfig) => AxiosRequestConfig
        transformResponse?: (response: {
          data: Record<string, unknown>
          status: number
          headers: Record<string, unknown>
        }) => {
          data: Record<string, unknown>
          status: number
          headers: Record<string, unknown>
        }
      })
    | undefined

  if (!config) {
    return responseError(res, `Unknown target "${target}"`, 400)
  }

  const mergedQuery = { ...config.params }
  Object.entries(rawQuery).forEach(([key, value]) => {
    mergedQuery[key] = value
  })
  const queryParams = new URLSearchParams(mergedQuery)

  let requestUrl = config.url || ''
  let baseURL = config.baseURL || ''

  if ('path' in rawQuery && rawQuery.path) {
    const pathValue = rawQuery.path as string
    requestUrl = pathValue.startsWith('/') ? pathValue : `/${pathValue}`
    queryParams.delete('path')
  }

  const axiosConfig: AxiosRequestConfig = {
    method: req.method,
    baseURL,
    url: requestUrl,
    params: Object.fromEntries(queryParams),
    headers: { ...DEFAULT_HEADERS },
    data: req.body,
    responseType: 'text' as const,
  }

  const finalConfig = config.transformRequest ? config.transformRequest(axiosConfig) : axiosConfig

  const forwardHeaders: Record<string, string> = {}
  Object.entries(incomingHeaders).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase()
    if (lowerKey !== 'host' && lowerKey !== 'content-length' && typeof value === 'string') {
      forwardHeaders[key] = value
    }
  })

  finalConfig.headers = { ...DEFAULT_HEADERS, ...forwardHeaders }

  const response = await axios(finalConfig)

  let responseData = response.data
  let responseStatus = response.status
  let responseHeaders: Record<string, string> = {}

  if (config.transformResponse) {
    const transformed = config.transformResponse({
      data: response.data,
      status: response.status,
      headers: response.headers,
    })
    responseData = transformed.data
    responseStatus = transformed.status
    responseHeaders = transformed.headers as Record<string, string>
  } else {
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value) {
        responseHeaders[key] = String(value)
      }
    })
  }

  res.status(responseStatus)
  Object.entries(responseHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })
  res.send(responseData)
}
