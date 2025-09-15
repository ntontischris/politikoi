import { BaseService } from './baseService'
import { supabase } from '../lib/supabase'
import {
  loadMockNotifications,
  getMockUnreadCount,
  mockMarkAsRead,
  mockMarkAllAsRead,
  mockDeleteNotification
} from '../utils/mockNotifications'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder'
  is_read: boolean
  user_id?: string
  related_entity_type?: 'citizen' | 'request' | 'military' | 'system'
  related_entity_id?: string
  action_url?: string
  created_at: string
  updated_at: string
}

export type NotificationInput = Omit<Notification, 'id' | 'created_at' | 'updated_at'>

export class NotificationService extends BaseService {
  constructor() {
    super('notifications')
  }

  async getAllNotifications(userId?: string): Promise<Notification[]> {
    try {
      // TODO: Replace with real database queries
      // For now, use mock data for development
      if (process.env.NODE_ENV === 'development') {
        return await loadMockNotifications()
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`)
      }

      const { data, error } = await query

      if (error) this.handleError(error, 'φόρτωση ειδοποιήσεων')

      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση ειδοποιήσεων')
    }
  }

  async getUnreadCount(userId?: string): Promise<number> {
    try {
      // TODO: Replace with real database queries
      // For now, use mock data for development
      if (process.env.NODE_ENV === 'development') {
        return await getMockUnreadCount()
      }

      let query = supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('is_read', false)

      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`)
      }

      const { count, error } = await query

      if (error) this.handleError(error, 'φόρτωση μη αναγνωσμένων ειδοποιήσεων')

      return count || 0
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  async markAsRead(id: string): Promise<Notification> {
    try {
      this.validateId(id)

      // TODO: Replace with real database queries
      if (process.env.NODE_ENV === 'development') {
        return await mockMarkAsRead(id)
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) this.handleError(error, 'ενημέρωση ειδοποίησης')

      return data
    } catch (error) {
      this.handleError(error as Error, 'ενημέρωση ειδοποίησης')
    }
  }

  async markAllAsRead(userId?: string): Promise<void> {
    try {
      // TODO: Replace with real database queries
      if (process.env.NODE_ENV === 'development') {
        return await mockMarkAllAsRead()
      }

      let query = supabase
        .from('notifications')
        .update({
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('is_read', false)

      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`)
      }

      const { error } = await query

      if (error) this.handleError(error, 'ενημέρωση όλων των ειδοποιήσεων')
    } catch (error) {
      this.handleError(error as Error, 'ενημέρωση όλων των ειδοποιήσεων')
    }
  }

  async createNotification(notificationData: NotificationInput): Promise<Notification> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single()

      if (error) this.handleError(error, 'δημιουργία ειδοποίησης')

      return data
    } catch (error) {
      this.handleError(error as Error, 'δημιουργία ειδοποίησης')
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      this.validateId(id)

      // TODO: Replace with real database queries
      if (process.env.NODE_ENV === 'development') {
        return await mockDeleteNotification(id)
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) this.handleError(error, 'διαγραφή ειδοποίησης')
    } catch (error) {
      this.handleError(error as Error, 'διαγραφή ειδοποίησης')
    }
  }

  // Helper methods για δημιουργία συγκεκριμένων τύπων ειδοποιήσεων
  async createRequestNotification(
    type: 'new_request' | 'request_updated' | 'request_completed',
    requestId: string,
    requestTitle: string,
    citizenName?: string
  ): Promise<Notification> {
    const notifications = {
      new_request: {
        title: 'Νέο Αίτημα',
        message: `Νέο αίτημα: "${requestTitle}"${citizenName ? ` από ${citizenName}` : ''}`,
        type: 'info' as const
      },
      request_updated: {
        title: 'Ενημέρωση Αιτήματος',
        message: `Το αίτημα "${requestTitle}" ενημερώθηκε`,
        type: 'info' as const
      },
      request_completed: {
        title: 'Ολοκλήρωση Αιτήματος',
        message: `Το αίτημα "${requestTitle}" ολοκληρώθηκε`,
        type: 'success' as const
      }
    }

    const notificationConfig = notifications[type]

    return this.createNotification({
      ...notificationConfig,
      is_read: false,
      related_entity_type: 'request',
      related_entity_id: requestId,
      action_url: `/dashboard/requests`
    })
  }

  async createCitizenNotification(
    type: 'new_citizen' | 'citizen_updated',
    citizenId: string,
    citizenName: string
  ): Promise<Notification> {
    const notifications = {
      new_citizen: {
        title: 'Νέος Πολίτης',
        message: `Εγγράφηκε νέος πολίτης: ${citizenName}`,
        type: 'info' as const
      },
      citizen_updated: {
        title: 'Ενημέρωση Πολίτη',
        message: `Ενημερώθηκαν τα στοιχεία του ${citizenName}`,
        type: 'info' as const
      }
    }

    const notificationConfig = notifications[type]

    return this.createNotification({
      ...notificationConfig,
      is_read: false,
      related_entity_type: 'citizen',
      related_entity_id: citizenId,
      action_url: `/dashboard/citizens`
    })
  }

  async createSystemNotification(
    title: string,
    message: string,
    type: Notification['type'] = 'info'
  ): Promise<Notification> {
    return this.createNotification({
      title,
      message,
      type,
      is_read: false,
      related_entity_type: 'system'
    })
  }
}

export const notificationService = new NotificationService()