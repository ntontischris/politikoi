import { X, FileText, User, Building, Clock, AlertTriangle, Calendar, Edit, Star, CheckCircle } from 'lucide-react'

interface Request {
  id: string
  type: 'citizen' | 'military' | 'general'
  category: string
  title: string
  description: string
  submitterName: string
  submitterEmail: string
  submitterPhone: string
  submitterAfm?: string
  relatedCitizenId?: string
  relatedMilitaryId?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'submitted' | 'in_progress' | 'pending_review' | 'approved' | 'rejected' | 'completed'
  assignedTo?: string
  department: string
  estimatedDays?: number
  actualDays?: number
  submissionDate: string
  responseDate?: string
  completionDate?: string
  notes: string
  attachments?: string[]
  created_at: string
  updated_at: string
}

interface RequestViewModalProps {
  request: Request | null
  isOpen: boolean
  onClose: () => void
  onEdit: (request: Request) => void
}

export function RequestViewModal({ request, isOpen, onClose, onEdit }: RequestViewModalProps) {
  if (!isOpen || !request) return null

  const handleEdit = () => {
    onEdit(request)
    onClose()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'in_progress': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'pending_review': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted': return 'Υποβλήθηκε'
      case 'in_progress': return 'Σε Εξέλιξη'
      case 'pending_review': return 'Εκκρεμεί Έλεγχος'
      case 'approved': return 'Εγκρίθηκε'
      case 'rejected': return 'Απορρίφθηκε'
      case 'completed': return 'Ολοκληρώθηκε'
      default: return 'Άγνωστο'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return FileText
      case 'in_progress': return Clock
      case 'pending_review': return AlertTriangle
      case 'approved': return Star
      case 'rejected': return X
      case 'completed': return CheckCircle
      default: return FileText
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Χαμηλή'
      case 'medium': return 'Μέση'
      case 'high': return 'Υψηλή'
      case 'urgent': return 'Επείγουσα'
      default: return 'Άγνωστο'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'citizen': return 'Πολιτικό Αίτημα'
      case 'military': return 'Στρατιωτικό Αίτημα'
      case 'general': return 'Γενικό Αίτημα'
      default: return 'Άγνωστο'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'citizen': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'military': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'general': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const StatusIcon = getStatusIcon(request.status)

  // Calculate response time
  const getResponseTime = () => {
    if (!request.responseDate) return null
    const submissionDate = new Date(request.submissionDate)
    const responseDate = new Date(request.responseDate)
    const diffDays = Math.ceil((responseDate.getTime() - submissionDate.getTime()) / (1000 * 3600 * 24))
    return diffDays
  }

  const responseTime = getResponseTime()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-blue-400 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-white">
                {request.title}
              </h2>
              <p className="text-gray-400 text-sm">
                Αίτημα #{request.id} • {getTypeText(request.type)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEdit}
              className="text-blue-400 hover:text-blue-300 p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Επεξεργασία"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Status & Priority Badges */}
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center ${getStatusColor(request.status)}`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {getStatusText(request.status)}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
              Προτεραιότητα: {getPriorityText(request.priority)}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(request.type)}`}>
              {getTypeText(request.type)}
            </span>
            <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs">
              {request.category}
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

          {/* Submitter Information */}
          <div>
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-medium text-white">Στοιχεία Αιτούντα</h3>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Ονοματεπώνυμο</p>
                  <p className="text-white font-medium">{request.submitterName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white font-medium">{request.submitterEmail}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Τηλέφωνο</p>
                  <p className="text-white font-medium">{request.submitterPhone}</p>
                </div>
                {request.submitterAfm && (
                  <div>
                    <p className="text-gray-400 text-sm">ΑΦΜ</p>
                    <p className="text-white font-medium font-mono">{request.submitterAfm}</p>
                  </div>
                )}
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
                  <p className="text-gray-400 text-sm">Αρμόδιο Τμήμα</p>
                  <p className="text-white font-medium">{request.department}</p>
                </div>
                {request.assignedTo && (
                  <div>
                    <p className="text-gray-400 text-sm">Ανατέθηκε σε</p>
                    <p className="text-white font-medium">{request.assignedTo}</p>
                  </div>
                )}
                {request.estimatedDays && (
                  <div>
                    <p className="text-gray-400 text-sm">Εκτιμώμενες Ημέρες</p>
                    <p className="text-white font-medium">{request.estimatedDays} ημέρες</p>
                  </div>
                )}
                {request.actualDays && (
                  <div>
                    <p className="text-gray-400 text-sm">Πραγματικές Ημέρες</p>
                    <p className="text-white font-medium">{request.actualDays} ημέρες</p>
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
                      <span className="text-white font-medium">Υποβολή Αιτήματος</span>
                      <span className="text-gray-400 text-sm">
                        {new Date(request.submissionDate).toLocaleDateString('el-GR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">Το αίτημα υποβλήθηκε στο σύστημα</p>
                  </div>
                </div>

                {request.responseDate && (
                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-500 rounded-full p-1">
                      <Clock className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">Απόκριση</span>
                        <span className="text-gray-400 text-sm">
                          {new Date(request.responseDate).toLocaleDateString('el-GR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Απόκριση σε {responseTime} {responseTime === 1 ? 'ημέρα' : 'ημέρες'}
                      </p>
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
        <div className="flex justify-end space-x-4 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Κλείσιμο
          </button>
          <button
            onClick={handleEdit}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Επεξεργασία
          </button>
        </div>
      </div>
    </div>
  )
}