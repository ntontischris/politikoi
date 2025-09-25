import { createRealtimeStore } from './realtimeStore'
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
  "military_asm": citizen.militaryAsm?.trim() || null,
  "military_center": citizen.militaryCenter?.trim() || null,
  "military_presentation_date": citizen.militaryPresentationDate || null,
  "military_placement": citizen.militaryPlacement?.trim() || null,
  "military_placement_date": citizen.militaryPlacementDate || null,
  "military_request_date": citizen.militaryRequestDate || null,
  "military_transfer_type": citizen.militaryTransferType?.trim() || null,
  "military_transfer_date": citizen.militaryTransferDate || null,
  "military_observations": citizen.militaryObservations?.trim() || null,
  "military_request_status": citizen.militaryRequestStatus?.trim() || null,
  "military_registration_number": citizen.militaryRegistrationNumber?.trim() || null,
  "military_career_desire": citizen.militaryCareerDesire?.trim() || null,
  "military_career_request_date": citizen.militaryCareerRequestDate || null
})

/**
 * PARALLEL Realtime Citizen Store
 *
 * ULTRA SAFE: Parallel implementation που δεν αγγίζει το existing citizenStore
 * Maintains EXACT same interface για seamless migration
 */
export const useRealtimeCitizenStore = createRealtimeStore<Citizen>({
  tableName: 'citizens',
  orderBy: { column: 'created_at', ascending: false },
  service: citizensService, // Use existing service for compatibility

  // Transform from DB - proper transformation with field mapping
  transformFromDB: transformDBCitizen,

  // Transform to DB - proper transformation with field mapping
  transformToDB: transformToDBInput
})

// Export type for TypeScript
export type RealtimeCitizenStore = ReturnType<typeof useRealtimeCitizenStore>