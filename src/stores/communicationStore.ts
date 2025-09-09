import { createSmartStore, CacheProfiles } from './baseStore'
import { communicationService, type CommunicationDate as DBCommunicationDate, type CommunicationDateInput, type CommunicationDateWithCitizen } from '../services/communicationService'

// Frontend interface that maps to backend data
export interface CommunicationDate {
  id: string
  citizenId: string
  communicationType: 'phone' | 'email' | 'meeting' | 'other'
  description: string
  notes?: string
  contactDate: string
  created_at: string
  updated_at: string
}

export interface CommunicationDateWithCitizen extends CommunicationDate {
  citizen: {
    name: string
    surname: string
    municipality?: string
  }
}

// Helper function to transform database communication to frontend
const transformDBCommunication = (dbComm: DBCommunicationDate): CommunicationDate => ({
  id: dbComm.id,
  citizenId: dbComm.citizen_id,
  communicationType: (dbComm.communication_type as CommunicationDate['communicationType']) || 'other',
  description: dbComm.description || '',
  notes: dbComm.notes || undefined,
  contactDate: dbComm.contact_date,
  created_at: dbComm.created_at,
  updated_at: dbComm.updated_at
})

// Helper function to transform frontend to database input
const transformToDBInput = (comm: Partial<CommunicationDate>): Partial<CommunicationDateInput> => ({
  citizen_id: comm.citizenId || '',
  communication_type: comm.communicationType || 'other',
  description: comm.description || '',
  notes: comm.notes?.trim() || null,
  contact_date: comm.contactDate || new Date().toISOString()
})

// Service adapter
const communicationServiceAdapter = {
  getAll: () => communicationService.getAllCommunications(),
  create: (data: CommunicationDateInput) => communicationService.createCommunication(data),
  update: (id: string, data: Partial<CommunicationDateInput>) => communicationService.updateCommunication(id, data),
  delete: (id: string) => communicationService.deleteCommunication(id)
}

// Create the smart communication store
export const useCommunicationStore = createSmartStore<CommunicationDate, CommunicationDateInput, typeof communicationServiceAdapter>({
  storeName: 'communications',
  cacheConfig: CacheProfiles.DYNAMIC, // Communications change frequently
  service: communicationServiceAdapter,
  transformFromDB: transformDBCommunication,
  transformToDB: transformToDBInput
})

// Additional communication-specific methods
export const useCommunicationActions = () => {
  const store = useCommunicationStore()
  
  return {
    ...store,
    
    // Get communications with citizen details
    getCommunicationsWithDetails: async () => {
      try {
        store.setLoading(true)
        const detailedComms = await communicationService.getCommunicationsWithCitizen()
        // Transform as needed
        return detailedComms
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Σφάλμα φόρτωσης επικοινωνιών')
        return []
      } finally {
        store.setLoading(false)
      }
    },
    
    // Get communications by citizen
    getCommunicationsByCitizen: async (citizenId: string) => {
      try {
        store.setLoading(true)
        const comms = await communicationService.getCommunicationsByCitizen(citizenId)
        const transformed = comms.map(transformDBCommunication)
        return transformed
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Σφάλμα φόρτωσης επικοινωνιών πολίτη')
        return []
      } finally {
        store.setLoading(false)
      }
    }
  }
}