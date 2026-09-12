import type {
  SpotlightImage,
  TranslationData,
  WeatherData,
  WeatherForecastData,
} from '~/shared/types'

import { request } from './repository'

export default {
  getCurrentWeather: async (lat: number, lon: number) => {
    return request<WeatherData>({
      method: 'get',
      url: '/proxy/weather',
      params: { lat, lon, path: '/data/2.5/weather' },
    })
  },

  getForecast: async (lat: number, lon: number) => {
    return request<WeatherForecastData>({
      method: 'get',
      url: '/proxy/weather',
      params: { lat, lon, path: '/data/2.5/forecast' },
    })
  },

  translate: async (text: string, targetLang: string, sourceLang?: string) => {
    return request<TranslationData>({
      method: 'post',
      url: '/proxy/translate',
      data: {
        q: text,
        target: targetLang,
        source: sourceLang,
        format: 'text',
      },
    })
  },

  getSpotlightData: async () => {
    return request<SpotlightImage>({
      method: 'get',
      url: '/proxy/spotlight',
    })
  },

  getBingWallpaper: async () => {
    return request<any>({
      method: 'get',
      url: '/proxy/bing-wallpaper',
    })
  },
}
