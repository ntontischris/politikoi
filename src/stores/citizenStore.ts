import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { citizensService, type Citizen as DBCitizen, type CitizenInput } from '../services/citizensService'

// Frontend interface that maps to backend data
export interface Citizen {
  id: string
  name: string
  surname: string
  afm?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  postalCode?: string
  municipality?: string
  electoralDistrict?: string
  notes?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

interface CitizenStore {
  citizens: Citizen[]
  isLoading: boolean
  error: string | null
  
  // Actions
  loadCitizens: () => Promise<void>
  addCitizen: (citizenData: Omit<Citizen, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateCitizen: (id: string, citizenData: Partial<Citizen>) => Promise<void>
  deleteCitizen: (id: string) => Promise<void>
  getCitizen: (id: string) => Citizen | undefined
  searchCitizens: (searchTerm: string) => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Computed
  getStats: () => Promise<{
    total: number
    active: number
    inactive: number
    recent: number
  }>
}

// Helper function to transform database citizen to frontend citizen
const transformDBCitizen = (dbCitizen: DBCitizen): Citizen => ({
  id: dbCitizen.id,
  name: dbCitizen.name,
  surname: dbCitizen.surname,
  afm: dbCitizen.afm || undefined,
  phone: dbCitizen.mobile_phone || undefined,
  email: dbCitizen.email || undefined,
  address: dbCitizen.address || undefined,
  city: dbCitizen.area || undefined,
  postalCode: dbCitizen.postal_code || undefined,
  municipality: dbCitizen.municipality || undefined,
  electoralDistrict: dbCitizen.electoral_district || undefined,
  notes: dbCitizen.notes || undefined,
  status: (dbCitizen.status as 'active' | 'inactive') || 'active',
  created_at: dbCitizen.created_at,
  updated_at: dbCitizen.updated_at
})

// Helper function to transform frontend citizen to database input
const transformToDBInput = (citizen: Partial<Citizen>): Partial<CitizenInput> => ({
  name: citizen.name,
  surname: citizen.surname,
  afm: citizen.afm || null,
  mobile_phone: citizen.phone || null,
  email: citizen.email || null,
  address: citizen.address || null,
  area: citizen.city || null,
  postal_code: citizen.postalCode || null,
  municipality: citizen.municipality || null,
  electoral_district: citizen.electoralDistrict || null,
  notes: citizen.notes || null,
  status: citizen.status || 'active'
})

export const useCitizenStore = create<CitizenStore>()(
  persist(
    (set, get) => ({
      citizens: [],
      isLoading: false,
      error: null,

      loadCitizens: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const dbCitizens = await citizensService.getAllCitizens()
          const citizens = dbCitizens.map(transformDBCitizen)
          set({ citizens, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη φόρτωση πολιτών'
          })
        }
      },

      addCitizen: async (citizenData) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbInput = transformToDBInput(citizenData) as CitizenInput
          const newDBCitizen = await citizensService.createCitizen(dbInput)
          const newCitizen = transformDBCitizen(newDBCitizen)
          
          set(state => ({
            citizens: [newCitizen, ...state.citizens],
            isLoading: false
          }))
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την προσθήκη πολίτη'
          })
          throw error
        }
      },

      updateCitizen: async (id, citizenData) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbInput = transformToDBInput(citizenData)
          const updatedDBCitizen = await citizensService.updateCitizen(id, dbInput)
          const updatedCitizen = transformDBCitizen(updatedDBCitizen)
          
          set(state => ({
            citizens: state.citizens.map(citizen =>
              citizen.id === id ? updatedCitizen : citizen
            ),
            isLoading: false
          }))
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την ενημέρωση πολίτη'
          })
          throw error
        }
      },

      deleteCitizen: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          await citizensService.deleteCitizen(id)
          set(state => ({
            citizens: state.citizens.filter(citizen => citizen.id !== id),
            isLoading: false
          }))
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη διαγραφή πολίτη'
          })
          throw error
        }
      },

      getCitizen: (id) => {
        return get().citizens.find(citizen => citizen.id === id)
      },

      searchCitizens: async (searchTerm) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbCitizens = await citizensService.searchCitizens(searchTerm)
          const citizens = dbCitizens.map(transformDBCitizen)
          set({ citizens, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την αναζήτηση'
          })
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),

      getStats: async () => {
        try {
          return await citizensService.getCitizensStats()
        } catch (error) {
          console.error('Σφάλμα στατιστικών:', error)
          // Fallback to local calculation if service fails
          const citizens = get().citizens
          const now = new Date()
          const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))

          return {
            total: citizens.length,
            active: citizens.filter(c => c.status === 'active').length,
            inactive: citizens.filter(c => c.status === 'inactive').length,
            recent: citizens.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length
          }
        }
      }
    }),
    {
      name: 'citizen-storage',
      // Don't persist loading states and error states
      partialize: (state) => ({ citizens: state.citizens })
    }
  )
)