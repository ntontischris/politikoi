import { BaseService } from './baseService'
import { supabase } from '../lib/supabase'

export interface Reminder {
  id: string
  title: string
  description?: string | null
  reminder_date: string
  reminder_type: 'ΕΟΡΤΗ' | 'ΑΙΤΗΜΑ' | 'ΓΕΝΙΚΗ'
  related_request_id?: string | null
  is_completed?: boolean
  created_at: string
  created_by?: string | null
}

export interface ReminderWithRequest extends Reminder {
  requests?: {
    id: string
    request_type: string
    citizens?: {
      name: string
      surname: string
    } | null
  } | null
}

export type ReminderInput = Omit<Reminder, 'id' | 'created_at'>

export class ReminderService extends BaseService {
  constructor() {
    super('reminders')
  }

  async getAllReminders(): Promise<ReminderWithRequest[]> {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          requests!related_request_id(
            id,
            request_type,
            citizens!citizen_id(name, surname)
          )
        `)
        .order('reminder_date', { ascending: true })

      if (error) this.handleError(error, 'φόρτωση υπομνημάτων')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση υπομνημάτων')
    }
  }

  async getReminderById(id: string): Promise<ReminderWithRequest | null> {
    try {
      this.validateId(id)
      
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          requests!related_request_id(
            id,
            request_type,
            citizens!citizen_id(name, surname)
          )
        `)
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'φόρτωση υπομνήματος')
      }

      return data || null
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση υπομνήματος')
    }
  }

  async getTodaysReminders(): Promise<ReminderWithRequest[]> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          requests!related_request_id(
            id,
            request_type,
            citizens!citizen_id(name, surname)
          )
        `)
        .eq('reminder_date', today)
        .eq('is_completed', false)
        .order('created_at', { ascending: true })

      if (error) this.handleError(error, 'φόρτωση σημερινών υπομνημάτων')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση σημερινών υπομνημάτων')
    }
  }

  async getUpcomingReminders(days: number = 7): Promise<ReminderWithRequest[]> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + days)
      const futureDateStr = futureDate.toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          requests!related_request_id(
            id,
            request_type,
            citizens!citizen_id(name, surname)
          )
        `)
        .gte('reminder_date', today)
        .lte('reminder_date', futureDateStr)
        .eq('is_completed', false)
        .order('reminder_date', { ascending: true })

      if (error) this.handleError(error, 'φόρτωση προσεχών υπομνημάτων')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση προσεχών υπομνημάτων')
    }
  }

  async getRemindersByType(type: Reminder['reminder_type']): Promise<ReminderWithRequest[]> {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          requests!related_request_id(
            id,
            request_type,
            citizens!citizen_id(name, surname)
          )
        `)
        .eq('reminder_type', type)
        .order('reminder_date', { ascending: true })

      if (error) this.handleError(error, 'φόρτωση υπομνημάτων ανά τύπο')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση υπομνημάτων ανά τύπο')
    }
  }

  async createReminder(reminderData: ReminderInput): Promise<Reminder> {
    try {
      this.validateRequired(reminderData, ['title', 'reminder_date'])
      
      const { data, error } = await supabase
        .from('reminders')
        .insert([reminderData])
        .select()
        .single()

      if (error) this.handleError(error, 'δημιουργία υπομνήματος')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'δημιουργία υπομνήματος')
    }
  }

  async updateReminder(id: string, reminderData: Partial<ReminderInput>): Promise<Reminder> {
    try {
      this.validateId(id)
      
      const { data, error } = await supabase
        .from('reminders')
        .update(reminderData)
        .eq('id', id)
        .select()
        .single()

      if (error) this.handleError(error, 'ενημέρωση υπομνήματος')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'ενημέρωση υπομνήματος')
    }
  }

  async markReminderCompleted(id: string): Promise<Reminder> {
    try {
      this.validateId(id)
      
      const { data, error } = await supabase
        .from('reminders')
        .update({ is_completed: true })
        .eq('id', id)
        .select()
        .single()

      if (error) this.handleError(error, 'σήμανση ολοκλήρωσης υπομνήματος')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'σήμανση ολοκλήρωσης υπομνήματος')
    }
  }

  async deleteReminder(id: string): Promise<void> {
    try {
      this.validateId(id)
      
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)

      if (error) this.handleError(error, 'διαγραφή υπομνήματος')
    } catch (error) {
      this.handleError(error as Error, 'διαγραφή υπομνήματος')
    }
  }

  async getCompletedReminders(): Promise<ReminderWithRequest[]> {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          requests!related_request_id(
            id,
            request_type,
            citizens!citizen_id(name, surname)
          )
        `)
        .eq('is_completed', true)
        .order('reminder_date', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση ολοκληρωμένων υπομνημάτων')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση ολοκληρωμένων υπομνημάτων')
    }
  }

  async searchReminders(searchTerm: string): Promise<ReminderWithRequest[]> {
    try {
      if (!searchTerm.trim()) {
        return this.getAllReminders()
      }

      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          requests!related_request_id(
            id,
            request_type,
            citizens!citizen_id(name, surname)
          )
        `)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('reminder_date', { ascending: true })

      if (error) this.handleError(error, 'αναζήτηση υπομνημάτων')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'αναζήτηση υπομνημάτων')
    }
  }
}

export const reminderService = new ReminderService()