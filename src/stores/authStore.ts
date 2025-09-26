import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, AuthError } from '@supabase/supabase-js'

// Check if we're in development mode and Supabase is available
const isSupabaseAvailable = () => {
  try {
    return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
  } catch {
    return false
  }
}

// Mock user for development
const mockUser: User = {
  id: 'mock-user-id',
  email: 'demo@example.com',
  app_metadata: {},
  user_metadata: { full_name: 'Demo User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  role: 'authenticated'
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'user'
  role_id: string
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
  permissions: Record<string, any>
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initialized: boolean
  
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  loadProfile: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  isAdmin: () => boolean
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    set({ loading: true })

    try {
      // Check if Supabase is available
      if (!isSupabaseAvailable()) {
        console.log('Supabase not available, using mock initialization')
        // Mock initialization - no persistent session in mock mode
        set({ loading: false, initialized: true })
        return
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        set({ user })
        await get().loadProfile()
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      set({ loading: false, initialized: true })
    }

    // Listen for auth state changes (only if Supabase is available)
    if (isSupabaseAvailable()) {
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          set({ user: session.user, loading: false })
          await get().loadProfile()

          // Record login session (with error handling)
          try {
            await supabase.from('user_sessions').insert({
              user_id: session.user.id,
              session_token: session.access_token,
              ip_address: null, // Will be set by trigger
              user_agent: navigator.userAgent,
              is_active: true
            })

            // Update last login
            await supabase.from('user_profiles').update({
              last_login_at: new Date().toISOString()
            }).eq('id', session.user.id)
          } catch (error) {
            console.error('Error updating login records:', error)
            // Don't block the login process for non-critical operations
          }

        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, loading: false })
        }
      })
    }
  },

  loadProfile: async () => {
    const { user } = get()
    if (!user) return

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          role:user_roles(role_name, permissions)
        `)
        .eq('id', user.id)
        .single()

      if (error) throw error

      const userProfile: UserProfile = {
        ...profile,
        role: profile.role?.role_name || 'user',
        permissions: profile.role?.permissions || {}
      }

      set({ profile: userProfile })
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true })

    try {
      // Attempting login

      // Check if Supabase is available
      if (!isSupabaseAvailable()) {
        console.error('Supabase configuration is missing. Please check your environment variables.')
        set({ loading: false })
        return {
          error: {
            message: 'Service unavailable. Please check configuration.'
          } as AuthError
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      // Login response processed

      if (!error && data.user) {
        console.log('Login successful, setting user state')
        // Set user immediately upon successful login
        set({ user: data.user, loading: false })
        // Profile will be loaded by the auth state change listener
      } else {
        console.log('Login failed or no user data')
        set({ loading: false })
      }

      return { error }
    } catch (error) {
      console.error('Login error:', error)
      set({ loading: false })
      return { error: error as AuthError }
    }
  },

  signUp: async (email: string, password: string, fullName: string) => {
    set({ loading: true })
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })

    if (!error && data.user) {
      // Profile will be created automatically by trigger
      // Wait a moment for the trigger to complete
      setTimeout(async () => {
        await get().loadProfile()
      }, 1000)
    }

    set({ loading: false })
    return { error }
  },

  signOut: async () => {
    const { user } = get()
    
    if (user) {
      // Mark current session as inactive
      try {
        await supabase
          .from('user_sessions')
          .update({ 
            is_active: false,
            logout_time: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('is_active', true)
      } catch (error) {
        console.error('Error updating session:', error)
      }
    }

    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
    
    set({ user: null, profile: null })
    
    // Force redirect to login page
    window.location.href = '/login'
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { user } = get()
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      await get().loadProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  },

  isAdmin: () => {
    const { profile } = get()
    return profile?.role === 'admin'
  },

  hasPermission: (permission: string) => {
    const { profile } = get()
    if (!profile) return false
    
    // Admin has all permissions
    if (profile.role === 'admin') return true
    
    // Check specific permission
    const permissions = profile.permissions || {}
    return permissions[permission] === true || permissions.all === true
  }
}))