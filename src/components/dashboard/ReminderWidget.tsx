import React, { useState, useEffect } from 'react'
import { Bell, Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react'
import { useReminderStore, type Reminder } from '../../stores/reminderStore'

const typeColors = {
  'ΕΟΡΤΗ': 'text-purple-400',
  'ΑΙΤΗΜΑ': 'text-blue-400',
  'ΓΕΝΙΚΗ': 'text-green-400'
}

const typeLabels = {
  'ΕΟΡΤΗ': 'Εορτή',
  'ΑΙΤΗΜΑ': 'Αίτημα',
  'ΓΕΝΙΚΗ': 'Γενική'
}


export const ReminderWidget: React.FC = () => {
  const { 
    reminders,
    loadReminders,
    markAsCompleted,
    getStats,
    isLoading
  } = useReminderStore()
  
  const [activeTab, setActiveTab] = useState<'overdue' | 'upcoming'>('overdue')
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, upcoming: 0, byType: {} })
  
  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadReminders()
        const statsData = getStats()
        setStats(statsData)
      } catch (error) {
        console.error('Error loading reminders:', error)
      }
    }
    loadData()
  }, [])
  
  // Filter reminders manually since we removed the specific filter functions
  const getOverdueReminders = () => {
    const now = new Date()
    now.setHours(23, 59, 59, 999)
    
    return reminders.filter(reminder => {
      if (reminder.is_completed) return false
      const reminderDate = new Date(reminder.reminder_date)
      return reminderDate < now
    }).sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime())
  }
  
  const getUpcomingRemindersLocal = () => {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))
    
    return reminders.filter(reminder => {
      if (reminder.is_completed) return false
      const reminderDate = new Date(reminder.reminder_date)
      return reminderDate >= now && reminderDate <= nextWeek
    }).sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime())
  }
  
  const overdueReminders = getOverdueReminders()
  const upcomingReminders = getUpcomingRemindersLocal()

  const handleMarkCompleted = async (reminder: Reminder) => {
    try {
      await markAsCompleted(reminder.id)
      // Refresh stats after completing a reminder
      const statsData = getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Σφάλμα κατά την ολοκλήρωση:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'short'
    })
  }

  const getTimeStatus = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays < 0) return `${Math.abs(diffInDays)} μέρες καθυστέρηση`
    if (diffInDays === 0) return 'Σήμερα'
    if (diffInDays === 1) return 'Αύριο'
    return `Σε ${diffInDays} μέρες`
  }

  const ReminderItem: React.FC<{ reminder: Reminder }> = ({ reminder }) => {
    return (
      <div className="p-3 bg-slate-700/30 border border-slate-600 rounded-lg hover:bg-slate-700/50 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-white text-sm mb-1">{reminder.title}</h4>
            {reminder.description && (
              <p className="text-slate-300 text-xs mb-2">{reminder.description}</p>
            )}
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-blue-400" />
                <span className="text-slate-400">{formatDate(reminder.reminder_date)}</span>
              </div>
              <span className={`font-medium ${typeColors[reminder.reminder_type]}`}>
                {typeLabels[reminder.reminder_type]}
              </span>
              <span className="text-slate-500">
                {getTimeStatus(reminder.reminder_date)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            {!reminder.is_completed && (
              <button
                onClick={() => handleMarkCompleted(reminder)}
                className="p-1 text-green-400 hover:text-green-300 hover:bg-slate-600 rounded transition-colors"
                title="Ολοκληρώθηκε"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-slate-400">Φόρτωση υπενθυμίσεων...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Bell className="w-5 h-5 text-blue-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Υπενθυμίσεις</h3>
          {(overdueReminders.length > 0 || upcomingReminders.length > 0) && (
            <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full border border-red-500/30">
              {overdueReminders.length + upcomingReminders.length}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-slate-700/30 border border-slate-600 rounded-lg">
          <div className="text-lg font-semibold text-red-400">{overdueReminders.length}</div>
          <div className="text-sm text-slate-400">Καθυστέρηση</div>
        </div>
        <div className="p-3 bg-slate-700/30 border border-slate-600 rounded-lg">
          <div className="text-lg font-semibold text-yellow-400">{stats.upcoming}</div>
          <div className="text-sm text-slate-400">Επερχόμενες</div>
        </div>
        <div className="p-3 bg-slate-700/30 border border-slate-600 rounded-lg">
          <div className="text-lg font-semibold text-blue-400">{stats.pending}</div>
          <div className="text-sm text-slate-400">Εκκρεμείς</div>
        </div>
        <div className="p-3 bg-slate-700/30 border border-slate-600 rounded-lg">
          <div className="text-lg font-semibold text-green-400">{stats.completed}</div>
          <div className="text-sm text-slate-400">Ολοκληρωμένες</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4">
        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'overdue'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Καθυστέρηση ({overdueReminders.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Επερχόμενες ({upcomingReminders.length})
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activeTab === 'overdue' && (
          <>
            {overdueReminders.length === 0 ? (
              <div className="text-center py-6">
                <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Δεν υπάρχουν καθυστερημένες υπενθυμίσεις</p>
              </div>
            ) : (
              overdueReminders.map(reminder => (
                <ReminderItem key={reminder.id} reminder={reminder} />
              ))
            )}
          </>
        )}

        {activeTab === 'upcoming' && (
          <>
            {upcomingReminders.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Δεν υπάρχουν επερχόμενες υπενθυμίσεις</p>
              </div>
            ) : (
              upcomingReminders.map(reminder => (
                <ReminderItem key={reminder.id} reminder={reminder} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}