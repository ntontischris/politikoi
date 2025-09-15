import { create } from 'zustand'
import { citizensService, type Citizen as DBCitizen, type CitizenInput } from '../services/citizensService'

// Frontend interface that maps to backend data
export interface Citizen {
  id: string
  name: string
  surname: string
  afm: string
  phone: string
  landline?: string
  email?: string
  address?: string
  city: string
  postalCode?: string
  municipality?: string
  electoralDistrict?: string
  notes?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  // Military fields
  is_military?: boolean
  military_rank?: string
  military_service_unit?: string
  military_id?: string
  military_esso?: string
  military_esso_year?: string
  military_esso_letter?: 'Α' | 'Β' | 'Γ' | 'Δ' | 'Ε' | 'ΣΤ'
  military_wish?: string
  military_status?: 'pending' | 'approved' | 'rejected' | 'completed'
  military_send_date?: string
  military_comments?: string
}

interface CitizenStore {
  items: Citizen[]
  isLoading: boolean
  error: string | null
  
  // Actions
  loadItems: () => Promise<void>
  addItem: (item: Omit<Citizen, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateItem: (id: string, item: Partial<Citizen>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  searchCitizens: (searchTerm: string) => Promise<void>
  getStats: () => Promise<{ total: number; active: number; inactive: number; recent: number }>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  getItem: (id: string) => Citizen | undefined
}

// Helper function to transform database citizen to frontend citizen
const transformDBCitizen = (dbCitizen: DBCitizen): Citizen => ({
  id: dbCitizen.id,
  name: dbCitizen.name,
  surname: dbCitizen.surname,
  afm: dbCitizen.afm || '',
  phone: dbCitizen.mobile_phone || '',
  landline: dbCitizen.landline_phone || undefined,
  email: dbCitizen.email || undefined,
  address: dbCitizen.address || undefined,
  city: dbCitizen.area || '',
  postalCode: dbCitizen.postal_code || undefined,
  municipality: dbCitizen.municipality || undefined,
  electoralDistrict: dbCitizen.electoral_district || undefined,
  notes: dbCitizen.notes || undefined,
  status: (dbCitizen.status as 'active' | 'inactive') || 'active',
  created_at: dbCitizen.created_at,
  updated_at: dbCitizen.updated_at,
  // Military fields
  is_military: dbCitizen.is_military || false,
  military_rank: dbCitizen.military_rank || undefined,
  military_service_unit: dbCitizen.military_service_unit || undefined,
  military_id: dbCitizen.military_id || undefined,
  military_esso: dbCitizen.military_esso || undefined,
  military_esso_year: dbCitizen.military_esso_year || undefined,
  military_esso_letter: dbCitizen.military_esso_letter || undefined,
  military_wish: dbCitizen.military_wish || undefined,
  military_status: dbCitizen.military_status || undefined,
  military_send_date: dbCitizen.military_send_date || undefined,
  military_comments: dbCitizen.military_comments || undefined
})

// Helper function to transform frontend citizen to database input
const transformToDBInput = (citizen: Partial<Citizen>): Partial<CitizenInput> => ({
  name: citizen.name,
  surname: citizen.surname,
  afm: citizen.afm?.trim() || null,
  mobile_phone: citizen.phone?.trim() || null,
  landline_phone: citizen.landline?.trim() || null,
  email: citizen.email?.trim() || null,
  address: citizen.address?.trim() || null,
  area: citizen.city?.trim() || null,
  postal_code: citizen.postalCode?.trim() || null,
  municipality: citizen.municipality?.trim() || null,
  electoral_district: citizen.electoralDistrict?.trim() || null,
  notes: citizen.notes?.trim() || null,
  status: citizen.status || 'active',
  // Military fields
  is_military: citizen.is_military || false,
  military_rank: citizen.military_rank?.trim() || null,
  military_service_unit: citizen.military_service_unit?.trim() || null,
  military_id: citizen.military_id?.trim() || null,
  military_esso: citizen.military_esso?.trim() || null,
  military_esso_year: citizen.military_esso_year?.trim() || null,
  military_esso_letter: citizen.military_esso_letter || null,
  military_wish: citizen.military_wish?.trim() || null,
  military_status: citizen.military_status || null,
  military_send_date: citizen.military_send_date || null,
  military_comments: citizen.military_comments?.trim() || null
})

export const useCitizenStore = create<CitizenStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  // Load all citizens
  loadItems: async () => {
    console.log('🔄 Starting to load citizens...')
    set({ isLoading: true, error: null })
    try {
      console.log('📡 Calling citizensService.getAllCitizens()...')
      const dbCitizens = await citizensService.getAllCitizens()
      console.log('✅ Got citizens from DB:', dbCitizens.length)
      
      const citizens = dbCitizens.map(transformDBCitizen)
      console.log('🔄 Transformed citizens:', citizens.length)
      
      set({ items: citizens, isLoading: false })
      console.log('✅ Citizens loaded successfully')
    } catch (error) {
      console.error('❌ Error loading citizens:', error)
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Σφάλμα φόρτωσης πολιτών'
      })
    }
  },

  // Add new citizen
  addItem: async (citizenData) => {
    set({ isLoading: true, error: null })
    try {
      const dbInput = transformToDBInput(citizenData)
      const newDBCitizen = await citizensService.createCitizen(dbInput)
      const newCitizen = transformDBCitizen(newDBCitizen)
      
      set(state => ({
        items: [newCitizen, ...state.items],
        isLoading: false
      }))
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Σφάλμα προσθήκης πολίτη'
      })
      throw error
    }
  },

  // Update citizen
  updateItem: async (id, citizenData) => {
    set({ isLoading: true, error: null })
    try {
      const dbInput = transformToDBInput(citizenData)
      const updatedDBCitizen = await citizensService.updateCitizen(id, dbInput)
      const updatedCitizen = transformDBCitizen(updatedDBCitizen)
      
      set(state => ({
        items: state.items.map(item => 
          item.id === id ? updatedCitizen : item
        ),
        isLoading: false
      }))
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Σφάλμα ενημέρωσης πολίτη'
      })
      throw error
    }
  },

  // Delete citizen
  deleteItem: async (id) => {
    console.log('🗑️ CitizenStore: Starting deletion for ID:', id)
    set({ isLoading: true, error: null })
    try {
      console.log('📡 CitizenStore: Calling Supabase delete...')
      await citizensService.deleteCitizen(id)
      console.log('✅ CitizenStore: Supabase deletion successful, updating local state...')
      set(state => ({
        items: state.items.filter(item => item.id !== id),
        isLoading: false
      }))
      console.log('✅ CitizenStore: Local state updated successfully')
    } catch (error) {
      console.error('❌ CitizenStore: Deletion failed:', error)
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Σφάλμα διαγραφής πολίτη'
      })
      throw error
    }
  },

  // Search citizens
  searchCitizens: async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return get().loadItems()
    }
    
    set({ isLoading: true, error: null })
    try {
      const searchResults = await citizensService.searchCitizens(searchTerm)
      const citizens = searchResults.map(transformDBCitizen)
      set({ items: citizens, isLoading: false })
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Σφάλμα αναζήτησης'
      })
    }
  },

  // Get statistics
  getStats: async () => {
    try {
      const stats = await citizensService.getCitizensStats()
      return stats
    } catch (error) {
      console.error('Error getting citizen stats:', error)
      
      // Fallback to local calculation
      const citizens = get().items
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))

      return {
        total: citizens.length,
        active: citizens.filter(c => c.status === 'active').length,
        inactive: citizens.filter(c => c.status === 'inactive').length,
        recent: citizens.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length
      }
    }
  },

  // Utilities
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  getItem: (id) => get().items.find(item => item.id === id)
}))

