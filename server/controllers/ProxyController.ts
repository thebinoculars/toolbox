import axios, { isAxiosError } from 'axios'
import { Request, Response } from 'express'

import { responseError } from '@/services/HttpService'
import { getGoogleTranslateApiKey } from '~/shared/utils'

type ProxyService = {
  baseURL: string
  method: 'GET' | 'POST'
  path: string
  params: () => Record<string, string | number>
}

const SERVICES: Record<string, ProxyService> = {
  weather: {
    baseURL: 'https://api.open-meteo.com',
    method: 'GET',
    path: '/v1/forecast',
    params: () => ({
      current:
        'temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,wind_speed_10m,weather_code,is_day',
      hourly: 'temperature_2m,weather_code,is_day',
      wind_speed_unit: 'ms',
      timeformat: 'unixtime',
      forecast_days: 6,
    }),
  },
  spotlight: {
    baseURL: 'https://fd.api.iris.microsoft.com/v4/api',
    method: 'GET',
    path: '/selection',
    params: () => ({ placement: '88000820', fmt: 'json', locale: 'en-US', country: 'us' }),
  },
  translate: {
    baseURL: 'https://translation.googleapis.com',
    method: 'POST',
    path: '/language/translate/v2',
    params: () => ({ key: getGoogleTranslateApiKey() }),
  },
  'bing-wallpaper': {
    baseURL: 'https://www.bing.com',
    method: 'GET',
    path: '/HPImageArchive.aspx',
    params: () => ({ format: 'js', idx: -1, n: 1, mkt: 'en-US' }),
  },
}

const FORWARDED_REQUEST_HEADERS = ['accept', 'accept-language']

export const proxyAction = async (req: Request, res: Response) => {
  const service = SERVICES[req.params.target]
  if (!service) {
    return responseError(res, 'Unknown proxy target', 404)
  }

  if (req.method !== service.method) {
    return responseError(res, 'Method not allowed', 405)
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  FORWARDED_REQUEST_HEADERS.forEach((name) => {
    const value = req.headers[name]
    if (typeof value === 'string') {
      headers[name] = value
    }
  })

  try {
    const response = await axios({
      method: service.method,
      baseURL: service.baseURL,
      url: service.path,
      params: { ...(req.query as Record<string, string>), ...service.params() },
      data: service.method === 'POST' ? req.body : undefined,
      headers,
      responseType: 'text',
      timeout: 10000,
    })

    const contentType = response.headers['content-type']
    if (contentType) {
      res.setHeader('Content-Type', String(contentType))
    }
    return res.status(response.status).send(response.data)
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined
    // Upstream auth failures mean our API key is bad; a 401 here would log the user out
    if (status && status < 500 && status !== 401 && status !== 403) {
      return responseError(res, 'Upstream request failed', status)
    }
    console.error('Proxy error:', error)
    return responseError(res, 'Upstream service unavailable', 502)
  }
}
