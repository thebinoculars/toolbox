export type NesPadKey =
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'SELECT'
  | 'START'

export interface NesEmulatorSettings {
  volume: number
  size: number
  speed: number
  pad1: Record<NesPadKey, string>
  pad2: Record<NesPadKey, string>
}

export interface TextArtSettings {
  width: number
  height: number
  lyrics: string
  lineSeparator: string
  bgColor: string
  brightness: number
  contrast: number
  fontFamily: string
  fontSize: number
  lineHeight: number
  maintainAspectRatio: boolean
}

const KEYS = {
  authToken: 'auth.token',
  musicPlayerVolume: 'music-player.volume',
  musicPlayerShuffle: 'music-player.shuffle',
  musicPlayerRepeat: 'music-player.repeat',
  markdownEditorContent: 'markdown-editor.content',
  nesEmulatorSettings: 'nes-emulator.settings',
  textArtSettings: 'text-art.settings',
} as const

const getItem = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const setItem = (key: string, value: string, label: string): void => {
  try {
    window.localStorage.setItem(key, value)
  } catch (error) {
    console.error(`Failed to set ${label}:`, error)
  }
}

const getJsonObject = <T>(key: string): Partial<T> | null => {
  try {
    const item = getItem(key)
    const parsed: unknown = item ? JSON.parse(item) : null
    return parsed && typeof parsed === 'object' ? (parsed as Partial<T>) : null
  } catch {
    return null
  }
}

export const getAuthToken = (): string | null => getItem(KEYS.authToken)

export const setAuthToken = (token: string): void => setItem(KEYS.authToken, token, 'auth token')

export const removeAuthToken = (): void => {
  try {
    window.localStorage.removeItem(KEYS.authToken)
  } catch (error) {
    console.error('Failed to remove auth token:', error)
  }
}

export const getMusicPlayerVolume = (): number => {
  const volume = parseFloat(getItem(KEYS.musicPlayerVolume) ?? '')
  return Number.isFinite(volume) ? volume : 0.7
}

export const setMusicPlayerVolume = (volume: number): void =>
  setItem(KEYS.musicPlayerVolume, volume.toString(), 'music player volume')

export const getMusicPlayerShuffle = (): boolean => getItem(KEYS.musicPlayerShuffle) === 'true'

export const setMusicPlayerShuffle = (shuffle: boolean): void =>
  setItem(KEYS.musicPlayerShuffle, shuffle.toString(), 'music player shuffle')

export const getMusicPlayerRepeat = (): boolean => getItem(KEYS.musicPlayerRepeat) === 'true'

export const setMusicPlayerRepeat = (repeat: boolean): void =>
  setItem(KEYS.musicPlayerRepeat, repeat.toString(), 'music player repeat')

export const getMarkdownEditorContent = (): string | null => getItem(KEYS.markdownEditorContent)

export const setMarkdownEditorContent = (content: string): void =>
  setItem(KEYS.markdownEditorContent, content, 'markdown editor content')

export const getNesEmulatorSettings = (): Partial<NesEmulatorSettings> | null =>
  getJsonObject<NesEmulatorSettings>(KEYS.nesEmulatorSettings)

export const setNesEmulatorSettings = (settings: NesEmulatorSettings): void =>
  setItem(KEYS.nesEmulatorSettings, JSON.stringify(settings), 'NES emulator settings')

export const getTextArtSettings = (): Partial<TextArtSettings> | null =>
  getJsonObject<TextArtSettings>(KEYS.textArtSettings)

export const setTextArtSettings = (settings: TextArtSettings): void =>
  setItem(KEYS.textArtSettings, JSON.stringify(settings), 'text art settings')
