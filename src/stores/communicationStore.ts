import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { communicationService, type CommunicationDate as DBCommunicationDate, type CommunicationDateInput, type CommunicationDateWithCitizen } from '../services/communicationService'

// Frontend interface that maps to backend data
export interface CommunicationDate {
  id: string
  citizen_id: string
  communication_date: string
  communication_type: 'ΓΕΝΙΚΗ' | 'ΤΗΛΕΦΩΝΙΚΗ' | 'EMAIL' | 'ΠΡΟΣΩΠΙΚΗ' | 'SMS'
  notes?: string
  created_at: string
  citizenName?: string // Derived from joined data
}

interface CommunicationStore {
  communications: CommunicationDate[]
  isLoading: boolean
  error: string | null
  
  // Actions
  loadCommunications: () => Promise<void>
  addCommunication: (communicationData: Omit<CommunicationDate, 'id' | 'created_at'>) => Promise<void>
  updateCommunication: (id: string, communicationData: Partial<CommunicationDate>) => Promise<void>
  deleteCommunication: (id: string) => Promise<void>
  getCommunication: (id: string) => CommunicationDate | undefined
  getCommunicationsByCitizen: (citizenId: string) => CommunicationDate[]
  getLastCommunicationByCitizen: (citizenId: string) => CommunicationDate | null
  loadCommunicationsByCitizen: (citizenId: string) => Promise<void>
  getRecentCommunications: (days?: number) => Promise<void>
  getCommunicationsByType: (type: 'ΓΕΝΙΚΗ' | 'ΤΗΛΕΦΩΝΙΚΗ' | 'EMAIL' | 'ΠΡΟΣΩΠΙΚΗ' | 'SMS') => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Computed
  getStats: () => {
    total: number
    thisMonth: number
    thisWeek: number
    byType: Record<string, number>
    citizensWithCommunications: number
  }
}

// Helper function to transform database communication date to frontend
const transformDBCommunicationDate = (dbComm: CommunicationDateWithCitizen): CommunicationDate => ({
  id: dbComm.id,
  citizen_id: dbComm.citizen_id,
  communication_date: dbComm.communication_date,
  communication_type: dbComm.communication_type,
  notes: dbComm.notes || undefined,
  created_at: dbComm.created_at,
  citizenName: dbComm.citizens ? `${dbComm.citizens.name} ${dbComm.citizens.surname}` : undefined
})

// Helper function to transform frontend communication date to database input
const transformToDBInput = (comm: Partial<CommunicationDate>): Partial<CommunicationDateInput> => ({
  citizen_id: comm.citizen_id || '',
  communication_date: comm.communication_date || '',
  communication_type: comm.communication_type || 'ΓΕΝΙΚΗ',
  notes: comm.notes || null
})

export const useCommunicationStore = create<CommunicationStore>()(
  persist(
    (set, get) => ({
      communications: [],
      isLoading: false,
      error: null,

      loadCommunications: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const dbCommunications = await communicationService.getAllCommunicationDates()
          const communications = dbCommunications.map(transformDBCommunicationDate)
          set({ communications, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη φόρτωση επικοινωνιών'
          })
        }
      },

      addCommunication: async (communicationData) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbInput = transformToDBInput(communicationData) as CommunicationDateInput
          const newDBCommunication = await communicationService.createCommunicationDate(dbInput)
          
          // Get the full communication with relations
          const fullCommunication = await communicationService.getCommunicationDateById(newDBCommunication.id)
          if (fullCommunication) {
            const newCommunication = transformDBCommunicationDate(fullCommunication)
            set(state => ({
              communications: [newCommunication, ...state.communications],
              isLoading: false
            }))
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την προσθήκη επικοινωνίας'
          })
          throw error
        }
      },

      updateCommunication: async (id, communicationData) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbInput = transformToDBInput(communicationData)
          await communicationService.updateCommunicationDate(id, dbInput)
          
          // Get the updated communication with relations
          const updatedDBCommunication = await communicationService.getCommunicationDateById(id)
          if (updatedDBCommunication) {
            const updatedCommunication = transformDBCommunicationDate(updatedDBCommunication)
            set(state => ({
              communications: state.communications.map(communication =>
                communication.id === id ? updatedCommunication : communication
              ),
              isLoading: false
            }))
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά την ενημέρωση επικοινωνίας'
          })
          throw error
        }
      },

      deleteCommunication: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          await communicationService.deleteCommunicationDate(id)
          set(state => ({
            communications: state.communications.filter(communication => communication.id !== id),
            isLoading: false
          }))
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη διαγραφή επικοινωνίας'
          })
          throw error
        }
      },

      getCommunication: (id) => {
        return get().communications.find(communication => communication.id === id)
      },

      getCommunicationsByCitizen: (citizenId) => {
        return get().communications.filter(comm => comm.citizen_id === citizenId)
          .sort((a, b) => new Date(b.communication_date).getTime() - new Date(a.communication_date).getTime())
      },

      getLastCommunicationByCitizen: (citizenId) => {
        const communications = get().communications
          .filter(comm => comm.citizen_id === citizenId)
          .sort((a, b) => new Date(b.communication_date).getTime() - new Date(a.communication_date).getTime())
        return communications[0] || null
      },

      loadCommunicationsByCitizen: async (citizenId) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbCommunications = await communicationService.getCommunicationDatesByCitizen(citizenId)
          const communications = dbCommunications.map(comm => transformDBCommunicationDate({
            ...comm,
            citizens: null // No join data needed for this call
          }))
          
          // Merge with existing communications, avoiding duplicates
          set(state => ({
            communications: [
              ...communications,
              ...state.communications.filter(c => !communications.some(nc => nc.id === c.id))
            ],
            isLoading: false
          }))
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη φόρτωση επικοινωνιών πολίτη'
          })
        }
      },

      getRecentCommunications: async (days = 30) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbCommunications = await communicationService.getRecentCommunications(days)
          const communications = dbCommunications.map(transformDBCommunicationDate)
          set({ communications, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη φόρτωση πρόσφατων επικοινωνιών'
          })
        }
      },

      getCommunicationsByType: async (type) => {
        set({ isLoading: true, error: null })
        
        try {
          const dbCommunications = await communicationService.getCommunicationsByType(type)
          const communications = dbCommunications.map(transformDBCommunicationDate)
          set({ communications, isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Σφάλμα κατά τη φόρτωση επικοινωνιών ανά τύπο'
          })
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),

      getStats: () => {
        const communications = get().communications
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const firstDayOfWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))

        // Count by type
        const byType = communications.reduce((acc, communication) => {
          acc[communication.communication_type] = (acc[communication.communication_type] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        // Count unique citizens with communications
        const uniqueCitizens = new Set(communications.map(c => c.citizen_id)).size

        return {
          total: communications.length,
          thisMonth: communications.filter(c => new Date(c.communication_date) >= firstDayOfMonth).length,
          thisWeek: communications.filter(c => new Date(c.communication_date) >= firstDayOfWeek).length,
          byType,
          citizensWithCommunications: uniqueCitizens
        }
      }
    }),
    {
      name: 'communication-storage',
      // Don't persist loading states and error states
      partialize: (state) => ({ communications: state.communications })
    }
  )
)