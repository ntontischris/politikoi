import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'politikoi-auth',
    flowType: 'implicit'
  },
  global: {
    headers: {
      'X-Client-Info': 'citizen-management-dashboard'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000)
  }
})

// Helper functions για καλύτερο auth handling
export const getUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export const signInWithPassword = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    })
    return { data, error }
  } catch (error) {
    console.error('Sign in error:', error)
    return { data: null, error }
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Sign out error:', error)
    return { error }
  }
}

// Types based on existing database schema
export interface Citizen {
  id: string
  surname: string
  name: string
  afm?: string | null
  recommendation_from?: string
  patronymic?: string
  phone?: string
  landline?: string
  email?: string
  address?: string
  postalCode?: string
  municipality?: 'ΠΑΥΛΟΥ ΜΕΛΑ' | 'ΚΟΡΔΕΛΙΟΥ-ΕΥΟΣΜΟΥ' | 'ΑΜΠΕΛΟΚΗΠΩΝ-ΜΕΝΕΜΕΝΗΣ' | 'ΝΕΑΠΟΛΗΣ-ΣΥΚΕΩΝ' | 'ΘΕΣΣΑΛΟΝΙΚΗΣ' | 'ΚΑΛΑΜΑΡΙΑΣ' | 'ΑΛΛΟ'
  area?: string
  electoralDistrict?: 'Α ΘΕΣΣΑΛΟΝΙΚΗΣ' | 'Β ΘΕΣΣΑΛΟΝΙΚΗΣ'
  last_contact_date?: string
  notes?: string
  status?: 'active' | 'inactive'
  created_at: string
  updated_at: string
  created_by?: string
}

export interface Request {
  id: string
  citizen_id?: string
  request_type: string
  description: string
  status?: 'pending' | 'in-progress' | 'completed' | 'rejected' | 'ΕΚΚΡΕΜΕΙ' | 'ΟΛΟΚΛΗΡΩΘΗΚΕ' | 'ΑΠΟΡΡΙΦΘΗΚΕ'
  priority?: 'low' | 'medium' | 'high'
  send_date?: string
  completion_date?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface MilitaryPersonnel {
  id: string
  name: string
  surname: string
  rank?: string
  service_unit?: string
  wish?: string
  send_date?: string
  comments?: string
  military_id?: string
  esso?: string
  esso_year?: string
  esso_letter?: 'Α' | 'Β' | 'Γ' | 'Δ' | 'Ε' | 'ΣΤ'
  status?: 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string
  updated_at: string
  created_by?: string
}

export interface UserProfile {
  id: string
  full_name?: string
  role?: string
  last_login_at?: string
  last_login_ip?: string
  is_active?: boolean
  created_at: string
  updated_at: string
  email?: string
}

export interface Reminder {
  id: string
  title: string
  description?: string
  reminder_date: string
  reminder_type?: 'ΕΟΡΤΗ' | 'ΑΙΤΗΜΑ' | 'ΓΕΝΙΚΗ'
  related_request_id?: string
  is_completed?: boolean
  created_at: string
  created_by?: string
}