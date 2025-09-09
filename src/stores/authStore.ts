import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, AuthError } from '@supabase/supabase-js'

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
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      set({ user })
      await get().loadProfile()
    }
    
    set({ loading: false, initialized: true })

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        set({ user: session.user })
        await get().loadProfile()
        
        // Record login session
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
        
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null })
      }
    })
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
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    set({ loading: false })
    return { error }
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