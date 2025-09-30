import { create } from 'zustand'
import { realtimeManager } from '../lib/realtimeManager'
import { requestsService, type Request as DBRequest, type RequestInput, type RequestWithDetails } from '../services/requestsService'
import { supabase } from '../lib/supabase'

// Status mapping functions
const mapStatusFromDB = (dbStatus: string): Request['status'] => {
  switch (dbStatus) {
    case 'pending':
    case 'ΕΚΚΡΕΜΕΙ':
      return 'ΕΚΚΡΕΜΕΙ'
    case 'in-progress':
    case 'ΣΕ_ΕΞΕΛΙΞΗ':
      return 'ΣΕ_ΕΞΕΛΙΞΗ'
    case 'completed':
    case 'ΟΛΟΚΛΗΡΩΘΗΚΕ':
      return 'ΟΛΟΚΛΗΡΩΘΗΚΕ'
    case 'rejected':
    case 'ΑΠΟΡΡΙΦΘΗΚΕ':
      return 'ΑΠΟΡΡΙΦΘΗΚΕ'
    default:
      return 'ΕΚΚΡΕΜΕΙ'
  }
}

const mapStatusToDB = (frontendStatus: Request['status']): DBRequest['status'] => {
  // Store as Greek values in database for consistency
  return frontendStatus
}

