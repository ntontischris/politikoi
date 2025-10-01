import { create } from 'zustand'
import { supabase, signInWithPassword, signOut as supabaseSignOut } from '../lib/supabase'
import type { User, AuthError } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name?: string | null  // Computed field
  role: 'admin' | 'user'
  role_id: string
  is_active: boolean
  last_login?: string | null
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
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        set({ user })
        await get().loadProfile()
      }
    } catch (error) {
      // Silent fail in production - user will be redirected to login
    } finally {
      set({ loading: false, initialized: true })
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        set({ user: session.user, loading: false })
        await get().loadProfile()

        // Record login session (with error handling)
        try {
          await supabase.from('user_sessions').insert({
            user_id: session.user.id,
            session_token: session.access_token,
            user_agent: navigator.userAgent,
            is_active: true
          })

          // Update last login
          await supabase.from('user_profiles').update({
            last_login_at: new Date().toISOString(),
            last_login_ip: null // Will be set by trigger if available
          }).eq('id', session.user.id)
        } catch (error) {
          console.error('Failed to record session:', error)
          // Silent fail - don't block login for non-critical operations
        }

      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, loading: false })
      }
    })
  },

  loadProfile: async () => {
    const { user } = get()
    if (!user) return

    try {
      // Query user_profiles table by user id
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      const userProfile: UserProfile = {
        id: profile.id,
        email: profile.email || user.email,
        first_name: null,
        last_name: null,
        full_name: profile.full_name,
        role: profile.role || 'user',
        role_id: profile.role || 'user',
        is_active: profile.is_active !== false,
        last_login: profile.last_login_at,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        permissions: profile.role === 'admin' ? { all: true } : {}
      }

      set({ profile: userProfile })
    } catch (error) {
      console.error('Failed to load profile:', error)
      // Silent fail - profile load is non-critical
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true })

    try {
      const { data, error } = await signInWithPassword(email, password)

      if (error) {
        set({ loading: false })
        return { error }
      }

      if (data.user) {
        set({ user: data.user, loading: false })
        // Profile will be loaded by the auth state change listener
      } else {
        set({ loading: false })
      }

      return { error }
    } catch (error) {
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
        // Silent fail - don't block logout
      }
    }

    try {
      await supabaseSignOut()
    } catch (error) {
      // Silent fail
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
