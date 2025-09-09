import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Settings as SettingsIcon, User, Bell, Shield, Database, Globe, Save, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export function Settings() {
  const { isAdmin, profile, loading } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    reports: true
  })

  // Redirect admins to AdminSettings
  if (!loading && isAdmin()) {
    return <Navigate to="/admin-settings" replace />
  }

  // Show loading while checking auth
  if (loading || !profile) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', name: 'Προφίλ', icon: User },
    { id: 'notifications', name: 'Ειδοποιήσεις', icon: Bell },
    { id: 'security', name: 'Ασφάλεια', icon: Shield },
    { id: 'system', name: 'Σύστημα', icon: Database },
    { id: 'general', name: 'Γενικά', icon: Globe }
  ]

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Στοιχεία Προφίλ</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Όνομα</label>
                <input 
                  type="text" 
                  defaultValue="Administrator"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input 
                  type="email" 
                  defaultValue="admin@system.gr"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Τηλέφωνο</label>
                <input 
                  type="tel" 
                  defaultValue="+30 210 1234567"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Τμήμα</label>
                <select className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="admin">Διοίκηση</option>
                  <option value="citizens">Πολίτες</option>
                  <option value="military">Στρατιωτικό</option>
                  <option value="support">Υποστήριξη</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center transition-colors duration-200">
                <Save className="h-4 w-4 mr-2" />
                Αποθήκευση Αλλαγών
              </button>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Ρυθμίσεις Ειδοποιήσεων</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <div>
                  <h4 className="text-white font-medium">Ειδοποιήσεις Email</h4>
                  <p className="text-gray-400 text-sm">Λήψη ειδοποιήσεων μέσω email</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('email')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.email ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.email ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <div>
                  <h4 className="text-white font-medium">Push Notifications</h4>
                  <p className="text-gray-400 text-sm">Ειδοποιήσεις στον browser</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('push')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.push ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.push ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <div>
                  <h4 className="text-white font-medium">SMS</h4>
                  <p className="text-gray-400 text-sm">Ειδοποιήσεις μέσω SMS</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('sms')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.sms ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.sms ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <div>
                  <h4 className="text-white font-medium">Αναφορές</h4>
                  <p className="text-gray-400 text-sm">Εβδομαδιαίες αναφορές δραστηριότητας</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('reports')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.reports ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.reports ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center transition-colors duration-200">
                <Save className="h-4 w-4 mr-2" />
                Αποθήκευση Ρυθμίσεων
              </button>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Ρυθμίσεις Ασφαλείας</h3>
            
            <div className="space-y-6">
              <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
                <h4 className="text-white font-medium mb-4">Αλλαγή Κωδικού</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Τρέχων Κωδικός</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Νέος Κωδικός</label>
                    <input 
                      type="password"
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Επιβεβαίωση Νέου Κωδικού</label>
                    <input 
                      type="password"
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
                <h4 className="text-white font-medium mb-4">Δικαιώματα Χρήστη</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Διαχείριση Πολιτών</span>
                    <span className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/30">Ενεργό</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Διαχείριση Στρατιωτικών</span>
                    <span className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/30">Ενεργό</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Διαχείριση Αιτημάτων</span>
                    <span className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/30">Ενεργό</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Ρυθμίσεις Συστήματος</span>
                    <span className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/30">Ενεργό</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center transition-colors duration-200">
                <Save className="h-4 w-4 mr-2" />
                Ενημέρωση Ασφαλείας
              </button>
            </div>
          </div>
        )

      case 'system':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Ρυθμίσεις Συστήματος</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
                <h4 className="text-white font-medium mb-4">Βάση Δεδομένων</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Κατάσταση</span>
                    <span className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/30">Συνδεδεμένη</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Τελευταίο Backup</span>
                    <span className="text-gray-400 text-sm">08/09/2024 03:00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Μέγεθος DB</span>
                    <span className="text-gray-400 text-sm">2.4 GB</span>
                  </div>
                </div>
                <button className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors">
                  Δημιουργία Backup
                </button>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
                <h4 className="text-white font-medium mb-4">Απόδοση</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">CPU Usage</span>
                    <span className="text-gray-400 text-sm">23%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Memory Usage</span>
                    <span className="text-gray-400 text-sm">512 MB / 2 GB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Disk Space</span>
                    <span className="text-gray-400 text-sm">45.2 GB / 100 GB</span>
                  </div>
                </div>
                <button className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors">
                  Καθαρισμός Cache
                </button>
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
              <h4 className="text-white font-medium mb-4">Logs & Παρακολούθηση</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors">
                  Προβολή Logs
                </button>
                <button className="bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors">
                  Εξαγωγή Αναφορών
                </button>
                <button className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors">
                  Καθαρισμός Logs
                </button>
              </div>
            </div>
          </div>
        )

      case 'general':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Γενικές Ρυθμίσεις</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Γλώσσα Συστήματος</label>
                <select className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="el">Ελληνικά</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ζώνη Ώρας</label>
                <select className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="Europe/Athens">Europe/Athens (GMT+2)</option>
                  <option value="Europe/London">Europe/London (GMT+0)</option>
                  <option value="America/New_York">America/New_York (GMT-5)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Μορφή Ημερομηνίας</label>
                <select className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                  <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                  <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
                <h4 className="text-white font-medium mb-4">Θέμα Εφαρμογής</h4>
                <div className="grid grid-cols-3 gap-4">
                  <button className="p-4 bg-slate-800 border-2 border-blue-500 rounded-lg">
                    <div className="w-full h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded mb-2"></div>
                    <span className="text-white text-sm">Σκοτεινό</span>
                  </button>
                  <button className="p-4 bg-white border-2 border-gray-300 rounded-lg">
                    <div className="w-full h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2"></div>
                    <span className="text-gray-800 text-sm">Ανοιχτό</span>
                  </button>
                  <button className="p-4 bg-slate-800 border-2 border-gray-600 rounded-lg">
                    <div className="w-full h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded mb-2"></div>
                    <span className="text-white text-sm">Αυτόματο</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center transition-colors duration-200">
                <Save className="h-4 w-4 mr-2" />
                Αποθήκευση Ρυθμίσεων
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <SettingsIcon className="h-8 w-8 mr-3 text-blue-400" />
          Ρυθμίσεις
        </h1>
        <p className="text-gray-400">
          Διαχείριση ρυθμίσεων συστήματος και προφίλ χρήστη
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}