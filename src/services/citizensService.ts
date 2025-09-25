import { BaseService } from './baseService'
import { supabase } from '../lib/supabase'

// Type definitions based on your database schema
export interface Citizen {
  id: string
  // Required fields
  name: string
  surname: string
  // Optional fields
  afm?: string | null
  recommendation?: string | null
  patronymic?: string | null
  phone?: string | null
  landline?: string | null
  email?: string | null
  address?: string | null
  postalCode?: string | null
  municipality?: string | null
  area?: string | null // Keep for backwards compatibility
  region?: string | null
  electoralDistrict?: string | null
  position?: string | null
  contactCategory?: string | null
  requestCategory?: string | null
  addedDate?: string | null
  assignedCollaborator?: string | null
  status?: string | null
  completionDate?: string | null
  responsibleAuthority?: string | null
  request?: string | null
  observations?: string | null
  comment?: string | null
  notes?: string | null
  last_contact_date?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  // Military fields with new naming
  isMilitary?: boolean
  militaryType?: 'conscript' | 'career' | null
  militaryRank?: string | null
  militaryServiceUnit?: string | null
  military_id?: string | null
  militaryEsso?: string | null
  military_esso_year?: string | null
  military_esso_letter?: 'Α' | 'Β' | 'Γ' | 'Δ' | 'Ε' | 'ΣΤ' | null
  militaryDesire?: string | null
  military_status?: 'pending' | 'approved' | 'rejected' | 'completed' | null
  military_send_date?: string | null
  military_comments?: string | null
  // Extended military fields for conscripts
  military_asm?: string | null
  military_center?: string | null
  military_presentation_date?: string | null
  military_placement?: string | null
  military_placement_date?: string | null
  military_request_date?: string | null
  military_transfer_type?: 'μετάθεση' | 'απόσπαση' | null
  military_transfer_date?: string | null
  military_observations?: string | null
  military_request_status?: 'ολοκληρωμένο' | 'ενημερώθηκε' | 'εκκρεμές' | null
  // Extended military fields for career officers
  military_registration_number?: string | null
  military_career_desire?: string | null
  military_career_request_date?: string | null
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
        .or(`name.ilike.%${searchTerm}%,surname.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,landline.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,afm.ilike.%${searchTerm}%`)
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

  // Military-specific methods
  async getMilitaryPersonnel(): Promise<Citizen[]> {
    try {
      const { data, error } = await supabase
        .from('citizens')
        .select('*')
        .eq('"isMilitary"', true)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση στρατιωτικού προσωπικού')

      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση στρατιωτικού προσωπικού')
      return []
    }
  }

  async getMilitaryPersonnelByEsso(essoYear?: string, essoLetter?: string): Promise<Citizen[]> {
    try {
      let query = supabase
        .from('citizens')
        .select('*')
        .eq('"isMilitary"', true)

      if (essoYear) {
        query = query.eq('military_esso_year', essoYear)
      }

      if (essoLetter) {
        query = query.eq('military_esso_letter', essoLetter)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση ΕΣΣΟ')

      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση ΕΣΣΟ')
      return []
    }
  }

  async getMilitaryEssoYears(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('citizens')
        .select('military_esso_year')
        .eq('"isMilitary"', true)
        .not('military_esso_year', 'is', null)
        .order('military_esso_year', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση ετών ΕΣΣΟ')

      const uniqueYears = [...new Set((data || []).map(item => item.military_esso_year!))]
      return uniqueYears
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση ετών ΕΣΣΟ')
      return []
    }
  }

  async searchMilitaryPersonnel(searchTerm: string): Promise<Citizen[]> {
    try {
      if (!searchTerm.trim()) {
        return this.getMilitaryPersonnel()
      }

      const { data, error } = await supabase
        .from('citizens')
        .select('*')
        .eq('"isMilitary"', true)
        .or(`name.ilike.%${searchTerm}%,surname.ilike.%${searchTerm}%,military_id.ilike.%${searchTerm}%,"militaryEsso".ilike.%${searchTerm}%,military_esso_year.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'αναζήτηση στρατιωτικού προσωπικού')

      return data || []
    } catch (error) {
      this.handleError(error as Error, 'αναζήτηση στρατιωτικού προσωπικού')
      return []
    }
  }

  async getMilitaryStats(): Promise<{
    total: number
    pending: number
    approved: number
    rejected: number
    completed: number
    by_year: Record<string, number>
  }> {
    try {
      const { data: military, error } = await supabase
        .from('citizens')
        .select('military_status, military_esso_year')
        .eq('"isMilitary"', true)

      if (error) this.handleError(error, 'φόρτωση στατιστικών στρατιωτικών')

      const stats = {
        total: military?.length || 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        by_year: {} as Record<string, number>
      }

      military?.forEach(person => {
        const status = person.military_status || 'pending'
        stats[status as keyof typeof stats]++

        if (person.military_esso_year) {
          stats.by_year[person.military_esso_year] = (stats.by_year[person.military_esso_year] || 0) + 1
        }
      })

      return stats
    } catch (error) {
      console.error('Error getting military stats:', error)
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        by_year: {}
      }
    }
  }
}

export const citizensService = new CitizensService()