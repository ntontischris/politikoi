import { create } from 'zustand'
import { realtimeManager } from '../lib/realtimeManager'
import { reminderService, type Reminder as DBReminder, type ReminderInput, type ReminderWithRequest } from '../services/reminderService'
import { supabase } from '../lib/supabase'

// Frontend interface that maps to backend data - EXACT same as old reminderStore
export interface Reminder {
  id: string
  title: string
  description?: string
  reminderDate: string
  reminderType: 'ΕΟΡΤΗ' | 'ΑΙΤΗΜΑ' | 'ΓΕΝΙΚΗ'
  relatedRequestId?: string
  isCompleted: boolean
  created_at: string
  updated_at?: string
}

export interface ReminderWithRequest extends Reminder {
  request?: {
    request_type: string
    description: string
    status: string
  }
}

interface RealtimeReminderStoreState {
  items: Reminder[]
  isLoading: boolean
  error: string | null
  isConnected: boolean
  lastSync: number
  isInitialized: boolean
}

interface RealtimeReminderStoreActions {
  // EXACT same interface as old reminderStore για seamless migration
  loadItems: () => Promise<void>
  addItem: (item: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateItem: (id: string, item: Partial<Reminder>) => Promise<void>
  deleteItem: (id: string) => Promise<void>

  // Realtime management
  initialize: () => Promise<void>
  disconnect: () => void
  reloadData: () => Promise<void>

  // Utilities - EXACT same interface as baseStore
  getItem: (id: string) => Reminder | undefined
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
}

type RealtimeReminderStore = RealtimeReminderStoreState & RealtimeReminderStoreActions

// Helper function to transform database reminder to frontend
const transformDBReminder = (dbReminder: DBReminder): Reminder => ({
  id: dbReminder.id,
  title: dbReminder.title,
  description: dbReminder.description || undefined,
  reminderDate: dbReminder.reminder_date,
  reminderType: dbReminder.reminder_type || 'ΓΕΝΙΚΗ',
  relatedRequestId: dbReminder.related_request_id || undefined,
  isCompleted: dbReminder.is_completed || false,
  created_at: dbReminder.created_at,
  updated_at: dbReminder.updated_at
})

// Helper function to transform frontend to database input
const transformToDBInput = (reminder: Partial<Reminder>): Partial<ReminderInput> => ({
  title: reminder.title || '',
  description: reminder.description?.trim() || null,
  reminder_date: reminder.reminderDate || new Date().toISOString(),
  reminder_type: reminder.reminderType || 'ΓΕΝΙΚΗ',
  related_request_id: reminder.relatedRequestId || null,
  is_completed: reminder.isCompleted || false
})

/**
 * ULTRA SAFE Realtime Reminder Store
 *
 * Maintains EXACT same interface as old reminderStore για seamless migration.
 * Uses RealtimeManager για optimized connections.
 */
const useRealtimeReminderStore = create<RealtimeReminderStore>((set, get) => {
  const storeId = `reminder_store_${Date.now()}`

  return {
    // Initial state - EXACT same as old reminderStore
    items: [],
    isLoading: false,
    error: null,
    isConnected: false,
    lastSync: 0,
    isInitialized: false,

    // Compatible loadItems method για existing components
    loadItems: async () => {
      await get().initialize()
    },

    // Initialize realtime connection
    initialize: async (forceReinit = false) => {
      const state = get()

      // Skip if already initialized (unless forcing reinit after connection loss)
      if (state.isInitialized && !forceReinit) {
        console.log('✅ RealtimeReminderStore: Already initialized, skipping...')
        return
      }

      if (state.isLoading) {
        console.log('⏳ RealtimeReminderStore: Already initializing, waiting...')
        return
      }

      set({ isLoading: true, error: null })
      console.log(`🚀 RealtimeReminderStore: ${forceReinit ? 'Re-initializing' : 'Initializing'}...`)

      try {
        // 1. Load initial data from database
        const { data, error } = await supabase
          .from('reminders')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ Failed to load reminders:', error)
          throw error
        }

        const transformedData = data.map(transformDBReminder)
        set({
          items: transformedData,
          isLoading: false,
          lastSync: Date.now(),
          isInitialized: true
        })

        console.log(`✅ Loaded ${transformedData.length} reminders from database`)

        // 2. Subscribe to realtime updates με RealtimeManager
        realtimeManager.subscribe({
          tableName: 'reminders',
          storeId,
          onInsert: (payload) => {
            try {
              console.log('➕ New reminder:', payload.new)
              if (!payload.new) {
                console.warn('INSERT payload missing new data')
                return
              }

              const newItem = transformDBReminder(payload.new)
              set(state => ({
                items: [newItem, ...state.items],
                lastSync: Date.now()
              }))
            } catch (error) {
              console.error('❌ Failed to process INSERT:', error)
            }
          },
          onUpdate: (payload) => {
            try {
              console.log('📝 Updated reminder:', payload.new)
              if (!payload.new) {
                console.warn('UPDATE payload missing new data')
                return
              }

              const updatedItem = transformDBReminder(payload.new)
              set(state => ({
                items: state.items.map(item =>
                  item.id === updatedItem.id ? updatedItem : item
                ),
                lastSync: Date.now()
              }))
            } catch (error) {
              console.error('❌ Failed to process UPDATE:', error)
            }
          },
          onDelete: (payload) => {
            try {
              console.log('🗑️ Deleted reminder:', payload.old)
              if (!payload.old?.id) {
                console.warn('DELETE payload missing old.id')
                return
              }

              set(state => ({
                items: state.items.filter(item => item.id !== payload.old.id),
                lastSync: Date.now()
              }))
            } catch (error) {
              console.error('❌ Failed to process DELETE:', error)
            }
          },
          onStatusChange: (status, error) => {
            const isConnected = status === 'SUBSCRIBED'
            console.log(`${isConnected ? '🔗' : '🔌'} Reminders realtime ${status}`)

            set({
              isConnected,
              error: error ? `Realtime error: ${error.message}` : get().error
            })

            // If disconnected unexpectedly, reset initialization and schedule reconnect
            if (!isConnected && (status === 'CLOSED' || status === 'CHANNEL_ERROR')) {
              console.log('⚠️ Reminders: Connection lost, resetting initialization state')
              set({ isInitialized: false })

              // Schedule automatic reconnection with exponential backoff
              let retryCount = 0
              const maxRetries = 3
              const attemptReconnect = () => {
                if (retryCount >= maxRetries) {
                  console.log('❌ Reminders: Max reconnection attempts reached')
                  return
                }

                const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
                retryCount++

                console.log(`🔄 Reminders: Reconnection attempt ${retryCount}/${maxRetries} in ${delay}ms`)
                setTimeout(async () => {
                  if (!get().isConnected && !get().isInitialized) {
                    console.log('🔄 Reminders: Attempting reconnection...')
                    await get().initialize(true)

                    if (!get().isConnected) {
                      attemptReconnect()
                    }
                  }
                }, delay)
              }

              attemptReconnect()
            }
          }
        })

      } catch (error) {
        console.error('❌ Failed to initialize reminders store:', error)
        set({
          isLoading: false,
          isInitialized: false, // Reset on error
          error: error instanceof Error ? error.message : 'Σφάλμα σύνδεσης υπενθυμίσεων'
        })
      }
    },

    // Disconnect realtime
    disconnect: () => {
      console.log('🔌 Disconnecting reminders realtime')
      realtimeManager.unsubscribe('reminders', storeId)
      set({
        isConnected: false,
        isInitialized: false
      })
    },

    // Fallback method to reload data
    reloadData: async () => {
      try {
        console.log('🔄 Fallback reload for reminders...')
        const { data, error } = await supabase
          .from('reminders')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        const transformedData = data.map(transformDBReminder)
        set({
          items: transformedData,
          lastSync: Date.now()
        })

        console.log('✅ Fallback reload completed for reminders')
      } catch (error) {
        console.error('❌ Fallback reload failed for reminders:', error)
      }
    },

    // CRUD operations - EXACT same interface as old reminderStore
    addItem: async (itemData) => {
      try {
        set({ error: null })

        const dbInput = transformToDBInput(itemData)
        const { data, error } = await supabase
          .from('reminders')
          .insert(dbInput)
          .select()
          .single()

        if (error) throw error

        console.log('✅ Added new reminder:', data.id)
        // Realtime will handle state update automatically

      } catch (error) {
        console.error('❌ Failed to add reminder:', error)
        set({ error: error instanceof Error ? error.message : 'Σφάλμα προσθήκης υπενθύμισης' })
        throw error
      }
    },

    updateItem: async (id, itemData) => {
      try {
        set({ error: null })

        const dbInput = transformToDBInput(itemData)
        const { error } = await supabase
          .from('reminders')
          .update(dbInput)
          .eq('id', id)

        if (error) throw error

        console.log('✅ Updated reminder:', id)
        // Realtime will handle state update automatically

      } catch (error) {
        console.error('❌ Failed to update reminder:', error)
        set({ error: error instanceof Error ? error.message : 'Σφάλμα ενημέρωσης υπενθύμισης' })
        throw error
      }
    },

    deleteItem: async (id) => {
      try {
        set({ error: null })

        const { error } = await supabase
          .from('reminders')
          .delete()
          .eq('id', id)

        if (error) throw error

        console.log('✅ Deleted reminder:', id)
        // Realtime will handle state update automatically

      } catch (error) {
        console.error('❌ Failed to delete reminder:', error)
        set({ error: error instanceof Error ? error.message : 'Σφάλμα διαγραφής υπενθύμισης' })
        throw error
      }
    },

    // Utilities - EXACT same interface as baseStore
    getItem: (id) => get().items.find(item => item.id === id),
    setError: (error) => set({ error }),
    setLoading: (loading) => set({ isLoading: loading })
  }
})

