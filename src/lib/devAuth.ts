// Development-only authentication bypass
import type { User } from '@supabase/supabase-js'

export interface MockUser extends User {
  id: string
  email: string
  app_metadata: {
    provider?: string
    providers?: string[]
  }
  user_metadata: {
    full_name?: string
  }
  aud: string
  created_at: string
  role?: string
}

export const DEV_AUTH = {
  enabled: import.meta.env.DEV,

  mockUser: {
    id: '4433c3a3-c0af-4f9b-84ec-d7b64b8da35e',
    email: 'admin@politikoi.gr',
    app_metadata: {
      provider: 'email',
      providers: ['email']
    },
    user_metadata: {
      full_name: 'Administrator'
    },
    aud: 'authenticated',
    created_at: '2025-09-29T15:11:32.252299+00:00',
    role: 'authenticated'
  } as MockUser,

  mockProfile: {
    id: '4433c3a3-c0af-4f9b-84ec-d7b64b8da35e',
    email: 'admin@politikoi.gr',
    full_name: 'Administrator',
    role: 'admin',
    is_active: true,
    permissions: { all: true }
  },

  async signIn() {
    if (!this.enabled) return { data: null, error: { message: 'Dev auth disabled' } }

    try {
      console.log('🔧 DEV MODE: Using mock authentication')
      localStorage.setItem('dev-auth-user', JSON.stringify(this.mockUser))
      localStorage.setItem('dev-auth-profile', JSON.stringify(this.mockProfile))

      return {
        data: {
          user: this.mockUser,
          session: {
            access_token: 'dev-token',
            user: this.mockUser
          }
        },
        error: null
      }
    } catch (error) {
      console.error('Dev auth error:', error)
      return { data: null, error }
    }
  },

  async signOut() {
    if (!this.enabled) return

    localStorage.removeItem('dev-auth-user')
    localStorage.removeItem('dev-auth-profile')
    console.log('🔧 DEV MODE: Cleared mock authentication')
  },

  getUser(): MockUser | null {
    if (!this.enabled) return null

    try {
      const stored = localStorage.getItem('dev-auth-user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  },

  getProfile() {
    if (!this.enabled) return null

    try {
      const stored = localStorage.getItem('dev-auth-profile')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  },

  isEnabled() {
    return this.enabled && import.meta.env.DEV
  },

  // Utility για έλεγχο αν χρησιμοποιούμε dev auth
  isDevMode() {
    return this.enabled && !!this.getUser()
  }
}

// Export για χρήση σε άλλα components
export const mockUser = DEV_AUTH.mockUser
export const mockProfile = DEV_AUTH.mockProfile