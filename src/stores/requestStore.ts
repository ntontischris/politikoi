import { createSmartStore, CacheProfiles } from './baseStore'
import { requestsService, type Request as DBRequest, type RequestInput, type RequestWithDetails } from '../services/requestsService'

// Frontend interface that maps to backend data
export interface Request {
  id: string
  citizenId?: string
  militaryPersonnelId?: string
  requestType: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'rejected'
  priority: 'low' | 'medium' | 'high'
  sendDate?: string
  completionDate?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface RequestWithDetails extends Request {
  citizen?: {
    name: string
    surname: string
    municipality?: string
  }
  militaryPersonnel?: {
    name: string
    surname: string
    rank?: string
  }
}

// Helper function to transform database request to frontend
const transformDBRequest = (dbRequest: DBRequest): Request => ({
  id: dbRequest.id,
  citizenId: dbRequest.citizen_id || undefined,
  militaryPersonnelId: dbRequest.military_personnel_id || undefined,
  requestType: dbRequest.request_type,
  description: dbRequest.description,
  status: (dbRequest.status as Request['status']) || 'pending',
  priority: (dbRequest.priority as Request['priority']) || 'medium',
  sendDate: dbRequest.send_date || undefined,
  completionDate: dbRequest.completion_date || undefined,
  notes: dbRequest.notes || undefined,
  created_at: dbRequest.created_at,
  updated_at: dbRequest.updated_at
})

// Helper function for detailed requests
const transformDBRequestWithDetails = (dbRequest: RequestWithDetails): RequestWithDetails => ({
  ...transformDBRequest(dbRequest),
  citizen: dbRequest.citizens || undefined,
  militaryPersonnel: dbRequest.military_personnel || undefined
})

// Helper function to transform frontend to database input
const transformToDBInput = (request: Partial<Request>): Partial<RequestInput> => ({
  citizen_id: request.citizenId || null,
  military_personnel_id: request.militaryPersonnelId || null,
  request_type: request.requestType || '',
  description: request.description || '',
  status: request.status || 'pending',
  priority: request.priority || 'medium',
  send_date: request.sendDate || null,
  completion_date: request.completionDate || null,
  notes: request.notes?.trim() || null
})

// Service adapter to match BaseStore expectations
const requestServiceAdapter = {
  getAll: () => requestsService.getAllRequests(),
  create: (data: RequestInput) => requestsService.createRequest(data),
  update: (id: string, data: Partial<RequestInput>) => requestsService.updateRequest(id, data),
  delete: (id: string) => requestsService.deleteRequest(id)
}

// Create the smart request store
export const useRequestStore = createSmartStore<Request, RequestInput, typeof requestServiceAdapter>({
  storeName: 'requests',
  cacheConfig: CacheProfiles.DYNAMIC, // Requests change frequently
  service: requestServiceAdapter,
  transformFromDB: transformDBRequest,
  transformToDB: transformToDBInput
})

// Additional request-specific methods
export const useRequestActions = () => {
  const store = useRequestStore()
  
  return {
    ...store,
    
    // Get requests with citizen/military details
    getRequestsWithDetails: async () => {
      try {
        store.setLoading(true)
        const detailedRequests = await requestsService.getRequestsWithDetails()
        const transformed = detailedRequests.map(transformDBRequestWithDetails)
        
        // Don't cache detailed requests, they're for viewing only
        return transformed
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Σφάλμα φόρτωσης αιτημάτων')
        return []
      } finally {
        store.setLoading(false)
      }
    },
    
    // Search functionality
    searchRequests: async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        return store.loadItems()
      }
      
      try {
        store.setLoading(true)
        store.setError(null)
        
        const searchResults = await requestsService.searchRequests(searchTerm)
        const transformedResults = searchResults.map(transformDBRequest)
        
        useRequestStore.setState({ 
          items: transformedResults,
          isLoading: false 
        })
        
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Σφάλμα αναζήτησης')
        store.setLoading(false)
      }
    },
    
    // Filter by status
    filterByStatus: (status: Request['status']): Request[] => {
      return store.items.filter(request => request.status === status)
    },
    
    // Filter by priority
    filterByPriority: (priority: Request['priority']): Request[] => {
      return store.items.filter(request => request.priority === priority)
    },
    
    // Filter by citizen
    getRequestsByCitizen: async (citizenId: string) => {
      try {
        store.setLoading(true)
        const requests = await requestsService.getRequestsByCitizen(citizenId)
        const transformed = requests.map(transformDBRequest)
        
        return transformed
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Σφάλμα φόρτωσης αιτημάτων πολίτη')
        return []
      } finally {
        store.setLoading(false)
      }
    },
    
    // Filter by military personnel
    getRequestsByMilitary: async (militaryId: string) => {
      try {
        store.setLoading(true)
        const requests = await requestsService.getRequestsByMilitary(militaryId)
        const transformed = requests.map(transformDBRequest)
        
        return transformed
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Σφάλμα φόρτωσης αιτημάτων στρατιωτικού')
        return []
      } finally {
        store.setLoading(false)
      }
    },
    
    // Get statistics
    getStats: async () => {
      try {
        const stats = await requestsService.getRequestStats()
        return stats
      } catch (error) {
        console.error('Error getting request stats:', error)
        
        // Fallback to local calculation
        const requests = store.items
        const byStatus = requests.reduce((acc, request) => {
          acc[request.status] = (acc[request.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        const byPriority = requests.reduce((acc, request) => {
          acc[request.priority] = (acc[request.priority] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        return {
          total: requests.length,
          pending: byStatus.pending || 0,
          inProgress: byStatus['in-progress'] || 0,
          completed: byStatus.completed || 0,
          rejected: byStatus.rejected || 0,
          high_priority: byPriority.high || 0,
          medium_priority: byPriority.medium || 0,
          low_priority: byPriority.low || 0
        }
      }
    },
    
    // Update status (common operation)
    updateStatus: async (id: string, status: Request['status']) => {
      return store.updateItem(id, { status })
    },
    
    // Complete request
    completeRequest: async (id: string, completionDate?: string) => {
      return store.updateItem(id, { 
        status: 'completed',
        completionDate: completionDate || new Date().toISOString()
      })
    }
  }
}

// Convenience hook for single request
export const useRequest = (id?: string) => {
  const store = useRequestStore()
  
  return {
    request: id ? store.getItem(id) : null,
    isLoading: store.isLoading,
    error: store.error
  }
}