import React, { useState, useEffect } from 'react'
import { FileText, AlertTriangle, Plus, Edit, Trash2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useRequestStore, useRequestActions, type Request } from '../../stores/realtimeRequestStore'
import { RequestForm } from '../forms/RequestForm'
import { showRequestViewModal } from '../modals/RequestViewModalContainer'

interface RequestTimelineProps {
  citizenId: string
  citizenName?: string
  showAddButton?: boolean
  onRequestFormOpen?: (citizenId: string) => void
}

const statusIcons = {
  'ΕΚΚΡΕΜΕΙ': Clock,
  'ΣΕ_ΕΞΕΛΙΞΗ': AlertCircle,
  'ΟΛΟΚΛΗΡΩΘΗΚΕ': CheckCircle,
  'ΑΠΟΡΡΙΦΘΗΚΕ': XCircle
}

const statusLabels = {
  'ΕΚΚΡΕΜΕΙ': 'Εκκρεμές',
  'ΣΕ_ΕΞΕΛΙΞΗ': 'Σε Εξέλιξη',
  'ΟΛΟΚΛΗΡΩΘΗΚΕ': 'Ολοκληρωμένο',
  'ΑΠΟΡΡΙΦΘΗΚΕ': 'Απορρίφθηκε'
}

const statusColors = {
  'ΕΚΚΡΕΜΕΙ': 'text-blue-400',
  'ΣΕ_ΕΞΕΛΙΞΗ': 'text-yellow-400',
  'ΟΛΟΚΛΗΡΩΘΗΚΕ': 'text-emerald-400',
  'ΑΠΟΡΡΙΦΘΗΚΕ': 'text-red-400'
}

const priorityColors = {
  low: 'text-slate-400',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-400'
}

const priorityLabels = {
  low: 'Χαμηλή',
  medium: 'Μέτρια',
  high: 'Υψηλή',
  urgent: 'Επείγουσα'
}

