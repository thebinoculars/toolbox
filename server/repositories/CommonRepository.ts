import type { PostgrestSingleResponse } from '@supabase/supabase-js'

import { InternalServerError, NotFoundError } from '@/services/HttpService'

export type SortOrder = { column: string; ascending: boolean }

export const handleDatabaseQuery = <T>(result: PostgrestSingleResponse<T>): T => {
  if (!result.error) {
    return result.data
  }

  if (result.error.code === 'PGRST116') {
    throw new NotFoundError('Cannot find record')
  }

  throw new InternalServerError('Database query failed', result.error)
}
