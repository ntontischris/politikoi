import { useState, useEffect } from 'react'
import { RequestViewModal } from './RequestViewModal'
import { useRequestStore, type Request } from '../../stores/realtimeRequestStore'

// Global state management for RequestViewModal
let globalShowRequestModal = false
let globalEditingRequest: Request | null = null
let globalRequestViewCallbacks: {
  onEdit?: (request: Request) => void
  onClose?: () => void
} = {}

// Global functions to control the modal
export function showRequestViewModal(request: Request, callbacks?: { onEdit?: (request: Request) => void; onClose?: () => void }) {
  globalEditingRequest = request
  globalShowRequestModal = true
  globalRequestViewCallbacks = callbacks || {}
  
  // Dispatch a custom event to trigger re-render
  window.dispatchEvent(new CustomEvent('requestViewModalOpen'))
}

export function hideRequestViewModal() {
  globalShowRequestModal = false
  globalEditingRequest = null
  globalRequestViewCallbacks = {}
  
  // Dispatch a custom event to trigger re-render
  window.dispatchEvent(new CustomEvent('requestViewModalClose'))
}

export function RequestViewModalContainer() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null)

  useEffect(() => {
    const handleModalOpen = () => {
      setIsOpen(true)
      setCurrentRequest(globalEditingRequest)
    }

    const handleModalClose = () => {
      setIsOpen(false)
      setCurrentRequest(null)
    }

    window.addEventListener('requestViewModalOpen', handleModalOpen)
    window.addEventListener('requestViewModalClose', handleModalClose)

    return () => {
      window.removeEventListener('requestViewModalOpen', handleModalOpen)
      window.removeEventListener('requestViewModalClose', handleModalClose)
    }
  }, [])

  const handleClose = () => {
    hideRequestViewModal()
    globalRequestViewCallbacks.onClose?.()
  }

  const handleEdit = (request: Request) => {
    globalRequestViewCallbacks.onEdit?.(request)
  }

  return (
    <RequestViewModal
      request={currentRequest}
      isOpen={isOpen}
      onClose={handleClose}
      onEdit={handleEdit}
      zIndex={9999}
    />
  )
}
