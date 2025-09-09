import { useState, useEffect } from 'react'
import { X, Save, User, Phone, MapPin, FileText } from 'lucide-react'

interface CitizenFormData {
  name: string
  surname: string
  afm: string
  phone: string
  email: string
  address: string
  city: string
  postalCode: string
  municipality: string
  electoralDistrict: string
  notes: string
}

interface CitizenFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CitizenFormData) => void
  initialData?: Partial<CitizenFormData>
  mode: 'add' | 'edit'
}

const initialFormData: CitizenFormData = {
  name: '',
  surname: '',
  afm: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  postalCode: '',
  municipality: '',
  electoralDistrict: '',
  notes: ''
}

const municipalities = [
  'ΘΕΣΣΑΛΟΝΙΚΗΣ',
  'ΚΑΛΑΜΑΡΙΑΣ', 
  'ΠΑΥΛΟΥ_ΜΕΛΑ',
  'ΚΟΡΔΕΛΙΟΥ-ΕΥΟΣΜΟΥ',
  'ΑΜΠΕΛΟΚΗΠΩΝ-ΜΕΝΕΜΕΝΗΣ',
  'ΝΕΑΠΟΛΗΣ-ΣΥΚΕΩΝ',
  'ΑΛΛΟ'
]

const electoralDistricts = [
  'Α ΘΕΣΣΑΛΟΝΙΚΗΣ',
  'Β ΘΕΣΣΑΛΟΝΙΚΗΣ'
]

export function CitizenForm({ isOpen, onClose, onSubmit, initialData, mode }: CitizenFormProps) {
  const [formData, setFormData] = useState<CitizenFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<CitizenFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form data when initialData changes
  useEffect(() => {
    setFormData({
      ...initialFormData,
      ...initialData,
      // Ensure all fields are strings, not undefined
      name: initialData?.name || '',
      surname: initialData?.surname || '',
      afm: initialData?.afm || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      postalCode: initialData?.postalCode || '',
      municipality: initialData?.municipality || '',
      electoralDistrict: initialData?.electoralDistrict || '',
      notes: initialData?.notes || ''
    })
    setErrors({}) // Clear any existing errors
  }, [initialData, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Partial<CitizenFormData> = {}

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Το όνομα είναι υποχρεωτικό'
    }
    if (!formData.surname.trim()) {
      newErrors.surname = 'Το επώνυμο είναι υποχρεωτικό'
    }
    if (!formData.afm.trim()) {
      newErrors.afm = 'Το ΑΦΜ είναι υποχρεωτικό'
    } else if (!/^\d{9}$/.test(formData.afm)) {
      newErrors.afm = 'Το ΑΦΜ πρέπει να έχει 9 ψηφία'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Το τηλέφωνο είναι υποχρεωτικό'
    } else if (!/^69\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Εισάγετε έγκυρο ελληνικό κινητό (69xxxxxxxx)'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Εισάγετε έγκυρο email'
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Η πόλη είναι υποχρεωτική'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof CitizenFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
      await onSubmit(formData)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-50" onClick={handleClose}></div>
      
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center">
            <User className="h-6 w-6 text-blue-400 mr-3" />
            <h2 className="text-xl font-semibold text-white">
              {mode === 'add' ? 'Νέος Πολίτης' : 'Επεξεργασία Πολίτη'}
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
                ΑΦΜ *
              </label>
              <input
                type="text"
                value={formData.afm}
                onChange={(e) => handleInputChange('afm', e.target.value.replace(/\D/g, '').slice(0, 9))}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.afm ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="123456789"
                maxLength={9}
              />
              {errors.afm && (
                <p className="mt-1 text-sm text-red-400">{errors.afm}</p>
              )}
            </div>

            {/* Contact Information */}
            <div className="lg:col-span-3 mt-6">
              <div className="flex items-center mb-4">
                <Phone className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium text-white">Στοιχεία Επικοινωνίας</h3>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Κινητό Τηλέφωνο *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="6912345678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Πόλη *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.city ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="Θεσσαλονίκη"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-400">{errors.city}</p>
              )}
            </div>

            {/* Address Information */}
            <div className="lg:col-span-3 mt-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium text-white">Στοιχεία Διεύθυνσης</h3>
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Διεύθυνση
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Οδός και αριθμός"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ταχ. Κώδικας
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="54628"
                maxLength={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Δήμος
              </label>
              <select
                value={formData.municipality}
                onChange={(e) => handleInputChange('municipality', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Επιλέξτε δήμο</option>
                {municipalities.map(municipality => (
                  <option key={municipality} value={municipality}>
                    {municipality.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Εκλογική Περιφέρεια
              </label>
              <select
                value={formData.electoralDistrict}
                onChange={(e) => handleInputChange('electoralDistrict', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Επιλέξτε περιφέρεια</option>
                {electoralDistricts.map(district => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="lg:col-span-3 mt-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium text-white">Επιπρόσθετες Πληροφορίες</h3>
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Σημειώσεις
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Προσθέστε τυχόν σημειώσεις..."
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