import { createClient } from '@supabase/supabase-js'

import { getSupabaseServiceRoleKey, getSupabaseUrl } from '../../shared/utils'

const supabaseUrl = getSupabaseUrl()
const supabaseServiceRoleKey = getSupabaseServiceRoleKey()

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase configuration')
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
