import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Activity, FileText, Plus, Trash2, ToggleLeft, ToggleRight, Edit3, Search, Filter, Calendar, ArrowLeft } from 'lucide-react'
import { authService } from '../services/authService'
import type { UserProfile, UserSession, AuditLogEntry } from '../services/authService'

interface CreateUserFormData {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'user'
}

export function AdminSettings() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'users' | 'sessions' | 'audit'>('users')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // User management states
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [createUserLoading, setCreateUserLoading] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [createUserForm, setCreateUserForm] = useState<CreateUserFormData>({
    email: '',
    password: '',
    full_name: '',
    role: 'user'
  })

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')

  useEffect(() => {
    loadData()
  }, [activeTab])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      switch (activeTab) {
        case 'users':
          const usersData = await authService.getAllUsers()
          setUsers(usersData)
          break
        case 'sessions':
          const sessionsData = await authService.getActiveSessions()
          setSessions(sessionsData)
          break
        case 'audit':
          const auditData = await authService.getAuditLogs(50)
          setAuditLogs(auditData)
          break
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Σφάλμα φόρτωσης δεδομένων')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateUserLoading(true)
    setError(null)

    try {
      const { error: createError } = await authService.createUser(createUserForm)
      
      if (createError) {
        setError(`Σφάλμα δημιουργίας χρήστη: ${createError.message}`)
        return
      }

      setSuccess('Ο χρήστης δημιουργήθηκε επιτυχώς!')
      setShowCreateUser(false)
      setCreateUserForm({
        email: '',
        password: '',
        full_name: '',
        role: 'user'
      })
      
      // Refresh users list with delay to ensure database update
      setTimeout(() => {
        loadData()
      }, 1000)
      
    } catch (err) {
      console.error('Error creating user:', err)
      setError('Σφάλμα δημιουργίας χρήστη')
    } finally {
      setCreateUserLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Είστε σίγουροι ότι θέλετε να διαγράψετε τον χρήστη ${userEmail};`)) {
      return
    }

    setDeletingUserId(userId)
    setError(null)

    try {
      await authService.deleteUser(userId)
      setSuccess(`Ο χρήστης ${userEmail} διαγράφηκε επιτυχώς!`)
      
      // Refresh users list with delay
      setTimeout(() => {
        loadData()
      }, 1000)
      
    } catch (err: any) {
      console.error('Error deleting user:', err)
      if (err.message?.includes('404')) {
        setError('Ο χρήστης δεν βρέθηκε ή έχει ήδη διαγραφεί')
      } else {
        setError(`Σφάλμα διαγραφής χρήστη: ${err.message || 'Άγνωστο σφάλμα'}`)
      }
    } finally {
      setDeletingUserId(null)
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setUpdatingUserId(userId)
    setError(null)

    try {
      await authService.toggleUserStatus(userId, !currentStatus)
      setSuccess(`Η κατάσταση του χρήστη ενημερώθηκε επιτυχώς!`)
      
      // Refresh users list with delay
      setTimeout(() => {
        loadData()
      }, 500)
      
    } catch (err) {
      console.error('Error updating user status:', err)
      setError('Σφάλμα ενημέρωσης κατάστασης χρήστη')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    setUpdatingUserId(userId)
    setError(null)

    try {
      await authService.updateUserRole(userId, newRole)
      setSuccess(`Ο ρόλος του χρήστη ενημερώθηκε επιτυχώς!`)
      
      // Refresh users list with delay
      setTimeout(() => {
        loadData()
      }, 500)
      
    } catch (err) {
      console.error('Error updating user role:', err)
      setError('Σφάλμα ενημέρωσης ρόλου χρήστη')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await authService.terminateSession(sessionId)
      setSuccess('Η συνεδρία τερματίστηκε επιτυχώς!')
      loadData()
    } catch (err) {
      console.error('Error terminating session:', err)
      setError('Σφάλμα τερματισμού συνεδρίας')
    }
  }

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const tabs = [
    { id: 'users' as const, name: 'Χρήστες', icon: Users, count: users.length },
    { id: 'sessions' as const, name: 'Συνεδρίες', icon: Activity, count: sessions.length },
    { id: 'audit' as const, name: 'Αρχείο Καταγραφής', icon: FileText, count: auditLogs.length }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Πίσω στο Dashboard</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Διαχείριση Συστήματος</h1>
        <p className="text-gray-400">Διαχείριση χρηστών, συνεδριών και αρχείου καταγραφής</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-900/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-slate-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
                <span className="bg-slate-700 text-xs px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        {activeTab === 'users' && (
          <div className="p-6">
            {/* Users Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Αναζήτηση χρηστών..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-2 w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'user')}
                  className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Όλοι οι ρόλοι</option>
                  <option value="admin">Διαχειριστές</option>
                  <option value="user">Χρήστες</option>
                </select>
              </div>
              <button
                onClick={() => setShowCreateUser(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Νέος Χρήστης</span>
              </button>
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Χρήστης</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Ρόλος</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Κατάσταση</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Τελευταία Σύνδεση</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-300">Ενέργειες</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-700/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-white font-medium">{user.full_name || 'Άγνωστος'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{user.email}</td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value as 'admin' | 'user')}
                            disabled={updatingUserId === user.id}
                            className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                          >
                            <option value="user">Χρήστης</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                            disabled={updatingUserId === user.id}
                            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                              user.is_active 
                                ? 'bg-green-900/30 text-green-400 border border-green-500/30' 
                                : 'bg-red-900/30 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {updatingUserId === user.id ? (
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : user.is_active ? (
                              <ToggleRight className="w-3 h-3" />
                            ) : (
                              <ToggleLeft className="w-3 h-3" />
                            )}
                            <span>{user.is_active ? 'Ενεργός' : 'Ανενεργός'}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-xs">
                          {user.last_login_at 
                            ? new Date(user.last_login_at).toLocaleString('el-GR')
                            : 'Ποτέ'
                          }
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              disabled={deletingUserId === user.id}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50 p-1"
                              title="Διαγραφή χρήστη"
                            >
                              {deletingUserId === user.id ? (
                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    Δεν βρέθηκαν χρήστες
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">Ενεργές Συνεδρίες</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Χρήστης</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">IP Address</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Σύνδεση</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Τελευταία Δραστηριότητα</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-300">Ενέργειες</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-700/50">
                        <td className="py-3 px-4 text-white">{session.user_id}</td>
                        <td className="py-3 px-4 text-gray-300">{session.ip_address || 'Άγνωστο'}</td>
                        <td className="py-3 px-4 text-gray-300 text-xs">
                          {new Date(session.login_time).toLocaleString('el-GR')}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-xs">
                          {new Date(session.last_activity).toLocaleString('el-GR')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleTerminateSession(session.id)}
                              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 border border-red-500/30 rounded hover:bg-red-900/20 transition-colors"
                            >
                              Τερματισμός
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {sessions.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    Δεν υπάρχουν ενεργές συνεδρίες
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">Αρχείο Καταγραφής Ενεργειών</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Ημερομηνία</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Χρήστης</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Ενέργεια</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Πίνακας</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-700/50">
                        <td className="py-3 px-4 text-gray-300 text-xs">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(log.created_at).toLocaleString('el-GR')}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-white text-xs">
                            <div>{log.full_name || 'Άγνωστος'}</div>
                            <div className="text-gray-400 text-xs">{log.user_email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded border border-blue-500/30">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-xs">{log.table_name || '-'}</td>
                        <td className="py-3 px-4 text-gray-300 text-xs">{log.ip_address || 'Άγνωστο'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {auditLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    Δεν υπάρχουν καταγραφές
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Δημιουργία Νέου Χρήστη</h2>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Πλήρες Όνομα
                </label>
                <input
                  type="text"
                  required
                  value={createUserForm.full_name}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Εισάγετε το πλήρες όνομα"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Κωδικός Πρόσβασης
                </label>
                <input
                  type="password"
                  required
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Εισάγετε κωδικό πρόσβασης"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Ρόλος
                </label>
                <select
                  value={createUserForm.role}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="user">Χρήστης</option>
                  <option value="admin">Διαχειριστής</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  disabled={createUserLoading}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Ακύρωση
                </button>
                <button
                  type="submit"
                  disabled={createUserLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {createUserLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                      Δημιουργία...
                    </div>
                  ) : (
                    'Δημιουργία'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}