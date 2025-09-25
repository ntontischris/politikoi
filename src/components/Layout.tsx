import { useState, useEffect, useRef, useCallback } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
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
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useUnreadCount, startNotificationRefresh, stopNotificationRefresh } from '../stores/notificationStore'
import { NotificationDropdown } from './notifications/NotificationDropdown'
import { useResponsive, useTouchDevice } from '../hooks/useResponsive'

export function Layout() {
  const { profile, signOut, isAdmin } = useAuthStore()
  const location = useLocation()
  const { isMobile, isTablet, isDesktop } = useResponsive()
  const { isTouchDevice, hasHover } = useTouchDevice()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const unreadCount = useUnreadCount()

  // Start notification refresh when component mounts
  useEffect(() => {
    startNotificationRefresh()
    return () => stopNotificationRefresh()
  }, [])

  // Auto-close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (sidebarOpen) setSidebarOpen(false)
        if (notificationsOpen) setNotificationsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen, notificationsOpen])

  // Touch gesture handling for sidebar
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isTouchDevice || !isMobile) return

    const touchX = e.touches[0].clientX
    const touchY = e.touches[0].clientY

    // Swipe from left edge to open sidebar
    if (touchX < 20 && !sidebarOpen) {
      let startX = touchX

      const handleTouchMove = (e: TouchEvent) => {
        const currentX = e.touches[0].clientX
        if (currentX - startX > 50) {
          setSidebarOpen(true)
          document.removeEventListener('touchmove', handleTouchMove)
          document.removeEventListener('touchend', handleTouchEnd)
        }
      }

      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }

      document.addEventListener('touchmove', handleTouchMove, { passive: true })
      document.addEventListener('touchend', handleTouchEnd)
    }
  }, [isTouchDevice, isMobile, sidebarOpen])

  useEffect(() => {
    if (isTouchDevice && isMobile) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true })
      return () => document.removeEventListener('touchstart', handleTouchStart)
    }
  }, [handleTouchStart, isTouchDevice, isMobile])

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'text-blue-400' },
    { name: 'Πολίτες', href: '/dashboard/citizens', icon: Users, color: 'text-green-400' },
    { name: 'Αιτήματα', href: '/dashboard/requests', icon: FileText, color: 'text-orange-400' },
    { name: 'Αναφορές', href: '/dashboard/reports', icon: BarChart3, color: 'text-purple-400' },
    ...(isAdmin()
      ? [{ name: 'Διαχείριση', href: '/dashboard/settings', icon: Settings, color: 'text-red-400' }]
      : []
    ),
  ]

  const handleLogout = async () => {
    await signOut()
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex safe-y">
      {/* Enhanced Mobile sidebar overlay with backdrop blur */}
      {sidebarOpen && isMobile && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-40 lg:hidden"
          onClick={closeSidebar}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"></div>
        </div>
      )}

      {/* Enhanced Sidebar with improved mobile support */}
      <aside
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-out
          ${isMobile
            ? `w-full max-w-sm ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : isTablet
            ? `w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `w-64 ${sidebarCollapsed ? 'w-16' : 'w-64'} translate-x-0`
          }
          lg:relative lg:translate-x-0 bg-slate-800/95 backdrop-blur-lg border-r border-slate-700/50
          ${isMobile ? 'shadow-2xl' : ''}
        `}
      >
        <div className="flex flex-col h-full safe-y">
          {/* Enhanced Logo Section */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/50">
            <div className={`flex items-center min-w-0 ${sidebarCollapsed && !isMobile ? 'justify-center' : 'flex-1'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Shield className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              {(!sidebarCollapsed || isMobile) && (
                <div className="ml-3 min-w-0">
                  <span className="text-white font-bold text-lg truncate block">#oliipoligoli</span>
                  <span className="text-gray-400 text-xs truncate block">Διαχείριση Πολιτών</span>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            {isMobile && (
              <button
                onClick={closeSidebar}
                className="text-gray-400 hover:text-white touch-target-lg flex items-center justify-center flex-shrink-0 ml-2 transition-colors rounded-lg hover:bg-slate-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Desktop collapse button */}
            {isDesktop && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-400 hover:text-white touch-target flex items-center justify-center flex-shrink-0 ml-2 transition-colors rounded-lg hover:bg-slate-700/50"
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto scroll-smooth-mobile">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group relative flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 touch-target-lg ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-300 hover:bg-slate-700/70 hover:text-white'
                  } ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}`
                }
                onClick={isMobile ? closeSidebar : undefined}
                title={sidebarCollapsed && !isMobile ? item.name : undefined}
              >
                <item.icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    sidebarCollapsed && !isMobile ? '' : 'mr-3'
                  } ${item.color}`}
                />
                {(!sidebarCollapsed || isMobile) && (
                  <span className="truncate">{item.name}</span>
                )}
                {/* Active indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-r transition-opacity ${
                  location.pathname === item.href ? 'opacity-100' : 'opacity-0'
                }`} />
              </NavLink>
            ))}
          </nav>

          {/* Enhanced User Section */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
            <div className={`flex items-center ${sidebarCollapsed && !isMobile ? 'justify-center' : 'mb-4'}`}>
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white text-sm font-bold">
                    {profile?.full_name?.charAt(0) || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-slate-800 rounded-full"></div>
              </div>

              {(!sidebarCollapsed || isMobile) && (
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">
                    {profile?.full_name || 'Χρήστης'}
                  </p>
                  <p className="text-gray-400 text-xs truncate">{profile?.email}</p>
                  {isAdmin() && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </div>
              )}
            </div>

            {(!sidebarCollapsed || isMobile) && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-3 text-gray-300 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 text-sm font-medium touch-target-lg border border-transparent hover:border-red-500/30"
              >
                <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
                <span className="truncate">Αποσύνδεση</span>
              </button>
            )}

            {sidebarCollapsed && !isMobile && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-3 text-gray-300 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 touch-target-lg border border-transparent hover:border-red-500/30"
                title="Αποσύνδεση"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content with enhanced mobile support */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Enhanced Top header */}
        <header className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700/50 px-4 sm:px-6 py-3 sm:py-4 safe-x sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <button
                onClick={toggleSidebar}
                className="lg:hidden text-gray-400 hover:text-white mr-3 touch-target-lg flex items-center justify-center transition-colors rounded-lg hover:bg-slate-700/50"
                aria-label="Toggle menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Enhanced Global search */}
              <div className="relative flex-1 max-w-sm md:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={isMobile ? "Αναζήτηση..." : "Αναζήτηση πολιτών, αιτημάτων..."}
                  className="w-full bg-slate-700/70 border border-slate-600/50 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-700 transition-colors placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 ml-4">
              {/* Enhanced Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative text-gray-400 hover:text-white touch-target-lg flex items-center justify-center transition-colors rounded-lg hover:bg-slate-700/50 p-2"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                <NotificationDropdown
                  isOpen={notificationsOpen}
                  onClose={() => setNotificationsOpen(false)}
                />
              </div>

              {/* Enhanced Date/time display - hidden on very small screens */}
              {!isMobile && (
                <div className="text-right">
                  <p className="text-white text-sm font-medium">
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
              )}
            </div>
          </div>
        </header>

        {/* Enhanced Page content */}
        <main className="flex-1 bg-slate-900 overflow-x-hidden safe-x">
          <div className="w-full min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}