import { BaseService } from './baseService'
import { supabase } from '../lib/supabase'

// Type definitions based on your database schema
export interface Citizen {
  id: string
  surname: string
  name: string
  afm?: string | null
  recommendation_from?: string | null
  patronymic?: string | null
  mobile_phone?: string | null
  landline_phone?: string | null
  email?: string | null
  address?: string | null
  postal_code?: string | null
  municipality?: string | null
  area?: string | null
  electoral_district?: string | null
  last_contact_date?: string | null
  notes?: string | null
  status?: 'active' | 'inactive'
  created_at: string
  updated_at: string
  created_by?: string | null
}

export type CitizenInput = Omit<Citizen, 'id' | 'created_at' | 'updated_at'>

export class CitizensService extends BaseService {
  constructor() {
    super('citizens')
  }

  async getAllCitizens(): Promise<Citizen[]> {
    try {
      const { data, error } = await supabase
        .from('citizens')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση πολιτών')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση πολιτών')
    }
  }

  async getCitizenById(id: string): Promise<Citizen | null> {
    try {
      this.validateId(id)
      
      const { data, error } = await supabase
        .from('citizens')
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'φόρτωση πολίτη')
      }

      return data || null
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση πολίτη')
    }
  }

  async createCitizen(citizenData: CitizenInput): Promise<Citizen> {
    try {
      this.validateRequired(citizenData, ['name', 'surname'])
      
      const { data, error } = await supabase
        .from('citizens')
        .insert([citizenData])
        .select()
        .single()

      if (error) this.handleError(error, 'δημιουργία πολίτη')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'δημιουργία πολίτη')
    }
  }

  async updateCitizen(id: string, citizenData: Partial<CitizenInput>): Promise<Citizen> {
    try {
      this.validateId(id)
      
      const { data, error } = await supabase
        .from('citizens')
        .update({ ...citizenData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) this.handleError(error, 'ενημέρωση πολίτη')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'ενημέρωση πολίτη')
    }
  }

  async deleteCitizen(id: string): Promise<void> {
    try {
      this.validateId(id)
      
      const { error } = await supabase
        .from('citizens')
        .delete()
        .eq('id', id)

      if (error) this.handleError(error, 'διαγραφή πολίτη')
    } catch (error) {
      this.handleError(error as Error, 'διαγραφή πολίτη')
    }
  }

  async searchCitizens(searchTerm: string): Promise<Citizen[]> {
    try {
      if (!searchTerm.trim()) {
        return this.getAllCitizens()
      }

      const { data, error } = await supabase
        .from('citizens')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,surname.ilike.%${searchTerm}%,mobile_phone.ilike.%${searchTerm}%,landline_phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,afm.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'αναζήτηση πολιτών')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'αναζήτηση πολιτών')
    }
  }

  async getCitizensByMunicipality(municipality: string): Promise<Citizen[]> {
    try {
      const { data, error } = await supabase
        .from('citizens')
        .select('*')
        .eq('municipality', municipality)
        .order('surname', { ascending: true })

      if (error) this.handleError(error, 'φόρτωση πολιτών ανά δήμο')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση πολιτών ανά δήμο')
    }
  }

  async getCitizensStats(): Promise<{
    total: number
    active: number
    inactive: number
    recent: number
  }> {
    try {
      const { data, error } = await supabase.rpc('get_citizen_stats')

      if (error) this.handleError(error, 'φόρτωση στατιστικών πολιτών')

      return data || { total: 0, active: 0, inactive: 0, recent: 0 }
    } catch (error) {
      console.error('Error getting citizen stats:', error)
      return { total: 0, active: 0, inactive: 0, recent: 0 }
    }
  }
}

export const citizensService = new CitizensService()