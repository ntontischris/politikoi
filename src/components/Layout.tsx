import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { 
  Home, 
  Users, 
  Shield, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  BarChart3
} from 'lucide-react'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Πολίτες', href: '/citizens', icon: Users },
    { name: 'Στρατιωτικό', href: '/military', icon: Shield },
    { name: 'ΕΣΣΟ Σύστημα', href: '/military-esso', icon: Shield },
    { name: 'Αιτήματα', href: '/requests', icon: FileText },
    { name: 'Αναφορές', href: '/reports', icon: BarChart3 },
    { name: 'Ρυθμίσεις', href: '/settings', icon: Settings },
  ]

  const handleLogout = () => {
    console.log('Logout clicked')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 bg-slate-800 border-r border-slate-700
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-white font-bold text-xl">CitizenManager</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User info & logout */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">AD</span>
              </div>
              <div className="ml-3">
                <p className="text-white text-sm font-medium">Administrator</p>
                <p className="text-gray-400 text-xs">admin@system.gr</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-gray-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Αποσύνδεση
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white mr-4"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Global search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Γενική αναζήτηση..."
                  className="bg-slate-700 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-2 w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative text-gray-400 hover:text-white">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Current date/time */}
              <div className="hidden md:block text-right">
                <p className="text-white text-sm font-medium">
                  {new Date().toLocaleDateString('el-GR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-gray-400 text-xs">
                  {new Date().toLocaleTimeString('el-GR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  )
}