import { request } from '@/repositories/repository'
import type { OpenMeteoData, SpotlightImage, TranslationData } from '~/shared/types'

interface BingWallpaperResponse {
  images?: { url: string }[]
}

export default {
  getWeather: async (latitude: number, longitude: number) => {
    return request<OpenMeteoData>({
      method: 'get',
      url: '/proxy/weather',
      params: { latitude, longitude },
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
    return request<BingWallpaperResponse>({
      method: 'get',
      url: '/proxy/bing-wallpaper',
    })
  },
}
