import { create } from 'zustand'
import { citizensService, type Citizen as DBCitizen, type CitizenInput } from '../services/citizensService'

// Frontend interface that maps to backend data
export interface Citizen {
  id: string
  // Required fields
  name: string
  surname: string
  // Optional fields
  afm?: string
  recommendation?: string
  patronymic?: string
  phone?: string
  landline?: string
  email?: string
  address?: string
  postalCode?: string
  municipality?: string
  region?: string
  electoralDistrict?: string
  position?: string
  contactCategory?: string
  requestCategory?: string
  addedDate?: string
  assignedCollaborator?: string
  status?: string
  completionDate?: string
  responsibleAuthority?: string
  request?: string
  observations?: string
  comment?: string
  notes?: string
  // Military fields
  isMilitary?: boolean
  militaryType?: 'conscript' | 'career' | ''
  militaryRank?: string
  militaryServiceUnit?: string
  militaryId?: string
  militaryEsso?: string
  militaryEssoYear?: string
  militaryEssoLetter?: 'Α' | 'Β' | 'Γ' | 'Δ' | 'Ε' | 'ΣΤ'
  militaryWish?: string
  militaryStatus?: 'pending' | 'approved' | 'rejected' | 'completed'
  militarySendDate?: string
  militaryComments?: string
  // New extended military fields
  militaryAsm?: string
  militaryCenter?: string
  militaryPresentationDate?: string
  militaryPlacement?: string
  militaryPlacementDate?: string
  militaryRequestDate?: string
  militaryTransferType?: 'μετάθεση' | 'απόσπαση' | ''
  militaryTransferDate?: string
  militaryObservations?: string
  militaryRequestStatus?: 'ολοκληρωμένο' | 'ενημερώθηκε' | 'εκκρεμές' | ''
  militaryRegistrationNumber?: string
  militaryCareerDesire?: string
  militaryCareerRequestDate?: string
  created_at: string
  updated_at: string
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
  // Required fields
  name: dbCitizen.name,
  surname: dbCitizen.surname,
  // Optional fields
  afm: dbCitizen.afm || undefined,
  recommendation: dbCitizen.recommendation || undefined,
  patronymic: dbCitizen.patronymic || undefined,
  phone: dbCitizen.phone || undefined,
  landline: dbCitizen.landline || undefined,
  email: dbCitizen.email || undefined,
  address: dbCitizen.address || undefined,
  postalCode: dbCitizen.postalCode || undefined,
  municipality: dbCitizen.municipality || undefined,
  region: dbCitizen.region || undefined,
  electoralDistrict: dbCitizen.electoralDistrict || undefined,
  position: dbCitizen.position || undefined,
  contactCategory: dbCitizen.contactCategory || undefined,
  requestCategory: dbCitizen.requestCategory || undefined,
  addedDate: dbCitizen.addedDate || undefined,
  assignedCollaborator: dbCitizen.assignedCollaborator || undefined,
  status: dbCitizen.status || undefined,
  completionDate: dbCitizen.completionDate || undefined,
  responsibleAuthority: dbCitizen.responsibleAuthority || undefined,
  request: dbCitizen.request || undefined,
  observations: dbCitizen.observations || undefined,
  comment: dbCitizen.comment || undefined,
  notes: dbCitizen.notes || undefined,
  // Military fields
  isMilitary: dbCitizen.isMilitary || false,
  militaryType: (dbCitizen.militaryType as 'conscript' | 'career' | '') || '',
  militaryRank: dbCitizen.militaryRank || undefined,
  militaryServiceUnit: dbCitizen.militaryServiceUnit || undefined,
  militaryId: dbCitizen.military_id || undefined,
  militaryEsso: dbCitizen.militaryEsso || undefined,
  militaryEssoYear: dbCitizen.military_esso_year || undefined,
  militaryEssoLetter: dbCitizen.military_esso_letter || undefined,
  militaryWish: dbCitizen.militaryDesire || undefined,
  militaryStatus: dbCitizen.military_status || undefined,
  militarySendDate: dbCitizen.military_send_date || undefined,
  militaryComments: dbCitizen.military_comments || undefined,
  // Extended military fields
  militaryAsm: dbCitizen.military_asm || undefined,
  militaryCenter: dbCitizen.military_center || undefined,
  militaryPresentationDate: dbCitizen.military_presentation_date || undefined,
  militaryPlacement: dbCitizen.military_placement || undefined,
  militaryPlacementDate: dbCitizen.military_placement_date || undefined,
  militaryRequestDate: dbCitizen.military_request_date || undefined,
  militaryTransferType: (dbCitizen.military_transfer_type as 'μετάθεση' | 'απόσπαση' | '') || '',
  militaryTransferDate: dbCitizen.military_transfer_date || undefined,
  militaryObservations: dbCitizen.military_observations || undefined,
  militaryRequestStatus: (dbCitizen.military_request_status as 'ολοκληρωμένο' | 'ενημερώθηκε' | 'εκκρεμές' | '') || '',
  militaryRegistrationNumber: dbCitizen.military_registration_number || undefined,
  militaryCareerDesire: dbCitizen.military_career_desire || undefined,
  militaryCareerRequestDate: dbCitizen.military_career_request_date || undefined,
  created_at: dbCitizen.created_at,
  updated_at: dbCitizen.updated_at
})

