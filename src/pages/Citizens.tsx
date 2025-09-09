import { useState, useEffect } from 'react'
import { Users, Search, Filter, Edit, Trash2, Eye, UserPlus, AlertCircle, X } from 'lucide-react'
import { useCitizenStore } from '../stores/citizenStore'
import { CitizenForm } from '../components/forms/CitizenForm'
import { CitizenViewModal } from '../components/modals/CitizenViewModal'
import type { Citizen } from '../stores/citizenStore'

interface CitizenFormData {
  name: string
  surname: string
  afm: string
  phone: string
  email: string
  address: string
  city: string
  postalCode: string
  municipality: string
  electoralDistrict: string
  notes: string
}

export function Citizens() {
  const { 
    citizens,
    isLoading, 
    error, 
    loadCitizens,
    addCitizen, 
    updateCitizen, 
    deleteCitizen, 
    searchCitizens, 
    getStats,
    setError 
  } = useCitizenStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [cityFilter, setCityFilter] = useState('')
  const [municipalityFilter, setMunicipalityFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, recent: 0 })

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadCitizens()
        const statsData = await getStats()
        setStats(statsData)
      } catch (error) {
        console.error('Error loading citizens:', error)
      }
    }
    loadData()
  }, [loadCitizens, getStats])

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
          await loadCitizens()
          const statsData = await getStats()
          setStats(statsData)
        } catch (error) {
          console.error('Error loading citizens:', error)
        }
      }
    }

    const debounceTimer = setTimeout(searchData, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, searchCitizens, loadCitizens, getStats])

  // Filter citizens locally after async operations
  const filteredCitizens = citizens.filter(citizen => {
    if (statusFilter && citizen.status !== statusFilter) return false
    if (cityFilter && !citizen.city?.toLowerCase().includes(cityFilter.toLowerCase())) return false
    if (municipalityFilter && citizen.municipality && !citizen.municipality.toLowerCase().includes(municipalityFilter.toLowerCase())) return false
    return true
  })

  const handleAddCitizen = async (formData: CitizenFormData) => {
    try {
      await addCitizen({
        ...formData,
        status: 'active' as const
      })
      setShowAddModal(false)
      // Refresh stats after adding
      const statsData = await getStats()
      setStats(statsData)
    } catch (error) {
      // Error is handled by the store
    }
  }

  const handleEditCitizen = async (formData: CitizenFormData) => {
    if (!selectedCitizen) return
    
    try {
      await updateCitizen(selectedCitizen.id, formData)
      setShowEditModal(false)
      setSelectedCitizen(null)
      // Refresh stats after updating
      const statsData = await getStats()
      setStats(statsData)
    } catch (error) {
      // Error is handled by the store
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
    setSelectedCitizen(citizen)
    setShowEditModal(true)
    setShowViewModal(false)
  }

  const convertCitizenToFormData = (citizen: Citizen): CitizenFormData => ({
    name: citizen.name,
    surname: citizen.surname,
    afm: citizen.afm,
    phone: citizen.phone,
    email: citizen.email,
    address: citizen.address,
    city: citizen.city,
    postalCode: citizen.postalCode || '',
    municipality: citizen.municipality || '',
    electoralDistrict: citizen.electoralDistrict || '',
    notes: citizen.notes || ''
  })

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
              Διαχείριση Πολιτών
            </h1>
            <p className="text-gray-400">
              Διαχείριση και παρακολούθηση όλων των εγγεγραμμένων πολιτών
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg flex items-center transition-colors duration-200"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Νέος Πολίτης
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {stats.total.toLocaleString('el-GR')}
                </div>
                <div className="text-sm text-gray-400">Σύνολο Πολιτών</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-green-500/20">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {stats.active.toLocaleString('el-GR')}
                </div>
                <div className="text-sm text-gray-400">Ενεργοί</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-red-500/20">
                <Users className="h-6 w-6 text-red-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {stats.inactive.toLocaleString('el-GR')}
                </div>
                <div className="text-sm text-gray-400">Ανενεργοί</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <UserPlus className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {stats.recent.toLocaleString('el-GR')}
                </div>
                <div className="text-sm text-gray-400">Νέοι (30 ημέρες)</div>
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
              placeholder="Αναζήτηση πολιτών (όνομα, επώνυμο, ΑΦΜ, email, τηλέφωνο)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | 'active' | 'inactive')}
            className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Όλες οι καταστάσεις</option>
            <option value="active">Ενεργοί</option>
            <option value="inactive">Ανενεργοί</option>
          </select>
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-6 py-3 rounded-lg flex items-center transition-colors duration-200 ${
              showAdvancedFilters 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Φίλτρα
          </button>
        </div>
        
        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-slate-600">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Φίλτρο Πόλης
                </label>
                <input
                  type="text"
                  placeholder="Αναζήτηση πόλης..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setCityFilter('')
                    setMunicipalityFilter('')
                    setStatusFilter('')
                    setSearchTerm('')
                  }}
                  className="w-full bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Καθαρισμός Φίλτρων
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Citizens Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            Λίστα Πολιτών ({filteredCitizens.length})
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
                <th className="text-left py-4 px-6 text-gray-300 font-medium">ΑΦΜ</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Email</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Τηλέφωνο</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Πόλη</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Κατάσταση</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {filteredCitizens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                    {searchTerm || statusFilter ? 'Δεν βρέθηκαν πολίτες με αυτά τα κριτήρια' : 'Δεν υπάρχουν εγγεγραμμένοι πολίτες'}
                  </td>
                </tr>
              ) : (
                filteredCitizens.map((citizen) => (
                  <tr key={citizen.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="text-white font-medium">
                        {citizen.name} {citizen.surname}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-300">{citizen.afm}</td>
                    <td className="py-4 px-6 text-gray-300">{citizen.email || '-'}</td>
                    <td className="py-4 px-6 text-gray-300">{citizen.phone}</td>
                    <td className="py-4 px-6 text-gray-300">{citizen.city}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        citizen.status === 'active' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {citizen.status === 'active' ? 'Ενεργός' : 'Ανενεργός'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewCitizen(citizen)}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Προβολή"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedCitizen(citizen)
                            setShowEditModal(true)
                          }}
                          className="text-green-400 hover:text-green-300 p-1"
                          title="Επεξεργασία"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCitizen(citizen.id)}
                          className={`p-1 transition-colors ${
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
          setSelectedCitizen(null)
        }}
        onSubmit={handleEditCitizen}
        initialData={selectedCitizen ? convertCitizenToFormData(selectedCitizen) : undefined}
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
      />
    </div>
  )
}