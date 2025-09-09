import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { militaryService, type MilitaryPersonnel as DBMilitaryPersonnel, type MilitaryPersonnelInput } from '../services/militaryService'

// Frontend interface that maps to backend data
export interface MilitaryPersonnel {
  id: string
  name: string
  surname: string
  rank: string
  unit: string
  militaryId: string
  esso: string
  essoYear: string
  essoLetter: string
  requestType: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string
  updated_at: string
}

interface MilitaryStore {
  militaryPersonnel: MilitaryPersonnel[]
  isLoading: boolean
  error: string | null
  
  // Actions
  loadMilitaryPersonnel: () => Promise<void>
  addMilitaryPersonnel: (personnelData: Omit<MilitaryPersonnel, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateMilitaryPersonnel: (id: string, personnelData: Partial<MilitaryPersonnel>) => Promise<void>
  deleteMilitaryPersonnel: (id: string) => Promise<void>
  getMilitaryPersonnel: (id: string) => MilitaryPersonnel | undefined
  searchMilitaryPersonnel: (searchTerm: string) => Promise<void>
  filterByEsso: (essoYear: string, essoLetter?: string) => Promise<void>
  filterByStatus: (status: string) => MilitaryPersonnel[]
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Computed
  getStats: () => Promise<{
    total: number
    pending: number
    approved: number
    rejected: number
    completed: number
    by_year: Record<string, number>
  }>
  
  getEssoGroups: () => Record<string, MilitaryPersonnel[]>
  getEssoYears: () => Promise<string[]>
}

// Helper function to transform database military personnel to frontend
const transformDBMilitaryPersonnel = (dbPersonnel: DBMilitaryPersonnel): MilitaryPersonnel & { description?: string; sendDate?: string; notes?: string } => ({
  id: dbPersonnel.id,
  name: dbPersonnel.name,
  surname: dbPersonnel.surname,
  rank: dbPersonnel.rank || '',
  unit: dbPersonnel.service_unit || '',
  militaryId: dbPersonnel.military_id || '',
  esso: dbPersonnel.esso || '',
  essoYear: dbPersonnel.esso_year || '',
  essoLetter: dbPersonnel.esso_letter || '',
  requestType: dbPersonnel.wish || '',
  description: dbPersonnel.wish || '', // Map wish to both requestType and description for backward compatibility
  sendDate: dbPersonnel.send_date || '',
  notes: dbPersonnel.comments || '',
  status: (dbPersonnel.status as 'pending' | 'approved' | 'rejected' | 'completed') || 'pending',
  created_at: dbPersonnel.created_at,
  updated_at: dbPersonnel.updated_at
})

// Helper function to transform frontend military personnel to database input
const transformToDBInput = (personnel: Partial<MilitaryPersonnel> & { description?: string; sendDate?: string; notes?: string }): Partial<MilitaryPersonnelInput> => ({
  name: personnel.name || '',
  surname: personnel.surname || '',
  rank: personnel.rank || null,
  service_unit: personnel.unit || null,
  military_id: personnel.militaryId || null,
  esso: personnel.esso || null,
  esso_year: personnel.essoYear || null,
  esso_letter: (personnel.essoLetter as any) || null,
  wish: personnel.description || personnel.requestType || null, // Prefer description over requestType
  send_date: personnel.sendDate || null,
  comments: personnel.notes || null,
  status: personnel.status || 'pending'
})

export const useMilitaryStore = create<MilitaryStore>()(
  persist(
    (set, get) => ({
      militaryPersonnel: [],
      isLoading: false,
      error: null,

      loadMilitaryPersonnel: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const dbPersonnel = await militaryService.getAllMilitaryPersonnel()
          const militaryPersonnel = dbPersonnel.map(transformDBMilitaryPersonnel)
          set({ militaryPersonnel, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη φόρτωση στρατιωτικού προσωπικού'
          })
        }
      },

      addMilitaryPersonnel: async (personnelData) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbInput = transformToDBInput(personnelData) as MilitaryPersonnelInput
          const newDBPersonnel = await militaryService.createMilitaryPersonnel(dbInput)
          const newPersonnel = transformDBMilitaryPersonnel(newDBPersonnel)
          
          set(state => ({
            militaryPersonnel: [newPersonnel, ...state.militaryPersonnel],
            isLoading: false
          }))
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την προσθήκη στρατιωτικού'
          })
          throw error
        }
      },

      updateMilitaryPersonnel: async (id, personnelData) => {
        console.log('Store: Starting updateMilitaryPersonnel with id:', id)
        console.log('Store: Personnel data:', personnelData)
        set({ isLoading: true, error: null })
        
        try {
          console.log('Store: Transforming to DB input...')
          const dbInput = transformToDBInput(personnelData)
          console.log('Store: DB input:', dbInput)
          
          console.log('Store: Calling militaryService.updateMilitaryPersonnel...')
          const updatedDBPersonnel = await militaryService.updateMilitaryPersonnel(id, dbInput)
          console.log('Store: Service returned:', updatedDBPersonnel)
          
          console.log('Store: Transforming DB personnel to frontend...')
          const updatedPersonnel = transformDBMilitaryPersonnel(updatedDBPersonnel)
          console.log('Store: Updated personnel:', updatedPersonnel)
          
          console.log('Store: Updating store state...')
          set(state => ({
            militaryPersonnel: state.militaryPersonnel.map(personnel =>
              personnel.id === id ? updatedPersonnel : personnel
            ),
            isLoading: false
          }))
          
          console.log('Store: Update completed successfully')
        } catch (error) {
          console.error('Store: Error during update:', error)
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την ενημέρωση στρατιωτικού'
          })
          throw error
        }
      },

      deleteMilitaryPersonnel: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          await militaryService.deleteMilitaryPersonnel(id)
          set(state => ({
            militaryPersonnel: state.militaryPersonnel.filter(personnel => personnel.id !== id),
            isLoading: false
          }))
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη διαγραφή στρατιωτικού'
          })
          throw error
        }
      },

      getMilitaryPersonnel: (id) => {
        return get().militaryPersonnel.find(personnel => personnel.id === id)
      },

      searchMilitaryPersonnel: async (searchTerm) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbPersonnel = await militaryService.searchMilitaryPersonnel(searchTerm)
          const militaryPersonnel = dbPersonnel.map(transformDBMilitaryPersonnel)
          set({ militaryPersonnel, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την αναζήτηση'
          })
        }
      },

      filterByEsso: async (essoYear, essoLetter) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbPersonnel = await militaryService.getMilitaryPersonnelByEsso(essoYear, essoLetter)
          const militaryPersonnel = dbPersonnel.map(transformDBMilitaryPersonnel)
          set({ militaryPersonnel, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά το φιλτράρισμα ΕΣΣΟ'
          })
        }
      },

      filterByStatus: (status) => {
        if (!status) return get().militaryPersonnel
        return get().militaryPersonnel.filter(personnel => personnel.status === status)
      },

      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),

      getStats: async () => {
        try {
          return await militaryService.getMilitaryStats()
        } catch (error) {
          console.error('Σφάλμα στατιστικών στρατιωτικού προσωπικού:', error)
          // Fallback to local calculation if service fails
          const personnel = get().militaryPersonnel
          const by_year = personnel.reduce((acc, p) => {
            if (p.essoYear) {
              acc[p.essoYear] = (acc[p.essoYear] || 0) + 1
            }
            return acc
          }, {} as Record<string, number>)

          return {
            total: personnel.length,
            pending: personnel.filter(p => p.status === 'pending').length,
            approved: personnel.filter(p => p.status === 'approved').length,
            rejected: personnel.filter(p => p.status === 'rejected').length,
            completed: personnel.filter(p => p.status === 'completed').length,
            by_year
          }
        }
      },

      getEssoGroups: () => {
        const personnel = get().militaryPersonnel
        const groups: Record<string, MilitaryPersonnel[]> = {}

        personnel.forEach(p => {
          const key = `${p.essoYear}${p.essoLetter}`
          if (!groups[key]) {
            groups[key] = []
          }
          groups[key].push(p)
        })

        return groups
      },

      getEssoYears: async () => {
        try {
          return await militaryService.getEssoYears()
        } catch (error) {
          console.error('Σφάλμα φόρτωσης ετών ΕΣΣΟ:', error)
          // Fallback to local data
          const personnel = get().militaryPersonnel
          const years = [...new Set(personnel.map(p => p.essoYear).filter(Boolean))]
          return years.sort().reverse()
        }
      }
    }),
    {
      name: 'military-storage',
      // Don't persist loading states and error states
      partialize: (state) => ({ militaryPersonnel: state.militaryPersonnel })
    }
  )
)