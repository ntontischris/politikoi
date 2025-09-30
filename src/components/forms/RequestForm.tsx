import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, FileText, Building } from 'lucide-react'
import { useRealtimeCitizenStore } from '../../stores/realtimeCitizenStore'
import { useRequestActions, type Request } from '../../stores/realtimeRequestStore'
import { sanitizeFormData } from '../../utils/sanitization'

interface RequestFormData {
  type: 'citizen' | 'military'
  category: string
  title: string
  description: string
  citizenId: string
  militaryId: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  department: string
  estimatedDays: string
  notes: string
}

interface RequestFormProps {
  isOpen?: boolean
  onClose: () => void
  onSubmit?: (data: RequestFormData) => void
  onSuccess?: () => void
  request?: Request
  defaultCitizenId?: string
  initialData?: Partial<RequestFormData>
  mode: 'add' | 'edit'
  zIndex?: number
}

const initialFormData: RequestFormData = {
  type: 'citizen',
  category: '',
  title: '',
  description: '',
  citizenId: '',
  militaryId: '',
  priority: 'medium',
  department: '',
  estimatedDays: '',
  notes: ''
}

const allCategories = [
  // General categories
  'Βεβαίωση',
  'Πιστοποιητικό',
  'Άδεια',
  'Δήλωση',
  'Αίτηση Επιδότησης',
  'Φοιτητικό Επίδομα',
  // Military categories
  'Μετάθεση',
  'Προαγωγή',
  'Εκπαίδευση',
  'Απόσπαση',
  'Παραίτηση',
  'Συνταξιοδότηση',
  'Ιατρική Εξέταση',
  'Άλλο'
]

const priorities = [
  { value: 'low', label: 'Χαμηλή', color: 'text-green-400' },
  { value: 'medium', label: 'Μέση', color: 'text-yellow-400' },
  { value: 'high', label: 'Υψηλή', color: 'text-orange-400' },
  { value: 'urgent', label: 'Επείγουσα', color: 'text-red-400' }
]

const departments = [
  'Διοικητικές Υπηρεσίες',
  'Οικονομικές Υπηρεσίες',
  'Τεχνικές Υπηρεσίες',
  'Στρατιωτικές Υποθέσεις',
  'Κοινωνικές Υπηρεσίες',
  'Περιβάλλον & Καθαριότητα',
  'Πολιτισμός & Αθλητισμός',
  'Άλλο'
]

// Helper function to convert Request to RequestFormData
const convertRequestToFormData = (request: Request): RequestFormData => {
  // Parse requestType to extract category and title
  const requestTypeParts = request.requestType.split(' - ')
  const category = requestTypeParts[0] || ''
  const title = requestTypeParts[1] || ''

  return {
    type: request.militaryPersonnelId ? 'military' : 'citizen',
    category,
    title,
    description: request.description || '',
    citizenId: request.citizenId || '',
    militaryId: request.militaryPersonnelId || '',
    priority: request.priority || 'medium',
    department: '', // Not stored in Request object
    estimatedDays: '', // Not stored in Request object
    notes: request.notes || ''
  }
}

