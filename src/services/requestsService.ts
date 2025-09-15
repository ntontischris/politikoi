import { BaseService } from './baseService'
import { supabase } from '../lib/supabase'

export interface Request {
  id: string
  citizen_id?: string | null
  request_type: string
  description: string
  status?: 'pending' | 'in-progress' | 'completed' | 'rejected' | 'ΕΚΚΡΕΜΕΙ' | 'ΟΛΟΚΛΗΡΩΘΗΚΕ' | 'ΑΠΟΡΡΙΦΘΗΚΕ'
  priority?: 'low' | 'medium' | 'high'
  send_date?: string | null
  completion_date?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface RequestWithDetails extends Request {
  citizens?: {
    name: string
    surname: string
    municipality?: string
    is_military?: boolean
    military_rank?: string
  } | null
}

export type RequestInput = Omit<Request, 'id' | 'created_at' | 'updated_at'>

export class RequestsService extends BaseService {
  constructor() {
    super('requests')
  }

  async getAllRequests(): Promise<RequestWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          citizens!citizen_id(name, surname, municipality, is_military, military_rank)
        `)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση αιτημάτων')

      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση αιτημάτων')
    }
  }

  async getRequestById(id: string): Promise<RequestWithDetails | null> {
    try {
      this.validateId(id)

      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          citizens!citizen_id(name, surname, municipality, is_military, military_rank)
        `)
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'φόρτωση αιτήματος')
      }

      return data || null
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση αιτήματος')
    }
  }

  async getRequestsByCitizen(citizenId: string): Promise<Request[]> {
    try {
      this.validateId(citizenId)
      
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('citizen_id', citizenId)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση αιτημάτων πολίτη')
      
      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση αιτημάτων πολίτη')
    }
  }

  async createRequest(requestData: RequestInput): Promise<Request> {
    try {
      this.validateRequired(requestData, ['request_type', 'description'])
      
      const { data, error } = await supabase
        .from('requests')
        .insert([requestData])
        .select()
        .single()

      if (error) this.handleError(error, 'δημιουργία αιτήματος')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'δημιουργία αιτήματος')
    }
  }

  async updateRequest(id: string, requestData: Partial<RequestInput>): Promise<Request> {
    try {
      this.validateId(id)
      
      const { data, error } = await supabase
        .from('requests')
        .update({ ...requestData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) this.handleError(error, 'ενημέρωση αιτήματος')
      
      return data
    } catch (error) {
      this.handleError(error as Error, 'ενημέρωση αιτήματος')
    }
  }

  async deleteRequest(id: string): Promise<void> {
    try {
      this.validateId(id)
      
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', id)

      if (error) this.handleError(error, 'διαγραφή αιτήματος')
    } catch (error) {
      this.handleError(error as Error, 'διαγραφή αιτήματος')
    }
  }

  async getRequestsByStatus(status: string): Promise<RequestWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          citizens!citizen_id(name, surname, municipality, is_military, military_rank)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'φόρτωση αιτημάτων ανά κατάσταση')

      return data || []
    } catch (error) {
      this.handleError(error as Error, 'φόρτωση αιτημάτων ανά κατάσταση')
    }
  }

  async getRequestsStats(): Promise<{
    total: number
    pending: number
    completed: number
    in_progress: number
    rejected: number
  }> {
    try {
      const { data, error } = await supabase.rpc('get_request_stats')

      if (error) this.handleError(error, 'φόρτωση στατιστικών αιτημάτων')

      return data || { 
        total: 0, 
        pending: 0, 
        completed: 0, 
        in_progress: 0, 
        rejected: 0 
      }
    } catch (error) {
      console.error('Error getting request stats:', error)
      return { 
        total: 0, 
        pending: 0, 
        completed: 0, 
        in_progress: 0, 
        rejected: 0 
      }
    }
  }
}

export const requestsService = new RequestsService()