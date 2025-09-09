import { useState, useEffect } from 'react'
import { Shield, Search, Plus, ChevronDown, ChevronRight, Edit, Eye, Trash2, Star, Clock, MapPin, AlertCircle, X, UserPlus } from 'lucide-react'
import { useMilitaryStore } from '../stores/militaryStore'
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
    militaryPersonnel,
    isLoading,
    error,
    loadMilitaryPersonnel,
    addMilitaryPersonnel,
    updateMilitaryPersonnel,
    deleteMilitaryPersonnel,
    getStats,
    getEssoGroups,
    setError
  } = useMilitaryStore()

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
  }, [loadMilitaryPersonnel, getStats])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, setError])

  // Apply local filtering to militaryPersonnel from store
  const filteredPersonnel = militaryPersonnel.filter(personnel => {
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
              Στρατιωτικό Προσωπικό
            </h1>
            <p className="text-gray-400">
              Διαχείριση αιτημάτων και στοιχείων στρατιωτικού προσωπικού
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg flex items-center transition-colors duration-200"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Νέο Αίτημα
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {stats.total.toLocaleString('el-GR')}
                </div>
                <div className="text-sm text-gray-400">Σύνολο</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {stats.pending.toLocaleString('el-GR')}
                </div>
                <div className="text-sm text-gray-400">Εκκρεμή</div>
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
                <div className="text-sm text-gray-400">Εγκριθέντα</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {stats.completed.toLocaleString('el-GR')}
                </div>
                <div className="text-sm text-gray-400">Ολοκληρωμένα</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-red-500/20">
                <X className="h-6 w-6 text-red-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {stats.rejected.toLocaleString('el-GR')}
                </div>
                <div className="text-sm text-gray-400">Απορριφθέντα</div>
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
              placeholder="Αναζήτηση (όνομα, βαθμός, μονάδα, ΑΜ, ΕΣΣΟ, τύπος αιτήματος)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | 'pending' | 'approved' | 'rejected' | 'completed')}
            className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Όλα τα ΕΣΣΟ</option>
            {uniqueEssos.map(esso => (
              <option key={esso} value={esso}>{esso}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Personnel Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            Λίστα Στρατιωτικού Προσωπικού ({filteredPersonnel.length})
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
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Προβολή"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedPersonnel(personnel)
                            setShowEditModal(true)
                          }}
                          className="text-green-400 hover:text-green-300 p-1"
                          title="Επεξεργασία"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePersonnel(personnel.id)}
                          className={`p-1 transition-colors ${
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