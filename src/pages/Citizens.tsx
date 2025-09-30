import { useState, useEffect } from 'react'
import { Users, Search, Filter, Edit, Trash2, Eye, UserPlus, AlertCircle, X, Phone, Mail, MapPin, Shield, ChevronDown, SortAsc, Grid3X3, List, Activity } from 'lucide-react'
import { useRealtimeCitizenStore } from '../stores/realtimeCitizenStore'
import { CitizenForm, type CitizenFormData } from '../components/forms/CitizenForm'
import { CitizenViewModal } from '../components/modals/CitizenViewModal'
import { RequestForm } from '../components/forms/RequestForm'
import { RequestViewModalContainer } from '../components/modals/RequestViewModalContainer'
import { useRequestActions } from '../stores/realtimeRequestStore'
import { useResponsive, useTouchDevice } from '../hooks/useResponsive'
import type { Citizen } from '../stores/realtimeCitizenStore'


export function Citizens() {
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

  // Enhanced state management
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

  // New responsive-specific states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(isMobile ? 'list' : 'grid')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Load data on component mount and calculate initial stats
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadItems()
      } catch (error) {
        console.error('Error loading citizens:', error)
      }
    }
    loadData()
  }, [])

  // Calculate stats whenever citizens change
  useEffect(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))

    setStats({
      total: citizens.length,
      active: citizens.filter(c => c.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ').length,
      inactive: citizens.filter(c => c.status === 'ΜΗ ΟΛΟΚΛΗΡΩΜΕΝΑ').length,
      recent: citizens.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length
    })
  }, [citizens])

  // Handle search with debouncing - now client-side filtering
  useEffect(() => {
    // No more server-side search - filtering happens in filteredCitizens
    // Just update stats when search term changes
    const updateStats = () => {
      const filtered = citizens.filter(citizen => {
        if (!searchTerm.trim()) return true
        const search = searchTerm.toLowerCase()
        return citizen.name.toLowerCase().includes(search) ||
               citizen.surname.toLowerCase().includes(search) ||
               citizen.phone?.toLowerCase().includes(search) ||
               citizen.email?.toLowerCase().includes(search) ||
               citizen.afm?.toLowerCase().includes(search)
      })

      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))

      setStats({
        total: filtered.length,
        active: filtered.filter(c => c.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ').length,
        inactive: filtered.filter(c => c.status === 'ΜΗ ΟΛΟΚΛΗΡΩΜΕΝΑ').length,
        recent: filtered.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length
      })
    }

    const debounceTimer = setTimeout(updateStats, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, citizens])

  // Filter citizens locally with search term and filters
  const filteredCitizens = citizens.filter(citizen => {
    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      const matchesSearch = citizen.name.toLowerCase().includes(search) ||
                           citizen.surname.toLowerCase().includes(search) ||
                           citizen.phone?.toLowerCase().includes(search) ||
                           citizen.email?.toLowerCase().includes(search) ||
                           citizen.afm?.toLowerCase().includes(search)
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter === 'active' && citizen.status !== 'ΟΛΟΚΛΗΡΩΜΕΝΑ') return false
    if (statusFilter === 'inactive' && citizen.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ') return false

    // Military filter
    if (militaryFilter === 'military' && !citizen.isMilitary) return false
    if (militaryFilter === 'civilian' && citizen.isMilitary) return false

    // Location filters
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
      // Stats will be updated automatically via useEffect
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
      // Stats will be updated automatically via useEffect
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
      // Stats will be updated automatically via useEffect
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
      await loadItems() // This will automatically update stats via useEffect
      await loadRequests()
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
    <div className="container-responsive py-4 sm:py-6 lg:py-8 safe-y">
      {/* Enhanced Error Alert */}
      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl flex items-center backdrop-blur-sm animate-slide-in">
          <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
          <span className="flex-1 text-fluid-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-3 text-red-400 hover:text-red-300 touch-target-lg flex items-center justify-center rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Enhanced Responsive Header */}
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-fluid-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Διαχείριση Πολιτών
            </h1>
            <p className="text-fluid-sm text-gray-400 max-w-2xl">
              Διαχείριση και παρακολούθηση όλων των εγγεγραμμένων πολιτών
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View mode toggle - Desktop only */}
            {!isMobile && (
              <div className="flex items-center bg-slate-800/70 rounded-xl border border-slate-700/50 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors touch-target ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                  title="Grid View"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors touch-target ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Add Citizen Button */}
            <button
              onClick={() => setShowAddModal(true)}
              disabled={isLoading}
              className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 sm:px-6 py-3 rounded-xl flex items-center justify-center transition-all duration-200 touch-target-lg font-medium w-full sm:w-auto shadow-lg hover:shadow-xl active:scale-[0.98] group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              <UserPlus className="h-5 w-5 mr-2 flex-shrink-0 z-10" />
              <span className="z-10">{isMobile ? 'Νέος' : 'Νέος Πολίτης'}</span>
            </button>
          </div>
        </div>

        {/* Ultra-Responsive Stats Cards */}
        <div className="grid grid-auto-fit gap-4 mb-6 sm:mb-8">
          {[
            {
              title: 'Σύνολο Πολιτών',
              shortTitle: 'Σύνολο',
              value: stats.total,
              icon: Users,
              color: 'text-blue-400',
              bgColor: 'bg-blue-500/20',
              borderColor: 'border-blue-500/30',
              gradientFrom: 'from-blue-500',
              gradientTo: 'to-cyan-500'
            },
            {
              title: 'Ενεργοί Πολίτες',
              shortTitle: 'Ενεργοί',
              value: stats.active,
              icon: Activity,
              color: 'text-green-400',
              bgColor: 'bg-green-500/20',
              borderColor: 'border-green-500/30',
              gradientFrom: 'from-green-500',
              gradientTo: 'to-emerald-500'
            },
            {
              title: 'Ανενεργοί Πολίτες',
              shortTitle: 'Ανενεργοί',
              value: stats.inactive,
              icon: Users,
              color: 'text-red-400',
              bgColor: 'bg-red-500/20',
              borderColor: 'border-red-500/30',
              gradientFrom: 'from-red-500',
              gradientTo: 'to-pink-500'
            },
            {
              title: 'Νέοι (30 ημέρες)',
              shortTitle: 'Νέοι',
              value: stats.recent,
              icon: UserPlus,
              color: 'text-yellow-400',
              bgColor: 'bg-yellow-500/20',
              borderColor: 'border-yellow-500/30',
              gradientFrom: 'from-yellow-500',
              gradientTo: 'to-orange-500'
            }
          ].map((stat, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden bg-slate-800/70 backdrop-blur-sm border ${stat.borderColor} rounded-2xl p-4 sm:p-5 lg:p-6 hover:bg-slate-700/80 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/50 hover:scale-[1.02]`}
            >
              {/* Gradient background overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradientFrom} ${stat.gradientTo} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-bold text-white leading-none">
                    {stat.value.toLocaleString('el-GR')}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400 font-medium">
                    {isMobile && stat.shortTitle ? stat.shortTitle : stat.title}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
        zIndex={40}
      />

      {/* Global RequestForm */}
      {showRequestForm && requestFormCitizenId && (
        <RequestForm
          defaultCitizenId={requestFormCitizenId}
          onClose={handleCloseRequestForm}
          onSuccess={handleRequestSuccess}
          mode="add"
          zIndex={9999}
        />
      )}

      {/* Global RequestViewModalContainer */}
      <RequestViewModalContainer />
    </div>
  )
}
