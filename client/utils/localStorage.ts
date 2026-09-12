// Auth
export const getAuthToken = (): string | null => {
  try {
    return window.localStorage.getItem('auth.token')
  } catch {
    return null
  }
}

export const setAuthToken = (token: string): void => {
  try {
    window.localStorage.setItem('auth.token', token)
  } catch (error) {
    console.error('Failed to set auth token:', error)
  }
}

export const removeAuthToken = (): void => {
  try {
    window.localStorage.removeItem('auth.token')
  } catch (error) {
    console.error('Failed to remove auth token:', error)
  }
}

// Music Player
export const getMusicPlayerVolume = (): number => {
  try {
    const item = window.localStorage.getItem('music-player.volume')
    return item ? parseFloat(item) : 0.7
  } catch {
    return 0.7
  }
}

export const setMusicPlayerVolume = (volume: number): void => {
  try {
    window.localStorage.setItem('music-player.volume', volume.toString())
  } catch (error) {
    console.error('Failed to set music player volume:', error)
  }
}

export const getMusicPlayerShuffle = (): boolean => {
  try {
    return window.localStorage.getItem('music-player.shuffle') === 'true'
  } catch {
    return false
  }
}

export const setMusicPlayerShuffle = (shuffle: boolean): void => {
  try {
    window.localStorage.setItem('music-player.shuffle', shuffle.toString())
  } catch (error) {
    console.error('Failed to set music player shuffle:', error)
  }
}

export const getMusicPlayerRepeat = (): boolean => {
  try {
    return window.localStorage.getItem('music-player.repeat') === 'true'
  } catch {
    return false
  }
}

export const setMusicPlayerRepeat = (repeat: boolean): void => {
  try {
    window.localStorage.setItem('music-player.repeat', repeat.toString())
  } catch (error) {
    console.error('Failed to set music player repeat:', error)
  }
}

// Markdown Editor
export const getMarkdownEditorContent = (): string | null => {
  try {
    return window.localStorage.getItem('markdown-editor.content')
  } catch {
    return null
  }
}

export const setMarkdownEditorContent = (content: string): void => {
  try {
    window.localStorage.setItem('markdown-editor.content', content)
  } catch (error) {
    console.error('Failed to set markdown editor content:', error)
  }
}

// NES Emulator
export const getNesEmulatorSettings = (): any => {
  try {
    const item = window.localStorage.getItem('nes-emulator.settings')
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

export const setNesEmulatorSettings = (settings: any): void => {
  try {
    window.localStorage.setItem('nes-emulator.settings', JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to set NES emulator settings:', error)
  }
}

// Text Art Generator
export const getTextArtSettings = (): any => {
  try {
    const item = window.localStorage.getItem('text-art.settings')
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

export const setTextArtSettings = (settings: any): void => {
  try {
    window.localStorage.setItem('text-art.settings', JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to set text art settings:', error)
  }
}
