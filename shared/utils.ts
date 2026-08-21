const processEnv = typeof process !== 'undefined' && process.env ? process.env : {}

const getViteEnv = () => {
  try {
    return (import.meta as any).env || {}
  } catch {
    return {}
  }
}

const viteEnv = getViteEnv()

export const getRandomKey = (keysString: string): string => {
  if (!keysString) {
    return ''
  }
  const keys = keysString
    .split(',')
    .map((key) => key.trim())
    .filter((key) => !!key)
  if (keys.length === 0) {
    return ''
  }
  const randomIndex = Math.floor(Math.random() * keys.length)
  return keys[randomIndex]
}

export const getEnv = (key: string, defaultValue: string = '') => {
  const value =
    processEnv[key] || viteEnv[key] || processEnv[`VITE_${key}`] || viteEnv[`VITE_${key}`]

  if (value === undefined || value === '') {
    if (defaultValue === undefined) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
    return defaultValue
  }

  return getRandomKey(value)
}

export const getFilebaseAccessKeyId = () => getEnv('FILEBASE_ACCESS_KEY_ID')
export const getFilebaseMusicBucket = () => getEnv('FILEBASE_MUSIC_BUCKET', '')
export const getFilebaseSecretAccessKey = () => getEnv('FILEBASE_SECRET_ACCESS_KEY')
export const getGoogleMapsApiKey = () => getEnv('GOOGLE_MAPS_API_KEY')
export const getGoogleTranslateApiKey = () => getEnv('GOOGLE_TRANSLATE_API_KEY')
export const getJwtSecret = () => getEnv('JWT_SECRET')
export const getSupabaseAnonKey = () => getEnv('SUPABASE_ANON_KEY')
export const getSupabaseServiceRoleKey = () => getEnv('SUPABASE_SERVICE_ROLE_KEY')
export const getSupabaseUrl = () => getEnv('SUPABASE_URL')
export const getWeatherApiKey = () => getEnv('OPEN_WEATHER_MAP_API_KEY')
