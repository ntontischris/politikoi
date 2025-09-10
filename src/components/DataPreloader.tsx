import { useEffect, useState } from 'react'
import { useCitizenStore } from '../stores/citizenStore'
import { useRequestStore } from '../stores/requestStore'
import { useMilitaryStore } from '../stores/militaryStore'

interface DataPreloaderProps {
  children: React.ReactNode
}

export function DataPreloader({ children }: DataPreloaderProps) {
  const [isInitializing, setIsInitializing] = useState(true)
  const citizenStore = useCitizenStore()
  const requestStore = useRequestStore()
  const militaryStore = useMilitaryStore()

  useEffect(() => {
    let mounted = true

    const initializeData = async () => {
      console.log('🚀 DataPreloader: Starting initialization...')
      
      // Check if we already have data in stores
      const hasData = citizenStore.items.length > 0 || 
                     requestStore.items.length > 0 || 
                     militaryStore.items.length > 0

      console.log('📊 Has cached data:', hasData)

      if (hasData) {
        // We have cached data, show the app immediately
        console.log('⚡ Using cached data, showing app immediately')
        setIsInitializing(false)
        
        // Load fresh data in the background
        Promise.allSettled([
          citizenStore.loadItems(),
          requestStore.loadItems(),
          militaryStore.loadItems()
        ]).catch(error => {
          console.error('Background data refresh error:', error)
        })
      } else {
        // No cached data, load before showing the app
        console.log('📡 No cached data, loading fresh data...')
        try {
          // Set timeout to prevent infinite loading
          const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Data loading timeout')), 15000)
          )
          
          const loadingPromise = Promise.allSettled([
            citizenStore.loadItems(),
            requestStore.loadItems(),
            militaryStore.loadItems()
          ])
          
          await Promise.race([loadingPromise, timeout])
          console.log('✅ Initial data load completed')
        } catch (error) {
          console.error('Initial data load error:', error)
          // Continue anyway - better to show app with errors than infinite loading
        } finally {
          if (mounted) {
            setIsInitializing(false)
          }
        }
      }
    }

    initializeData()

    return () => {
      mounted = false
    }
  }, [])

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-400">Φόρτωση εφαρμογής...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}