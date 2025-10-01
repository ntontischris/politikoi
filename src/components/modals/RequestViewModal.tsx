import { X, FileText, User, Building, Clock, AlertTriangle, Calendar, Edit, Star, CheckCircle, XCircle } from 'lucide-react'
import { createPortal } from 'react-dom'
import { type Request } from '../../stores/realtimeRequestStore'

interface RequestViewModalProps {
  request: Request | null
  isOpen: boolean
  onClose: () => void
  onEdit: (request: Request) => void
  zIndex?: number
}

export function RequestViewModal({ request, isOpen, onClose, onEdit, zIndex = 9999 }: RequestViewModalProps) {
  if (!isOpen || !request) return null

  const handleEdit = () => {
    onEdit(request)
  }

  const getStatusColor = (status: Request['status']) => {
    switch (status) {
      case 'ΕΚΚΡΕΜΕΙ': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'ΣΕ_ΕΞΕΛΙΞΗ': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'ΟΛΟΚΛΗΡΩΘΗΚΕ': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'ΑΠΟΡΡΙΦΘΗΚΕ': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: Request['status']) => {
    switch (status) {
      case 'ΕΚΚΡΕΜΕΙ': return 'Εκκρεμές'
      case 'ΣΕ_ΕΞΕΛΙΞΗ': return 'Σε Εξέλιξη'
      case 'ΟΛΟΚΛΗΡΩΘΗΚΕ': return 'Ολοκληρωμένο'
      case 'ΑΠΟΡΡΙΦΘΗΚΕ': return 'Απορρίφθηκε'
      default: return 'Άγνωστο'
    }
  }

  const getStatusIcon = (status: Request['status']) => {
    switch (status) {
      case 'ΕΚΚΡΕΜΕΙ': return Clock
      case 'ΣΕ_ΕΞΕΛΙΞΗ': return AlertTriangle
      case 'ΟΛΟΚΛΗΡΩΘΗΚΕ': return CheckCircle
      case 'ΑΠΟΡΡΙΦΘΗΚΕ': return XCircle
      default: return FileText
    }
  }

  const getPriorityColor = (priority: Request['priority']) => {
    switch (priority) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPriorityText = (priority: Request['priority']) => {
    switch (priority) {
      case 'low': return 'Χαμηλή'
      case 'medium': return 'Μέση'
      case 'high': return 'Υψηλή'
      case 'urgent': return 'Επείγουσα'
      default: return 'Άγνωστο'
    }
  }

  const StatusIcon = getStatusIcon(request.status)

  // Determine type based on whether it's linked to military personnel
  const getRequestType = () => {
    return request.militaryPersonnelId ? 'Στρατιωτικό Αίτημα' : 'Πολιτικό Αίτημα'
  }

  const getRequestTypeColor = () => {
    return request.militaryPersonnelId
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  }

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4" style={{ zIndex }}>
      <div className="absolute inset-0 bg-black opacity-50" style={{ zIndex: zIndex - 10 }} onClick={onClose}></div>

      <div className="responsive-modal-lg bg-slate-800 border border-slate-700 rounded-xl max-h-screen-90 overflow-y-auto relative" style={{ zIndex }}>
        {/* Header */}
        <div className="flex items-center justify-between responsive-padding border-b border-slate-700">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-blue-400 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-white">
                {request.requestType}
              </h2>
              <p className="text-gray-400 text-sm">
                Αίτημα #{request.id.slice(-8)} • {getRequestType()}
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
          
          {/* Status & Priority Badges */}
          <div className="flex items-center flex-wrap gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center ${getStatusColor(request.status)}`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {getStatusText(request.status)}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
              Προτεραιότητα: {getPriorityText(request.priority)}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRequestTypeColor()}`}>
              {getRequestType()}
            </span>
          </div>

          {/* Request Details */}
          <div>
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-medium text-white">Λεπτομέρειες Αιτήματος</h3>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-2">Περιγραφή</p>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-white whitespace-pre-wrap">
                    {request.description}
                  </p>
                </div>
              </div>
              {request.notes && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Σημειώσεις</p>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-white whitespace-pre-wrap">
                      {request.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Citizen Information */}
          <div>
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-medium text-white">Στοιχεία Πολίτη</h3>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">ID Πολίτη</p>
                  <p className="text-white font-medium font-mono text-sm">
                    {request.citizenId || request.militaryPersonnelId || 'Δεν καθορίστηκε'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Τύπος</p>
                  <p className="text-white font-medium">
                    {request.militaryPersonnelId ? 'Στρατιωτικό Προσωπικό' : 'Πολίτης'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Processing Information */}
          <div>
            <div className="flex items-center mb-4">
              <Building className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-medium text-white">Επεξεργασία</h3>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Κατάσταση</p>
                  <p className="text-white font-medium">{getStatusText(request.status)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Προτεραιότητα</p>
                  <p className="text-white font-medium">{getPriorityText(request.priority)}</p>
                </div>
                {request.department && (
                  <div className="md:col-span-2">
                    <p className="text-gray-400 text-sm">Αρμόδιο Τμήμα</p>
                    <p className="text-white font-medium">{request.department}</p>
                  </div>
                )}
                {request.sendDate && (
                  <div>
                    <p className="text-gray-400 text-sm">Ημερομηνία Αποστολής</p>
                    <p className="text-white font-medium">
                      {new Date(request.sendDate).toLocaleDateString('el-GR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {request.completionDate && (
                  <div>
                    <p className="text-gray-400 text-sm">Ημερομηνία Ολοκλήρωσης</p>
                    <p className="text-white font-medium">
                      {new Date(request.completionDate).toLocaleDateString('el-GR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Information */}
          <div>
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-medium text-white">Χρονοδιάγραμμα</h3>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500 rounded-full p-1">
                    <Calendar className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Δημιουργία Αιτήματος</span>
                      <span className="text-gray-400 text-sm">
                        {new Date(request.created_at).toLocaleDateString('el-GR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">Το αίτημα καταχωρήθηκε στο σύστημα</p>
                  </div>
                </div>

                {request.sendDate && (
                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-500 rounded-full p-1">
                      <Clock className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">Αποστολή</span>
                        <span className="text-gray-400 text-sm">
                          {new Date(request.sendDate).toLocaleDateString('el-GR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">Το αίτημα απεστάλη για επεξεργασία</p>
                    </div>
                  </div>
                )}

                {request.completionDate && (
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-500 rounded-full p-1">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">Ολοκλήρωση</span>
                        <span className="text-gray-400 text-sm">
                          {new Date(request.completionDate).toLocaleDateString('el-GR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">Το αίτημα ολοκληρώθηκε με επιτυχία</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* System Information */}
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
                    {new Date(request.created_at).toLocaleDateString('el-GR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Τελευταία Ενημέρωση</p>
                  <p className="text-white font-medium">
                    {new Date(request.updated_at).toLocaleDateString('el-GR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-400 text-sm">ID Συστήματος</p>
                  <p className="text-white font-medium font-mono text-sm">{request.id}</p>
                </div>
              </div>
            </div>
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

  // Use portal to render outside of any parent stacking contexts
  return createPortal(modalContent, document.body)
}
