import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Citizens } from './pages/Citizens'
import { Military } from './pages/Military'
import { MilitaryEsso } from './pages/MilitaryEsso'
import { Requests } from './pages/Requests'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'

function App() {
  return (
    <Router>
      <div className="dark">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="citizens" element={<Citizens />} />
            <Route path="military" element={<Military />} />
            <Route path="military-esso" element={<MilitaryEsso />} />
            <Route path="requests" element={<Requests />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
