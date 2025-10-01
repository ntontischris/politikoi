import React, { useState, useEffect } from 'react'
import { Phone, Mail, Users, Calendar, FileText, Plus, Edit, Trash2, Clock } from 'lucide-react'
import { useCommunicationStore, useCommunicationActions, type CommunicationDate } from '../../stores/communicationStore'
import { CommunicationForm } from '../forms/CommunicationForm'

interface CommunicationTimelineProps {
  citizenId: string
  citizenName?: string
}

const communicationIcons = {
  'phone': Phone,
  'email': Mail,
  'meeting': Users,
  'other': Calendar,
  'ΤΗΛΕΦΩΝΙΚΗ': Phone,
  'EMAIL': Mail,
  'ΠΡΟΣΩΠΙΚΗ': Users,
  'SMS': FileText,
  'ΓΕΝΙΚΗ': Calendar
}

const communicationLabels = {
  'phone': 'Τηλέφωνο',
  'email': 'Email',
  'meeting': 'Συνάντηση',
  'other': 'Άλλο',
  'ΤΗΛΕΦΩΝΙΚΗ': 'Τηλεφωνική',
  'EMAIL': 'Email',
  'ΠΡΟΣΩΠΙΚΗ': 'Προσωπική',
  'SMS': 'SMS',
  'ΓΕΝΙΚΗ': 'Γενική'
}

export const CommunicationTimeline: React.FC<CommunicationTimelineProps> = ({
  citizenId,
  citizenName
}) => {
  const store = useCommunicationStore()
  const actions = useCommunicationActions()

  const [showForm, setShowForm] = useState(false)
  const [editingCommunication, setEditingCommunication] = useState<CommunicationDate | null>(null)
  const [communications, setCommunications] = useState<CommunicationDate[]>([])

  // Initialize realtime connection on mount
  useEffect(() => {
    const initializeStore = async () => {
      try {
        // Initialize realtime subscription for the communications store
        await store.initialize()
      } catch (error) {
        console.error('Error initializing communications store:', error)
      }
    }

    initializeStore()
  }, []) // Run once on mount

  // Load citizen-specific communications
  useEffect(() => {
    const loadData = async () => {
      try {
        const citizenComms = await actions.getCommunicationsByCitizen(citizenId)
        setCommunications(citizenComms)
      } catch (error) {
        console.error('Error loading communications:', error)
      }
    }

    // Only load if store is initialized
    if (store.isInitialized) {
      loadData()
    }
  }, [citizenId, store.isInitialized])

  // REALTIME SYNC: Update local communications when store items change
  useEffect(() => {
    // Filter communications for this citizen from the realtime store
    const citizenComms = store.items.filter(comm => comm.citizenId === citizenId)

    // Update local state with realtime data
    if (citizenComms.length > 0 || store.items.length > 0) {
      setCommunications(citizenComms)
    }
  }, [store.items, store.lastSync, citizenId]) // Re-run when store updates

  // Filter communications from store items (fallback)
  const storeComms = (store.items || []).filter(comm => comm.citizenId === citizenId)
  const displayComms = communications.length > 0 ? communications : storeComms
  const lastCommunication = displayComms.length > 0 ? displayComms[0] : null

  const handleEdit = (communication: CommunicationDate) => {
    setEditingCommunication(communication)
    setShowForm(true)
  }

  const handleDelete = async (communication: CommunicationDate) => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την επικοινωνία;')) {
      try {
        await store.deleteItem(communication.id)
        // Reload communications after deletion
        const citizenComms = await actions.getCommunicationsByCitizen(citizenId)
        setCommunications(citizenComms)
      } catch (error) {
        console.error('Σφάλμα κατά τη διαγραφή:', error)
      }
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCommunication(null)
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

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-lg responsive-padding">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-400" />
            Ιστορικό Επικοινωνίας
          </h3>
          {citizenName && (
            <p className="text-slate-400 text-sm mt-1">{citizenName}</p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors touch-target w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Νέα Επικοινωνία</span>
        </button>
      </div>

      {/* Last Communication Summary */}
      {lastCommunication && (
        <div className="mb-6 responsive-padding bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-300 mb-2">Τελευταία Επικοινωνία</h4>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {React.createElement(communicationIcons[lastCommunication.communicationType] || communicationIcons['ΓΕΝΙΚΗ'], {
              className: "w-4 h-4 text-blue-400"
            })}
            <span className="text-white font-medium">
              {communicationLabels[lastCommunication.communicationType] || 'Γενική'}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">
              {getTimeAgo(lastCommunication.contactDate)}
            </span>
          </div>
        </div>
      )}

      {/* Timeline */}
      {displayComms.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">Δεν υπάρχουν καταγεγραμμένες επικοινωνίες</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-blue-400 hover:text-blue-300 underline touch-target"
          >
            Προσθέστε την πρώτη επικοινωνία
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayComms.map((communication, index) => {
            const IconComponent = communicationIcons[communication.communicationType] || communicationIcons['other']
            const isLast = index === displayComms.length - 1

            return (
              <div key={communication.id} className="relative">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-6 top-12 w-0.5 h-full bg-slate-700 -z-10" />
                )}

                <div className="flex items-start space-x-3 sm:space-x-4 group">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 bg-slate-700 border-2 border-slate-600 rounded-full flex items-center justify-center">
                    <IconComponent className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600 rounded-lg responsive-padding transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h4 className="font-medium text-white">
                            {communicationLabels[communication.communicationType] || 'Άλλο'}
                          </h4>
                          <span className="text-sm text-slate-400">
                            {formatDate(communication.contactDate)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {getTimeAgo(communication.contactDate)}
                          </span>
                        </div>
                        {communication.notes && (
                          <p className="text-slate-300 text-sm leading-relaxed">
                            {communication.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1 sm:space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(communication)}
                          className="touch-target text-slate-400 hover:text-blue-400 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(communication)}
                          className="touch-target text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
      {store.error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-red-300 text-sm">{store.error}</p>
        </div>
      )}

      {/* Communication Form Modal */}
      {showForm && (
        <CommunicationForm
          citizenId={citizenId}
          communication={editingCommunication}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}