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
  department: dbRequest.department || undefined,
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
  department: frontendRequest.department || null,
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
  department?: string          // Maps from department
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

  // Track pending operations to avoid race conditions
  const pendingOperations = new Set<string>()
  const tempIdMap = new Map<string, string>()

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
    initialize: async (forceReinit = false) => {
      const state = get()

      // Skip if already initialized (unless forcing reinit after connection loss)
      if (state.isInitialized && !forceReinit) {
        console.log('✅ RealtimeRequestStore: Already initialized, skipping...')
        return
      }

      if (state.isLoading) {
        console.log('⏳ RealtimeRequestStore: Already initializing, waiting...')
        return
      }

      set({ isLoading: true, error: null })
      console.log(`🚀 RealtimeRequestStore: ${forceReinit ? 'Re-initializing' : 'Initializing'}...`)

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
              const realId = newItem.id

              // Check if this is from our own operation (deduplication)
              if (pendingOperations.has(realId)) {
                console.log(`⏭️ Skipping INSERT for ${realId} - operation in progress`)
                return
              }

              // Check if we already have this item
              const state = get()
              const existingItem = state.items.find(item => item.id === realId)
              if (existingItem) {
                console.log(`⏭️ Skipping INSERT for ${realId} - already exists`)
                return
              }

              // Check if this maps to a temp ID we created
              let hasTempVersion = false
              for (const [tempId, mappedRealId] of tempIdMap.entries()) {
                if (mappedRealId === realId) {
                  hasTempVersion = true
                  console.log(`⏭️ Skipping INSERT for ${realId} - temp version ${tempId} exists`)
                  break
                }
              }
              if (hasTempVersion) return

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
              const realId = updatedItem.id

              // Check if this is from our own operation
              if (pendingOperations.has(realId)) {
                console.log(`⏭️ Skipping UPDATE for ${realId} - operation in progress`)
                // Still update after a delay to ensure sync
                setTimeout(() => {
                  if (!pendingOperations.has(realId)) {
                    set(state => ({
                      items: state.items.map(item =>
                        item.id === realId ? updatedItem : item
                      ),
                      lastSync: Date.now()
                    }))
                  }
                }, 100)
                return
              }

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

              const deletedId = payload.old.id

              // Check if this is from our own operation
              if (pendingOperations.has(deletedId)) {
                console.log(`⏭️ Skipping DELETE for ${deletedId} - operation in progress`)
                return
              }

              set(state => ({
                items: state.items.filter(item => item.id !== deletedId),
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

            // If disconnected unexpectedly, reset initialization and schedule reconnect
            if (!isConnected && (status === 'CLOSED' || status === 'CHANNEL_ERROR')) {
              console.log('⚠️ Requests: Connection lost, resetting initialization state')
              set({ isInitialized: false })

              // Schedule automatic reconnection with exponential backoff
              let retryCount = 0
              const maxRetries = 3
              const attemptReconnect = () => {
                if (retryCount >= maxRetries) {
                  console.log('❌ Requests: Max reconnection attempts reached')
                  return
                }

                const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
                retryCount++

                console.log(`🔄 Requests: Reconnection attempt ${retryCount}/${maxRetries} in ${delay}ms`)
                setTimeout(async () => {
                  if (!get().isConnected && !get().isInitialized) {
                    console.log('🔄 Requests: Attempting reconnection...')
                    await get().initialize(true)

                    if (!get().isConnected) {
                      attemptReconnect()
                    }
                  }
                }, delay)
              }

              attemptReconnect()
            }
          }
        })

      } catch (error) {
        console.error('❌ Failed to initialize requests store:', error)
        set({
          isLoading: false,
          isInitialized: false,
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
      // Generate temporary ID for optimistic update
      const tempId = `temp_${Date.now()}_${Math.random()}`
      const optimisticItem: Request = {
        ...itemData,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      try {
        set({ error: null })

        // OPTIMISTIC UPDATE: Add item immediately to UI
        set(state => ({
          items: [optimisticItem, ...state.items],
          lastSync: Date.now()
        }))

        console.log(`⚡ Optimistic add for request:`, tempId)

        const dbInput = mapFrontendToDB(itemData)
        const { data, error } = await supabase
          .from('requests')
          .insert(dbInput)
          .select()
          .single()

        if (error) throw error

        const realId = data.id
        console.log('✅ Added new request:', realId)

        // Track this operation to prevent duplicate from realtime
        pendingOperations.add(realId)
        tempIdMap.set(tempId, realId)

        // Replace optimistic item with real item
        const realItem = mapDBToFrontend(data)
        set(state => ({
          items: state.items.map(item => item.id === tempId ? realItem : item),
          lastSync: Date.now()
        }))

        // Clear pending after short delay
        setTimeout(() => {
          pendingOperations.delete(realId)
          tempIdMap.delete(tempId)
          console.log(`🧹 Cleared pending operation for ${realId}`)
        }, 1000)

      } catch (error) {
        console.error('❌ Failed to add request:', error)

        // ROLLBACK: Remove optimistic item on error
        set(state => ({
          items: state.items.filter(item => item.id !== tempId),
          error: error instanceof Error ? error.message : 'Σφάλμα προσθήκης αιτήματος'
        }))
        throw error
      }
    },

    updateItem: async (id, itemData) => {
      // Store original item for rollback
      const originalItem = get().items.find(item => item.id === id)

      try {
        set({ error: null })

        // Track this operation to prevent realtime duplicate
        pendingOperations.add(id)

        // OPTIMISTIC UPDATE: Apply changes immediately to UI
        set(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, ...itemData, updated_at: new Date().toISOString() } : item
          ),
          lastSync: Date.now()
        }))

        console.log(`⚡ Optimistic update for request:`, id)

        const dbInput = mapFrontendToDB(itemData)
        const { data, error } = await supabase
          .from('requests')
          .update({ ...dbInput, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        console.log('✅ Updated request:', id)

        // Clear pending after short delay
        setTimeout(() => {
          pendingOperations.delete(id)
          console.log(`🧹 Cleared pending update for ${id}`)
        }, 500)

      } catch (error) {
        console.error('❌ Failed to update request:', error)

        // ROLLBACK: Restore original item on error
        if (originalItem) {
          set(state => ({
            items: state.items.map(item => item.id === id ? originalItem : item),
            error: error instanceof Error ? error.message : 'Σφάλμα ενημέρωσης αιτήματος'
          }))
        } else {
          set({ error: error instanceof Error ? error.message : 'Σφάλμα ενημέρωσης αιτήματος' })
        }

        pendingOperations.delete(id)
        throw error
      }
    },

    deleteItem: async (id) => {
      // Store item for potential rollback
      const itemToDelete = get().items.find(item => item.id === id)

      try {
        set({ error: null })

        // Track this operation to prevent realtime duplicate
        pendingOperations.add(id)

        // OPTIMISTIC UPDATE: Remove item immediately from UI
        set(state => ({
          items: state.items.filter(item => item.id !== id),
          lastSync: Date.now()
        }))

        console.log(`⚡ Optimistic delete for request:`, id)

        const { error } = await supabase
          .from('requests')
          .delete()
          .eq('id', id)

        if (error) throw error

        console.log('✅ Deleted request:', id)

        // Clear pending after short delay
        setTimeout(() => {
          pendingOperations.delete(id)
          console.log(`🧹 Cleared pending delete for ${id}`)
        }, 500)

      } catch (error) {
        console.error('❌ Failed to delete request:', error)

        // ROLLBACK: Restore item on error
        if (itemToDelete) {
          set(state => ({
            items: [itemToDelete, ...state.items],
            error: error instanceof Error ? error.message : 'Σφάλμα διαγραφής αιτήματος'
          }))
        } else {
          set({ error: error instanceof Error ? error.message : 'Σφάλμα διαγραφής αιτήματος' })
        }

        pendingOperations.delete(id)
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