import { useState, useEffect } from 'react'
import { X, Save, Shield, User, MapPin, FileText } from 'lucide-react'

interface MilitaryPersonnelFormData {
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
  sendDate: string
  notes: string
}

interface MilitaryPersonnelFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MilitaryPersonnelFormData) => void
  initialData?: Partial<MilitaryPersonnelFormData>
  mode: 'add' | 'edit'
}

const initialFormData: MilitaryPersonnelFormData = {
  name: '',
  surname: '',
  rank: '',
  unit: '',
  militaryId: '',
  esso: '',
  essoYear: '',
  essoLetter: '',
  requestType: '',
  description: '',
  sendDate: '',
  notes: ''
}

const militaryRanks = [
  // Enlisted
  'Στρατιώτης',
  'Δεκανέας',
  'Λοχίας',
  'Επιλοχίας',
  // NCOs
  'Ανθυπασπιστής',
  'Υπασπιστής',
  'Ανθυπολοχαγός',
  // Officers
  'Υπολοχαγός',
  'Λοχαγός',
  'Ταγματάρχης',
  'Αντισυνταγματάρχης',
  'Συνταγματάρχης',
  'Ταξίαρχος',
  'Υποστράτηγος',
  'Αντιστράτηγος',
  'Στρατηγός',
  // Air Force
  'Σμηναγός',
  'Επισμηναγός',
  'Αντισμήναρχος',
  'Σμήναρχος',
  'Αντιπτέραρχος',
  'Πτέραρχος'
]

