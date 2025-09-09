import { useState, useEffect } from 'react'
import { FileText, Plus, Search, Edit, Eye, Trash2, Clock, CheckCircle, XCircle, AlertCircle, X, Star, TrendingUp } from 'lucide-react'
import { useRequestStore } from '../stores/requestStore'
import { RequestForm } from '../components/forms/RequestForm'
import { RequestViewModal } from '../components/modals/RequestViewModal'
import type { Request } from '../stores/requestStore'

interface RequestFormData {
  type: 'citizen' | 'military'
  category: string
  title: string
  description: string
  citizenId: string
  militaryId: string
  priority: 'low' | 'medium' | 'high'
  department: string
  estimatedDays: string
  notes: string
}

export function Requests() {
  const {
    requests,
    isLoading,
    error,
    loadRequests,
    addRequest,
    updateRequest,
    deleteRequest,
    searchRequests,
    filterByStatus,
    filterByPriority,
    getStats,
    getDepartments,
    setError
  } = useRequestStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | 'citizen' | 'military'>('')
  const [statusFilter, setStatusFilter] = useState<'' | 'submitted' | 'in_progress' | 'pending_review' | 'approved' | 'rejected' | 'completed'>('')
  const [priorityFilter, setPriorityFilter] = useState<'' | 'low' | 'medium' | 'high'>('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [stats, setStats] = useState({ 
    total: 0, 
    submitted: 0,
    inProgress: 0, 
    approved: 0,
    pending: 0, 
    completed: 0, 
    rejected: 0, 
  })
  const [departments, setDepartments] = useState<string[]>([])
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadRequests()
        const rawStats = await getStats()
        const departmentsData = await getDepartments()
        
        // Transform store stats to match component expectations
        const transformedStats = {
          total: rawStats.total,
          submitted: rawStats.pending || 0, // Map pending to submitted for display
          inProgress: rawStats.in_progress || 0, // Convert snake_case to camelCase
          approved: rawStats.completed || 0, // Map completed to approved for display
          pending: rawStats.pending || 0,
          completed: rawStats.completed || 0,
          rejected: rawStats.rejected || 0,
          avgResponseTime: rawStats.avgResponseTime || 0,
          by_department: rawStats.by_department || {},
          by_type: rawStats.by_type || {}
        }
        
        setStats(transformedStats)
        setDepartments(departmentsData)
      } catch (error) {
        console.error('Error loading requests:', error)
      }
    }
    loadData()
  }, [loadRequests, getStats, getDepartments])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, setError])

  // Get filtered requests
  let filteredRequests = searchRequests(searchTerm)
  
  if (typeFilter) {
    filteredRequests = filteredRequests.filter(request => {
      if (typeFilter === 'citizen') {
        return request.citizenId && !request.militaryPersonnelId
      } else if (typeFilter === 'military') {
        return request.militaryPersonnelId && !request.citizenId
      }
      return true
    })
  }
  
  if (statusFilter) {
    filteredRequests = filterByStatus(statusFilter)
  }
  
  if (priorityFilter) {
    filteredRequests = filterByPriority(priorityFilter)
  }
  
  // Department filter not implemented in store

  // Apply combined filters
  if (searchTerm || typeFilter || statusFilter || priorityFilter || departmentFilter) {
    filteredRequests = requests.filter(request => {
      const matchesSearch = searchTerm ? (
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.citizenName && request.citizenName.toLowerCase().includes(searchTerm.toLowerCase()))
      ) : true

      const matchesType = typeFilter ? (request.citizenId ? 'citizen' : 'military') === typeFilter : true
      const matchesStatus = statusFilter ? request.status === statusFilter : true
      const matchesPriority = priorityFilter ? request.priority === priorityFilter : true
      const matchesDepartment = true // Department filter not implemented

      return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesDepartment
    })
  }

  // Stats and departments are now loaded via useEffect

  const handleAddRequest = async (formData: RequestFormData) => {
    try {
      await addRequest({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'pending' as const,
        // Map form fields to store fields correctly
        citizenId: formData.type === 'citizen' ? formData.citizenId : undefined,
        militaryPersonnelId: formData.type === 'military' ? formData.militaryId : undefined
      })
      setShowAddModal(false)
      // Refresh stats after adding
      const rawStats = await getStats()
      const transformedStats = {
        total: rawStats.total,
        submitted: rawStats.pending || 0,
        inProgress: rawStats.in_progress || 0,
        approved: rawStats.completed || 0,
        pending: rawStats.pending || 0,
        completed: rawStats.completed || 0,
        rejected: rawStats.rejected || 0,
      }
      setStats(transformedStats)
    } catch (error) {
      // Error is handled by the store
    }
  }

  const handleEditRequest = async (formData: RequestFormData) => {
    if (!selectedRequest) return
    
    try {
      await updateRequest(selectedRequest.id, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        citizenId: formData.type === 'citizen' ? formData.citizenId : undefined,
        militaryPersonnelId: formData.type === 'military' ? formData.militaryId : undefined
      })
      setShowEditModal(false)
      setSelectedRequest(null)
      // Refresh stats after updating
      const rawStats = await getStats()
      const transformedStats = {
        total: rawStats.total,
        submitted: rawStats.pending || 0,
        inProgress: rawStats.in_progress || 0,
        approved: rawStats.completed || 0,
        pending: rawStats.pending || 0,
        completed: rawStats.completed || 0,
        rejected: rawStats.rejected || 0,
      }
      setStats(transformedStats)
    } catch (error) {
      // Error is handled by the store
    }
  }

  const handleDeleteRequest = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
      return
    }

    try {
      await deleteRequest(id)
      setDeleteConfirm(null)
      // Refresh stats after deleting
      const rawStats = await getStats()
      const transformedStats = {
        total: rawStats.total,
        submitted: rawStats.pending || 0,
        inProgress: rawStats.in_progress || 0,
        approved: rawStats.completed || 0,
        pending: rawStats.pending || 0,
        completed: rawStats.completed || 0,
        rejected: rawStats.rejected || 0,
      }
      setStats(transformedStats)
    } catch (error) {
      // Error is handled by the store
    }
  }

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request)
    setShowViewModal(true)
  }

  const handleEditFromView = (request: Request) => {
    setSelectedRequest(request)
    setShowEditModal(true)
    setShowViewModal(false)
  }

  const convertRequestToFormData = (request: Request): RequestFormData => ({
    type: request.citizenId ? 'citizen' : 'military',
    category: '',
    title: request.title,
    description: request.description,
    citizenId: request.citizenId || '',
    militaryId: request.militaryPersonnelId || '',
    priority: request.priority,
    department: '',
    estimatedDays: '',
    notes: ''
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'in_progress': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'pending_review': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted': return 'Υποβλήθηκε'
      case 'in_progress': return 'Σε Εξέλιξη'
      case 'pending_review': return 'Εκκρεμεί Έλεγχος'
      case 'approved': return 'Εγκρίθηκε'
      case 'rejected': return 'Απορρίφθηκε'
      case 'completed': return 'Ολοκληρώθηκε'
      default: return 'Άγνωστο'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return FileText
      case 'in_progress': return Clock
      case 'pending_review': return AlertCircle
      case 'approved': return Star
      case 'rejected': return XCircle
      case 'completed': return CheckCircle
      default: return FileText
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Χαμηλή'
      case 'medium': return 'Μέση'
      case 'high': return 'Υψηλή'
      case 'urgent': return 'Επείγουσα'
      default: return 'Άγνωστη'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'citizen': return 'Πολιτικό'
      case 'military': return 'Στρατιωτικό'
      default: return 'Άγνωστο'
    }
  }

  return (
    <div className="p-8">
      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Διαχείριση Αιτημάτων
            </h1>
            <p className="text-gray-400">
              Παρακολούθηση και διαχείριση όλων των αιτημάτων πολιτών, στρατιωτικού προσωπικού και γενικών υποθέσεων
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg flex items-center transition-colors duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Νέο Αίτημα
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {stats.total.toLocaleString('el-GR')}
                </div>
                <div className="text-sm text-gray-400">Σύνολο</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {stats.submitted.toLocaleString('el-GR')}
                </div>
                <div className="text-sm text-gray-400">Υποβλήθηκαν</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-orange-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-orange-500/20">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {stats.inProgress.toLocaleString('el-GR')}
                </div>
                <div className="text-sm text-gray-400">Σε Εξέλιξη</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-green-500/20">
                <Star className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {stats.approved.toLocaleString('el-GR')}
                </div>
                <div className="text-sm text-gray-400">Εγκρίθηκαν</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-emerald-500/20">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {stats.completed.toLocaleString('el-GR')}
                </div>
                <div className="text-sm text-gray-400">Ολοκληρώθηκαν</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <TrendingUp className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {'N/A'}
                </div>
                <div className="text-sm text-gray-400">Μέσος Χρόνος (ημέρες)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Αναζήτηση (τίτλος, περιγραφή, αιτών, email, κατηγορία, τμήμα)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as '' | 'citizen' | 'military')}
            className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Όλοι οι τύποι</option>
            <option value="citizen">Πολιτικό</option>
            <option value="military">Στρατιωτικό</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | 'submitted' | 'in_progress' | 'pending_review' | 'approved' | 'rejected' | 'completed')}
            className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Όλες οι καταστάσεις</option>
            <option value="submitted">Υποβλήθηκε</option>
            <option value="in_progress">Σε Εξέλιξη</option>
            <option value="pending_review">Εκκρεμεί Έλεγχος</option>
            <option value="approved">Εγκρίθηκε</option>
            <option value="rejected">Απορρίφθηκε</option>
            <option value="completed">Ολοκληρώθηκε</option>
          </select>
          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as '' | 'low' | 'medium' | 'high' | 'urgent')}
            className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Όλες οι προτεραιότητες</option>
            <option value="low">Χαμηλή</option>
            <option value="medium">Μέση</option>
            <option value="high">Υψηλή</option>
            <option value="urgent">Επείγουσα</option>
          </select>
          <select 
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Όλα τα τμήματα</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            Λίστα Αιτημάτων ({filteredRequests.length})
            {isLoading && (
              <span className="ml-3 inline-flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-400">Φόρτωση...</span>
              </span>
            )}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700/50">
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Τίτλος</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Τύπος</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Αιτών</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Κατηγορία</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Κατάσταση</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Προτεραιότητα</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Τμήμα</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Ημερομηνία</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                    {searchTerm || typeFilter || statusFilter || priorityFilter || departmentFilter ? 'Δεν βρέθηκαν αιτήματα με αυτά τα κριτήρια' : 'Δεν υπάρχουν καταχωρημένα αιτήματα'}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => {
                  const StatusIcon = getStatusIcon(request.status)
                  return (
                    <tr key={request.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="text-white font-medium truncate max-w-xs" title={request.title}>
                          {request.title}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-300 text-sm">
                          {getTypeText(request.citizenId ? 'citizen' : 'military')}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-white font-medium">
                          {request.citizenName || 'Μη διαθέσιμο'}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300 text-sm">-</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${getStatusColor(request.status)}`}>
                          <StatusIcon className="h-3 w-3" />
                          {getStatusText(request.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                          {getPriorityText(request.priority)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-300 text-sm">-</td>
                      <td className="py-4 px-6 text-gray-300 text-sm">
                        {new Date(request.created_at).toLocaleDateString('el-GR')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewRequest(request)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                            title="Προβολή"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedRequest(request)
                              setShowEditModal(true)
                            }}
                            className="text-green-400 hover:text-green-300 p-1"
                            title="Επεξεργασία"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteRequest(request.id)}
                            className={`p-1 transition-colors ${
                              deleteConfirm === request.id
                                ? 'text-red-300 bg-red-500/20 rounded'
                                : 'text-red-400 hover:text-red-300'
                            }`}
                            title={deleteConfirm === request.id ? 'Κάντε κλικ για επιβεβαίωση' : 'Διαγραφή'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RequestForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddRequest}
        mode="add"
      />

      <RequestForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedRequest(null)
        }}
        onSubmit={handleEditRequest}
        initialData={selectedRequest ? convertRequestToFormData(selectedRequest) : undefined}
        mode="edit"
      />

      <RequestViewModal
        request={selectedRequest as any}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setSelectedRequest(null)
        }}
        onEdit={handleEditFromView}
      />
    </div>
  )
}