// Helper functions to convert between database and frontend formats
const mapDBToFrontend = (dbRequest: DBRequest): Request => ({
  id: dbRequest.id,
  citizenId: dbRequest.citizen_id || undefined,
  militaryPersonnelId: dbRequest.military_personnel_id || undefined,
  requestType: dbRequest.request_type,
  description: dbRequest.description,
  status: mapStatusFromDB(dbRequest.status || 'pending'),
  priority: (dbRequest.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
  sendDate: dbRequest.send_date || undefined,
  completionDate: dbRequest.completion_date || undefined,
  notes: dbRequest.notes || undefined,
  created_at: dbRequest.created_at,
  updated_at: dbRequest.updated_at
})

const mapFrontendToDB = (frontendRequest: Partial<Request>): Partial<RequestInput> => ({
  citizen_id: frontendRequest.citizenId || null,
  military_personnel_id: frontendRequest.militaryPersonnelId || null,
  request_type: frontendRequest.requestType,
  description: frontendRequest.description,
  status: frontendRequest.status ? mapStatusToDB(frontendRequest.status) : undefined,
  priority: frontendRequest.priority,
  send_date: frontendRequest.sendDate || null,
  completion_date: frontendRequest.completionDate || null,
  notes: frontendRequest.notes || null
})

// Helper to transform database request with details to frontend format
const mapDBToFrontendWithDetails = (dbRequestWithDetails: RequestWithDetails): RequestWithDetails => ({
  ...mapDBToFrontend(dbRequestWithDetails),
  request_type: dbRequestWithDetails.request_type,
  citizens: dbRequestWithDetails.citizens ? {
    name: dbRequestWithDetails.citizens.name,
    surname: dbRequestWithDetails.citizens.surname,
    municipality: dbRequestWithDetails.citizens.municipality,
    isMilitary: dbRequestWithDetails.citizens["isMilitary"],
    militaryRank: dbRequestWithDetails.citizens["militaryRank"]
  } : undefined
})

// Frontend interface that maps to backend data - Match database schema
export interface Request {
  id: string
  citizenId?: string           // Maps from citizen_id
  militaryPersonnelId?: string // Maps from military_personnel_id
  requestType: string          // Maps from request_type
  description: string
  status: 'ΕΚΚΡΕΜΕΙ' | 'ΣΕ_ΕΞΕΛΙΞΗ' | 'ΟΛΟΚΛΗΡΩΘΗΚΕ' | 'ΑΠΟΡΡΙΦΘΗΚΕ'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  sendDate?: string           // Maps from send_date
  completionDate?: string     // Maps from completion_date
  notes?: string
  created_at: string
  updated_at: string
}



interface RealtimeRequestStoreState {
  items: Request[]
  isLoading: boolean
  error: string | null
  isConnected: boolean
  lastSync: number
  isInitialized: boolean
}

interface RealtimeRequestStoreActions {
  // EXACT same interface as old requestStore για seamless migration
  loadItems: () => Promise<void>
  addItem: (item: Omit<Request, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateItem: (id: string, item: Partial<Request>) => Promise<void>
  deleteItem: (id: string) => Promise<void>

  // Realtime management
  initialize: () => Promise<void>
  disconnect: () => void
  reloadData: () => Promise<void>

  // Utilities - EXACT same interface as baseStore
  getItem: (id: string) => Request | undefined
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
}

type RealtimeRequestStore = RealtimeRequestStoreState & RealtimeRequestStoreActions

// Helper function to transform database request to frontend

/**
 * ULTRA SAFE Realtime Request Store
 *
 * Maintains EXACT same interface as old requestStore για seamless migration.
 * Uses RealtimeManager για optimized connections.
 */
const useRealtimeRequestStore = create<RealtimeRequestStore>((set, get) => {
  const storeId = `request_store_${Date.now()}`

  return {
    // Initial state - EXACT same as old requestStore
    items: [],
    isLoading: false,
    error: null,
    isConnected: false,
    lastSync: 0,
    isInitialized: false,

    // Compatible loadItems method για existing components
    loadItems: async () => {
      await get().initialize()
    },

    // Initialize realtime connection
    initialize: async () => {
      if (get().isInitialized) {
        console.log('🔄 RealtimeRequestStore: Already initialized, skipping...')
        return
      }

      set({ isLoading: true, error: null })
      console.log('🚀 RealtimeRequestStore: Initializing...')

      try {
        // 1. Load initial data from database
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ Failed to load requests:', error)
          throw error
        }

        const transformedData = data.map(mapDBToFrontend)
        set({
          items: transformedData,
          isLoading: false,
          lastSync: Date.now(),
          isInitialized: true
        })

        console.log(`✅ Loaded ${transformedData.length} requests from database`)

        // 2. Subscribe to realtime updates με RealtimeManager
        realtimeManager.subscribe({
          tableName: 'requests',
          storeId,
          onInsert: (payload) => {
            try {
              console.log('➕ New request:', payload.new)
              if (!payload.new) {
                console.warn('INSERT payload missing new data')
                return
              }

              const newItem = mapDBToFrontend(payload.new)
              set(state => ({
                items: [newItem, ...state.items],
                lastSync: Date.now()
              }))
            } catch (error) {
              console.error('❌ Failed to process INSERT:', error)
            }
          },
          onUpdate: (payload) => {
            try {
              console.log('📝 Updated request:', payload.new)
              if (!payload.new) {
                console.warn('UPDATE payload missing new data')
                return
              }

              const updatedItem = mapDBToFrontend(payload.new)
              set(state => ({
                items: state.items.map(item =>
                  item.id === updatedItem.id ? updatedItem : item
                ),
                lastSync: Date.now()
              }))
            } catch (error) {
              console.error('❌ Failed to process UPDATE:', error)
            }
          },
          onDelete: (payload) => {
            try {
              console.log('🗑️ Deleted request:', payload.old)
              if (!payload.old?.id) {
                console.warn('DELETE payload missing old.id')
                return
              }

              set(state => ({
                items: state.items.filter(item => item.id !== payload.old.id),
                lastSync: Date.now()
              }))
            } catch (error) {
              console.error('❌ Failed to process DELETE:', error)
            }
          },
          onStatusChange: (status, error) => {
            const isConnected = status === 'SUBSCRIBED'
            console.log(`${isConnected ? '🔗' : '🔌'} Requests realtime ${status}`)

            set({
              isConnected,
              error: error ? `Realtime error: ${error.message}` : get().error
            })
          }
        })

      } catch (error) {
        console.error('❌ Failed to initialize requests store:', error)
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Σφάλμα σύνδεσης αιτημάτων'
        })
      }
    },

    // Disconnect realtime
    disconnect: () => {
      console.log('🔌 Disconnecting requests realtime')
      realtimeManager.unsubscribe('requests', storeId)
      set({
        isConnected: false,
        isInitialized: false
      })
    },

    // Fallback method to reload data
    reloadData: async () => {
      try {
        console.log('🔄 Fallback reload for requests...')
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        const transformedData = data.map(mapDBToFrontend)
        set({
          items: transformedData,
          lastSync: Date.now()
        })

        console.log('✅ Fallback reload completed for requests')
      } catch (error) {
        console.error('❌ Fallback reload failed for requests:', error)
      }
    },

    // CRUD operations - EXACT same interface as old requestStore
    addItem: async (itemData) => {
      try {
        set({ error: null })

        const dbInput = mapFrontendToDB(itemData)
        const { data, error } = await supabase
          .from('requests')
          .insert(dbInput)
          .select()
          .single()

        if (error) throw error

        console.log('✅ Added new request:', data.id)
        // Realtime will handle state update automatically

      } catch (error) {
        console.error('❌ Failed to add request:', error)
        set({ error: error instanceof Error ? error.message : 'Σφάλμα προσθήκης αιτήματος' })
        throw error
      }
    },

    updateItem: async (id, itemData) => {
      try {
        set({ error: null })

        const dbInput = mapFrontendToDB(itemData)
        const { data, error } = await supabase
          .from('requests')
          .update({ ...dbInput, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        console.log('✅ Updated request:', id)
        // Realtime will handle state update automatically

      } catch (error) {
        console.error('❌ Failed to update request:', error)
        set({ error: error instanceof Error ? error.message : 'Σφάλμα ενημέρωσης αιτήματος' })
        throw error
      }
    },

    deleteItem: async (id) => {
      try {
        set({ error: null })

        const { error } = await supabase
          .from('requests')
          .delete()
          .eq('id', id)

        if (error) throw error

        console.log('✅ Deleted request:', id)
        // Realtime will handle state update automatically

      } catch (error) {
        console.error('❌ Failed to delete request:', error)
        set({ error: error instanceof Error ? error.message : 'Σφάλμα διαγραφής αιτήματος' })
        throw error
      }
    },

    // Utilities - EXACT same interface as baseStore
    getItem: (id) => get().items.find(item => item.id === id),
    setError: (error) => set({ error }),
    setLoading: (loading) => set({ isLoading: loading })
  }
})

// Additional request-specific methods - EXACT same as old requestStore
export const useRequestActions = () => {
  const store = useRealtimeRequestStore()

  return {
    ...store,

    // Get requests with citizen details
    getRequestsWithDetails: async () => {
      try {
        store.setLoading(true)
        const detailedRequests = await requestsService.getAllRequests()
        const transformed = detailedRequests.map(mapDBToFrontendWithDetails)

        // Don't cache detailed requests, they're for viewing only
        return transformed
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Σφάλμα φόρτωσης αιτημάτων')
        return []
      } finally {
        store.setLoading(false)
      }
    },

    // Search functionality - simplified since we don't have searchRequests method
    searchRequests: async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        return store.loadItems()
      }

      try {
        store.setLoading(true)
        store.setError(null)

        // For now, filter locally until we implement server-side search
        const allRequests = await requestsService.getAllRequests()
        const searchResults = allRequests.filter(req =>
          req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.request_type.toLowerCase().includes(searchTerm.toLowerCase())
        )
        const transformedResults = searchResults.map(mapDBToFrontend)

        useRealtimeRequestStore.setState({
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
        const transformed = requests.map(mapDBToFrontend)

        return transformed
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Σφάλμα φόρτωσης αιτημάτων πολίτη')
        return []
      } finally {
        store.setLoading(false)
      }
    },

    // Get requests by military personnel (now just citizens with isMilitary = true)
    getRequestsByMilitary: async (citizenId: string) => {
      try {
        store.setLoading(true)
        const requests = await requestsService.getRequestsByCitizen(citizenId)
        const transformed = requests.map(mapDBToFrontend)

        return transformed
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Σφάλμα φόρτωσης αιτημάτων στρατιωτικού')
        return []
      } finally {
        store.setLoading(false)
      }
    },

    // Get statistics - Calculate locally since service has wrong RPC call
    getStats: async () => {
      try {
        // Always calculate locally for consistency
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
          pending: byStatus['ΕΚΚΡΕΜΕΙ'] || 0,
          inProgress: byStatus['ΣΕ_ΕΞΕΛΙΞΗ'] || 0,
          completed: byStatus['ΟΛΟΚΛΗΡΩΘΗΚΕ'] || 0,
          rejected: byStatus['ΑΠΟΡΡΙΦΘΗΚΕ'] || 0,
          high_priority: byPriority.high || 0,
          medium_priority: byPriority.medium || 0,
          low_priority: byPriority.low || 0
        }
      } catch (error) {
        console.error('Error calculating request stats:', error)
        return {
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          rejected: 0,
          high_priority: 0,
          medium_priority: 0,
          low_priority: 0
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
        status: 'ΟΛΟΚΛΗΡΩΘΗΚΕ',
        completionDate: completionDate || new Date().toISOString()
      })
    },

    // Get departments (mock for now)
    getDepartments: async (): Promise<string[]> => {
      try {
        // For now, return some common departments
        return [
          'Διοικητικό',
          'Οικονομικό',
          'Τεχνικό',
          'Νομικό',
          'Προσωπικού',
          'Πληροφορικής'
        ]
      } catch (error) {
        console.error('Error getting departments:', error)
        return []
      }
    }
  }
}

// Convenience hook for single request
export const useRequest = (id?: string) => {
  const store = useRealtimeRequestStore()

  return {
    request: id ? store.getItem(id) : null,
    isLoading: store.isLoading,
    error: store.error
  }
}

// Export the main store hook - SAME NAME as old store για seamless migration
export const useRequestStore = useRealtimeRequestStore