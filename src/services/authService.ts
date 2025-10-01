import { supabase } from '../lib/supabase'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import type { UserProfile } from '../stores/authStore'

export interface CreateUserData {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'user'
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  ip_address: string | null
  user_agent: string | null
  is_active: boolean
  login_time: string
  logout_time: string | null
  last_activity: string
}

export interface AuditLogEntry {
  id: string
  user_id: string | null
  user_email: string | null
  full_name: string | null
  action: string
  table_name: string | null
  record_id: string | null
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

class AuthService {
  // Admin Functions
  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(profile => ({
      id: profile.id,
      email: profile.email,
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
    }))
  }

  async createUser(userData: CreateUserData): Promise<{ user: any; error: any }> {
    try {
      console.log('Creating user:', userData.email)

      // Create user in auth.users via Supabase Auth Admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: userData.full_name
        }
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        return { user: null, error: authError }
      }

      if (!authData.user) {
        return { user: null, error: new Error('Failed to create auth user') }
      }

      console.log('Auth user created:', authData.user.id)

      // Create user profile in user_profiles table
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          is_active: true
        })
        .select()
        .single()

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // Rollback: delete auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return { user: null, error: profileError }
      }

      console.log('User created successfully')

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          user_metadata: authData.user.user_metadata
        },
        error: null
      }
    } catch (error) {
      console.error('Error creating user:', error)
      return { user: null, error: error as any }
    }
  }

  async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({ role: role })
      .eq('id', userId)

    if (error) throw error
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({ is_active: isActive })
      .eq('id', userId)

    if (error) throw error
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      console.log('Deleting user:', userId)

      // First delete from auth.users using Admin API
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (authError) {
        console.error('Error deleting auth user:', authError)
        throw authError
      }

      // Then delete from user_profiles
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        console.error('Error deleting user profile:', profileError)
        // Don't throw - auth user is already deleted
        console.warn('Profile deletion failed but auth user was deleted')
      }

      console.log('User deleted successfully')
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  // Session Management
  async getUserSessions(userId?: string): Promise<UserSession[]> {
    let query = supabase
      .from('user_sessions')
      .select('*')
      .order('login_time', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async getActiveSessions(): Promise<UserSession[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('is_active', true)
      .order('last_activity', { ascending: false })

    if (error) throw error
    return data || []
  }

  async terminateSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update({
        is_active: false,
        logout_time: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) throw error
  }

  async terminateAllUserSessions(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update({
        is_active: false,
        logout_time: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) throw error
  }

  // Audit Logs
  async getAuditLogs(
    limit = 50,
    offset = 0,
    userId?: string,
    action?: string,
    tableName?: string
  ): Promise<AuditLogEntry[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (action) {
      query = query.eq('action', action)
    }

    if (tableName) {
      query = query.eq('table_name', tableName)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async getAuditStats(): Promise<{
    totalLogs: number
    todayLogs: number
    uniqueUsers: number
    topActions: Array<{ action: string; count: number }>
  }> {
    const today = new Date().toISOString().split('T')[0]
    
    const [totalResult, todayResult, usersResult, actionsResult] = await Promise.all([
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('audit_logs').select('user_id').not('user_id', 'is', null),
      supabase.from('audit_logs').select('action').not('action', 'is', null)
    ])

    const uniqueUsers = new Set(usersResult.data?.map(row => row.user_id)).size
    
    const actionCounts = (actionsResult.data || []).reduce((acc, row) => {
      acc[row.action] = (acc[row.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topActions = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }))

    return {
      totalLogs: totalResult.count || 0,
      todayLogs: todayResult.count || 0,
      uniqueUsers,
      topActions
    }
  }

  // Helper Methods
  async getRoles() {
    // Return static roles since we don't have user_roles table
    return [
      { id: 'admin', role_name: 'admin', permissions: { all: true } },
      { id: 'user', role_name: 'user', permissions: {} }
    ]
  }

  // Manual audit log entry for custom actions
  async logActivity(
    action: string,
    tableName?: string,
    recordId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      user_email: user.email,
      full_name: profile?.full_name,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues,
      new_values: newValues
    })
  }
}

export const authService = new AuthService()