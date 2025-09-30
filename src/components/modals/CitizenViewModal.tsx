import { X, User, Phone, Mail, MapPin, FileText, Calendar, Edit } from 'lucide-react'
import { CommunicationTimeline } from '../timeline/CommunicationTimeline'
import { RequestTimeline } from '../timeline/RequestTimeline'
import type { Citizen } from '../../stores/realtimeCitizenStore'

interface CitizenViewModalProps {
  citizen: Citizen | null
  isOpen: boolean
  onClose: () => void
  onEdit: (citizen: Citizen) => void
  onRequestFormOpen?: (citizenId: string) => void
  zIndex?: number
}

export function CitizenViewModal({ citizen, isOpen, onClose, onEdit, onRequestFormOpen, zIndex = 40 }: CitizenViewModalProps) {
  if (!isOpen || !citizen) return null

  const handleEdit = () => {
    onEdit(citizen)
    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4" style={{ zIndex }}>
      <div className="absolute inset-0 bg-black opacity-50" style={{ zIndex: zIndex - 10 }} onClick={onClose}></div>

      <div className="responsive-modal-lg bg-slate-800 border border-slate-700 rounded-xl max-h-screen-90 overflow-y-auto relative" style={{ zIndex }}>
        {/* Header */}
        <div className="flex items-center justify-between responsive-padding border-b border-slate-700">
          <div className="flex items-center">
            <User className="h-6 w-6 text-blue-400 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-white">
                {citizen.name} {citizen.surname}
              </h2>
              <p className="text-gray-400 text-sm">
                ΑΦΜ: {citizen.afm || 'Δεν έχει καταχωρηθεί'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEdit}
              className="text-blue-400 hover:text-blue-300 touch-target hover:bg-slate-700 rounded-lg transition-colors"
              title="Επεξεργασία"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white touch-target hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="responsive-padding space-y-4 sm:space-y-6">
          
          {/* Status Badge */}
          <div className="flex items-center">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
              citizen.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ'
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : citizen.status === 'ΕΚΚΡΕΜΗ'
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            }`}>
              {citizen.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ' ? 'Ολοκληρωμένα' :
               citizen.status === 'ΕΚΚΡΕΜΗ' ? 'Εκκρεμή' :
               citizen.status || 'Δεν έχει καταχωρηθεί'}
            </span>
          </div>

          {/* Personal Information */}
          <div>
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-medium text-white">Προσωπικά Στοιχεία</h3>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Όνομα</p>
                  <p className="text-white font-medium">{citizen.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Επώνυμο</p>
                  <p className="text-white font-medium">{citizen.surname}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">ΑΦΜ</p>
                  <p className="text-white font-medium">{citizen.afm || <span className="text-gray-500">Δεν έχει καταχωρηθεί</span>}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Κατάσταση</p>
                  <p className="text-white font-medium">
                    {citizen.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ' ? 'Ολοκληρωμένα' :
                     citizen.status === 'ΕΚΚΡΕΜΗ' ? 'Εκκρεμή' :
                     citizen.status || 'Δεν έχει καταχωρηθεί'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <div className="flex items-center mb-4">
              <Phone className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-medium text-white">Στοιχεία Επικοινωνίας</h3>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Κινητό Τηλέφωνο</p>
                  <p className="text-white font-medium">
                    {citizen.phone || <span className="text-gray-500">Δεν έχει καταχωρηθεί</span>}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Σταθερό Τηλέφωνο</p>
                  <p className="text-white font-medium">
                    {citizen.landline || <span className="text-gray-500">Δεν έχει καταχωρηθεί</span>}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white font-medium">
                    {citizen.email || <span className="text-gray-500">Δεν έχει καταχωρηθεί</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-medium text-white">Στοιχεία Διεύθυνσης</h3>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Διεύθυνση</p>
                  <p className="text-white font-medium">
                    {citizen.address || <span className="text-gray-500">Δεν έχει καταχωρηθεί</span>}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Περιοχή</p>
                  <p className="text-white font-medium">
                    {citizen.region || <span className="text-gray-500">Δεν έχει καταχωρηθεί</span>}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Ταχ. Κώδικας</p>
                  <p className="text-white font-medium">
                    {citizen.postalCode || <span className="text-gray-500">Δεν έχει καταχωρηθεί</span>}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Δήμος</p>
                  <p className="text-white font-medium">
                    {citizen.municipality?.replace(/_/g, ' ') || <span className="text-gray-500">Δεν έχει καταχωρηθεί</span>}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-400 text-sm">Εκλογική Περιφέρεια</p>
                  <p className="text-white font-medium">
                    {citizen.electoralDistrict || <span className="text-gray-500">Δεν έχει καταχωρηθεί</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {citizen.notes && (
            <div>
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium text-white">Σημειώσεις</h3>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-white whitespace-pre-wrap">
                  {citizen.notes}
                </p>
              </div>
            </div>
          )}

          {/* Creation Date */}
          <div>
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-medium text-white">Πληροφορίες Συστήματος</h3>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Ημερομηνία Δημιουργίας</p>
                  <p className="text-white font-medium">
                    {new Date(citizen.created_at).toLocaleDateString('el-GR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">ID Συστήματος</p>
                  <p className="text-white font-medium font-mono text-sm">{citizen.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Request Timeline */}
          <div>
            <RequestTimeline
              citizenId={citizen.id}
              citizenName={`${citizen.name} ${citizen.surname}`}
              showAddButton={true}
              onRequestFormOpen={onRequestFormOpen}
            />
          </div>

          {/* Communication Timeline */}
          <div>
            <CommunicationTimeline 
              citizenId={citizen.id} 
              citizenName={`${citizen.name} ${citizen.surname}`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 responsive-padding border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors touch-target"
          >
            Κλείσιμο
          </button>
          <button
            onClick={handleEdit}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors touch-target"
          >
            <Edit className="h-4 w-4 mr-2" />
            Επεξεργασία
          </button>
        </div>
      </div>
    </div>
  )
}