import { useState, useEffect } from 'react'
import { X, Save, User, Phone, MapPin, FileText, Shield, Calendar, Users, ChevronDown, AlertTriangle, CheckCircle } from 'lucide-react'
import { useResponsive, useTouchDevice } from '../../hooks/useResponsive'

export interface CitizenFormData {
  // Required fields
  name: string
  surname: string
  // Optional fields
  recommendation: string
  patronymic: string
  phone: string
  landline: string
  email: string
  address: string
  postalCode: string
  municipality: string
  region: string
  electoralDistrict: string
  position: string
  contactCategory: string
  requestCategory: string
  addedDate: string
  assignedCollaborator: string
  status: string
  completionDate: string
  responsibleAuthority: string
  request: string
  observations: string
  comment: string
  notes: string
  // Military fields
  isMilitary: boolean
  militaryType: 'conscript' | 'career' | ''
  // Conscript fields
  militaryEsso: string
  militaryAsm: string
  militaryDesire: string
  militaryCenter: string
  militaryPresentationDate: string
  militaryPlacement: string
  militaryPlacementDate: string
  militaryRequestDate: string
  militaryTransferType: 'μετάθεση' | 'απόσπαση' | ''
  militaryTransferDate: string
  militaryObservations: string
  militaryRequestStatus: 'ολοκληρωμένο' | 'ενημερώθηκε' | 'εκκρεμές' | ''
  // Career officer fields
  militaryRank: string
  militaryRegistrationNumber: string
  militaryServiceUnit: string
  militaryCareerDesire: string
  militaryCareerRequestDate: string
}

interface CitizenFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CitizenFormData) => void
  initialData?: Partial<CitizenFormData>
  mode: 'add' | 'edit'
}

