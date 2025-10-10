import { create } from 'zustand'
import { realtimeManager } from '../lib/realtimeManager'
import { militaryService, type MilitaryPersonnel as DBMilitaryPersonnel, type MilitaryPersonnelInput } from '../services/militaryService'
import { supabase } from '../lib/supabase'

// Frontend interface that maps to backend data - EXACT same as old militaryStore
export interface MilitaryPersonnel {
  id: string
  name: string
  surname: string
  rank: string
  unit: string
  wish?: string
  sendDate?: string
  comments?: string
  militaryId: string
  esso: string
  essoYear: string
  essoLetter: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string
  updated_at: string
}

interface RealtimeMilitaryStoreState {
  items: MilitaryPersonnel[]
  isLoading: boolean
  error: string | null
  isConnected: boolean
  lastSync: number
  isInitialized: boolean
}

interface RealtimeMilitaryStoreActions {
  // EXACT same interface as old militaryStore για seamless migration
  loadItems: () => Promise<void>
  addItem: (item: Omit<MilitaryPersonnel, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateItem: (id: string, item: Partial<MilitaryPersonnel>) => Promise<void>
  deleteItem: (id: string) => Promise<void>

  // Realtime management
  initialize: () => Promise<void>
  disconnect: () => void
  reloadData: () => Promise<void>

  // Utilities - EXACT same interface as baseStore
  getItem: (id: string) => MilitaryPersonnel | undefined
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
}

type RealtimeMilitaryStore = RealtimeMilitaryStoreState & RealtimeMilitaryStoreActions

// Helper function to transform database citizen (with military fields) to frontend military personnel
// NOTE: This reads from the 'citizens' table, not 'military_personnel' table
const transformDBMilitaryPersonnel = (dbCitizen: any): MilitaryPersonnel => ({
  id: dbCitizen.id,
  name: dbCitizen.name,
  surname: dbCitizen.surname,
  rank: dbCitizen.militaryRank || '',              // from citizens.militaryRank
  unit: dbCitizen.militaryServiceUnit || '',       // from citizens.militaryServiceUnit
  wish: dbCitizen.militaryWish || undefined,       // from citizens.militaryWish
  sendDate: dbCitizen.military_send_date || undefined,
  comments: dbCitizen.military_comments || undefined,
  militaryId: dbCitizen.military_id || '',
  esso: dbCitizen.militaryEsso || '',              // from citizens.militaryEsso
  essoYear: dbCitizen.military_esso_year || '',    // from citizens.military_esso_year
  essoLetter: dbCitizen.military_esso_letter || '',// from citizens.military_esso_letter
  status: dbCitizen.military_status || 'pending',  // from citizens.military_status
  created_at: dbCitizen.created_at,
  updated_at: dbCitizen.updated_at
})

// Helper function to transform frontend to database input for 'citizens' table
const transformToDBInput = (personnel: Partial<MilitaryPersonnel>): any => ({
  name: personnel.name,
  surname: personnel.surname,
  militaryRank: personnel.rank?.trim() || null,              // to citizens.militaryRank
  militaryServiceUnit: personnel.unit?.trim() || null,       // to citizens.militaryServiceUnit
  militaryWish: personnel.wish?.trim() || null,              // to citizens.militaryWish
  military_send_date: personnel.sendDate || null,
  military_comments: personnel.comments?.trim() || null,
  military_id: personnel.militaryId?.trim() || null,
  militaryEsso: personnel.esso?.trim() || null,              // to citizens.militaryEsso
  military_esso_year: personnel.essoYear?.trim() || null,    // to citizens.military_esso_year
  military_esso_letter: (personnel.essoLetter?.trim() as 'Α' | 'Β' | 'Γ' | 'Δ' | 'Ε' | 'ΣΤ') || null,
  military_status: personnel.status || 'pending',            // to citizens.military_status
  isMilitary: true  // ensure isMilitary flag is set
})

/**
 * ULTRA SAFE Realtime Military Store
 *
 * Maintains EXACT same interface as old militaryStore για seamless migration.
 * Uses RealtimeManager για optimized connections.
 */
const useRealtimeMilitaryStore = create<RealtimeMilitaryStore>((set, get) => {
  const storeId = `military_store_${Date.now()}`

  // Track pending operations to avoid race conditions
  const pendingOperations = new Set<string>()
  const tempIdMap = new Map<string, string>()

  return {
    // Initial state - EXACT same as old militaryStore
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
        console.log('✅ RealtimeMilitaryStore: Already initialized, skipping...')
        return
      }

      if (state.isLoading) {
        console.log('⏳ RealtimeMilitaryStore: Already initializing, waiting...')
        return
      }

      set({ isLoading: true, error: null })
      console.log(`🚀 RealtimeMilitaryStore: ${forceReinit ? 'Re-initializing' : 'Initializing'}...`)

      try {
        // 1. Load initial data from database (from citizens table with isMilitary filter)
        const { data, error } = await supabase
          .from('citizens')
          .select('*')
          .eq('isMilitary', true)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ Failed to load military personnel:', error)
          throw error
        }

        const transformedData = data.map(transformDBMilitaryPersonnel)
        set({
          items: transformedData,
          isLoading: false,
          lastSync: Date.now(),
          isInitialized: true
        })

        console.log(`✅ Loaded ${transformedData.length} military personnel from database`)

        // 2. Subscribe to realtime updates με RealtimeManager (citizens table, filtered by isMilitary)
        realtimeManager.subscribe({
          tableName: 'citizens',
          storeId,
          onInsert: (payload) => {
            try {
              console.log('➕ New citizen (checking if military):', payload.new)
              if (!payload.new) {
                console.warn('INSERT payload missing new data')
                return
              }

              // Only process if this is a military citizen
              if (!payload.new.isMilitary) {
                return
              }

              const newItem = transformDBMilitaryPersonnel(payload.new)
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

              // Also check if this maps to a temp ID we created
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
              console.log('📝 Updated citizen (checking if military):', payload.new)
              if (!payload.new) {
                console.warn('UPDATE payload missing new data')
                return
              }

              const realId = payload.new.id

              // Check if this is from our own operation
              if (pendingOperations.has(realId)) {
                console.log(`⏭️ Skipping UPDATE for ${realId} - operation in progress`)
                // Still update after a delay to ensure sync
                setTimeout(() => {
                  if (!pendingOperations.has(realId) && payload.new.isMilitary) {
                    const updatedItem = transformDBMilitaryPersonnel(payload.new)
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

              // If updated to non-military, remove from list
              if (!payload.new.isMilitary) {
                set(state => ({
                  items: state.items.filter(item => item.id !== realId),
                  lastSync: Date.now()
                }))
                return
              }

              // If still military, update the item
              const updatedItem = transformDBMilitaryPersonnel(payload.new)
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
              console.log('🗑️ Deleted military personnel:', payload.old)
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
            console.log(`${isConnected ? '🔗' : '🔌'} Military personnel realtime ${status}`)

            set({
              isConnected,
              error: error ? `Realtime error: ${error.message}` : get().error
            })

            // If disconnected unexpectedly, reset initialization and schedule reconnect
            if (!isConnected && (status === 'CLOSED' || status === 'CHANNEL_ERROR')) {
              console.log('⚠️ Military: Connection lost, resetting initialization state')
              set({ isInitialized: false })

              // Schedule automatic reconnection with exponential backoff
              let retryCount = 0
              const maxRetries = 3
              const attemptReconnect = () => {
                if (retryCount >= maxRetries) {
                  console.log('❌ Military: Max reconnection attempts reached')
                  return
                }

                const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
                retryCount++

                console.log(`🔄 Military: Reconnection attempt ${retryCount}/${maxRetries} in ${delay}ms`)
                setTimeout(async () => {
                  if (!get().isConnected && !get().isInitialized) {
                    console.log('🔄 Military: Attempting reconnection...')
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
        console.error('❌ Failed to initialize military personnel store:', error)
        set({
          isLoading: false,
          isInitialized: false, // Reset on error
          error: error instanceof Error ? error.message : 'Σφάλμα σύνδεσης στρατιωτικού προσωπικού'
        })
      }
    },

    // Disconnect realtime
    disconnect: () => {
      console.log('🔌 Disconnecting military personnel realtime')
      realtimeManager.unsubscribe('citizens', storeId)
      set({
        isConnected: false,
        isInitialized: false
      })
    },

    // Fallback method to reload data
    reloadData: async () => {
      try {
        console.log('🔄 Fallback reload for military personnel...')
        const { data, error } = await supabase
          .from('citizens')
          .select('*')
          .eq('isMilitary', true)
          .order('created_at', { ascending: false })

        if (error) throw error

        const transformedData = data.map(transformDBMilitaryPersonnel)
        set({
          items: transformedData,
          lastSync: Date.now()
        })

        console.log('✅ Fallback reload completed for military personnel')
      } catch (error) {
        console.error('❌ Fallback reload failed for military personnel:', error)
      }
    },

    // CRUD operations - EXACT same interface as old militaryStore
    addItem: async (itemData) => {
      // Generate temporary ID for optimistic update
      const tempId = `temp_${Date.now()}_${Math.random()}`
      const optimisticItem: MilitaryPersonnel = {
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

        console.log(`⚡ Optimistic add for military:`, tempId)

        const dbInput = transformToDBInput(itemData)
        // isMilitary is already set in transformToDBInput
        const { data, error } = await supabase
          .from('citizens')
          .insert(dbInput)
          .select()
          .single()

        if (error) throw error

        const realId = data.id
        console.log('✅ Added new military personnel:', realId)

        // Track this operation to prevent duplicate from realtime
        pendingOperations.add(realId)
        tempIdMap.set(tempId, realId)

        // Replace optimistic item with real item
        const realItem = transformDBMilitaryPersonnel(data)
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
        console.error('❌ Failed to add military personnel:', error)

        // ROLLBACK: Remove optimistic item on error
        set(state => ({
          items: state.items.filter(item => item.id !== tempId),
          error: error instanceof Error ? error.message : 'Σφάλμα προσθήκης στρατιωτικού'
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

        console.log(`⚡ Optimistic update for military:`, id)

        const dbInput = transformToDBInput(itemData)
        const { error } = await supabase
          .from('citizens')
          .update(dbInput)
          .eq('id', id)

        if (error) throw error

        console.log('✅ Updated military personnel:', id)

        // Clear pending after short delay
        setTimeout(() => {
          pendingOperations.delete(id)
          console.log(`🧹 Cleared pending update for ${id}`)
        }, 500)

      } catch (error) {
        console.error('❌ Failed to update military personnel:', error)

        // ROLLBACK: Restore original item on error
        if (originalItem) {
          set(state => ({
            items: state.items.map(item => item.id === id ? originalItem : item),
            error: error instanceof Error ? error.message : 'Σφάλμα ενημέρωσης στρατιωτικού'
          }))
        } else {
          set({ error: error instanceof Error ? error.message : 'Σφάλμα ενημέρωσης στρατιωτικού' })
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

        console.log(`⚡ Optimistic delete for military:`, id)

        const { error } = await supabase
          .from('citizens')
          .delete()
          .eq('id', id)

        if (error) throw error

        console.log('✅ Deleted military personnel:', id)

        // Clear pending after short delay
        setTimeout(() => {
          pendingOperations.delete(id)
          console.log(`🧹 Cleared pending delete for ${id}`)
        }, 500)

      } catch (error) {
        console.error('❌ Failed to delete military personnel:', error)

        // ROLLBACK: Restore item on error
        if (itemToDelete) {
          set(state => ({
            items: [itemToDelete, ...state.items],
            error: error instanceof Error ? error.message : 'Σφάλμα διαγραφής στρατιωτικού'
          }))
        } else {
          set({ error: error instanceof Error ? error.message : 'Σφάλμα διαγραφής στρατιωτικού' })
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

// Additional military-specific methods - EXACT same as old militaryStore
export const useMilitaryActions = () => {
  const store = useRealtimeMilitaryStore()

  return {
    ...store,

    // Search functionality
    searchMilitaryPersonnel: async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        return store.loadItems()
      }

      try {
        store.setLoading(true)
        store.setError(null)

        const searchResults = await militaryService.searchMilitaryPersonnel(searchTerm)
        const transformedResults = searchResults.map(transformDBMilitaryPersonnel)

        // Update store with search results
        useRealtimeMilitaryStore.setState({
          items: transformedResults,
          isLoading: false
        })

      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Σφάλμα αναζήτησης')
        store.setLoading(false)
      }
    },

    // Filter by ESSO
    filterByEsso: async (essoYear: string, essoLetter?: string) => {
      try {
        store.setLoading(true)
        const results = await militaryService.getMilitaryPersonnelByEsso(essoYear, essoLetter)
        const transformed = results.map(transformDBMilitaryPersonnel)

        useRealtimeMilitaryStore.setState({
          items: transformed,
          isLoading: false
        })

        return transformed
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Σφάλμα φίλτρου ΕΣΣΟ')
        store.setLoading(false)
        return []
      }
    },

    // Filter by status (local operation)
    filterByStatus: (status: string): MilitaryPersonnel[] => {
      return store.items.filter(person => person.status === status)
    },

    // Get statistics
    getStats: async () => {
      try {
        const stats = await militaryService.getMilitaryStats()
        return stats
      } catch (error) {
        console.error('Error getting military stats:', error)

        // Fallback to local calculation
        const personnel = store.items
        const byStatus = personnel.reduce((acc, person) => {
          acc[person.status] = (acc[person.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const byYear = personnel.reduce((acc, person) => {
          const year = person.essoYear || 'Άγνωστο'
          acc[year] = (acc[year] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        return {
          total: personnel.length,
          pending: byStatus.pending || 0,
          approved: byStatus.approved || 0,
          rejected: byStatus.rejected || 0,
          completed: byStatus.completed || 0,
          by_year: byYear
        }
      }
    },

    // Group by ESSO
    getEssoGroups: (): Record<string, MilitaryPersonnel[]> => {
      return store.items.reduce((groups, person) => {
        const key = `${person.essoYear}-${person.essoLetter}` || 'Άλλο'
        if (!groups[key]) groups[key] = []
        groups[key].push(person)
        return groups
      }, {} as Record<string, MilitaryPersonnel[]>)
    },

    // Get available ESSO years
    getEssoYears: async (): Promise<string[]> => {
      try {
        const years = await militaryService.getEssoYears()
        return years
      } catch (error) {
        // Fallback to local calculation
        const uniqueYears = [...new Set(store.items.map(p => p.essoYear).filter(Boolean))]
        return uniqueYears.sort((a, b) => b.localeCompare(a))
      }
    },

    // Update status (common operation)
    updateStatus: async (id: string, status: MilitaryPersonnel['status']) => {
      return store.updateItem(id, { status })
    }
  }
}

// Convenience hook for single military personnel
export const useMilitaryPersonnel = (id?: string) => {
  const store = useRealtimeMilitaryStore()

  return {
    personnel: id ? store.getItem(id) : null,
    isLoading: store.isLoading,
    error: store.error
  }
}

// Export the main store hook - SAME NAME as old store για seamless migration
export const useMilitaryStore = useRealtimeMilitaryStore