// Additional citizen-specific methods
export const useCitizenActions = () => {
  const store = useCitizenStore()

  // Add military-specific methods
  const getMilitaryPersonnel = () => {
    return store.items.filter(citizen => citizen.is_military)
  }

  const searchMilitaryPersonnel = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      await store.loadItems()
      return
    }

    store.setLoading(true)
    store.setError(null)
    try {
      const searchResults = await citizensService.searchMilitaryPersonnel(searchTerm)
      const citizens = searchResults.map(transformDBCitizen)
      useCitizenStore.setState({
        items: citizens,
        isLoading: false
      })
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Σφάλμα αναζήτησης στρατιωτικού προσωπικού')
      store.setLoading(false)
    }
  }

  const getMilitaryPersonnelByEsso = async (essoYear?: string, essoLetter?: string) => {
    store.setLoading(true)
    store.setError(null)
    try {
      const results = await citizensService.getMilitaryPersonnelByEsso(essoYear, essoLetter)
      const citizens = results.map(transformDBCitizen)
      useCitizenStore.setState({
        items: citizens,
        isLoading: false
      })
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Σφάλμα φόρτωσης ΕΣΣΟ')
      store.setLoading(false)
    }
  }

  const getMilitaryEssoYears = async () => {
    try {
      return await citizensService.getMilitaryEssoYears()
    } catch (error) {
      console.error('Error getting ESSO years:', error)
      return []
    }
  }

  const getMilitaryStats = async () => {
    try {
      return await citizensService.getMilitaryStats()
    } catch (error) {
      console.error('Error getting military stats:', error)

      // Fallback to local calculation
      const militaryPersonnel = getMilitaryPersonnel()
      const stats = {
        total: militaryPersonnel.length,
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        by_year: {} as Record<string, number>
      }

      militaryPersonnel.forEach(person => {
        const status = person.military_status || 'pending'
        stats[status as keyof typeof stats]++

        if (person.military_esso_year) {
          stats.by_year[person.military_esso_year] = (stats.by_year[person.military_esso_year] || 0) + 1
        }
      })

      return stats
    }
  }

  const getEssoGroups = () => {
    const military = getMilitaryPersonnel()
    const groups: Record<string, Citizen[]> = {}

    military.forEach(person => {
      if (person.military_esso) {
        const key = `${person.military_esso_year || ''}-${person.military_esso_letter || ''}`
        if (!groups[key]) {
          groups[key] = []
        }
        groups[key].push(person)
      }
    })

    return groups
  }

  return {
    ...store,
    // Military-specific methods
    getMilitaryPersonnel,
    searchMilitaryPersonnel,
    getMilitaryPersonnelByEsso,
    getMilitaryEssoYears,
    getMilitaryStats,
    getEssoGroups
  }
}

// Convenience hook for single citizen
export const useCitizen = (id?: string) => {
  const store = useCitizenStore()
  
  return {
    citizen: id ? store.getItem(id) : null,
    isLoading: store.isLoading,
    error: store.error
  }
}