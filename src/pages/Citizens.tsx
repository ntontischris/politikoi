import { useState, useEffect } from 'react'
import { Users, Search, Filter, Edit, Trash2, Eye, UserPlus, AlertCircle, X, Phone, Mail, MapPin, Shield } from 'lucide-react'
import { useCitizenActions } from '../stores/citizenStore'
import { CitizenForm, type CitizenFormData } from '../components/forms/CitizenForm'
import { CitizenViewModal } from '../components/modals/CitizenViewModal'
import { RequestForm } from '../components/forms/RequestForm'
import { useRequestActions } from '../stores/requestStore'
import type { Citizen } from '../stores/citizenStore'


export function Citizens() {
  const {
    items: citizens,
    isLoading,
    error,
    loadItems,
    addItem: addCitizen,
    updateItem: updateCitizen,
    deleteItem: deleteCitizen,
    searchCitizens,
    getStats,
    setError
  } = useCitizenActions()

  const { loadItems: loadRequests } = useRequestActions()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('')
  const [militaryFilter, setMilitaryFilter] = useState<'' | 'military' | 'civilian'>('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [cityFilter, setCityFilter] = useState('')
  const [municipalityFilter, setMunicipalityFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null)
  const [citizenToEdit, setCitizenToEdit] = useState<Citizen | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, recent: 0 })
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestFormCitizenId, setRequestFormCitizenId] = useState<string | null>(null)

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadItems()
        const statsData = await getStats()
        setStats(statsData)
      } catch (error) {
        console.error('Error loading citizens:', error)
      }
    }
    loadData()
  }, [])

  // Handle search with debouncing
  useEffect(() => {
    const searchData = async () => {
      if (searchTerm.trim()) {
        try {
          await searchCitizens(searchTerm)
          const statsData = await getStats()
          setStats(statsData)
        } catch (error) {
          console.error('Error searching citizens:', error)
        }
      } else {
        // If search term is empty, reload all citizens
        try {
          await loadItems()
          const statsData = await getStats()
          setStats(statsData)
        } catch (error) {
          console.error('Error loading citizens:', error)
        }
      }
    }

    const debounceTimer = setTimeout(searchData, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  // Filter citizens locally after async operations
  const filteredCitizens = citizens.filter(citizen => {
    if (statusFilter && citizen.status !== statusFilter) return false
    if (militaryFilter === 'military' && !citizen.isMilitary) return false
    if (militaryFilter === 'civilian' && citizen.isMilitary) return false
    if (cityFilter && !citizen.region?.toLowerCase().includes(cityFilter.toLowerCase())) return false
    if (municipalityFilter && citizen.municipality && !citizen.municipality.toLowerCase().includes(municipalityFilter.toLowerCase())) return false
    return true
  })

  const handleAddCitizen = async (formData: CitizenFormData) => {
    try {
      await addCitizen({
        ...formData,
        status: 'ΕΚΚΡΕΜΗ' as const
      })
      setShowAddModal(false)
      // Refresh stats after adding
      const statsData = await getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Add citizen error:', error)
      throw error // Re-throw to keep form open
    }
  }

  const handleEditCitizen = async (formData: CitizenFormData) => {
    if (!citizenToEdit) {
      console.error('No citizen selected for editing')
      return
    }
    
    try {
      await updateCitizen(citizenToEdit.id, formData)
      setShowEditModal(false)
      setCitizenToEdit(null)
      // Refresh stats after updating
      const statsData = await getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Update citizen error:', error)
      throw error // Re-throw to keep form open
    }
  }

  const handleDeleteCitizen = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000) // Auto-cancel after 3 seconds
      return
    }

    try {
      await deleteCitizen(id)
      setDeleteConfirm(null)
      // Refresh stats after deleting
      const statsData = await getStats()
      setStats(statsData)
    } catch (error) {
      // Error is handled by the store
    }
  }

  const handleViewCitizen = (citizen: Citizen) => {
    setSelectedCitizen(citizen)
    setShowViewModal(true)
  }

  const handleEditFromView = (citizen: Citizen) => {
    setShowViewModal(false)
    setCitizenToEdit(citizen)
    setShowEditModal(true)
  }

  const handleOpenRequestForm = (citizenId: string) => {
    setRequestFormCitizenId(citizenId)
    setShowRequestForm(true)
  }

  const handleRequestSuccess = async () => {
    // Reload requests immediately when one is created
    try {
      await loadRequests()
    } catch (error) {
      console.error('Error reloading requests:', error)
    }
  }

  const handleCloseRequestForm = async () => {
    setShowRequestForm(false)
    setRequestFormCitizenId(null)
    // Reload data to refresh any requests that were added
    try {
      await loadItems()
      await loadRequests()
      const statsData = await getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error reloading data after request form close:', error)
    }
  }

  const convertCitizenToFormData = (citizen: Citizen): CitizenFormData => {
    return {
      // Required fields
      name: citizen.name,
      surname: citizen.surname,
      // Optional fields
      recommendation: citizen.recommendation || '',
      patronymic: citizen.patronymic || '',
      phone: citizen.phone || '',
      landline: citizen.landline || '',
      email: citizen.email || '',
      address: citizen.address || '',
      postalCode: citizen.postalCode || '',
      municipality: citizen.municipality || '',
      region: citizen.region || '',
      electoralDistrict: citizen.electoralDistrict || '',
      position: citizen.position || '',
      contactCategory: citizen.contactCategory || '',
      requestCategory: citizen.requestCategory || '',
      addedDate: citizen.addedDate || '',
      assignedCollaborator: citizen.assignedCollaborator || '',
      status: citizen.status || '',
      completionDate: citizen.completionDate || '',
      responsibleAuthority: citizen.responsibleAuthority || '',
      request: citizen.request || '',
      observations: citizen.observations || '',
      comment: citizen.comment || '',
      notes: citizen.notes || '',
      // Military fields
      isMilitary: citizen.isMilitary || false,
      militaryType: citizen.militaryType || '',
      // Conscript fields
      militaryEsso: citizen.militaryEsso || '',
      militaryAsm: citizen.militaryAsm || '',
      militaryDesire: citizen.militaryWish || '',
      militaryCenter: citizen.militaryCenter || '',
      militaryPresentationDate: citizen.militaryPresentationDate || '',
      militaryPlacement: citizen.militaryPlacement || '',
      militaryPlacementDate: citizen.militaryPlacementDate || '',
      militaryRequestDate: citizen.militaryRequestDate || '',
      militaryTransferType: citizen.militaryTransferType || '',
      militaryTransferDate: citizen.militaryTransferDate || '',
      militaryObservations: citizen.militaryObservations || '',
      militaryRequestStatus: citizen.militaryRequestStatus || '',
      // Career officer fields
      militaryRank: citizen.militaryRank || '',
      militaryRegistrationNumber: citizen.militaryRegistrationNumber || '',
      militaryServiceUnit: citizen.militaryServiceUnit || '',
      militaryCareerDesire: citizen.militaryCareerDesire || '',
      militaryCareerRequestDate: citizen.militaryCareerRequestDate || ''
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
              Διαχείριση Πολιτών
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Διαχείριση και παρακολούθηση όλων των εγγεγραμμένων πολιτών
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 sm:px-6 py-3 rounded-lg flex items-center justify-center transition-colors duration-200 touch-target font-medium w-full sm:w-auto"
          >
            <UserPlus className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>Νέος Πολίτης</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-blue-500/20 flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-lg sm:text-2xl font-bold text-white truncate">
                  {stats.total.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Σύνολο Πολιτών</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-green-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-green-500/20 flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-lg sm:text-2xl font-bold text-white truncate">
                  {stats.active.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Ενεργοί</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-red-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-red-500/20 flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-lg sm:text-2xl font-bold text-white truncate">
                  {stats.inactive.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Ανενεργοί</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-yellow-500/30 rounded-xl p-4 sm:p-6 xs:col-span-2 sm:col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 rounded-lg bg-yellow-500/20 flex-shrink-0">
                <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
              </div>
              <div className="text-right min-w-0 flex-1 ml-2">
                <div className="text-lg sm:text-2xl font-bold text-white truncate">
                  {stats.recent.toLocaleString('el-GR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">Νέοι (30 ημέρες)</div>
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
                placeholder="Αναζήτηση πολιτών..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3 sm:gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as '' | 'active' | 'inactive')}
                className="flex-1 sm:flex-none bg-slate-700 border border-slate-600 text-white rounded-lg px-3 sm:px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Όλες</option>
                <option value="active">Ενεργοί</option>
                <option value="inactive">Ανενεργοί</option>
              </select>
              <select
                value={militaryFilter}
                onChange={(e) => setMilitaryFilter(e.target.value as '' | 'military' | 'civilian')}
                className="flex-1 sm:flex-none bg-slate-700 border border-slate-600 text-white rounded-lg px-3 sm:px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Όλοι</option>
                <option value="civilian">Πολίτες</option>
                <option value="military">Στρατιωτικοί</option>
              </select>
              <button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-4 sm:px-6 py-3 rounded-lg flex items-center justify-center transition-colors duration-200 touch-target font-medium ${
                  showAdvancedFilters 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Φίλτρα</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-slate-600">
            <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Φίλτρο Πόλης
                </label>
                <input
                  type="text"
                  placeholder="Αναζήτηση πόλης..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Φίλτρο Δήμου
                </label>
                <input
                  type="text"
                  placeholder="Αναζήτηση δήμου..."
                  value={municipalityFilter}
                  onChange={(e) => setMunicipalityFilter(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="xs:col-span-1 sm:col-span-2 lg:col-span-1 flex items-end">
                <button
                  onClick={() => {
                    setCityFilter('')
                    setMunicipalityFilter('')
                    setStatusFilter('')
                    setMilitaryFilter('')
                    setSearchTerm('')
                  }}
                  className="w-full bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg transition-colors duration-200 touch-target font-medium text-sm"
                >
                  Καθαρισμός Φίλτρων
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Citizens List Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-t-xl px-4 sm:px-6 py-4 border-b">
        <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
          Λίστα Πολιτών ({filteredCitizens.length})
          {isLoading && (
            <span className="ml-3 inline-flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-400">Φόρτωση...</span>
            </span>
          )}
        </h2>
      </div>

      {/* Desktop Table View */}
      <div className="mobile-table-hidden bg-slate-800 border-x border-b border-slate-700 rounded-b-xl">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-1/5" />
            <col className="w-1/6" />
            <col className="w-1/5" />
            <col className="w-1/6" />
            <col className="w-1/6" />
            <col className="w-1/12" />
          </colgroup>
          <thead>
            <tr className="bg-slate-700/50">
              <th className="text-left py-4 px-4 text-gray-300 font-medium">Πολίτης & Τοποθεσία</th>
              <th className="text-left py-4 px-4 text-gray-300 font-medium">Επικοινωνία</th>
              <th className="text-left py-4 px-4 text-gray-300 font-medium">Αίτημα & Κατηγορία</th>
              <th className="text-left py-4 px-4 text-gray-300 font-medium">Συνεργάτης & Φορέας</th>
              <th className="text-left py-4 px-4 text-gray-300 font-medium">Κατάσταση & Ημ/νία</th>
              <th className="text-center py-4 px-4 text-gray-300 font-medium">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {filteredCitizens.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                  {searchTerm || statusFilter ? 'Δεν βρέθηκαν πολίτες με αυτά τα κριτήρια' : 'Δεν υπάρχουν εγγεγραμμένοι πολίτες'}
                </td>
              </tr>
            ) : (
              filteredCitizens.map((citizen) => (
                <tr key={citizen.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-white font-medium truncate">
                        {citizen.name} {citizen.surname}
                      </div>
                      {citizen.isMilitary && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3 text-green-400" />
                          <span className="text-xs text-green-400 font-medium">
                            {citizen.militaryType === 'career' ? 'ΜΟΝΙΜΟΣ' : 'ΣΤΡΑΤ'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {citizen.municipality && `${citizen.municipality} • `}
                      {citizen.region}
                    </div>
                    {citizen.afm && (
                      <div className="text-xs text-gray-500 font-mono">ΑΦΜ: {citizen.afm}</div>
                    )}
                    {citizen.isMilitary && citizen.militaryRank && (
                      <div className="text-xs text-blue-400">
                        {citizen.militaryRank} {citizen.militaryServiceUnit && `• ${citizen.militaryServiceUnit}`}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {citizen.phone && (
                      <div className="text-gray-300 text-sm truncate mb-1">📞 {citizen.phone}</div>
                    )}
                    {citizen.landline && (
                      <div className="text-gray-400 text-xs truncate mb-1">🏠 {citizen.landline}</div>
                    )}
                    {citizen.email && (
                      <div className="text-gray-400 text-xs truncate">✉️ {citizen.email}</div>
                    )}
                    {citizen.contactCategory && (
                      <div className="text-xs text-purple-400 mt-1">
                        {citizen.contactCategory}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {citizen.requestCategory && (
                      <div className={`text-xs font-medium mb-1 ${
                        citizen.requestCategory === 'ΑΙΤΗΜΑ' ? 'text-orange-400' :
                        citizen.requestCategory === 'GDPR + ΑΙΤΗΜΑ' ? 'text-red-400' :
                        citizen.requestCategory === 'GDPR' ? 'text-blue-400' : 'text-gray-400'
                      }`}>
                        {citizen.requestCategory}
                      </div>
                    )}
                    {citizen.request && (
                      <div className="text-gray-300 text-xs line-clamp-2 mb-1">
                        {citizen.request.substring(0, 80)}{citizen.request.length > 80 ? '...' : ''}
                      </div>
                    )}
                    {citizen.isMilitary && citizen.militaryWish && (
                      <div className="text-xs text-cyan-400">
                        🎯 {citizen.militaryWish.substring(0, 50)}{citizen.militaryWish.length > 50 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {citizen.assignedCollaborator && (
                      <div className="text-gray-300 text-sm font-medium mb-1">
                        👤 {citizen.assignedCollaborator}
                      </div>
                    )}
                    {citizen.responsibleAuthority && (
                      <div className="text-gray-400 text-xs truncate">
                        🏛️ {citizen.responsibleAuthority}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        citizen.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : citizen.status === 'ΕΚΚΡΕΜΗ'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {citizen.status || 'ΕΚΚΡΕΜΗ'}
                      </span>
                    </div>
                    {citizen.addedDate && (
                      <div className="text-xs text-gray-400">
                        📅 {new Date(citizen.addedDate).toLocaleDateString('el-GR')}
                      </div>
                    )}
                    {citizen.completionDate && (
                      <div className="text-xs text-green-400">
                        ✅ {new Date(citizen.completionDate).toLocaleDateString('el-GR')}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => handleViewCitizen(citizen)}
                        className="text-blue-400 hover:text-blue-300 p-1 touch-target"
                        title="Προβολή"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setCitizenToEdit(citizen)
                          setShowEditModal(true)
                        }}
                        className="text-green-400 hover:text-green-300 p-1 touch-target"
                        title="Επεξεργασία"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCitizen(citizen.id)}
                        className={`p-1 transition-colors touch-target ${
                          deleteConfirm === citizen.id
                            ? 'text-red-300 bg-red-500/20 rounded'
                            : 'text-red-400 hover:text-red-300'
                        }`}
                        title={deleteConfirm === citizen.id ? 'Κάντε κλικ για επιβεβαίωση' : 'Διαγραφή'}
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
        {filteredCitizens.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-500" />
            <p className="text-sm">
              {searchTerm || statusFilter ? 'Δεν βρέθηκαν πολίτες με αυτά τα κριτήρια' : 'Δεν υπάρχουν εγγεγραμμένοι πολίτες'}
            </p>
          </div>
        ) : (
          filteredCitizens.map((citizen) => (
            <div key={citizen.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold text-base truncate">
                      {citizen.name} {citizen.surname}
                    </h3>
                    {citizen.isMilitary && (
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-green-400" />
                        <span className="text-xs text-green-400 font-medium">
                          {citizen.militaryType === 'career' ? 'ΜΟΝΙΜΟΣ' : 'ΣΤΡΑΤ'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm mb-1">
                    {citizen.municipality && `${citizen.municipality} • `}
                    {citizen.region}
                  </div>
                  {citizen.afm && (
                    <div className="text-gray-500 text-xs font-mono">ΑΦΜ: {citizen.afm}</div>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                  citizen.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : citizen.status === 'ΕΚΚΡΕΜΗ'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {citizen.status || 'ΕΚΚΡΕΜΗ'}
                </span>
              </div>

              {/* Military Info */}
              {citizen.isMilitary && citizen.militaryRank && (
                <div className="mb-3 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                  <div className="text-blue-400 text-sm font-medium">
                    {citizen.militaryRank} {citizen.militaryServiceUnit && `• ${citizen.militaryServiceUnit}`}
                  </div>
                  {citizen.militaryWish && (
                    <div className="text-cyan-400 text-xs mt-1">
                      🎯 {citizen.militaryWish}
                    </div>
                  )}
                </div>
              )}

              {/* Contact Details */}
              <div className="space-y-2 mb-3">
                {citizen.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-gray-300">{citizen.phone}</span>
                  </div>
                )}
                {citizen.landline && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-400 mr-2">🏠</span>
                    <span className="text-gray-300">{citizen.landline}</span>
                  </div>
                )}
                {citizen.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-gray-300 truncate">{citizen.email}</span>
                  </div>
                )}
              </div>

              {/* Request & Category */}
              {(citizen.requestCategory || citizen.request) && (
                <div className="mb-3 p-2 bg-slate-600/50 rounded">
                  {citizen.requestCategory && (
                    <div className={`text-xs font-medium mb-1 ${
                      citizen.requestCategory === 'ΑΙΤΗΜΑ' ? 'text-orange-400' :
                      citizen.requestCategory === 'GDPR + ΑΙΤΗΜΑ' ? 'text-red-400' :
                      citizen.requestCategory === 'GDPR' ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      📋 {citizen.requestCategory}
                    </div>
                  )}
                  {citizen.request && (
                    <div className="text-gray-300 text-xs">
                      {citizen.request.substring(0, 120)}{citizen.request.length > 120 ? '...' : ''}
                    </div>
                  )}
                </div>
              )}

              {/* Assignment & Dates */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                {citizen.assignedCollaborator && (
                  <div>
                    <span className="text-gray-400">👤 Συνεργάτης:</span>
                    <div className="text-gray-300 font-medium">{citizen.assignedCollaborator}</div>
                  </div>
                )}
                {citizen.addedDate && (
                  <div>
                    <span className="text-gray-400">📅 Προστέθηκε:</span>
                    <div className="text-gray-300">{new Date(citizen.addedDate).toLocaleDateString('el-GR')}</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleViewCitizen(citizen)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target flex items-center"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Προβολή
                </button>
                <button
                  onClick={() => {
                    setCitizenToEdit(citizen)
                    setShowEditModal(true)
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target flex items-center"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Επεξεργασία
                </button>
                <button
                  onClick={() => handleDeleteCitizen(citizen.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target flex items-center ${
                    deleteConfirm === citizen.id
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                  }`}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {deleteConfirm === citizen.id ? 'Επιβεβαίωση' : 'Διαγραφή'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <CitizenForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCitizen}
        mode="add"
      />

      <CitizenForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setCitizenToEdit(null)
        }}
        onSubmit={handleEditCitizen}
        initialData={citizenToEdit ? convertCitizenToFormData(citizenToEdit) : undefined}
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
        onRequestFormOpen={handleOpenRequestForm}
      />

      {/* Global RequestForm */}
      {showRequestForm && requestFormCitizenId && (
        <RequestForm
          defaultCitizenId={requestFormCitizenId}
          onClose={handleCloseRequestForm}
          onSuccess={handleRequestSuccess}
          mode="add"
        />
      )}
    </div>
  )
}