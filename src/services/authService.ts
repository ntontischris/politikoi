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
      .select(`
        *,
        role:user_roles(role_name, permissions)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(profile => ({
      ...profile,
      role: profile.role?.role_name || 'user',
      permissions: profile.role?.permissions || {}
    }))
  }

  async createUser(userData: CreateUserData): Promise<{ user: any; error: any }> {
    try {
      // Create the user in Supabase Auth using admin client
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name
        }
      })

      if (error) return { user: null, error }

      // Update the user's role
      if (data.user) {
        const roleId = await this.getRoleId(userData.role)
        
        // Use admin client to bypass RLS
        await supabaseAdmin
          .from('user_profiles')
          .update({
            full_name: userData.full_name,
            role_id: roleId,
            email: userData.email
          })
          .eq('id', data.user.id)
      }

      return { user: data.user, error: null }
    } catch (error) {
      console.error('Error creating user:', error)
      return { user: null, error: error as any }
    }
  }

  async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
    const roleId = await this.getRoleId(role)
    
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({ role_id: roleId })
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
      // First delete the user profile using admin client
      await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      // Delete any user sessions
      await supabaseAdmin
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)

      // Then delete from auth using admin client
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (error) throw error
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
  private async getRoleId(roleName: string): Promise<string> {
    // Use admin client to ensure we can always read roles
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('role_name', roleName)
      .single()

    if (error) throw error
    return data.id
  }

  async getRoles() {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('role_name')

    if (error) throw error
    return data || []
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