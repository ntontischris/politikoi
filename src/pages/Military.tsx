import { useState, useEffect } from 'react'
import { Shield, Search, Plus, ChevronDown, ChevronRight, Edit, Eye, Trash2, Star, Clock, MapPin, AlertCircle, X, UserPlus, FileText } from 'lucide-react'
import { useMilitaryActions } from '../stores/militaryStore'
import { MilitaryPersonnelForm } from '../components/forms/MilitaryPersonnelForm'
import { MilitaryViewModal } from '../components/modals/MilitaryViewModal'
import type { MilitaryPersonnel } from '../stores/militaryStore'

interface MilitaryPersonnelFormData {
  name: string
  surname: string
  rank: string
  unit: string
  militaryId: string
  esso: string
  essoYear: string
  essoLetter: string
  requestType: string
  description: string
  sendDate: string
  notes: string
}

export function Military() {
  const {
    items: militaryPersonnel,
    isLoading,
    error,
    loadItems: loadMilitaryPersonnel,
    addItem: addMilitaryPersonnel,
    updateItem: updateMilitaryPersonnel,
    deleteItem: deleteMilitaryPersonnel,
    getStats,
    getEssoGroups,
    setError
  } = useMilitaryActions()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'pending' | 'approved' | 'rejected' | 'completed'>('')
  const [essoFilter, setEssoFilter] = useState('')
  const [expandedYear, setExpandedYear] = useState<string | null>(null)
  const [expandedLetter, setExpandedLetter] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedPersonnel, setSelectedPersonnel] = useState<MilitaryPersonnel | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, completed: 0, by_year: {} })

  const essoYears = ['2025', '2024', '2023', '2022', '2021']
  const essoLetters = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ']

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadMilitaryPersonnel()
        const statsData = await getStats()
        setStats(statsData)
      } catch (error) {
        console.error('Error loading military personnel:', error)
      }
    }
    loadData()
  }, [])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, setError])

  // Apply local filtering to militaryPersonnel from store
  const filteredPersonnel = (militaryPersonnel || []).filter(personnel => {
    const matchesSearch = searchTerm ? (
      personnel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      personnel.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      personnel.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      personnel.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      personnel.militaryId.includes(searchTerm) ||
      personnel.esso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      personnel.requestType.toLowerCase().includes(searchTerm.toLowerCase())
    ) : true

    const matchesStatus = statusFilter ? personnel.status === statusFilter : true
    const matchesEsso = essoFilter ? personnel.esso === essoFilter : true

    return matchesSearch && matchesStatus && matchesEsso
  })

  // Get ESSO groups
  const essoGroups = getEssoGroups()
  const uniqueEssos = Object.keys(essoGroups).sort()

  const handleAddPersonnel = async (formData: MilitaryPersonnelFormData) => {
    try {
      await addMilitaryPersonnel({
        ...formData,
        status: 'pending' as const
      })
      setShowAddModal(false)
      // Refresh stats after adding
      const statsData = await getStats()
      setStats(statsData)
    } catch (error) {
      // Error is handled by the store
    }
  }

  const handleEditPersonnel = async (formData: MilitaryPersonnelFormData) => {
    if (!selectedPersonnel) return
    
    try {
      await updateMilitaryPersonnel(selectedPersonnel.id, formData)
      setShowEditModal(false)
      setSelectedPersonnel(null)
      // Refresh stats after updating
      const statsData = await getStats()
      setStats(statsData)
    } catch (error) {
      // Error is handled by the store
    }
  }

  const handleDeletePersonnel = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
      return
    }

    try {
      await deleteMilitaryPersonnel(id)
      setDeleteConfirm(null)
      // Refresh stats after deleting
      const statsData = await getStats()
      setStats(statsData)
    } catch (error) {
      // Error is handled by the store
    }
  }

  const handleViewPersonnel = (personnel: MilitaryPersonnel) => {
    setSelectedPersonnel(personnel)
    setShowViewModal(true)
  }

  const handleEditFromView = (personnel: MilitaryPersonnel) => {
    setSelectedPersonnel(personnel)
    setShowEditModal(true)
    setShowViewModal(false)
  }

  const convertPersonnelToFormData = (personnel: MilitaryPersonnel): MilitaryPersonnelFormData => ({
    name: personnel.name,
    surname: personnel.surname,
    rank: personnel.rank,
    unit: personnel.unit,
    militaryId: personnel.militaryId,
    esso: personnel.esso,
    essoYear: personnel.essoYear,
    essoLetter: personnel.essoLetter,
    requestType: personnel.requestType,
    description: personnel.description,
    sendDate: personnel.sendDate || '',
    notes: personnel.notes || ''
  })

  const toggleYear = (year: string) => {
    setExpandedYear(expandedYear === year ? null : year)
    setExpandedLetter(null)
  }

  const toggleLetter = (letter: string) => {
    setExpandedLetter(expandedLetter === letter ? null : letter)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Εκκρεμεί'
      case 'approved': return 'Εγκρίθηκε'
      case 'rejected': return 'Απορρίφθηκε'
      case 'completed': return 'Ολοκληρώθηκε'
      default: return 'Άγνωστο'
    }
  }

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, setError])

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
              Στρατιωτικό Προσωπικό
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Διαχείριση αιτημάτων και στοιχείων στρατιωτικού προσωπικού
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 sm:px-6 py-3 rounded-lg flex items-center justify-center transition-colors duration-200 touch-target font-medium w-full sm:w-auto"
          >
            <UserPlus className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>Νέο Αίτημα</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-blue-500/20 flex-shrink-0">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-lg sm:text-2xl font-bold text-white truncate">
                  {stats.total.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Σύνολο</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-yellow-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-yellow-500/20 flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-lg sm:text-2xl font-bold text-white truncate">
                  {stats.pending.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Εκκρεμή</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-green-500/30 rounded-xl p-4 sm:p-6 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-green-500/20 flex-shrink-0">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-lg sm:text-2xl font-bold text-white truncate">
                  {stats.approved.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Εγκριθέντα</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-blue-500/20 flex-shrink-0">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-lg sm:text-2xl font-bold text-white truncate">
                  {stats.completed.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Ολοκληρωμένα</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-red-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-red-500/20 flex-shrink-0">
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-lg sm:text-2xl font-bold text-white truncate">
                  {stats.rejected.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Απορριφθέντα</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Αναζήτηση στρατιωτικού προσωπικού..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-col xs:flex-row gap-3">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as '' | 'pending' | 'approved' | 'rejected' | 'completed')}
              className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-3 sm:px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Όλες οι καταστάσεις</option>
              <option value="pending">Εκκρεμή</option>
              <option value="approved">Εγκριθέντα</option>
              <option value="rejected">Απορριφθέντα</option>
              <option value="completed">Ολοκληρωμένα</option>
            </select>
            <select 
              value={essoFilter}
              onChange={(e) => setEssoFilter(e.target.value)}
              className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-3 sm:px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Όλα τα ΕΣΣΟ</option>
              {uniqueEssos.map(esso => (
                <option key={esso} value={esso}>{esso}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Personnel List Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-t-xl px-4 sm:px-6 py-4 border-b">
        <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
          Λίστα Στρατιωτικού Προσωπικού ({filteredPersonnel.length})
          {isLoading && (
            <span className="ml-3 inline-flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-400">Φόρτωση...</span>
            </span>
          )}
        </h2>
      </div>

      {/* Desktop Table View */}
      <div className="mobile-table-hidden bg-slate-800 border-x border-b border-slate-700 rounded-b-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700/50">
              <th className="text-left py-4 px-6 text-gray-300 font-medium">Όνομα</th>
              <th className="text-left py-4 px-6 text-gray-300 font-medium">Βαθμός</th>
              <th className="text-left py-4 px-6 text-gray-300 font-medium">Μονάδα</th>
              <th className="text-left py-4 px-6 text-gray-300 font-medium">ΑΜ</th>
              <th className="text-left py-4 px-6 text-gray-300 font-medium">ΕΣΣΟ</th>
              <th className="text-left py-4 px-6 text-gray-300 font-medium">Τύπος Αιτήματος</th>
              <th className="text-left py-4 px-6 text-gray-300 font-medium">Κατάσταση</th>
              <th className="text-left py-4 px-6 text-gray-300 font-medium">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {filteredPersonnel.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                  {searchTerm || statusFilter || essoFilter ? 'Δεν βρέθηκε στρατιωτικό προσωπικό με αυτά τα κριτήρια' : 'Δεν υπάρχει εγγεγραμμένο στρατιωτικό προσωπικό'}
                </td>
              </tr>
            ) : (
              filteredPersonnel.map((personnel) => (
                <tr key={personnel.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="text-white font-medium">
                      {personnel.name} {personnel.surname}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-300">{personnel.rank}</td>
                  <td className="py-4 px-6 text-gray-300">{personnel.unit}</td>
                  <td className="py-4 px-6 text-gray-300 font-mono">{personnel.militaryId}</td>
                  <td className="py-4 px-6">
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">
                      {personnel.esso}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-300">{personnel.requestType}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(personnel.status)}`}>
                      {getStatusText(personnel.status)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewPersonnel(personnel)}
                        className="text-blue-400 hover:text-blue-300 p-1 touch-target"
                        title="Προβολή"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedPersonnel(personnel)
                          setShowEditModal(true)
                        }}
                        className="text-green-400 hover:text-green-300 p-1 touch-target"
                        title="Επεξεργασία"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePersonnel(personnel.id)}
                        className={`p-1 transition-colors touch-target ${
                          deleteConfirm === personnel.id
                            ? 'text-red-300 bg-red-500/20 rounded'
                            : 'text-red-400 hover:text-red-300'
                        }`}
                        title={deleteConfirm === personnel.id ? 'Κάντε κλικ για επιβεβαίωση' : 'Διαγραφή'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="mobile-card-only space-y-4 bg-slate-800 border-x border-b border-slate-700 rounded-b-xl p-4">
        {filteredPersonnel.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-500" />
            <p className="text-sm">
              {searchTerm || statusFilter || essoFilter ? 'Δεν βρέθηκε στρατιωτικό προσωπικό με αυτά τα κριτήρια' : 'Δεν υπάρχει εγγεγραμμένο στρατιωτικό προσωπικό'}
            </p>
          </div>
        ) : (
          filteredPersonnel.map((personnel) => (
            <div key={personnel.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold text-base truncate">
                    {personnel.name} {personnel.surname}
                  </h3>
                  <p className="text-gray-400 text-sm">{personnel.rank}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ml-2 ${getStatusColor(personnel.status)}`}>
                  {getStatusText(personnel.status)}
                </span>
              </div>

              {/* Military Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <Shield className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-300">ΑΜ: {personnel.militaryId}</span>
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-300">{personnel.unit}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-gray-300 truncate">{personnel.requestType}</span>
                  </div>
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 text-xs ml-2 flex-shrink-0">
                    {personnel.esso}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2">
                <button 
                  onClick={() => handleViewPersonnel(personnel)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target flex items-center"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Προβολή
                </button>
                <button 
                  onClick={() => {
                    setSelectedPersonnel(personnel)
                    setShowEditModal(true)
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target flex items-center"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Επεξεργασία
                </button>
                <button 
                  onClick={() => handleDeletePersonnel(personnel.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target flex items-center ${
                    deleteConfirm === personnel.id
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                  }`}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {deleteConfirm === personnel.id ? 'Επιβεβαίωση' : 'Διαγραφή'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <MilitaryPersonnelForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddPersonnel}
        mode="add"
      />

      <MilitaryPersonnelForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedPersonnel(null)
        }}
        onSubmit={handleEditPersonnel}
        initialData={selectedPersonnel ? convertPersonnelToFormData(selectedPersonnel) : undefined}
        mode="edit"
      />

      <MilitaryViewModal
        militaryPersonnel={selectedPersonnel}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setSelectedPersonnel(null)
        }}
        onEdit={handleEditFromView}
      />
    </div>
  )
}