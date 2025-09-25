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

// Helper function to transform database military personnel to frontend
const transformDBMilitaryPersonnel = (dbPersonnel: DBMilitaryPersonnel): MilitaryPersonnel => ({
  id: dbPersonnel.id,
  name: dbPersonnel.name,
  surname: dbPersonnel.surname,
  rank: dbPersonnel.rank || '',
  unit: dbPersonnel.service_unit || '',
  wish: dbPersonnel.wish || undefined,
  sendDate: dbPersonnel.send_date || undefined,
  comments: dbPersonnel.comments || undefined,
  militaryId: dbPersonnel.military_id || '',
  esso: dbPersonnel.esso || '',
  essoYear: dbPersonnel.esso_year || '',
  essoLetter: dbPersonnel.esso_letter || '',
  status: dbPersonnel.status || 'pending',
  created_at: dbPersonnel.created_at,
  updated_at: dbPersonnel.updated_at
})

// Helper function to transform frontend to database input
const transformToDBInput = (personnel: Partial<MilitaryPersonnel>): Partial<MilitaryPersonnelInput> => ({
  name: personnel.name,
  surname: personnel.surname,
  rank: personnel.rank?.trim() || null,
  service_unit: personnel.unit?.trim() || null,
  wish: personnel.wish?.trim() || null,
  send_date: personnel.sendDate || null,
  comments: personnel.comments?.trim() || null,
  military_id: personnel.militaryId?.trim() || null,
  esso: personnel.esso?.trim() || null,
  esso_year: personnel.essoYear?.trim() || null,
  esso_letter: (personnel.essoLetter?.trim() as 'Α' | 'Β' | 'Γ' | 'Δ' | 'Ε' | 'ΣΤ') || null,
  status: personnel.status || 'pending'
})

/**
 * ULTRA SAFE Realtime Military Store
 *
 * Maintains EXACT same interface as old militaryStore για seamless migration.
 * Uses RealtimeManager για optimized connections.
 */
const useRealtimeMilitaryStore = create<RealtimeMilitaryStore>((set, get) => {
  const storeId = `military_store_${Date.now()}`

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
    initialize: async () => {
      if (get().isInitialized) {
        console.log('🔄 RealtimeMilitaryStore: Already initialized, skipping...')
        return
      }

      set({ isLoading: true, error: null })
      console.log('🚀 RealtimeMilitaryStore: Initializing...')

      try {
        // 1. Load initial data from database
        const { data, error } = await supabase
          .from('military_personnel')
          .select('*')
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

        // 2. Subscribe to realtime updates με RealtimeManager
        realtimeManager.subscribe({
          tableName: 'military_personnel',
          storeId,
          onInsert: (payload) => {
            try {
              console.log('➕ New military personnel:', payload.new)
              if (!payload.new) {
                console.warn('INSERT payload missing new data')
                return
              }

              const newItem = transformDBMilitaryPersonnel(payload.new)
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
              console.log('📝 Updated military personnel:', payload.new)
              if (!payload.new) {
                console.warn('UPDATE payload missing new data')
                return
              }

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
            console.log(`${isConnected ? '🔗' : '🔌'} Military personnel realtime ${status}`)

            set({
              isConnected,
              error: error ? `Realtime error: ${error.message}` : get().error
            })
          }
        })

      } catch (error) {
        console.error('❌ Failed to initialize military personnel store:', error)
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Σφάλμα σύνδεσης στρατιωτικού προσωπικού'
        })
      }
    },

    // Disconnect realtime
    disconnect: () => {
      console.log('🔌 Disconnecting military personnel realtime')
      realtimeManager.unsubscribe('military_personnel', storeId)
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
          .from('military_personnel')
          .select('*')
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
      try {
        set({ error: null })

        const dbInput = transformToDBInput(itemData)
        const { data, error } = await supabase
          .from('military_personnel')
          .insert(dbInput)
          .select()
          .single()

        if (error) throw error

        console.log('✅ Added new military personnel:', data.id)
        // Realtime will handle state update automatically

      } catch (error) {
        console.error('❌ Failed to add military personnel:', error)
        set({ error: error instanceof Error ? error.message : 'Σφάλμα προσθήκης στρατιωτικού' })
        throw error
      }
    },

    updateItem: async (id, itemData) => {
      try {
        set({ error: null })

        const dbInput = transformToDBInput(itemData)
        const { error } = await supabase
          .from('military_personnel')
          .update(dbInput)
          .eq('id', id)

        if (error) throw error

        console.log('✅ Updated military personnel:', id)
        // Realtime will handle state update automatically

      } catch (error) {
        console.error('❌ Failed to update military personnel:', error)
        set({ error: error instanceof Error ? error.message : 'Σφάλμα ενημέρωσης στρατιωτικού' })
        throw error
      }
    },

    deleteItem: async (id) => {
      try {
        set({ error: null })

        const { error } = await supabase
          .from('military_personnel')
          .delete()
          .eq('id', id)

        if (error) throw error

        console.log('✅ Deleted military personnel:', id)
        // Realtime will handle state update automatically

      } catch (error) {
        console.error('❌ Failed to delete military personnel:', error)
        set({ error: error instanceof Error ? error.message : 'Σφάλμα διαγραφής στρατιωτικού' })
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