import { ReactNode } from 'react'
import { X, ChevronLeft, ChevronRight, Save, AlertTriangle } from 'lucide-react'
import { useResponsive, useTouchDevice } from '../../hooks/useResponsive'

interface FormStep {
  id: string
  title: string
  icon: ReactNode
  content: ReactNode
}

interface ResponsiveFormLayoutProps {
  isOpen: boolean
  onClose: () => void
  title: string
  mode: 'add' | 'edit'
  steps?: FormStep[]
  children?: ReactNode
  onSubmit: () => void
  onCancel?: () => void
  isSubmitting?: boolean
  error?: string | null
  currentStep?: number
  onStepChange?: (step: number) => void
  submitText?: string
  cancelText?: string
}

export function ResponsiveFormLayout({
  isOpen,
  onClose,
  title,
  mode,
  steps,
  children,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = null,
  currentStep = 1,
  onStepChange,
  submitText = 'Αποθήκευση',
  cancelText = 'Ακύρωση'
}: ResponsiveFormLayoutProps) {
  const { isMobile, isTablet } = useResponsive()
  const { isTouchDevice } = useTouchDevice()

  const isMultiStep = steps && steps.length > 1
  const totalSteps = steps?.length || 1
  const currentStepData = steps?.[currentStep - 1]

  const handleNext = () => {
    if (onStepChange && currentStep < totalSteps) {
      onStepChange(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (onStepChange && currentStep > 1) {
      onStepChange(currentStep - 1)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container - Responsive sizing */}
      <div className={`
        relative w-full max-h-screen overflow-hidden
        ${isMobile
          ? 'responsive-modal h-full max-h-screen rounded-none'
          : 'responsive-modal-xl rounded-2xl shadow-2xl'
        }
        bg-slate-800/95 backdrop-blur-lg border border-slate-700/50
        animate-slide-up
      `}>
        {/* Header */}
        <div className="sticky top-0 z-20 bg-slate-800/95 backdrop-blur-lg border-b border-slate-700/50">
          <div className="flex items-center justify-between p-4 sm:p-6">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {isMobile && currentStep > 1 && onStepChange && (
                <button
                  onClick={handlePrev}
                  className="text-gray-400 hover:text-white touch-target-lg flex items-center justify-center rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <div className="min-w-0 flex-1">
                <h2 className="text-fluid-lg font-bold text-white truncate">
                  {isMultiStep && currentStepData ? currentStepData.title : title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  {mode === 'add' ? 'Προσθήκη νέου' : 'Επεξεργασία'}
                  {isMultiStep && (
                    <span className="ml-2">• Βήμα {currentStep} από {totalSteps}</span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white touch-target-lg flex items-center justify-center rounded-lg hover:bg-slate-700/50 transition-colors ml-4"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar for Multi-step */}
          {isMultiStep && (
            <div className="px-4 sm:px-6 pb-4">
              <div className="flex space-x-1 sm:space-x-2">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
                      index < currentStep
                        ? 'bg-blue-500'
                        : index === currentStep - 1
                        ? 'bg-blue-400'
                        : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-4 bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center">
            <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
            <span className="flex-1 text-sm">{error}</span>
          </div>
        )}

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto scroll-smooth-mobile">
            <div className="p-4 sm:p-6 space-y-6">
              {isMultiStep ? currentStepData?.content : children}
            </div>
          </div>

          {/* Footer Actions */}
          <div className={`
            sticky bottom-0 bg-slate-800/95 backdrop-blur-lg border-t border-slate-700/50
            p-4 sm:p-6 safe-bottom
            ${isMobile ? 'space-y-3' : 'flex justify-between items-center space-x-4'}
          `}>
            {/* Mobile: Stack buttons vertically */}
            {isMobile ? (
              <>
                {isMultiStep && currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-medium touch-target-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center"
                  >
                    <span>Επόμενο</span>
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-medium touch-target-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2" />
                        <span>Αποθήκευση...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        <span>{submitText}</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onCancel || onClose}
                  disabled={isSubmitting}
                  className="w-full bg-slate-700/70 hover:bg-slate-600/80 disabled:bg-slate-800 text-white py-4 rounded-xl font-medium touch-target-lg transition-all duration-200 border border-slate-600/50 active:scale-[0.98]"
                >
                  {cancelText}
                </button>
              </>
            ) : (
              /* Desktop: Horizontal layout */
              <>
                <div className="flex items-center space-x-4">
                  {isMultiStep && (
                    <div className="text-sm text-gray-400">
                      Βήμα {currentStep} από {totalSteps}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={onCancel || onClose}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-slate-700/70 hover:bg-slate-600/80 disabled:bg-slate-800 text-white rounded-xl font-medium transition-all duration-200 border border-slate-600/50 touch-target"
                  >
                    {cancelText}
                  </button>

                  {isMultiStep && currentStep < totalSteps ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl touch-target flex items-center"
                    >
                      <span>Επόμενο</span>
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl touch-target flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                          <span>Αποθήκευση...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          <span>{submitText}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// Reusable form field components
interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
  className?: string
}

export function FormField({ label, required, error, children, className = '' }: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <div className="flex items-center text-red-400 text-xs">
          <AlertTriangle className="w-3 h-3 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

interface ResponsiveInputProps {
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  autoComplete?: string
}

export function ResponsiveInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled,
  className = '',
  autoComplete
}: ResponsiveInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      autoComplete={autoComplete}
      className={`
        w-full bg-slate-700/70 border border-slate-600/50 text-white rounded-xl
        px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        focus:bg-slate-700 transition-all duration-200 placeholder:text-gray-400
        disabled:bg-slate-800 disabled:text-gray-500 disabled:cursor-not-allowed
        ${className}
      `}
    />
  )
}

interface ResponsiveSelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ResponsiveSelect({
  value,
  onChange,
  options,
  placeholder = 'Επιλέξτε...',
  disabled,
  className = ''
}: ResponsiveSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full bg-slate-700/70 border border-slate-600/50 text-white rounded-xl
          px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          focus:bg-slate-700 transition-all duration-200 appearance-none cursor-pointer
          disabled:bg-slate-800 disabled:text-gray-500 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-800 text-white">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

interface ResponsiveTextareaProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  rows?: number
}

export function ResponsiveTextarea({
  placeholder,
  value,
  onChange,
  disabled,
  className = '',
  rows = 3
}: ResponsiveTextareaProps) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={rows}
      className={`
        w-full bg-slate-700/70 border border-slate-600/50 text-white rounded-xl
        px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        focus:bg-slate-700 transition-all duration-200 placeholder:text-gray-400
        disabled:bg-slate-800 disabled:text-gray-500 disabled:cursor-not-allowed
        resize-y min-h-[80px]
        ${className}
      `}
    />
  )
}

interface FormSectionProps {
  title: string
  icon: ReactNode
  children: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  className?: string
}

export function FormSection({
  title,
  icon,
  children,
  collapsible = false,
  defaultExpanded = true,
  className = ''
}: FormSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className={`bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden ${className}`}>
      <div
        className={`p-4 sm:p-6 border-b border-slate-700/50 ${
          collapsible ? 'cursor-pointer hover:bg-slate-700/50 transition-colors' : ''
        }`}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          {collapsible && (
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
      </div>

      {(!collapsible || isExpanded) && (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {children}
        </div>
      )}
    </div>
  )
}