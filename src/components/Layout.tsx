import { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
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
import { useAuthStore } from '../stores/authStore'
import { useUnreadCount, startNotificationRefresh, stopNotificationRefresh } from '../stores/notificationStore'
import { NotificationDropdown } from './notifications/NotificationDropdown'

export function Layout() {
  const { profile, signOut, isAdmin } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const unreadCount = useUnreadCount()

  // Start notification refresh when component mounts
  useEffect(() => {
    startNotificationRefresh()
    return () => stopNotificationRefresh()
  }, [])

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Πολίτες', href: '/dashboard/citizens', icon: Users },
    // Military-specific pages are now integrated into Citizens page with filtering
    // { name: 'Στρατιωτικό', href: '/dashboard/military', icon: Shield },
    // { name: 'ΕΣΣΟ Σύστημα', href: '/dashboard/military-esso', icon: Shield },
    { name: 'Αιτήματα', href: '/dashboard/requests', icon: FileText },
    { name: 'Αναφορές', href: '/dashboard/reports', icon: BarChart3 },
    ...(isAdmin() 
      ? [{ name: 'Διαχείριση', href: '/dashboard/settings', icon: Settings }]
      : []
    ),
  ]

  const handleLogout = async () => {
    await signOut()
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
        fixed inset-y-0 left-0 z-50 w-64 sm:w-72 lg:w-64 transform transition-transform duration-300 ease-in-out 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 bg-slate-800 border-r border-slate-700
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-white font-bold text-lg sm:text-xl truncate">#oliipoligoli</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white touch-target flex items-center justify-center flex-shrink-0 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 touch-target ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* User info & logout */}
          <div className="p-3 sm:p-4 border-t border-slate-700">
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">
                  {profile?.full_name?.charAt(0) || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">
                  {profile?.full_name || 'Χρήστης'}
                </p>
                <p className="text-gray-400 text-xs truncate">{profile?.email}</p>
                {isAdmin() && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                    Admin
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2.5 text-gray-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium touch-target"
            >
              <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
              <span className="truncate">Αποσύνδεση</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white mr-3 sm:mr-4 touch-target flex items-center justify-center"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              {/* Global search - responsive */}
              <div className="relative flex-1 max-w-sm md:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Αναζήτηση..."
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 ml-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative text-gray-400 hover:text-white touch-target flex items-center justify-center transition-colors"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[12px] h-3 sm:min-w-[16px] sm:h-4 bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                <NotificationDropdown
                  isOpen={notificationsOpen}
                  onClose={() => setNotificationsOpen(false)}
                />
              </div>

              {/* Current date/time - responsive */}
              <div className="text-right">
                <p className="text-white text-xs sm:text-sm font-medium">
                  {new Date().toLocaleDateString('el-GR', {
                    weekday: 'short',
                    month: 'short',
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
        <main className="flex-1 bg-slate-900 overflow-x-hidden">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}