import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { DataPreloader } from './DataPreloader'
import App from '../App'

export function AppWrapper() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <DataPreloader>
      <App />
    </DataPreloader>
  )
}