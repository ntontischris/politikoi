import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { reminderService, type Reminder as DBReminder, type ReminderInput, type ReminderWithRequest } from '../services/reminderService'

// Frontend interface that maps to backend data
export interface Reminder {
  id: string
  title: string
  description?: string
  reminder_date: string
  reminder_type: 'ΕΟΡΤΗ' | 'ΑΙΤΗΜΑ' | 'ΓΕΝΙΚΗ'
  related_request_id?: string
  is_completed?: boolean
  created_at: string
}

interface ReminderStore {
  reminders: Reminder[]
  isLoading: boolean
  error: string | null
  
  // Actions
  loadReminders: () => Promise<void>
  addReminder: (reminderData: Omit<Reminder, 'id' | 'created_at'>) => Promise<void>
  updateReminder: (id: string, reminderData: Partial<Reminder>) => Promise<void>
  deleteReminder: (id: string) => Promise<void>
  markAsCompleted: (id: string) => Promise<void>
  getReminder: (id: string) => Reminder | undefined
  getTodaysReminders: () => Promise<void>
  getUpcomingReminders: (days?: number) => Promise<void>
  getRemindersByType: (type: 'ΕΟΡΤΗ' | 'ΑΙΤΗΜΑ' | 'ΓΕΝΙΚΗ') => Promise<void>
  searchReminders: (searchTerm: string) => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Computed
  getStats: () => {
    total: number
    completed: number
    pending: number
    upcoming: number
    byType: Record<string, number>
  }
}

// Helper function to transform database reminder to frontend reminder
const transformDBReminder = (dbReminder: ReminderWithRequest): Reminder => ({
  id: dbReminder.id,
  title: dbReminder.title,
  description: dbReminder.description || undefined,
  reminder_date: dbReminder.reminder_date,
  reminder_type: dbReminder.reminder_type,
  related_request_id: dbReminder.related_request_id || undefined,
  is_completed: dbReminder.is_completed || false,
  created_at: dbReminder.created_at
})

// Helper function to transform frontend reminder to database input
const transformToDBInput = (reminder: Partial<Reminder>): Partial<ReminderInput> => ({
  title: reminder.title || '',
  description: reminder.description || null,
  reminder_date: reminder.reminder_date || '',
  reminder_type: reminder.reminder_type || 'ΓΕΝΙΚΗ',
  related_request_id: reminder.related_request_id || null,
  is_completed: reminder.is_completed || false
})

export const useReminderStore = create<ReminderStore>()(
  persist(
    (set, get) => ({
      reminders: [],
      isLoading: false,
      error: null,

      loadReminders: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const dbReminders = await reminderService.getAllReminders()
          const reminders = dbReminders.map(transformDBReminder)
          set({ reminders, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη φόρτωση υπομνημάτων'
          })
        }
      },

      addReminder: async (reminderData) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbInput = transformToDBInput(reminderData) as ReminderInput
          const newDBReminder = await reminderService.createReminder(dbInput)
          
          // Get the full reminder with relations
          const fullReminder = await reminderService.getReminderById(newDBReminder.id)
          if (fullReminder) {
            const newReminder = transformDBReminder(fullReminder)
            set(state => ({
              reminders: [newReminder, ...state.reminders],
              isLoading: false
            }))
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την προσθήκη υπενθύμισης'
          })
          throw error
        }
      },

      updateReminder: async (id, reminderData) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbInput = transformToDBInput(reminderData)
          await reminderService.updateReminder(id, dbInput)
          
          // Get the updated reminder with relations
          const updatedDBReminder = await reminderService.getReminderById(id)
          if (updatedDBReminder) {
            const updatedReminder = transformDBReminder(updatedDBReminder)
            set(state => ({
              reminders: state.reminders.map(reminder =>
                reminder.id === id ? updatedReminder : reminder
              ),
              isLoading: false
            }))
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την ενημέρωση υπενθύμισης'
          })
          throw error
        }
      },

      deleteReminder: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          await reminderService.deleteReminder(id)
          set(state => ({
            reminders: state.reminders.filter(reminder => reminder.id !== id),
            isLoading: false
          }))
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη διαγραφή υπενθύμισης'
          })
          throw error
        }
      },

      markAsCompleted: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          await reminderService.markReminderCompleted(id)
          
          // Update local state
          set(state => ({
            reminders: state.reminders.map(reminder =>
              reminder.id === id 
                ? { ...reminder, is_completed: true }
                : reminder
            ),
            isLoading: false
          }))
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την ολοκλήρωση υπενθύμισης'
          })
          throw error
        }
      },

      getReminder: (id) => {
        return get().reminders.find(reminder => reminder.id === id)
      },

      getTodaysReminders: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const dbReminders = await reminderService.getTodaysReminders()
          const reminders = dbReminders.map(transformDBReminder)
          set({ reminders, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη φόρτωση σημερινών υπομνημάτων'
          })
        }
      },

      getUpcomingReminders: async (days = 7) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbReminders = await reminderService.getUpcomingReminders(days)
          const reminders = dbReminders.map(transformDBReminder)
          set({ reminders, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη φόρτωση προσεχών υπομνημάτων'
          })
        }
      },

      getRemindersByType: async (type) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbReminders = await reminderService.getRemindersByType(type)
          const reminders = dbReminders.map(transformDBReminder)
          set({ reminders, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη φόρτωση υπομνημάτων ανά τύπο'
          })
        }
      },

      searchReminders: async (searchTerm) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbReminders = await reminderService.searchReminders(searchTerm)
          const reminders = dbReminders.map(transformDBReminder)
          set({ reminders, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την αναζήτηση υπομνημάτων'
          })
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),

      getStats: () => {
        const reminders = get().reminders
        const now = new Date()
        const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))

        // Count upcoming reminders (next 7 days)
        const upcoming = reminders.filter(r => {
          if (r.is_completed) return false
          const reminderDate = new Date(r.reminder_date)
          return reminderDate >= now && reminderDate <= nextWeek
        }).length

        // Count by type
        const byType = reminders.reduce((acc, reminder) => {
          acc[reminder.reminder_type] = (acc[reminder.reminder_type] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        return {
          total: reminders.length,
          completed: reminders.filter(r => r.is_completed).length,
          pending: reminders.filter(r => !r.is_completed).length,
          upcoming,
          byType
        }
      }
    }),
    {
      name: 'reminder-storage',
      // Don't persist loading states and error states
      partialize: (state) => ({ reminders: state.reminders })
    }
  )
)