import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { requestsService, type Request as DBRequest, type RequestInput, type RequestWithDetails } from '../services/requestsService'

// Frontend interface that matches the existing complex structure
export interface Request {
  id: string
  citizenId?: string
  militaryPersonnelId?: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'rejected'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
  citizenName?: string // Derived from joined data
}

interface RequestStore {
  requests: Request[]
  isLoading: boolean
  error: string | null
  
  // Actions
  loadRequests: () => Promise<void>
  addRequest: (requestData: Omit<Request, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateRequest: (id: string, requestData: Partial<Request>) => Promise<void>
  deleteRequest: (id: string) => Promise<void>
  getRequest: (id: string) => Request | undefined
  searchRequests: (searchTerm: string) => Request[]
  filterByStatus: (status: string) => Request[]
  filterByPriority: (priority: string) => Request[]
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Computed
  getStats: () => Promise<{
    total: number
    pending: number
    completed: number
    in_progress: number
    rejected: number
  }>
  getDepartments: () => Promise<string[]>
}

// Helper function to transform database request to frontend request
const transformDBRequest = (dbRequest: RequestWithDetails): Request => ({
  id: dbRequest.id,
  citizenId: dbRequest.citizen_id || undefined,
  militaryPersonnelId: dbRequest.military_personnel_id || undefined,
  title: dbRequest.request_type, // Map request_type to title
  description: dbRequest.description,
  status: mapDBStatusToFrontend(dbRequest.status),
  priority: (dbRequest.priority as 'low' | 'medium' | 'high') || 'medium',
  created_at: dbRequest.created_at,
  updated_at: dbRequest.updated_at,
  citizenName: dbRequest.citizens 
    ? `${dbRequest.citizens.name} ${dbRequest.citizens.surname}` 
    : dbRequest.military_personnel 
      ? `${dbRequest.military_personnel.name} ${dbRequest.military_personnel.surname}`
      : undefined
})

// Helper function to map database status to frontend status
const mapDBStatusToFrontend = (dbStatus?: string): 'pending' | 'in-progress' | 'completed' | 'rejected' => {
  switch (dbStatus) {
    case 'ΕΚΚΡΕΜΕΙ':
    case 'pending':
      return 'pending'
    case 'in-progress':
      return 'in-progress'
    case 'ΟΛΟΚΛΗΡΩΘΗΚΕ':
    case 'completed':
      return 'completed'
    case 'ΑΠΟΡΡΙΦΘΗΚΕ':
    case 'rejected':
      return 'rejected'
    default:
      return 'pending'
  }
}

// Helper function to map frontend status to database status
const mapFrontendStatusToDB = (frontendStatus: string): string => {
  switch (frontendStatus) {
    case 'pending':
      return 'pending'
    case 'in-progress':
      return 'in-progress'
    case 'completed':
      return 'completed'
    case 'rejected':
      return 'rejected'
    default:
      return 'pending'
  }
}

// Helper function to transform frontend request to database input
const transformToDBInput = (request: Partial<Request>): Partial<RequestInput> => {
  // Ensure only one of citizen_id or military_personnel_id is set (check_requester constraint)
  let citizen_id = null
  let military_personnel_id = null
  
  if (request.citizenId && request.citizenId.trim()) {
    citizen_id = request.citizenId
    military_personnel_id = null
  } else if (request.militaryPersonnelId && request.militaryPersonnelId.trim()) {
    citizen_id = null
    military_personnel_id = request.militaryPersonnelId
  } else {
    // If neither is provided, default to null values
    citizen_id = null
    military_personnel_id = null
  }

  return {
    citizen_id,
    military_personnel_id,
    request_type: request.title || '',
    description: request.description || '',
    status: mapFrontendStatusToDB(request.status || 'pending') as any,
    priority: request.priority || 'medium'
  }
}

export const useRequestStore = create<RequestStore>()( 
  persist(
    (set, get) => ({
      requests: [],
      isLoading: false,
      error: null,

      loadRequests: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const dbRequests = await requestsService.getAllRequests()
          const requests = dbRequests.map(transformDBRequest)
          set({ requests, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη φόρτωση αιτημάτων'
          })
        }
      },

      addRequest: async (requestData) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbInput = transformToDBInput(requestData) as RequestInput
          const newDBRequest = await requestsService.createRequest(dbInput)
          
          // Get the full request with relations
          const fullRequest = await requestsService.getRequestById(newDBRequest.id)
          if (fullRequest) {
            const newRequest = transformDBRequest(fullRequest)
            set(state => ({
              requests: [newRequest, ...state.requests],
              isLoading: false
            }))
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την προσθήκη αιτήματος'
          })
          throw error
        }
      },

      updateRequest: async (id, requestData) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbInput = transformToDBInput(requestData)
          await requestsService.updateRequest(id, dbInput)
          
          // Get the updated request with relations
          const updatedDBRequest = await requestsService.getRequestById(id)
          if (updatedDBRequest) {
            const updatedRequest = transformDBRequest(updatedDBRequest)
            set(state => ({
              requests: state.requests.map(request =>
                request.id === id ? updatedRequest : request
              ),
              isLoading: false
            }))
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την ενημέρωση αιτήματος'
          })
          throw error
        }
      },

      deleteRequest: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          await requestsService.deleteRequest(id)
          set(state => ({
            requests: state.requests.filter(request => request.id !== id),
            isLoading: false
          }))
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη διαγραφή αιτήματος'
          })
          throw error
        }
      },

      getRequest: (id) => {
        return get().requests.find(request => request.id === id)
      },

      searchRequests: (searchTerm) => {
        const term = searchTerm.toLowerCase().trim()
        if (!term) return get().requests

        return get().requests.filter(request =>
          request.title.toLowerCase().includes(term) ||
          request.description.toLowerCase().includes(term) ||
          (request.citizenName && request.citizenName.toLowerCase().includes(term))
        )
      },

      filterByStatus: (status) => {
        if (!status) return get().requests
        return get().requests.filter(request => request.status === status)
      },

      filterByPriority: (priority) => {
        if (!priority) return get().requests
        return get().requests.filter(request => request.priority === priority)
      },

      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),

      getStats: async () => {
        try {
          return await requestsService.getRequestsStats()
        } catch (error) {
          console.error('Σφάλμα στατιστικών αιτημάτων:', error)
          // Fallback to local calculation if service fails
          const requests = get().requests
          return {
            total: requests.length,
            pending: requests.filter(r => r.status === 'pending').length,
            completed: requests.filter(r => r.status === 'completed').length,
            in_progress: requests.filter(r => r.status === 'in-progress').length,
            rejected: requests.filter(r => r.status === 'rejected').length
          }
        }
      },

      getDepartments: async () => {
        try {
          // Return a static list of departments for now
          // This could later be extended to fetch from database
          return [
            'Γραφείο Δημάρχου',
            'Τμήμα Πολιτών',
            'Τεχνικές Υπηρεσίες',
            'Οικονομικές Υπηρεσίες',
            'Τμήμα Καθαριότητας',
            'Κοινωνικές Υπηρεσίες',
            'Πολιτιστικά Θέματα',
            'Αθλητισμός',
            'Περιβάλλον',
            'Άλλο'
          ]
        } catch (error) {
          console.error('Σφάλμα φόρτωσης τμημάτων:', error)
          return ['Γενικό Τμήμα']
        }
      }
    }),
    {
      name: 'request-storage',
      // Don't persist loading states and error states
      partialize: (state) => ({ requests: state.requests })
    }
  )
)