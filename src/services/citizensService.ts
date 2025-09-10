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
      console.log('🔍 CitizensService: Starting getAllCitizens...')
      const { data, error } = await supabase
        .from('citizens')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('📊 Supabase response:', { data: data?.length, error })
      
      if (error) {
        console.error('❌ Supabase error:', error)
        this.handleError(error, 'φόρτωση πολιτών')
      }
      
      console.log('✅ Returning data:', data?.length || 0, 'citizens')
      return data || []
    } catch (error) {
      console.error('❌ Service error:', error)
      this.handleError(error as Error, 'φόρτωση πολιτών')
      return [] // This line will never be reached but TypeScript needs it
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
      return null
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
      throw error
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
      throw error
    }
  }

  async deleteCitizen(id: string): Promise<void> {
    try {
      console.log('🔍 CitizensService: Validating ID:', id)
      this.validateId(id)
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      console.log('👤 CitizensService: Current user:', user ? `${user.email} (${user.id})` : 'not authenticated')
      
      console.log('📡 CitizensService: Making Supabase delete call...')
      const { data, error, count } = await supabase
        .from('citizens')
        .delete()
        .eq('id', id)
        .select()

      console.log('📊 CitizensService: Supabase response:', { data, error, count, rowsAffected: data?.length || 0 })
      
      if (error) {
        console.error('❌ CitizensService: Supabase returned error:', error)
        this.handleError(error, 'διαγραφή πολίτη')
      }
      
      console.log('✅ CitizensService: Deletion completed successfully')
    } catch (error) {
      console.error('❌ CitizensService: Exception caught:', error)
      this.handleError(error as Error, 'διαγραφή πολίτη')
      throw error
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
      return []
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
      return []
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