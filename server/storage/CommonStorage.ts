import { InternalServerError, NotFoundError } from '@/services/HttpService'
import { supabase } from '@/services/SupabaseService'

type SupabaseError = {
  message: string
  status?: number
  code?: string
  details?: unknown
}

export const handleStorageOperation = <T>(result: {
  data: T | null
  error: SupabaseError | null
}): T => {
  if (result.error) {
    throw new InternalServerError('Storage operation failed', result.error)
  }

  if (result.data === null) {
    throw new NotFoundError('Resource not found in storage')
  }

  return result.data
}

export const createSignedUrl = async (
  path: string,
  expiresIn: number,
  bucket: string,
): Promise<{ signedUrl: string }> => {
  const result = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
  return handleStorageOperation(result)
}

export const uploadFile = async (
  path: string,
  fileBuffer: Buffer,
  contentType: string,
  bucket: string,
): Promise<{ path: string }> => {
  const result = await supabase.storage.from(bucket).upload(path, fileBuffer, { contentType })
  return handleStorageOperation(result)
}

export const deleteFile = async (path: string, bucket: string): Promise<void> => {
  const result = await supabase.storage.from(bucket).remove([path])
  handleStorageOperation(result)
}
