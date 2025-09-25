import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { realtimeManager } from '../lib/realtimeManager'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeStoreState<T> {
  items: T[]
  isLoading: boolean
  error: string | null
  isConnected: boolean
  lastSync: number
  isInitialized: boolean
}

interface RealtimeStoreActions<T> {
  // Basic CRUD - EXACT same interface as baseStore για seamless migration
  addItem: (item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateItem: (id: string, item: Partial<T>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  loadItems: () => Promise<void> // Keep same name for compatibility

  // Realtime management
  initialize: () => Promise<void>
  disconnect: () => void
  reloadData: () => Promise<void> // Fallback reload method

  // Utilities - EXACT same interface as baseStore
  getItem: (id: string) => T | undefined
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
}

export type RealtimeStore<T> = RealtimeStoreState<T> & RealtimeStoreActions<T>

export interface RealtimeStoreOptions<T> {
  tableName: string
  orderBy?: { column: string; ascending?: boolean }
  transformFromDB?: (item: any) => T
  transformToDB?: (item: Partial<T>) => any
  service?: any // Keep compatibility with existing services
}

/**
 * ULTRA SAFE Realtime Store Creator
 *
 * Maintains EXACT same interface as existing baseStore για seamless migration.
 * Existing components can drop-in replace without any changes.
 */
export function createRealtimeStore<T extends { id: string }>(
  options: RealtimeStoreOptions<T>
) {
  const {
    tableName,
    orderBy = { column: 'created_at', ascending: false },
    transformFromDB = (item) => item as T,
    transformToDB = (item) => item,
    service
  } = options

  return create<RealtimeStore<T>>((set, get) => {
    const storeId = `${tableName}_store_${Date.now()}`

    return {
      // Initial state - EXACT same as baseStore
      items: [],
      isLoading: false,
      error: null,
      isConnected: false,
      lastSync: 0,
      isInitialized: false,

      // Compatible loadItems method (για existing components)
      loadItems: async () => {
        await get().initialize()
      },

      // Fallback method to reload data if realtime fails
      reloadData: async () => {
        try {
          console.log(`🔄 Fallback reload for ${tableName}...`)
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order(orderBy.column, { ascending: orderBy.ascending })

          if (error) throw error

          const transformedData = data.map(transformFromDB)
          set({
            items: transformedData,
            lastSync: Date.now()
          })

          console.log(`✅ Fallback reload completed for ${tableName}`)
        } catch (error) {
          console.error(`❌ Fallback reload failed for ${tableName}:`, error)
        }
      },

      // Initialize realtime connection using RealtimeManager
      initialize: async () => {
        if (get().isInitialized) {
          console.log(`🔄 ${tableName} store: Already initialized, skipping...`)
          return
        }

        set({ isLoading: true, error: null })
        console.log(`🚀 ${tableName} store: Initializing...`)

        try {
          // 1. Load initial data from database
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order(orderBy.column, { ascending: orderBy.ascending })

          if (error) {
            console.error(`❌ Failed to load ${tableName}:`, error)
            throw error
          }

          const transformedData = data.map(transformFromDB)
          set({
            items: transformedData,
            isLoading: false,
            lastSync: Date.now(),
            isInitialized: true
          })

          console.log(`✅ Loaded ${transformedData.length} items from ${tableName}`)

          // 2. Subscribe to realtime updates using RealtimeManager
          realtimeManager.subscribe({
            tableName,
            storeId,
            onInsert: (payload) => {
              try {
                console.log(`➕ New ${tableName} item:`, payload.new)
                if (!payload.new) {
                  console.warn(`INSERT payload missing 'new' data for ${tableName}`)
                  return
                }

                const newItem = transformFromDB(payload.new)
                set(state => ({
                  items: [newItem, ...state.items],
                  lastSync: Date.now()
                }))
              } catch (error) {
                console.error(`❌ Failed to process INSERT for ${tableName}:`, error)
              }
            },
            onUpdate: (payload) => {
              try {
                console.log(`📝 Updated ${tableName} item:`, payload.new)
                if (!payload.new) {
                  console.warn(`UPDATE payload missing 'new' data for ${tableName}`)
                  return
                }

                const updatedItem = transformFromDB(payload.new)
                set(state => ({
                  items: state.items.map(item =>
                    item.id === updatedItem.id ? updatedItem : item
                  ),
                  lastSync: Date.now()
                }))
              } catch (error) {
                console.error(`❌ Failed to process UPDATE for ${tableName}:`, error)
              }
            },
            onDelete: (payload) => {
              try {
                console.log(`🗑️ Deleted ${tableName} item:`, payload.old)
                if (!payload.old?.id) {
                  console.warn(`DELETE payload missing 'old.id' data for ${tableName}`)
                  return
                }

                set(state => ({
                  items: state.items.filter(item => item.id !== payload.old.id),
                  lastSync: Date.now()
                }))
              } catch (error) {
                console.error(`❌ Failed to process DELETE for ${tableName}:`, error)
              }
            },
            onStatusChange: (status, error) => {
              const isConnected = status === 'SUBSCRIBED'
              console.log(`${isConnected ? '🔗' : '🔌'} ${tableName} realtime ${status}`)

              set({
                isConnected,
                error: error ? `Realtime error: ${error.message}` : get().error
              })
            }
          })

        } catch (error) {
          console.error(`❌ Failed to initialize ${tableName} store:`, error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : `Σφάλμα σύνδεσης ${tableName}`
          })
        }
      },

      // Disconnect realtime using RealtimeManager
      disconnect: () => {
        console.log(`🔌 Disconnecting ${tableName} realtime`)
        realtimeManager.unsubscribe(tableName, storeId)
        set({
          isConnected: false,
          isInitialized: false
        })
      },

    // CRUD operations - EXACT same interface as baseStore
    addItem: async (itemData) => {
      try {
        set({ error: null })

        // Use existing service if provided, otherwise direct Supabase
        let result
        if (service && service.create) {
          result = await service.create(transformToDB(itemData))
        } else {
          const { data, error } = await supabase
            .from(tableName)
            .insert(transformToDB(itemData))
            .select()
            .single()

          if (error) throw error
          result = data
        }

        console.log(`✅ Added new ${tableName} item:`, result?.id)
        // Realtime will handle state update automatically

      } catch (error) {
        console.error(`❌ Failed to add ${tableName}:`, error)
        set({ error: error instanceof Error ? error.message : `Σφάλμα προσθήκης ${tableName}` })
        throw error
      }
    },

    updateItem: async (id, itemData) => {
      try {
        set({ error: null })

        // Use existing service if provided, otherwise direct Supabase
        if (service && service.update) {
          await service.update(id, transformToDB(itemData))
        } else {
          const { error } = await supabase
            .from(tableName)
            .update(transformToDB(itemData))
            .eq('id', id)

          if (error) throw error
        }

        console.log(`✅ Updated ${tableName} item:`, id)
        // Realtime will handle state update automatically

      } catch (error) {
        console.error(`❌ Failed to update ${tableName}:`, error)
        set({ error: error instanceof Error ? error.message : `Σφάλμα ενημέρωσης ${tableName}` })
        throw error
      }
    },

    deleteItem: async (id) => {
      try {
        set({ error: null })

        // Use existing service if provided, otherwise direct Supabase
        if (service && service.delete) {
          await service.delete(id)
        } else {
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id)

          if (error) throw error
        }

        console.log(`✅ Deleted ${tableName} item:`, id)
        // Realtime will handle state update automatically

      } catch (error) {
        console.error(`❌ Failed to delete ${tableName}:`, error)
        set({ error: error instanceof Error ? error.message : `Σφάλμα διαγραφής ${tableName}` })
        throw error
      }
    },

      // Utilities - EXACT same interface as baseStore
      getItem: (id) => get().items.find(item => item.id === id),
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading })
    }
  })
}

/**
 * Helper hook για easy migration από existing stores
 */
export function useRealtimeStore<T>(store: RealtimeStore<T>) {
  return store
}