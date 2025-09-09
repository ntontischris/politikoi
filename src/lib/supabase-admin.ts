import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

// For now, we'll try using a different approach
// If you have the service role key, you can add it as VITE_SUPABASE_SERVICE_ROLE_KEY
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL')
}

// Create admin client with service role if available, otherwise fallback to anon key
export const supabaseAdmin = createClient(
  supabaseUrl, 
  serviceRoleKey || import.meta.env.VITE_SUPABASE_ANON_KEY,
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