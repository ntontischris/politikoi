import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL')
}

if (!supabaseServiceRoleKey) {
  console.warn('Missing service role key, using anon key for admin operations')
}

// Admin client with service role key for user management
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'citizen-management-admin'
      }
    }
  }
)