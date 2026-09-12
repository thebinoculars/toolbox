import { createSignedUrl } from './Common'

const NES_ROMS_BUCKET = 'nes-roms'

export const createNesUrl = async (path: string): Promise<string | null> => {
  const signedData = await createSignedUrl(path, 60 * 60, NES_ROMS_BUCKET)
  return signedData?.signedUrl || null
}
