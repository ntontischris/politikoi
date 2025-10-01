import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, loading, initialized, initialize } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (!initialized) {
      initialize()
    }
  }, [initialized, initialize])

  // Show loading while initializing or loading
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Φόρτωση...</p>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if admin access is required
  if (requireAdmin && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center max-w-md mx-auto mt-20">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Μη εξουσιοδοτημένη Πρόσβαση</h2>
          <p className="text-red-300 mb-4">Δεν έχετε τα απαραίτητα δικαιώματα για πρόσβαση σε αυτή τη σελίδα.</p>
          <button
            onClick={() => window.history.back()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Επιστροφή
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}