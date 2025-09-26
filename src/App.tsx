import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuthStore } from './stores/authStore'

// Lazy load components to reduce initial bundle size
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })))
const Citizens = lazy(() => import('./pages/Citizens').then(module => ({ default: module.Citizens })))
const Requests = lazy(() => import('./pages/Requests').then(module => ({ default: module.Requests })))
const Reports = lazy(() => import('./pages/Reports').then(module => ({ default: module.Reports })))
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })))
const AdminSettings = lazy(() => import('./pages/AdminSettings').then(module => ({ default: module.AdminSettings })))
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })))

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400">Φόρτωση...</p>
    </div>
  </div>
)

function App() {
  const { initialize, initialized } = useAuthStore()

  useEffect(() => {
    if (!initialized) {
      initialize()
    }
  }, [initialize, initialized])

  return (
    <Router>
      <div className="dark">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Temporary testing route without auth */}
            <Route path="/test-requests" element={
              <div className="min-h-screen bg-slate-900 text-white p-8">
                <Requests />
              </div>
            } />
          
          {/* Protected routes with layout */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/citizens" element={<Citizens />} />
            {/* Military routes are now integrated into Citizens page */}
            {/* <Route path="/dashboard/military" element={<Military />} />
            <Route path="/dashboard/military-esso" element={<MilitaryEsso />} /> */}
            <Route path="/dashboard/requests" element={<Requests />} />
            <Route path="/dashboard/reports" element={<Reports />} />
            <Route path="/dashboard/settings" element={
              <ProtectedRoute requireAdmin>
                <Settings />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Admin-only routes */}
          <Route path="/admin-settings" element={
            <ProtectedRoute requireAdmin>
              <AdminSettings />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  )
}

export default App