export const RequestTimeline: React.FC<RequestTimelineProps> = ({
  citizenId,
  citizenName,
  showAddButton = true,
  onRequestFormOpen
}) => {
  const {
    items: requests,
    error,
    initialize: loadRequests
  } = useRequestStore()

  const {
    deleteItem: deleteRequest
  } = useRequestActions()

  const [showForm, setShowForm] = useState(false)
  const [editingRequest, setEditingRequest] = useState<Request | null>(null)

  // Load requests when component mounts
  useEffect(() => {
    loadRequests()
  }, [])

  // Filter requests for this citizen
  const citizenRequests = (requests || [])
    .filter(request => request.citizenId === citizenId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const handleEdit = (request: Request) => {
    setEditingRequest(request)
    setShowForm(true)
  }

  const handleView = (request: Request) => {
    showRequestViewModal(request, {
      onEdit: handleEdit,
      onClose: () => {
        // Optional callback when modal closes
      }
    })
  }

  const handleDelete = async (request: Request) => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το αίτημα;')) {
      try {
        await deleteRequest(request.id)
      } catch (error) {
        console.error('Σφάλμα κατά τη διαγραφή:', error)
      }
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingRequest(null)
  }


  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Σήμερα'
    if (diffInDays === 1) return 'Χθες'
    if (diffInDays < 7) return `${diffInDays} μέρες πριν`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} εβδομάδες πριν`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} μήνες πριν`
    return `${Math.floor(diffInDays / 365)} χρόνια πριν`
  }

  const getProgressWidth = (request: Request) => {
    const statusOrder = ['ΕΚΚΡΕΜΕΙ', 'ΣΕ_ΕΞΕΛΙΞΗ', 'ΟΛΟΚΛΗΡΩΘΗΚΕ']
    const currentIndex = statusOrder.indexOf(request.status)
    if (request.status === 'ΑΠΟΡΡΙΦΘΗΚΕ') return '100%'
    if (request.status === 'ΟΛΟΚΛΗΡΩΘΗΚΕ') return '100%'
    if (currentIndex === -1) return '33%' // Default for unknown status
    return `${((currentIndex + 1) / statusOrder.length) * 100}%`
  }

  // Statistics
  const stats = {
    total: citizenRequests.length,
    completed: citizenRequests.filter(r => r.status === 'ΟΛΟΚΛΗΡΩΘΗΚΕ').length,
    inProgress: citizenRequests.filter(r => r.status === 'ΣΕ_ΕΞΕΛΙΞΗ').length,
    pending: citizenRequests.filter(r => r.status === 'ΕΚΚΡΕΜΕΙ').length
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-lg responsive-padding">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-400" />
            Ιστορικό Αιτημάτων
          </h3>
          {citizenName && (
            <p className="text-slate-400 text-sm mt-1">{citizenName}</p>
          )}
        </div>
        {showAddButton && (
          <button
            onClick={() => {
              if (onRequestFormOpen) {
                onRequestFormOpen(citizenId)
              } else {
                setShowForm(true)
              }
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors touch-target w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Νέο Αίτημα</span>
          </button>
        )}
      </div>

      {/* Statistics */}
      {citizenRequests.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="responsive-padding bg-slate-700/30 border border-slate-600 rounded-lg">
            <div className="text-base sm:text-lg font-semibold text-white">{stats.total}</div>
            <div className="text-xs sm:text-sm text-slate-400">Σύνολο</div>
          </div>
          <div className="responsive-padding bg-slate-700/30 border border-slate-600 rounded-lg">
            <div className="text-base sm:text-lg font-semibold text-emerald-400">{stats.completed}</div>
            <div className="text-xs sm:text-sm text-slate-400">Ολοκληρωμένα</div>
          </div>
          <div className="responsive-padding bg-slate-700/30 border border-slate-600 rounded-lg">
            <div className="text-base sm:text-lg font-semibold text-yellow-400">{stats.inProgress}</div>
            <div className="text-xs sm:text-sm text-slate-400">Σε Εξέλιξη</div>
          </div>
          <div className="responsive-padding bg-slate-700/30 border border-slate-600 rounded-lg">
            <div className="text-base sm:text-lg font-semibold text-blue-400">{stats.pending}</div>
            <div className="text-xs sm:text-sm text-slate-400">Εκκρεμή</div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {citizenRequests.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">Δεν υπάρχουν καταχωρημένα αιτήματα</p>
          {showAddButton && (
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-400 hover:text-blue-300 underline touch-target"
            >
              Προσθέστε το πρώτο αίτημα
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {citizenRequests.map((request, index) => {
            const StatusIcon = statusIcons[request.status] || Clock
            const isLast = index === citizenRequests.length - 1

            return (
              <div key={request.id} className="relative">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-6 top-16 w-0.5 h-full bg-slate-700 -z-10" />
                )}

                <div className="flex items-start space-x-3 sm:space-x-4 group">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 bg-slate-700 border-2 border-slate-600 rounded-full flex items-center justify-center">
                    <StatusIcon className={`w-4 sm:w-5 h-4 sm:h-5 ${statusColors[request.status] || 'text-gray-400'}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600 rounded-lg responsive-padding transition-colors">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h4 className="font-medium text-white cursor-pointer hover:text-blue-400 transition-colors"
                              onClick={() => handleView(request)}>
                            {request.requestType}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-slate-800 ${statusColors[request.status] || 'text-gray-400'}`}>
                            {statusLabels[request.status] || request.status}
                          </span>
                          <span className={`text-xs font-medium ${priorityColors[request.priority]}`}>
                            {priorityLabels[request.priority]}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-400 mb-3">
                          <span>{formatDate(request.created_at)}</span>
                          <span>•</span>
                          <span>{getTimeAgo(request.created_at)}</span>
                        </div>

                        {/* Progress Bar */}
                        {request.status !== 'ΑΠΟΡΡΙΦΘΗΚΕ' && (
                          <div className="mb-3">
                            <div className="w-full bg-slate-600 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  request.status === 'ΟΛΟΚΛΗΡΩΘΗΚΕ' 
                                    ? 'bg-emerald-500' 
                                    : 'bg-blue-500'
                                }`}
                                style={{ width: getProgressWidth(request) }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1 sm:space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleView(request)}
                          className="touch-target text-slate-400 hover:text-blue-400 hover:bg-slate-600 rounded-lg transition-colors"
                          title="Προβολή"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(request)}
                          className="touch-target text-slate-400 hover:text-blue-400 hover:bg-slate-600 rounded-lg transition-colors"
                          title="Επεξεργασία"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(request)}
                          className="touch-target text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded-lg transition-colors"
                          title="Διαγραφή"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Description Preview */}
                    {request.description && (
                      <p className="text-slate-300 text-sm line-clamp-2 leading-relaxed">
                        {request.description.length > 100 
                          ? `${request.description.substring(0, 100)}...` 
                          : request.description
                        }
                      </p>
                    )}

                    {/* Footer Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 pt-3 border-t border-slate-600 space-y-1 sm:space-y-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-400">
                        <span>Κατάσταση: {statusLabels[request.status] || request.status}</span>
                        {request.notes && <span>Σημειώσεις: {request.notes}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Request Form Modal - Show for edit mode or if no external handler */}
      {showForm && (editingRequest || !onRequestFormOpen) && (
        <RequestForm
          request={editingRequest}
          defaultCitizenId={citizenId}
          onClose={handleCloseForm}
          mode={editingRequest ? 'edit' : 'add'}
          zIndex={9999}
        />
      )}

    </div>
  )
}
