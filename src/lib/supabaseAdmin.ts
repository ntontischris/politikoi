import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uxavpiieohxibqikxspp.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YXZwaWllb2h4aWJxaWt4c3BwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA4MjM5NCwiZXhwIjoyMDcyNjU4Mzk0fQ.Bk2RFip7zckTb1PL_1d5ZdwxmPsyugFvy6E5Was-RNk'

// Admin client with service role key for user management
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})