import { createSmartStore, CacheProfiles } from './baseStore'
import { reminderService, type Reminder as DBReminder, type ReminderInput, type ReminderWithRequest } from '../services/reminderService'

// Frontend interface that maps to backend data
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

// Service adapter
const reminderServiceAdapter = {
  getAll: () => reminderService.getAllReminders(),
  create: (data: ReminderInput) => reminderService.createReminder(data),
  update: (id: string, data: Partial<ReminderInput>) => reminderService.updateReminder(id, data),
  delete: (id: string) => reminderService.deleteReminder(id)
}

// Create the smart reminder store
export const useReminderStore = createSmartStore<Reminder, ReminderInput, typeof reminderServiceAdapter>({
  storeName: 'reminders',
  cacheConfig: CacheProfiles.MODERATE, // Reminders don't change too frequently
  service: reminderServiceAdapter,
  transformFromDB: transformDBReminder,
  transformToDB: transformToDBInput
})

// Additional reminder-specific methods
export const useReminderActions = () => {
  const store = useReminderStore()
  
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