// Additional reminder-specific methods - EXACT same as old reminderStore
export const useReminderActions = () => {
  const store = useRealtimeReminderStore()

  return {
    ...store,

    // Get reminders with request details
    getRemindersWithDetails: async () => {
      try {
        store.setLoading(true)
        const detailedReminders = await reminderService.getRemindersWithRequest()
        // Return as-is for now
        return detailedReminders
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Σφάλμα φόρτωσης υπενθυμίσεων')
        return []
      } finally {
        store.setLoading(false)
      }
    },

    // Get upcoming reminders
    getUpcomingReminders: async () => {
      try {
        const upcoming = await reminderService.getUpcomingReminders()
        const transformed = upcoming.map(transformDBReminder)
        return transformed
      } catch (error) {
        // Fallback to local calculation
        const now = new Date()
        const upcoming = store.items.filter(reminder =>
          new Date(reminder.reminderDate) >= now && !reminder.isCompleted
        )
        return upcoming.sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime())
      }
    },

    // Mark as completed
    markCompleted: async (id: string) => {
      return store.updateItem(id, { isCompleted: true })
    },

    // Filter by type
    filterByType: (type: Reminder['reminderType']): Reminder[] => {
      return store.items.filter(reminder => reminder.reminderType === type)
    },

    // Get overdue reminders
    getOverdueReminders: (): Reminder[] => {
      const now = new Date()
      return store.items.filter(reminder =>
        new Date(reminder.reminderDate) < now && !reminder.isCompleted
      )
    },

    // Get stats
    getStats: () => {
      const reminders = store.items
      const now = new Date()
      const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))

      const total = reminders.length
      const completed = reminders.filter(r => r.isCompleted).length
      const pending = reminders.filter(r => !r.isCompleted).length
      const upcoming = reminders.filter(r => {
        const reminderDate = new Date(r.reminderDate)
        return !r.isCompleted && reminderDate >= now && reminderDate <= nextWeek
      }).length

      const byType = reminders.reduce((acc, reminder) => {
        const type = reminder.reminderType
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return { total, completed, pending, upcoming, byType }
    }
  }
}

// Export the main store hook - SAME NAME as old store για seamless migration
export const useReminderStore = useRealtimeReminderStore