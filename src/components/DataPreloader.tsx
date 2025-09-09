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
      // Check if we already have data in stores (from persistence)
      const hasData = citizenStore.citizens.length > 0 || 
                     requestStore.requests.length > 0 || 
                     militaryStore.militaryPersonnel.length > 0

      if (hasData) {
        // We have cached data, show the app immediately
        setIsInitializing(false)
        
        // Load fresh data in the background
        Promise.allSettled([
          citizenStore.loadCitizens(),
          requestStore.loadRequests(),
          militaryStore.loadMilitaryPersonnel()
        ]).catch(error => {
          console.error('Background data refresh error:', error)
        })
      } else {
        // No cached data, load before showing the app
        try {
          await Promise.allSettled([
            citizenStore.loadCitizens(),
            requestStore.loadRequests(),
            militaryStore.loadMilitaryPersonnel()
          ])
        } catch (error) {
          console.error('Initial data load error:', error)
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