export function RequestForm({ isOpen = true, onClose, onSubmit, onSuccess, request, initialData, mode = 'add', defaultCitizenId, zIndex = 9999 }: RequestFormProps) {
  const [formData, setFormData] = useState<RequestFormData>(() => {
    if (request && mode === 'edit') {
      return convertRequestToFormData(request)
    }
    return {
      ...initialFormData,
      ...initialData
    }
  })
  const [errors, setErrors] = useState<Partial<RequestFormData & {militaryId: string}>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  
  // Store hooks
  const { items: citizens, initialize: loadCitizens } = useRealtimeCitizenStore()
  const { addItem: addRequest, updateItem: updateRequest } = useRequestActions()

  // Load data when component mounts
  useEffect(() => {
    if (isOpen) {
      loadCitizens()
    }
  }, [isOpen, loadCitizens])
  
  // Update form data when request changes (for edit mode)
  useEffect(() => {
    if (request && mode === 'edit') {
      setFormData(convertRequestToFormData(request))
    } else if (initialData) {
      setFormData({
        ...initialFormData,
        ...initialData
      })
    }
  }, [request, initialData, mode])

  // Set default citizen if provided and auto-detect type
  useEffect(() => {
    if (defaultCitizenId && mode === 'add' && !initialData) {
      // Find the citizen to check if they are military
      const selectedCitizen = citizens.find(c => c.id === defaultCitizenId)

      if (selectedCitizen) {
        // Determine type based on isMilitary flag
        const type = selectedCitizen.isMilitary ? 'military' : 'citizen'

        setFormData(prev => ({
          ...prev,
          type,
          citizenId: type === 'citizen' ? defaultCitizenId : '',
          militaryId: type === 'military' ? defaultCitizenId : ''
        }))
      } else {
        // Fallback if citizen not found
        setFormData(prev => ({
          ...prev,
          citizenId: defaultCitizenId
        }))
      }
    }
  }, [defaultCitizenId, mode, initialData, citizens])
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData)
      setErrors({})
      setSubmitError(null)
      setSubmitSuccess(false)
      setIsSubmitting(false)
    }
  }, [isOpen])

  // Get available citizens (including military personnel)
  const getAvailablePersons = () => {
    // Show all citizens - remove the status filter since Greek statuses are different
    return citizens
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<RequestFormData & {militaryId: string}> = {}

    // Required fields validation
    if (!formData.category.trim()) {
      newErrors.category = 'Η κατηγορία είναι υποχρεωτική'
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Ο τίτλος είναι υποχρεωτικός'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Η περιγραφή είναι υποχρεωτική'
    }
    if (!formData.department.trim()) {
      newErrors.department = 'Το τμήμα είναι υποχρεωτικό'
    }

    // Person selection validation - ensure someone is selected
    if (formData.type === 'citizen') {
      if (!formData.citizenId.trim()) {
        newErrors.citizenId = 'Η επιλογή πολίτη είναι υποχρεωτική'
      } else {
        // Verify the citizen exists and is not military
        const selectedCitizen = citizens.find(c => c.id === formData.citizenId)
        if (!selectedCitizen) {
          newErrors.citizenId = 'Ο επιλεγμένος πολίτης δεν υπάρχει'
        } else if (selectedCitizen.isMilitary) {
          newErrors.citizenId = 'Ο επιλεγμένος πολίτης είναι στρατιωτικό προσωπικό'
        }
      }
    }

    if (formData.type === 'military') {
      if (!formData.militaryId.trim()) {
        newErrors.militaryId = 'Η επιλογή στρατιωτικού είναι υποχρεωτική'
      } else {
        // Verify the military person exists and is military
        const selectedMilitary = citizens.find(c => c.id === formData.militaryId)
        if (!selectedMilitary) {
          newErrors.militaryId = 'Ο επιλεγμένος στρατιωτικός δεν υπάρχει'
        } else if (!selectedMilitary.isMilitary) {
          newErrors.militaryId = 'Ο επιλεγμένος δεν είναι στρατιωτικό προσωπικό'
        }
      }
    }

    // Estimated days validation (optional but if provided should be a number)
    if (formData.estimatedDays && (isNaN(Number(formData.estimatedDays)) || Number(formData.estimatedDays) < 1)) {
      newErrors.estimatedDays = 'Οι εκτιμώμενες ημέρες πρέπει να είναι θετικός αριθμός'
    }

    console.log('Form validation errors:', newErrors)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof RequestFormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }

      // Clear the opposite field when type changes
      if (field === 'type') {
        if (value === 'citizen') {
          newData.militaryId = ''
        } else if (value === 'military') {
          newData.citizenId = ''
        }
      }

      return newData
    })

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    // Sanitize form data before submission
    const sanitizedData = sanitizeFormData(formData)

    try {
      if (onSubmit) {
        await onSubmit(sanitizedData)
      } else if (mode === 'edit' && request) {
        // Update existing request
        const selectedPersonId = sanitizedData.type === 'citizen' ? sanitizedData.citizenId : sanitizedData.militaryId

        if (!selectedPersonId) {
          throw new Error('Δεν έχει επιλεγεί πολίτης ή στρατιωτικό προσωπικό')
        }

        const updateData = {
          citizenId: selectedPersonId,
          militaryPersonnelId: undefined, // Not used anymore since military are in citizens table
          requestType: `${sanitizedData.category} - ${sanitizedData.title}`, // Combine category and title
          description: sanitizedData.description,
          priority: sanitizedData.priority,
          notes: sanitizedData.notes?.trim() || undefined
        }

        console.log('Updating request data:', updateData)
        await updateRequest(request.id, updateData)
        console.log('Request updated successfully')

        setSubmitSuccess(true)

        // Call success callback if provided
        if (onSuccess) {
          onSuccess()
        }
      } else {
        // Create new request
        const selectedPersonId = sanitizedData.type === 'citizen' ? sanitizedData.citizenId : sanitizedData.militaryId

        if (!selectedPersonId) {
          throw new Error('Δεν έχει επιλεγεί πολίτης ή στρατιωτικό προσωπικό')
        }

        const requestData = {
          citizenId: selectedPersonId,
          militaryPersonnelId: undefined, // Not used anymore since military are in citizens table
          requestType: `${sanitizedData.category} - ${sanitizedData.title}`, // Combine category and title
          description: sanitizedData.description,
          status: 'ΕΚΚΡΕΜΕΙ' as const, // Use Greek status
          priority: sanitizedData.priority,
          sendDate: new Date().toISOString(),
          notes: sanitizedData.notes?.trim() || undefined
        }

        console.log('Submitting request data:', requestData)
        await addRequest(requestData)
        console.log('Request submitted successfully')

        setSubmitSuccess(true)

        // Call success callback if provided
        if (onSuccess) {
          onSuccess()
        }
      }

      // Close the form and reset state
      setTimeout(() => {
        onClose()
        setFormData(initialFormData)
        setErrors({})
        setSubmitError(null)
        setSubmitSuccess(false)
      }, 1000) // Give user a moment to see success message

    } catch (error) {
      console.error('Error submitting form:', error)
      const errorMessage = error instanceof Error ? error.message : 'Σφάλμα κατά την υποβολή του αιτήματος'
      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsSubmitting(false)  // Reset loading state when closing
    setSubmitError(null)
    setSubmitSuccess(false)
    onClose()
    setFormData(initialFormData)
    setErrors({})
  }

  if (!isOpen) return null

  // Use unified categories for all requests
  const categories = allCategories

  // Render using portal to avoid stacking context issues
  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex }}>
      <div className="absolute inset-0 bg-black opacity-50" style={{ zIndex: zIndex - 10 }} onClick={handleClose}></div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative" style={{ zIndex }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-blue-400 mr-3" />
            <h2 className="text-xl font-semibold text-white">
              {mode === 'add' ? 'Νέο Αίτημα' : 'Επεξεργασία Αιτήματος'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error and Success Messages */}
          {submitError && (
            <div className="mb-6 bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl flex items-center backdrop-blur-sm animate-slide-in">
              <X className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="flex-1 text-fluid-sm">{submitError}</span>
              <button
                type="button"
                onClick={() => setSubmitError(null)}
                className="ml-3 text-red-400 hover:text-red-300 touch-target-lg flex items-center justify-center rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {submitSuccess && (
            <div className="mb-6 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-2xl flex items-center backdrop-blur-sm animate-slide-in">
              <Save className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="flex-1 text-fluid-sm">Το αίτημα υποβλήθηκε με επιτυχία! Κλείσιμο σε λίγα δευτερόλεπτα...</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Type and Category */}
            <div className="lg:col-span-3">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium text-white">Τύπος & Κατηγορία Αιτήματος</h3>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Τύπος Αιτήματος *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                disabled={!!defaultCitizenId}
                className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !!defaultCitizenId ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                <option value="citizen">Πολιτικό Αίτημα</option>
                <option value="military">Στρατιωτικό Αίτημα</option>
              </select>
              {defaultCitizenId && (
                <div className="mt-2 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    ℹ️ Ο τύπος αιτήματος καθορίζεται αυτόματα από τον επιλεγμένο πολίτη.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Κατηγορία *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                <option value="">Επιλέξτε κατηγορία</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-400">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Προτεραιότητα *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Request Details */}
            <div className="lg:col-span-3 mt-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium text-white">Λεπτομέρειες Αιτήματος</h3>
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Τίτλος *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="Σύντομος τίτλος του αιτήματος"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-400">{errors.title}</p>
              )}
            </div>

            {/* Person Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {formData.type === 'citizen' ? 'Επιλογή Πολίτη *' : 'Επιλογή Στρατιωτικού *'}
              </label>
              <select
                value={formData.type === 'citizen' ? formData.citizenId : formData.militaryId}
                onChange={(e) => handleInputChange(formData.type === 'citizen' ? 'citizenId' : 'militaryId', e.target.value)}
                disabled={!!defaultCitizenId}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.citizenId ? 'border-red-500' : 'border-slate-600'
                } ${!!defaultCitizenId ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                <option value="">{formData.type === 'citizen' ? 'Επιλέξτε πολίτη' : 'Επιλέξτε στρατιωτικό'}</option>
                {defaultCitizenId ? (
                  // When defaultCitizenId is set, show only that person
                  (() => {
                    const selectedPerson = getAvailablePersons().find(person => person.id === defaultCitizenId)
                    return selectedPerson ? (
                      <option key={selectedPerson.id} value={selectedPerson.id}>
                        {`${selectedPerson.name} ${selectedPerson.surname}`}
                        {selectedPerson.isMilitary && selectedPerson.militaryRank && ` - ${selectedPerson.militaryRank}`}
                      </option>
                    ) : null
                  })()
                ) : (
                  // When no defaultCitizenId, show all matching persons
                  getAvailablePersons()
                    .filter(person => formData.type === 'citizen' ? !person.isMilitary : person.isMilitary)
                    .map(person => (
                      <option key={person.id} value={person.id}>
                        {`${person.name} ${person.surname}`}
                        {person.isMilitary && person.militaryRank && ` - ${person.militaryRank}`}
                      </option>
                    ))
                )}
              </select>
              {(errors.citizenId || errors.militaryId) && (
                <p className="mt-1 text-sm text-red-400">
                  {formData.type === 'citizen' ? errors.citizenId : errors.militaryId}
                </p>
              )}
              {defaultCitizenId && (
                <div className="mt-2 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    ℹ️ Ο πολίτης είναι προεπιλεγμένος και δεν μπορεί να αλλάξει.
                  </p>
                </div>
              )}
              {!defaultCitizenId && getAvailablePersons().filter(person => formData.type === 'citizen' ? !person.isMilitary : person.isMilitary).length === 0 && (
                <div className="mt-2 p-3 bg-yellow-600/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-300">
                    ⚠️ Δεν υπάρχουν διαθέσιμοι {formData.type === 'citizen' ? 'πολίτες' : 'στρατιωτικοί'}.
                    <br />Παρακαλώ δημιουργήστε πρώτα έναν {formData.type === 'citizen' ? 'πολίτη' : 'στρατιωτικό'} από το μενού Πολίτες.
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Περιγραφή *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="Περιγράψτε το αίτημά σας με λεπτομέρειες..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Εκτιμώμενες Ημέρες
              </label>
              <input
                type="number"
                value={formData.estimatedDays}
                onChange={(e) => handleInputChange('estimatedDays', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.estimatedDays ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="π.χ. 5"
                min="1"
              />
              {errors.estimatedDays && (
                <p className="mt-1 text-sm text-red-400">{errors.estimatedDays}</p>
              )}
            </div>

            {/* Department & Processing */}
            <div className="lg:col-span-3 mt-6">
              <div className="flex items-center mb-4">
                <Building className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium text-white">Τμήμα & Επεξεργασία</h3>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Αρμόδιο Τμήμα *
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.department ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                <option value="">Επιλέξτε τμήμα</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-sm text-red-400">{errors.department}</p>
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Σημειώσεις
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Προσθέστε τυχόν επιπρόσθετες σημειώσεις..."
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center transition-colors"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {mode === 'add' ? 'Υποβολή' : 'Ενημέρωση'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // Use portal to render outside of any parent stacking contexts
  return createPortal(modalContent, document.body)
}