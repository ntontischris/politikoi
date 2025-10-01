import { createRealtimeStore } from './realtimeStore'
import { communicationService, type CommunicationDate as DBCommunicationDate, type CommunicationDateInput, type CommunicationDateWithCitizen } from '../services/communicationService'

// Frontend interface that maps to backend data
export interface CommunicationDate {
  id: string
  citizenId: string
  communicationType: 'phone' | 'email' | 'meeting' | 'other'
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
const transformDBCommunication = (dbComm: DBCommunicationDate): CommunicationDate => {
  // Map database communication types to frontend types
  const typeMapping: Record<string, CommunicationDate['communicationType']> = {
    'ΤΗΛΕΦΩΝΙΚΗ': 'phone',
    'EMAIL': 'email',
    'ΠΡΟΣΩΠΙΚΗ': 'meeting',
    'SMS': 'other',
    'ΓΕΝΙΚΗ': 'other'
  }

  return {
    id: dbComm.id,
    citizenId: dbComm.citizen_id,
    communicationType: typeMapping[dbComm.communication_type] || 'other',
    notes: dbComm.notes || undefined,
    contactDate: dbComm.communication_date,
    created_at: dbComm.created_at,
    updated_at: dbComm.created_at // Use created_at since updated_at doesn't exist in DB
  }
}

// Helper function to transform frontend to database input
const transformToDBInput = (comm: Partial<CommunicationDate>): Partial<CommunicationDateInput> => {
  // Map frontend communication types to database types
  const typeMapping: Record<string, string> = {
    'phone': 'ΤΗΛΕΦΩΝΙΚΗ',
    'email': 'EMAIL',
    'visit': 'ΠΡΟΣΩΠΙΚΗ',
    'meeting': 'ΠΡΟΣΩΠΙΚΗ',
    'other': 'ΓΕΝΙΚΗ'
  }

  return {
    citizen_id: comm.citizenId || '',
    communication_type: typeMapping[comm.communicationType || 'other'] || 'ΓΕΝΙΚΗ',
    notes: comm.notes?.trim() || null,
    communication_date: comm.contactDate || new Date().toISOString()
  }
}

// Service adapter
const communicationServiceAdapter = {
  getAll: () => communicationService.getAllCommunications(),
  create: (data: CommunicationDateInput) => communicationService.createCommunication(data),
  update: (id: string, data: Partial<CommunicationDateInput>) => communicationService.updateCommunication(id, data),
  delete: (id: string) => communicationService.deleteCommunication(id)
}

// Create the realtime communication store
export const useCommunicationStore = createRealtimeStore<CommunicationDate>({
  tableName: 'citizen_communication_dates', // FIXED: Use correct table name from database
  transformFromDB: transformDBCommunication,
  transformToDB: transformToDBInput,
  service: communicationServiceAdapter
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