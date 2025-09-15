import { useState, useEffect, useRef } from 'react'
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { useNotifications } from '../../stores/notificationStore'
import { useNavigate } from 'react-router-dom'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen, loadNotifications])

  const getNotificationIcon = (type: string) => {
    const iconProps = { className: "w-4 h-4 flex-shrink-0" }

    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-4 h-4 flex-shrink-0 text-green-400" />
      case 'error':
        return <XCircle {...iconProps} className="w-4 h-4 flex-shrink-0 text-red-400" />
      case 'warning':
        return <AlertTriangle {...iconProps} className="w-4 h-4 flex-shrink-0 text-yellow-400" />
      case 'reminder':
        return <Clock {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-400" />
      default:
        return <Info {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-400" />
    }
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Τώρα'
    if (diffMinutes < 60) return `${diffMinutes}λ`
    if (diffHours < 24) return `${diffHours}ω`
    if (diffDays < 7) return `${diffDays}η`
    return date.toLocaleDateString('el-GR', { month: 'short', day: 'numeric' })
  }

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    // Navigate if there's an action URL
    if (notification.action_url) {
      navigate(notification.action_url)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Mobile overlay */}
      <div className="absolute inset-0 bg-black opacity-30 lg:hidden" onClick={onClose}></div>

      <div
        ref={dropdownRef}
        className="absolute top-0 left-0 right-0 lg:top-full lg:left-auto lg:right-0 lg:w-96 bg-slate-800 border border-slate-700 rounded-none lg:rounded-lg shadow-xl max-h-screen lg:max-h-96 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center">
            <Bell className="w-5 h-5 text-blue-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Ειδοποιήσεις</h3>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-slate-700 transition-colors"
                title="Σήμανση όλων ως αναγνωσμένα"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-slate-700 transition-colors lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-900/50 border-b border-red-800">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Φόρτωση...</p>
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Δεν υπάρχουν ειδοποιήσεις</p>
            </div>
          )}

          {!isLoading && notifications.length > 0 && (
            <div className="divide-y divide-slate-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-slate-700/50 transition-colors cursor-pointer group ${
                    !notification.is_read ? 'bg-slate-700/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.is_read ? 'text-white' : 'text-gray-200'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className={`text-sm mt-1 ${
                            !notification.is_read ? 'text-gray-300' : 'text-gray-400'
                          }`}>
                            {notification.message}
                          </p>
                        </div>

                        <div className="flex items-center space-x-1 ml-2">
                          <span className="text-xs text-gray-500">
                            {getTimeAgo(notification.created_at)}
                          </span>

                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex space-x-2">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300"
                            >
                              <Check className="w-3 h-3 inline mr-1" />
                              Σήμανση ως αναγνωσμένη
                            </button>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3 inline mr-1" />
                          Διαγραφή
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-slate-700 bg-slate-800/50">
            <button
              onClick={() => {
                navigate('/dashboard/notifications')
                onClose()
              }}
              className="w-full text-center text-sm text-blue-400 hover:text-blue-300 py-2 rounded-md hover:bg-slate-700/50 transition-colors"
            >
              Προβολή όλων των ειδοποιήσεων
            </button>
          </div>
        )}
      </div>
    </div>
  )
}