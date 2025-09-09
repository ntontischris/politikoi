import { BaseService } from './baseService'
import { supabase } from '../lib/supabase'

export interface MilitaryPersonnel {
  id: string
  name: string
  surname: string
  rank?: string | null
  service_unit?: string | null
  wish?: string | null
  send_date?: string | null
  comments?: string | null
  military_id?: string | null
  esso?: string | null
  esso_year?: string | null
  esso_letter?: 'Α' | 'Β' | 'Γ' | 'Δ' | 'Ε' | 'ΣΤ' | null
  status?: 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string
  updated_at: string
  created_by?: string | null
}

export type MilitaryPersonnelInput = Omit<MilitaryPersonnel, 'id' | 'created_at' | 'updated_at'>

export class MilitaryService extends BaseService {
  constructor() {
    super('military_personnel')
  }

  async getAllMilitaryPersonnel(): Promise<MilitaryPersonnel[]> {
    try {
      const { data, error } = await supabase
        .from('military_personnel')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση στρατιωτικού προσωπικού')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση στρατιωτικού προσωπικού')
    }
  }

  async getMilitaryPersonnelById(id: string): Promise<MilitaryPersonnel | null> {
    try {
      this.validateId(id)
      
      const { data, error } = await supabase
        .from('military_personnel')
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'φόρτωση στρατιωτικού')
      }

      return data || null
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση στρατιωτικού')
    }
  }

  async getMilitaryPersonnelByEsso(essoYear?: string, essoLetter?: string): Promise<MilitaryPersonnel[]> {
    try {
      let query = supabase
        .from('military_personnel')
        .select('*')

      if (essoYear) {
        query = query.eq('esso_year', essoYear)
      }

      if (essoLetter) {
        query = query.eq('esso_letter', essoLetter)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση ΕΣΣΟ')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση ΕΣΣΟ')
    }
  }

  async getEssoYears(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('military_personnel')
        .select('esso_year')
        .not('esso_year', 'is', null)
        .order('esso_year', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση ετών ΕΣΣΟ')

      const uniqueYears = [...new Set((data || []).map(item => item.esso_year!))]
      return uniqueYears
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση ετών ΕΣΣΟ')
    }
  }

  async createMilitaryPersonnel(personnelData: MilitaryPersonnelInput): Promise<MilitaryPersonnel> {
    try {
      this.validateRequired(personnelData, ['name', 'surname'])
      
      const { data, error } = await supabase
        .from('military_personnel')
        .insert([personnelData])
        .select()
        .single()

      if (error) this.handleError(error, 'δημιουργία στρατιωτικού')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'δημιουργία στρατιωτικού')
    }
  }

  async updateMilitaryPersonnel(id: string, personnelData: Partial<MilitaryPersonnelInput>): Promise<MilitaryPersonnel> {
    try {
      this.validateId(id)
      
      const { data, error } = await supabase
        .from('military_personnel')
        .update({ ...personnelData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) this.handleError(error, 'ενημέρωση στρατιωτικού')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'ενημέρωση στρατιωτικού')
    }
  }

  async deleteMilitaryPersonnel(id: string): Promise<void> {
    try {
      this.validateId(id)
      
      const { error } = await supabase
        .from('military_personnel')
        .delete()
        .eq('id', id)

      if (error) this.handleError(error, 'διαγραφή στρατιωτικού')
    } catch (error) {
      this.handleError(error as Error, 'διαγραφή στρατιωτικού')
    }
  }

  async searchMilitaryPersonnel(searchTerm: string): Promise<MilitaryPersonnel[]> {
    try {
      if (!searchTerm.trim()) {
        return this.getAllMilitaryPersonnel()
      }

      const { data, error } = await supabase
        .from('military_personnel')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,surname.ilike.%${searchTerm}%,military_id.ilike.%${searchTerm}%,esso.ilike.%${searchTerm}%,esso_year.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'αναζήτηση στρατιωτικού προσωπικού')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'αναζήτηση στρατιωτικού προσωπικού')
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
      const { data, error } = await supabase.rpc('get_military_stats')

      if (error) this.handleError(error, 'φόρτωση στατιστικών στρατιωτικών')

      return data || { 
        total: 0, 
        pending: 0, 
        approved: 0, 
        rejected: 0, 
        completed: 0, 
        by_year: {} 
      }
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

export const militaryService = new MilitaryService()