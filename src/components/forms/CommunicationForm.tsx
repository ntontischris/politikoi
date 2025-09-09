import React, { useState } from 'react'
import { X, Save, Phone, Mail, Users, Calendar, FileText } from 'lucide-react'
import { useCommunicationStore, type CommunicationDate } from '../../stores/communicationStore'
import { useCitizenStore } from '../../stores/citizenStore'

interface CommunicationFormProps {
  onClose: () => void
  communication?: CommunicationDate | null
  citizenId?: string
}

const communicationTypes = [
  { value: 'phone', label: 'Τηλεφωνική', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'visit', label: 'Επίσκεψη', icon: Users },
  { value: 'meeting', label: 'Συνάντηση', icon: Calendar },
  { value: 'other', label: 'Άλλο', icon: FileText }
]

export const CommunicationForm: React.FC<CommunicationFormProps> = ({
  onClose,
  communication,
  citizenId
}) => {
  const { addCommunication, updateCommunication, isLoading, error } = useCommunicationStore()
  const { citizens, getCitizen } = useCitizenStore()
  
  const [formData, setFormData] = useState({
    citizen_id: citizenId || communication?.citizen_id || '',
    communication_date: communication?.communication_date || new Date().toISOString().split('T')[0],
    type: communication?.type || 'phone' as const,
    notes: communication?.notes || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.citizen_id) {
      newErrors.citizen_id = 'Επιλέξτε πολίτη'
    }

    if (!formData.communication_date) {
      newErrors.communication_date = 'Επιλέξτε ημερομηνία επικοινωνίας'
    }

    if (!formData.type) {
      newErrors.type = 'Επιλέξτε τύπο επικοινωνίας'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      if (communication) {
        await updateCommunication(communication.id, formData)
      } else {
        await addCommunication(formData)
      }
      onClose()
    } catch (error) {
      console.error('Σφάλμα κατά την αποθήκευση:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const selectedCitizen = getCitizen(formData.citizen_id)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800/90 backdrop-blur-lg border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-400" />
            {communication ? 'Επεξεργασία Επικοινωνίας' : 'Νέα Επικοινωνία'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Citizen Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Πολίτης *
            </label>
            {citizenId ? (
              <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
                <p className="text-white font-medium">
                  {selectedCitizen?.name} {selectedCitizen?.surname}
                </p>
                <p className="text-slate-400 text-sm">
                  {selectedCitizen?.phone} • {selectedCitizen?.email}
                </p>
              </div>
            ) : (
              <select
                value={formData.citizen_id}
                onChange={(e) => handleInputChange('citizen_id', e.target.value)}
                className={`w-full p-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.citizen_id ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                <option value="">Επιλέξτε πολίτη...</option>
                {citizens.map(citizen => (
                  <option key={citizen.id} value={citizen.id}>
                    {citizen.name} {citizen.surname} - {citizen.phone}
                  </option>
                ))}
              </select>
            )}
            {errors.citizen_id && (
              <p className="text-red-400 text-sm mt-1">{errors.citizen_id}</p>
            )}
          </div>

          {/* Communication Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Ημερομηνία Επικοινωνίας *
            </label>
            <input
              type="date"
              value={formData.communication_date}
              onChange={(e) => handleInputChange('communication_date', e.target.value)}
              className={`w-full p-3 bg-slate-700/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.communication_date ? 'border-red-500' : 'border-slate-600'
              }`}
            />
            {errors.communication_date && (
              <p className="text-red-400 text-sm mt-1">{errors.communication_date}</p>
            )}
          </div>

          {/* Communication Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Τύπος Επικοινωνίας *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {communicationTypes.map((type) => {
                const IconComponent = type.icon
                return (
                  <label
                    key={type.value}
                    className={`flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-slate-600 hover:border-slate-500 text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="sr-only"
                    />
                    <IconComponent className="w-4 h-4" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </label>
                )
              })}
            </div>
            {errors.type && (
              <p className="text-red-400 text-sm mt-1">{errors.type}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Σημειώσεις
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Περιγράψτε το περιεχόμενο της επικοινωνίας..."
              rows={4}
              className={`w-full p-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                errors.notes ? 'border-red-500' : 'border-slate-600'
              }`}
            />
            {errors.notes && (
              <p className="text-red-400 text-sm mt-1">{errors.notes}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{communication ? 'Ενημέρωση' : 'Αποθήκευση'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}