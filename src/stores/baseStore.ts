import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Advanced Cache Configuration
interface CacheConfig {
  ttl: number // Time to live in milliseconds
  maxItems: number // Maximum items in cache
  invalidateOnMutation: boolean // Clear cache on CRUD operations
  backgroundSync: boolean // Sync in background
}

interface CacheItem<T> {
  data: T[]
  timestamp: number
  version: number
}

interface BaseStoreState<T> {
  items: T[]
  isLoading: boolean
  error: string | null
  lastSync: number
  cacheVersion: number
}

interface BaseStoreActions<T, TInput, TService> {
  // Core CRUD operations
  loadItems: () => Promise<void>
  addItem: (item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateItem: (id: string, item: Partial<T>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  
  // Cache management
  invalidateCache: () => void
  refreshFromDatabase: () => Promise<void>
  
  // Utilities
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  getItem: (id: string) => T | undefined
}

type BaseStore<T, TInput, TService> = BaseStoreState<T> & BaseStoreActions<T, TInput, TService>

export interface SmartCacheOptions<T> {
  storeName: string
  cacheConfig: CacheConfig
  service: any
  transformFromDB: (dbItem: any) => T
  transformToDB: (item: Partial<T>) => any
}

export function createSmartStore<T extends { id: string }, TInput, TService>(
  options: SmartCacheOptions<T>
) {
  const {
    storeName,
    cacheConfig,
    service,
    transformFromDB,
    transformToDB
  } = options

  // Smart Cache Manager
  class SmartCacheManager {
    private cacheKey = `${storeName}-cache`
    private metaKey = `${storeName}-meta`

    isCacheValid(): boolean {
      try {
        const metaStr = localStorage.getItem(this.metaKey)
        if (!metaStr) return false
        
        const meta = JSON.parse(metaStr)
        const now = Date.now()
        
        return (now - meta.timestamp) < cacheConfig.ttl
      } catch {
        return false
      }
    }

    getFromCache(): T[] | null {
      try {
        if (!this.isCacheValid()) return null
        
        const cacheStr = localStorage.getItem(this.cacheKey)
        if (!cacheStr) return null
        
        const cache: CacheItem<T> = JSON.parse(cacheStr)
        return cache.data
      } catch {
        return null
      }
    }

    saveToCache(data: T[]): void {
      try {
        const cacheItem: CacheItem<T> = {
          data,
          timestamp: Date.now(),
          version: Date.now() // Simple versioning
        }

        // Limit cache size
        if (data.length > cacheConfig.maxItems) {
          cacheItem.data = data.slice(0, cacheConfig.maxItems)
        }

        localStorage.setItem(this.cacheKey, JSON.stringify(cacheItem))
        localStorage.setItem(this.metaKey, JSON.stringify({
          timestamp: cacheItem.timestamp,
          version: cacheItem.version,
          itemCount: cacheItem.data.length
        }))

        console.log(`💾 Cached ${cacheItem.data.length} items for ${storeName}`)
      } catch (error) {
        console.warn(`Failed to cache ${storeName}:`, error)
      }
    }

    invalidateCache(): void {
      localStorage.removeItem(this.cacheKey)
      localStorage.removeItem(this.metaKey)
      console.log(`🗑️ Cache invalidated for ${storeName}`)
    }

    getCacheStats() {
      const metaStr = localStorage.getItem(this.metaKey)
      if (!metaStr) return null
      
      try {
        const meta = JSON.parse(metaStr)
        return {
          isValid: this.isCacheValid(),
          itemCount: meta.itemCount,
          age: Date.now() - meta.timestamp,
          version: meta.version
        }
      } catch {
        return null
      }
    }
  }

  const cacheManager = new SmartCacheManager()

  return create<BaseStore<T, TInput, TService>>()(
    persist(
      (set, get) => ({
        // State
        items: [],
        isLoading: false,
        error: null,
        lastSync: 0,
        cacheVersion: 0,

        // Smart Load with Cache-First Strategy
        loadItems: async () => {
          try {
            // Start loading state
            set({ isLoading: true, error: null })
            
            // 1. Try cache first for instant loading
            const cachedItems = cacheManager.getFromCache()
            if (cachedItems && cachedItems.length > 0) {
              console.log(`⚡ Loading ${cachedItems.length} items from cache for ${storeName}`)
              set({ 
                items: cachedItems, 
                isLoading: false,
                error: null 
              })
              
              // If cache is still fresh, don't hit the database
              if (cacheManager.isCacheValid()) {
                return
              }
              
              // If cache is stale, set loading to update in background
              set({ isLoading: true })
            }

            // 2. Load from database
            const dbItems = await service.getAll()
            const transformedItems = dbItems.map(transformFromDB)
            
            // 3. Update state and cache
            set({ 
              items: transformedItems, 
              isLoading: false,
              lastSync: Date.now(),
              cacheVersion: Date.now()
            })
            
            // 4. Save to cache for next time
            cacheManager.saveToCache(transformedItems)
            
            console.log(`🔄 Loaded ${transformedItems.length} items from database for ${storeName}`)

          } catch (error) {
            console.error(`❌ Failed to load ${storeName}:`, error)
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : `Σφάλμα κατά τη φόρτωση ${storeName}`
            })
          }
        },

        // Smart Add with Optimistic Updates
        addItem: async (itemData) => {
          set({ isLoading: true, error: null })
          
          try {
            // 1. Transform and create in database
            const dbInput = transformToDB(itemData)
            const newDBItem = await service.create(dbInput)
            const newItem = transformFromDB(newDBItem)
            
            // 2. Optimistic update to state
            set(state => ({
              items: [newItem, ...state.items],
              isLoading: false
            }))
            
            // 3. Invalidate cache if configured
            if (cacheConfig.invalidateOnMutation) {
              cacheManager.invalidateCache()
            } else {
              // Update cache with new item
              const currentItems = get().items
              cacheManager.saveToCache(currentItems)
            }
            
            console.log(`✅ Added new ${storeName} item:`, newItem.id)

          } catch (error) {
            console.error(`❌ Failed to add ${storeName}:`, error)
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : `Σφάλμα κατά την προσθήκη ${storeName}`
            })
            throw error
          }
        },

        // Smart Update with Optimistic Updates
        updateItem: async (id, itemData) => {
          set({ isLoading: true, error: null })
          
          try {
            // 1. Update in database
            const dbInput = transformToDB(itemData)
            const updatedDBItem = await service.update(id, dbInput)
            const updatedItem = transformFromDB(updatedDBItem)
            
            // 2. Optimistic update to state
            set(state => ({
              items: state.items.map(item =>
                item.id === id ? updatedItem : item
              ),
              isLoading: false
            }))
            
            // 3. Update cache
            if (cacheConfig.invalidateOnMutation) {
              cacheManager.invalidateCache()
            } else {
              const currentItems = get().items
              cacheManager.saveToCache(currentItems)
            }
            
            console.log(`📝 Updated ${storeName} item:`, id)

          } catch (error) {
            console.error(`❌ Failed to update ${storeName}:`, error)
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : `Σφάλμα κατά την ενημέρωση ${storeName}`
            })
            throw error
          }
        },

