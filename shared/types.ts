export type TimerId = ReturnType<typeof setTimeout> | any
export type IntervalId = ReturnType<typeof setInterval> | any

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  has_more: boolean
  page: number
  limit: number
}

export interface User {
  id: number
  email: string
  is_approved: boolean
  password: string
}

export interface NesGame {
  id: number
  name: string
  path: string
  url?: string
}

export interface OnePieceStamp {
  time: string
  song: {
    id: number
    titles: {
      en: string
    }
  }
  album: {
    titles: {
      en: string
    }
  }
}

export interface OnePieceEpisode {
  id: number
  episode: number
  title_en: string
  title_ja: string
  release_date: string
  stamps: OnePieceStamp[]
}

export interface SpotlightImageUrl {
  asset: string
}

export interface SpotlightImage {
  ad: {
    title: string
    portraitImage: SpotlightImageUrl
    landscapeImage: SpotlightImageUrl
  }
}

export interface Album {
  id: number
  name: string
  created_at: string
}

export interface Image {
  id: number
  url: string
  path: string
  filename: string
  original_name: string
  size: number | null
  format: string | null
  width: number | null
  height: number | null
  created_at: string
  album_id: number
}

export interface OpenMeteoData {
  current: {
    time: number
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    pressure_msl: number
    wind_speed_10m: number
    weather_code: number
    is_day: number
  }
  hourly: {
    time: number[]
    temperature_2m: number[]
    weather_code: number[]
    is_day: number[]
  }
}

export interface TranslationData {
  data: {
    translations: Array<{
      translatedText: string
      detectedSourceLanguage?: string
    }>
  }
}
