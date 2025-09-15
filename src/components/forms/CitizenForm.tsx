import { useState, useEffect } from 'react'
import { X, Save, User, Phone, MapPin, FileText, Shield } from 'lucide-react'

interface CitizenFormData {
  name: string
  surname: string
  afm: string
  phone: string
  landline: string
  email: string
  address: string
  city: string
  postalCode: string
  municipality: string
  electoralDistrict: string
  notes: string
  // Military fields
  isMilitary: boolean
  militaryRank: string
  militaryUnit: string
  militaryId: string
  militaryEsso: string
  militaryEssoYear: string
  militaryEssoLetter: string
  militaryWish: string
  militaryStatus: string
  militarySendDate: string
  militaryComments: string
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
  landline: '',
  email: '',
  address: '',
  city: '',
  postalCode: '',
  municipality: '',
  electoralDistrict: '',
  notes: '',
  // Military fields
  isMilitary: false,
  militaryRank: '',
  militaryUnit: '',
  militaryId: '',
  militaryEsso: '',
  militaryEssoYear: '',
  militaryEssoLetter: '',
  militaryWish: '',
  militaryStatus: 'pending',
  militarySendDate: '',
  militaryComments: ''
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

const militaryRanks = [
  'Στρατιώτης',
  'Δεκανέας',
  'Λοχίας',
  'Επιλοχίας',
  'Ανθυπολοχαγός',
  'Υπολοχαγός',
  'Λοχαγός',
  'Ταγματάρχης',
  'Αντισυνταγματάρχης',
  'Συνταγματάρχης',
  'Ταξίαρχος',
  'Υποστράτηγος',
  'Αντιστράτηγος',
  'Στρατηγός'
]

const militaryStatuses = [
  { value: 'pending', label: 'Εκκρεμεί' },
  { value: 'approved', label: 'Εγκρίθηκε' },
  { value: 'rejected', label: 'Απορρίφθηκε' },
  { value: 'completed', label: 'Ολοκληρώθηκε' }
]

const essoLetters = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ']

export function CitizenForm({ isOpen, onClose, onSubmit, initialData, mode }: CitizenFormProps) {
  const [formData, setFormData] = useState<CitizenFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<CitizenFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Update form data when initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData && mode === 'edit') {
        // For edit mode, populate with existing data
        setFormData({
          name: initialData.name || '',
          surname: initialData.surname || '',
          afm: initialData.afm || '',
          phone: initialData.phone || '',
          landline: initialData.landline || '',
          email: initialData.email || '',
          address: initialData.address || '',
          city: initialData.city || '',
          postalCode: initialData.postalCode || '',
          municipality: initialData.municipality || '',
          electoralDistrict: initialData.electoralDistrict || '',
          notes: initialData.notes || '',
          // Military fields
          isMilitary: initialData.isMilitary || false,
          militaryRank: initialData.militaryRank || '',
          militaryUnit: initialData.militaryUnit || '',
          militaryId: initialData.militaryId || '',
          militaryEsso: initialData.militaryEsso || '',
          militaryEssoYear: initialData.militaryEssoYear || '',
          militaryEssoLetter: initialData.militaryEssoLetter || '',
          militaryWish: initialData.militaryWish || '',
          militaryStatus: initialData.militaryStatus || 'pending',
          militarySendDate: initialData.militarySendDate || '',
          militaryComments: initialData.militaryComments || ''
        })
      } else {
        // For add mode, start with empty form
        setFormData(initialFormData)
      }
      setErrors({}) // Clear any existing errors
      setSubmitError(null) // Clear any submit errors
    }
  }, [initialData, isOpen, mode])

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
    // Phone validation - at least one phone (mobile or landline) is required
    const hasMobile = formData.phone.trim()
    const hasLandline = formData.landline.trim()
    
    if (!hasMobile && !hasLandline) {
      newErrors.phone = 'Απαιτείται τουλάχιστον ένα τηλέφωνο (κινητό ή σταθερό)'
      newErrors.landline = 'Απαιτείται τουλάχιστον ένα τηλέφωνο (κινητό ή σταθερό)'
    } else {
      // Clear the "required at least one phone" error if we have any phone
      // Check individual phone formats only if they're filled
      if (hasMobile) {
        if (!/^(69|68)\d{8}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
          newErrors.phone = 'Εισάγετε έγκυρο ελληνικό κινητό τηλέφωνο (πχ. 6912345678)'
        }
      }
      if (hasLandline) {
        if (!/^(21[0-9]|22[0-9]|23[1-9]|24[1-9]|25[0-9]|26[1-9]|27[0-9]|28[1-9])\d{7}$/.test(formData.landline.replace(/[\s-]/g, ''))) {
          newErrors.landline = 'Εισάγετε έγκυρο ελληνικό σταθερό τηλέφωνο (πχ. 2310123456)'
        }
      }
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
      // Scroll to first error
      const firstErrorElement = document.querySelector('.border-red-500')
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit(formData)
      // Success - form will be closed by parent component
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitError(error instanceof Error ? error.message : 'Παρουσιάστηκε σφάλμα κατά την αποθήκευση')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setErrors({})
    setSubmitError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black opacity-50" onClick={handleClose}></div>
      
      <div className="responsive-modal-lg bg-slate-800 border border-slate-700 rounded-xl max-h-screen-90 overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
          <div className="flex items-center min-w-0 flex-1">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mr-2 sm:mr-3 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-semibold text-white truncate">
              {mode === 'add' ? 'Νέος Πολίτης' : 'Επεξεργασία Πολίτη'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors touch-target flex-shrink-0 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          
          {/* Submit Error Alert */}
          {submitError && (
            <div className="mb-6 bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center">
              <X className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="flex-1 text-sm">{submitError}</span>
              <button 
                type="button"
                onClick={() => setSubmitError(null)}
                className="ml-2 text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Personal Information */}
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="flex items-center mb-4">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-medium text-white">Προσωπικά Στοιχεία</h3>
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
                className={`w-full bg-slate-700 border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target ${
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
                className={`w-full bg-slate-700 border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target ${
                  errors.surname ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="Εισάγετε το επώνυμο"
              />
              {errors.surname && (
                <p className="mt-1 text-sm text-red-400">{errors.surname}</p>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ΑΦΜ *
              </label>
              <input
                type="text"
                value={formData.afm}
                onChange={(e) => handleInputChange('afm', e.target.value.replace(/\D/g, '').slice(0, 9))}
                className={`w-full bg-slate-700 border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target ${
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
            <div className="sm:col-span-2 lg:col-span-3 mt-4 sm:mt-6">
              <div className="flex items-center mb-4">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-medium text-white">Στοιχεία Επικοινωνίας</h3>
                <p className="text-xs text-gray-400 ml-2">(Τουλάχιστον ένα τηλέφωνο απαιτείται)</p>
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
                className={`w-full bg-slate-700 border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target ${
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
                Σταθερό Τηλέφωνο *
              </label>
              <input
                type="tel"
                value={formData.landline}
                onChange={(e) => handleInputChange('landline', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target ${
                  errors.landline ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="2310123456"
              />
              {errors.landline && (
                <p className="mt-1 text-sm text-red-400">{errors.landline}</p>
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
                className={`w-full bg-slate-700 border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target ${
                  errors.email ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Πόλη *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={`w-full bg-slate-700 border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target ${
                  errors.city ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="Θεσσαλονίκη"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-400">{errors.city}</p>
              )}
            </div>

            {/* Address Information */}
            <div className="sm:col-span-2 lg:col-span-3 mt-4 sm:mt-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-medium text-white">Στοιχεία Διεύθυνσης</h3>
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Διεύθυνση
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
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
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
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
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
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
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
              >
                <option value="">Επιλέξτε περιφέρεια</option>
                {electoralDistricts.map(district => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            {/* Military Section */}
            <div className="sm:col-span-2 lg:col-span-3 mt-4 sm:mt-6">
              <div className="flex items-center mb-4">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mr-2 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-medium text-white">Στρατιωτικές Πληροφορίες</h3>
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="flex items-center text-sm font-medium text-gray-300 mb-4">
                <input
                  type="checkbox"
                  checked={formData.isMilitary}
                  onChange={(e) => handleInputChange('isMilitary', e.target.checked)}
                  className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                Είναι στρατιωτικό προσωπικό
              </label>
            </div>

            {formData.isMilitary && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Βαθμός
                  </label>
                  <select
                    value={formData.militaryRank}
                    onChange={(e) => handleInputChange('militaryRank', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-target"
                  >
                    <option value="">Επιλέξτε βαθμό...</option>
                    {militaryRanks.map(rank => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Μονάδα Υπηρεσίας
                  </label>
                  <input
                    type="text"
                    value={formData.militaryUnit}
                    onChange={(e) => handleInputChange('militaryUnit', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-target"
                    placeholder="π.χ. 1η ΤΑΞΥΔ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Στρατιωτικό Μητρώο
                  </label>
                  <input
                    type="text"
                    value={formData.militaryId}
                    onChange={(e) => handleInputChange('militaryId', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-target"
                    placeholder="Στρατιωτικό μητρώο"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ΕΣΣΟ
                  </label>
                  <input
                    type="text"
                    value={formData.militaryEsso}
                    onChange={(e) => handleInputChange('militaryEsso', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-target"
                    placeholder="ΕΣΣΟ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Έτος ΕΣΣΟ
                  </label>
                  <input
                    type="text"
                    value={formData.militaryEssoYear}
                    onChange={(e) => handleInputChange('militaryEssoYear', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-target"
                    placeholder="π.χ. 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Γράμμα ΕΣΣΟ
                  </label>
                  <select
                    value={formData.militaryEssoLetter}
                    onChange={(e) => handleInputChange('militaryEssoLetter', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-target"
                  >
                    <option value="">Επιλέξτε γράμμα...</option>
                    {essoLetters.map(letter => (
                      <option key={letter} value={letter}>{letter}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Επιθυμία/Αίτημα
                  </label>
                  <textarea
                    value={formData.militaryWish}
                    onChange={(e) => handleInputChange('militaryWish', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-target resize-none"
                    placeholder="Περιγράψτε την επιθυμία ή το αίτημα..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Κατάσταση
                  </label>
                  <select
                    value={formData.militaryStatus}
                    onChange={(e) => handleInputChange('militaryStatus', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-target"
                  >
                    {militaryStatuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ημερομηνία Αποστολής
                  </label>
                  <input
                    type="date"
                    value={formData.militarySendDate}
                    onChange={(e) => handleInputChange('militarySendDate', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-target"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Στρατιωτικά Σχόλια
                  </label>
                  <textarea
                    value={formData.militaryComments}
                    onChange={(e) => handleInputChange('militaryComments', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-target resize-none"
                    placeholder="Προσθέστε στρατιωτικά σχόλια..."
                  />
                </div>
              </>
            )}

            {/* Notes */}
            <div className="sm:col-span-2 lg:col-span-3 mt-4 sm:mt-6">
              <div className="flex items-center mb-4">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-medium text-white">Επιπρόσθετες Πληροφορίες</h3>
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Σημειώσεις
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target resize-none"
                placeholder="Προσθέστε τυχόν σημειώσεις..."
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-3 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors touch-target font-medium text-sm"
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center justify-center transition-colors touch-target font-medium text-sm"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2 flex-shrink-0" />
              )}
              {mode === 'add' ? 'Αποθήκευση' : 'Ενημέρωση'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}