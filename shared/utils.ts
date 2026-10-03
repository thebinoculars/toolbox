const processEnv = typeof process !== 'undefined' && process.env ? process.env : {}

const getViteEnv = () => {
  try {
    return (import.meta as { env?: Record<string, string> }).env || {}
  } catch {
    return {}
  }
}

const viteEnv = getViteEnv()

const getRandomKey = (keysString: string): string => {
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

const getEnv = (key: string, defaultValue = '') =>
  processEnv[key] ||
  viteEnv[key] ||
  processEnv[`VITE_${key}`] ||
  viteEnv[`VITE_${key}`] ||
  defaultValue

export const getFilebaseAccessKeyId = () => getEnv('FILEBASE_ACCESS_KEY_ID')
export const getFilebaseMusicBucket = () => getEnv('FILEBASE_MUSIC_BUCKET', '')
export const getFilebaseSecretAccessKey = () => getEnv('FILEBASE_SECRET_ACCESS_KEY')
export const getGoogleMapsApiKey = () => getRandomKey(getEnv('GOOGLE_MAPS_API_KEY'))
export const getGoogleTranslateApiKey = () => getRandomKey(getEnv('GOOGLE_TRANSLATE_API_KEY'))
export const getJwtSecret = () => getEnv('JWT_SECRET')
export const getSupabaseAnonKey = () => getEnv('SUPABASE_ANON_KEY')
export const getSupabaseServiceRoleKey = () => getEnv('SUPABASE_SERVICE_ROLE_KEY')
export const getSupabaseUrl = () => getEnv('SUPABASE_URL')
