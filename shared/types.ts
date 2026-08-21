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
  description: string | null
  is_private: boolean
  created_at: string
  user_id: number
  cover_image?: string
  total?: number
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

export interface WeatherData {
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    humidity: number
  }
  visibility: number
  wind: {
    speed: number
    deg: number
  }
  clouds: {
    all: number
  }
  dt: number
  sys: {
    country: string
    sunrise: number
    sunset: number
  }
  timezone: number
  id: number
  name: string
  cod: number
}

export interface WeatherForecastData {
  list: Array<{
    dt: number
    main: {
      temp: number
      feels_like: number
      temp_min: number
      temp_max: number
      pressure: number
      humidity: number
    }
    weather: Array<{
      id: number
      main: string
      description: string
      icon: string
    }>
    clouds: {
      all: number
    }
    wind: {
      speed: number
      deg: number
    }
    visibility: number
    pop: number
    dt_txt: string
  }>
  city: {
    id: number
    name: string
    coord: {
      lat: number
      lon: number
    }
    country: string
    population: number
    timezone: number
    sunrise: number
    sunset: number
  }
  cod: string
  message: number
  cnt: number
}

export interface TranslationData {
  data: {
    translations: Array<{
      translatedText: string
      detectedSourceLanguage?: string
    }>
  }
}
