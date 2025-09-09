import { X, Shield, User, MapPin, FileText, Calendar, Edit, Star } from 'lucide-react'

interface MilitaryPersonnel {
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
  description: string
  sendDate?: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string
  updated_at: string
}

interface MilitaryViewModalProps {
  militaryPersonnel: MilitaryPersonnel | null
  isOpen: boolean
  onClose: () => void
  onEdit: (militaryPersonnel: MilitaryPersonnel) => void
}

export function MilitaryViewModal({ militaryPersonnel, isOpen, onClose, onEdit }: MilitaryViewModalProps) {
  if (!isOpen || !militaryPersonnel) return null

  const handleEdit = () => {
    onEdit(militaryPersonnel)
    onClose()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Εκκρεμεί'
      case 'approved': return 'Εγκρίθηκε'
      case 'rejected': return 'Απορρίφθηκε'
      case 'completed': return 'Ολοκληρώθηκε'
      default: return 'Άγνωστο'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Calendar
      case 'approved': return Star
      case 'rejected': return X
      case 'completed': return Shield
      default: return FileText
    }
  }

  const StatusIcon = getStatusIcon(militaryPersonnel.status)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-400 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-white">
                {militaryPersonnel.rank} {militaryPersonnel.name} {militaryPersonnel.surname}
              </h2>
              <p className="text-gray-400 text-sm">
                ΑΜ: {militaryPersonnel.militaryId} • ΕΣΣΟ: {militaryPersonnel.esso}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Status Badge */}
          <div className="flex items-center space-x-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center ${getStatusColor(militaryPersonnel.status)}`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {getStatusText(militaryPersonnel.status)}
            </span>
            <span className="text-gray-400 text-sm">
              Αίτημα: {militaryPersonnel.requestType}
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
                  <p className="text-white font-medium">{militaryPersonnel.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Επώνυμο</p>
                  <p className="text-white font-medium">{militaryPersonnel.surname}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Αριθμός Μητρώου</p>
                  <p className="text-white font-medium font-mono">{militaryPersonnel.militaryId}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Βαθμός</p>
                  <p className="text-white font-medium">{militaryPersonnel.rank}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Military Information */}
          <div>
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-medium text-white">Στρατιωτικά Στοιχεία</h3>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Μονάδα Υπηρεσίας</p>
                  <p className="text-white font-medium">{militaryPersonnel.unit}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">ΕΣΣΟ</p>
                  <p className="text-white font-medium">
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">
                      {militaryPersonnel.esso}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Έτος ΕΣΣΟ</p>
                  <p className="text-white font-medium">{militaryPersonnel.essoYear}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Γράμμα ΕΣΣΟ</p>
                  <p className="text-white font-medium">{militaryPersonnel.essoLetter}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Request Information */}
          <div>
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-medium text-white">Στοιχεία Αιτήματος</h3>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Τύπος Αιτήματος</p>
                  <p className="text-white font-medium">{militaryPersonnel.requestType}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Ημερομηνία Αποστολής</p>
                  <p className="text-white font-medium">
                    {militaryPersonnel.sendDate 
                      ? new Date(militaryPersonnel.sendDate).toLocaleDateString('el-GR')
                      : <span className="text-gray-500">-</span>
                    }
                  </p>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Περιγραφή Αιτήματος</p>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-white whitespace-pre-wrap">
                    {militaryPersonnel.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {militaryPersonnel.notes && (
            <div>
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium text-white">Σημειώσεις</h3>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-white whitespace-pre-wrap">
                  {militaryPersonnel.notes}
                </p>
              </div>
            </div>
          )}

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
                    {new Date(militaryPersonnel.created_at).toLocaleDateString('el-GR', {
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
                    {new Date(militaryPersonnel.updated_at).toLocaleDateString('el-GR', {
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
                  <p className="text-white font-medium font-mono text-sm">{militaryPersonnel.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  )
}