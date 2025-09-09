import { BaseService } from './baseService'
import { supabase } from '../lib/supabase'

export interface CommunicationDate {
  id: string
  citizen_id: string
  communication_date: string
  communication_type: 'ΓΕΝΙΚΗ' | 'ΤΗΛΕΦΩΝΙΚΗ' | 'EMAIL' | 'ΠΡΟΣΩΠΙΚΗ' | 'SMS'
  notes?: string | null
  created_at: string
  created_by?: string | null
}

export interface CommunicationDateWithCitizen extends CommunicationDate {
  citizens?: {
    name: string
    surname: string
  } | null
}

export type CommunicationDateInput = Omit<CommunicationDate, 'id' | 'created_at'>

export class CommunicationService extends BaseService {
  constructor() {
    super('citizen_communication_dates')
  }

  async getAllCommunicationDates(): Promise<CommunicationDateWithCitizen[]> {
    try {
      const { data, error } = await supabase
        .from('citizen_communication_dates')
        .select(`
          *,
          citizens!citizen_id(name, surname)
        `)
        .order('communication_date', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση ημερομηνιών επικοινωνίας')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση ημερομηνιών επικοινωνίας')
    }
  }

  async getCommunicationDateById(id: string): Promise<CommunicationDateWithCitizen | null> {
    try {
      this.validateId(id)
      
      const { data, error } = await supabase
        .from('citizen_communication_dates')
        .select(`
          *,
          citizens!citizen_id(name, surname)
        `)
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'φόρτωση ημερομηνίας επικοινωνίας')
      }

      return data || null
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση ημερομηνίας επικοινωνίας')
    }
  }

  async getCommunicationDatesByCitizen(citizenId: string): Promise<CommunicationDate[]> {
    try {
      this.validateId(citizenId)
      
      const { data, error } = await supabase
        .from('citizen_communication_dates')
        .select('*')
        .eq('citizen_id', citizenId)
        .order('communication_date', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση ημερομηνιών επικοινωνίας πολίτη')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση ημερομηνιών επικοινωνίας πολίτη')
    }
  }

  async createCommunicationDate(communicationData: CommunicationDateInput): Promise<CommunicationDate> {
    try {
      this.validateRequired(communicationData, ['citizen_id', 'communication_date'])
      
      const { data, error } = await supabase
        .from('citizen_communication_dates')
        .insert([communicationData])
        .select()
        .single()

      if (error) this.handleError(error, 'δημιουργία ημερομηνίας επικοινωνίας')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'δημιουργία ημερομηνίας επικοινωνίας')
    }
  }

  async updateCommunicationDate(id: string, communicationData: Partial<CommunicationDateInput>): Promise<CommunicationDate> {
    try {
      this.validateId(id)
      
      const { data, error } = await supabase
        .from('citizen_communication_dates')
        .update(communicationData)
        .eq('id', id)
        .select()
        .single()

      if (error) this.handleError(error, 'ενημέρωση ημερομηνίας επικοινωνίας')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'ενημέρωση ημερομηνίας επικοινωνίας')
    }
  }

  async deleteCommunicationDate(id: string): Promise<void> {
    try {
      this.validateId(id)
      
      const { error } = await supabase
        .from('citizen_communication_dates')
        .delete()
        .eq('id', id)

      if (error) this.handleError(error, 'διαγραφή ημερομηνίας επικοινωνίας')
    } catch (error) {
      this.handleError(error as Error, 'διαγραφή ημερομηνίας επικοινωνίας')
    }
  }

  async getRecentCommunications(days: number = 30): Promise<CommunicationDateWithCitizen[]> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const { data, error } = await supabase
        .from('citizen_communication_dates')
        .select(`
          *,
          citizens!citizen_id(name, surname)
        `)
        .gte('communication_date', cutoffDate.toISOString().split('T')[0])
        .order('communication_date', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση πρόσφατων επικοινωνιών')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση πρόσφατων επικοινωνιών')
    }
  }

  async getCommunicationsByType(type: CommunicationDate['communication_type']): Promise<CommunicationDateWithCitizen[]> {
    try {
      const { data, error } = await supabase
        .from('citizen_communication_dates')
        .select(`
          *,
          citizens!citizen_id(name, surname)
        `)
        .eq('communication_type', type)
        .order('communication_date', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση επικοινωνιών ανά τύπο')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση επικοινωνιών ανά τύπο')
    }
  }

  async getLastCommunicationByCitizen(citizenId: string): Promise<CommunicationDate | null> {
    try {
      this.validateId(citizenId)
      
      const { data, error } = await supabase
        .from('citizen_communication_dates')
        .select('*')
        .eq('citizen_id', citizenId)
        .order('communication_date', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'φόρτωση τελευταίας επικοινωνίας')
      }

      return data || null
    } catch (error) {
      console.error('Error getting last communication:', error)
      return null
    }
  }
}

export const communicationService = new CommunicationService()