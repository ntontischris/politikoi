import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import App from '../App'

/**
 * OPTIMIZED AppWrapper
 *
 * Removed DataPreloader - stores now use lazy initialization με RealtimeManager
 * Πολύ πιο γρήγορο startup και όχι duplicate loading
 */
export function AppWrapper() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return <App />
}