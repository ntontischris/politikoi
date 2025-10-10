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
  pendingOperations: Set<string> // Track IDs of items being modified locally
  tempIdMap: Map<string, string> // Map temp IDs to real IDs for deduplication
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

    // Track pending operations to avoid race conditions
    const pendingOperations = new Set<string>()
    const tempIdMap = new Map<string, string>()

    return {
      // Initial state - EXACT same as baseStore
      items: [],
      isLoading: false,
      error: null,
      isConnected: false,
      lastSync: 0,
      isInitialized: false,
      pendingOperations,
      tempIdMap,

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
      initialize: async (forceReinit = false) => {
        const state = get()

        // Skip if already initialized (unless forcing reinit after connection loss)
        if (state.isInitialized && !forceReinit) {
          console.log(`✅ ${tableName} store: Already initialized (${state.items.length} items)`)
          return
        }

        if (state.isLoading) {
          console.log(`⏳ ${tableName} store: Already initializing, waiting...`)
          return
        }

        set({ isLoading: true, error: null })
        console.log(`🚀 ${tableName} store: ${forceReinit ? 'Re-initializing' : 'Initializing'}...`)

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
                const realId = newItem.id

                // Check if this is from our own operation (deduplication)
                if (pendingOperations.has(realId)) {
                  console.log(`⏭️ Skipping INSERT for ${realId} - operation in progress`)
                  return
                }

                // Check if we already have this item (by real ID)
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

                // Safe to add - this is from another client or initial load
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

                // Apply update immediately
                set(state => ({
                  items: state.items.map(item =>
                    item.id === realId ? updatedItem : item
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

                const deletedId = payload.old.id

                // Check if this is from our own operation
                if (pendingOperations.has(deletedId)) {
                  console.log(`⏭️ Skipping DELETE for ${deletedId} - operation in progress`)
                  return
                }

                // Apply delete
                set(state => ({
                  items: state.items.filter(item => item.id !== deletedId),
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

              // If disconnected unexpectedly, reset initialization and schedule reconnect
              if (!isConnected && (status === 'CLOSED' || status === 'CHANNEL_ERROR')) {
                console.log(`⚠️ ${tableName}: Connection lost, resetting initialization state`)
                set({ isInitialized: false })

                // Schedule automatic reconnection with exponential backoff
                let retryCount = 0
                const maxRetries = 3
                const attemptReconnect = () => {
                  if (retryCount >= maxRetries) {
                    console.log(`❌ ${tableName}: Max reconnection attempts reached`)
                    return
                  }

                  const delay = Math.min(1000 * Math.pow(2, retryCount), 10000) // 1s, 2s, 4s, max 10s
                  retryCount++

                  console.log(`🔄 ${tableName}: Reconnection attempt ${retryCount}/${maxRetries} in ${delay}ms`)
                  setTimeout(async () => {
                    if (!get().isConnected && !get().isInitialized) {
                      console.log(`🔄 ${tableName}: Attempting reconnection...`)
                      await get().initialize(true) // Force reinit

                      // If still not connected, try again
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
          console.error(`❌ Failed to initialize ${tableName} store:`, error)
          set({
            isLoading: false,
            isInitialized: false, // Reset on error
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
      // Generate temporary ID for optimistic update
      const tempId = `temp_${Date.now()}_${Math.random()}`
      const optimisticItem = {
        ...itemData,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as T

      try {
        set({ error: null })

        // OPTIMISTIC UPDATE: Add item immediately to UI
        set(state => ({
          items: [optimisticItem, ...state.items],
          lastSync: Date.now()
        }))

        console.log(`⚡ Optimistic add for ${tableName}:`, tempId)

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

        const realId = result.id
        console.log(`✅ Added new ${tableName} item:`, realId)

        // Track this operation to prevent duplicate from realtime
        pendingOperations.add(realId)
        tempIdMap.set(tempId, realId)

        // Replace optimistic item with real item
        const realItem = transformFromDB(result)
        set(state => ({
          items: state.items.map(item => item.id === tempId ? realItem : item),
          lastSync: Date.now()
        }))

        // Clear pending after short delay (realtime event should arrive by then)
        setTimeout(() => {
          pendingOperations.delete(realId)
          tempIdMap.delete(tempId)
          console.log(`🧹 Cleared pending operation for ${realId}`)
        }, 1000)

      } catch (error) {
        console.error(`❌ Failed to add ${tableName}:`, error)

        // ROLLBACK: Remove optimistic item on error
        set(state => ({
          items: state.items.filter(item => item.id !== tempId),
          error: error instanceof Error ? error.message : `Σφάλμα προσθήκης ${tableName}`
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

        console.log(`⚡ Optimistic update for ${tableName}:`, id)

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

        // Clear pending after short delay
        setTimeout(() => {
          pendingOperations.delete(id)
          console.log(`🧹 Cleared pending update for ${id}`)
        }, 500)

      } catch (error) {
        console.error(`❌ Failed to update ${tableName}:`, error)

        // ROLLBACK: Restore original item on error
        if (originalItem) {
          set(state => ({
            items: state.items.map(item => item.id === id ? originalItem : item),
            error: error instanceof Error ? error.message : `Σφάλμα ενημέρωσης ${tableName}`
          }))
        } else {
          set({ error: error instanceof Error ? error.message : `Σφάλμα ενημέρωσης ${tableName}` })
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

        console.log(`⚡ Optimistic delete for ${tableName}:`, id)

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

        // Clear pending after short delay
        setTimeout(() => {
          pendingOperations.delete(id)
          console.log(`🧹 Cleared pending delete for ${id}`)
        }, 500)

      } catch (error) {
        console.error(`❌ Failed to delete ${tableName}:`, error)

        // ROLLBACK: Restore item on error
        if (itemToDelete) {
          set(state => ({
            items: [itemToDelete, ...state.items],
            error: error instanceof Error ? error.message : `Σφάλμα διαγραφής ${tableName}`
          }))
        } else {
          set({ error: error instanceof Error ? error.message : `Σφάλμα διαγραφής ${tableName}` })
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
}

/**
 * Helper hook για easy migration από existing stores
 */
export function useRealtimeStore<T>(store: RealtimeStore<T>) {
  return store
}