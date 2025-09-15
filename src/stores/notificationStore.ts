import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { notificationService, type Notification } from '../services/notificationService'
import { useAuthStore } from './authStore'

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null

  // Actions
  loadNotifications: () => Promise<void>
  loadUnreadCount: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  addNotification: (notification: Notification) => void
  clearError: () => void
}

export const useNotificationStore = create<NotificationStore>()(
  subscribeWithSelector((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    loadNotifications: async () => {
      try {
        set({ isLoading: true, error: null })

        const { profile } = useAuthStore.getState()
        const userId = profile?.id

        const notifications = await notificationService.getAllNotifications(userId)

        set({
          notifications,
          isLoading: false
        })

        // Ενημέρωσε και το unread count
        get().loadUnreadCount()

      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Σφάλμα φόρτωσης ειδοποιήσεων',
          isLoading: false
        })
      }
    },

    loadUnreadCount: async () => {
      try {
        const { profile } = useAuthStore.getState()
        const userId = profile?.id

        const unreadCount = await notificationService.getUnreadCount(userId)

        set({ unreadCount })

      } catch (error) {
        console.error('Error loading unread count:', error)
      }
    },

    markAsRead: async (id: string) => {
      try {
        await notificationService.markAsRead(id)

        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.id === id
              ? { ...notification, is_read: true }
              : notification
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }))

      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Σφάλμα ενημέρωσης ειδοποίησης'
        })
      }
    },

    markAllAsRead: async () => {
      try {
        const { profile } = useAuthStore.getState()
        const userId = profile?.id

        await notificationService.markAllAsRead(userId)

        set(state => ({
          notifications: state.notifications.map(notification => ({
            ...notification,
            is_read: true
          })),
          unreadCount: 0
        }))

      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Σφάλμα ενημέρωσης ειδοποιήσεων'
        })
      }
    },

    deleteNotification: async (id: string) => {
      try {
        await notificationService.deleteNotification(id)

        set(state => {
          const notification = state.notifications.find(n => n.id === id)
          const wasUnread = notification && !notification.is_read

          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
          }
        })

      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Σφάλμα διαγραφής ειδοποίησης'
        })
      }
    },

    addNotification: (notification: Notification) => {
      set(state => ({
        notifications: [notification, ...state.notifications],
        unreadCount: notification.is_read ? state.unreadCount : state.unreadCount + 1
      }))
    },

    clearError: () => {
      set({ error: null })
    }
  }))
)

// Helper hooks
export const useNotifications = () => {
  const store = useNotificationStore()

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    isLoading: store.isLoading,
    error: store.error,
    loadNotifications: store.loadNotifications,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    deleteNotification: store.deleteNotification
  }
}

export const useUnreadCount = () => {
  return useNotificationStore(state => state.unreadCount)
}

// Auto-refresh notifications every 30 seconds
let refreshInterval: NodeJS.Timeout | null = null

export const startNotificationRefresh = () => {
  if (refreshInterval) return

  refreshInterval = setInterval(() => {
    const { loadUnreadCount } = useNotificationStore.getState()
    loadUnreadCount()
  }, 30000)
}

export const stopNotificationRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}