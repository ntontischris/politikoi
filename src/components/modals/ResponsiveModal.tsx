import { ReactNode, useEffect, useRef } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { useResponsive, useTouchDevice } from '../../hooks/useResponsive'

export interface ResponsiveModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children: ReactNode
  actions?: ReactNode
  headerActions?: ReactNode
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  preventScrolling?: boolean
  className?: string
  bottomSheet?: boolean // Use bottom sheet pattern on mobile
  swipeToClose?: boolean // Enable swipe to close on mobile
  zIndex?: number
}

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  children,
  actions,
  headerActions,
  showCloseButton = true,
  closeOnBackdrop = true,
  preventScrolling = true,
  className = '',
  bottomSheet = false,
  swipeToClose = true,
  zIndex = 50
}: ResponsiveModalProps) {
  const { isMobile, isTablet } = useResponsive()
  const { isTouchDevice } = useTouchDevice()
  const modalRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const isDragging = useRef<boolean>(false)

  // Handle body scroll prevention
  useEffect(() => {
    if (isOpen && preventScrolling) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, preventScrolling])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Handle touch gestures for swipe to close
  useEffect(() => {
    if (!isTouchDevice || !swipeToClose || !isOpen) return

    const handleTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY
      isDragging.current = true
      currentY.current = startY.current
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return

      currentY.current = e.touches[0].clientY
      const deltaY = currentY.current - startY.current

      // Only allow downward swipes
      if (deltaY > 0 && contentRef.current) {
        const opacity = Math.max(0.3, 1 - deltaY / 300)
        const transform = Math.min(deltaY, 100)

        contentRef.current.style.transform = `translateY(${transform}px)`
        contentRef.current.style.opacity = opacity.toString()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging.current) return

      const deltaY = currentY.current - startY.current
      isDragging.current = false

      if (contentRef.current) {
        if (deltaY > 100) {
          // Close modal if swiped down enough
          onClose()
        } else {
          // Snap back to original position
          contentRef.current.style.transform = 'translateY(0)'
          contentRef.current.style.opacity = '1'
        }
      }
    }

    const modalElement = modalRef.current
    if (modalElement && (isMobile || bottomSheet)) {
      modalElement.addEventListener('touchstart', handleTouchStart, { passive: true })
      modalElement.addEventListener('touchmove', handleTouchMove, { passive: true })
      modalElement.addEventListener('touchend', handleTouchEnd, { passive: true })

      return () => {
        modalElement.removeEventListener('touchstart', handleTouchStart)
        modalElement.removeEventListener('touchmove', handleTouchMove)
        modalElement.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isTouchDevice, swipeToClose, isOpen, onClose, isMobile, bottomSheet])

  if (!isOpen) return null

  const getSizeClasses = () => {
    if (isMobile) {
      return bottomSheet
        ? 'responsive-modal h-screen max-h-screen rounded-t-3xl rounded-b-none'
        : 'responsive-modal h-full max-h-full rounded-none'
    }

    switch (size) {
      case 'sm':
        return 'responsive-modal'
      case 'md':
        return 'responsive-modal-lg'
      case 'lg':
        return 'responsive-modal-xl'
      case 'xl':
        return 'w-full max-w-7xl max-h-[90vh] rounded-2xl'
      case 'full':
        return 'w-full h-full max-w-none max-h-none rounded-none'
      default:
        return 'responsive-modal-lg'
    }
  }

  const getContainerClasses = () => {
    if (isMobile && bottomSheet) {
      return 'fixed inset-0 flex items-end'
    }
    return 'fixed inset-0 flex items-center justify-center p-4 sm:p-6'
  }

  return (
    <div
      ref={modalRef}
      className={getContainerClasses()}
      style={{ zIndex }}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isMobile && bottomSheet
            ? 'bg-black/60 backdrop-blur-sm'
            : 'bg-black/60 backdrop-blur-sm'
        }`}
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Modal Content */}
      <div
        ref={contentRef}
        className={`
          relative bg-slate-800/95 backdrop-blur-lg border border-slate-700/50
          shadow-2xl transition-all duration-300 overflow-hidden
          ${getSizeClasses()}
          ${isMobile && bottomSheet ? 'animate-slide-up' : 'animate-fade-in'}
          ${className}
        `}
      >
        {/* Swipe Indicator for Bottom Sheet */}
        {isMobile && bottomSheet && swipeToClose && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-slate-600 rounded-full"></div>
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 z-20 bg-slate-800/95 backdrop-blur-lg border-b border-slate-700/50">
          <div className="flex items-center justify-between p-4 sm:p-6">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {icon && (
                <div className="p-2 bg-blue-500/20 rounded-xl flex-shrink-0">
                  {icon}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h2 className="text-fluid-lg font-bold text-white truncate">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-fluid-sm text-gray-400 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {headerActions}

              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white touch-target-lg flex items-center justify-center rounded-lg hover:bg-slate-700/50 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`
          flex-1 overflow-y-auto scroll-smooth-mobile
          ${isMobile && bottomSheet ? 'max-h-[80vh]' : 'max-h-full'}
        `}>
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>

        {/* Actions Footer */}
        {actions && (
          <div className="sticky bottom-0 bg-slate-800/95 backdrop-blur-lg border-t border-slate-700/50 p-4 sm:p-6 safe-bottom">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

// Specialized modal variants
export function MobileFullscreenModal(props: ResponsiveModalProps) {
  const { isMobile } = useResponsive()

  return (
    <ResponsiveModal
      {...props}
      size={isMobile ? 'full' : props.size || 'lg'}
      bottomSheet={false}
    />
  )
}

export function BottomSheetModal(props: ResponsiveModalProps) {
  const { isMobile } = useResponsive()

  return (
    <ResponsiveModal
      {...props}
      bottomSheet={true}
      swipeToClose={isMobile}
    />
  )
}

// Modal action components
interface ModalActionsProps {
  children: ReactNode
  layout?: 'horizontal' | 'vertical' | 'auto'
  className?: string
}

export function ModalActions({
  children,
  layout = 'auto',
  className = ''
}: ModalActionsProps) {
  const { isMobile } = useResponsive()

  const getLayoutClass = () => {
    if (layout === 'auto') {
      return isMobile ? 'flex flex-col space-y-3' : 'flex justify-end space-x-3'
    }
    return layout === 'vertical'
      ? 'flex flex-col space-y-3'
      : 'flex justify-end space-x-3'
  }

  return (
    <div className={`${getLayoutClass()} ${className}`}>
      {children}
    </div>
  )
}

interface ModalButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function ModalButton({
  variant = 'secondary',
  size = 'md',
  fullWidth,
  children,
  onClick,
  disabled,
  loading,
  className = ''
}: ModalButtonProps) {
  const { isMobile } = useResponsive()

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
      case 'danger':
        return 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl'
      default:
        return 'bg-slate-700/70 hover:bg-slate-600/80 text-white border border-slate-600/50'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 text-sm'
      case 'lg':
        return 'px-8 py-4 text-base'
      default:
        return 'px-6 py-3 text-sm'
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth || isMobile ? 'w-full' : ''}
        ${isMobile ? 'touch-target-lg' : 'touch-target'}
        font-medium rounded-xl transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98] flex items-center justify-center
        ${className}
      `}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
      )}
      {children}
    </button>
  )
}

// Confirmation modal
interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Επιβεβαίωση',
  cancelText = 'Ακύρωση',
  variant = 'info',
  loading = false
}: ConfirmationModalProps) {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <div className="text-red-400">⚠️</div>
      case 'warning':
        return <div className="text-yellow-400">⚠️</div>
      default:
        return <div className="text-blue-400">ℹ️</div>
    }
  }

  const getButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger'
      case 'warning':
        return 'danger'
      default:
        return 'primary'
    }
  }

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={getIcon()}
      size="sm"
      closeOnBackdrop={!loading}
      actions={
        <ModalActions>
          <ModalButton
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </ModalButton>
          <ModalButton
            variant={getButtonVariant()}
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmText}
          </ModalButton>
        </ModalActions>
      }
    >
      <div className="text-gray-300 text-fluid-sm leading-relaxed">
        {message}
      </div>
    </ResponsiveModal>
  )
}