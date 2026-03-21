import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'
import { GlassButton } from './GlassButton'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface GlassModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'max-w-[480px]',
  md: 'max-w-[640px]',
  lg: 'max-w-[800px]',
  xl: 'max-w-[960px]',
}

export function GlassModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: GlassModalProps) {
  const modalRef = useFocusTrap(isOpen)

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full',
          sizeClasses[size],
          'glass-elevated rounded-2xl border border-white/[0.15]',
          'p-4 sm:p-6 shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200',
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between mb-4">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="font-display text-lg sm:text-xl font-bold text-kalkvit"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="text-sm text-kalkvit/60 mt-1"
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <GlassButton
                variant="ghost"
                onClick={onClose}
                className="p-2 -mr-2 -mt-2"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </GlassButton>
            )}
          </div>
        )}

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>,
    document.body
  )
}

// Convenience components for modal sections
export function GlassModalFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 flex-wrap mt-6 pt-4 border-t border-white/10',
        className
      )}
    >
      {children}
    </div>
  )
}
