import { PostgrestError } from '@supabase/supabase-js'

import { InternalServerError, NotFoundError } from '../services/http'

export const handleDatabaseQuery = <T>(result: {
  data: T | null
  error: PostgrestError | null
}): T | null => {
  if (!result.error) {
    return result.data
  }

  if (result.error.code === 'PGRST116') {
    throw new NotFoundError('Cannot find record')
  }

  throw new InternalServerError('Database query failed', result.error)
}