const initialFormData: CitizenFormData = {
  // Required fields
  name: '',
  surname: '',
  // Optional fields
  recommendation: '',
  patronymic: '',
  phone: '',
  landline: '',
  email: '',
  address: '',
  postalCode: '',
  municipality: '',
  region: '',
  electoralDistrict: '',
  position: '',
  contactCategory: '',
  requestCategory: '',
  addedDate: new Date().toISOString().split('T')[0],
  assignedCollaborator: '',
  status: 'ΕΚΚΡΕΜΗ',
  completionDate: '',
  responsibleAuthority: '',
  request: '',
  observations: '',
  comment: '',
  notes: '',
  // Military fields
  isMilitary: false,
  militaryType: '',
  // Conscript fields
  militaryEsso: '',
  militaryAsm: '',
  militaryDesire: '',
  militaryCenter: '',
  militaryPresentationDate: '',
  militaryPlacement: '',
  militaryPlacementDate: '',
  militaryRequestDate: '',
  militaryTransferType: '',
  militaryTransferDate: '',
  militaryObservations: '',
  militaryRequestStatus: '',
  // Career officer fields
  militaryRank: '',
  militaryRegistrationNumber: '',
  militaryServiceUnit: '',
  militaryCareerDesire: '',
  militaryCareerRequestDate: ''
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

const regions = [
  'ΘΕΣΣΑΛΟΝΙΚΗ',
  'ΧΑΛΚΙΔΙΚΗ',
  'ΠΙΕΡΙΑ',
  'ΗΜΑΘΙΑ',
  'ΠΕΛΛΑ',
  'ΚΙΛΚΙΣ',
  'ΣΕΡΡΕΣ',
  'ΑΛΛΟ'
]

const electoralDistricts = [
  'Α ΘΕΣΣΑΛΟΝΙΚΗΣ',
  'Β ΘΕΣΣΑΛΟΝΙΚΗΣ'
]

const contactCategories = [
  'ΤΗΛΕΦΩΝΙΚΗ',
  'EMAIL',
  'ΠΡΟΣΩΠΙΚΗ',
  'SMS',
  'ΓΕΝΙΚΗ'
]

const requestCategories = [
  'GDPR',
  'GDPR + ΑΙΤΗΜΑ',
  'ΑΙΤΗΜΑ',
  'ΑΛΛΟ'
]

const staffMembers = [
  'ΚΕΦΑΛΑ',
  'ΣΦΑΚΙΑΝΑΚΗΣ',
  'ΚΑΛΑΙΤΖΙΔΟΥ',
  'ΞΙΟΥΦΗΣ',
  'ΣΑΜΑΡΑΣ',
  'ΑΡΒΑΝΙΤΙΔΟΥ',
  'ΓΚΟΛΙΔΑΚΗΣ'
]

const statusOptions = [
  'ΕΚΚΡΕΜΗ',
  'ΟΛΟΚΛΗΡΩΜΕΝΑ',
  'ΜΗ ΟΛΟΚΛΗΡΩΜΕΝΑ'
]

const militaryRanks = [
  'Αρχ/γός',
  'Υπαρχ/γός',
  'Ανθυπασπιστής',
  'Ανθυπολοχαγός',
  'Επιλοχίας',
  'Λοχίας',
  'Δεκανέας',
  'Στρατιώτης'
]

const militaryRequestStatusOptions = [
  'ολοκληρωμένο',
  'ενημερώθηκε',
  'εκκρεμές'
]

const militaryTransferTypes = [
  'μετάθεση',
  'απόσπαση'
]

export function CitizenForm({ isOpen, onClose, onSubmit, initialData, mode }: CitizenFormProps) {
  // Responsive hooks
  const { isMobile, isTablet } = useResponsive()
  const { isTouchDevice } = useTouchDevice()

  // Enhanced state management
  const [formData, setFormData] = useState<CitizenFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<CitizenFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [totalSteps] = useState(isMobile ? 4 : 1) // Multi-step on mobile
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    contact: !isMobile,
    request: !isMobile,
    military: !isMobile
  })

  // Update form data when initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData && mode === 'edit') {
        // For edit mode, populate with existing data
        setFormData({
          // Required fields
          name: initialData.name || '',
          surname: initialData.surname || '',
          // Optional fields
          recommendation: initialData.recommendation || '',
          patronymic: initialData.patronymic || '',
          phone: initialData.phone || '',
          landline: initialData.landline || '',
          email: initialData.email || '',
          address: initialData.address || '',
          postalCode: initialData.postalCode || '',
          municipality: initialData.municipality || '',
          region: initialData.region || '',
          electoralDistrict: initialData.electoralDistrict || '',
          position: initialData.position || '',
          contactCategory: initialData.contactCategory || '',
          requestCategory: initialData.requestCategory || '',
          addedDate: initialData.addedDate || new Date().toISOString().split('T')[0],
          assignedCollaborator: initialData.assignedCollaborator || '',
          status: initialData.status || '',
          completionDate: initialData.completionDate || '',
          responsibleAuthority: initialData.responsibleAuthority || '',
          request: initialData.request || '',
          observations: initialData.observations || '',
          comment: initialData.comment || '',
          notes: initialData.notes || '',
          // Military fields
          isMilitary: (initialData as any)?.isMilitary || false,
          militaryType: (initialData as any)?.militaryType || '',
          // Conscript fields
          militaryEsso: (initialData as any)?.militaryEsso || '',
          militaryAsm: (initialData as any)?.militaryAsm || '',
          militaryDesire: (initialData as any)?.militaryDesire || '',
          militaryCenter: (initialData as any)?.militaryCenter || '',
          militaryPresentationDate: (initialData as any)?.militaryPresentationDate || '',
          militaryPlacement: (initialData as any)?.militaryPlacement || '',
          militaryPlacementDate: (initialData as any)?.militaryPlacementDate || '',
          militaryRequestDate: (initialData as any)?.militaryRequestDate || '',
          militaryTransferType: (initialData as any)?.militaryTransferType || '',
          militaryTransferDate: (initialData as any)?.militaryTransferDate || '',
          militaryObservations: (initialData as any)?.militaryObservations || '',
          militaryRequestStatus: (initialData as any)?.militaryRequestStatus || '',
          // Career officer fields
          militaryRank: (initialData as any)?.militaryRank || '',
          militaryRegistrationNumber: (initialData as any)?.militaryRegistrationNumber || '',
          militaryServiceUnit: (initialData as any)?.militaryServiceUnit || '',
          militaryCareerDesire: (initialData as any)?.militaryCareerDesire || '',
          militaryCareerRequestDate: (initialData as any)?.militaryCareerRequestDate || ''
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

    // Required fields validation - only name and surname
    if (!formData.name.trim()) {
      newErrors.name = 'Το όνομα είναι υποχρεωτικό'
    }
    if (!formData.surname.trim()) {
      newErrors.surname = 'Το επώνυμο είναι υποχρεωτικό'
    }

    // Military validation
    if (formData.isMilitary) {
      if (!formData.militaryType) {
        newErrors.militaryType = 'Επιλέξτε τύπο στρατιωτικού' as any
      }

      // Conscript required fields
      if (formData.militaryType === 'conscript') {
        if (!formData.militaryEsso.trim()) {
          newErrors.militaryEsso = 'Το ΕΣΣΟ είναι υποχρεωτικό' as any
        }
        if (!formData.militaryAsm.trim()) {
          newErrors.militaryAsm = 'Το ΑΣΜ είναι υποχρεωτικό' as any
        }
      }

      // Career officer required fields
      if (formData.militaryType === 'career') {
        if (!formData.militaryRank) {
          newErrors.militaryRank = 'Ο βαθμός είναι υποχρεωτικός' as any
        }
        if (!formData.militaryRegistrationNumber.trim()) {
          newErrors.militaryRegistrationNumber = 'Ο αριθμός μητρώου είναι υποχρεωτικός' as any
        }
        if (!formData.militaryServiceUnit.trim()) {
          newErrors.militaryServiceUnit = 'Η μονάδα υπηρεσίας είναι υποχρεωτική' as any
        }
      }
    }

    // Optional field validations - only validate format if filled
    if (formData.phone && !/^(69|68)\d{8}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Εισάγετε έγκυρο ελληνικό κινητό τηλέφωνο (πχ. 6912345678)'
    }
    if (formData.landline && !/^(21[0-9]|22[0-9]|23[1-9]|24[1-9]|25[0-9]|26[1-9]|27[0-9]|28[1-9])\d{7}$/.test(formData.landline.replace(/[\s-]/g, ''))) {
      newErrors.landline = 'Εισάγετε έγκυρο ελληνικό σταθερό τηλέφωνο (πχ. 2310123456)'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Εισάγετε έγκυρο email'
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

    // Handle request category changes
    if (field === 'requestCategory') {
      if (value === 'GDPR + ΑΙΤΗΜΑ' || value === 'ΑΙΤΗΜΑ') {
        setShowRequestForm(true)
      } else {
        setShowRequestForm(false)
      }
    }

    // Handle military type changes
    if (field === 'isMilitary') {
      const isMilitaryValue = value === 'true'
      setFormData(prev => ({
        ...prev,
        isMilitary: isMilitaryValue,
        militaryType: isMilitaryValue ? prev.militaryType : ''
      }))
      return
    }

    if (field === 'militaryType') {
      // Reset military-specific fields when changing type
      setFormData(prev => ({
        ...prev,
        militaryType: value as 'conscript' | 'career' | '',
        // Reset conscript fields
        militaryEsso: '',
        militaryAsm: '',
        militaryDesire: '',
        militaryCenter: '',
        militaryPresentationDate: '',
        militaryPlacement: '',
        militaryPlacementDate: '',
        militaryRequestDate: '',
        militaryTransferType: '',
        militaryTransferDate: '',
        militaryObservations: '',
        militaryRequestStatus: '',
        // Reset career fields
        militaryRank: '',
        militaryRegistrationNumber: '',
        militaryServiceUnit: '',
        militaryCareerDesire: '',
        militaryCareerRequestDate: ''
      }))
      return
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

            {/* Required Fields */}
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

            {/* Optional Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Σύσταση
              </label>
              <input
                type="text"
                value={formData.recommendation}
                onChange={(e) => handleInputChange('recommendation', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                placeholder="Εισάγετε σύσταση"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Πατρώνυμο
              </label>
              <input
                type="text"
                value={formData.patronymic}
                onChange={(e) => handleInputChange('patronymic', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                placeholder="Εισάγετε πατρώνυμο"
              />
            </div>

            {/* Military/Civilian Selection */}
            <div className="sm:col-span-2 lg:col-span-3 mt-4 sm:mt-6">
              <div className="flex items-center mb-4">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-medium text-white">Κατηγορία Προσώπου</h3>
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Τύπος Προσώπου
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center p-4 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors">
                  <input
                    type="radio"
                    name="isMilitary"
                    value="false"
                    checked={!formData.isMilitary}
                    onChange={(e) => handleInputChange('isMilitary', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    !formData.isMilitary ? 'border-blue-500 bg-blue-500' : 'border-slate-400'
                  }`}>
                    {!formData.isMilitary && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                  <span className="text-white">Πολίτης</span>
                </label>
                <label className="flex items-center p-4 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors">
                  <input
                    type="radio"
                    name="isMilitary"
                    value="true"
                    checked={formData.isMilitary}
                    onChange={(e) => handleInputChange('isMilitary', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    formData.isMilitary ? 'border-blue-500 bg-blue-500' : 'border-slate-400'
                  }`}>
                    {formData.isMilitary && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                  <span className="text-white">Στρατιωτικός</span>
                </label>
              </div>
            </div>

            {/* Military Type Selection */}
            {formData.isMilitary && (
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  Τύπος Στρατιωτικού
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center p-4 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors">
                    <input
                      type="radio"
                      name="militaryType"
                      value="conscript"
                      checked={formData.militaryType === 'conscript'}
                      onChange={(e) => handleInputChange('militaryType', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      formData.militaryType === 'conscript' ? 'border-blue-500 bg-blue-500' : 'border-slate-400'
                    }`}>
                      {formData.militaryType === 'conscript' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                    <span className="text-white">Στρατιώτης</span>
                  </label>
                  <label className="flex items-center p-4 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors">
                    <input
                      type="radio"
                      name="militaryType"
                      value="career"
                      checked={formData.militaryType === 'career'}
                      onChange={(e) => handleInputChange('militaryType', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      formData.militaryType === 'career' ? 'border-blue-500 bg-blue-500' : 'border-slate-400'
                    }`}>
                      {formData.militaryType === 'career' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                    <span className="text-white">Μόνιμος</span>
                  </label>
                </div>
              </div>
            )}

            {/* Conscript Fields */}
            {formData.isMilitary && formData.militaryType === 'conscript' && (
              <>
                <div className="sm:col-span-2 lg:col-span-3 mt-4 sm:mt-6">
                  <div className="flex items-center mb-4">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mr-2 flex-shrink-0" />
                    <h3 className="text-base sm:text-lg font-medium text-white">Στοιχεία Στρατιώτη</h3>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ΕΣΣΟ *
                  </label>
                  <input
                    type="text"
                    value={formData.militaryEsso}
                    onChange={(e) => handleInputChange('militaryEsso', e.target.value)}
                    className={`w-full bg-slate-700 border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target ${
                      (errors as any).militaryEsso ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="Εισάγετε ΕΣΣΟ"
                  />
                  {(errors as any).militaryEsso && (
                    <p className="mt-1 text-sm text-red-400">{(errors as any).militaryEsso}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ΑΣΜ *
                  </label>
                  <input
                    type="text"
                    value={formData.militaryAsm}
                    onChange={(e) => handleInputChange('militaryAsm', e.target.value)}
                    className={`w-full bg-slate-700 border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target ${
                      (errors as any).militaryAsm ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="Εισάγετε ΑΣΜ"
                  />
                  {(errors as any).militaryAsm && (
                    <p className="mt-1 text-sm text-red-400">{(errors as any).militaryAsm}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Επιθυμία
                  </label>
                  <input
                    type="text"
                    value={formData.militaryDesire}
                    onChange={(e) => handleInputChange('militaryDesire', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                    placeholder="Εισάγετε επιθυμία"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Κέντρο
                  </label>
                  <input
                    type="text"
                    value={formData.militaryCenter}
                    onChange={(e) => handleInputChange('militaryCenter', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                    placeholder="Εισάγετε κέντρο"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ημερομηνία Παρουσίασης
                  </label>
                  <input
                    type="date"
                    value={formData.militaryPresentationDate}
                    onChange={(e) => handleInputChange('militaryPresentationDate', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Τοποθέτηση
                  </label>
                  <input
                    type="text"
                    value={formData.militaryPlacement}
                    onChange={(e) => handleInputChange('militaryPlacement', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                    placeholder="Εισάγετε τοποθέτηση"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ημερομηνία Τοποθέτησης
                  </label>
                  <input
                    type="date"
                    value={formData.militaryPlacementDate}
                    onChange={(e) => handleInputChange('militaryPlacementDate', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ημερομηνία Αποστολής
                  </label>
                  <input
                    type="date"
                    value={formData.militaryRequestDate}
                    onChange={(e) => handleInputChange('militaryRequestDate', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Τύπος Μετακίνησης
                  </label>
                  <select
                    value={formData.militaryTransferType}
                    onChange={(e) => handleInputChange('militaryTransferType', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                  >
                    <option value="">Επιλέξτε τύπο</option>
                    {militaryTransferTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ημερομηνία Μετάθεσης/Απόσπασης
                  </label>
                  <input
                    type="date"
                    value={formData.militaryTransferDate}
                    onChange={(e) => handleInputChange('militaryTransferDate', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Κατάσταση Αιτήματος
                  </label>
                  <select
                    value={formData.militaryRequestStatus}
                    onChange={(e) => handleInputChange('militaryRequestStatus', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                  >
                    <option value="">Επιλέξτε κατάσταση</option>
                    {militaryRequestStatusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Παρατηρήσεις Στρατιώτη
                  </label>
                  <textarea
                    value={formData.militaryObservations}
                    onChange={(e) => handleInputChange('militaryObservations', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target resize-none"
                    placeholder="Προσθέστε παρατηρήσεις..."
                  />
                </div>
              </>
            )}

            {/* Career Officer Fields */}
            {formData.isMilitary && formData.militaryType === 'career' && (
              <>
                <div className="sm:col-span-2 lg:col-span-3 mt-4 sm:mt-6">
                  <div className="flex items-center mb-4">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mr-2 flex-shrink-0" />
                    <h3 className="text-base sm:text-lg font-medium text-white">Στοιχεία Μονίμου</h3>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Βαθμός *
                  </label>
                  <select
                    value={formData.militaryRank}
                    onChange={(e) => handleInputChange('militaryRank', e.target.value)}
                    className={`w-full bg-slate-700 border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target ${
                      (errors as any).militaryRank ? 'border-red-500' : 'border-slate-600'
                    }`}
                  >
                    <option value="">Επιλέξτε βαθμό</option>
                    {militaryRanks.map(rank => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </select>
                  {(errors as any).militaryRank && (
                    <p className="mt-1 text-sm text-red-400">{(errors as any).militaryRank}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Αριθμός Μητρώου *
                  </label>
                  <input
                    type="text"
                    value={formData.militaryRegistrationNumber}
                    onChange={(e) => handleInputChange('militaryRegistrationNumber', e.target.value)}
                    className={`w-full bg-slate-700 border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target ${
                      (errors as any).militaryRegistrationNumber ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="Εισάγετε αριθμό μητρώου"
                  />
                  {(errors as any).militaryRegistrationNumber && (
                    <p className="mt-1 text-sm text-red-400">{(errors as any).militaryRegistrationNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Μονάδα Υπηρεσίας *
                  </label>
                  <input
                    type="text"
                    value={formData.militaryServiceUnit}
                    onChange={(e) => handleInputChange('militaryServiceUnit', e.target.value)}
                    className={`w-full bg-slate-700 border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target ${
                      (errors as any).militaryServiceUnit ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="Εισάγετε μονάδα υπηρεσίας"
                  />
                  {(errors as any).militaryServiceUnit && (
                    <p className="mt-1 text-sm text-red-400">{(errors as any).militaryServiceUnit}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Επιθυμία
                  </label>
                  <input
                    type="text"
                    value={formData.militaryCareerDesire}
                    onChange={(e) => handleInputChange('militaryCareerDesire', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                    placeholder="Εισάγετε επιθυμία"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ημερομηνία Αποστολής
                  </label>
                  <input
                    type="date"
                    value={formData.militaryCareerRequestDate}
                    onChange={(e) => handleInputChange('militaryCareerRequestDate', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                  />
                </div>
              </>
            )}

            {/* Contact Information */}
            <div className="sm:col-span-2 lg:col-span-3 mt-4 sm:mt-6">
              <div className="flex items-center mb-4">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-medium text-white">Στοιχεία Επικοινωνίας</h3>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Κινητό
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
                Σταθερό
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
                Τ.Κ.
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
                Δήμο
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
                Περιοχή
              </label>
              <select
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
              >
                <option value="">Επιλέξτε περιοχή</option>
                {regions.map(region => (
                  <option key={region} value={region}>
                    {region}
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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ιδιότητα
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                placeholder="Εισάγετε ιδιότητα"
              />
            </div>

            {/* Category and Request Section */}
            <div className="sm:col-span-2 lg:col-span-3 mt-4 sm:mt-6">
              <div className="flex items-center mb-4">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-medium text-white">Κατηγορίες & Αιτήματα</h3>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Κατηγορία Επαφής
              </label>
              <select
                value={formData.contactCategory}
                onChange={(e) => handleInputChange('contactCategory', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
              >
                <option value="">Επιλέξτε κατηγορία επαφής</option>
                {contactCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Κατηγορία Αιτήματος
              </label>
              <select
                value={formData.requestCategory}
                onChange={(e) => handleInputChange('requestCategory', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
              >
                <option value="">Επιλέξτε κατηγορία αιτήματος</option>
                {requestCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ημερομηνία Προσθήκης
              </label>
              <input
                type="date"
                value={formData.addedDate}
                onChange={(e) => handleInputChange('addedDate', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Αρμόδιος Συνεργάτης
              </label>
              <select
                value={formData.assignedCollaborator}
                onChange={(e) => handleInputChange('assignedCollaborator', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
              >
                <option value="">Επιλέξτε συνεργάτη</option>
                {staffMembers.map(member => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Κατάσταση
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
              >
                <option value="">Επιλέξτε κατάσταση</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ημερομηνία Ολοκλήρωσης
              </label>
              <input
                type="date"
                value={formData.completionDate}
                onChange={(e) => handleInputChange('completionDate', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Αρμόδιος Φορέας
              </label>
              <input
                type="text"
                value={formData.responsibleAuthority}
                onChange={(e) => handleInputChange('responsibleAuthority', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                placeholder="Εισάγετε αρμόδιο φορέα"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Αίτημα
              </label>
              <textarea
                value={formData.request}
                onChange={(e) => handleInputChange('request', e.target.value)}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target resize-none"
                placeholder="Περιγράψτε το αίτημα..."
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Παρατηρήσεις
              </label>
              <textarea
                value={formData.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target resize-none"
                placeholder="Προσθέστε παρατηρήσεις..."
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Σχόλιο
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => handleInputChange('comment', e.target.value)}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target resize-none"
                placeholder="Προσθέστε σχόλιο..."
              />
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

          {/* Conditional Request Form */}
          {showRequestForm && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                  <FileText className="h-5 w-5 text-blue-400 mr-2" />
                  Φόρμα Αιτήματος
                </h4>
                <p className="text-blue-300 text-sm">
                  Η φόρμα αιτήματος θα ανοίξει μετά την αποθήκευση του πολίτη για να προσθέσετε το σχετικό αίτημα.
                </p>
              </div>
            </div>
          )}

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