        // Smart Delete with Optimistic Updates
        deleteItem: async (id) => {
          set({ isLoading: true, error: null })
          
          try {
            // 1. Delete from database
            await service.delete(id)
            
            // 2. Optimistic update to state
            set(state => ({
              items: state.items.filter(item => item.id !== id),
              isLoading: false
            }))
            
            // 3. Update cache
            if (cacheConfig.invalidateOnMutation) {
              cacheManager.invalidateCache()
            } else {
              const currentItems = get().items
              cacheManager.saveToCache(currentItems)
            }
            
            console.log(`🗑️ Deleted ${storeName} item:`, id)

          } catch (error) {
            console.error(`❌ Failed to delete ${storeName}:`, error)
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : `Σφάλμα κατά τη διαγραφή ${storeName}`
            })
            throw error
          }
        },

        // Cache Management
        invalidateCache: () => {
          cacheManager.invalidateCache()
          console.log(`🔄 Cache invalidated for ${storeName}`)
        },

        refreshFromDatabase: async () => {
          cacheManager.invalidateCache()
          await get().loadItems()
        },

        // Utilities
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        getItem: (id) => get().items.find(item => item.id === id)
      }),
      {
        name: `${storeName}-storage`,
        partialize: (state) => ({ 
          items: state.items,
          lastSync: state.lastSync,
          cacheVersion: state.cacheVersion
        })
      }
    )
  )
}

// Default cache configurations for different types of data
export const CacheProfiles = {
  // For frequently changing data (citizens, requests)
  DYNAMIC: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxItems: 1000,
    invalidateOnMutation: false,
    backgroundSync: true
  } as CacheConfig,
  
  // For moderately changing data (military personnel)
  MODERATE: {
    ttl: 15 * 60 * 1000, // 15 minutes
    maxItems: 500,
    invalidateOnMutation: false,
    backgroundSync: true
  } as CacheConfig,
  
  // For rarely changing data (settings, configurations)
  STATIC: {
    ttl: 60 * 60 * 1000, // 1 hour
    maxItems: 100,
    invalidateOnMutation: true,
    backgroundSync: false
  } as CacheConfig
}