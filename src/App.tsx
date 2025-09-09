import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { Citizens } from './pages/Citizens'
import { Military } from './pages/Military'
import { MilitaryEsso } from './pages/MilitaryEsso'
import { Requests } from './pages/Requests'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { LoginPage } from './pages/LoginPage'
import { AdminSettings } from './pages/AdminSettings'
import { LandingPage } from './pages/LandingPage'

function App() {
  return (
    <Router>
      <div className="dark">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes with layout */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/citizens" element={<Citizens />} />
            <Route path="/dashboard/military" element={<Military />} />
            <Route path="/dashboard/military-esso" element={<MilitaryEsso />} />
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
      </div>
    </Router>
  )
}

export default App
