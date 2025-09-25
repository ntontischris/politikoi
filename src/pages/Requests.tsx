import { useState, useEffect } from 'react'
import { FileText, Plus, Search, Edit, Eye, Trash2, Clock, CheckCircle, XCircle, AlertCircle, X, Star, TrendingUp } from 'lucide-react'
import { useRequestStore, useRequestActions } from '../stores/realtimeRequestStore'
import { useRealtimeCitizenStore } from '../stores/realtimeCitizenStore'
import { RequestForm } from '../components/forms/RequestForm'
import { RequestViewModal } from '../components/modals/RequestViewModal'
import { ResponsiveTable, TableActions, StatusBadge, type TableColumn, type TableAction } from '../components/tables/ResponsiveTable'
import type { Request } from '../stores/realtimeRequestStore'

interface RequestFormData {
  type: 'citizen' | 'military'
  category: string
  title: string
  description: string
  citizenId: string
  militaryId: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  department: string
  estimatedDays: string
  notes: string
}

export function Requests() {
  const {
    items: requests,
    isLoading,
    error,
    initialize: loadRequests,
    addItem: addRequest,
    updateItem: updateRequest,
    deleteItem: deleteRequest,
    setError
  } = useRequestStore()


  const {
    searchRequests,
    filterByStatus,
    filterByPriority,
    getStats,
    getDepartments
  } = useRequestActions()

  const {
    items: citizens,
    initialize: loadCitizens
  } = useRealtimeCitizenStore()

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
        await loadCitizens() // Load citizens data as well
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
  }, [loadRequests, loadCitizens])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, setError])

  // Apply all filters to requests - add null safety
  const filteredRequests = (requests || []).filter(request => {

    // Search filter
    const matchesSearch = searchTerm ? (
      request.requestType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : true

    // Type filter
    const matchesType = typeFilter ? (
      typeFilter === 'citizen' ? (() => {
        // If no citizenId, treat as non-citizen (should not show in citizen filter)
        if (!request.citizenId) return false
        const citizen = citizens.find(c => c.id === request.citizenId)
        // If citizen not found or is military, don't show in citizen filter
        return citizen && !citizen.isMilitary
      })() :
      typeFilter === 'military' ? (() => {
        // If no citizenId, treat as non-military (should not show in military filter)
        if (!request.citizenId) return false
        const citizen = citizens.find(c => c.id === request.citizenId)
        // Only show if citizen exists and is military
        return citizen && citizen.isMilitary
      })() :
      true
    ) : true

    // Status filter
    const matchesStatus = statusFilter ? request.status === statusFilter : true

    // Priority filter
    const matchesPriority = priorityFilter ? request.priority === priorityFilter : true

    // Department filter (not implemented in store yet)
    const matchesDepartment = true

    return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesDepartment
  })

  // Stats and departments are now loaded via useEffect

  const handleAddRequest = async (formData: RequestFormData) => {
    try {
      await addRequest({
        requestType: formData.title,
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
        requestType: formData.title,
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
    category: '', // Not stored in database
    title: request.requestType,
    description: request.description,
    citizenId: request.citizenId || '',
    militaryId: request.militaryPersonnelId || '',
    priority: request.priority,
    department: '', // Not stored in database  
    estimatedDays: '', // Not stored in database
    notes: request.notes || ''
  })

  // Convert our Request to RequestViewModal format
  const convertRequestToModalFormat = (request: Request) => {
    const citizen = request.citizenId ? citizens.find(c => c.id === request.citizenId) : null
    return {
      id: request.id,
      type: request.citizenId ? 'citizen' as const : 'military' as const,
      category: '', // Not stored in database
      title: request.requestType,
      description: request.description,
      submitterName: citizen ? `${citizen.name} ${citizen.surname}`.trim() : 'Μη διαθέσιμο',
      submitterEmail: citizen?.email || 'Μη διαθέσιμο',
      submitterPhone: citizen?.phone || 'Μη διαθέσιμο',
      submitterAfm: citizen?.afm || '',
      relatedCitizenId: request.citizenId,
      relatedMilitaryId: request.militaryPersonnelId,
      priority: request.priority as 'low' | 'medium' | 'high',
      status: request.status === 'in-progress' ? 'in_progress' as const : request.status as 'submitted' | 'pending' | 'completed' | 'rejected',
      assignedTo: '', // Not stored in database
      department: '', // Not stored in database
      estimatedDays: 0, // Not stored in database
      actualDays: 0, // Not stored in database
      submissionDate: request.created_at,
      responseDate: undefined, // Not stored in database
      completionDate: request.completionDate,
      notes: request.notes || '',
      attachments: [],
      created_at: request.created_at,
      updated_at: request.updated_at
    }
  }

  // Table columns configuration
  const columns: TableColumn<Request>[] = [
    {
      key: 'requestType',
      title: 'Τίτλος',
      render: (value, request) => (
        <div className="text-white font-medium truncate max-w-xs" title={value}>
          {value}
        </div>
      ),
      sortable: true
    },
    {
      key: 'type',
      title: 'Τύπος',
      render: (_, request) => {
        const citizen = request.citizenId ? citizens.find(c => c.id === request.citizenId) : null
        const type = citizen?.isMilitary ? 'military' : 'citizen'
        return (
          <span className="text-gray-300 text-sm">
            {getTypeText(type)}
          </span>
        )
      }
    },
    {
      key: 'submitter',
      title: 'Αιτών',
      render: (_, request) => {
        const citizen = request.citizenId ? citizens.find(c => c.id === request.citizenId) : null
        const name = citizen ? `${citizen.name} ${citizen.surname}`.trim() : 'Μη διαθέσιμο'
        return (
          <div className="text-white font-medium" title={name}>
            {name}
          </div>
        )
      },
      hideOnMobile: true
    },
    {
      key: 'status',
      title: 'Κατάσταση',
      render: (value, request) => {
        const StatusIcon = getStatusIcon(request.status)
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${getStatusColor(request.status)}`}>
            <StatusIcon className="h-3 w-3" />
            {getStatusText(request.status)}
          </span>
        )
      },
      sortable: true
    },
    {
      key: 'priority',
      title: 'Προτεραιότητα',
      render: (value, request) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
          {getPriorityText(request.priority)}
        </span>
      ),
      sortable: true,
      hideOnMobile: true
    },
    {
      key: 'created_at',
      title: 'Ημερομηνία',
      render: (value) => (
        <span className="text-gray-300 text-sm">
          {new Date(value).toLocaleDateString('el-GR')}
        </span>
      ),
      sortable: true,
      hideOnMobile: true
    }
  ]

  // Table actions configuration
  const actions: TableAction<Request>[] = [
    {
      key: 'view',
      label: 'Προβολή',
      icon: <Eye className="w-4 h-4" />,
      onClick: (request: Request) => handleViewRequest(request),
      variant: 'primary'
    },
    {
      key: 'edit',
      label: 'Επεξεργασία',
      icon: <Edit className="w-4 h-4" />,
      onClick: (request: Request) => {
        setSelectedRequest(request)
        setShowEditModal(true)
      },
      variant: 'secondary'
    },
    {
      key: 'delete',
      label: 'Διαγραφή',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (request: Request) => handleDeleteRequest(request.id),
      variant: 'danger'
    }
  ]

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
    <div className="responsive-padding py-4 sm:py-6 lg:py-8">
      {/* Error Alert */}
      {error && (
        <div className="mb-4 sm:mb-6 bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span className="flex-1 text-sm sm:text-base">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-400 hover:text-red-300 touch-target flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 truncate">
              Διαχείριση Αιτημάτων
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Παρακολούθηση και διαχείριση όλων των αιτημάτων πολιτών και στρατιωτικού προσωπικού
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={false}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 sm:px-6 py-3 rounded-lg flex items-center justify-center transition-colors duration-200 touch-target font-medium w-full sm:w-auto"
          >
            <Plus className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>Νέο Αίτημα</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-blue-500/20 flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-blue-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-base sm:text-2xl font-bold text-white truncate">
                  {filteredRequests.length.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Σύνολο</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-blue-500/20 flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-blue-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-base sm:text-2xl font-bold text-white truncate">
                  {stats.submitted.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Υποβλήθηκαν</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-orange-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-orange-500/20 flex-shrink-0">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-orange-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-base sm:text-2xl font-bold text-white truncate">
                  {stats.inProgress.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Σε Εξέλιξη</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-green-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-green-500/20 flex-shrink-0">
                <Star className="h-4 w-4 sm:h-6 sm:w-6 text-green-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-base sm:text-2xl font-bold text-white truncate">
                  {stats.approved.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Εγκρίθηκαν</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-emerald-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-emerald-500/20 flex-shrink-0">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-base sm:text-2xl font-bold text-white truncate">
                  {stats.completed.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Ολοκληρώθηκαν</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-yellow-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-yellow-500/20 flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-base sm:text-2xl font-bold text-white truncate">
                  {'N/A'}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Μέσος Χρόνος</div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Search and Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as '' | 'citizen' | 'military')}
            className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Όλοι οι τύποι</option>
            <option value="citizen">Πολιτικό</option>
            <option value="military">Στρατιωτικό</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | 'submitted' | 'in_progress' | 'pending_review' | 'approved' | 'rejected' | 'completed')}
            className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Καταστάσεις</option>
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
            className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Προτεραιότητες</option>
            <option value="low">Χαμηλή</option>
            <option value="medium">Μέση</option>
            <option value="high">Υψηλή</option>
            <option value="urgent">Επείγουσα</option>
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Τμήματα</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearchTerm('')
              setTypeFilter('')
              setStatusFilter('')
              setPriorityFilter('')
              setDepartmentFilter('')
            }}
            className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-3 rounded-lg transition-colors duration-200 touch-target font-medium text-sm sm:col-span-2 lg:col-span-4 xl:col-span-1"
          >
            Καθαρισμός
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <ResponsiveTable<Request>
        data={filteredRequests || []}
        columns={columns}
        actions={actions}
        isLoading={isLoading}
        emptyState={{
          icon: <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />,
          title: searchTerm || typeFilter || statusFilter || priorityFilter || departmentFilter
            ? 'Δεν βρέθηκαν αιτήματα με αυτά τα κριτήρια'
            : 'Δεν υπάρχουν καταχωρημένα αιτήματα',
          description: searchTerm || typeFilter || statusFilter || priorityFilter || departmentFilter
            ? 'Δοκιμάστε να αλλάξετε τα φίλτρα αναζήτησης'
            : 'Δημιουργήστε το πρώτο αίτημα κάνοντας κλικ στο κουμπί "Νέο Αίτημα"'
        }}
        searchable={false} // We handle search with external filters
        sortable={true}
        viewModes={['table']}
        defaultViewMode="table"
        onRowClick={(request) => handleViewRequest(request)}
      />

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
        request={selectedRequest ? convertRequestToModalFormat(selectedRequest) : null}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setSelectedRequest(null)
        }}
        onEdit={() => {
          if (selectedRequest) {
            setShowEditModal(true)
            setShowViewModal(false)
          }
        }}
      />
    </div>
  )
}