const requestTypes = [
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

const essoYears = ['2025', '2024', '2023', '2022', '2021', '2020']
const essoLetters = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ']

export function MilitaryPersonnelForm({ isOpen, onClose, onSubmit, initialData, mode }: MilitaryPersonnelFormProps) {
  const [formData, setFormData] = useState<MilitaryPersonnelFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<MilitaryPersonnelFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form data when initialData changes
  useEffect(() => {
    setFormData({
      ...initialFormData,
      ...initialData,
      // Ensure all fields are strings, not undefined
      name: initialData?.name || '',
      surname: initialData?.surname || '',
      rank: initialData?.rank || '',
      unit: initialData?.unit || '',
      militaryId: initialData?.militaryId || '',
      esso: initialData?.esso || '',
      essoYear: initialData?.essoYear || '',
      essoLetter: initialData?.essoLetter || '',
      requestType: initialData?.requestType || '',
      description: initialData?.description || '',
      sendDate: initialData?.sendDate || '',
      notes: initialData?.notes || ''
    })
    setErrors({}) // Clear any existing errors
  }, [initialData, isOpen])

  const validateForm = (): boolean => {
    console.log('Starting form validation...')
    const newErrors: Partial<MilitaryPersonnelFormData> = {}

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Το όνομα είναι υποχρεωτικό'
    }
    if (!formData.surname.trim()) {
      newErrors.surname = 'Το επώνυμο είναι υποχρεωτικό'
    }
    if (!formData.rank.trim()) {
      newErrors.rank = 'Ο βαθμός είναι υποχρεωτικός'
    }
    if (!formData.unit.trim()) {
      newErrors.unit = 'Η μονάδα είναι υποχρεωτική'
    }
    if (!formData.militaryId.trim()) {
      newErrors.militaryId = 'Ο αριθμός μητρώου είναι υποχρεωτικός'
    } else if (!/^\d{6,8}$/.test(formData.militaryId)) {
      newErrors.militaryId = 'Ο αριθμός μητρώου πρέπει να έχει 6-8 ψηφία'
    }
    if (!formData.essoYear.trim()) {
      newErrors.essoYear = 'Το έτος ΕΣΣΟ είναι υποχρεωτικό'
    }
    if (!formData.essoLetter.trim()) {
      newErrors.essoLetter = 'Το γράμμα ΕΣΣΟ είναι υποχρεωτικό'
    }
    if (!formData.requestType.trim()) {
      newErrors.requestType = 'Ο τύπος αιτήματος είναι υποχρεωτικός'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Η περιγραφή είναι υποχρεωτική'
    }

    console.log('Validation errors found:', Object.keys(newErrors))

    // Construct ESSO automatically
    if (formData.essoYear && formData.essoLetter) {
      console.log('Updating ESSO field...')
      setFormData(prev => ({
        ...prev,
        esso: `${prev.essoYear}${prev.essoLetter}`
      }))
    }

    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0
    console.log('Form validation result:', isValid)
    return isValid
  }

  const handleInputChange = (field: keyof MilitaryPersonnelFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Update ESSO when year or letter changes
    if (field === 'essoYear' || field === 'essoLetter') {
      const year = field === 'essoYear' ? value : formData.essoYear
      const letter = field === 'essoLetter' ? value : formData.essoLetter
      if (year && letter) {
        setFormData(prev => ({ ...prev, esso: `${year}${letter}` }))
      }
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Form submit clicked, mode:', mode)
    console.log('Form data:', formData)
    
    if (!validateForm()) {
      console.log('Form validation failed')
      return
    }

    console.log('Form validation passed, submitting...')
    setIsSubmitting(true)
    
    // Ensure we always reset isSubmitting, even if something goes wrong
    try {
      console.log('Calling onSubmit with formData...')
      await onSubmit(formData)
      console.log('Form submitted successfully')
      
      // Reset form and close modal
      setFormData(initialFormData)
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
      alert(`Σφάλμα κατά την υποβολή: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`)
    }
    
    // Always reset submitting state regardless of success or failure
    console.log('Resetting isSubmitting to false')
    setIsSubmitting(false)
  }

  const handleClose = () => {
    onClose()
    setFormData(initialFormData)
    setErrors({})
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-50" onClick={handleClose}></div>
      
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-400 mr-3" />
            <h2 className="text-xl font-semibold text-white">
              {mode === 'add' ? 'Νέο Στρατιωτικό Αίτημα' : 'Επεξεργασία Στρατιωτικού Αιτήματος'}
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
            
            {/* Personal Information */}
            <div className="lg:col-span-3">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium text-white">Προσωπικά Στοιχεία</h3>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Όνομα *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="Εισάγετε το όνομα"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Επώνυμο *
              </label>
              <input
                type="text"
                value={formData.surname}
                onChange={(e) => handleInputChange('surname', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.surname ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="Εισάγετε το επώνυμο"
              />
              {errors.surname && (
                <p className="mt-1 text-sm text-red-400">{errors.surname}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Αριθμός Μητρώου *
              </label>
              <input
                type="text"
                value={formData.militaryId}
                onChange={(e) => handleInputChange('militaryId', e.target.value.replace(/\D/g, '').slice(0, 8))}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.militaryId ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="123456"
                maxLength={8}
              />
              {errors.militaryId && (
                <p className="mt-1 text-sm text-red-400">{errors.militaryId}</p>
              )}
            </div>

            {/* Military Information */}
            <div className="lg:col-span-3 mt-6">
              <div className="flex items-center mb-4">
                <Shield className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium text-white">Στρατιωτικά Στοιχεία</h3>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Βαθμός *
              </label>
              <select
                value={formData.rank}
                onChange={(e) => handleInputChange('rank', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.rank ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                <option value="">Επιλέξτε βαθμό</option>
                {militaryRanks.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
              {errors.rank && (
                <p className="mt-1 text-sm text-red-400">{errors.rank}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Μονάδα Υπηρεσίας *
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.unit ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="π.χ. 3η Μ.Π., 110 Π.Μ."
              />
              {errors.unit && (
                <p className="mt-1 text-sm text-red-400">{errors.unit}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ΕΣΣΟ
              </label>
              <input
                type="text"
                value={formData.esso}
                readOnly
                className="w-full bg-slate-600 border border-slate-500 text-gray-300 rounded-lg px-4 py-3 cursor-not-allowed"
                placeholder="Αυτόματα από έτος + γράμμα"
              />
            </div>

            {/* ESSO Details */}
            <div className="lg:col-span-3 mt-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium text-white">Στοιχεία ΕΣΣΟ</h3>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Έτος ΕΣΣΟ *
              </label>
              <select
                value={formData.essoYear}
                onChange={(e) => handleInputChange('essoYear', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.essoYear ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                <option value="">Επιλέξτε έτος</option>
                {essoYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {errors.essoYear && (
                <p className="mt-1 text-sm text-red-400">{errors.essoYear}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Γράμμα ΕΣΣΟ *
              </label>
              <select
                value={formData.essoLetter}
                onChange={(e) => handleInputChange('essoLetter', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.essoLetter ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                <option value="">Επιλέξτε γράμμα</option>
                {essoLetters.map(letter => (
                  <option key={letter} value={letter}>{letter}</option>
                ))}
              </select>
              {errors.essoLetter && (
                <p className="mt-1 text-sm text-red-400">{errors.essoLetter}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ημερομηνία Αποστολής
              </label>
              <input
                type="date"
                value={formData.sendDate}
                onChange={(e) => handleInputChange('sendDate', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Request Information */}
            <div className="lg:col-span-3 mt-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium text-white">Στοιχεία Αιτήματος</h3>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Τύπος Αιτήματος *
              </label>
              <select
                value={formData.requestType}
                onChange={(e) => handleInputChange('requestType', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.requestType ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                <option value="">Επιλέξτε τύπο αιτήματος</option>
                {requestTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.requestType && (
                <p className="mt-1 text-sm text-red-400">{errors.requestType}</p>
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Περιγραφή Αιτήματος *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="Περιγράψτε το αίτημα του στρατιωτικού..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description}</p>
              )}
            </div>

            <div className="lg:col-span-3">
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
              {mode === 'add' ? 'Αποθήκευση' : 'Ενημέρωση'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}