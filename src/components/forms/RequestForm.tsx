import { useState, useEffect } from 'react'
import { X, Save, FileText, User, AlertTriangle, Building } from 'lucide-react'
import { useCitizenStore } from '../../stores/citizenStore'
import { useMilitaryStore } from '../../stores/militaryStore'

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
  request?: any
  defaultCitizenId?: string
  initialData?: Partial<RequestFormData>
  mode: 'add' | 'edit'
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

const requestTypes = [
  { value: 'citizen', label: 'Πολιτικό Αίτημα', icon: User },
  { value: 'military', label: 'Στρατιωτικό Αίτημα', icon: AlertTriangle }
]

const citizenCategories = [
  'Βεβαίωση',
  'Πιστοποιητικό',
  'Άδεια',
  'Δήλωση',
  'Αίτηση Επιδότησης',
  'Φοιτητικό Επίδομα',
  'Άλλο'
]

const militaryCategories = [
  'Μετάθεση',
  'Προαγωγή',
  'Άδεια',
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

export function RequestForm({ isOpen = true, onClose, onSubmit, initialData, mode = 'add' }: RequestFormProps) {
  const [formData, setFormData] = useState<RequestFormData>({
    ...initialFormData,
    ...initialData
  })
  const [errors, setErrors] = useState<Partial<RequestFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Store hooks
  const { items: citizens, loadItems: loadCitizens } = useCitizenStore()
  const { items: militaryPersonnel, loadItems: loadMilitaryPersonnel } = useMilitaryStore()
  
  // Load data when component mounts
  useEffect(() => {
    if (isOpen) {
      loadCitizens()
      loadMilitaryPersonnel()
    }
  }, [isOpen])
  
  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialFormData,
        ...initialData
      })
    }
  }, [initialData, mode])
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData)
      setErrors({})
    }
  }, [isOpen])

  const getCategoriesByType = (type: string) => {
    switch (type) {
      case 'citizen': return citizenCategories
      case 'military': return militaryCategories
      default: return []
    }
  }
  
  // Get filtered data based on type
  const getAvailablePersons = () => {
    if (formData.type === 'citizen') {
      return citizens.filter(c => c.status === 'active')
    } else if (formData.type === 'military') {
      return militaryPersonnel.filter(m => m.status === 'pending' || m.status === 'approved')
    }
    return []
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<RequestFormData> = {}

    // Required fields validation
    if (!formData.type.trim()) {
      newErrors.type = 'citizen' as any
    }
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
    
    // Person selection validation
    if (formData.type === 'citizen' && !formData.citizenId.trim()) {
      newErrors.citizenId = 'Η επιλογή πολίτη είναι υποχρεωτική' as any
    }
    if (formData.type === 'military' && !formData.militaryId.trim()) {
      newErrors.militaryId = 'Η επιλογή στρατιωτικού είναι υποχρεωτική' as any
    }

    // Estimated days validation (optional but if provided should be a number)
    if (formData.estimatedDays && (isNaN(Number(formData.estimatedDays)) || Number(formData.estimatedDays) < 1)) {
      newErrors.estimatedDays = 'Οι εκτιμώμενες ημέρες πρέπει να είναι θετικός αριθμός'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof RequestFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Reset related fields when type changes
    if (field === 'type') {
      setFormData(prev => ({ 
        ...prev, 
        category: '',
        citizenId: '',
        militaryId: ''
      }))
    }
    
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
    try {
      onSubmit && await onSubmit(formData)
      onClose()
      setFormData(initialFormData)
      setErrors({})
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setFormData(initialFormData)
    setErrors({})
  }

  if (!isOpen) return null

  const categories = getCategoriesByType(formData.type)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-50" onClick={handleClose}></div>
      
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative z-10">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Request Type & Category */}
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
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.type ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                {requestTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-400">{errors.type}</p>
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
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  (formData.type === 'citizen' && errors.citizenId) || (formData.type === 'military' && errors.militaryId) 
                    ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                <option value="">
                  {formData.type === 'citizen' ? 'Επιλέξτε πολίτη' : 'Επιλέξτε στρατιωτικό'}
                </option>
                {getAvailablePersons().map(person => (
                  <option key={person.id} value={person.id}>
                    {formData.type === 'citizen' 
                      ? `${person.name} ${person.surname}` 
                      : `${person.name} ${person.surname} - ${(person as any).rank || ''}`
                    }
                  </option>
                ))}
              </select>
              {((formData.type === 'citizen' && errors.citizenId) || (formData.type === 'military' && errors.militaryId)) && (
                <p className="mt-1 text-sm text-red-400">
                  {formData.type === 'citizen' ? errors.citizenId : errors.militaryId}
                </p>
              )}
              {getAvailablePersons().length === 0 && (
                <div className="mt-2 p-3 bg-yellow-600/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-300">
                    ⚠️ Δεν υπάρχουν διαθέσιμοι {formData.type === 'citizen' ? 'πολίτες' : 'στρατιωτικοί'}.
                    <br />Παρακαλώ δημιουργήστε πρώτα {formData.type === 'citizen' ? 'έναν πολίτη' : 'έναν στρατιωτικό'} από το αντίστοιχο μενού.
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
}