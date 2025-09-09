import { createSmartStore, CacheProfiles } from './baseStore'
import { militaryService, type MilitaryPersonnel as DBMilitaryPersonnel, type MilitaryPersonnelInput } from '../services/militaryService'

// Frontend interface that maps to backend data
export interface MilitaryPersonnel {
  id: string
  name: string
  surname: string
  rank: string
  unit: string
  wish?: string
  sendDate?: string
  comments?: string
  militaryId: string
  esso: string
  essoYear: string
  essoLetter: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string
  updated_at: string
}

// Helper function to transform database military personnel to frontend
const transformDBMilitaryPersonnel = (dbPersonnel: DBMilitaryPersonnel): MilitaryPersonnel => ({
  id: dbPersonnel.id,
  name: dbPersonnel.name,
  surname: dbPersonnel.surname,
  rank: dbPersonnel.rank || '',
  unit: dbPersonnel.service_unit || '',
  wish: dbPersonnel.wish || undefined,
  sendDate: dbPersonnel.send_date || undefined,
  comments: dbPersonnel.comments || undefined,
  militaryId: dbPersonnel.military_id || '',
  esso: dbPersonnel.esso || '',
  essoYear: dbPersonnel.esso_year || '',
  essoLetter: dbPersonnel.esso_letter || '',
  status: dbPersonnel.status || 'pending',
  created_at: dbPersonnel.created_at,
  updated_at: dbPersonnel.updated_at
})

// Helper function to transform frontend to database input
const transformToDBInput = (personnel: Partial<MilitaryPersonnel>): Partial<MilitaryPersonnelInput> => ({
  name: personnel.name,
  surname: personnel.surname,
  rank: personnel.rank?.trim() || null,
  service_unit: personnel.unit?.trim() || null,
  wish: personnel.wish?.trim() || null,
  send_date: personnel.sendDate || null,
  comments: personnel.comments?.trim() || null,
  military_id: personnel.militaryId?.trim() || null,
  esso: personnel.esso?.trim() || null,
  esso_year: personnel.essoYear?.trim() || null,
  esso_letter: (personnel.essoLetter?.trim() as 'Α' | 'Β' | 'Γ' | 'Δ' | 'Ε' | 'ΣΤ') || null,
  status: personnel.status || 'pending'
})

// Service adapter to match BaseStore expectations
const militaryServiceAdapter = {
  getAll: () => militaryService.getAllMilitaryPersonnel(),
  create: (data: MilitaryPersonnelInput) => militaryService.createMilitaryPersonnel(data),
  update: (id: string, data: Partial<MilitaryPersonnelInput>) => militaryService.updateMilitaryPersonnel(id, data),
  delete: (id: string) => militaryService.deleteMilitaryPersonnel(id)
}

// Create the smart military store
export const useMilitaryStore = createSmartStore<MilitaryPersonnel, MilitaryPersonnelInput, typeof militaryServiceAdapter>({
  storeName: 'military',
  cacheConfig: CacheProfiles.MODERATE, // Military data changes moderately
  service: militaryServiceAdapter,
  transformFromDB: transformDBMilitaryPersonnel,
  transformToDB: transformToDBInput
})

// Additional military-specific methods
export const useMilitaryActions = () => {
  const store = useMilitaryStore()
  
  return {
    ...store,
    
    // Search functionality
    searchMilitaryPersonnel: async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        return store.loadItems()
      }
      
      try {
        store.setLoading(true)
        store.setError(null)
        
        const searchResults = await militaryService.searchMilitaryPersonnel(searchTerm)
        const transformedResults = searchResults.map(transformDBMilitaryPersonnel)
        
        // Update store with search results
        useMilitaryStore.setState({ 
          items: transformedResults,
          isLoading: false 
        })
        
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Σφάλμα αναζήτησης')
        store.setLoading(false)
      }
    },
    
    // Filter by ESSO
    filterByEsso: async (essoYear: string, essoLetter?: string) => {
      try {
        store.setLoading(true)
        const results = await militaryService.getMilitaryPersonnelByEsso(essoYear, essoLetter)
        const transformed = results.map(transformDBMilitaryPersonnel)
        
        useMilitaryStore.setState({ 
          items: transformed,
          isLoading: false 
        })
        
        return transformed
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Σφάλμα φίλτρου ΕΣΣΟ')
        store.setLoading(false)
        return []
      }
    },
    
    // Filter by status (local operation)
    filterByStatus: (status: string): MilitaryPersonnel[] => {
      return store.items.filter(person => person.status === status)
    },
    
    // Get statistics
    getStats: async () => {
      try {
        const stats = await militaryService.getMilitaryStats()
        return stats
      } catch (error) {
        console.error('Error getting military stats:', error)
        
        // Fallback to local calculation
        const personnel = store.items
        const byStatus = personnel.reduce((acc, person) => {
          acc[person.status] = (acc[person.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        const byYear = personnel.reduce((acc, person) => {
          const year = person.essoYear || 'Άγνωστο'
          acc[year] = (acc[year] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        return {
          total: personnel.length,
          pending: byStatus.pending || 0,
          approved: byStatus.approved || 0,
          rejected: byStatus.rejected || 0,
          completed: byStatus.completed || 0,
          by_year: byYear
        }
      }
    },
    
    // Group by ESSO
    getEssoGroups: (): Record<string, MilitaryPersonnel[]> => {
      return store.items.reduce((groups, person) => {
        const key = `${person.essoYear}-${person.essoLetter}` || 'Άλλο'
        if (!groups[key]) groups[key] = []
        groups[key].push(person)
        return groups
      }, {} as Record<string, MilitaryPersonnel[]>)
    },
    
    // Get available ESSO years
    getEssoYears: async (): Promise<string[]> => {
      try {
        const years = await militaryService.getEssoYears()
        return years
      } catch (error) {
        // Fallback to local calculation
        const uniqueYears = [...new Set(store.items.map(p => p.essoYear).filter(Boolean))]
        return uniqueYears.sort((a, b) => b.localeCompare(a))
      }
    },
    
    // Update status (common operation)
    updateStatus: async (id: string, status: MilitaryPersonnel['status']) => {
      return store.updateItem(id, { status })
    }
  }
}

// Convenience hook for single military personnel
export const useMilitaryPersonnel = (id?: string) => {
  const store = useMilitaryStore()
  
  return {
    personnel: id ? store.getItem(id) : null,
    isLoading: store.isLoading,
    error: store.error
  }
}