// Helper function to transform frontend citizen to database input
const transformToDBInput = (citizen: Partial<Citizen>): Partial<CitizenInput> => ({
  // Required fields
  name: citizen.name,
  surname: citizen.surname,
  // Optional fields
  afm: citizen.afm?.trim() || null,
  recommendation: citizen.recommendation?.trim() || null,
  patronymic: citizen.patronymic?.trim() || null,
  phone: citizen.phone?.trim() || null,
  landline: citizen.landline?.trim() || null,
  email: citizen.email?.trim() || null,
  address: citizen.address?.trim() || null,
  "postalCode": citizen.postalCode?.trim() || null,
  municipality: citizen.municipality?.trim() || null,
  region: citizen.region?.trim() || null,
  "electoralDistrict": citizen.electoralDistrict?.trim() || null,
  position: citizen.position?.trim() || null,
  "contactCategory": citizen.contactCategory?.trim() || null,
  "requestCategory": citizen.requestCategory?.trim() || null,
  "addedDate": citizen.addedDate || null,
  "assignedCollaborator": citizen.assignedCollaborator?.trim() || null,
  status: citizen.status?.trim() || 'ΕΚΚΡΕΜΗ',
  "completionDate": citizen.completionDate || null,
  "responsibleAuthority": citizen.responsibleAuthority?.trim() || null,
  request: citizen.request?.trim() || null,
  observations: citizen.observations?.trim() || null,
  comment: citizen.comment?.trim() || null,
  notes: citizen.notes?.trim() || null,
  // Military fields
  "isMilitary": citizen.isMilitary || false,
  "militaryType": citizen.militaryType?.trim() || null,
  "militaryRank": citizen.militaryRank?.trim() || null,
  "militaryServiceUnit": citizen.militaryServiceUnit?.trim() || null,
  "military_id": citizen.militaryId?.trim() || null,
  "militaryEsso": citizen.militaryEsso?.trim() || null,
  "military_esso_year": citizen.militaryEssoYear?.trim() || null,
  "military_esso_letter": citizen.militaryEssoLetter?.trim() || null,
  "militaryDesire": citizen.militaryWish?.trim() || null,
  "military_status": citizen.militaryStatus?.trim() || null,
  "military_send_date": citizen.militarySendDate || null,
  "military_comments": citizen.militaryComments?.trim() || null,
  // Extended military fields
  "militaryAsm": citizen.militaryAsm?.trim() || null,
  "militaryCenter": citizen.militaryCenter?.trim() || null,
  "militaryPresentationDate": citizen.militaryPresentationDate || null,
  "militaryPlacement": citizen.militaryPlacement?.trim() || null,
  "militaryPlacementDate": citizen.militaryPlacementDate || null,
  "militaryRequestDate": citizen.militaryRequestDate || null,
  "militaryTransferType": citizen.militaryTransferType?.trim() || null,
  "militaryTransferDate": citizen.militaryTransferDate || null,
  "militaryObservations": citizen.militaryObservations?.trim() || null,
  "militaryRequestStatus": citizen.militaryRequestStatus?.trim() || null,
  "militaryRegistrationNumber": citizen.militaryRegistrationNumber?.trim() || null,
  "militaryCareerDesire": citizen.militaryCareerDesire?.trim() || null,
  "militaryCareerRequestDate": citizen.militaryCareerRequestDate || null
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
        active: citizens.filter(c => c.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ').length,
        inactive: citizens.filter(c => c.status === 'ΜΗ ΟΛΟΚΛΗΡΩΜΕΝΑ').length,
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

  // Add citizen-specific filtering and utility methods
  const getCitizensByStatus = (status: string) => {
    return store.items.filter(citizen => citizen.status === status)
  }

  const getCitizensByCollaborator = (collaborator: string) => {
    return store.items.filter(citizen => citizen.assignedCollaborator === collaborator)
  }

  const getCitizensByRequestCategory = (category: string) => {
    return store.items.filter(citizen => citizen.requestCategory === category)
  }

  const getPendingCitizens = () => {
    return store.items.filter(citizen => citizen.status === 'ΕΚΚΡΕΜΗ')
  }

  const getCompletedCitizens = () => {
    return store.items.filter(citizen => citizen.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ')
  }

  const getCitizensWithRequests = () => {
    return store.items.filter(citizen =>
      citizen.requestCategory === 'ΑΙΤΗΜΑ' || citizen.requestCategory === 'GDPR + ΑΙΤΗΜΑ'
    )
  }

  return {
    ...store,
    // Citizen-specific filtering methods
    getCitizensByStatus,
    getCitizensByCollaborator,
    getCitizensByRequestCategory,
    getPendingCitizens,
    getCompletedCitizens,
    getCitizensWithRequests
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