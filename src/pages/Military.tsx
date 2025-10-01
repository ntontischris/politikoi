import { useState, useEffect, useMemo } from 'react'
import { Shield, Search, Filter, Edit, Trash2, Eye, UserPlus, AlertCircle, X, Phone, Mail, MapPin, ChevronDown, SortAsc, Activity, Clock, Star } from 'lucide-react'
import { useRealtimeCitizenStore } from '../stores/realtimeCitizenStore'
import { CitizenForm, type CitizenFormData } from '../components/forms/CitizenForm'
import { CitizenViewModal } from '../components/modals/CitizenViewModal'
import { RequestForm } from '../components/forms/RequestForm'
import { RequestViewModalContainer } from '../components/modals/RequestViewModalContainer'
import { useRequestActions } from '../stores/realtimeRequestStore'
import { useResponsive, useTouchDevice } from '../hooks/useResponsive'
import type { Citizen } from '../stores/realtimeCitizenStore'

export function Military() {
  const {
    items: citizens,
    isLoading,
    error,
    initialize: loadItems,
    addItem: addCitizen,
    updateItem: updateCitizen,
    deleteItem: deleteCitizen,
    setError
  } = useRealtimeCitizenStore()

  const { initialize: loadRequests } = useRequestActions()

  // Responsive hooks
  const { isMobile, isTablet, isDesktop } = useResponsive()
  const { isTouchDevice } = useTouchDevice()

  // Filter only military personnel
  const militaryPersonnel = useMemo(() => {
    return citizens.filter(c => c.isMilitary === true)
  }, [citizens])

  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [essoFilter, setEssoFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null)
  const [citizenToEdit, setCitizenToEdit] = useState<Citizen | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestFormCitizenId, setRequestFormCitizenId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'esso'>('esso')
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped')

  // Load data on mount
  useEffect(() => {
    loadItems()
    loadRequests()
  }, [loadItems, loadRequests])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, setError])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = militaryPersonnel.length
    const byStatus = militaryPersonnel.reduce((acc, person) => {
      const status = person.status || 'ΕΚΚΡΕΜΗ'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byEsso = militaryPersonnel.reduce((acc, person) => {
      const esso = person.militaryEsso || 'Χωρίς ΕΣΣΟ'
      acc[esso] = (acc[esso] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      completed: byStatus['ΟΛΟΚΛΗΡΩΜΕΝΑ'] || 0,
      pending: byStatus['ΕΚΚΡΕΜΗ'] || 0,
      byEsso
    }
  }, [militaryPersonnel])

  // Get unique ΕΣΣΟ values for filter
  const uniqueEssos = useMemo(() => {
    const essos = new Set(militaryPersonnel.map(p => p.militaryEsso).filter(Boolean))
    return Array.from(essos).sort((a, b) => b.localeCompare(a)) // Descending (2025, 2024, ...)
  }, [militaryPersonnel])

  // Apply filters and search
  const filteredPersonnel = useMemo(() => {
    let filtered = militaryPersonnel

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.surname.toLowerCase().includes(term) ||
        p.militaryRank?.toLowerCase().includes(term) ||
        p.militaryServiceUnit?.toLowerCase().includes(term) ||
        p.militaryId?.toLowerCase().includes(term) ||
        p.militaryEsso?.toLowerCase().includes(term)
      )
    }

    // ΕΣΣΟ filter
    if (essoFilter) {
      filtered = filtered.filter(p => p.militaryEsso === essoFilter)
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`)
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'esso':
          return (b.militaryEsso || '').localeCompare(a.militaryEsso || '')
        default:
          return 0
      }
    })

    return filtered
  }, [militaryPersonnel, searchTerm, essoFilter, statusFilter, sortBy])

  // Group by ΕΣΣΟ for grouped view
  const groupedByEsso = useMemo(() => {
    const groups: Record<string, Citizen[]> = {}
    filteredPersonnel.forEach(person => {
      const esso = person.militaryEsso || 'Χωρίς ΕΣΣΟ'
      if (!groups[esso]) groups[esso] = []
      groups[esso].push(person)
    })
    return groups
  }, [filteredPersonnel])

  // Handlers
  const handleAddCitizen = async (formData: CitizenFormData) => {
    try {
      await addCitizen({ ...formData, isMilitary: true })
      setShowAddModal(false)
    } catch (error) {
      console.error('Failed to add military personnel:', error)
    }
  }

  const handleUpdateCitizen = async (formData: CitizenFormData) => {
    if (!citizenToEdit) return
    try {
      await updateCitizen(citizenToEdit.id, formData)
      setShowEditModal(false)
      setCitizenToEdit(null)
    } catch (error) {
      console.error('Failed to update military personnel:', error)
    }
  }

  const handleDeleteCitizen = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
      return
    }

    try {
      await deleteCitizen(id)
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete military personnel:', error)
    }
  }

  const handleViewCitizen = (citizen: Citizen) => {
    setSelectedCitizen(citizen)
    setShowViewModal(true)
  }

  const handleEditFromView = (citizen: Citizen) => {
    setCitizenToEdit(citizen)
    setShowEditModal(true)
    setShowViewModal(false)
  }

  const handleAddRequest = (citizenId: string) => {
    setRequestFormCitizenId(citizenId)
    setShowRequestForm(true)
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 truncate flex items-center">
              <Shield className="h-8 w-8 mr-3 text-cyan-400 flex-shrink-0" />
              Στρατιωτικό Προσωπικό
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Διαχείριση και παρακολούθηση στρατιωτικού προσωπικού ανά ΕΣΣΟ
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={isLoading}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white px-4 sm:px-6 py-3 rounded-lg flex items-center justify-center transition-colors duration-200 touch-target font-medium w-full sm:w-auto shadow-lg"
          >
            <UserPlus className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>Προσθήκη Στρατιωτικού</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
          <div className="bg-slate-800 border border-cyan-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-cyan-500/20 flex-shrink-0">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-lg sm:text-2xl font-bold text-white truncate">
                  {stats.total.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Σύνολο</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-green-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-green-500/20 flex-shrink-0">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-lg sm:text-2xl font-bold text-white truncate">
                  {stats.completed.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Ολοκληρωμένα</div>
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

          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-blue-500/20 flex-shrink-0">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-lg sm:text-2xl font-bold text-white truncate">
                  {Object.keys(stats.byEsso).length}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">ΕΣΣΟ</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Αναζήτηση στρατιωτικού (όνομα, βαθμός, ΑΜ, ΕΣΣΟ, μονάδα)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <select
              value={essoFilter}
              onChange={(e) => setEssoFilter(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="">Όλα τα ΕΣΣΟ</option>
              {uniqueEssos.map(esso => (
                <option key={esso} value={esso}>{esso}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="">Όλες οι καταστάσεις</option>
              <option value="ΟΛΟΚΛΗΡΩΜΕΝΑ">Ολοκληρωμένα</option>
              <option value="ΕΚΚΡΕΜΗ">Εκκρεμή</option>
              <option value="ΜΗ ΟΛΟΚΛΗΡΩΜΕΝΑ">Μη Ολοκληρωμένα</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="esso">Ταξινόμηση: ΕΣΣΟ</option>
              <option value="name">Ταξινόμηση: Όνομα</option>
              <option value="date">Ταξινόμηση: Ημερομηνία</option>
            </select>

            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="grouped">Προβολή: Ομαδοποιημένα</option>
              <option value="list">Προβολή: Λίστα</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('')
                setEssoFilter('')
                setStatusFilter('')
                setSortBy('esso')
              }}
              className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm transition-colors flex items-center justify-center"
            >
              <X className="h-4 w-4 mr-2" />
              Καθαρισμός
            </button>
          </div>
        </div>
      </div>

      {/* Personnel List */}
      {viewMode === 'grouped' ? (
        // Grouped by ΕΣΣΟ
        <div className="space-y-6">
          {Object.keys(groupedByEsso).length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400 text-lg">
                {searchTerm || essoFilter || statusFilter
                  ? 'Δεν βρέθηκε στρατιωτικό προσωπικό με αυτά τα κριτήρια'
                  : 'Δεν υπάρχει εγγεγραμμένο στρατιωτικό προσωπικό'}
              </p>
            </div>
          ) : (
            Object.entries(groupedByEsso)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([esso, personnel]) => (
                <div key={esso} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                  {/* ΕΣΣΟ Header */}
                  <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-slate-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Shield className="h-6 w-6 text-cyan-400 mr-3" />
                        <h3 className="text-xl font-bold text-white">ΕΣΣΟ {esso}</h3>
                        <span className="ml-4 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-medium border border-cyan-500/30">
                          {personnel.length} {personnel.length === 1 ? 'άτομο' : 'άτομα'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Personnel Cards */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {personnel.map((person) => (
                      <div
                        key={person.id}
                        className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:border-cyan-500/50 transition-all duration-200"
                      >
                        {/* Person Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-white font-semibold text-base truncate">
                              {person.militaryRank && `${person.militaryRank} `}
                              {person.name} {person.surname}
                            </h4>
                            {person.militaryId && (
                              <p className="text-gray-400 text-sm font-mono">ΑΜ: {person.militaryId}</p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                              person.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ'
                                ? 'bg-green-500/20 text-green-400'
                                : person.status === 'ΕΚΚΡΕΜΗ'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {person.status}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 mb-4">
                          {person.militaryServiceUnit && (
                            <div className="flex items-center text-sm">
                              <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                              <span className="text-gray-300 truncate">{person.militaryServiceUnit}</span>
                            </div>
                          )}
                          {person.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                              <span className="text-gray-300">{person.phone}</span>
                            </div>
                          )}
                          {person.militaryWish && (
                            <div className="flex items-start text-sm">
                              <Star className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-300 line-clamp-2">{person.militaryWish}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewCitizen(person)}
                            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Προβολή
                          </button>
                          <button
                            onClick={() => {
                              setCitizenToEdit(person)
                              setShowEditModal(true)
                            }}
                            className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Επεξεργασία
                          </button>
                          <button
                            onClick={() => handleDeleteCitizen(person.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                              deleteConfirm === person.id
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                            }`}
                            title={deleteConfirm === person.id ? 'Επιβεβαίωση διαγραφής' : 'Διαγραφή'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      ) : (
        // List View
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/50 border-b border-slate-600">
                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Στοιχεία</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-medium">ΕΣΣΟ</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Μονάδα</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Επικοινωνία</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Κατάσταση</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersonnel.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                      {searchTerm || essoFilter || statusFilter
                        ? 'Δεν βρέθηκε στρατιωτικό προσωπικό με αυτά τα κριτήρια'
                        : 'Δεν υπάρχει εγγεγραμμένο στρατιωτικό προσωπικό'}
                    </td>
                  </tr>
                ) : (
                  filteredPersonnel.map((person) => (
                    <tr key={person.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <div className="text-white font-medium">
                            {person.militaryRank && `${person.militaryRank} `}
                            {person.name} {person.surname}
                          </div>
                          {person.militaryId && (
                            <div className="text-gray-400 text-sm font-mono">ΑΜ: {person.militaryId}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-sm font-medium border border-cyan-500/30">
                          {person.militaryEsso || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {person.militaryServiceUnit || '-'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-300 text-sm">
                          {person.phone && <div>{person.phone}</div>}
                          {person.email && <div className="text-xs text-gray-400">{person.email}</div>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            person.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ'
                              ? 'bg-green-500/20 text-green-400'
                              : person.status === 'ΕΚΚΡΕΜΗ'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {person.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewCitizen(person)}
                            className="text-cyan-400 hover:text-cyan-300 p-1 touch-target"
                            title="Προβολή"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCitizenToEdit(person)
                              setShowEditModal(true)
                            }}
                            className="text-green-400 hover:text-green-300 p-1 touch-target"
                            title="Επεξεργασία"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCitizen(person.id)}
                            className={`p-1 transition-colors touch-target ${
                              deleteConfirm === person.id
                                ? 'text-red-300 bg-red-500/20 rounded'
                                : 'text-red-400 hover:text-red-300'
                            }`}
                            title={deleteConfirm === person.id ? 'Επιβεβαίωση' : 'Διαγραφή'}
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
      )}

      {/* Modals */}
      <CitizenForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCitizen}
        mode="add"
        defaultMilitary={true}
      />

      <CitizenForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setCitizenToEdit(null)
        }}
        onSubmit={handleUpdateCitizen}
        initialData={citizenToEdit || undefined}
        mode="edit"
      />

      <CitizenViewModal
        citizen={selectedCitizen}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setSelectedCitizen(null)
        }}
        onEdit={handleEditFromView}
        onAddRequest={handleAddRequest}
      />

      {showRequestForm && requestFormCitizenId && (
        <RequestForm
          isOpen={showRequestForm}
          onClose={() => {
            setShowRequestForm(false)
            setRequestFormCitizenId(null)
          }}
          onSubmit={async (formData) => {
            // Handle request submission through RequestViewModalContainer
            setShowRequestForm(false)
            setRequestFormCitizenId(null)
          }}
          mode="add"
          prefilledCitizenId={requestFormCitizenId}
        />
      )}
    </div>
  )
}
